import type { Session, Prompt, PromptCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackStep {
  order: number;
  normalizedPrompt: string;
  category: string;
  intent: string;
  examplePromptId?: string;
}

export interface InferredPack {
  title: string;
  description: string;
  workflowType: string; // "bug-triage", "refactor", "test-writing", etc.
  score: number; // 0-100 confidence
  steps: PackStep[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a category to a human-friendly label suitable for pack titles. */
const CATEGORY_LABEL: Record<string, string> = {
  "bug-fixing": "Bug Fixing",
  refactor: "Refactor",
  architecture: "Architecture",
  "code-generation": "Code Gen",
  debugging: "Debugging",
  styling: "Styling",
  testing: "Testing",
  documentation: "Documentation",
  deployment: "Deployment",
  "data-backend": "Data/API",
  performance: "Performance",
  exploratory: "Exploration",
  review: "Review",
  general: "General",
  unknown: "General",
};

function labelFor(cat: string): string {
  return CATEGORY_LABEL[cat] ?? cat;
}

/**
 * Build a title from a category sequence.
 * e.g. ["debugging","bug-fixing","testing"] -> "Debug & Fix & Test Pack"
 */
function titleFromSequence(seq: string[]): string {
  const unique = [...new Set(seq)];
  if (unique.length === 1) return `${labelFor(unique[0])} Pack`;
  if (unique.length === 2) return `${labelFor(unique[0])} & ${labelFor(unique[1])} Pack`;
  // 3+: use first two + "+"
  return `${labelFor(unique[0])} & ${labelFor(unique[1])}+ Pack`;
}

function workflowTypeFromSequence(seq: string[]): string {
  return [...new Set(seq)].join("-");
}

function descriptionFromSequence(seq: string[]): string {
  const labels = seq.map(labelFor);
  return `A ${labels.length}-step workflow: ${labels.join(" -> ")}.`;
}

/**
 * Encode a category sequence as a string key for deduplication.
 */
function seqKey(seq: string[]): string {
  return seq.join("|");
}

// ---------------------------------------------------------------------------
// Sequence extraction
// ---------------------------------------------------------------------------

interface SessionSequence {
  sessionId: string;
  categories: string[];
  prompts: Prompt[];
}

function extractSessionSequences(
  sessions: Session[],
  prompts: Prompt[]
): SessionSequence[] {
  const bySession = new Map<string, Prompt[]>();
  for (const p of prompts) {
    if (!p.sessionId) continue;
    let arr = bySession.get(p.sessionId);
    if (!arr) {
      arr = [];
      bySession.set(p.sessionId, arr);
    }
    arr.push(p);
  }

  const result: SessionSequence[] = [];
  for (const [sessionId, sessionPrompts] of bySession) {
    const sorted = [...sessionPrompts].sort(
      (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
    );
    // Skip noise: short "general" prompts that are likely meaningless
    const meaningful = sorted.filter((p) => {
      if (p.category === "general" && (p.promptText ?? "").trim().length < 15) return false;
      return true;
    });
    if (meaningful.length === 0) continue;
    const categories = meaningful.map((p) => p.category ?? "unknown");
    result.push({ sessionId, categories, prompts: meaningful });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Subsequence matching
// ---------------------------------------------------------------------------

interface SubsequenceMatch {
  sequence: string[];
  occurrences: number;
  sessionIds: string[];
  /** For each position in the sequence, the best example prompt (highest successScore) */
  bestExamples: (Prompt | null)[];
  avgSuccessScore: number;
}

/**
 * Find all contiguous subsequences of length >= minLen that appear in >= minOccurrences sessions.
 */
function findRepeatedSubsequences(
  sequences: SessionSequence[],
  minLen = 3,
  minOccurrences = 2
): SubsequenceMatch[] {
  // Count how often each subsequence appears across sessions
  const subseqMap = new Map<
    string,
    {
      sequence: string[];
      sessionIds: Set<string>;
      promptsByPosition: Prompt[][];
    }
  >();

  for (const ss of sequences) {
    const cats = ss.categories;
    const maxLen = Math.min(cats.length, 6); // cap at 6-step sequences
    for (let len = minLen; len <= maxLen; len++) {
      for (let start = 0; start <= cats.length - len; start++) {
        const subseq = cats.slice(start, start + len);
        const key = seqKey(subseq);

        let entry = subseqMap.get(key);
        if (!entry) {
          entry = { sequence: subseq, sessionIds: new Set(), promptsByPosition: subseq.map(() => []) };
          subseqMap.set(key, entry);
        }
        entry.sessionIds.add(ss.sessionId);
        for (let i = 0; i < len; i++) {
          entry.promptsByPosition[i].push(ss.prompts[start + i]);
        }
      }
    }
  }

  // Filter to those with enough occurrences
  const results: SubsequenceMatch[] = [];
  for (const [, entry] of subseqMap) {
    if (entry.sessionIds.size < minOccurrences) continue;

    const bestExamples: (Prompt | null)[] = entry.promptsByPosition.map((ps) => {
      if (ps.length === 0) return null;
      return ps.reduce((best, p) =>
        (p.successScore ?? 0) > (best.successScore ?? 0) ? p : best
      );
    });

    let successSum = 0;
    let successCount = 0;
    for (const ps of entry.promptsByPosition) {
      for (const p of ps) {
        if (p.successScore != null) {
          successSum += p.successScore;
          successCount++;
        }
      }
    }

    results.push({
      sequence: entry.sequence,
      occurrences: entry.sessionIds.size,
      sessionIds: [...entry.sessionIds],
      bestExamples,
      avgSuccessScore: successCount > 0 ? successSum / successCount : 0,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Standard pattern packs
// ---------------------------------------------------------------------------

interface PatternDef {
  trigger: string[]; // category pair to look for
  title: string;
  workflowType: string;
  description: string;
}

const STANDARD_PATTERNS: PatternDef[] = [
  {
    trigger: ["debugging", "bug-fixing"],
    title: "Bug Triage Pack",
    workflowType: "bug-triage",
    description: "Diagnose an issue then apply the fix. Detected from recurring debug-then-fix sessions.",
  },
  {
    trigger: ["refactor", "testing"],
    title: "Refactor & Test Pack",
    workflowType: "refactor-test",
    description: "Restructure code then validate with tests. A safety-first refactoring workflow.",
  },
  {
    trigger: ["code-generation", "styling"],
    title: "Component Build Pack",
    workflowType: "component-build",
    description: "Generate a component then polish its styling. Ideal for UI feature work.",
  },
  {
    trigger: ["architecture", "code-generation"],
    title: "Feature Planning Pack",
    workflowType: "feature-planning",
    description: "Plan the architecture first, then generate the implementation code.",
  },
];

function detectStandardPacks(
  sequences: SessionSequence[],
  allPrompts: Prompt[]
): InferredPack[] {
  const packs: InferredPack[] = [];

  for (const pattern of STANDARD_PATTERNS) {
    let matchCount = 0;
    const matchingPrompts: Prompt[][] = pattern.trigger.map(() => []);

    for (const ss of sequences) {
      const cats = ss.categories;
      for (let i = 0; i <= cats.length - pattern.trigger.length; i++) {
        const matches = pattern.trigger.every((t, j) => cats[i + j] === t);
        if (matches) {
          matchCount++;
          for (let j = 0; j < pattern.trigger.length; j++) {
            matchingPrompts[j].push(ss.prompts[i + j]);
          }
        }
      }
    }

    if (matchCount < 2) continue;

    const steps: PackStep[] = pattern.trigger.map((cat, i) => {
      const best = matchingPrompts[i].reduce(
        (b, p) => ((p.successScore ?? 0) > (b.successScore ?? 0) ? p : b),
        matchingPrompts[i][0]
      );
      return {
        order: i + 1,
        normalizedPrompt: best?.promptText
          ? best.promptText.slice(0, 200)
          : `[${labelFor(cat)} step]`,
        category: cat,
        intent: best?.intent ?? "instruct",
        examplePromptId: best?.id,
      };
    });

    let avgSuccess = 0;
    let cnt = 0;
    for (const arr of matchingPrompts) {
      for (const p of arr) {
        if (p.successScore != null) { avgSuccess += p.successScore; cnt++; }
      }
    }

    const score = Math.min(
      100,
      Math.round(
        matchCount * 10 +
        (cnt > 0 ? (avgSuccess / cnt) * 30 : 0) +
        pattern.trigger.length * 5
      )
    );

    packs.push({
      title: pattern.title,
      description: pattern.description,
      workflowType: pattern.workflowType,
      score,
      steps,
    });
  }

  return packs;
}

// ---------------------------------------------------------------------------
// Main inference
// ---------------------------------------------------------------------------

export function inferPacks(
  sessions: Session[],
  prompts: Prompt[]
): InferredPack[] {
  if (prompts.length === 0 || sessions.length === 0) return [];

  const sequences = extractSessionSequences(sessions, prompts);
  if (sequences.length === 0) return [];

  // 1. Find repeated subsequences
  const repeated = findRepeatedSubsequences(sequences, 3, 2);

  const subsequencePacks: InferredPack[] = repeated.map((match) => {
    const steps: PackStep[] = match.sequence.map((cat, i) => {
      const example = match.bestExamples[i];
      return {
        order: i + 1,
        normalizedPrompt: example?.promptText
          ? example.promptText.slice(0, 200)
          : `[${labelFor(cat)} step]`,
        category: cat,
        intent: example?.intent ?? "instruct",
        examplePromptId: example?.id,
      };
    }).filter((step) => step.normalizedPrompt.length >= 10);

    const score = Math.min(
      100,
      Math.round(
        match.occurrences * 12 +
        match.avgSuccessScore * 30 +
        match.sequence.length * 5
      )
    );

    return {
      title: titleFromSequence(match.sequence),
      description: descriptionFromSequence(match.sequence),
      workflowType: workflowTypeFromSequence(match.sequence),
      score,
      steps,
    };
  });

  // 2. Standard pattern packs
  const standardPacks = detectStandardPacks(sequences, prompts);

  // 3. Merge, deduplicate by workflowType (keep higher score)
  const seen = new Map<string, InferredPack>();
  for (const pack of [...subsequencePacks, ...standardPacks]) {
    const existing = seen.get(pack.workflowType);
    if (!existing || pack.score > existing.score) {
      seen.set(pack.workflowType, pack);
    }
  }

  // 4. Sort by score, return top 10
  return [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
