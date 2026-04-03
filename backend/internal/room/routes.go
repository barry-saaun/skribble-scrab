package room

import "net/http"

func RegisterRoutes(mux *http.ServeMux, h *RoomHandler) {
	mux.HandleFunc("POST /api/rooms", h.HandleCreateRoom)
	mux.HandleFunc("GET /api/rooms/{roomId}", h.HandleGetRoom)
	mux.HandleFunc("POST /api/rooms/{roomId}/join/{playerId}", h.handleJoinRoom)
}
