import { useState } from 'react';
import { ChevronDown, Target, TrendingUp, Sparkles, Layers, Shield, BarChart3, Info } from 'lucide-react';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon: Icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-medium text-zinc-100">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 text-sm leading-relaxed text-zinc-400">
          {children}
        </div>
      )}
    </div>
  );
}

function Score({ name, range, color }: { name: string; range: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-zinc-300">{name}</span>
      <span className="text-zinc-600">({range})</span>
    </div>
  );
}

export function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Documentation</h1>
        <p className="mt-1 text-sm text-zinc-500">
          How PromptTrace analyzes, scores, and organizes your prompts.
        </p>
      </div>

      <Section title="Reuse Score" icon={Target} defaultOpen>
        <p>Measures how reusable a prompt is as a template for other projects.</p>
        <div className="mt-3 space-y-2">
          <Score name="High (60+)" range="Reusable badge" color="bg-emerald-500" />
          <Score name="Medium (30-59)" range="Average" color="bg-amber-500" />
          <Score name="Low (0-29)" range="Too specific" color="bg-red-500" />
        </div>
        <p className="mt-3 font-medium text-zinc-300">How it works:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-inside text-zinc-500">
          <li>Starts at 50 points</li>
          <li><span className="text-emerald-400">+10</span> Ideal length (15-80 words)</li>
          <li><span className="text-emerald-400">+15 max</span> Action verbs (create, fix, test, implement...)</li>
          <li><span className="text-emerald-400">+8</span> "instruct" or "generate" intent</li>
          <li><span className="text-emerald-400">+8</span> Contains placeholders like [COMPONENT], {"{name}"}</li>
          <li><span className="text-emerald-400">+5</span> Numbered steps or bullet points</li>
          <li><span className="text-red-400">-25 max</span> Project-specific references (file paths, variable names)</li>
          <li><span className="text-red-400">-15</span> Too short (&lt;5 words) or too long (&gt;500 words)</li>
          <li><span className="text-red-400">-10</span> Mostly pasted code with little instruction</li>
        </ul>
      </Section>

      <Section title="Success Score" icon={TrendingUp}>
        <p>Estimates how effective a prompt was based on observable signals.</p>
        <div className="mt-3 space-y-2">
          <Score name="High (60+)" range="Effective" color="bg-emerald-500" />
          <Score name="Low (&lt;40)" range="Weak badge" color="bg-red-500" />
        </div>
        <p className="mt-3 font-medium text-zinc-300">Scoring criteria:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-inside text-zinc-500">
          <li><span className="text-zinc-300">File changes (max +30):</span> Did the AI modify files? More files = higher score</li>
          <li><span className="text-zinc-300">Response length (max +20):</span> Longer, detailed responses indicate substance</li>
          <li><span className="text-zinc-300">Prompt clarity (max +20):</span> Words like "must", "should", numbered steps boost this</li>
          <li><span className="text-zinc-300">Action intent (max +15):</span> Starts with "create", "fix", "implement" etc.</li>
          <li><span className="text-zinc-300">Prompt length (max +15):</span> 10-150 words is the sweet spot</li>
        </ul>
        <p className="mt-3 text-xs text-zinc-600">
          Note: File change data depends on the AI tool. Some tools (Cursor) don't always report which files were modified, so this signal may be missing.
        </p>
      </Section>

      <Section title="Quality Analysis (6 Scores)" icon={Info}>
        <p>Each prompt gets analyzed on 6 dimensions when you view its detail page.</p>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-zinc-300 font-medium">Clarity (0-100)</p>
            <p className="text-zinc-500">How clear and unambiguous the prompt is. Rewards specific action verbs, clear targets, numbered steps. Penalizes vague words ("something", "stuff", "maybe").</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Specificity (0-100)</p>
            <p className="text-zinc-500">How specific vs generic. Rewards named technologies, file paths, error messages, exact requirements. Penalizes broad scope ("make it better").</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Constraints (0-100)</p>
            <p className="text-zinc-500">Whether output boundaries are defined. Looks for "must", "should", "without", size limits, format requirements, compatibility notes.</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Context Efficiency (0-100)</p>
            <p className="text-zinc-500">How well context is provided without noise. Penalizes pasting entire files (&gt;500 words of code) or providing no context at all.</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Ambiguity (0-100, higher = better)</p>
            <p className="text-zinc-500">Single clear request vs multiple unfocused ones. Penalizes "or" alternatives without preference, unclear references ("it", "that thing").</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Optimization (0-100)</p>
            <p className="text-zinc-500">Weighted average: Clarity 25%, Specificity 20%, Constraints 15%, Context Efficiency 20%, Ambiguity 20%.</p>
          </div>
        </div>
      </Section>

      <Section title="Templates" icon={Sparkles}>
        <p>Reusable prompt patterns automatically extracted from your history.</p>
        <p className="mt-3 font-medium text-zinc-300">How templates are found:</p>
        <ol className="mt-2 space-y-1.5 list-decimal list-inside text-zinc-500">
          <li>Prompts are grouped by category (bug-fixing, refactor, testing...)</li>
          <li>Each prompt is normalized: file paths become [FILE_PATH], names become [COMPONENT], numbers become [N]</li>
          <li>Normalized forms are compared using Jaccard similarity (word overlap)</li>
          <li>Prompts with 70%+ similarity are grouped together</li>
          <li>Groups of 2+ prompts become template candidates</li>
          <li>Each template gets a reuse score based on the group's average</li>
        </ol>
        <p className="mt-3 text-zinc-500">
          <span className="text-zinc-300">Example:</span> If you've written "Write tests for [X] covering edge cases" 3 times across different projects, it becomes a template: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-indigo-400">Write tests for [COMPONENT] covering edge cases</code>
        </p>
      </Section>

      <Section title="Packs" icon={Layers}>
        <p>Workflow sequences detected from your repeated session patterns.</p>
        <p className="mt-3 font-medium text-zinc-300">How packs are detected:</p>
        <ol className="mt-2 space-y-1.5 list-decimal list-inside text-zinc-500">
          <li>Each session's prompts are sorted by time</li>
          <li>The category sequence is extracted (e.g., [debugging, bug-fixing, testing])</li>
          <li>Sequences that repeat in 2+ different sessions are identified</li>
          <li>Minimum 3 steps required to form a pack</li>
          <li>For each step, the most successful prompt is picked as the example</li>
        </ol>
        <p className="mt-3 font-medium text-zinc-300">Built-in patterns:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-500">
          <li><span className="text-zinc-300">Bug Triage Pack:</span> debugging → bug-fixing</li>
          <li><span className="text-zinc-300">Refactor & Test Pack:</span> refactor → testing</li>
          <li><span className="text-zinc-300">Component Build Pack:</span> code-generation → styling</li>
          <li><span className="text-zinc-300">Feature Planning Pack:</span> architecture → code-generation</li>
        </ul>
        <p className="mt-3 text-zinc-500">
          <span className="text-zinc-300">Use case:</span> Export a pack as a checklist for your next similar task. Instead of improvising prompts, follow the proven sequence.
        </p>
      </Section>

      <Section title="Standards" icon={Shield}>
        <p>Best-practice prompt structures derived from your most effective prompts.</p>
        <p className="mt-3 font-medium text-zinc-300">How standards are generated:</p>
        <ol className="mt-2 space-y-1.5 list-decimal list-inside text-zinc-500">
          <li>Prompts are grouped by category (minimum 5 prompts needed)</li>
          <li>Top 3 prompts by combined success + reuse score are selected</li>
          <li>Common structural patterns are extracted (numbered steps, bullets, code blocks, constraints)</li>
          <li>A "recommended structure" is assembled from these patterns</li>
          <li>Bottom 3 prompts are analyzed for anti-patterns (too short, vague verbs, no constraints)</li>
        </ol>
        <p className="mt-3 text-zinc-500">
          <span className="text-zinc-300">Use case:</span> Before writing a refactoring prompt, check the "Refactoring Prompt Standard" to see the recommended structure and common mistakes to avoid.
        </p>
      </Section>

      <Section title="Outcomes" icon={BarChart3}>
        <p>Downstream impact analysis for each prompt.</p>
        <p className="mt-3 font-medium text-zinc-300">What's measured:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-inside text-zinc-500">
          <li><span className="text-zinc-300">File changes:</span> How many files were modified after the prompt</li>
          <li><span className="text-zinc-300">Follow-up count:</span> How many prompts came after in the same session</li>
          <li><span className="text-zinc-300">Session continuation:</span> Did the session continue productively? (0-100)</li>
          <li><span className="text-zinc-300">Repeated later:</span> Was a similar prompt sent in a different session? (50%+ word overlap check)</li>
          <li><span className="text-zinc-300">Abandonment risk:</span> Likelihood the prompt was abandoned (0-100). High if no follow-up, no file changes, short response</li>
        </ul>
        <p className="mt-3 text-zinc-500">
          The Outcomes page groups prompts into: effective patterns, repeated weak patterns, quick-action prompts, and long-chain prompts.
        </p>
      </Section>

      <Section title="Classification" icon={Info}>
        <p>Every prompt is automatically classified into a category and intent using rule-based keyword matching.</p>
        <p className="mt-3 font-medium text-zinc-300">14 Categories:</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['bug-fixing', 'refactor', 'architecture', 'code-generation', 'debugging', 'styling', 'testing', 'documentation', 'deployment', 'data-backend', 'performance', 'exploratory', 'review', 'general'].map(c => (
            <span key={c} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{c}</span>
          ))}
        </div>
        <p className="mt-3 font-medium text-zinc-300">8 Intents:</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['ask', 'instruct', 'compare', 'generate', 'fix', 'explain', 'plan', 'transform'].map(i => (
            <span key={i} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{i}</span>
          ))}
        </div>
        <p className="mt-3 text-zinc-500">
          Classification uses weighted keyword lists with Turkish and English support. No AI/ML is used - all rules are deterministic and inspectable.
        </p>
      </Section>
    </div>
  );
}
