"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import type { TemplateCandidate } from "@/lib/types";

interface TopTemplatesProps {
  templates: TemplateCandidate[];
}

export function TopTemplates({ templates }: TopTemplatesProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Top Template Candidates</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Reusable prompt patterns detected
          </p>
        </div>
        <Link
          href="/dashboard/templates"
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
        >
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {templates.slice(0, 5).map((template) => (
          <div
            key={template.id}
            className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-800/50"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">
                {template.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {template.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                {Math.round(template.reuseScore ?? 0)}%
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
