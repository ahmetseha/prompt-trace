import { useState, useEffect } from "react";
import { RefreshCw, Loader2, Check, Terminal, Code, Code2, Cpu, Wind, Zap, Bot, Sparkles, Globe, Bird, Compass, SquareTerminal, Braces } from "lucide-react";

interface DetectedSource {
  adapterId: string;
  name: string;
  available: boolean;
}

export function DiscoverSources({ hasExistingSources }: { hasExistingSources: boolean }) {
  const [sources, setSources] = useState<DetectedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/ingest")
      .then((r) => r.json())
      .then((d) => setSources(d.sources ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleScan(adapterId: string) {
    setScanning(adapterId);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: adapterId }),
      });
      const data = await res.json();
      if (data.promptsIngested > 0) {
        setResults((r) => ({ ...r, [adapterId]: `${data.promptsIngested} prompts ingested` }));
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResults((r) => ({ ...r, [adapterId]: "No prompts found" }));
      }
    } catch {
      setResults((r) => ({ ...r, [adapterId]: "Scan failed" }));
    } finally {
      setScanning(null);
    }
  }

  async function handleScanAll() {
    setScanning("all");
    let total = 0;
    for (const src of sources.filter((s) => s.available)) {
      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceType: src.adapterId }),
        });
        const data = await res.json();
        total += data.promptsIngested || 0;
      } catch { /* skip */ }
    }
    setScanning(null);
    if (total > 0) {
      setResults({ all: `${total} prompts ingested` });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setResults({ all: "No prompts found" });
    }
  }

  const iconMap: Record<string, React.ElementType> = {
    "claude-code": Terminal,
    cursor: Code,
    "cursor-agent": Code,
    "codex-cli": Cpu,
    vscode: Code2,
    "vscode-insiders": Code2,
    windsurf: Wind,
    "windsurf-next": Wind,
    zed: Zap,
    "gemini-cli": Bot,
    "copilot-cli": Sparkles,
    antigravity: Globe,
    opencode: Braces,
    goose: Bird,
    kiro: Compass,
    "command-code": SquareTerminal,
  };

  const available = sources.filter((s) => s.available);
  const unavailable = sources.filter((s) => !s.available);

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            {hasExistingSources ? "Rescan Sources" : "Detected AI Tools"}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {available.length > 0
              ? `${available.length} AI tool${available.length !== 1 ? "s" : ""} detected on this machine.`
              : "No supported AI tools detected."}
          </p>
        </div>
        {available.length > 1 && (
          <button
            onClick={handleScanAll}
            disabled={scanning !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {scanning === "all" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Scan All
          </button>
        )}
      </div>

      {results.all && (
        <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-3.5 w-3.5" />
          {results.all}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {available.map((src) => {
          const Icon = iconMap[src.adapterId] || Terminal;
          return (
            <div key={src.adapterId} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{src.name}</p>
                  {results[src.adapterId] && (
                    <p className="text-[11px] text-emerald-400">{results[src.adapterId]}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleScan(src.adapterId)}
                disabled={scanning !== null}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {scanning === src.adapterId ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Scan
              </button>
            </div>
          );
        })}

        {unavailable.map((src) => {
          const Icon = iconMap[src.adapterId] || Terminal;
          return (
            <div key={src.adapterId} className="flex items-center justify-between rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-4 py-3 opacity-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                  <Icon className="h-4 w-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">{src.name}</p>
                  <p className="text-[11px] text-zinc-600">Not installed</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
