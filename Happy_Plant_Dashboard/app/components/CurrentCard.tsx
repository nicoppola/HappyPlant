interface CurrentCardProps {
  location: string;
  temperature: number | null;
  humidity: number | null;
  timestamp: string | null;
}

const LOCATION_LABELS: Record<string, string> = {
  bedroom: "Bedroom",
  office: "Office",
  diningroom: "Dining Room",
};

function formatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function CurrentCard({
  location,
  temperature,
  humidity,
  timestamp,
}: CurrentCardProps) {
  return (
    <div className="card" data-location={location}>
      <div className={`card-location ${location}`}>
        {LOCATION_LABELS[location] || location}
      </div>
      <div className="card-readings">
        <div className="reading">
          <span className="reading-value">
            {temperature !== null ? `${temperature}°F` : "--"}
          </span>
          <span className="reading-label">Temperature</span>
        </div>
        <div className="reading">
          <span className="reading-value">
            {humidity !== null ? `${humidity}%` : "--"}
          </span>
          <span className="reading-label">Humidity</span>
        </div>
      </div>
      <div className="card-timestamp">
        {timestamp ? `Updated ${formatTime(timestamp)}` : ""}
      </div>
    </div>
  );
}
