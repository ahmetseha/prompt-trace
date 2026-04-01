import { useState } from "react";
import { useLocation } from "react-router-dom";
import { RefreshCw, Share2, Check, Loader2 } from "lucide-react";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Overview",
    description: "Your AI prompting activity at a glance",
  },
  "/dashboard/prompts": {
    title: "Prompts",
    description: "Search and explore your prompt history",
  },
  "/dashboard/sessions": {
    title: "Sessions",
    description: "Browse AI interaction sessions",
  },
  "/dashboard/projects": {
    title: "Projects",
    description: "Prompt activity by project",
  },
  "/dashboard/templates": {
    title: "Templates",
    description: "Reusable prompt patterns extracted from your history",
  },
  "/dashboard/sources": {
    title: "Sources",
    description: "Connected AI tools and import sources",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure PromptTrace preferences",
  },
};

export function TopBar() {
  const { pathname } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [shared, setShared] = useState(false);

  const matchedKey = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));

  const page = matchedKey
    ? pageTitles[matchedKey]
    : { title: "PromptTrace", description: "" };

  async function handleRefresh() {
    setRefreshing(true);
    try {
      for (const src of ["claude-code", "cursor", "codex-cli"]) {
        await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceType: src }),
        });
      }
      window.location.reload();
    } catch { /* ignore */ }
    setRefreshing(false);
  }

  async function handleShare() {
    try {
      const res = await fetch("/api/stats");
      const stats = await res.json();
      const text = [
        `PromptTrace Dashboard`,
        `${stats.totalPrompts} prompts | ${stats.totalSessions} sessions | ${stats.totalProjects} projects`,
        `Top category: ${Object.entries(stats.promptsByCategory || {}).sort(([,a],[,b]) => (b as number) - (a as number))[0]?.[0] || "-"}`,
        `https://github.com/ahmetseha/prompt-trace`,
      ].join("\n");

      if (navigator.share) {
        await navigator.share({ title: "PromptTrace", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Fallback: copy URL
      await navigator.clipboard.writeText("https://github.com/ahmetseha/prompt-trace");
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 px-6">
      <div>
        <h1 className="text-sm font-semibold">{page.title}</h1>
        {page.description && (
          <p className="text-xs text-zinc-500">{page.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {refreshing ? "Scanning..." : "Refresh"}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          {shared ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Share2 className="h-3 w-3" />
          )}
          {shared ? "Copied" : "Share"}
        </button>
      </div>
    </header>
  );
}
