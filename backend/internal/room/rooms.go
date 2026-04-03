package room

import (
	"encoding/json"
	"net/http"
	"time"
)

type RoomHandler struct {
	manager *RoomManager
}

func NewRoomHandler(manager *RoomManager) *RoomHandler {
	return &RoomHandler{manager: manager}
}

type createRoomRequest struct {
	HostID string `json:"hostId"`
}

type createRoomResponse struct {
	RoomID    string    `json:"roomId"`
	HostID    string    `json:"hostId"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type playerView struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type getRoomResponse struct {
	RoomID    string       `json:"roomId"`
	HostID    string       `json:"hostId"`
	Status    string       `json:"status"`
	Players   []playerView `json:"players"`
	CreatedAt time.Time    `json:"createdAt"`
}

func (h *RoomHandler) HandleCreateRoom(w http.ResponseWriter, r *http.Request) {
	var req createRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.HostID == "" {
		http.Error(w, `{"error":"hostId is required"}`, http.StatusBadRequest)
		return
	}

	room := h.manager.CreateRoom(req.HostID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(createRoomResponse{
		RoomID:    room.ID,
		HostID:    room.HostID,
		Status:    room.Status,
		CreatedAt: room.CreatedAt,
	})
}

func (h *RoomHandler) HandleGetRoom(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomId")
	room, ok := h.manager.GetRoom(roomID)
	if !ok {
		http.Error(w, `{"error":"room not found"}`, http.StatusNotFound)
		return
	}

	room.mu.RLock()
	players := make([]playerView, 0, len(room.Players))
	for _, p := range room.Players {
		players = append(players, playerView{ID: p.ID, Name: p.Name, Role: p.Role})
	}
	room.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(getRoomResponse{
		RoomID:    room.ID,
		HostID:    room.HostID,
		Status:    room.Status,
		Players:   players,
		CreatedAt: room.CreatedAt,
	})
}
