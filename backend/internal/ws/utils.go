package ws

import (
	"encoding/json"
	"net/http"
)

type ErrorPayload struct {
	Code string `json:"code"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErrorCode(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, ErrorPayload{Code: code})
}
