package room

import (
	"crypto/rand"
	"math/big"
	"sync"
	"time"
)

const idAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

type RoomManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]*Room),
	}
}

func (m *RoomManager) CreateRoom(hostID string) *Room {
	roomID := generateID(6)

	host := &Player{
		ID:       hostID,
		Role:     "host",
		JoinedAt: time.Now(),
	}

	r := &Room{
		ID:        roomID,
		HostID:    hostID,
		Players:   map[string]*Player{hostID: host},
		Clients:   make(map[string]Sender),
		Events:    make(chan Event, 256),
		Status:    "waiting",
		CreatedAt: time.Now(),
	}

	m.mu.Lock()
	m.rooms[roomID] = r
	m.mu.Unlock()

	go r.Run()

	return r
}

func (m *RoomManager) GetRoom(roomID string) (*Room, bool) {
	m.mu.RLock()
	r, ok := m.rooms[roomID]
	m.mu.RUnlock()
	return r, ok
}

func generateID(n int) string {
	b := make([]byte, n)
	max := big.NewInt(int64(len(idAlphabet)))
	for i := range b {
		idx, _ := rand.Int(rand.Reader, max)
		b[i] = idAlphabet[idx.Int64()]
	}
	return string(b)
}
