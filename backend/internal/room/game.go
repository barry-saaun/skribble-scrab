package room

import (
	"context"
	"encoding/json"
	"log"
	"maps"
	"math/rand"
	"strings"
	"time"

	"github.com/barry-saaun/skribble-scrab/backend/internal/db"
)

// TODO: change back to three later. 2 for testing without having to open 3 ws connections
const minPlayers = 1

// fallbackWords is used if the DB is unavailable.
var fallbackWords = []string{
	"cat", "dog", "house", "tree", "car", "elephant", "guitar", "pizza",
	"mountain", "ocean", "rocket", "castle", "dragon", "robot", "flower",
}

func (r *Room) pickWord() string {
	if r.queries != nil {
		word, err := r.queries.GetRandomWord(context.Background())
		if err == nil {
			return word
		}
		log.Printf("[game] DB word fetch failed, using fallback: %v", err)
	}
	return fallbackWords[rand.Intn(len(fallbackWords))]
}

func hasEnoughPlayers(numOfPlayers int) bool {
	return numOfPlayers >= minPlayers
}

func getNumOfRotation(numOfPlayers int) int {
	switch {
	case numOfPlayers <= 5:
		return 3
	case numOfPlayers <= 10:
		return 2
	default:
		return 1
	}
}

// handleGameStart starts the game. Only the host can trigger this, and only from StatusWaiting.
func (r *Room) handleGameStart(event Event) {
	if event.PlayerID != r.HostID {
		r.sendError(event.PlayerID, ErrNotHost)
		return
	}

	if r.Status != StatusWaiting {
		r.sendError(event.PlayerID, ErrGameAlreadyActive)
		return
	}

	r.mu.RLock()
	playerIDs := make([]string, 0, len(r.Players))
	for id := range r.Players {
		playerIDs = append(playerIDs, id)
	}
	r.mu.RUnlock()

	if !hasEnoughPlayers(len(playerIDs)) {
		r.sendError(event.PlayerID, ErrNotEnoughPlayers)
		return
	}

	totalRotations := getNumOfRotation(len(playerIDs))

	rand.Shuffle(len(playerIDs), func(i, j int) { playerIDs[i], playerIDs[j] = playerIDs[j], playerIDs[i] })

	r.Status = StatusInProgress
	r.Game = GameState{
		CurrentRound:    1,
		CurrentRotation: 1,
		TotalRotations:  totalRotations,
		DrawOrder:       playerIDs,
		DrawerIndex:     0,
		DrawerID:        playerIDs[0],
		CurrentWord:     r.pickWord(),
		Scores:          make(map[string]int),
		GuessedPlayers:  make(map[string]bool),
		LastGuessAt:     make(map[string]time.Time),
		GuessCount:      make(map[string]int),
	}

	r.BroadcastEvent(EventRotationStart, rotationStartPayload{
		RotationNumber: r.Game.CurrentRotation,
		TotalRotations: r.Game.TotalRotations,
		DrawOrder:      r.Game.DrawOrder,
	})

	r.broadcastRoundStart()
}

func (r *Room) startRoundTimer(ctx context.Context) {
	go func() {
		for seconds := 60; seconds > 0; seconds-- {
			select {
			case <-ctx.Done():
				return
			case <-time.After(1 * time.Second):
				r.Events <- Event{Type: EventRoundTick, Payload: seconds - 1}

			}
		}
		r.Events <- Event{Type: EventRoundTimeout}
	}()
}

// broadcastRoundStart sends round.start to all clients, with the word only to the drawer,
// then starts the round timer.
func (r *Room) broadcastRoundStart() {
	r.mu.RLock()
	clients := make(map[string]Sender, len(r.Clients))
	maps.Copy(clients, r.Clients)
	r.mu.RUnlock()

	for playerID, client := range clients {
		word := ""
		if playerID == r.Game.DrawerID {
			word = r.Game.CurrentWord
		}
		b, _ := json.Marshal(outgoingMessage{
			Type: string(EventRoundStart),
			Payload: roundStartPayload{
				Round:      r.Game.CurrentRound,
				DrawerID:   r.Game.DrawerID,
				Word:       word,
				WordLength: len(r.Game.CurrentWord),
				Status:     r.Status,
			},
		})
		client.Send(b)
	}

	ctx, cancel := context.WithCancel(context.Background())
	r.Game.Timer = cancel
	r.startRoundTimer(ctx)
}

// advanceDrawer is called at the end of a round. It moves to the next drawer,
// handles rotation completion, and ends the game when all rotations are done.
func (r *Room) advanceDrawer(word string, scores map[string]int) {
	if r.Game.Timer != nil {
		r.Game.Timer()
	}
	r.Game.RoundEnding = false
	nextIndex := r.Game.DrawerIndex + 1
	rotationComplete := nextIndex >= len(r.Game.DrawOrder)

	nextDrawerID := ""
	if !rotationComplete {
		nextDrawerID = r.Game.DrawOrder[nextIndex]
	}

	r.BroadcastEvent(EventRoundEnd, roundEndPayload{
		Word:             word,
		NextDrawerID:     nextDrawerID,
		Scores:           scores,
		RotationComplete: rotationComplete,
	})

	if rotationComplete {
		rotationsRemaining := r.Game.TotalRotations - r.Game.CurrentRotation

		r.BroadcastEvent(EventRotationComplete, rotationCompletePayload{
			RotationNumber:     r.Game.CurrentRotation,
			Scores:             scores,
			RotationsRemaining: rotationsRemaining,
		})

		if rotationsRemaining == 0 {
			r.Status = StatusFinished
			winner := r.findWinner()
			r.BroadcastEvent(EventGameEnd, gameEndPayload{
				Scores: scores,
				Winner: winner,
			})
			go r.persistGameResults(scores)
			return
		}

		// start the next rotation with the same draw order, reset from the top
		r.Game.CurrentRotation++
		r.Game.DrawerIndex = 0
	} else {
		r.Game.DrawerIndex = nextIndex
	}

	r.Game.DrawerID = r.Game.DrawOrder[r.Game.DrawerIndex]
	r.Game.CurrentWord = r.pickWord()
	r.Game.GuessedPlayers = make(map[string]bool)
	r.Game.LastGuessAt = make(map[string]time.Time)
	r.Game.GuessCount = make(map[string]int)
	r.Game.CurrentRound++

	if rotationComplete {
		r.BroadcastEvent(EventRotationStart, rotationStartPayload{
			RotationNumber: r.Game.CurrentRotation,
			TotalRotations: r.Game.TotalRotations,
			DrawOrder:      r.Game.DrawOrder,
		})
	}

	r.broadcastRoundStart()
}

