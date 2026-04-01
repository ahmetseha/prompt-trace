import {
  Database,
  Download,
  Trash2,
  ExternalLink,
  Bug,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="shrink-0">
        <p className="text-sm text-zinc-300">{label}</p>
        {description && (
          <p className="text-xs text-zinc-500">{description}</p>
        )}
      </div>
      <div className="sm:w-72">{children}</div>
    </div>
  );
}

function DataManagement() {
  const [dbInfo, setDbInfo] = useState<{
    dbSizeFormatted: string;
    counts: { prompts: number; sessions: number; projects: number; sources: number };
  } | null>(null);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) setDbInfo(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  async function handleScanAll() {
    setScanning(true);
    setScanResult(null);
    let total = 0;
    for (const src of ["claude-code", "cursor"]) {
      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceType: src }),
        });
        const data = await res.json();
        total += data.promptsIngested || 0;
      } catch { /* skip */ }
    }
    setScanResult(total > 0 ? `${total} prompts ingested` : "No new prompts found");
    await loadInfo();
    setScanning(false);
  }

  async function handleClear() {
    if (!confirm("This will permanently delete all scanned data. You will need to rescan your sources. Continue?")) return;
    setClearing(true);
    try {
      await fetch("/api/data", { method: "DELETE" });
      await loadInfo();
      setScanResult(null);
    } finally {
      setClearing(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/prompts?limit=10000");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompttrace-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <FieldRow label="Database" description="Local SQLite database.">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate text-sm text-zinc-500">~/.prompttrace/data/prompttrace.db</span>
        </div>
      </FieldRow>

      <FieldRow label="Size" description="Current database size.">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-300">{dbInfo?.dbSizeFormatted ?? "..."}</span>
        </div>
      </FieldRow>

      {dbInfo && (
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(dbInfo.counts).map(([key, val]) => (
            <div key={key} className="rounded-lg bg-zinc-950 px-3 py-2 text-center">
              <p className="text-lg font-semibold text-zinc-200">{val}</p>
              <p className="text-[11px] text-zinc-500 capitalize">{key}</p>
            </div>
          ))}
        </div>
      )}

      {scanResult && (
        <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          {scanResult}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={handleScanAll} disabled={scanning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50">
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Scan All Sources
        </button>
        <button type="button" onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export as JSON
        </button>
        <button type="button" onClick={handleClear} disabled={clearing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900 disabled:opacity-50">
          {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Clear All Data
        </button>
      </div>
    </>
  );
}

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your data and application preferences.
        </p>
      </div>

      <Section
        title="Data Management"
        description="Scan sources, export data, or clear the database."
      >
        <DataManagement />
      </Section>

      <Section title="About" description="PromptTrace application info.">
        <FieldRow label="Version">
          <span className="text-sm text-zinc-400">0.3.0</span>
        </FieldRow>

        <FieldRow label="Classification">
          <span className="text-sm text-zinc-400">Rule-based (14 categories, 8 intents)</span>
        </FieldRow>

        <FieldRow label="Supported Sources">
          <span className="text-sm text-zinc-400">Claude Code, Cursor, Codex CLI</span>
        </FieldRow>

        <FieldRow label="License">
          <span className="text-sm text-zinc-400">MIT</span>
        </FieldRow>

        <div className="flex gap-3 pt-2">
          <a
            href="https://github.com/ahmetseha/prompt-trace"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on GitHub
          </a>
          <a
            href="https://github.com/ahmetseha/prompt-trace/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <Bug className="h-3.5 w-3.5" />
            Report an Issue
          </a>
        </div>
      </Section>
    </div>
  );
}
