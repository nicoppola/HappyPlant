"use client";

import { Line } from "react-chartjs-2";
import type { TooltipItem } from "chart.js";
import {
  type HistoryData,
  type Range,
  formatLocation,
  formatTimeLabel,
  getLocationColors,
  getChartColors,
  getSortedTimes,
  LOCATION_ORDER,
} from "./chart-utils";

interface Props {
  data: HistoryData;
  range: Range;
  chartKey: number;
  selectedRoom: string | null;
  onSelectRoom: (room: string | null) => void;
}

function SingleFieldChart({
  data,
  range,
  chartKey,
  field,
  label,
  suffix,
  locations,
  showLegend,
}: {
  data: HistoryData;
  range: Range;
  chartKey: number;
  field: "temperature" | "humidity";
  label: string;
  suffix: string;
  locations: string[];
  showLegend: boolean;
}) {
  const sortedTimes = getSortedTimes(
    Object.fromEntries(locations.map((l) => [l, data[l] || []]))
  );
  const colors = getLocationColors();
  const { grid, tick } = getChartColors();

  const chartData = {
    labels: sortedTimes.map((t) => formatTimeLabel(t, range)),
    datasets: locations.map((loc) => {
      const c = colors[loc as keyof typeof colors] || { line: "#888", fill: "rgba(136,136,136,0.1)" };
      const pointMap = new Map((data[loc] || []).map((p) => [p.time, p]));
      return {
        label: formatLocation(loc),
        data: sortedTimes.map((t) => pointMap.get(t)?.[field] ?? null),
        borderColor: c.line,
        backgroundColor: c.fill,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    scales: {
      x: {
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: tick },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: label, color: tick, font: { size: 10 } },
        ticks: { font: { size: 10 }, color: tick, callback: (v: number | string) => `${v}${suffix}` },
        grid: { color: grid },
      },
    },
    plugins: {
      legend: {
        display: showLegend,
        position: "bottom" as const,
        labels: { usePointStyle: true, pointStyle: "circle", padding: 16, color: tick, font: { size: 10 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"line">) =>
            `${ctx.dataset.label ?? ""}: ${ctx.parsed.y}${suffix}`,
        },
      },
    },
  };

  return (
    <div style={{ height: 200 }}>
      <Line key={`${chartKey}-${field}`} data={chartData} options={options} />
    </div>
  );
}

export default function RoomTabsChart({ data, range, chartKey, selectedRoom, onSelectRoom }: Props) {
  const rooms = LOCATION_ORDER.filter((l) => data[l]);
  const locations = selectedRoom ? [selectedRoom] : rooms.map(String);

  return (
    <div>
      <div className="room-tabs">
        <button
          className={`range-btn ${selectedRoom === null ? "active" : ""}`}
          onClick={() => onSelectRoom(null)}
        >
          All Rooms
        </button>
        {rooms.map((room) => (
          <button
            key={room}
            className={`range-btn ${selectedRoom === room ? "active" : ""}`}
            onClick={() => onSelectRoom(room)}
          >
            {formatLocation(room)}
          </button>
        ))}
      </div>
      <div className="stacked-charts">
        <div className="chart-panel-label">Temperature</div>
        <SingleFieldChart
          data={data}
          range={range}
          chartKey={chartKey}
          field="temperature"
          label="Temp (°F)"
          suffix="°F"
          locations={locations}
          showLegend={locations.length > 1}
        />
        <div className="chart-panel-label">Humidity</div>
        <SingleFieldChart
          data={data}
          range={range}
          chartKey={chartKey}
          field="humidity"
          label="Humidity (%)"
          suffix="%"
          locations={locations}
          showLegend={false}
        />
      </div>
    </div>
  );
}
