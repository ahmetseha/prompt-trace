import { PageLoader } from "@/components/page-loader";
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SourceIcon } from '@/components/source-icon';
import { CategoryBadge } from '@/components/category-badge';
import { SessionTimeline } from '@/features/sessions/session-timeline';
import { formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { PromptCategory, SourceType } from '@/lib/types';

function formatDuration(startMs: number, endMs: number): string {
  const ms = endMs - startMs;
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function getSourceType(sourceId: string | null): SourceType {
  if (!sourceId) return 'json-import' as SourceType;
  return sourceId.replace('src-', '') as SourceType;
}

function parseModelSummary(json: string | null): Record<string, number> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, number>;
  } catch {
    return {};
  }
}

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSessionById(id!),
    enabled: !!id,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  if (sessionLoading) return <PageLoader />;

  if (!sessionData?.session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-zinc-500">Session not found.</p>
        <Link
          to="/dashboard/sessions"
          className="mt-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  const { session, prompts = [] } = sessionData;
  const project = session.projectId
    ? projects?.find((p: any) => p.id === session.projectId)
    : undefined;

  const sourceType = getSourceType(session.sourceId);
  const models = parseModelSummary(session.modelSummaryJson);
  const modelEntries = Object.entries(models);

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const prompt of prompts) {
    const cat = prompt.category ?? 'unknown';
    categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + 1;
  }
  const categoryEntries = Object.entries(categoryBreakdown).sort(
    (a, b) => b[1] - a[1]
  );

  // Summary stats
  const totalTokens = prompts.reduce(
    (sum: number, p: any) => sum + (p.tokenEstimate ?? 0),
    0
  );
  const totalCost = prompts.reduce(
    (sum: number, p: any) => sum + (p.costEstimate ?? 0),
    0
  );
  const avgSuccess =
    prompts.length > 0
      ? prompts.reduce((sum: number, p: any) => sum + (p.successScore ?? 0), 0) /
        prompts.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to="/dashboard/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Sessions
      </Link>

      {/* Header */}
      <div>
        <h1 className="truncate text-xl font-semibold text-zinc-100">
          {session.title ?? 'Untitled Session'}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <SourceIcon type={sourceType} showLabel size="md" />
          {project && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
              {project.name}
            </span>
          )}
          {session.startedAt && (
            <span>{formatDate(session.startedAt, 'MMM d, yyyy h:mm a')}</span>
          )}
          {session.startedAt && session.endedAt && (
            <span className="text-zinc-600">
              ({formatDuration(session.startedAt, session.endedAt)})
            </span>
          )}
        </div>
      </div>

      {/* Session Summary */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-200">
          Session Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Prompts</p>
            <p className="text-lg font-semibold text-zinc-100">
              {session.promptCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Est. Tokens</p>
            <p className="text-lg font-semibold text-zinc-100">
              {totalTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Est. Cost</p>
            <p className="text-lg font-semibold text-zinc-100">
              ${totalCost.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Avg. Success</p>
            <p className="text-lg font-semibold text-zinc-100">
              {(avgSuccess * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline (takes 2 cols) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-5 text-sm font-semibold text-zinc-200">
              Prompt Timeline
            </h2>
            <SessionTimeline prompts={prompts} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Models */}
          {modelEntries.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-200">
                Models Used
              </h2>
              <div className="space-y-2">
                {modelEntries.map(([model, count]) => (
                  <div
                    key={model}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-300">{model}</span>
                    <span className="text-zinc-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {categoryEntries.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-200">
                Categories
              </h2>
              <div className="space-y-2">
                {categoryEntries.slice(0, 8).map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between"
                  >
                    <CategoryBadge category={cat as PromptCategory} />
                    <span className="text-xs text-zinc-500">{count}</span>
                  </div>
                ))}
                {categoryEntries.length > 8 && (
                  <p className="text-[11px] text-zinc-600 pt-1">
                    and {categoryEntries.length - 8} more categories
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
