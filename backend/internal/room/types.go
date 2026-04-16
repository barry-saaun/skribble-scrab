package room

import (
	"context"
	"sync"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
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
	ID          string // UUID -> system/logic key
	Username    string // for unique human identifier (friend requests ,lookups)
	DisplayName string // what's shown in gmae UI
	Role        Role
	JoinedAt    time.Time
}

type Room struct {
	ID              string
	HostID          string
	HostUsername    string
	HostDisplayName string
	Game            GameState
	Players         map[string]*Player
	MaxPlayers      int
	Clients         map[string]Sender
	Events          chan Event
	Status          Status
	CreatedAt       time.Time
	queries         *db.Queries
	mu              sync.RWMutex

	// TEMPORARY: in-memory
	manager *RoomManager
}

type GameState struct {
	CurrentRound   int
	DrawerID       string
	CurrentWord    string
	Scores         map[string]int
	GuessedPlayers map[string]bool
	LastGuessAt    map[string]time.Time // tracks last guess timestamp per player for cooldown
	GuessCount     map[string]int       // counts allowed guesses per player per round

	CurrentRotation int
	TotalRotations  int
	DrawOrder       []string
	DrawerIndex     int

	Timer       context.CancelFunc
	RoundEnding bool // true while the post-guess countdown is running
}
