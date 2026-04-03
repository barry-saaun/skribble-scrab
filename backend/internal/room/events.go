package room

type EventType string

const (
	EventPlayerJoined EventType = "player.joined"
	EventPlayerLeft   EventType = "player.left"
	EventPlayerList   EventType = "room.player_list"
)

type Event struct {
	Type     EventType
	PlayerID string
	Payload  any
}
