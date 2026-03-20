import { InfluxDB } from "@influxdata/influxdb-client";

const url = process.env.INFLUXDB_URL!;
const token = process.env.INFLUXDB_TOKEN!;
const org = process.env.INFLUXDB_ORG!;
const bucket = process.env.INFLUXDB_BUCKET!;

const client = new InfluxDB({ url, token });

export function getQueryApi() {
  return client.getQueryApi(org);
}

export { bucket };
