package room

import (
	"encoding/json"
	"net/http"
	"regexp"
	"time"
)

var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$`)

type RoomHandler struct {
	manager *RoomManager
}

func NewRoomHandler(manager *RoomManager) *RoomHandler {
	return &RoomHandler{manager: manager}
}

type createRoomRequest struct {
	HostID          string `json:"hostID"`
	HostUsername    string `json:"hostUsername"`
	HostDisplayName string `json:"hostDisplayName"`
}

type createRoomResponse struct {
	RoomID          string    `json:"roomID"`
	HostID          string    `json:"hostID"`
	HostUsername    string    `json:"hostUsername"`
	HostDisplayName string    `json:"hostDisplayName"`
	Status          Status    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
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

func (h *RoomHandler) HandleJoinRoom(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")

	var req joinRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PlayerID == "" {
		writeErrorCode(w, http.StatusBadRequest, "INVALID_REQUEST")
		return
	}

	if !usernameRegex.MatchString(req.PlayerUsername) {
		writeErrorCode(w, http.StatusBadRequest, "USERNAME_INVALID")
		return
	}

	room, ok := h.manager.GetRoom(roomID)

	if !ok {
		writeErrorCode(w, http.StatusNotFound, "ROOM_NOT_FOUND")
		return
	}

	if _, ok := room.GetPlayer(req.PlayerID); ok {
		writeErrorCode(w, http.StatusConflict, "PLAYER_ALREADY_IN_ROOM")
		return
	}

	isFull := room.IsFull()

	if isFull {
		writeErrorCode(w, http.StatusConflict, "ROOM_FULL")
		return
	}

	player := &Player{ID: req.PlayerID, Username: req.PlayerUsername, DisplayName: req.PlayerDisplayName, Role: RolePlayer, JoinedAt: time.Now()}
	room.AddPlayer(player)

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

	room := h.manager.CreateRoom(req.HostID, req.HostUsername, req.HostDisplayName)

	writeJSON(w, http.StatusCreated, createRoomResponse{
		RoomID:          room.ID,
		HostID:          room.HostID,
		HostUsername:    room.HostUsername,
		HostDisplayName: room.HostDisplayName,
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
		Status:    room.Status,
		Players:   players,
		CreatedAt: room.CreatedAt,
	})
}
