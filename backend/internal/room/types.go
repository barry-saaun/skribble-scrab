package room

import "context"

type GameState struct {
	CurrentRound   int
	DrawerID       string
	CurrentWord    string
	Scores         map[string]int
	GuessedPlayers map[string]bool

	CurrentRotation int
	TotalRotations  int
	DrawOrder       []string
	DrawerIndex     int

	Timer context.CancelFunc
}

// incoming payloads
type guessPayload struct {
	Word string `json:"word"`
}

type chatPayload struct {
	Text string `json:"text"`
}

// outgoing payloads

type roundStartPayload struct {
	Round    int    `json:"round"`
	DrawerID string `json:"drawerID"`
	Word     string `json:"word,omitempty"` // only populated for the drawer
	Status   Status `json:"status"`
}

type roundResultPayload struct {
	CorrectPlayerID string         `json:"correctPlayerID"`
	Word            string         `json:"word"`
	Scores          map[string]int `json:"scores"`
}

type chatBroadcastPayload struct {
	PlayerID string `json:"playerID"`
	Text     string `json:"text"`
}

type rotationStartPayload struct {
	RotationNumber int      `json:"rotationNumber"`
	TotalRotations int      `json:"totalRotations"`
	DrawOrder      []string `json:"drawOrder"`
}

type rotationCompletePayload struct {
	RotationNumber     int            `json:"rotationNumber"`
	Scores             map[string]int `json:"scores"`
	RotationsRemaining int            `json:"rotationsRemaining"`
}

type roundEndPayload struct {
	Word             string         `json:"word"`
	NextDrawerID     string         `json:"nextDrawerID"`
	Scores           map[string]int `json:"scores"`
	RotationComplete bool           `json:"rotationComplete"`
}

type gameEndPayload struct {
	Scores map[string]int `json:"scores"`
	Winner string         `json:"winner"`
}

type roundTickPayload struct {
	SecondsRemaining int `json:"secondsRemaining"`
}

type outgoingMessage struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

type playerListPayload struct {
	Players []playerView `json:"players"`
}

type errorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
