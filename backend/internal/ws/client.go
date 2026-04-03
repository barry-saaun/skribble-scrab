package ws

import (
	"log"

	"github.com/barry-saaun/skribble-scrab/backend/internal/room"
	"github.com/gorilla/websocket"
)

const sendBufferSize = 256

type Client struct {
	conn     *websocket.Conn
	roomID   string
	playerID string
	send     chan []byte
}

func NewClient(conn *websocket.Conn, roomID, playerID string) *Client {
	return &Client{
		conn:     conn,
		roomID:   roomID,
		playerID: playerID,
		send:     make(chan []byte, sendBufferSize),
	}
}

// Send implements room.Sender — non-blocking, drops message if buffer is full.
func (c *Client) Send(msg []byte) {
	select {
	case c.send <- msg:
	default:
		log.Printf("client %s send buffer full, dropping message", c.playerID)
	}
}

// PlayerID implements room.Sender.
func (c *Client) PlayerID() string {
	return c.playerID
}

// ReadPump reads from the WebSocket connection. Runs in its own goroutine.
// On exit it removes the client from the room and closes the send channel,
// which signals WritePump to finish.
func (c *Client) ReadPump(r *room.Room) {
	defer func() {
		r.RemoveClient(c.playerID)
		r.BroadcastPlayerList()
		close(c.send)
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("client %s read error: %v", c.playerID, err)
			}
			break
		}
		// incoming game messages forwarded to room.Events in later phases
	}
}

// WritePump writes outbound messages from the send channel to the WebSocket.
// Runs in its own goroutine. Closes the connection when the send channel is closed.
func (c *Client) WritePump() {
	defer c.conn.Close()

	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("client %s write error: %v", c.playerID, err)
			return
		}
	}
}
