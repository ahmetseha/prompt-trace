import {
  Terminal,
  Code,
  Code2,
  Sparkles,
  Bot,
  FileJson,
  FileText,
  Cpu,
  Globe,
  Wind,
  Zap,
  Bird,
  Compass,
  SquareTerminal,
  Braces,
} from "lucide-react";
import type { SourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const sourceConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  cursor: { icon: Code, label: "Cursor", color: "text-blue-400" },
  "cursor-agent": { icon: Code, label: "Cursor Agent", color: "text-blue-300" },
  "claude-code": { icon: Terminal, label: "Claude Code", color: "text-orange-400" },
  vscode: { icon: Code2, label: "VS Code", color: "text-sky-400" },
  "vscode-insiders": { icon: Code2, label: "VS Code Insiders", color: "text-emerald-400" },
  copilot: { icon: Sparkles, label: "Copilot", color: "text-purple-400" },
  "copilot-cli": { icon: Sparkles, label: "Copilot CLI", color: "text-purple-300" },
  windsurf: { icon: Wind, label: "Windsurf", color: "text-teal-400" },
  "windsurf-next": { icon: Wind, label: "Windsurf Next", color: "text-teal-300" },
  "gemini-cli": { icon: Bot, label: "Gemini CLI", color: "text-cyan-400" },
  "codex-cli": { icon: Cpu, label: "Codex CLI", color: "text-green-400" },
  zed: { icon: Zap, label: "Zed", color: "text-amber-400" },
  antigravity: { icon: Globe, label: "Antigravity", color: "text-violet-400" },
  opencode: { icon: Braces, label: "OpenCode", color: "text-lime-400" },
  goose: { icon: Bird, label: "Goose", color: "text-rose-400" },
  kiro: { icon: Compass, label: "Kiro", color: "text-indigo-400" },
  "command-code": { icon: SquareTerminal, label: "Command Code", color: "text-zinc-300" },
  "json-import": { icon: FileJson, label: "JSON Import", color: "text-yellow-400" },
  "markdown-import": { icon: FileText, label: "Markdown Import", color: "text-zinc-400" },
};

interface SourceIconProps {
  type: SourceType | string;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function SourceIcon({
  type,
  showLabel = false,
  className,
  size = "sm",
}: SourceIconProps) {
  const config = sourceConfig[type] ?? { icon: Terminal, label: type, color: "text-zinc-400" };
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn(iconSize, config.color)} />
      {showLabel && (
        <span className="text-xs text-zinc-400">{config.label}</span>
      )}
    </span>
  );
}

export function getSourceLabel(type: SourceType | string): string {
  return sourceConfig[type]?.label ?? type;
}
