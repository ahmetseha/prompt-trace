// ---------------------------------------------------------------------------
// Optimization-score calculator  (0–100)
// Weighted average of all other analysis scores.
// ---------------------------------------------------------------------------

import { calculateClarityScore } from './clarity';
import { calculateSpecificityScore } from './specificity';
import { calculateConstraintScore } from './constraints';
import { calculateContextEfficiency } from './context-efficiency';
import { calculateAmbiguityScore } from './ambiguity';

const WEIGHTS = {
  clarity: 0.25,
  specificity: 0.20,
  constraints: 0.15,
  contextEfficiency: 0.20,
  ambiguity: 0.20,
} as const;

/**
 * Calculate an overall optimization score (0–100) as a weighted average
 * of clarity, specificity, constraints, context efficiency, and ambiguity.
 */
export function calculateOptimizationScore(promptText: string): {
  score: number;
  explanation: string;
  signals: string[];
} {
  const clarity = calculateClarityScore(promptText);
  const specificity = calculateSpecificityScore(promptText);
  const constraints = calculateConstraintScore(promptText);
  const contextEfficiency = calculateContextEfficiency(promptText);
  const ambiguity = calculateAmbiguityScore(promptText);

  const weightedScore =
    clarity.score * WEIGHTS.clarity +
    specificity.score * WEIGHTS.specificity +
    constraints.score * WEIGHTS.constraints +
    contextEfficiency.score * WEIGHTS.contextEfficiency +
    ambiguity.score * WEIGHTS.ambiguity;

  const score = Math.max(0, Math.min(100, Math.round(weightedScore)));

  const signals: string[] = [
    `clarity: ${clarity.score}`,
    `specificity: ${specificity.score}`,
    `constraints: ${constraints.score}`,
    `context efficiency: ${contextEfficiency.score}`,
    `ambiguity (lower is worse): ${ambiguity.score}`,
  ];

  // Identify weakest area
  const scores = [
    { name: 'clarity', value: clarity.score },
    { name: 'specificity', value: specificity.score },
    { name: 'constraints', value: constraints.score },
    { name: 'context efficiency', value: contextEfficiency.score },
    { name: 'ambiguity', value: ambiguity.score },
  ];
  scores.sort((a, b) => a.value - b.value);

  if (scores[0].value < 50) {
    signals.push(`weakest area: ${scores[0].name} (${scores[0].value})`);
  }

  const explanation =
    score >= 80
      ? 'Prompt is well-optimized across all dimensions.'
      : score >= 60
        ? `Prompt is reasonably optimized. Focus on improving ${scores[0].name} for best results.`
        : score >= 40
          ? `Prompt needs optimization. Weakest areas: ${scores[0].name} and ${scores[1].name}.`
          : `Prompt is poorly optimized across multiple dimensions. Start with ${scores[0].name}.`;

  return { score, explanation, signals };
}
