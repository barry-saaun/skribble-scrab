package ws

import (
	"encoding/json"
	"log"

	"github.com/barry-saaun/skribble-scrab/backend/internal/room"
	"github.com/gorilla/websocket"
)

const sendBufferSize = 256

func NewClient(conn *websocket.Conn, roomID, playerID, username, displayName string) *Client {
	return &Client{
		conn:        conn,
		roomID:      roomID,
		playerID:    playerID,
		username:    username,
		displayName: displayName,
		send:        make(chan []byte, sendBufferSize),
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
	log.Printf("[ws] ReadPump started  — player %s (%s / %s)", c.playerID, c.username, c.displayName)
	defer func() {
		log.Printf("[ws] ReadPump exiting  — player %s (%s / %s): removing client, closing send channel", c.playerID, c.username, c.displayName)
		r.RemoveClientIfSame(c) // identity-safe: won't evict a newer client for the same playerID
		close(c.send)
		// Notify the room the WS dropped — Run() will remove the player if they
		// didn't already leave via an explicit player.leave event.
		log.Printf("[ws] ReadPump exiting  — player %s (%s / %s): firing EventPlayerDisconnect", c.playerID, c.username, c.displayName)
		r.Events <- room.Event{Type: room.EventPlayerDisconnect, PlayerID: c.playerID}
	}()

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway,
				websocket.CloseNormalClosure,
				websocket.CloseAbnormalClosure,
			) {
				log.Printf("client %s read error: %v", c.playerID, err)
			}
			break
		}

		var incoming IncomingMessage
		if err := json.Unmarshal(msg, &incoming); err != nil {
			log.Printf("client %s invalid message: %v", c.playerID, err)
			continue
		}

		if !validClientEvents[incoming.Type] {
			log.Printf("client %s sent disallowed event type: %q", c.playerID, incoming.Type)
			continue
		}

		r.Events <- room.Event{
			Type:     incoming.Type,
			PlayerID: c.playerID,
			Payload:  incoming.Payload,
		}
	}
}

// WritePump writes outbound messages from the send channel to the WebSocket.
// Runs in its own goroutine. Closes the connection when the send channel is closed.
func (c *Client) WritePump() {
	log.Printf("[ws] WritePump started  — player %s (%s / %s)", c.playerID, c.username, c.displayName)
	defer func() {
		log.Printf("[ws] WritePump exiting — player %s (%s / %s): closing WS connection", c.playerID, c.username, c.displayName)
		c.conn.Close()
	}()

	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("[ws] WritePump write error — player %s (%s / %s): %v", c.playerID, c.username, c.displayName, err)
			return
		}
	}
	log.Printf("[ws] WritePump send channel drained — player %s (%s / %s): WS connection will close", c.playerID, c.username, c.displayName)
}
