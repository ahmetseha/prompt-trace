import type { PromptCategory } from '@/lib/types';

interface CategoryRule {
  category: PromptCategory;
  keywords: string[];
  patterns?: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'bug-fixing',
    keywords: [
      'fix', 'bug', 'error', 'broken', 'crash', 'issue',
      'not working', 'fails', 'failure', 'fault', 'wrong output',
      'unexpected', 'regression', 'patch',
      // Turkish
      'hata', 'düzelt', 'bozuk', 'çalışmıyor', 'sorun', 'problem',
      'beyaz ekran', 'çöküyor', 'patladı',
    ],
    patterns: [/\bnot\s+work/i, /\bdoes\s?n['\u2019]?t\s+work/i, /çalışmıyor/i, /hata\s*(veriyor|aldı|var)/i],
  },
  {
    category: 'refactor',
    keywords: [
      'refactor', 'clean up', 'simplify', 'restructure', 'extract',
      'reorganize', 'rename', 'decouple', 'split into', 'DRY',
      'reduce duplication', 'consolidate',
      'temizle', 'sadeleştir', 'yeniden yapılandır', 'ayır', 'böl',
    ],
  },
  {
    category: 'code-generation',
    keywords: [
      'create', 'generate', 'build', 'implement', 'write', 'add a',
      'make a', 'scaffold', 'boilerplate', 'new component', 'new file',
      'starter', 'from scratch', 'set up',
      'oluştur', 'yaz', 'ekle', 'yap', 'hazırla', 'kur',
      'kodla', 'geliştir', 'entegre et', 'bağla',
    ],
    patterns: [/\b(create|build|write|add)\s+(a|an|the)\b/i, /oluştur/i, /entegre\s+et/i],
  },
  {
    category: 'debugging',
    keywords: [
      'debug', 'trace', 'inspect', 'why does', 'what causes',
      'stack trace', 'console.log', 'breakpoint', 'log output',
      'step through', 'root cause', 'diagnose',
      'neden', 'niye', 'sebebi ne', 'kontrol et', 'incele', 'bak',
    ],
    patterns: [/\bwhy\s+(does|is|do|are|did)\b/i, /\bwhat\s+causes?\b/i, /neden\s+(böyle|oluyor|çalış)/i],
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
      'tasarım', 'renk', 'sayfa', 'görünüm', 'tema', 'ikon',
    ],
  },
  {
    category: 'documentation',
    keywords: [
      'document', 'readme', 'jsdoc', 'comment', 'explain the code',
      'docstring', 'changelog', 'API docs', 'usage guide',
      'type docs', 'annotate', 'tsdoc',
      'dokümantasyon', 'açıkla', 'anlat', 'md yaz', 'md hazırla',
    ],
  },
  {
    category: 'deployment',
    keywords: [
      'deploy', 'CI', 'CD', 'docker', 'pipeline', 'build config',
      'vercel', 'k8s', 'kubernetes', 'terraform', 'nginx',
      'github actions', 'dockerfile', 'compose', 'helm', 'aws',
      'production', 'staging', 'release',
      'yayınla', 'publish', 'npm publish', 'push',
    ],
  },
  {
    category: 'data-backend',
    keywords: [
      'database', 'SQL', 'API', 'endpoint', 'migration', 'schema',
      'query', 'REST', 'graphql', 'prisma', 'drizzle', 'mongoose',
      'ORM', 'table', 'column', 'foreign key', 'index', 'seed',
      'backend', 'server', 'route handler',
      'veritabanı', 'tablo', 'sorgu', 'veri',
    ],
  },
  {
    category: 'performance',
    keywords: [
      'performance', 'optimize', 'slow', 'cache', 'lazy', 'bundle size',
      'memory', 'speed', 'latency', 'profiling', 'bottleneck',
      'tree-shaking', 'code splitting', 'memoize', 'useMemo',
      'useCallback', 'debounce', 'throttle',
      'yavaş', 'hızlandır', 'optimize et',
    ],
  },
  {
    category: 'architecture',
    keywords: [
      'architecture', 'pattern', 'design pattern', 'structure', 'module',
      'dependency', 'monorepo', 'microservice', 'folder structure',
      'separation of concerns', 'clean architecture', 'hexagonal',
      'event-driven', 'pub/sub', 'state management',
      'mimari', 'yapı', 'klasör yapısı',
    ],
  },
  {
    category: 'exploratory',
    keywords: [
      'explore', 'brainstorm', 'idea', 'what if', 'compare options',
      'suggest', 'help me think', 'pros and cons', 'trade-off',
      'approach', 'alternative', 'recommendation', 'which approach',
      'nasıl', 'ne yapalım', 'önerin', 'fikir', 'karşılaştır',
      'hangisi', 'sence', 'mantıklı',
    ],
    patterns: [/\bwhat\s+if\b/i, /\bnasıl\b/i, /\bsence\b/i, /\bhangisi\b/i],
  },
  {
    category: 'review',
    keywords: [
      'review', 'audit', 'check', 'validate', 'improve', 'feedback',
      'code review', 'look over', 'critique', 'best practice',
      'security review', 'lint', 'smell',
      'kontrol', 'gözden geçir', 'doğrula', 'iyileştir',
    ],
  },
];

/** Patterns that indicate noise/metadata, not real prompts */
const NOISE_PATTERNS = [
  /^\[Request interrupted/i,
  /^<local-command/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID only
  /^Tool loaded\.?$/i,
  /^<ide_/i,
];

export function classifyCategory(promptText: string): PromptCategory {
  if (!promptText || promptText.trim().length === 0) return 'unknown';

  const trimmed = promptText.trim();

  // Filter noise - these aren't real prompts
  for (const rx of NOISE_PATTERNS) {
    if (rx.test(trimmed)) return 'unknown';
  }

  const lower = trimmed.toLowerCase();
  const scores = new Map<PromptCategory, number>();

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();
      let idx = 0;
      while (true) {
        const found = lower.indexOf(kwLower, idx);
        if (found === -1) break;
        score += 1;
        idx = found + kwLower.length;
      }
    }

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

  if (scores.size === 0) {
    // Short general commands without keywords -> "general" instead of "unknown"
    if (trimmed.length < 200) return 'general';
    return 'unknown';
  }

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
