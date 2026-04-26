package room

type EventType string

const (
	// Player presence
	EventPlayerJoined     EventType = "player.joined"
	EventPlayerLeave      EventType = "player.leave"      // client → server: explicit leave
	EventPlayerDisconnect EventType = "player.disconnect" // internal: WS closed without explicit leave
	EventPlayerLeft       EventType = "player.left"       // server → client
	EventPlayerList       EventType = "room.player_list"

	// Host migration
	EventTransferHost    EventType = "host.transfer"      // client -> server: host deliberately picks a successor
	EventHostTransferred EventType = "host.transfer.done" // server -> client: broadcast after any host change (both random auto-promote OR host picks)

	// Game lifecycle
	EventGameStart EventType = "game.start"
	EventGameEnd   EventType = "game.end"

	// Rotation lifecycle — one rotation = every player has drawn once
	EventRotationStart    EventType = "rotation.start"
	EventRotationComplete EventType = "rotation.complete"

	// Round lifecycle — one round = one player draws
	EventRoundStart      EventType = "round.start"
	EventRoundTick       EventType = "round.tick"
	EventRoundTimeout    EventType = "round.timeout"
	EventRoundEnd        EventType = "round.end"         // includes correct word, nextDrawer, rotation status
	EventRoundEnding     EventType = "round.ending"      // countdown after a correct guess (broadcast to clients)
	EventRoundEndingDone EventType = "round.ending.done" // internal: countdown finished, advance drawer

	// Guessing
	EventGuessSubmit EventType = "guess.submit"
	EventGuessResult EventType = "guess.result" // correct guess + updated scores, NOT nextDrawer

	// Drawing
	EventDrawStroke EventType = "draw.stroke"
	EventDrawClear  EventType = "draw.clear"

	// Chat
	EventChatMessage EventType = "chat.message"
	EventChatHistory EventType = "chat.history"

	// Error
	EventError EventType = "error"
)

// Error codes sent in errorPayload.Code
const (
	ErrNotHost           = "NOT_HOST"
	ErrGameAlreadyActive = "GAME_ALREADY_ACTIVE"
	ErrNotEnoughPlayers  = "NOT_ENOUGH_PLAYERS"
	ErrNotYourTurnToDraw = "NOT_YOUR_TURN"
	ErrGuessCooldown     = "GUESS_COOLDOWN"
	ErrInvalidTarget     = "INVALID_TARGET" // host transfer: target player not found
)

// Error codes for room access / join error
const (
	ErrRoomNotFound        = "ROOM_NOT_FOUND"
	ErrRoomFull            = "ROOM_FULL"
	ErrPrivateNoCode       = "PRIVATE_NO_CODE"
	ErrCannotLeaveMidRound = "CANNOT_LEAVE_MID_ROUND"
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
