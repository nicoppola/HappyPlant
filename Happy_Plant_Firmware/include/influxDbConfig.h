#ifndef INFLUXD_DB_CONFIG
#define INFLUXD_DB_CONFIG

#include <InfluxDbClient.h>
#include <InfluxDbCloud.h>
#include "config.h"

// InfluxDB 2 server url, e.g. http://192.168.1.48:8086 (Use: InfluxDB UI -> Load Data -> Client Libraries)
#define INFLUXDB_URL "YOUR_INFLUXDB_URL" // e.g. http://192.168.1.177:8086
#define INFLUXDB_TOKEN "YOUR_INFLUXDB_TOKEN"
#define INFLUXDB_ORG "Home"
#define INFLUXDB_BUCKET "happyplant"

// Set timezone string according to https://www.gnu.org/software/libc/manual/html_node/TZ-Variable.html
#define TZ_INFO "CST+6CST,M3.2.0/2,M11.1.0/2"

#define MEASUREMENT "conditions"
#define INFLUXDB_USER "username"
#define INFLUXDB_PASSWORD "password"

// InfluxDB client instance with preconfigured InfluxCloud certificate
InfluxDBClient influxClient(INFLUXDB_URL, INFLUXDB_ORG, INFLUXDB_BUCKET, INFLUXDB_TOKEN, InfluxDbCloud2CACert);


#endif