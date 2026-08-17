# Skribble Scrab

A multiplayer drawing-and-guessing game in the style of skribbl.io. One player draws a word, everyone else races to guess it across a shared live canvas. The part worth reading sits under the game: a Go WebSocket backend that reports what it is doing and recovers when connections die, running on Fly.io behind live Grafana dashboards.

Live at [skribble-scrab.fly.dev](https://skribble-scrab.fly.dev).

## Stack

| Layer | Choice |
|---|---|
| Backend | Go 1.25, `gorilla/websocket` |
| Data | PostgreSQL, `sqlc` for type-safe queries, `golang-migrate` |
| Metrics | `prometheus/client_golang`, Grafana on Fly.io |
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS, shadcn/ui |
| API types | OpenAPI 3.0 to `openapi-typescript`: the backend spec generates the frontend's request and response types |
| Delivery | Docker, GitHub Actions, Fly.io |

## How a round runs

Each room owns one goroutine. That goroutine reads a channel of events and handles them one at a time:

```
guess  ─┐
stroke ─┼─▶  room.Events  ─▶  Run() loop  ─▶  broadcast to clients in room
chat   ─┤        (one goroutine per room, serial)
leave  ─┘
```

Serial handling per room removes the race conditions you get from locking shared game state across separate handlers. The current word, the scores, and the round clock live in memory and change in one place. PostgreSQL keeps the durable record: rooms, the word list, and finished-game results.

Every connected client gets two goroutines, one reading from the socket and one writing to it. A 256-slot buffered channel sits between the game loop and each socket, so one slow client never stalls the room.

## Recovering from dropped connections

Players lose wifi in the middle of a round. The backend expects that.

**Reconnect grace.** A socket closes and the server holds the player's slot for five seconds. Redial inside that window with the same room and player ID, and you rejoin the same game with your score intact. Miss the window and the server removes you and broadcasts the updated roster.

**Identity-safe eviction.** A reconnecting client can race the cleanup of its own dead socket. Each teardown checks whether it still owns the player slot before removing anyone (`RemoveClientIfSame`), so a stale disconnect never evicts the fresh connection that took its place.

**Backpressure that reports itself.** A client's send buffer holds 256 messages. Fill it, say a phone falling behind on draw frames, and the server drops the next message rather than blocking the room, then increments `ws_messages_dropped_total`. A player losing updates in silence used to leave no trace. Now it moves a line on a graph.

## Observability

The server publishes `/metrics` in Prometheus format. Fly.io scrapes that endpoint on a schedule and feeds its hosted Grafana, so every counter below is queryable without SSHing into a box.

| Metric | Reads out |
|---|---|
| `ws_active_connections` | players connected right now |
| `ws_messages_received_total` | inbound messages by event type (draw, chat, guess) |
| `ws_messages_sent_total` | outbound broadcasts |
| `ws_messages_dropped_total` | frames dropped to a client that fell behind |
| `ws_disconnects_total` | sockets closed |
| `ws_reconnections_total` | players who rejoined inside the grace window |
| `ws_event_handling_seconds` | server-side processing time per event (histogram) |

Two queries turn the raw signals into the numbers that matter:

```promql
# p99 server-side handling latency, in ms
histogram_quantile(0.99, sum(rate(ws_event_handling_seconds_bucket[5m])) by (le)) * 1000

# live reconnection rate
rate(ws_reconnections_total[5m])
```

[`docs/observability.md`](docs/observability.md) walks through the design and the vocabulary.

## Measured results

The `benchmarks/` directory holds standalone Go programs that produce these. Rerun them against a deployment to reproduce the figures.

| Measurement | Result | Method |
|---|---|---|
| WebSocket round-trip latency | under 19ms p99 | 1,000 chat pings over a single connection |
| Concurrency | 500 connections, 0% failure | ramped dial-up against production |
| Reconnection | 100% across 50 abrupt drops | kill the raw socket, redial the same IDs |
| Push-to-production | ~105s backend, ~93s frontend | GitHub Actions build-and-deploy timings |

## Run it locally

You need Go 1.25, Node with `pnpm`, and PostgreSQL. Put a `.env.local` at the repo root (see `.env.example`) with at least `DATABASE_URL`, `PORT`, `FRONTEND_URL`, and `NEXT_PUBLIC_WS_BASE_URL`.

```bash
createdb skribble_scrab   # match DATABASE_URL

# backend — applies migrations on startup, then serves :8080
cd backend && go run ./cmd/server

# frontend — new terminal
cd frontend && pnpm install && pnpm dev
```

Frontend on [localhost:3000](http://localhost:3000), backend on `:8080`, WebSocket at `ws://localhost:8080/ws`, metrics at `:8080/metrics`.

## Deploy

Both services ship as Docker images to Fly.io. GitHub Actions runs it on every push to `main`:

- `.github/workflows/deploy-backend.yml`: `go test`, build image, deploy
- `.github/workflows/deploy-frontend.yml`: lint, build, deploy

Add `FLY_API_TOKEN` (from `fly auth token`) to the repo's Actions secrets to arm the pipeline. To ship by hand:

```bash
cd backend && fly deploy    # or cd frontend && fly deploy
```

## Layout

```
backend/
  cmd/server/        entry point, HTTP + WS wiring, migrations
  internal/
    ws/              socket upgrade, per-client read/write pumps
    room/            game loop, rounds, scoring, reconnect handling
    metrics/         Prometheus counters and histogram
    db/              sqlc-generated, type-safe query layer
    config/          env loading
  db/migrations/     golang-migrate SQL
frontend/
  src/app/           Next.js App Router, canvas + game UI
  src/hooks/         useGameSocket, useCanvasSync, presence
  src/api/           types generated from backend openapi.yaml
docs/observability.md
benchmarks/          latency, concurrency, reconnect, deploy-time
```

## License

MIT.
