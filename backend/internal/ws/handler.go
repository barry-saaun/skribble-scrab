package ws

import (
	"net/http"

	"github.com/barry-saaun/skribble-scrab/backend/internal/config"
	"github.com/barry-saaun/skribble-scrab/backend/internal/room"
	"github.com/gorilla/websocket"
)

var cfg config.Config

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == cfg.FrontendURL
	},
}

type Handler struct {
	manager *room.RoomManager
}

func NewHanlder(manager *room.RoomManager) *Handler {
	return &Handler{manager: manager}
}

func (h *Handler) HandleWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("roomId")
	playerID := r.URL.Query().Get("playerId")

	if roomID == "" || playerID == "" {
		http.Error(w, "missing roomId or playerId", http.StatusBadRequest)
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

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := NewClient(conn, roomID, player.ID)
	room.AddClient(client)

	room.BroadcastPlayerList()

	go client.WritePump()
	go client.ReadPump(room)
}
