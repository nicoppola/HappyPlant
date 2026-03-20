import { NextRequest, NextResponse } from "next/server";
import { getQueryApi, bucket } from "@/app/lib/influx";
import { getDemoHistory } from "@/app/lib/demo-data";

export const dynamic = "force-dynamic";

const VALID_RANGES: Record<string, { flux: string; window: string }> = {
  "1h": { flux: "-1h", window: "1m" },
  "24h": { flux: "-24h", window: "15m" },
  "7d": { flux: "-7d", window: "1h" },
  "30d": { flux: "-30d", window: "6h" },
};

interface DataPoint {
  time: string;
  temperature: number | null;
  humidity: number | null;
}

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "24h";
  const config = VALID_RANGES[range];

  if (!config) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const isDemo =
    process.env.DEMO_MODE === "true" ||
    request.nextUrl.searchParams.get("demo") === "true";
  if (isDemo) {
    return NextResponse.json(getDemoHistory(range));
  }

  const query = `
    from(bucket: "${bucket}")
      |> range(start: ${config.flux})
      |> filter(fn: (r) => r["_measurement"] == "conditions")
      |> filter(fn: (r) => r["location"] == "bedroom" or r["location"] == "office" or r["location"] == "diningroom")
      |> filter(fn: (r) => r["_field"] == "humidity" or r["_field"] == "temperature")
      |> aggregateWindow(every: ${config.window}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  try {
    const data = new Map<string, DataPoint[]>();
    const queryApi = getQueryApi();

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          const loc = o.location as string;

          if (!data.has(loc)) {
            data.set(loc, []);
          }

          const points = data.get(loc)!;
          const time = o._time as string;

          // Find or create the data point for this timestamp
          let point = points.find((p) => p.time === time);
          if (!point) {
            point = { time, temperature: null, humidity: null };
            points.push(point);
          }

          if (o._field === "temperature") {
            point.temperature = Math.round(o._value * 10) / 10;
          } else if (o._field === "humidity") {
            point.humidity = Math.round(o._value * 10) / 10;
          }
        },
        error: reject,
        complete: resolve,
      });
    });

    // Sort each location's data by time
    const result: Record<string, DataPoint[]> = {};
    for (const [loc, points] of data) {
      result[loc] = points.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("InfluxDB history query failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 502 }
    );
  }
}
