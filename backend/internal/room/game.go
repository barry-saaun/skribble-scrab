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

// handleGameStart starts the game. Only the host can trigger this, and only from StatusWaiting.
func (r *Room) handleGameStart(event Event) {
	if event.PlayerID != r.HostID || r.Status != StatusWaiting {
		return
	}

	r.Status = StatusInProgress
	r.Game.CurrentRound++

	r.mu.RLock()
	playerIDs := make([]string, 0, len(r.Players))
	for id := range r.Players {
		playerIDs = append(playerIDs, id)
	}
	r.mu.RUnlock()

	r.Game.DrawerID = playerIDs[rand.Intn(len(playerIDs))]
	r.Game.CurrentWord = wordList[rand.Intn(len(wordList))]
	r.Game.Scores = make(map[string]int)
	r.Game.GuessedPlayers = make(map[string]bool)

	// snapshot clients under lock so we can send without holding the mutex
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
