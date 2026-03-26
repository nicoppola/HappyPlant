package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"happyplant-server/internal/api"
	"happyplant-server/internal/config"
	"happyplant-server/internal/influx"
)

func main() {
	cfg := config.Load()

	db := influx.NewClient(cfg)
	defer db.Close()

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/readings", api.IngestHandler(db))
	mux.HandleFunc("/api/current", api.CurrentHandler(db))
	mux.HandleFunc("/api/history", api.HistoryHandler(db))

	// Static dashboard files
	if info, err := os.Stat(cfg.StaticDir); err == nil && info.IsDir() {
		fs := http.FileServer(http.Dir(cfg.StaticDir))
		mux.Handle("/", fs)
		log.Printf("serving dashboard from %s", cfg.StaticDir)
	} else {
		log.Printf("static dir %s not found, skipping dashboard serving", cfg.StaticDir)
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "dashboard not deployed", http.StatusNotFound)
		})
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("happyplant server starting on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
