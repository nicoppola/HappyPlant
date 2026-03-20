"use client";

interface DemoToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export default function DemoToggle({ enabled, onToggle }: DemoToggleProps) {
  function handleClick() {
    onToggle(!enabled);
  }

  return (
    <div className="demo-toggle">
      <div className="toggle-label" onClick={handleClick}>
        <span className="toggle-text">Demo Mode</span>
        <div
          role="switch"
          aria-checked={enabled}
          tabIndex={0}
          className={`toggle-switch ${enabled ? "on" : ""}`}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") handleClick();
          }}
        >
          <span className="toggle-knob" />
        </div>
      </div>
    </div>
  );
}
