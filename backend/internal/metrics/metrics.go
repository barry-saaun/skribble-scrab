// Package metrics exposes Prometheus counters/gauges for the WebSocket server.
// Scrape at GET /metrics.
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	ActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "ws_active_connections",
		Help: "Currently open WebSocket connections.",
	})

	MessagesReceived = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "ws_messages_received_total",
		Help: "Inbound WS messages by event type.",
	}, []string{"event_type"})

	MessagesSent = promauto.NewCounter(prometheus.CounterOpts{
		Name: "ws_messages_sent_total",
		Help: "Outbound WS messages written to clients.",
	})

	MessagesDropped = promauto.NewCounter(prometheus.CounterOpts{
		Name: "ws_messages_dropped_total",
		Help: "Outbound messages dropped because a client's send buffer was full.",
	})

	Disconnects = promauto.NewCounter(prometheus.CounterOpts{
		Name: "ws_disconnects_total",
		Help: "WebSocket connections that have closed.",
	})

	Reconnections = promauto.NewCounter(prometheus.CounterOpts{
		Name: "ws_reconnections_total",
		Help: "Players who rejoined within the disconnect grace period. Pair with ws_disconnects_total for a live reconnection rate.",
	})

	// EventHandling is the server-side processing time per event in the room
	// event loop — the server's own contribution to round-trip latency. Buckets
	// are weighted toward single-digit milliseconds since handling is fast.
	EventHandling = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "ws_event_handling_seconds",
		Help:    "Server-side event handling duration by event type.",
		Buckets: []float64{.0005, .001, .0025, .005, .01, .02, .05, .1, .25, .5, 1},
	}, []string{"event_type"})
)
