package api

import (
	"encoding/json"
	"log"
	"net/http"

	"happyplant-server/internal/influx"
)

type readingRequest struct {
	Location    string   `json:"location"`
	Temperature *float64 `json:"temperature"`
	Humidity    *float64 `json:"humidity"`
}

func IngestHandler(db *influx.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req readingRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		if req.Location == "" || req.Temperature == nil || req.Humidity == nil {
			http.Error(w, "missing required fields: location, temperature, humidity", http.StatusBadRequest)
			return
		}

		if err := db.WriteReading(r.Context(), req.Location, *req.Temperature, *req.Humidity); err != nil {
			log.Printf("failed to write reading: %v", err)
			http.Error(w, "failed to write reading", http.StatusInternalServerError)
			return
		}

		log.Printf("recorded: %s temp=%.1f hum=%.1f", req.Location, *req.Temperature, *req.Humidity)
		w.WriteHeader(http.StatusNoContent)
	}
}
