import type { PromptCategory } from '@/lib/types';

// ---------------------------------------------------------------------------
// Weighted keyword lists per category
// ---------------------------------------------------------------------------

interface CategoryRule {
  category: PromptCategory;
  /** Each keyword carries an implicit weight of 1 unless overridden. */
  keywords: string[];
  /** Patterns that earn bonus weight when matched (regex). */
  patterns?: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'bug-fixing',
    keywords: [
      'fix', 'bug', 'error', 'broken', 'crash', 'issue',
      'not working', 'fails', 'failure', 'fault', 'wrong output',
      'unexpected', 'regression', 'patch',
    ],
    patterns: [/\bnot\s+work/i, /\bdoes\s?n['\u2019]?t\s+work/i],
  },
  {
    category: 'refactor',
    keywords: [
      'refactor', 'clean up', 'simplify', 'restructure', 'extract',
      'reorganize', 'rename', 'decouple', 'split into', 'DRY',
      'reduce duplication', 'consolidate',
    ],
  },
  {
    category: 'code-generation',
    keywords: [
      'create', 'generate', 'build', 'implement', 'write', 'add a',
      'make a', 'scaffold', 'boilerplate', 'new component', 'new file',
      'starter', 'from scratch', 'set up',
    ],
    patterns: [/\b(create|build|write|add)\s+(a|an|the)\b/i],
  },
  {
    category: 'debugging',
    keywords: [
      'debug', 'trace', 'inspect', 'why does', 'what causes',
      'stack trace', 'console.log', 'breakpoint', 'log output',
      'step through', 'root cause', 'diagnose',
    ],
    patterns: [/\bwhy\s+(does|is|do|are|did)\b/i, /\bwhat\s+causes?\b/i],
  },
  {
    category: 'testing',
    keywords: [
      'test', 'spec', 'jest', 'vitest', 'coverage', 'assert', 'mock',
      'unit test', 'integration test', 'e2e', 'playwright', 'cypress',
      'test case', 'snapshot', 'expect(', 'describe(', 'it(',
    ],
  },
  {
    category: 'styling',
    keywords: [
      'css', 'style', 'layout', 'responsive', 'tailwind', 'color',
      'font', 'UI', 'design', 'animation', 'theme', 'dark mode',
      'spacing', 'grid', 'flexbox', 'pixel', 'margin', 'padding',
      'scss', 'styled-components',
    ],
  },
  {
    category: 'documentation',
    keywords: [
      'document', 'readme', 'jsdoc', 'comment', 'explain the code',
      'docstring', 'changelog', 'API docs', 'usage guide',
      'type docs', 'annotate', 'tsdoc',
    ],
  },
  {
    category: 'deployment',
    keywords: [
      'deploy', 'CI', 'CD', 'docker', 'pipeline', 'build config',
      'vercel', 'k8s', 'kubernetes', 'terraform', 'nginx',
      'github actions', 'dockerfile', 'compose', 'helm', 'aws',
      'production', 'staging', 'release',
    ],
  },
  {
    category: 'data-backend',
    keywords: [
      'database', 'SQL', 'API', 'endpoint', 'migration', 'schema',
      'query', 'REST', 'graphql', 'prisma', 'drizzle', 'mongoose',
      'ORM', 'table', 'column', 'foreign key', 'index', 'seed',
      'backend', 'server', 'route handler',
    ],
  },
  {
    category: 'performance',
    keywords: [
      'performance', 'optimize', 'slow', 'cache', 'lazy', 'bundle size',
      'memory', 'speed', 'latency', 'profiling', 'bottleneck',
      'tree-shaking', 'code splitting', 'memoize', 'useMemo',
      'useCallback', 'debounce', 'throttle',
    ],
  },
  {
    category: 'architecture',
    keywords: [
      'architecture', 'pattern', 'design pattern', 'structure', 'module',
      'dependency', 'monorepo', 'microservice', 'folder structure',
      'separation of concerns', 'clean architecture', 'hexagonal',
      'event-driven', 'pub/sub', 'state management',
    ],
  },
  {
    category: 'exploratory',
    keywords: [
      'explore', 'brainstorm', 'idea', 'what if', 'compare options',
      'suggest', 'help me think', 'pros and cons', 'trade-off',
      'approach', 'alternative', 'recommendation', 'which approach',
    ],
    patterns: [/\bwhat\s+if\b/i, /\bhelp\s+me\s+think\b/i],
  },
  {
    category: 'review',
    keywords: [
      'review', 'audit', 'check', 'validate', 'improve', 'feedback',
      'code review', 'look over', 'critique', 'best practice',
      'security review', 'lint', 'smell',
    ],
  },
];

// ---------------------------------------------------------------------------
// Scoring engine
// ---------------------------------------------------------------------------

/**
 * Classify a prompt into a `PromptCategory` using weighted keyword matching.
 * Returns the highest-scoring category, or `'unknown'` when no signal is found.
 */
export function classifyCategory(promptText: string): PromptCategory {
  if (!promptText || promptText.trim().length === 0) return 'unknown';

  const lower = promptText.toLowerCase();
  const scores = new Map<PromptCategory, number>();

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    // Keyword matching (case-insensitive)
    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();
      // Count occurrences – each match adds 1 point
      let idx = 0;
      while (true) {
        const found = lower.indexOf(kwLower, idx);
        if (found === -1) break;
        score += 1;
        idx = found + kwLower.length;
      }
    }

    // Pattern matching – each regex match adds 1.5 points (bonus)
    if (rule.patterns) {
      for (const rx of rule.patterns) {
        if (rx.test(promptText)) {
          score += 1.5;
        }
      }
    }

    if (score > 0) {
      scores.set(rule.category, (scores.get(rule.category) ?? 0) + score);
    }
  }

  if (scores.size === 0) return 'unknown';

  // Return category with highest score
  let best: PromptCategory = 'unknown';
  let bestScore = 0;
  for (const [cat, s] of scores) {
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }

  return best;
}
