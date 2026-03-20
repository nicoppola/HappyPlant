"use client";

import { useState, useEffect, useCallback } from "react";
import { RANGES, type Range, type HistoryData } from "./charts/chart-utils";
import RoomTabsChart from "./charts/RoomTabsChart";

interface Props {
  demo: boolean;
}

export default function HistoryChart({ demo }: Props) {
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const fetchHistory = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ range: r });
      if (demo) params.set("demo", "true");
      const res = await fetch(`/api/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      setError("Could not load historical data");
    } finally {
      setLoading(false);
    }
  }, [demo]);

  useEffect(() => {
    fetchHistory(range);
  }, [range, fetchHistory]);

  // Re-render chart when dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => setChartKey((k) => k + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h2>History</h2>
        <div className="range-buttons">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`range-btn ${r === range ? "active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="loading">Loading chart data...</div>
      ) : data ? (
        <RoomTabsChart data={data} range={range} chartKey={chartKey} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />
      ) : null}
    </div>
  );
}
