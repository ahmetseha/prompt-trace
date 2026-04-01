import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function AutoScan() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function scan() {
      try {
        // Discover available sources dynamically
        const discRes = await fetch("/api/ingest");
        const discData = await discRes.json();
        const sources = (discData.sources || discData || [])
          .filter((s: { available: boolean }) => s.available)
          .map((s: { adapterId: string }) => s.adapterId);

        for (const src of sources) {
          await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceType: src }),
          });
        }
        queryClient.invalidateQueries();
      } catch {
        // Background scan failure is fine
      }
    }

    intervalRef.current = setInterval(scan, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [queryClient]);

  return null;
}
