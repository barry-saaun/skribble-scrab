package ws

import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn     *websocket.Conn
	roomID   string
	playerID string
	send     chan []byte
}

type IncomingMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}
