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

// Error codes sent in errorPayload.Code
const (
	ErrNotHost           = "NOT_HOST"
	ErrGameAlreadyActive = "GAME_ALREADY_ACTIVE"
	ErrNotEnoughPlayers  = "NOT_ENOUGH_PLAYERS"
	ErrNotYourTurn       = "NOT_YOUR_TURN"
	ErrAlreadyGuessed    = "ALREADY_GUESSED"
)

// Error codes for room access / join error
const (
	ErrRoomNotValid  = "ROOM_NOT_FOUND"
	ErrInvalidCode   = "INVALID_CODE"
	ErrRoomFull      = "ROOM_FULL"
	ErrPrivateNoCode = "PRIVATE_NO_CODE"
)

// General room state error codes (might not needed now but for later)
const (
	ErrPlayerAlreadyInRoom = "PLAYER_ALREADY_IN_ROOM"
	ErrUsernameInvalid     = "USERNAME_INVALID"
)

type Event struct {
	Type     EventType
	PlayerID string
	Payload  any
}
