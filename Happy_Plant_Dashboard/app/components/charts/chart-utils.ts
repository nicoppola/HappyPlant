import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

export interface DataPoint {
  time: string;
  temperature: number | null;
  humidity: number | null;
}

export type HistoryData = Record<string, DataPoint[]>;

export const RANGES = ["1h", "24h", "7d", "30d"] as const;
export type Range = (typeof RANGES)[number];

export const LOCATION_ORDER = ["bedroom", "office", "diningroom"] as const;

export function formatLocation(loc: string): string {
  if (loc === "diningroom") return "Dining Room";
  return loc.charAt(0).toUpperCase() + loc.slice(1);
}

export function formatTimeLabel(time: string, range: Range): string {
  const d = new Date(time);
  if (range === "1h" || range === "24h") {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function hexToRgba(hex: string, alpha: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r)) return `rgba(128, 128, 128, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getLocationColors() {
  const fallback = {
    bedroom: { line: "#6366f1", fill: "rgba(99,102,241,0.1)" },
    office: { line: "#f59e0b", fill: "rgba(245,158,11,0.1)" },
    diningroom: { line: "#10b981", fill: "rgba(16,185,129,0.1)" },
  };
  if (typeof window === "undefined") return fallback;
  return {
    bedroom: {
      line: getCSSVar("--accent-bedroom") || fallback.bedroom.line,
      fill: hexToRgba(getCSSVar("--accent-bedroom") || fallback.bedroom.line, 0.1),
    },
    office: {
      line: getCSSVar("--accent-office") || fallback.office.line,
      fill: hexToRgba(getCSSVar("--accent-office") || fallback.office.line, 0.1),
    },
    diningroom: {
      line: getCSSVar("--accent-diningroom") || fallback.diningroom.line,
      fill: hexToRgba(getCSSVar("--accent-diningroom") || fallback.diningroom.line, 0.1),
    },
  };
}

export function getChartColors() {
  return {
    grid: getCSSVar("--chart-grid") || "rgba(0,0,0,0.04)",
    tick: getCSSVar("--chart-tick") || "#6b7280",
  };
}

export function getSortedTimes(data: HistoryData): string[] {
  const allTimes = new Set<string>();
  Object.values(data).forEach((points) =>
    points.forEach((p) => allTimes.add(p.time))
  );
  return [...allTimes].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
}