// persistGameResults writes final scores to the database after a game ends.
func (r *Room) persistGameResults(scores map[string]int) {
	if r.queries == nil {
		return
	}

	ctx := context.Background()

	r.mu.RLock()
	players := make(map[string]*Player, len(r.Players))
	maps.Copy(players, r.Players)
	r.mu.RUnlock()

	for playerID, score := range scores {
		p, ok := players[playerID]
		if !ok {
			continue
		}
		err := r.queries.InsertGameResult(ctx, db.InsertGameResultParams{
			RoomID:      r.ID,
			PlayerID:    playerID,
			DisplayName: p.DisplayName,
			Score:       int32(score),
		})
		if err != nil {
			log.Printf("[db] failed to persist result for player %s: %v", playerID, err)
		}
	}

	log.Printf("[db] persisted game results for room %s", r.ID)
}

// findWinner returns the player ID with the highest score.
func (r *Room) findWinner() string {
	var winner string
	var max int
	for playerID, score := range r.Game.Scores {
		if score > max {
			max = score
			winner = playerID
		}
	}
	return winner
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

func (r *Room) handlePlayerGuess(event Event) {
	if r.Status != StatusInProgress {
		return
	}

	if time.Since(r.Game.LastGuessAt[event.PlayerID]) < 1*time.Second {
		r.sendError(event.PlayerID, ErrGuessCooldown)
		return
	}

	r.Game.LastGuessAt[event.PlayerID] = time.Now()
	r.Game.GuessCount[event.PlayerID]++
	log.Printf("[guess] player=%s attempt=%d", event.PlayerID, r.Game.GuessCount[event.PlayerID])

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
	r.Game.Scores[r.Game.DrawerID] += 25

	r.BroadcastEvent(EventGuessResult, roundResultPayload{
		CorrectPlayerID: event.PlayerID,
		Word:            r.Game.CurrentWord,
		Scores:          r.Game.Scores,
	})

	// Cancel the round timer and start a short ending countdown before advancing.
	if r.Game.Timer != nil {
		r.Game.Timer()
	}
	r.Game.RoundEnding = true
	capturedRound := r.Game.CurrentRound
	guesserID := event.PlayerID

	go func() {
		for s := 5; s >= 0; s-- {
			r.Events <- Event{Type: EventRoundEnding, Payload: roundEndingPayload{
				SecondsRemaining: s,
				CorrectPlayerID:  guesserID,
			}}
			if s > 0 {
				time.Sleep(1 * time.Second)
			}
		}
		r.Events <- Event{Type: EventRoundEndingDone, Payload: capturedRound}
	}()
}

func (r *Room) handlePlayerLeaveInGame(playerID string) {
	log.Printf("[leave] player %s leaving during game (status=%s, drawer=%s)", playerID, r.Status, r.Game.DrawerID)

	// 1. Remove from DrawOrder & check if they were the drawer
	var newDrawOrder []string
	wasDrawer := false
	var drawerPos int

	for i, id := range r.Game.DrawOrder {
		if id == playerID {
			wasDrawer = (id == r.Game.DrawerID)
			drawerPos = i
		} else {
			newDrawOrder = append(newDrawOrder, id)
		}
	}

	r.Game.DrawOrder = newDrawOrder
	log.Printf("[leave] removed from draw order (wasDrawer=%v, drawerPos=%d, remaining=%d)", wasDrawer, drawerPos, len(r.Game.DrawOrder))

	// 2. Clean up game state maps
	delete(r.Game.Scores, playerID)
	delete(r.Game.GuessedPlayers, playerID)
	delete(r.Game.LastGuessAt, playerID)
	delete(r.Game.GuessCount, playerID)

	// 3. If they were the drawer, advance the round
	if wasDrawer {
		if r.Game.Timer != nil {
			r.Game.Timer()
		}

		if len(r.Game.DrawOrder) == 0 {
			log.Printf("[leave] no players left, ending game")
			r.endGameEarly()
			return
		}

		log.Printf("[leave] was drawer, advancing to next")
		r.advanceDrawer(r.Game.CurrentWord, r.Game.Scores)
	} else if drawerPos < r.Game.DrawerIndex {
		r.Game.DrawerIndex--
		log.Printf("[leave] adjusted drawer index to %d", r.Game.DrawerIndex)
	}

	// 4. Check if enough players remain
	if !hasEnoughPlayers(len(r.Game.DrawOrder)) {
		log.Printf("[leave] not enough players (%d), ending game", len(r.Game.DrawOrder))
		r.endGameEarly()
	}
}

func (r *Room) endGameEarly() {
	r.Status = StatusFinished
	winner := r.findWinner()
	r.BroadcastEvent(EventGameEnd, gameEndPayload{
		Scores: r.Game.Scores,
		Winner: winner,
	})
	go r.persistGameResults(r.Game.Scores)
}
