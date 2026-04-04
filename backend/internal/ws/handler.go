// Package ws handles WebSocket connections and real-time communication.
package ws

import (
	"net/http"

	"github.com/barry-saaun/skribble-scrab/backend/internal/config"
	"github.com/barry-saaun/skribble-scrab/backend/internal/room"
	"github.com/gorilla/websocket"
)

type Handler struct {
	manager  *room.RoomManager
	upgrader websocket.Upgrader
}

func NewHandler(manager *room.RoomManager, cfg config.Config) *Handler {
	return &Handler{
		manager: manager,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return r.Header.Get("Origin") == cfg.FrontendURL
			},
		},
	}
}

func (h *Handler) HandleWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("roomID")
	playerID := r.URL.Query().Get("playerID")

	if roomID == "" || playerID == "" {
		http.Error(w, "missing roomID or playerID", http.StatusBadRequest)
		return
	}

	room, ok := h.manager.GetRoom(roomID)
	if !ok {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}

	player, ok := room.GetPlayer(playerID)

	if !ok {
		http.Error(w, "player not in room", http.StatusForbidden)
		return
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := NewClient(conn, roomID, player.ID)
	room.AddClient(client)

	room.BroadcastPlayerList()

	go client.WritePump()
	go client.ReadPump(room)
}
