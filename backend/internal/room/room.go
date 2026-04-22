// Package room manages game rooms and their lifecycle.
package room

import (
	"encoding/json"
	"log"
)

// Sender is implemented by ws.Client — defined here to avoid an import cycle.
type Sender interface {
	Send(msg []byte)
	PlayerID() string
}

func (r *Room) AddPlayer(p *Player) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.Players[p.ID] = p
}

func (r *Room) GetPlayer(playerID string) (*Player, bool) {
	r.mu.RLock()
	p, ok := r.Players[playerID]
	r.mu.RUnlock()
	return p, ok
}

func (r *Room) AddClient(s Sender) {
	r.mu.Lock()
	r.Clients[s.PlayerID()] = s
	r.mu.Unlock()
}

// RemoveClient and RemovePlayer must be used together to fully
// remove a player from a "Room"

func (r *Room) RemoveClient(playerID string) {
	r.mu.Lock()
	delete(r.Clients, playerID)
	r.mu.Unlock()
}

// RemoveClientIfSame removes the client only when it is still the registered sender for that
// playerID. This prevents a stale ReadPump teardown from evicting a newer client that has
// already replaced the old one in the Clients map (e.g. React StrictMode double-mount).
func (r *Room) RemoveClientIfSame(s Sender) {
	r.mu.Lock()
	if existing, ok := r.Clients[s.PlayerID()]; ok && existing == s {
		delete(r.Clients, s.PlayerID())
	}
	r.mu.Unlock()
}

func (r *Room) RemovePlayer(playerID string) {
	// Capture display info before deleting so we can include it in logs.
	r.mu.RLock()
	p, hadPlayer := r.Players[playerID]
	_, hadClient := r.Clients[playerID]
	r.mu.RUnlock()

	username, displayName := "", ""
	if hadPlayer {
		username, displayName = p.Username, p.DisplayName
	}
	log.Printf("[room] RemovePlayer — player %s (%s / %s) from room %s (hadPlayer=%v, hadClient=%v)",
		playerID, username, displayName, r.ID, hadPlayer, hadClient)

	r.mu.Lock()
	delete(r.Players, playerID)
	delete(r.Clients, playerID)
	r.mu.Unlock()

	log.Printf("[room] RemovePlayer — player %s (%s / %s) evicted from Players+Clients maps", playerID, username, displayName)

	r.BroadcastEvent(EventPlayerLeft, playerLeftPayload{
		PlayerID: playerID,
	})
	r.BroadcastPlayerList()

	// Game impact
	if r.Status == StatusInProgress {
		r.handlePlayerLeaveInGame(playerID)
	}

	empty := len(r.Players) == 0
	roomID := r.ID

	if empty {
		log.Printf("[room] room %s is empty, removing", roomID)
		r.manager.RemoveRoom(roomID)
		return
	}
}

func (r *Room) Broadcast(msg []byte) {
	r.mu.RLock()
	clients := make([]Sender, 0, len(r.Clients))
	for _, c := range r.Clients {
		clients = append(clients, c)
	}
	r.mu.RUnlock()

	for _, c := range clients {
		c.Send(msg)
	}
}

func (r *Room) IsFull() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.Players) >= r.MaxPlayers
}

func (r *Room) isInProgress() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.Status == StatusInProgress
}

func (r *Room) BroadcastEvent(eventType EventType, payload any) {
	b, err := json.Marshal(outgoingMessage{Type: string(eventType), Payload: payload})
	if err != nil {
		log.Printf("BroadcastEvent marshal error: %v", err)
		return
	}
	r.Broadcast(b)
}

func (r *Room) BroadcastExceptSender(senderID string, msg []byte) {
	r.mu.RLock()
	clients := make([]Sender, 0, len(r.Clients))
	for _, c := range r.Clients {
		if c.PlayerID() != senderID {
			clients = append(clients, c)
		}
	}
	r.mu.RUnlock()

	for _, c := range clients {
		c.Send(msg)
	}
}

func (r *Room) sendError(playerID, code string) {
	r.mu.RLock()
	client, ok := r.Clients[playerID]
	r.mu.RUnlock()

	if !ok {
		return
	}

	b, _ := json.Marshal(outgoingMessage{
		Type:    string(EventError),
		Payload: errorPayload{Code: code},
	})

	client.Send(b)
}

func (r *Room) BroadcastPlayerList() {
	r.mu.RLock()
	players := make([]playerView, 0, len(r.Players))
	for _, p := range r.Players {
		_, connected := r.Clients[p.ID]
		players = append(players, playerView{ID: p.ID, Username: p.Username, DisplayName: p.DisplayName, Role: p.Role, Connected: connected})
	}
	r.mu.RUnlock()

	b, err := json.Marshal(outgoingMessage{
		Type:    string(EventPlayerList),
		Payload: playerListPayload{Players: players},
	})
	if err != nil {
		log.Println("BroadcastPlayerList marshal error:", err)
		return
	}

	r.Broadcast(b)
}

func (r *Room) Run() {
	for event := range r.Events {
		switch event.Type {
		case EventPlayerLeave:
			if r.Game.RoundLive {
				r.sendError(event.PlayerID, ErrCannotLeaveMidRound)
				return
			}

			if _, ok := r.GetPlayer(event.PlayerID); ok {
				r.RemovePlayer(event.PlayerID)
			}
		case EventPlayerDisconnect:
			r.handlePlayerDisconnect(event)
		case EventGameStart:
			r.handleGameStart(event)
		case EventChatMessage:
			r.handleChatMessage(event)
		case EventGuessSubmit:
			r.handlePlayerGuess(event)
		case EventRoundTick:
			seconds, _ := event.Payload.(int)
			r.BroadcastEvent(EventRoundTick, roundTickPayload{SecondsRemaining: seconds})
		case EventRoundTimeout:
			if r.Status == StatusInProgress && !r.Game.RoundEnding {
				r.advanceDrawer(r.Game.CurrentWord, r.Game.Scores)
			}
		case EventRoundEnding:
			payload := event.Payload.(roundEndingPayload)
			r.BroadcastEvent(EventRoundEnding, payload)
		case EventRoundEndingDone:
			capturedRound := event.Payload.(int)
			if r.Status == StatusInProgress && r.Game.CurrentRound == capturedRound {
				r.advanceDrawer(r.Game.CurrentWord, r.Game.Scores)
			}
		case EventDrawStroke:
			r.handleDrawStroke(event)
		case EventDrawClear:
			r.handleDrawClear(event)
		}
	}
}
