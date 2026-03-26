package api

import (
	"math"
	"time"
)

var locations = []string{"bedroom", "office", "diningroom"}

var baseValues = map[string]struct{ temp, humidity float64 }{
	"bedroom":    {71, 42},
	"office":     {74, 38},
	"diningroom": {69, 46},
}

func noise(seed, amplitude float64) float64 {
	x := math.Sin(seed*127.1+seed*311.7) * 43758.5453
	return (x - math.Floor(x) - 0.5) * 2 * amplitude
}

func diurnal(t time.Time, amplitude float64) float64 {
	hour := float64(t.Hour()) + float64(t.Minute())/60.0
	return math.Sin(((hour-5)/24)*math.Pi*2) * amplitude
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}

type demoCurrentReading struct {
	Location    string  `json:"location"`
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
	Timestamp   string  `json:"timestamp"`
}

func getDemoCurrentReadings() []demoCurrentReading {
	now := time.Now()
	min := float64(now.Minute())
	out := make([]demoCurrentReading, len(locations))
	for i, loc := range locations {
		b := baseValues[loc]
		out[i] = demoCurrentReading{
			Location:    loc,
			Temperature: round1(b.temp + diurnal(now, 3) + noise(min, 1)),
			Humidity:    round1(b.humidity + noise(min+100, 3)),
			Timestamp:   now.UTC().Format(time.RFC3339),
		}
	}
	return out
}

type demoDataPoint struct {
	Time        string  `json:"time"`
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
}

var rangePoints = map[string]struct{ count, stepMs int }{
	"1h":  {60, 60_000},
	"24h": {96, 15 * 60_000},
	"7d":  {168, 60 * 60_000},
	"30d": {120, 6 * 60 * 60_000},
}

func getDemoHistory(rangeKey string) map[string][]demoDataPoint {
	cfg, ok := rangePoints[rangeKey]
	if !ok {
		cfg = rangePoints["24h"]
	}
	now := time.Now().UnixMilli()
	result := make(map[string][]demoDataPoint)

	for li, loc := range locations {
		points := make([]demoDataPoint, cfg.count)
		b := baseValues[loc]
		for i := 0; i < cfg.count; i++ {
			t := time.UnixMilli(now - int64(cfg.count-1-i)*int64(cfg.stepMs))
			points[i] = demoDataPoint{
				Time:        t.UTC().Format(time.RFC3339),
				Temperature: round1(b.temp + diurnal(t, 3) + noise(float64(i*7+li*1000), 1.5)),
				Humidity:    round1(b.humidity + noise(float64(i*13+li*2000), 4)),
			}
		}
		result[loc] = points
	}
	return result
}
