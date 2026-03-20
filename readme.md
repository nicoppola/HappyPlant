#Happy Plant

## pio

## InfluxDb

http://192.168.1.177:8086/
username
password

look here for hue integration example:
https://github.com/home-assistant/android/tree/master/app

Bucket Name: happyplant</br>
Measurement: conditions</br>
tags: location</br>
fields: temperature, humidity</br>

conditions,location=1 temperature="70.5",humidity="45"
conditions,location=0 temperature="70",humidity="40"

conditions,location=1 temperature="70",humidity="44"
conditions,location=0 temperature="68",humidity="39"

conditions,location=1 temperature="67",humidity="43"
conditions,location=0 temperature="65",humidity="38"

conditions,location=1 temperature="72.5",humidity="46"
conditions,location=0 temperature="70",humidity="42"

FLUX:

```
from(bucket: "happyPlantDb")
  |> range(start: -1d)
  |> filter(fn: (r) => r["_measurement"] == "conditions")
  |> filter(fn: (r) => r["location"] == "bedroom")
  |> last()

from(bucket: "happyplant")
  |> range(start: -1d)
  |> filter(fn: (r) => r["_measurement"] == "conditions")
  |> filter(fn: (r) => r["location"] == "0" or r["location"] == "1")
  |> filter(fn: (r) => r["_field"] == "humidity" or r["_field"] == "temperature")
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> drop(columns: ["_start", "_stop"])
```

<br>

### APP:

1. tmp and humidity
2. connect with "backend"
3. settings page - set device w/name
4.

### Compiling protobuf for C with nanopb:

```
protoc \
--plugin=protoc-gen-nanopb=/Users/coppola/nanopb/generator/protoc-gen-nanopb \
--nanopb_out=. *.proto
```

## #Compiling protobuf for Go:

```
go install google.golang.org/protobuf@latest
export GO_PATH=~/go
export PATH=$PATH:/$GO_PATH/bin

protoc --go_out=. proto_bufs.proto
```
