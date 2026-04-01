import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  Coins,
  FileText,
  Hash,
  Layers,
  MessageSquare,
  Tag,
  Zap,
} from 'lucide-react';
import { CategoryBadge } from '@/components/category-badge';
import { SourceIcon } from '@/components/source-icon';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { api } from '@/lib/api';
import type { SourceType } from '@/lib/types';

const intentLabel: Record<string, string> = {
  ask: 'Ask',
  instruct: 'Instruct',
  compare: 'Compare',
  generate: 'Generate',
  fix: 'Fix',
  explain: 'Explain',
  plan: 'Plan',
  transform: 'Transform',
};

export function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => api.getPromptById(id!),
    enabled: !!id,
  });

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSources,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  if (isLoading) return <div className="animate-pulse">Loading...</div>;

  if (!data?.prompt) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <MessageSquare className="mb-4 h-12 w-12 text-zinc-700" />
        <h2 className="text-lg font-medium text-zinc-300">Prompt not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          The prompt with ID &ldquo;{id}&rdquo; does not exist.
        </p>
        <Link
          to="/dashboard/prompts"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to prompts
        </Link>
      </div>
    );
  }

  const { prompt, files = [], tags = [], relatedPrompts = [], similarPrompts = [] } = data;
  const source = sources?.find((s: any) => s.id === prompt.sourceId);
  const project = projects?.find((p: any) => p.id === prompt.projectId);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to="/dashboard/prompts"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to prompts
      </Link>

      {/* Prompt text */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Prompt
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {prompt.promptText}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: metadata + scores */}
        <div className="space-y-6 lg:col-span-1">
          {/* Metadata panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Metadata
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Source</dt>
                <dd>
                  {source ? (
                    <SourceIcon
                      type={source.type as SourceType}
                      showLabel
                      size="sm"
                    />
                  ) : (
                    <span className="text-zinc-400">Unknown</span>
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Project</dt>
                <dd className="text-zinc-300">{project?.name ?? 'Unknown'}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Model</dt>
                <dd className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                  {prompt.model ?? 'Unknown'}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Timestamp</dt>
                <dd className="text-zinc-400 text-xs">
                  {prompt.timestamp
                    ? formatDate(prompt.timestamp)
                    : 'Unknown'}
                </dd>
              </div>

              {prompt.timestamp && (
                <div className="flex items-center justify-between">
                  <dt className="text-zinc-500">Relative</dt>
                  <dd className="inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(prompt.timestamp)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Category</dt>
                <dd>
                  {prompt.category ? (
                    <CategoryBadge category={prompt.category} />
                  ) : (
                    <span className="text-zinc-400">None</span>
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Intent</dt>
                <dd className="text-zinc-300">
                  {prompt.intent
                    ? intentLabel[prompt.intent] ?? prompt.intent
                    : 'Unknown'}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Token Estimate</dt>
                <dd className="inline-flex items-center gap-1 text-zinc-300">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  {prompt.tokenEstimate?.toLocaleString() ?? 'N/A'}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Cost Estimate</dt>
                <dd className="inline-flex items-center gap-1 text-zinc-300">
                  <Coins className="h-3 w-3 text-emerald-500" />
                  {prompt.costEstimate != null
                    ? `$${prompt.costEstimate.toFixed(4)}`
                    : 'N/A'}
                </dd>
              </div>

              {prompt.session && (
                <div className="flex items-center justify-between">
                  <dt className="text-zinc-500">Session</dt>
                  <dd className="truncate max-w-[140px] text-zinc-400 text-xs">
                    {prompt.session.title ?? prompt.session.id}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Scores */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Scores
            </h3>
            <div className="space-y-4">
              {/* Success score */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Success Score</span>
                  <span className="tabular-nums text-zinc-200">
                    {Math.round(prompt.successScore ?? 0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(Math.round(prompt.successScore ?? 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Reuse score */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Reuse Score</span>
                  <span className="tabular-nums text-zinc-200">
                    {Math.round(prompt.reuseScore ?? 0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${Math.min(Math.round(prompt.reuseScore ?? 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: response, files, tags, related */}
        <div className="space-y-6 lg:col-span-2">
          {/* Response preview */}
          {prompt.responsePreview && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Response Preview
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {prompt.responsePreview}
              </p>
            </div>
          )}

          {/* Files touched */}
          {files.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <FileText className="h-3.5 w-3.5" />
                Files Touched ({files.length})
              </h3>
              <ul className="space-y-1.5">
                {files.map((f: any) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 text-sm text-zinc-400"
                  >
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-500">
                      {f.actionType ?? 'touch'}
                    </span>
                    <code className="text-xs text-zinc-300">{f.filePath}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t: any) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-800/50 px-2 py-0.5 text-xs text-zinc-400"
                  >
                    <Hash className="h-3 w-3 text-zinc-600" />
                    {t.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related prompts (same session) */}
          {relatedPrompts.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <Layers className="h-3.5 w-3.5" />
                Related Prompts (Same Session)
              </h3>
              <ul className="space-y-2">
                {relatedPrompts.map((rp: any) => (
                  <li key={rp.id}>
                    <Link
                      to={`/dashboard/prompts/${rp.id}`}
                      className="block rounded-lg border border-zinc-800/50 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                    >
                      <span className="line-clamp-1">
                        {rp.promptText ?? 'Untitled prompt'}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                        {rp.model && (
                          <span className="rounded bg-zinc-800 px-1 py-0.5">
                            {rp.model}
                          </span>
                        )}
                        {rp.category && (
                          <CategoryBadge category={rp.category} />
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Similar prompts (same category) */}
          {similarPrompts.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <MessageSquare className="h-3.5 w-3.5" />
                Similar Prompts (Same Category)
              </h3>
              <ul className="space-y-2">
                {similarPrompts.map((sp: any) => {
                  const spProject = projects?.find(
                    (p: any) => p.id === sp.projectId
                  );
                  return (
                    <li key={sp.id}>
                      <Link
                        to={`/dashboard/prompts/${sp.id}`}
                        className="block rounded-lg border border-zinc-800/50 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                      >
                        <span className="line-clamp-1">
                          {sp.promptText ?? 'Untitled prompt'}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                          {spProject && (
                            <span className="text-zinc-500">
                              {spProject.name}
                            </span>
                          )}
                          {sp.model && (
                            <span className="rounded bg-zinc-800 px-1 py-0.5">
                              {sp.model}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
