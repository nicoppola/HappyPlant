package api

import (
	"encoding/json"
	"log"
	"net/http"

	"happyplant-server/internal/influx"
)

func CurrentHandler(db *influx.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if r.URL.Query().Get("demo") == "true" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(getDemoCurrentReadings())
			return
		}

		readings, err := db.QueryCurrent(r.Context())
		if err != nil {
			log.Printf("current query failed: %v", err)
			http.Error(w, "failed to fetch current readings", http.StatusBadGateway)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(readings)
	}
}
