package room

import (
	"context"
	"sync"
	"time"
)

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
	Game         GameState
	Players      map[string]*Player
	Clients      map[string]Sender
	Events       chan Event
	Status       Status
	CreatedAt    time.Time
	mu           sync.RWMutex
}

type GameState struct {
	CurrentRound   int
	DrawerID       string
	CurrentWord    string
	Scores         map[string]int
	GuessedPlayers map[string]bool

	CurrentRotation int
	TotalRotations  int
	DrawOrder       []string
	DrawerIndex     int

	Timer context.CancelFunc
}
