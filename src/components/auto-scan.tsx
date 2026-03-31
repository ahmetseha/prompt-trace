"use client";

import { useEffect, useRef } from "react";

/**
 * Background auto-scan component.
 * Triggers a rescan every 60 seconds so new prompts show up
 * without manually clicking "Scan Now".
 */
export function AutoScan() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function scan() {
      try {
        for (const src of ["claude-code", "cursor"]) {
          await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceType: src }),
          });
        }
      } catch {
        // Background scan failure is fine
      }
    }

    // Don't scan immediately on mount (CLI already scans on startup)
    intervalRef.current = setInterval(scan, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Invisible component - just runs the interval
  return null;
}
