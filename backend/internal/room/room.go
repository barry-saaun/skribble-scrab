package room

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Sender is implemented by ws.Client — defined here to avoid an import cycle.
type Sender interface {
	Send(msg []byte)
	PlayerID() string
}

type Player struct {
	ID       string
	Name     string
	Role     string // "host" | "player" | "spectator"
	JoinedAt time.Time
}

type Room struct {
	ID        string
	HostID    string
	Players   map[string]*Player
	Clients   map[string]Sender
	Events    chan Event
	Status    string // "waiting" | "in_progress" | "finished"
	CreatedAt time.Time
	mu        sync.RWMutex
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

func (r *Room) RemoveClient(playerID string) {
	r.mu.Lock()
	delete(r.Clients, playerID)
	r.mu.Unlock()
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

type outgoingMessage struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

type playerListPayload struct {
	Players []playerView `json:"players"`
}

func (r *Room) BroadcastPlayerList() {
	r.mu.RLock()
	players := make([]playerView, 0, len(r.Players))
	for _, p := range r.Players {
		players = append(players, playerView{ID: p.ID, Name: p.Name, Role: p.Role})
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
	for range r.Events {
		// event processing — extended in later phases
	}
}
