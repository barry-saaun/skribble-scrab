package room

// incoming payloads
type guessPayload struct {
	Word string `json:"word"`
}

type chatPayload struct {
	Text string `json:"text"`
}

// outgoing payloads

type roundStartPayload struct {
	Round      int    `json:"round"`
	DrawerID   string `json:"drawerID"`
	Word       string `json:"word,omitempty"` // only populated for the drawer
	WordLength int    `json:"wordLength"`
	Status     Status `json:"status"`
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

type roundEndingPayload struct {
	SecondsRemaining int    `json:"secondsRemaining"`
	CorrectPlayerID  string `json:"correctPlayerID"`
}

type outgoingMessage struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

type playerListPayload struct {
	Players []playerView `json:"players"`
}

type errorPayload struct {
	Code string `json:"code"`
}

type playerJoinedPayload struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Role        Role   `json:"role"`
}

type playerLeftPayload struct {
	PlayerID string `json:"playerID"`
}

// ========
// Mode A: Random auto-promote
// Mode B: Host picks

// incoming (mode B)
type transferHostPayload struct {
	TargetPlayerID string `json:"targetPlayerID"`
}

// outgoing (both modes)
type hostTransferredPayload struct {
	NewHostID          string `json:"newHostID"`
	NewHostUsername    string `json:"newHostUsername"`
	NewHostDisplayName string `json:"newHostDisplayName"`
}
