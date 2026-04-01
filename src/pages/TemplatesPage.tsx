import { PageLoader } from "@/components/page-loader";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryBadge } from '@/components/category-badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Sparkles, Copy, Check, ChevronDown } from 'lucide-react';
import type { TemplateCandidate } from '@/lib/types';

type SortOption = 'score' | 'used' | 'newest';

function exportTemplateMarkdown(template: TemplateCandidate) {
  const reusePercent = template.reuseScore != null ? Math.round(template.reuseScore * 100) : 0;
  const md = `# ${template.title}\n\n## When to Use\n${template.description ?? ''}\n\n## Pattern\n\`\`\`\n${template.normalizedPattern ?? ''}\n\`\`\`\n\n## Reuse Score\n${reusePercent}%\n`;
  navigator.clipboard.writeText(md);
}

function getSourcePromptIds(template: TemplateCandidate): string[] {
  if (!template.sourcePromptIdsJson) return [];
  try {
    return JSON.parse(template.sourcePromptIdsJson);
  } catch {
    return [];
  }
}

function EnrichedTemplateCard({ template }: { template: TemplateCandidate }) {
  const [copied, setCopied] = useState(false);
  const sourcePromptIds = getSourcePromptIds(template);
  const reusePercent = template.reuseScore != null ? Math.round(template.reuseScore * 100) : 0;

  // Fetch the best source prompt (first one as proxy)
  const bestPromptId = sourcePromptIds[0] ?? null;
  const { data: bestPromptData } = useQuery({
    queryKey: ['prompt', bestPromptId],
    queryFn: () => api.getPromptById(bestPromptId!),
    enabled: !!bestPromptId,
  });
  const bestPrompt = bestPromptData?.prompt;

  const handleExport = () => {
    exportTemplateMarkdown(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-semibold text-zinc-100">{template.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {template.category && <CategoryBadge category={template.category} />}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            title="Copy as Markdown"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Export'}
          </button>
        </div>
      </div>

      {/* Normalized pattern */}
      {template.normalizedPattern && (
        <div className="mt-3 rounded-lg bg-zinc-950 px-3 py-2.5 overflow-x-auto">
          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap break-words leading-relaxed">
            {template.normalizedPattern}
          </pre>
        </div>
      )}

      {/* Description */}
      {template.description && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {template.description}
        </p>
      )}

      {/* Reuse score bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-zinc-500">Reuse Score</span>
          <span className="text-[11px] font-medium text-zinc-300">{reusePercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              reusePercent >= 70
                ? "bg-emerald-500"
                : reusePercent >= 40
                  ? "bg-amber-500"
                  : "bg-zinc-500"
            )}
            style={{ width: `${Math.min(reusePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Source prompts count */}
      <div className="mt-4 text-[11px] text-zinc-500">
        {sourcePromptIds.length} source prompt{sourcePromptIds.length !== 1 ? "s" : ""}
      </div>

      {/* Best example */}
      {bestPrompt && (
        <div className="mt-3 rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Best Example</span>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
            {bestPrompt.promptText ?? 'No text'}
          </p>
          {bestPrompt.successScore != null && (
            <span className="mt-1 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              Score: {Math.round(bestPrompt.successScore)}%
            </span>
          )}
        </div>
      )}

      {/* Footer: when to use summary (using description as proxy) */}
      {template.description && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">When to Use</span>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed line-clamp-1">
            {template.description}
          </p>
        </div>
      )}
    </div>
  );
}

export function TemplatesPage() {
  const [sortBy, setSortBy] = useState<SortOption>('score');

  const { data: allTemplates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: api.getTemplates,
  });

  if (isLoading) return <PageLoader />;

  const templates = [...(allTemplates || [])]
    .filter((t: any) => {
      // Hide templates with no reuse score, empty/nonsensical titles, or very short patterns
      if ((t.reuseScore ?? 0) === 0) return false;
      if (!t.title || t.title.trim().length === 0) return false;
      if ((t.normalizedPattern ?? '').length < 15) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'score':
          return (b.reuseScore ?? 0) - (a.reuseScore ?? 0);
        case 'used': {
          const aCount = getSourcePromptIds(a).length;
          const bCount = getSourcePromptIds(b).length;
          return bCount - aCount;
        }
        case 'newest':
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Templates</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {templates.length} reusable prompt pattern{templates.length !== 1 ? 's' : ''} extracted from your history
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-8 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="score">Highest Score</option>
            <option value="used">Most Used</option>
            <option value="newest">Newest</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-indigo-950/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-sm text-zinc-400 leading-relaxed">
            <span className="text-zinc-200 font-medium">What are templates?</span>{" "}
            PromptTrace analyzes your prompt history and automatically detects patterns
            you use repeatedly. Templates are prompts that are generic enough to be
            reused across different projects. The higher the reuse score, the more
            versatile the prompt pattern is. Use these as starting points for your
            next AI interactions.
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No meaningful templates yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Templates are extracted after scanning your prompt history. Keep using AI tools and sync to build reusable patterns.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template: any) => (
            <EnrichedTemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
