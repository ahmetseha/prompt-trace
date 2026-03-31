import {
  Terminal,
  Code,
  Sparkles,
  Bot,
  FileJson,
  FileText,
  Cpu,
} from "lucide-react";
import type { SourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const sourceConfig: Record<
  SourceType,
  { icon: React.ElementType; label: string; color: string }
> = {
  cursor: { icon: Code, label: "Cursor", color: "text-blue-400" },
  "claude-code": { icon: Terminal, label: "Claude Code", color: "text-orange-400" },
  copilot: { icon: Sparkles, label: "Copilot", color: "text-purple-400" },
  "gemini-cli": { icon: Bot, label: "Gemini CLI", color: "text-cyan-400" },
  "codex-cli": { icon: Cpu, label: "Codex CLI", color: "text-green-400" },
  "json-import": { icon: FileJson, label: "JSON Import", color: "text-yellow-400" },
  "markdown-import": {
    icon: FileText,
    label: "Markdown Import",
    color: "text-zinc-400",
  },
};

interface SourceIconProps {
  type: SourceType;
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
  const config = sourceConfig[type] ?? sourceConfig["json-import"];
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

export function getSourceLabel(type: SourceType): string {
  return sourceConfig[type]?.label ?? type;
}
