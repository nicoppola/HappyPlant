"use client";

import { useState, useEffect, useCallback } from "react";
import CurrentCard from "./CurrentCard";
import HistoryChart from "./HistoryChart";

interface Reading {
  location: string;
  temperature: number | null;
  humidity: number | null;
  timestamp: string | null;
}

export default function Dashboard({ demo }: { demo: boolean }) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrent = useCallback(async () => {
    try {
      const url = demo ? "/api/current?demo=true" : "/api/current";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReadings(data);
      setError(null);
    } catch {
      setError("Could not connect to sensor data. Is InfluxDB reachable?");
    } finally {
      setLoading(false);
    }
  }, [demo]);

  useEffect(() => {
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 30_000);
    return () => clearInterval(interval);
  }, [fetchCurrent]);

  const order = ["bedroom", "office", "diningroom"];
  const sorted = [...readings].sort(
    (a, b) => order.indexOf(a.location) - order.indexOf(b.location)
  );

  return (
    <>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="loading">Connecting to sensors...</div>
      ) : (
        <div className="cards-grid">
          {sorted.map((r) => (
            <CurrentCard key={r.location} {...r} />
          ))}
        </div>
      )}
      <HistoryChart demo={demo} />
    </>
  );
}
