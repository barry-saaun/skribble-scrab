package room

import "encoding/json"

func (r *Room) handleDrawStroke(event Event) {
	if r.Status != StatusInProgress || event.PlayerID != r.Game.DrawerID {
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
	if r.Status != StatusInProgress || event.PlayerID != r.Game.DrawerID {
		return
	}

	b, _ := json.Marshal(outgoingMessage{Type: string(EventDrawClear), Payload: nil})
	r.BroadcastExceptSender(event.PlayerID, b)
}
