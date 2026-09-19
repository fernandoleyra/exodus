/** M7 — per (case, locality) scoring. Six terms, each normalised to [0,1].
 *
 *  Nationality, ethnicity, religion, gender and marital status are NOT inputs to any term.
 *  `auditGroup` exists only to audit fairness of the result and never enters a score.
 */
import type { Case, Locality } from './schema';

export const TERMS = ['E', 'N', 'L', 'H', 'P', 'K'] as const;
export type Term = (typeof TERMS)[number];

/** Defaults. The seven score weights sum to exactly 1.00; wU, wS and wQ sit OUTSIDE that
 *  normalisation and are not part of the sum. */
export interface Weights {
  wE: number; wN: number; wL: number; wH: number; wP: number; wK: number; wF: number;
  wU: number; wS: number; wQ: number;
}
export const DEFAULT_WEIGHTS: Weights = {
  wE: 0.30, wN: 0.15, wL: 0.10, wH: 0.08, wP: 0.25, wK: 0.05, wF: 0.07,
  wU: 1000, wS: 0.02, wQ: 0.10,
};

export interface TermScores { E: number; N: number; L: number; H: number; P: number; K: number }

export function scorePair(c: Case, j: Locality, ctx: { maxDiaspora: number; maxCost: number }): TermScores {
  // E — predicted probability of employment/income adequacy at 90 days. A transparent
  // surrogate stands in for the fitted model; it is labelled as such and uses no
  // protected attribute.
  const langFit = c.languages.filter((l) => j.languagesServed.includes(l)).length / Math.max(1, c.languages.length);
  const slack = (j.capacity.beds - c.demand.beds) / Math.max(1, j.capacity.beds);
  const E = Math.max(0, Math.min(1, 0.25 + 0.45 * langFit + 0.30 * Math.max(0, slack)));

  const N = ctx.maxDiaspora > 0
    ? Math.log1p(j.diaspora[c.auditGroup] ?? 0) / Math.log1p(ctx.maxDiaspora) : 0;
  const L = langFit;
  const H = c.required.length === 0
    ? 1 : c.required.filter((q) => j.servicesOffered.includes(q)).length / c.required.length;

  // P — preference satisfaction. Rank r of R gives 1 - (r-1)/R; unranked gives 0, and that
  // zero is visible in the explanation rather than hidden.
  const r = c.preference.ranked.indexOf(j.id);
  const R = c.preference.ranked.length;
  const P = r < 0 || R === 0 ? 0 : 1 - r / R;

  const K = ctx.maxCost > 0 ? Math.min(1, (j.costPerPerson * c.persons) / ctx.maxCost) : 0;
  return { E, N, L, H, P, K };
}

export function combine(t: TermScores, w: Weights): number {
  return w.wE * t.E + w.wN * t.N + w.wL * t.L + w.wH * t.H + w.wP * t.P - w.wK * t.K;
}

/** Absolute contribution of each term to the final score, for the explanation panel. */
export function decompose(t: TermScores, w: Weights): Record<Term, number> {
  return { E: w.wE * t.E, N: w.wN * t.N, L: w.wL * t.L, H: w.wH * t.H, P: w.wP * t.P, K: -w.wK * t.K };
}
