package influx

import (
	"context"
	"fmt"
	"math"
	"time"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"

	"happyplant-server/internal/config"
)

type Client struct {
	client   influxdb2.Client
	writeAPI api.WriteAPIBlocking
	queryAPI api.QueryAPI
	bucket   string
	org      string
}

type Reading struct {
	Location    string   `json:"location"`
	Temperature *float64 `json:"temperature"`
	Humidity    *float64 `json:"humidity"`
	Timestamp   *string  `json:"timestamp"`
}

type DataPoint struct {
	Time        string   `json:"time"`
	Temperature *float64 `json:"temperature"`
	Humidity    *float64 `json:"humidity"`
}

func NewClient(cfg config.Config) *Client {
	c := influxdb2.NewClient(cfg.InfluxURL, cfg.InfluxToken)
	return &Client{
		client:   c,
		writeAPI: c.WriteAPIBlocking(cfg.InfluxOrg, cfg.InfluxBucket),
		queryAPI: c.QueryAPI(cfg.InfluxOrg),
		bucket:   cfg.InfluxBucket,
		org:      cfg.InfluxOrg,
	}
}

func (c *Client) Close() {
	c.client.Close()
}

// WriteReading writes a single sensor reading to InfluxDB.
func (c *Client) WriteReading(ctx context.Context, location string, temperature, humidity float64) error {
	p := influxdb2.NewPointWithMeasurement("conditions").
		AddTag("location", location).
		AddField("temperature", temperature).
		AddField("humidity", humidity).
		SetTime(time.Now())
	return c.writeAPI.WritePoint(ctx, p)
}

// QueryCurrent returns the latest reading for each location from the past hour.
func (c *Client) QueryCurrent(ctx context.Context) ([]Reading, error) {
	query := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: -1h)
			|> filter(fn: (r) => r["_measurement"] == "conditions")
			|> filter(fn: (r) => r["location"] == "bedroom" or r["location"] == "office" or r["location"] == "diningroom")
			|> filter(fn: (r) => r["_field"] == "humidity" or r["_field"] == "temperature")
			|> last()
	`, c.bucket)

	result, err := c.queryAPI.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("influx query failed: %w", err)
	}

	readings := make(map[string]*Reading)
	for result.Next() {
		record := result.Record()
		values := record.Values()

		loc, _ := values["location"].(string)
		if loc == "" {
			continue
		}

		r, ok := readings[loc]
		if !ok {
			r = &Reading{Location: loc}
			readings[loc] = r
		}

		field, _ := values["_field"].(string)
		val, _ := record.Value().(float64)
		rounded := math.Round(val*10) / 10

		switch field {
		case "temperature":
			r.Temperature = &rounded
		case "humidity":
			r.Humidity = &rounded
		}

		t := record.Time().Format(time.RFC3339)
		r.Timestamp = &t
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("influx row iteration failed: %w", err)
	}

	out := make([]Reading, 0, len(readings))
	for _, r := range readings {
		out = append(out, *r)
	}
	return out, nil
}

// QueryHistory returns aggregated historical data for each location.
func (c *Client) QueryHistory(ctx context.Context, fluxRange, window string) (map[string][]DataPoint, error) {
	query := fmt.Sprintf(`
		from(bucket: "%s")
			|> range(start: %s)
			|> filter(fn: (r) => r["_measurement"] == "conditions")
			|> filter(fn: (r) => r["location"] == "bedroom" or r["location"] == "office" or r["location"] == "diningroom")
			|> filter(fn: (r) => r["_field"] == "humidity" or r["_field"] == "temperature")
			|> aggregateWindow(every: %s, fn: mean, createEmpty: false)
			|> yield(name: "mean")
	`, c.bucket, fluxRange, window)

	result, err := c.queryAPI.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("influx query failed: %w", err)
	}

	data := make(map[string]map[string]*DataPoint) // location -> time -> point

	for result.Next() {
		record := result.Record()
		values := record.Values()

		loc, _ := values["location"].(string)
		if loc == "" {
			continue
		}

		t := record.Time().Format(time.RFC3339)
		field, _ := values["_field"].(string)
		val, _ := record.Value().(float64)
		rounded := math.Round(val*10) / 10

		if data[loc] == nil {
			data[loc] = make(map[string]*DataPoint)
		}

		dp, ok := data[loc][t]
		if !ok {
			dp = &DataPoint{Time: t}
			data[loc][t] = dp
		}

		switch field {
		case "temperature":
			dp.Temperature = &rounded
		case "humidity":
			dp.Humidity = &rounded
		}
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("influx row iteration failed: %w", err)
	}

	// Convert maps to sorted slices
	out := make(map[string][]DataPoint)
	for loc, points := range data {
		slice := make([]DataPoint, 0, len(points))
		for _, dp := range points {
			slice = append(slice, *dp)
		}
		// Sort by time
		sortDataPoints(slice)
		out[loc] = slice
	}

	return out, nil
}

func sortDataPoints(points []DataPoint) {
	for i := 1; i < len(points); i++ {
		for j := i; j > 0 && points[j].Time < points[j-1].Time; j-- {
			points[j], points[j-1] = points[j-1], points[j]
		}
	}
}
