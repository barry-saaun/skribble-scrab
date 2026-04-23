package room

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
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
	RoomID    string       `json:"roomID"`
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

	room, ok := h.manager.GetRoom(roomID)

	if !ok {
		writeErrorCode(w, http.StatusNotFound, ErrRoomNotFound)
		return
	}

	if _, ok := room.GetPlayer(req.PlayerID); ok {
		writeErrorCode(w, http.StatusConflict, ErrPlayerAlreadyInRoom)
		return
	}

	if room.isInProgress() {
		writeErrorCode(w, http.StatusConflict, ErrGameAlreadyActive)
		return
	}

	if room.IsFull() {
		writeErrorCode(w, http.StatusConflict, ErrRoomFull)
		return
	}

	player := &Player{ID: req.PlayerID, Username: req.PlayerUsername, DisplayName: req.PlayerDisplayName, Role: RolePlayer, JoinedAt: time.Now()}
	room.AddPlayer(player)

	go func() {
		if err := room.queries.InsertRoomPlayer(context.Background(), db.InsertRoomPlayerParams{
			RoomID:      roomID,
			PlayerID:    player.ID,
			Username:    player.Username,
			DisplayName: player.DisplayName,
			Role:        string(player.Role),
		}); err != nil {
			log.Printf("[db] InsertRoomPlayer failed for player %s in room %s: %v", player.ID, roomID, err)
		}
	}()

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

func (h *RoomHandler) HandleGetRoom(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	room, ok := h.manager.GetRoom(roomID)
	if !ok {
		writeErrorCode(w, http.StatusNotFound, "ROOM_NOT_FOUND")
		return
	}

	room.mu.RLock()
	players := make([]playerView, 0, len(room.Players))
	for _, p := range room.Players {
		_, connected := room.Clients[p.ID]
		players = append(players, playerView{ID: p.ID, Username: p.Username, DisplayName: p.DisplayName, Role: p.Role, Connected: connected})
	}
	room.mu.RUnlock()

	writeJSON(w, http.StatusOK, getRoomResponse{
		RoomID:    room.ID,
		HostID:    room.HostID,
		Config:    room.Config,
		Status:    room.Status,
		Players:   players,
		CreatedAt: room.CreatedAt,
	})
}

func (h *RoomHandler) HandleListPublicRooms(w http.ResponseWriter, r *http.Request) {
	rooms, err := h.manager.queries.ListPublicRooms(r.Context())
	if err != nil {
		log.Printf("[db] ListPublicRooms failed: %v", err)
		writeErrorCode(w, http.StatusInternalServerError, "INTERNAL_ERROR")
		return
	}

	views := make([]publicRoomView, 0, len(rooms))
	for _, rm := range rooms {
		// cross-reference with in-memory map for live player count
		playerCount := 0
		if activeRoom, ok := h.manager.GetRoom(rm.ID); ok {
			activeRoom.mu.RLock()
			playerCount = len(activeRoom.Players)
			activeRoom.mu.RUnlock()
		}

		views = append(views, publicRoomView{
			RoomID:          rm.ID,
			HostUsername:    rm.HostUsername,
			HostDisplayName: rm.HostDisplayName,
			Visibility:      Visibility(rm.Visibility),
			Status:          Status(rm.Status),
			MaxPlayers:      int(rm.MaxPlayers),
			PlayerCount:     playerCount,
			CreatedAt:       rm.CreatedAt.Time,
		})
	}

	writeJSON(w, http.StatusOK, listRoomsResponse{Rooms: views})
}
