# Skribble Scrab

A full-stack WebSocket-powered drawing and guessing game inspired by [skribbl.io](https://skribbl.io). Built as a learning project to explore modern web technologies, real-time communication, CI/CD pipelines, and production deployment strategies.

## 🎮 Game Overview

**Skribble Scrab** is a multiplayer drawing game where players take turns sketching while others guess what they're drawing. Perfect for parties, team building, or casual gaming with friends online.

**How it works:**
- Players join a game room
- One player is designated as the "drawer" and receives a word to sketch
- Other players guess the word in real-time as the drawing appears
- Points are awarded for correct guesses and successful drawings
- Rounds rotate through players

## 🛠️ Tech Stack & Learning Focus

This project showcases several important concepts for modern web development:

| Area | Technology | Why It Matters |
|------|-----------|----------------|
| **Real-Time Communication** | WebSocket (Go + gorilla/websocket) | Enables instant drawing updates and live multiplayer gameplay without polling |
| **Backend** | Go 1.25 | High-performance, concurrent handling of multiple game sessions with lightweight goroutines |
| **Database** | PostgreSQL + sqlc | Persistent storage with type-safe SQL queries generated from SQL files |
| **Frontend** | Next.js 16 + React 19 + TailwindCSS | Modern React framework with server/client components and optimized performance |
| **API Contract** | OpenAPI 3.0 + openapi-typescript | **Monorepo benefit**: Auto-generate TypeScript types from backend spec → zero manual type definitions, always in sync |
| **UI Components** | shadcn/ui + Radix UI | Accessible, customizable component library |
| **Monorepo** | Single repository with `/backend` and `/frontend` | Unified API contract, synchronized versioning, shared development lifecycle |
| **CI/CD** | GitHub Actions | Separate workflows for backend and frontend with automated testing and deployment |
| **Deployment** | fly.io | Container-based deployment platform with automatic scaling |
| **Canvas Drawing** | HTML5 Canvas API | Real-time drawing with sub-100ms latency synchronization |

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Git** — for cloning the repository
- **Go 1.18+** — [Download](https://golang.org/dl/)
- **Node.js 16+** — [Download](https://nodejs.org/)
- **PostgreSQL 12+** — [Download](https://www.postgresql.org/download/)
- **Docker** (optional but recommended) — [Download](https://www.docker.com/products/docker-desktop)
- **flyctl** (for deployment) — [Installation guide](https://fly.io/docs/hands-on/install-flyctl/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/skribble-scrab.git
cd skribble-scrab
```

### 2. Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local with your database credentials
# Example:
# DATABASE_URL=postgres://user:password@localhost:5432/skribble_scrab
# CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb skribble_scrab

# Run migrations (from backend directory)
cd backend
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate -path db/migrations -database "postgres://user:password@localhost:5432/skribble_scrab?sslmode=disable" up

# Or use the connection string from .env.local
migrate -path db/migrations -database $DATABASE_URL up
```

### 4. Backend Setup

```bash
# From backend directory
cd backend

# Download Go dependencies
go mod download

# Build the backend (or use hot-reload for development)
go build -o ../bin/server cmd/server/main.go

# For development with hot-reload:
# Requires air: go install github.com/cosmtrek/air@latest
air
```

### 5. Frontend Setup

```bash
# From frontend directory (in new terminal)
cd frontend

# Install Node dependencies
npm install
# or: pnpm install

# Start development server
npm run dev
```

### 6. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **WebSocket**: ws://localhost:8080/ws

## 🌐 Project Structure (Monorepo)

```
skribble-scrab/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # Server entry point & HTTP setup
│   │
│   ├── internal/
│   │   ├── api/                     # HTTP route handlers
│   │   ├── config/
│   │   │   └── config.go            # Configuration loading from env
│   │   ├── db/                      # Database layer (generated via sqlc)
│   │   │   ├── models.go            # Generated DB models
│   │   │   ├── game_results.sql.go  # Generated queries
│   │   │   ├── rooms.sql.go         # Generated queries
│   │   │   └── words.sql.go         # Generated queries
│   │   ├── room/                    # Core game logic
│   │   │   ├── game.go              # Game state and rules
│   │   │   ├── room.go              # Room management
│   │   │   ├── manager.go           # Room lifecycle & creation
│   │   │   ├── drawing.go           # Canvas stroke handling
│   │   │   ├── events.go            # Game event definitions
│   │   │   ├── round.go             # Round state management
│   │   │   ├── types.go             # Room data structures
│   │   │   ├── routes.go            # Room WebSocket routes
│   │   │   └── game-handler.go      # Game message handling
│   │   └── ws/                      # WebSocket infrastructure
│   │       ├── handler.go           # WebSocket upgrade & routing
│   │       ├── client.go            # Individual client connection
│   │       ├── types.go             # WS message structures
│   │       └── utils.go             # Helper functions
│   │
│   ├── db/
│   │   ├── migrations/              # SQL migrations (golang-migrate format)
│   │   │   ├── 001_init.up.sql      # Initial schema (words, game_results)
│   │   │   ├── 002_rooms.up.sql     # Rooms table
│   │   │   └── 003_add_room_config/ # Room configuration columns
│   │   └── queries/                 # SQL query definitions (for sqlc code generation)
│   │       ├── game_results.sql     # Game result queries
│   │       ├── rooms.sql            # Room queries
│   │       └── words.sql            # Word list queries
│   │
│   ├── go.mod & go.sum              # Go dependencies
│   ├── sqlc.yaml                    # SQL code generation configuration
│   ├── Dockerfile                   # Backend container image
│   ├── fly.toml                     # fly.io backend configuration
│   ├── .air.toml                    # Hot-reload development tool config
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # Next.js App Router (file-based routing)
│   │   │   ├── layout.tsx           # Root layout component
│   │   │   ├── page.tsx             # Home/lobby page
│   │   │   ├── room/[roomID]/       # Dynamic game room route
│   │   │   │   └── page.tsx         # Room page component
│   │   │   ├── dev/                 # Dev/debug pages
│   │   │   ├── error/               # Error page handling
│   │   │   ├── components/          # App-specific components
│   │   │   │   ├── Canvas.tsx       # HTML5 Canvas for drawing
│   │   │   │   ├── ChatBox.tsx      # Game chat messaging
│   │   │   │   ├── GuessBox.tsx     # Guess input component
│   │   │   │   ├── PlayersList.tsx  # Active players display
│   │   │   │   ├── PlayersSidebar.tsx
│   │   │   │   ├── RoomHeader.tsx   # Room info header
│   │   │   │   ├── RoomFooter.tsx   # Footer controls
│   │   │   │   ├── Timer.tsx        # Round timer display
│   │   │   │   ├── ScoreBoard.tsx   # Player scores
│   │   │   │   ├── GameEndModal.tsx # End of game modal
│   │   │   │   └── ...
│   │   │   └── globals.css          # Global styles
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   └── ui/                  # shadcn/ui components (button, tooltip, etc.)
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useGameSocket.ts     # WebSocket connection & message handling
│   │   │   ├── useCanvasSync.ts     # Canvas drawing synchronization
│   │   │   ├── usePlayerPresence.ts # Player state tracking
│   │   │   ├── useErrorNotifications.ts
│   │   │   └── useToast.tsx         # Toast notifications (sonner)
│   │   │
│   │   ├── api/                     # Generated API client
│   │   │   ├── client.ts            # Typed API client (generated from openapi.yaml)
│   │   │   └── v1.d.ts              # Generated TypeScript types
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── game.ts              # Game state types
│   │   │   ├── events.ts            # WebSocket event types
│   │   │   ├── server.ts            # Backend response types
│   │   │   └── errors.ts            # Custom error types
│   │   │
│   │   ├── lib/                     # Utility functions
│   │   │   └── utils.ts
│   │   │
│   │   └── env.ts                   # Environment variable validation (zod)
│   │
│   ├── public/                      # Static assets (images, icons, etc.)
│   ├── scripts/                     # Build scripts
│   │   └── generate-api.mjs         # OpenAPI client generation script
│   │
│   ├── package.json & pnpm-lock.yaml # Node.js dependencies
│   ├── next.config.ts               # Next.js configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.ts           # TailwindCSS configuration
│   ├── postcss.config.mjs           # PostCSS configuration
│   ├── components.json              # shadcn/ui configuration
│   ├── Dockerfile                   # Frontend container image
│   ├── fly.toml                     # fly.io frontend configuration
│   ├── openapi.yaml                 # OpenAPI specification for API client generation
│   └── README.md
│
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml       # GitHub Actions: Test & deploy backend to fly.io
│       └── deploy-frontend.yml      # GitHub Actions: Build & deploy frontend to fly.io
│
├── .env.example                     # Environment variables template
├── .gitignore
├── code-organization-guide.md       # Detailed project architecture documentation
└── README.md
```

**Monorepo Benefits:**
- ✅ Single repository for coordinated development
- ✅ Shared environment configuration (`.env.local` used by both services)
- ✅ Independent but synchronized CI/CD pipelines (can deploy each service separately)
- ✅ **Type-safe API contracts**: OpenAPI spec in backend → auto-generated TypeScript types in frontend
- ✅ Frontend types always match backend reality (compiler enforces this)
- ✅ Unified project documentation and organization

## 🏗️ Architecture Highlights

### WebSocket Real-Time Communication

The backend uses Go's `gorilla/websocket` library for efficient real-time events:

```
Player 1 (Drawer) ──┐
                    ├──> WebSocket Handler ──> Room Manager ──> Game Logic
Player 2 (Guesser)──┤         (Go routines)                    ↓
Player 3 (Guesser)──┘                                   Broadcast to all
                                                         clients in room
```

**Core WebSocket Events:**
- `draw` — Broadcast canvas strokes (coordinates, pressure, color) to all players
- `guess` — Player submitted a guess (validated server-side)
- `chat` — Game chat messages with player attribution
- `state` — Full room state updates (player list, scores, round info)
- `round_end` — Signals end of round with results
- `player_join` / `player_leave` — Player presence updates

### Backend Architecture

**Concurrent Connection Handling:**
- Each WebSocket client runs in its own goroutine
- Room manager coordinates state across all clients in a room
- Safe concurrent access via channels and mutexes
- Graceful cleanup on disconnect

**Database Layer:**
- PostgreSQL stores persistent data (game results, room configs, word list)
- SQL queries generated by `sqlc` for type-safe queries
- Migrations managed via `golang-migrate`
- Separate read/write concerns where applicable

**Game State:**
- Room state managed in-memory during active game
- Game results persisted to database at round end
- Player scores calculated server-side (prevents cheating)

### API Contract & Type Safety (Monorepo Pattern)

**The Flow:**
```
Backend (Go)                          Frontend (Next.js/React)
    ↓
Go HTTP handlers with                         
structured responses                         
    ↓                                         
openapi.yaml generated                       
(documents all endpoints)                    
    ↓                                         
                    ✨ Monorepo Magic ✨
                          ↓
                  openapi-typescript reads spec
                          ↓
                  Generates src/api/v1.d.ts
                  (TypeScript type definitions)
                          ↓
                  fetch client gets types
                          ↓
                  All API calls are fully typed
```

**Example:**

*Backend* defines an endpoint that returns:
```go
type GameResult struct {
    Score    int       `json:"score"`
    PlayedAt time.Time `json:"played_at"`
}
```

*Frontend* automatically gets:
```typescript
// Generated in src/api/v1.d.ts
export interface GameResult {
  score: number;
  played_at: string; // ISO 8601
}

// Auto-generated fetch client
const result = await api.GET("/games/{id}/result");
// ✅ result.data is typed as GameResult
// ✅ TypeScript compiler catches field access errors
```

**Benefits in This Monorepo:**
- Backend changes → `openapi.yaml` updates → run `npm run generate:api` → frontend types updated
- No manual type definitions to maintain
- Compiler catches API mismatches instantly
- Self-documenting: type definitions are single source of truth
- Safe refactoring: rename a field, frontend gets compile error immediately

### Frontend Architecture (Next.js)

**Component Structure:**
- Server components for data fetching and layout
- Client components for interactivity (Canvas, Chat, Guessing)
- Custom hooks for complex state logic (useGameSocket, useCanvasSync)

**Type-Safe API Integration (Monorepo Benefit):**
- Backend defines API spec in `openapi.yaml` (auto-generated from code)
- Frontend runs `openapi-typescript` to generate `src/api/v1.d.ts`
- All HTTP requests use auto-generated `fetch` client with full TypeScript types
- **Benefits:**
  - ✅ Zero manual type definitions for API responses/requests
  - ✅ Compiler catches API contract mismatches instantly
  - ✅ Auto-complete in IDE for all API fields
  - ✅ Frontend types always match backend implementation
  - ✅ Refactoring backend API automatically updates frontend types

**Real-Time Sync:**
- WebSocket hook maintains connection lifecycle
- Canvas drawing streamed to server via throttled events
- Incoming events update React state → re-renders affected components

**Styling:**
- TailwindCSS for utility-first styling
- shadcn/ui for accessible, composable components
- Responsive design for mobile and desktop

## 📦 Deployment to fly.io

### Prerequisites

1. Create a [fly.io account](https://fly.io) (free tier available)
2. Install flyctl: `brew install flyctl` (or see [installation docs](https://fly.io/docs/hands-on/install-flyctl/))
3. Authenticate: `flyctl auth login`

### Database Setup on fly.io

```bash
# Create a PostgreSQL database cluster on fly.io
flyctl postgres create --name skribble-scrab-db

# This creates a managed PostgreSQL database and sets DATABASE_URL secret
# Verify the secret was added:
flyctl secrets list
```

### Deploy Backend

```bash
cd backend

# First-time deployment
flyctl launch

# Or configure existing app
flyctl apps create --name skribble-scrab-backend
flyctl postgres attach skribble-scrab-db

# Run migrations on your fly.io database
flyctl ssh console
cd /app && migrate -path db/migrations -database $DATABASE_URL up
exit

# Deploy
flyctl deploy
```

### Deploy Frontend

```bash
cd frontend

# First-time deployment
flyctl launch

# Or configure existing app
flyctl apps create --name skribble-scrab-frontend

# Deploy
flyctl deploy
```

### Configuration Files

**fly.toml** (Backend):
```toml
app = "skribble-scrab-backend"
primary_region = "sjc" # adjust to your region

[build]
  builder = "paketobuildpacks"

[http_service]
  internal_port = 8080
  force_https = true

[[services]]
  protocol = "ws"
  internal_port = 8080
```

**fly.toml** (Frontend):
```toml
app = "skribble-scrab-frontend"
primary_region = "sjc"

[build]
  builder = "paketobuildpacks"

[http_service]
  internal_port = 3000
  force_https = true
```

### Environment Variables

Set secrets on each fly.io app:

**Backend:**
```bash
flyctl secrets set DATABASE_URL=postgres://...
flyctl secrets set CORS_ORIGIN=https://your-frontend-domain.fly.dev
```

**Frontend:**
```bash
flyctl secrets set NEXT_PUBLIC_API_URL=https://your-backend-domain.fly.dev
```

### View Logs & Monitor

```bash
# View live logs
flyctl logs -a skribble-scrab-backend

# SSH into running instance
flyctl ssh console -a skribble-scrab-backend

# Monitor metrics
flyctl status -a skribble-scrab-backend
```

### Deploy Updates

After pushing changes to `main`:

```bash
# Backend
cd backend && flyctl deploy

# Frontend
cd frontend && flyctl deploy

# Or let GitHub Actions handle it automatically
```

## 🔄 CI/CD Pipeline

This project includes GitHub Actions workflows for automated testing and deployment.

**`.github/workflows/deploy-backend.yml`:**
- Triggers on push to `main` or PR to `main`
- Runs Go tests
- Builds Docker image
- Pushes to registry
- Deploys to fly.io (on main only)

**`.github/workflows/deploy-frontend.yml`:**
- Triggers on push to `main` or PR to `main`
- Lints and builds Next.js
- Builds Docker image
- Deploys to fly.io (on main only)

**To enable automatic deployments:**

1. Add fly.io API token to GitHub secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add `FLY_API_TOKEN` with output from: `flyctl auth token`

2. Workflows will now run automatically on every push to `main`

## 🛠️ Development Guide

### Local Backend Development

```bash
cd backend

# With hot-reload (requires air installed)
go install github.com/cosmtrek/air@latest
air

# Or run directly
go run cmd/server/main.go
```

### Local Frontend Development

```bash
cd frontend

# Dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm start
```

### Regenerate API Client (Monorepo Type Safety)

When backend API changes, frontend types must be regenerated. This is where the monorepo shines:

```bash
# 1. Backend developer updates Go API handlers
# 2. Backend generates new openapi.yaml (automated in your build pipeline)
# 3. Frontend developer regenerates TypeScript types:

cd frontend

# This command:
# - Reads backend's openapi.yaml
# - Generates TypeScript types in src/api/v1.d.ts
# - Updates the fetch client with new request/response types
npm run generate:api

# Now TypeScript compiler will catch any mismatches!
# Try using an old API field → instant compiler error

# CI/CD can enforce this: if openapi.yaml changes but v1.d.ts isn't updated, fail the build
```

**Why This Matters in a Monorepo:**
- Backend and frontend evolve together seamlessly
- No manual typing = no type sync bugs
- Catch API breaking changes at compile time, not runtime
- Self-documenting code: types reflect actual backend contracts

### Database Migrations

```bash
cd backend

# Create new migration
migrate create -ext sql -dir db/migrations -seq <migration_name>

# Write SQL in the .up.sql and .down.sql files
# Update db/queries if adding new queries for sqlc generation

# If using sqlc, regenerate:
sqlc generate
```

### Testing

```bash
# Backend tests
cd backend && go test ./...

# Frontend linting
cd frontend && npm run lint
```

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Before making significant changes, please open an issue to discuss the changes.

## 📚 Learning Resources

This project explores several advanced concepts:

- **WebSockets & Real-Time Communication** — [gorilla/websocket](https://pkg.go.dev/github.com/gorilla/websocket)
- **Concurrent Programming in Go** — [Go Concurrency Patterns](https://go.dev/blog/pipelines)
- **Next.js & React** — [Next.js Documentation](https://nextjs.org/docs)
- **Type-Safe API Clients** — [openapi-typescript](https://openapi-ts.dev/) (auto-generate TypeScript types from OpenAPI specs)
- **OpenAPI Specification** — [OpenAPI 3.0 Guide](https://swagger.io/specification/)
- **Database Migrations** — [golang-migrate](https://github.com/golang-migrate/migrate)
- **SQL Code Generation** — [sqlc Documentation](https://sqlc.dev/)
- **Monorepo Best Practices** — [Monorepo.tools](https://monorepo.tools/)
- **CI/CD with GitHub Actions** — [GitHub Actions Docs](https://docs.github.com/en/actions)
- **Container Deployment** — [fly.io Docs](https://fly.io/docs/)
- **WebSocket Canvas Drawing** — [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## ❓ FAQ

**Q: Can I deploy to other platforms?**  
A: Yes! Both services have Dockerfiles and can run on any container platform (Heroku, AWS ECS, Google Cloud Run, etc.). fly.io is just our example.

**Q: How many concurrent players can the server handle?**  
A: Go's lightweight goroutines allow handling thousands of concurrent WebSocket connections efficiently. fly.io auto-scales based on CPU/memory usage. Your bottleneck is likely the database or frontend capacity.

**Q: Is drawing data persisted?**  
A: Currently, drawings exist only during the game session in memory. To persist drawing images, add cloud storage (S3, Cloudinary, etc.) and save canvas snapshots at round end.

**Q: How do I customize the word list?**  
A: Word lists are stored in the PostgreSQL database (populated during migration). You can:
- Manually edit `db/migrations/001_init.up.sql`
- Create a new migration to add words via SQL
- Add an admin API endpoint to manage words dynamically

**Q: Can I run this locally without Docker?**  
A: Yes! Just ensure PostgreSQL is running, set `DATABASE_URL` in `.env.local`, and run:
```bash
cd backend && go run cmd/server/main.go  # Terminal 1
cd frontend && npm run dev                # Terminal 2
```

**Q: How do I debug WebSocket issues?**  
A: Enable detailed logging in your browser console and check backend logs with `flyctl logs`. Use tools like WebSocket-specific browser extensions or Postman for testing.

---

**Questions?** Open an issue on GitHub or start a [discussion](https://github.com/yourusername/skribble-scrab/discussions).

Happy drawing! 🎨
