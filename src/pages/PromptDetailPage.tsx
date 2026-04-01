import { PageLoader } from "@/components/page-loader";
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  FileText,
  Hash,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  Tag,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { CategoryBadge } from '@/components/category-badge';
import { SourceIcon } from '@/components/source-icon';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { api } from '@/lib/api';
import type { SourceType } from '@/lib/types';

function PromptTextBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 300;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Prompt
        </h2>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? "Collapse" : "Expand"}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <div className={`overflow-hidden transition-all ${isLong && !expanded ? "max-h-32" : ""}`}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {text}
        </p>
      </div>
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 w-full rounded-lg bg-zinc-800/50 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Show full prompt ({text.length} chars)
        </button>
      )}
    </div>
  );
}

function ScoreBar({ label, score, explanation }: { label: string; score: number; explanation: string }) {
  const pct = Math.min(Math.round(score), 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm tabular-nums text-zinc-200">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">{explanation}</p>
    </div>
  );
}

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

  const { data: analysis, isLoading: analysisLoading, isError: analysisError } = useQuery({
    queryKey: ['prompt-analysis', id],
    queryFn: () => api.getPromptAnalysis(id!),
    enabled: !!id,
    retry: 1,
  });

  if (isLoading) return <PageLoader />;

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

  const analysisScores = analysis?.scores ?? [];
  const strengths: string[] = analysis?.strengths ?? [];
  const weaknesses: string[] = analysis?.weaknesses ?? [];
  const suggestions: string[] = analysis?.suggestions ?? [];
  const improvedVersion: string | null = analysis?.improvedVersion ?? null;
  const templateVersion: string | null = analysis?.templateVersion ?? null;
  const whenToUse: string | null = analysis?.whenToUse ?? null;

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

      {/* Prompt text - collapsible if long */}
      <PromptTextBlock text={prompt.promptText ?? ""} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: metadata + scores + analysis */}
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
                  <span className="text-zinc-400 flex items-center gap-1" title="Estimated effectiveness based on response length, file changes, prompt clarity, and action orientation">
                    Success Score
                    <Info className="h-3 w-3 text-zinc-600" />
                  </span>
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
                  <span className="text-zinc-400 flex items-center gap-1" title="How reusable this prompt is as a template. Higher scores indicate generic, well-structured prompts that could be applied to other projects">
                    Reuse Score
                    <Info className="h-3 w-3 text-zinc-600" />
                  </span>
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

          {/* When to Use */}
          {whenToUse && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                When to Use
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">{whenToUse}</p>
            </div>
          )}
        </div>

        {/* Right column: analysis + response, files, tags, related */}
        <div className="space-y-6 lg:col-span-2">
          {/* Analysis section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Analysis
            </h3>
            {analysisLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Computing analysis...
              </div>
            ) : analysisError || !analysis ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Analysis not available for this prompt.
              </div>
            ) : (
              <div className="space-y-4">
                {analysisScores.length > 0 ? (
                  analysisScores.map((s: any) => (
                    <ScoreBar
                      key={s.label}
                      label={s.label}
                      score={s.score}
                      explanation={s.explanation}
                    />
                  ))
                ) : (
                  <>
                    <ScoreBar label="Clarity" score={analysis.clarity ?? 0} explanation={analysis.clarityExplanation ?? "How clear the intent is"} />
                    <ScoreBar label="Specificity" score={analysis.specificity ?? 0} explanation={analysis.specificityExplanation ?? "Level of detail provided"} />
                    <ScoreBar label="Constraints" score={analysis.constraints ?? 0} explanation={analysis.constraintsExplanation ?? "Boundaries and limitations defined"} />
                    <ScoreBar label="Context Efficiency" score={analysis.contextEfficiency ?? 0} explanation={analysis.contextEfficiencyExplanation ?? "Token usage vs information density"} />
                    <ScoreBar label="Ambiguity" score={analysis.ambiguity ?? 0} explanation={analysis.ambiguityExplanation ?? "Lower is more ambiguous"} />
                    <ScoreBar label="Optimization" score={analysis.optimization ?? 0} explanation={analysis.optimizationExplanation ?? "Overall optimization potential"} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Strengths & Weaknesses */}
          {!analysisLoading && analysis && (strengths.length > 0 || weaknesses.length > 0) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Strengths & Weaknesses
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Strengths */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/60" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Weaknesses */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Weaknesses
                  </h4>
                  <ul className="space-y-1.5">
                    {weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/60" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {!analysisLoading && analysis && suggestions.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Suggestions
              </h3>
              <ul className="space-y-2">
                {suggestions.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improved Version */}
          {!analysisLoading && improvedVersion && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Suggested Improvement
              </h3>
              <div className="rounded-lg bg-zinc-950 px-4 py-3 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words text-sm font-mono leading-relaxed text-zinc-300">
                  {improvedVersion}
                </pre>
              </div>
            </div>
          )}

          {/* Template Version */}
          {!analysisLoading && templateVersion && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Reusable Template
              </h3>
              <div className="rounded-lg bg-zinc-950 px-4 py-3 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words text-sm font-mono leading-relaxed text-zinc-300">
                  {templateVersion.split(/(\{\{[^}]+\}\})/).map((part, i) =>
                    /^\{\{[^}]+\}\}$/.test(part) ? (
                      <span key={i} className="rounded bg-indigo-500/20 px-1 text-indigo-300">
                        {part}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </pre>
              </div>
            </div>
          )}

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
