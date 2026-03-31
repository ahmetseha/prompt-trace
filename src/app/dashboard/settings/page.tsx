"use client";

import {
  Database,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Bug,
  Info,
  FolderOpen,
  Clock,
  EyeOff,
  Layers,
  Brain,
  Gauge,
  Moon,
  Sun,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

function DataManagement() {
  const [dbInfo, setDbInfo] = useState<{
    dbSizeFormatted: string;
    counts: { prompts: number; sessions: number; projects: number; sources: number };
  } | null>(null);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) setDbInfo(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  async function handleClear() {
    if (!confirm("This will permanently delete all scanned data. Continue?")) return;
    setClearing(true);
    try {
      await fetch("/api/data", { method: "DELETE" });
      await loadInfo();
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
      <FieldRow label="Database Size" description="Current size of the local database.">
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
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export Data as JSON
        </button>
        <button type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700">
          <Upload className="h-3.5 w-3.5" />
          Import Data
        </button>
        <button type="button" onClick={handleClear} disabled={clearing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50">
          {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Clear All Data
        </button>
      </div>
    </>
  );
}

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
      <div className="sm:w-64">{children}</div>
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center"
    >
      {enabled ? (
        <ToggleRight className="h-6 w-6 text-emerald-400" />
      ) : (
        <ToggleLeft className="h-6 w-6 text-zinc-600" />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const [demoMode, setDemoMode] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);
  const [autoScan, setAutoScan] = useState("disabled");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [maxDepth, setMaxDepth] = useState("10");
  const [classificationMethod, setClassificationMethod] =
    useState("rule-based");
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  const inputClasses =
    "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600 transition-colors";
  const selectClasses =
    "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600 transition-colors appearance-none";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure PromptTrace preferences and behavior.
        </p>
      </div>

      {/* General Settings */}
      <Section title="General" description="Core application settings.">
        <FieldRow
          label="Data Directory"
          description="Path to the SQLite database file."
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              type="text"
              readOnly
              value="./data/prompttrace.db"
              className={`${inputClasses} cursor-default text-zinc-500`}
            />
          </div>
        </FieldRow>

        <FieldRow
          label="Demo Mode"
          description="Use sample data instead of real sources."
        >
          <Toggle enabled={demoMode} onToggle={() => setDemoMode(!demoMode)} />
        </FieldRow>

        <FieldRow label="Theme" description="Switch between dark and light.">
          <button
            type="button"
            onClick={() => setDarkTheme(!darkTheme)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600"
          >
            {darkTheme ? (
              <>
                <Moon className="h-3.5 w-3.5 text-zinc-400" />
                Dark
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-yellow-400" />
                Light
              </>
            )}
          </button>
        </FieldRow>
      </Section>

      {/* Scan Settings */}
      <Section
        title="Scan Settings"
        description="Control how PromptTrace discovers prompts."
      >
        <FieldRow
          label="Auto-Scan Interval"
          description="How often to automatically scan sources."
        >
          <select
            value={autoScan}
            onChange={(e) => setAutoScan(e.target.value)}
            className={selectClasses}
          >
            <option value="disabled">Disabled</option>
            <option value="1h">Every hour</option>
            <option value="6h">Every 6 hours</option>
            <option value="daily">Daily</option>
          </select>
        </FieldRow>

        <FieldRow
          label="Include Hidden Files"
          description="Scan hidden directories like .cursor or .claude."
        >
          <Toggle
            enabled={includeHidden}
            onToggle={() => setIncludeHidden(!includeHidden)}
          />
        </FieldRow>

        <FieldRow
          label="Max Scan Depth"
          description="Maximum directory depth to traverse."
        >
          <input
            type="number"
            min={1}
            max={50}
            value={maxDepth}
            onChange={(e) => setMaxDepth(e.target.value)}
            className={inputClasses}
          />
        </FieldRow>
      </Section>

      {/* Classification Settings */}
      <Section
        title="Classification"
        description="Configure how prompts are categorized."
      >
        <FieldRow
          label="Method"
          description="Algorithm used for prompt classification."
        >
          <select
            value={classificationMethod}
            onChange={(e) => setClassificationMethod(e.target.value)}
            className={selectClasses}
          >
            <option value="rule-based">Rule-based</option>
            <option value="custom">Custom</option>
          </select>
        </FieldRow>

        <FieldRow
          label="Confidence Threshold"
          description="Minimum confidence to apply a classification."
        >
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={confidenceThreshold}
              onChange={(e) =>
                setConfidenceThreshold(Number(e.target.value))
              }
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-zinc-100"
            />
            <span className="w-10 text-right text-sm text-zinc-400">
              {confidenceThreshold}%
            </span>
          </div>
        </FieldRow>
      </Section>

      {/* Data Management */}
      <Section
        title="Data Management"
        description="Manage your PromptTrace database."
      >
        <DataManagement />
      </Section>

      {/* About */}
      <Section title="About" description="PromptTrace application info.">
        <FieldRow label="Version">
          <span className="text-sm text-zinc-400">0.1.0</span>
        </FieldRow>

        <FieldRow label="License">
          <span className="text-sm text-zinc-400">MIT</span>
        </FieldRow>

        <div className="flex gap-3 pt-2">
          <a
            href="https://github.com/prompttrace/prompttrace"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on GitHub
          </a>
          <a
            href="https://github.com/prompttrace/prompttrace/issues/new"
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
