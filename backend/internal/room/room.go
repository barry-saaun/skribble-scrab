package room

import (
	"sync"
	"time"
)

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
	Status    string // "waiting" | "in_progress" | "finished"
	CreatedAt time.Time
	mu        sync.RWMutex
}
