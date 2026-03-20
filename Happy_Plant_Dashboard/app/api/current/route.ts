import { NextRequest, NextResponse } from "next/server";
import { getQueryApi, bucket } from "@/app/lib/influx";
import { getDemoCurrentReadings } from "@/app/lib/demo-data";

export const dynamic = "force-dynamic";

interface Reading {
  location: string;
  temperature: number | null;
  humidity: number | null;
  timestamp: string | null;
}

export async function GET(request: NextRequest) {
  const isDemo =
    process.env.DEMO_MODE === "true" ||
    request.nextUrl.searchParams.get("demo") === "true";
  if (isDemo) {
    return NextResponse.json(getDemoCurrentReadings());
  }

  const query = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "conditions")
      |> filter(fn: (r) => r["location"] == "bedroom" or r["location"] == "office" or r["location"] == "diningroom")
      |> filter(fn: (r) => r["_field"] == "humidity" or r["_field"] == "temperature")
      |> last()
  `;

  try {
    const readings = new Map<string, Reading>();
    const queryApi = getQueryApi();

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          const loc = o.location as string;

          if (!readings.has(loc)) {
            readings.set(loc, {
              location: loc,
              temperature: null,
              humidity: null,
              timestamp: null,
            });
          }

          const reading = readings.get(loc)!;
          if (o._field === "temperature") {
            reading.temperature = Math.round(o._value * 10) / 10;
          } else if (o._field === "humidity") {
            reading.humidity = Math.round(o._value * 10) / 10;
          }
          reading.timestamp = o._time;
        },
        error: reject,
        complete: resolve,
      });
    });

    return NextResponse.json([...readings.values()]);
  } catch (err) {
    console.error("InfluxDB query failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch current readings" },
      { status: 502 }
    );
  }
}
