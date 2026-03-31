"use client";

import Link from "next/link";
import type { Session, Project, SourceType } from "@/lib/types";
import { SourceIcon } from "@/components/source-icon";
import { formatDate } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
  project: Project | undefined;
}

function formatDuration(startMs: number, endMs: number): string {
  const ms = endMs - startMs;
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function getSourceType(sourceId: string | null): SourceType {
  if (!sourceId) return "json-import";
  return sourceId.replace("src-", "") as SourceType;
}

function parseModelSummary(json: string | null): Record<string, number> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, number>;
  } catch {
    return {};
  }
}

export function SessionCard({ session, project }: SessionCardProps) {
  const sourceType = getSourceType(session.sourceId);
  const models = parseModelSummary(session.modelSummaryJson);
  const modelNames = Object.keys(models);

  return (
    <Link href={`/dashboard/sessions/${session.id}`}>
      <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
            {session.title ?? "Untitled Session"}
          </h3>
          <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {session.promptCount} prompts
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <SourceIcon type={sourceType} showLabel size="sm" />
          {project && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
              {project.name}
            </span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-3 text-xs text-zinc-500">
          {session.startedAt && (
            <span>{formatDate(session.startedAt, "MMM d, yyyy")}</span>
          )}
          {session.startedAt && session.endedAt && (
            <span className="text-zinc-600">
              {formatDuration(session.startedAt, session.endedAt)}
            </span>
          )}
        </div>

        {modelNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {modelNames.map((model) => (
              <span
                key={model}
                className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400"
              >
                {model}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
