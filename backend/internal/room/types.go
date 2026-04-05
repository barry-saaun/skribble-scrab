package room

type Game struct {
	CurrentRound   int
	DrawerID       string
	CurrentWord    string
	Scores         map[string]int
	GuessedPlayers map[string]bool

	CurrentRotation int
	TotalRotations  int
	DrawOrder       []string
	DrawerIndex     int
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
	DrawerID string `json:"drawerId"`
	Word     string `json:"word,omitempty"` // only populated for the drawer
	Status   Status `json:"status"`
}

type roundResultPayload struct {
	CorrectPlayerID string         `json:"correctPlayerId"`
	Word            string         `json:"word"`
	Scores          map[string]int `json:"scores"`
}

type chatBroadcastPayload struct {
	PlayerID string `json:"playerId"`
	Text     string `json:"text"`
}
