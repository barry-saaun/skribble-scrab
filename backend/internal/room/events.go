package room

type EventType string

const (
	EventPlayerJoined EventType = "player.joined"
	EventPlayerLeft   EventType = "player.left"
	EventPlayerList   EventType = "room.player_list"

	EventGameStart   EventType = "game.start"
	EventGameState   EventType = "game.state"
	EventPlayerGuess EventType = "player.guess"
	EventRoundResult EventType = "round.result"
	EventChatMessage EventType = "chat.message"
)

type Event struct {
	Type     EventType
	PlayerID string
	Payload  any
}
