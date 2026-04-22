package room

func (r *Room) Run() {
	for event := range r.Events {
		switch event.Type {
		case EventPlayerLeave:
			if r.Game.RoundLive {
				r.sendError(event.PlayerID, ErrCannotLeaveMidRound)
				return
			}

			if _, ok := r.GetPlayer(event.PlayerID); ok {
				r.RemovePlayer(event.PlayerID)
			}
		case EventPlayerDisconnect:
			r.handlePlayerDisconnect(event)
		case EventGameStart:
			r.handleGameStart(event)
		case EventChatMessage:
			r.handleChatMessage(event)
		case EventGuessSubmit:
			r.handlePlayerGuess(event)
		case EventRoundTick:
			seconds, _ := event.Payload.(int)
			r.BroadcastEvent(EventRoundTick, roundTickPayload{SecondsRemaining: seconds})
		case EventRoundTimeout:
			if r.Status == StatusInProgress && !r.Game.RoundEnding {
				r.advanceDrawer(r.Game.CurrentWord, r.Game.Scores)
			}
		case EventRoundEnding:
			payload := event.Payload.(roundEndingPayload)
			r.BroadcastEvent(EventRoundEnding, payload)
		case EventRoundEndingDone:
			capturedRound := event.Payload.(int)
			if r.Status == StatusInProgress && r.Game.CurrentRound == capturedRound {
				r.advanceDrawer(r.Game.CurrentWord, r.Game.Scores)
			}
		case EventDrawStroke:
			r.handleDrawStroke(event)
		case EventDrawClear:
			r.handleDrawClear(event)
		}
	}
}
