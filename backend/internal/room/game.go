package room

import (
	"encoding/json"
	"maps"
	"math/rand"
	"strings"
)

// TODO: pick a random from the db later
// Right now: aim for MVP
var wordList = []string{
	"cat", "dog", "house", "tree", "car", "elephant", "guitar", "pizza",
	"mountain", "ocean", "rocket", "castle", "dragon", "robot", "flower",
}

func getNumOfRotation(numOfPlayers int) (int, error) {
	switch {
	case numOfPlayers >= 3 && numOfPlayers <= 5:
		return 3, nil
	case numOfPlayers >= 6 && numOfPlayers <= 10:
		return 2, nil
	case numOfPlayers > 10:
		return 1, nil
	default:
		return 0, fmt.Errorf("invalid player count: %d (minimum 3)", numOfPlayers)
	}
}

// handleGameStart starts the game. Only the host can trigger this, and only from StatusWaiting.
func (r *Room) handleGameStart(event Event) {
	if event.PlayerID != r.HostID || r.Status != StatusWaiting {
		return
	}

	r.mu.RLock()
	playerIDs := make([]string, 0, len(r.Players))
	for id := range r.Players {
		playerIDs = append(playerIDs, id)
	}
	r.mu.RUnlock()

	totalRotations, err := getNumOfRotation(len(playerIDs))
	if err != nil {
		return
	}

	rand.Shuffle(len(playerIDs), func(i, j int) { playerIDs[i], playerIDs[j] = playerIDs[j], playerIDs[i] })

	r.Status = StatusInProgress
	r.Game = GameState{
		CurrentRound:    1,
		CurrentRotation: 1,
		TotalRotations:  totalRotations,
		DrawOrder:       playerIDs,
		DrawerIndex:     0,
		DrawerID:        playerIDs[0],
		CurrentWord:     wordList[rand.Intn(len(wordList))],
		Scores:          make(map[string]int),
		GuessedPlayers:  make(map[string]bool),
	}

	r.BroadcastEvent(EventRotationStart, rotationStartPayload{
		RotationNumber: r.Game.CurrentRotation,
		TotalRotations: r.Game.TotalRotations,
		DrawOrder:      r.Game.DrawOrder,
	})

	r.broadcastRoundStart()
}

// broadcastRoundStart sends round.start to all clients, with the word only to the drawer.
func (r *Room) broadcastRoundStart() {
	r.mu.RLock()
	clients := make(map[string]Sender, len(r.Clients))
	maps.Copy(clients, r.Clients)
	r.mu.RUnlock()

	// drawer gets the word, everyone else doesn't
	for playerID, client := range clients {
		word := ""
		if playerID == r.Game.DrawerID {
			word = r.Game.CurrentWord
		}
		b, _ := json.Marshal(outgoingMessage{
			Type: string(EventRoundStart),
			Payload: roundStartPayload{
				Round:    r.Game.CurrentRound,
				DrawerID: r.Game.DrawerID,
				Word:     word,
				Status:   r.Status,
			},
		})
		client.Send(b)
	}
}

func (r *Room) handleChatMessage(event Event) {
	raw, ok := event.Payload.(json.RawMessage)
	if !ok {
		return
	}

	var p chatPayload
	if err := json.Unmarshal(raw, &p); err != nil || p.Text == "" {
		return
	}

	r.BroadcastEvent(EventChatMessage, chatBroadcastPayload{
		PlayerID: event.PlayerID,
		Text:     p.Text,
	})
}

type roundEndPayload struct {
	Word   string         `json:"word"`
	Scores map[string]int `json:"scores"`
}

func (r *Room) handlePlayerGuess(event Event) {
	if r.Status != StatusInProgress || event.PlayerID == r.Game.DrawerID {
		return
	}

	if r.Game.GuessedPlayers[event.PlayerID] {
		return
	}

	raw, ok := event.Payload.(json.RawMessage)
	if !ok {
		return
	}

	var p guessPayload
	if err := json.Unmarshal(raw, &p); err != nil || p.Word == "" {
		return
	}

	if !strings.EqualFold(p.Word, r.Game.CurrentWord) {
		return
	}

	r.Game.GuessedPlayers[event.PlayerID] = true
	r.Game.Scores[event.PlayerID] += 100
	r.Game.Scores[r.Game.DrawerID] += 50

	r.BroadcastEvent(EventGuessResult, roundResultPayload{
		CorrectPlayerID: event.PlayerID,
		Word:            r.Game.CurrentWord,
		Scores:          r.Game.Scores,
	})

	// end round when all non-drawer players have guessed correctly
	r.mu.RLock()
	totalPlayers := len(r.Players)
	r.mu.RUnlock()

	if len(r.Game.GuessedPlayers) >= totalPlayers-1 {
		word := r.Game.CurrentWord
		scores := r.Game.Scores
		r.Game = GameState{Scores: scores} // reset round state, keep scores
		r.Status = StatusWaiting
		r.BroadcastEvent(EventRoundEnd, roundEndPayload{
			Word:   word,
			Scores: scores,
		})
	}
}

func getNumOfRotation(numOfPlayers int) (int, error) {
	switch {
	case numOfPlayers >= 3 && numOfPlayers <= 5:
		return 3, nil
	case numOfPlayers >= 6 && numOfPlayers <= 10:
		return 2, nil

	case numOfPlayers >= 10:
		return 1, nil

	default:
		return 0, fmt.Errorf("invalid player count: %d (minimum 3)", numOfPlayers)

	}
}
