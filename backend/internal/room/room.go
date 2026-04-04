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

type Role string

const (
	RoleHost      Role = "host"
	RolePlayer    Role = "player"
	RoleSpectator Role = "spectator"
)

type Status string

const (
	StatusWaiting    Status = "waiting"
	StatusInProgress Status = "in_progress"
	StatusFinished   Status = "finished"
)

type Player struct {
	ID       string
	Username string
	Role     Role
	JoinedAt time.Time
}

type Room struct {
	ID           string
	HostID       string
	HostUsername string
	Players      map[string]*Player
	Clients      map[string]Sender
	Events       chan Event
	Status       Status
	CreatedAt    time.Time
	mu           sync.RWMutex
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
		_, connected := r.Clients[p.ID]
		players = append(players, playerView{ID: p.ID, Username: p.Username, Role: p.Role, Connected: connected})
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
