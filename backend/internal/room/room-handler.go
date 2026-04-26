package room

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
	"github.com/jackc/pgx/v5"
)

var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$`)

type RoomHandler struct {
	manager *RoomManager
}

func NewRoomHandler(manager *RoomManager) *RoomHandler {
	return &RoomHandler{manager: manager}
}

type createRoomRequest struct {
	HostID          string     `json:"hostID"`
	HostUsername    string     `json:"hostUsername"`
	HostDisplayName string     `json:"hostDisplayName"`
	Config          RoomConfig `json:"config"`
}

type createRoomResponse struct {
	RoomID          string     `json:"roomID"`
	HostID          string     `json:"hostID"`
	HostUsername    string     `json:"hostUsername"`
	HostDisplayName string     `json:"hostDisplayName"`
	Config          RoomConfig `json:"config"`
	Status          Status     `json:"status"`
	CreatedAt       time.Time  `json:"createdAt"`
}

type playerView struct {
	ID          string `json:"id"`
	Username    string `json:"userName"`
	DisplayName string `json:"displayName"`
	Role        Role   `json:"role"`
	Connected   bool   `json:"connected"`
}

type getRoomResponse struct {
	ID        string       `json:"ID"`
	Name      string       `json:"name"`
	HostID    string       `json:"hostID"`
	Config    RoomConfig   `json:"config"`
	Status    Status       `json:"status"`
	Players   []playerView `json:"players"`
	CreatedAt time.Time    `json:"createdAt"`
}

type joinRoomRequest struct {
	PlayerID          string `json:"playerID"`
	PlayerUsername    string `json:"playerUsername"`
	PlayerDisplayName string `json:"playerDisplayName"`
}

type joinRoomResponse struct {
	PlayerID          string `json:"playerID"`
	PlayerUsername    string `json:"playerUsername"`
	PlayerDisplayName string `json:"playerDisplayName"`
	RoomID            string `json:"roomID"`
	Role              Role   `json:"role"`
}

type publicRoomView struct {
	RoomID          string     `json:"roomID"`
	HostUsername    string     `json:"hostUsername"`
	HostDisplayName string     `json:"hostDisplayName"`
	Visibility      Visibility `json:"visibility"`
	Status          Status     `json:"status"`
	MaxPlayers      int        `json:"maxPlayers"`
	PlayerCount     int        `json:"playerCount"`
	CreatedAt       time.Time  `json:"createdAt"`
}

type listRoomsResponse struct {
	Rooms []publicRoomView `json:"rooms"`
}

// HandleJoinRoom adds a player to an existing room.
// Room existence, status, capacity, and duplicate-player checks are all
// performed against the database (single source of truth). The in-memory
// Room goroutine is synced afterward so the WebSocket layer sees the new
// player immediately.
func (h *RoomHandler) HandleJoinRoom(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")

	var req joinRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PlayerID == "" {
		writeErrorCode(w, http.StatusBadRequest, "INVALID_REQUEST")
		return
	}

	if !usernameRegex.MatchString(req.PlayerUsername) {
		writeErrorCode(w, http.StatusBadRequest, ErrUsernameInvalid)
		return
	}

	// --- DB checks (authoritative) ---

	dbRoom, err := h.manager.queries.GetRoomByID(r.Context(), roomID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCode(w, http.StatusNotFound, ErrRoomNotFound)
		} else {
			log.Printf("[db] HandleJoinRoom GetRoomByID failed for room %s: %v", roomID, err)
			writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		}
		return
	}

	if dbRoom.Status != db.RoomStatusWaiting {
		writeErrorCode(w, http.StatusConflict, ErrGameAlreadyActive)
		return
	}

	dbPlayers, err := h.manager.queries.ListRoomPlayers(r.Context(), roomID)
	if err != nil {
		log.Printf("[db] HandleJoinRoom ListRoomPlayers failed for room %s: %v", roomID, err)
		writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		return
	}

	for _, p := range dbPlayers {
		if p.PlayerID == req.PlayerID {
			writeErrorCode(w, http.StatusConflict, ErrPlayerAlreadyInRoom)
			return
		}
	}

	if len(dbPlayers) >= int(dbRoom.MaxPlayers) {
		writeErrorCode(w, http.StatusConflict, ErrRoomFull)
		return
	}

	// --- Persist to DB (synchronously — DB is written before we respond) ---

	player := &Player{
		ID:          req.PlayerID,
		Username:    req.PlayerUsername,
		DisplayName: req.PlayerDisplayName,
		Role:        RolePlayer,
		JoinedAt:    time.Now(),
	}

	if err := h.manager.queries.InsertRoomPlayer(r.Context(), db.InsertRoomPlayerParams{
		RoomID:      roomID,
		PlayerID:    player.ID,
		Username:    player.Username,
		DisplayName: player.DisplayName,
		Role:        string(player.Role),
	}); err != nil {
		log.Printf("[db] InsertRoomPlayer failed for player %s in room %s: %v", player.ID, roomID, err)
		writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		return
	}

	// --- Sync to the live Room goroutine if one is running ---
	// The active room keeps its own in-memory player map for WebSocket
	// broadcast operations. We add the player there so it is visible
	// immediately once they open a WS connection.
	if activeRoom, ok := h.manager.GetRoom(roomID); ok {
		activeRoom.AddPlayer(player)
	}

	writeJSON(w, http.StatusCreated, joinRoomResponse{
		PlayerID:          player.ID,
		PlayerUsername:    player.Username,
		PlayerDisplayName: player.DisplayName,
		Role:              player.Role,
		RoomID:            roomID,
	})
}

func (h *RoomHandler) HandleCreateRoom(w http.ResponseWriter, r *http.Request) {
	var req createRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.HostID == "" || req.HostUsername == "" {
		writeErrorCode(w, http.StatusBadRequest, "INVALID_REQUEST")
		return
	}

	if !usernameRegex.MatchString(req.HostUsername) {
		writeErrorCode(w, http.StatusBadRequest, "USERNAME_INVALID")
		return
	}

	switch req.Config.Visibility {
	case VisibilityPublic, VisibilityPrivate:
		// valid
	case "":
		req.Config.Visibility = VisibilityPublic
	default:
		writeErrorCode(w, http.StatusBadRequest, "INVALID_VISIBILITY")
		return
	}

	room, err := h.manager.CreateRoom(r.Context(), req.HostID, req.HostUsername, req.HostDisplayName, req.Config)
	if err != nil {
		log.Printf("[db] CreateRoom failed: %v", err)
		writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		return
	}

	writeJSON(w, http.StatusCreated, createRoomResponse{
		RoomID:          room.ID,
		HostID:          room.HostID,
		HostUsername:    room.HostUsername,
		HostDisplayName: room.HostDisplayName,
		Config:          room.Config,
		Status:          room.Status,
		CreatedAt:       room.CreatedAt,
	})
}

// HandleGetRoom returns the current state of a room.
// Room metadata and the player roster are loaded from the database.
// The Connected field on each player is resolved against the live Room
// goroutine (if one is running) to reflect active WebSocket connections.
func (h *RoomHandler) HandleGetRoom(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")

	dbRoom, err := h.manager.queries.GetRoomByID(r.Context(), roomID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCode(w, http.StatusNotFound, "ROOM_NOT_FOUND")
		} else {
			log.Printf("[db] HandleGetRoom GetRoomByID failed for room %s: %v", roomID, err)
			writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		}
		return
	}

	dbPlayers, err := h.manager.queries.ListRoomPlayers(r.Context(), roomID)
	if err != nil {
		log.Printf("[db] HandleGetRoom ListRoomPlayers failed for room %s: %v", roomID, err)
		writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		return
	}

	// Determine which players are currently connected via WebSocket.
	// This is the one piece of information that only the live Room holds.
	connectedIDs := map[string]bool{}
	if activeRoom, ok := h.manager.GetRoom(roomID); ok {
		activeRoom.mu.RLock()
		for id := range activeRoom.Clients {
			connectedIDs[id] = true
		}
		activeRoom.mu.RUnlock()
	}

	players := make([]playerView, 0, len(dbPlayers))
	for _, p := range dbPlayers {
		players = append(players, playerView{
			ID:          p.PlayerID,
			Username:    p.Username,
			DisplayName: p.DisplayName,
			Role:        Role(p.Role),
			Connected:   connectedIDs[p.PlayerID],
		})
	}

	writeJSON(w, http.StatusOK, getRoomResponse{
		ID:     dbRoom.ID,
		Name:   dbRoom.Name,
		HostID: dbRoom.HostID,
		Config: RoomConfig{
			Visibility: Visibility(dbRoom.Visibility),
			Name:       dbRoom.Name,
			MaxPlayers: int(dbRoom.MaxPlayers),
		},
		Status:    Status(dbRoom.Status),
		Players:   players,
		CreatedAt: dbRoom.CreatedAt.Time,
	})
}

// HandleListPublicRooms returns all public rooms that are currently waiting.
// Both room metadata and player counts come from the database.
func (h *RoomHandler) HandleListPublicRooms(w http.ResponseWriter, r *http.Request) {
	rooms, err := h.manager.queries.ListPublicRooms(r.Context())
	if err != nil {
		log.Printf("[db] ListPublicRooms failed: %v", err)
		writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		return
	}

	views := make([]publicRoomView, 0, len(rooms))
	for _, rm := range rooms {
		players, err := h.manager.queries.ListRoomPlayers(r.Context(), rm.ID)
		if err != nil {
			log.Printf("[db] ListRoomPlayers failed for room %s: %v", rm.ID, err)
			writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
			return
		}

		views = append(views, publicRoomView{
			RoomID:          rm.ID,
			HostUsername:    rm.HostUsername,
			HostDisplayName: rm.HostDisplayName,
			Visibility:      Visibility(rm.Visibility),
			Status:          Status(rm.Status),
			MaxPlayers:      int(rm.MaxPlayers),
			PlayerCount:     len(players),
			CreatedAt:       rm.CreatedAt.Time,
		})
	}

	writeJSON(w, http.StatusOK, listRoomsResponse{Rooms: views})
}
