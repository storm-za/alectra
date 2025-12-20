/**
 * CHRISTMAS THEME COMPONENT
 * 
 * To remove the Christmas theme after December:
 * 1. In App.tsx, remove the import: import ChristmasTheme from "@/components/ChristmasTheme";
 * 2. In App.tsx, remove the component: <ChristmasTheme />
 * 3. Optionally delete this file and client/src/styles/christmas-theme.css
 */

import { useEffect, useState } from "react";
import "@/styles/christmas-theme.css";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
  size: number;
}

export default function ChristmasTheme() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    const numFlakes = 30;

    for (let i = 0; i < numFlakes; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 8 + Math.random() * 12,
        animationDelay: Math.random() * 8,
        opacity: 0.3 + Math.random() * 0.4,
        size: 3 + Math.random() * 5,
      });
    }

    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <div className="christmas-snowfall" aria-hidden="true">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="christmas-snowflake"
            style={{
              left: `${flake.left}%`,
              animationDuration: `${flake.animationDuration}s`,
              animationDelay: `${flake.animationDelay}s`,
              opacity: flake.opacity,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
            }}
          />
        ))}
      </div>
      <div className="christmas-corner-decoration christmas-corner-top-left" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="christmas-ornament">
          <circle cx="20" cy="30" r="8" fill="#dc2626" opacity="0.6" />
          <circle cx="35" cy="15" r="6" fill="#16a34a" opacity="0.5" />
          <circle cx="50" cy="35" r="5" fill="#fbbf24" opacity="0.5" />
        </svg>
      </div>
      <div className="christmas-corner-decoration christmas-corner-top-right" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="christmas-ornament">
          <circle cx="80" cy="30" r="8" fill="#16a34a" opacity="0.6" />
          <circle cx="65" cy="15" r="6" fill="#dc2626" opacity="0.5" />
          <circle cx="50" cy="35" r="5" fill="#fbbf24" opacity="0.5" />
        </svg>
      </div>
    </>
  );
}
