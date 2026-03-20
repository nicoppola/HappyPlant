const LOCATIONS = ["bedroom", "office", "diningroom"] as const;

// Stable base values per room so they feel distinct
const BASE: Record<string, { temp: number; humidity: number }> = {
  bedroom: { temp: 71, humidity: 42 },
  office: { temp: 74, humidity: 38 },
  diningroom: { temp: 69, humidity: 46 },
};

// Seeded-ish random that's deterministic per index so charts don't jump on re-render
function noise(seed: number, amplitude: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amplitude;
}

// Gentle sine wave to simulate day/night temperature swings
function diurnal(date: Date, amplitude: number): number {
  const hour = date.getHours() + date.getMinutes() / 60;
  // Peaks around 3pm (hour 15), coolest around 5am (hour 5)
  return Math.sin(((hour - 5) / 24) * Math.PI * 2) * amplitude;
}

export function getDemoCurrentReadings() {
  const now = new Date();
  return LOCATIONS.map((loc) => ({
    location: loc,
    temperature:
      Math.round((BASE[loc].temp + diurnal(now, 3) + noise(now.getMinutes(), 1)) * 10) / 10,
    humidity:
      Math.round((BASE[loc].humidity + noise(now.getMinutes() + 100, 3)) * 10) / 10,
    timestamp: now.toISOString(),
  }));
}

const RANGE_POINTS: Record<string, { count: number; stepMs: number }> = {
  "1h": { count: 60, stepMs: 60_000 },
  "24h": { count: 96, stepMs: 15 * 60_000 },
  "7d": { count: 168, stepMs: 60 * 60_000 },
  "30d": { count: 120, stepMs: 6 * 60 * 60_000 },
};

export function getDemoHistory(range: string) {
  const config = RANGE_POINTS[range] || RANGE_POINTS["24h"];
  const now = Date.now();
  const result: Record<string, { time: string; temperature: number; humidity: number }[]> = {};

  for (const loc of LOCATIONS) {
    const points = [];
    for (let i = 0; i < config.count; i++) {
      const time = new Date(now - (config.count - 1 - i) * config.stepMs);
      points.push({
        time: time.toISOString(),
        temperature:
          Math.round((BASE[loc].temp + diurnal(time, 3) + noise(i * 7 + LOCATIONS.indexOf(loc) * 1000, 1.5)) * 10) / 10,
        humidity:
          Math.round((BASE[loc].humidity + noise(i * 13 + LOCATIONS.indexOf(loc) * 2000, 4)) * 10) / 10,
      });
    }
    result[loc] = points;
  }

  return result;
}
