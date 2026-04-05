package room

type EventType string

const (
	// Player presence
	EventPlayerJoined EventType = "player.joined"
	EventPlayerLeft   EventType = "player.left"
	EventPlayerList   EventType = "room.player_list"

	// Game lifecycle
	EventGameStart EventType = "game.start"
	EventGameEnd   EventType = "game.end"

	// Rotation lifecycle — one rotation = every player has drawn once
	EventRotationStart    EventType = "rotation.start"
	EventRotationComplete EventType = "rotation.complete"

	// Round lifecycle — one round = one player draws
	EventRoundStart   EventType = "round.start"
	EventRoundTick    EventType = "round.tick"
	EventRoundTimeout EventType = "round.timeout"
	EventRoundEnd     EventType = "round.end" // includes correct word, nextDrawer, rotation status

	// Guessing
	EventGuessSubmit EventType = "guess.submit"
	EventGuessResult EventType = "guess.result" // correct guess + updated scores, NOT nextDrawer

	// Drawing
	EventDrawStroke EventType = "draw.stroke"
	EventDrawClear  EventType = "draw.clear"

	// Chat
	EventChatMessage EventType = "chat.message"

	// Error
	EventError EventType = "error"
)

type Event struct {
	Type     EventType
	PlayerID string
	Payload  any
}
