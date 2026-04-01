import { PageLoader } from '@/components/page-loader';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CategoryBadge } from '@/components/category-badge';
import { api } from '@/lib/api';
import { truncate } from '@/lib/utils';
import { BarChart3, Repeat2, Zap, Link2 } from 'lucide-react';
import type { Prompt, PromptCategory } from '@/lib/types';
import { analyzeOutcomes } from '@/lib/analysis/outcomes';
import type { PromptOutcome } from '@/lib/analysis/outcomes';

interface PromptWithOutcome {
  prompt: Prompt;
  outcome: PromptOutcome;
}

function computeOutcomes(prompts: Prompt[]): PromptWithOutcome[] {
  // Group prompts by session
  const bySession = new Map<string, Prompt[]>();
  for (const p of prompts) {
    const sid = p.sessionId ?? '__none__';
    const arr = bySession.get(sid) ?? [];
    arr.push(p);
    bySession.set(sid, arr);
  }
  // Sort each session by timestamp
  for (const arr of bySession.values()) {
    arr.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }

  return prompts.map((p) => {
    const sessionPrompts = bySession.get(p.sessionId ?? '__none__') ?? [];
    // No file data client-side, pass empty array
    const outcome = analyzeOutcomes(p, sessionPrompts, prompts, []);
    return { prompt: p, outcome };
  });
}

// ---------------------------------------------------------------------------
// Section Card
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  description,
  items,
  emptyText,
}: {
  title: string;
  icon: React.ElementType;
  description: string;
  items: PromptWithOutcome[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      </div>
      <p className="text-xs text-zinc-500 mb-4">{description}</p>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-600 py-4 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map(({ prompt, outcome }) => (
            <Link
              key={prompt.id}
              to={`/dashboard/prompts/${prompt.id}`}
              className="block rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-xs text-zinc-300 leading-relaxed line-clamp-2">
                  {truncate(prompt.promptText ?? 'No text', 140)}
                </p>
                {prompt.category && (
                  <CategoryBadge
                    category={prompt.category as PromptCategory}
                    className="shrink-0"
                  />
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                <span>{outcome.fileChangeCount} files</span>
                <span className="text-zinc-700">|</span>
                <span>{outcome.followUpCount} follow-ups</span>
                <span className="text-zinc-700">|</span>
                <span>Continuation: {outcome.sessionContinuationScore}</span>
                <span className="text-zinc-700">|</span>
                <span>
                  Risk:{' '}
                  <span
                    className={
                      outcome.abandonmentRisk >= 70
                        ? 'text-red-400'
                        : outcome.abandonmentRisk >= 40
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }
                  >
                    {outcome.abandonmentRisk}
                  </span>
                </span>
                {outcome.repeatedLater && (
                  <>
                    <span className="text-zinc-700">|</span>
                    <span className="text-amber-400">Repeated</span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500 italic">
                {outcome.summary}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function OutcomesPage() {
  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompts', 'all'],
    queryFn: () => api.getPrompts(),
  });

  const sections = useMemo(() => {
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return { effective: [], weakRepeated: [], quickAction: [], longChain: [] };
    }

    const all = computeOutcomes(prompts);

    // Top Effective Patterns: high continuation + low abandonment
    const effective = all
      .filter(
        ({ outcome }) =>
          outcome.sessionContinuationScore >= 60 &&
          outcome.abandonmentRisk < 40,
      )
      .sort(
        (a, b) =>
          b.outcome.sessionContinuationScore -
          a.outcome.sessionContinuationScore,
      )
      .slice(0, 10);

    // Most Repeated Weak Patterns: repeated later + high abandonment risk
    const weakRepeated = all
      .filter(
        ({ outcome }) =>
          outcome.repeatedLater && outcome.abandonmentRisk >= 40,
      )
      .sort((a, b) => b.outcome.abandonmentRisk - a.outcome.abandonmentRisk)
      .slice(0, 10);

    // Quick Action Prompts: file changes with low follow-up
    const quickAction = all
      .filter(
        ({ outcome }) =>
          outcome.fileChangeCount > 0 && outcome.followUpCount <= 2,
      )
      .sort((a, b) => b.outcome.fileChangeCount - a.outcome.fileChangeCount)
      .slice(0, 10);

    // Long Chain Prompts: high follow-up count
    const longChain = all
      .filter(({ outcome }) => outcome.followUpCount >= 4)
      .sort((a, b) => b.outcome.followUpCount - a.outcome.followUpCount)
      .slice(0, 10);

    return { effective, weakRepeated, quickAction, longChain };
  }, [prompts]);

  if (isLoading) return <PageLoader />;

  const totalPrompts = Array.isArray(prompts) ? prompts.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Outcomes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Analyze downstream effects of {totalPrompts} prompt
          {totalPrompts !== 1 ? 's' : ''} across sessions
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Effective Patterns',
            value: sections.effective.length,
            color: 'text-emerald-400',
          },
          {
            label: 'Weak & Repeated',
            value: sections.weakRepeated.length,
            color: 'text-red-400',
          },
          {
            label: 'Quick Actions',
            value: sections.quickAction.length,
            color: 'text-indigo-400',
          },
          {
            label: 'Long Chains',
            value: sections.longChain.length,
            color: 'text-amber-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <p className="text-[11px] text-zinc-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Top Effective Patterns"
          icon={BarChart3}
          description="Prompts with high session continuation and file changes, grouped by impact"
          items={sections.effective}
          emptyText="No effective patterns detected yet."
        />
        <SectionCard
          title="Most Repeated Weak Patterns"
          icon={Repeat2}
          description="Prompts that keep getting repeated with low success - candidates for improvement"
          items={sections.weakRepeated}
          emptyText="No repeated weak patterns found."
        />
        <SectionCard
          title="Quick Action Prompts"
          icon={Zap}
          description="Prompts that led to file changes immediately with minimal follow-up"
          items={sections.quickAction}
          emptyText="No quick action prompts found."
        />
        <SectionCard
          title="Long Chain Prompts"
          icon={Link2}
          description="Prompts that triggered many follow-up prompts in the same session"
          items={sections.longChain}
          emptyText="No long chain prompts detected."
        />
      </div>
    </div>
  );
}
