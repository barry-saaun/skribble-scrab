package room

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"sync"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
)

const idAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// TODO: allow user to customise this passed via the RoomConfig
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

func (m *RoomManager) CreateRoom(ctx context.Context, hostID, hostUsername, hostDisplayName string, config RoomConfig) (*Room, error) {
	if config.Visibility == "" {
		config.Visibility = VisibilityPublic
	}

	roomID := generateID(6)

	host := &Player{
		ID:          hostID,
		Username:    hostUsername,
		DisplayName: hostDisplayName,
		Role:        RoleHost,
		JoinedAt:    time.Now(),
	}

	r := &Room{
		ID:              roomID,
		MaxPlayers:      MaxPlayers,
		HostID:          hostID,
		HostUsername:    hostUsername,
		HostDisplayName: hostDisplayName,
		Config:          config,
		Players:         map[string]*Player{hostID: host},
		Clients:         make(map[string]Sender),
		Events:          make(chan Event, 256),
		Status:          StatusWaiting,
		CreatedAt:       time.Now(),
		queries:         m.queries,
		manager:         m,
	}

	if err := m.queries.InsertRoom(ctx, db.InsertRoomParams{
		ID:              roomID,
		HostID:          hostID,
		HostUsername:    hostUsername,
		HostDisplayName: hostDisplayName,
		Visibility:      db.RoomVisibility(config.Visibility),
		Status:          db.RoomStatus(StatusWaiting),
		MaxPlayers:      int32(MaxPlayers),
	}); err != nil {
		return nil, fmt.Errorf("InsertRoom: %w", err)
	}

	if err := m.queries.InsertRoomPlayer(ctx, db.InsertRoomPlayerParams{
		RoomID:      roomID,
		PlayerID:    hostID,
		Username:    hostUsername,
		DisplayName: hostDisplayName,
		Role:        string(RoleHost),
	}); err != nil {
		return nil, fmt.Errorf("InsertRoomPlayer (host): %w", err)
	}

	m.mu.Lock()
	m.rooms[roomID] = r
	m.mu.Unlock()

	go r.Run()

	return r, nil
}

func (m *RoomManager) GetRoom(roomID string) (*Room, bool) {
	m.mu.RLock()
	r, ok := m.rooms[roomID]
	m.mu.RUnlock()
	return r, ok
}

func (m *RoomManager) RemoveRoom(roomID string) {
	m.mu.Lock()
	delete(m.rooms, roomID)
	m.mu.Unlock()

	go func() {
		if err := m.queries.UpdateRoomStatus(context.Background(), db.UpdateRoomStatusParams{
			ID:     roomID,
			Status: db.RoomStatusFinished,
		}); err != nil {
			log.Printf("[db] RemoveRoom: failed to update status for room %s: %v", roomID, err)
		}
	}()
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
