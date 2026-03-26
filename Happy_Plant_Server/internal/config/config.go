package config

import "os"

type Config struct {
	InfluxURL    string
	InfluxToken  string
	InfluxOrg    string
	InfluxBucket string
	Port         string
	StaticDir    string
}

func Load() Config {
	return Config{
		InfluxURL:    getEnv("INFLUXDB_URL", "http://localhost:8086"),
		InfluxToken:  getEnv("INFLUXDB_TOKEN", ""),
		InfluxOrg:    getEnv("INFLUXDB_ORG", "Home"),
		InfluxBucket: getEnv("INFLUXDB_BUCKET", "happyplant"),
		Port:         getEnv("PORT", "8080"),
		StaticDir:    getEnv("STATIC_DIR", "./static"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
