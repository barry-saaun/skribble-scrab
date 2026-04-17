package ws

import (
	"encoding/json"

	"github.com/barry-saaun/skribble-scrab/backend/internal/room"
	"github.com/gorilla/websocket"
)

type Client struct {
	conn        *websocket.Conn
	roomID      string
	playerID    string
	username    string
	displayName string
	send        chan []byte
}

type IncomingMessage struct {
	Type    room.EventType  `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// validClientEvents is the whitelist of event types that clients are allowed to send.
// Server-only events (game lifecycle, round ticks, etc.) are excluded.
var validClientEvents = map[room.EventType]bool{
	room.EventPlayerLeave: true,
	room.EventGuessSubmit: true,
	room.EventDrawStroke:  true,
	room.EventDrawClear:   true,
	room.EventChatMessage: true,
	room.EventGameStart:   true,
}
