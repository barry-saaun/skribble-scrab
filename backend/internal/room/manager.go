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

// RoomManager owns the lifecycle of all rooms.
//
// - DB is the single source of truth
// - The `active` map is a runtime-only registry: it holds the
// live *Room goroutines that manage WebSocket connections and in-flight game
// state.
// - HTTP handlers must query the database directly; only the WebSocket
// layer should reach into `active`.
type RoomManager struct {
	// active maps roomID → live Room goroutine. It is NOT a data store —
	// entries exist only while the room has an active event loop running.
	active  map[string]*Room
	queries *db.Queries
	mu      sync.RWMutex
}

func NewRoomManager(queries *db.Queries) *RoomManager {
	return &RoomManager{
		active:  make(map[string]*Room),
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

	// Persist to DB first — DB is the authoritative source of truth.
	if err := m.queries.InsertRoom(ctx, db.InsertRoomParams{
		ID:              roomID,
		Name:            config.Name,
		HostID:          hostID,
		HostUsername:    hostUsername,
		HostDisplayName: hostDisplayName,
		Visibility:      db.RoomVisibility(config.Visibility),
		Status:          db.RoomStatus(StatusWaiting),
		MaxPlayers:      int32(config.MaxPlayers),
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

	// Build the runtime Room and register it so the WebSocket layer can reach it.
	r := &Room{
		ID:              roomID,
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

	m.mu.Lock()
	m.active[roomID] = r
	m.mu.Unlock()

	go r.Run()

	return r, nil
}

// GetRoom returns the live Room goroutine for roomID, if one is running.
// This is intended solely for WebSocket connection management. HTTP handlers
// should query the database directly for authoritative room state.
func (m *RoomManager) GetRoom(roomID string) (*Room, bool) {
	m.mu.RLock()
	r, ok := m.active[roomID]
	m.mu.RUnlock()
	return r, ok
}

// RemoveRoom tears down the in-memory goroutine for roomID and marks the room
// as finished in the database.
func (m *RoomManager) RemoveRoom(roomID string) {
	m.mu.Lock()
	delete(m.active, roomID)
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
