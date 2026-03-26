package api

import (
	"encoding/json"
	"log"
	"net/http"

	"happyplant-server/internal/influx"
)

var validRanges = map[string]struct{ flux, window string }{
	"1h":  {"-1h", "1m"},
	"24h": {"-24h", "15m"},
	"7d":  {"-7d", "1h"},
	"30d": {"-30d", "6h"},
}

func HistoryHandler(db *influx.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		rangeKey := r.URL.Query().Get("range")
		if rangeKey == "" {
			rangeKey = "24h"
		}

		cfg, ok := validRanges[rangeKey]
		if !ok {
			http.Error(w, "invalid range; use 1h, 24h, 7d, or 30d", http.StatusBadRequest)
			return
		}

		data, err := db.QueryHistory(r.Context(), cfg.flux, cfg.window)
		if err != nil {
			log.Printf("history query failed: %v", err)
			http.Error(w, "failed to fetch historical data", http.StatusBadGateway)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}
