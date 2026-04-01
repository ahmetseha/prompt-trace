import { useQuery } from '@tanstack/react-query';
import { PageLoader } from '@/components/page-loader';
import { api } from '@/lib/api';
import { Shield, Copy, Check, AlertTriangle } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Standard {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  recommendedStructure: string | null;
  examplesJson: string | null;
  notesJson: string | null;
  createdAt: number;
  updatedAt: number;
}

function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function standardToMarkdown(s: Standard): string {
  const examples: string[] = parseJson(s.examplesJson, []);
  const notes: string[] = parseJson(s.notesJson, []);

  const lines: string[] = [
    `# ${s.title}`,
    '',
    `**Category:** ${s.category ?? 'General'}`,
    '',
    s.description ?? '',
    '',
    '## Recommended Structure',
    '',
    '```',
    s.recommendedStructure ?? '',
    '```',
  ];

  if (examples.length > 0) {
    lines.push('', '## Best Examples', '');
    for (const ex of examples) {
      lines.push(`- ${ex}`);
    }
  }

  if (notes.length > 0) {
    lines.push('', '## Anti-Patterns', '');
    for (const n of notes) {
      lines.push(`- ${n}`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Standard Card
// ---------------------------------------------------------------------------

function StandardCard({ standard }: { standard: Standard }) {
  const [copied, setCopied] = useState(false);
  const [structureExpanded, setStructureExpanded] = useState(false);
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const examples: string[] = parseJson(standard.examplesJson, []);
  const notes: string[] = parseJson(standard.notesJson, []);

  const handleCopy = useCallback(() => {
    const md = standardToMarkdown(standard);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [standard]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-zinc-100">{standard.title}</h2>
          {standard.category && (
            <span className="mt-1.5 inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-400">
              {standard.category}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? 'Copied' : 'Export MD'}
        </button>
      </div>

      {/* Description */}
      {standard.description && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {standard.description}
        </p>
      )}

      {/* Recommended Structure */}
      {standard.recommendedStructure && (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Recommended Structure
          </h3>
          <div className={`relative ${!structureExpanded ? "max-h-32 overflow-hidden" : ""}`}>
            <pre className="rounded-xl bg-zinc-950 p-4 text-xs font-mono leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre-wrap border border-zinc-800">
              {standard.recommendedStructure}
            </pre>
            {!structureExpanded && (
              <button
                onClick={() => setStructureExpanded(true)}
                className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-zinc-950 to-transparent pt-8 pb-2 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Expand
              </button>
            )}
          </div>
        </div>
      )}

      {/* Best Examples */}
      {examples.length > 0 && (() => {
        const EXAMPLE_LIMIT = 3;
        const shouldCollapseExamples = examples.length > 5 && !examplesExpanded;
        const visibleExamples = shouldCollapseExamples ? examples.slice(0, EXAMPLE_LIMIT) : examples;
        return (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Best Examples
          </h3>
          <div className="space-y-2">
            {visibleExamples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 leading-relaxed"
              >
                {ex}
              </div>
            ))}
            {shouldCollapseExamples && (
              <button
                onClick={() => setExamplesExpanded(true)}
                className="w-full rounded-lg bg-zinc-800/50 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Show {examples.length - EXAMPLE_LIMIT} more
              </button>
            )}
          </div>
        </div>
        );
      })()}

      {/* Anti-Patterns */}
      {notes.length > 0 && (() => {
        const NOTE_LIMIT = 3;
        const shouldCollapseNotes = notes.length > 5 && !notesExpanded;
        const visibleNotes = shouldCollapseNotes ? notes.slice(0, NOTE_LIMIT) : notes;
        return (
        <div className="mt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <AlertTriangle className="h-3 w-3 text-orange-400" />
            Anti-Patterns
          </h3>
          <ul className="space-y-1.5">
            {visibleNotes.map((note, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed text-orange-400/80"
              >
                <span className="mt-0.5 shrink-0 text-orange-500">-</span>
                {note}
              </li>
            ))}
          </ul>
          {shouldCollapseNotes && (
            <button
              onClick={() => setNotesExpanded(true)}
              className="mt-2 w-full rounded-lg bg-zinc-800/50 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Show {notes.length - NOTE_LIMIT} more
            </button>
          )}
        </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function StandardsPage() {
  const { data: standards, isLoading } = useQuery<Standard[]>({
    queryKey: ['standards'],
    queryFn: () => api.getStandards(),
  });

  if (isLoading) return <PageLoader />;

  const NOISE_TITLE_PATTERNS = ['unknown', 'general', '[placeholder]', '[string]'];
  const list = (Array.isArray(standards) ? standards : []).filter((s) => {
    if (!s.recommendedStructure || s.recommendedStructure.trim().length === 0) return false;
    const titleLower = (s.title ?? '').toLowerCase();
    if (NOISE_TITLE_PATTERNS.some((p) => titleLower === p || titleLower === `${p} prompt standard`)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            What are Standards?
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Best-practice prompt structures extracted from your most effective
          prompts. Standards are automatically generated from categories with
          enough data and from high-reuse templates.
        </p>
      </div>

      {/* Content */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-10 w-10 text-zinc-700 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-400">
            No standards yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-600">
            Standards are generated automatically when you have enough prompt
            data. Import more prompts and sync to see best-practice structures
            emerge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {list.map((s) => (
            <StandardCard key={s.id} standard={s} />
          ))}
        </div>
      )}
    </div>
  );
}
