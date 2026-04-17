// Package room manages game rooms and their lifecycle.
package room

import (
	"encoding/json"
	"log"
	"time"
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
			if _, ok := r.GetPlayer(event.PlayerID); ok {
				r.RemovePlayer(event.PlayerID)
			}

		case EventPlayerDisconnect:
			// Give the player a short window to reconnect (handles React StrictMode
			// double-mount, brief network hiccups, etc.). If they haven't reconnected
			// after the grace period, remove them.
			playerID := event.PlayerID
			log.Printf("[room] EventPlayerDisconnect — player %s disconnected, starting 5s grace period", playerID)
			go func() {
				time.Sleep(5 * time.Second)
				r.mu.RLock()
				_, reconnected := r.Clients[playerID]
				r.mu.RUnlock()
				if reconnected {
					log.Printf("[room] grace period elapsed — player %s reconnected, skipping removal", playerID)
					return
				}
				log.Printf("[room] grace period elapsed — player %s did not reconnect, removing", playerID)
				if _, ok := r.GetPlayer(playerID); ok {
					r.RemovePlayer(playerID)
				}
			}()
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
