package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/barry-saaun/skribble-scrab/backend/internal/config"
	"github.com/barry-saaun/skribble-scrab/backend/internal/room"
	"github.com/barry-saaun/skribble-scrab/backend/internal/ws"
	"github.com/joho/godotenv"
)

var cfg config.Config

func main() {
	// Load .env.local from repo root (silently ignored if absent — e.g. in production)
	_ = godotenv.Load("../../.env.local")

	cfg = config.Load()

	mux := http.NewServeMux()

	roomManager := room.NewRoomManager()
	roomHandler := room.NewRoomHandler(roomManager)
	room.RegisterRoutes(mux, roomHandler)

	wsHandler := ws.NewHandler(roomManager, cfg)
	ws.RegisterRoutes(mux, wsHandler)

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
		})
	})

	log.Printf("server running on :%s\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, corsMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", cfg.FrontendURL)
		w.Header().Set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, PATCH, DELETE, OPTIONS",
		)
		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
