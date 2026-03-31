"use client";

import { useState } from "react";
import { SourceIcon, getSourceLabel } from "@/components/source-icon";
import type { Source } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import { MessageSquare, RefreshCw, Loader2, Check, AlertCircle } from "lucide-react";

interface SourceCardProps {
  source: Source;
  promptCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; dot: string; label: string }> = {
    connected: { bg: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400", label: "Connected" },
    active: { bg: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400", label: "Active" },
    idle: { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-400", label: "Idle" },
  };
  const c = config[status] ?? config.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function SourceCard({ source, promptCount }: SourceCardProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: source.type }),
      });
      const data = await res.json();
      if (data.error) {
        setScanResult({ type: "error", message: data.error });
      } else if (data.promptsIngested > 0) {
        setScanResult({ type: "success", message: `${data.promptsIngested} prompts from ${data.projectsFound} projects` });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setScanResult({ type: "success", message: "No new prompts found" });
      }
    } catch (err) {
      setScanResult({ type: "error", message: err instanceof Error ? err.message : "Scan failed" });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
            <SourceIcon type={source.type} size="md" />
          </div>
          <div>
            <h3 className="truncate text-sm font-medium text-zinc-100">{source.name}</h3>
            <p className="text-xs text-zinc-500">{getSourceLabel(source.type)}</p>
          </div>
        </div>
        <StatusBadge status={source.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-950 px-3 py-2">
          <p className="text-xs text-zinc-500">Prompts</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-200 flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-zinc-500" />
            {promptCount}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-950 px-3 py-2">
          <p className="text-xs text-zinc-500">Last Scan</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-200">
            {source.lastScannedAt ? formatRelativeDate(source.lastScannedAt) : "Never"}
          </p>
        </div>
      </div>

      {scanResult && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
          scanResult.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {scanResult.type === "success" ? <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {scanResult.message}
        </div>
      )}

      <button
        type="button"
        onClick={handleScan}
        disabled={scanning}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50 mt-auto"
      >
        {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        {scanning ? "Scanning..." : "Scan Now"}
      </button>
    </div>
  );
}
