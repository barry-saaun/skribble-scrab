// Package room
package room

// `room.go` handles room lifecyle & connection management

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
)

// handleTransferHost processes Mode B host transfers where the current host
// deliberately picks their successor.
func (r *Room) handleTransferHost(event Event) {
	// Only the current host can initiate a transfer
	if event.PlayerID != r.HostID {
		r.sendError(event.PlayerID, ErrNotHost)
		return
	}

	// Not allowing mid-game transfers - host role is a lobby concern
	if r.Status == StatusInProgress {
		r.sendError(event.PlayerID, ErrGameAlreadyActive)
		return
	}

	raw, ok := event.Payload.(json.RawMessage)
	if !ok {
		return
	}

	var p transferHostPayload
	if err := json.Unmarshal(raw, &p); err != nil || p.TargetPlayerID == "" {
		return
	}

	target, ok := r.GetPlayer(p.TargetPlayerID)
	if !ok {
		r.sendError(event.PlayerID, ErrInvalidTarget)
		return
	}

	r.applyHostTransfer(target)
	r.BroadcastEvent(EventHostTransferred, hostTransferredPayload{
		NewHostID:          r.HostID,
		NewHostUsername:    r.HostUsername,
		NewHostDisplayName: r.HostDisplayName,
	})
	r.BroadcastPlayerList()
	log.Printf("[room] host manually transferred from %s to %s (%s)", event.PlayerID, r.HostID, r.HostDisplayName)
}

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

	wasHost := hadPlayer && p.Role == RoleHost // guard: p is nil when !hadPlayer
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

	// remove player from DB (non-blocking)
	go func() {
		if err := r.queries.DeleteRoomPlayer(context.Background(), db.DeleteRoomPlayerParams{
			RoomID:   r.ID,
			PlayerID: playerID,
		}); err != nil {
			log.Printf("[db] DeleteRoomPlayer failed for player %s in room %s: %v", playerID, r.ID, err)
		}
	}()

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

	// Mode A: auto-promote the longest-waiting player when the host leaves
	if wasHost {
		newHost := r.pickEarliestJoined()
		if newHost != nil {
			r.applyHostTransfer(newHost)
			r.BroadcastEvent(EventHostTransferred, hostTransferredPayload{
				NewHostID:          r.HostID,
				NewHostUsername:    r.HostUsername,
				NewHostDisplayName: r.HostDisplayName,
			})
			r.BroadcastPlayerList()
			log.Printf("[room] host auto-migrated to %s (%s)", r.HostID, r.HostDisplayName)
		}
	}
}

// pickEarliestJoined returns the player with the earliest JoinedAt among the
// current Players map. Returns nil only if the room is empty.
func (r *Room) pickEarliestJoined() *Player {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var earliest *Player
	for _, p := range r.Players {
		if earliest == nil || p.JoinedAt.Before(earliest.JoinedAt) {
			earliest = p
		}
	}
	return earliest
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

func (r *Room) handlePlayerDisconnect(event Event) {
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
}

// applyHostTransfer demotes the current host to RolePlayer and promotes newHost.
// It re-fetches newHost from the Players map under the write lock to ensure it
// holds a live pointer. The caller must broadcast EventHostTransferred afterward.
func (r *Room) applyHostTransfer(newHost *Player) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Re-fetch to guarantee we have the live pointer (safe against concurrent removals)
	live, ok := r.Players[newHost.ID]
	if !ok {
		log.Printf("[room] applyHostTransfer: target player %s no longer in room", newHost.ID)
		return
	}

	for _, p := range r.Players {
		if p.Role == RoleHost {
			p.Role = RolePlayer
			break
		}
	}

	live.Role = RoleHost
	r.HostID = live.ID
	r.HostUsername = live.Username
	r.HostDisplayName = live.DisplayName
}
