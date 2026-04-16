package room

import (
	"crypto/rand"
	"math/big"
	"sync"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
)

const idAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// TODO: allow user to customise this
const MaxPlayers = 6

type RoomManager struct {
	rooms   map[string]*Room
	queries *db.Queries
	mu      sync.RWMutex
}

func NewRoomManager(queries *db.Queries) *RoomManager {
	return &RoomManager{
		rooms:   make(map[string]*Room),
		queries: queries,
	}
}

func (m *RoomManager) CreateRoom(hostID, hostUsername, HostDisplayName string) *Room {
	roomID := generateID(6)

	host := &Player{
		ID:          hostID,
		Username:    hostUsername,
		DisplayName: HostDisplayName,
		Role:        RoleHost,
		JoinedAt:    time.Now(),
	}

	r := &Room{
		ID:              roomID,
		MaxPlayers:      MaxPlayers,
		HostID:          hostID,
		HostUsername:    hostUsername,
		HostDisplayName: HostDisplayName,
		Players:         map[string]*Player{hostID: host},
		Clients:         make(map[string]Sender),
		Events:          make(chan Event, 256),
		Status:          StatusWaiting,
		CreatedAt:       time.Now(),
		queries:         m.queries,
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
