"use client";

import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import DemoToggle from "./components/DemoToggle";

export default function Home() {
  const [demo, setDemo] = useState(true);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedDark = localStorage.getItem("hp-dark") === "true";
    setDark(savedDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("hp-dark", String(dark));
  }, [dark, mounted]);

  return (
    <div className="container">
      <header>
        <h1>HappyPlant</h1>
        <p>Home Environment Monitor</p>
      </header>
      <div className="toolbar">
        <DemoToggle enabled={demo} onToggle={setDemo} />
        {mounted && (
          <button
            className="dark-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
        )}
      </div>
      <Dashboard demo={demo} />
    </div>
  );
}
