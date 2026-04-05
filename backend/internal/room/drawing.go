package room

import "encoding/json"

func (r *Room) handleDrawStroke(event Event) {
	if r.Status != StatusInProgress {
		return
	}

	if event.PlayerID != r.Game.DrawerID {
		r.sendError(event.PlayerID, ErrNotYourTurn, "only the current drawer can draw")
		return
	}

	raw, ok := event.Payload.(json.RawMessage)
	if !ok {
		return
	}

	b, _ := json.Marshal(outgoingMessage{
		Type:    string(EventDrawStroke),
		Payload: raw,
	})

	r.BroadcastExceptSender(event.PlayerID, b)
}

func (r *Room) handleDrawClear(event Event) {
	if r.Status != StatusInProgress {
		return
	}

	if event.PlayerID != r.Game.DrawerID {
		r.sendError(event.PlayerID, ErrNotYourTurn, "only the current drawer can clear the canvas")
		return
	}

	b, _ := json.Marshal(outgoingMessage{Type: string(EventDrawClear), Payload: nil})
	r.BroadcastExceptSender(event.PlayerID, b)
}
