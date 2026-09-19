// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// How far apart are two sources, and *which kind* of far apart?
//
// Showing raw spread is not enough. Most apparent disagreement between data
// producers is definitional — a different base year, a different population
// denominator, a different rule about who counts — and it shows up as a level
// shift that is nearly the same for every country. Real disagreement shows up as
// scatter: the sources argue about individual countries, not about the units.
// A view that shows only the spread would present those two as the same thing.
//
// So every pair is placed on two axes:
//
//   dispersion  how much the per-country ratio A/B varies around its own median,
//               measured in log space so it is symmetric (A twice B scores the
//               same as B twice A) and with a median-absolute-deviation so a
//               handful of outliers cannot manufacture it.
//   rank        Spearman's rho on the shared countries. Two sources can be 60%
//               apart in level and still rank every country identically; that is
//               a units problem. Two sources can agree on the average and still
//               order countries differently; that is a substantive one.

export type DiffClass = 'same' | 'offset' | 'residual' | 'scatter' | 'divergent' | 'conflict' | 'insufficient';

export interface PairStats {
  n: number;
  medianRatio: number;
  /** Robust 1-sigma spread of the ratio, as a percentage. */
  spreadPct: number;
  /** Spearman rank correlation, or null when n is too small to mean anything. */
  rankRho: number | null;
  cls: DiffClass;
  /** Ratio quantiles [p10, p25, p50, p75, p90] — the shape of the disagreement. */
  quantiles: number[];
}

/** Below this many shared entities, none of the statistics below are worth reporting. */
export const MIN_N = 8;

/** A ratio within this of 1.0 is "the same number", allowing for rounding and vintage. */
export const SAME_PCT = 2;

/** Dispersion under this, with a level shift, means one systematic shift rather than per-country disagreement. */
export const OFFSET_PCT = 4;

/** Above this, the sources are not making small independent errors about the same number. */
export const SCATTER_PCT = 8;

/** Above this, the typical country's two figures are further apart than they are together. */
export const DIVERGENT_PCT = 50;

/** Rank agreement under this means the sources are not describing the same ordering. */
export const RANK_FLOOR = 0.8;

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = sorted[Math.floor(pos)] ?? NaN;
  const hi = sorted[Math.ceil(pos)] ?? NaN;
  return lo + (hi - lo) * (pos - Math.floor(pos));
}

export function median(xs: number[]): number {
  return quantile([...xs].sort((a, b) => a - b), 0.5);
}

/** Ranks with ties averaged, which is what Spearman requires. */
export function ranks(xs: number[]): number[] {
  const order = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const out = new Array<number>(xs.length).fill(0);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]!.v === order[i]!.v) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k]!.i] = avg;
    i = j + 1;
  }
  return out;
}

export function spearman(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null;
  const ra = ranks(a);
  const rb = ranks(b);
  const ma = ra.reduce((s, v) => s + v, 0) / ra.length;
  const mb = rb.reduce((s, v) => s + v, 0) / rb.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < ra.length; i++) {
    const x = ra[i]! - ma;
    const y = rb[i]! - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da === 0 || db === 0) return null; // one side is constant; rank is undefined, not 0
  return num / Math.sqrt(da * db);
}

/**
 * Compare two aligned series. `a` and `b` must be the same length and already
 * restricted to entities both sources cover. Zero and non-finite values are
 * dropped, because a ratio through zero is not a ratio.
 */
export function comparePair(a: number[], b: number[]): PairStats {
  const pa: number[] = [];
  const pb: number[] = [];
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i];
    if (av != null && bv != null && Number.isFinite(av) && Number.isFinite(bv) && av > 0 && bv > 0) {
      pa.push(av);
      pb.push(bv);
    }
  }
  const n = pa.length;
  const rankRho = spearman(pa, pb);

  // Every ratio statistic is taken in log space and exponentiated back. For an odd
  // count that is the same answer; for an even one it interpolates geometrically
  // rather than arithmetically, which is what makes the result exactly symmetric —
  // swapping the two sources inverts every number instead of merely nearly doing so.
  const logs = pa.map((v, i) => Math.log(v / pb[i]!)).sort((x, y) => x - y);
  const mLog = quantile(logs, 0.5);
  const medianRatio = Math.exp(mLog);
  const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9].map(q => Math.exp(quantile(logs, q)));

  // MAD of the log ratio, scaled to a normal sigma, then read back as a percentage.
  const sigma = 1.4826 * median(logs.map(l => Math.abs(l - mLog)));
  const spreadPct = Number.isFinite(sigma) ? (Math.exp(sigma) - 1) * 100 : NaN;

  // The order matters. A rank failure outranks everything, because if the sources
  // disagree about the ordering then the level statistics describe nothing. After
  // that the split is between a shift (tight spread, wrong level) and noise (level
  // right, spread wide) — the two cases a single "percent different" number hides.
  const shiftPct = Math.abs(medianRatio - 1) * 100;
  let cls: DiffClass;
  if (n < MIN_N) cls = 'insufficient';
  else if (rankRho !== null && rankRho < RANK_FLOOR) cls = 'conflict';
  else if (spreadPct < SAME_PCT && shiftPct < SAME_PCT) cls = 'same';
  else if (spreadPct < OFFSET_PCT && shiftPct >= SAME_PCT) cls = 'offset';
  else if (spreadPct < SCATTER_PCT) cls = 'residual';
  else if (spreadPct < DIVERGENT_PCT) cls = 'scatter';
  else cls = 'divergent';

  return { n, medianRatio, spreadPct, rankRho, cls, quantiles };
}

export const CLASS_LABEL: Record<DiffClass, string> = {
  same: 'Same number',
  offset: 'Fixed offset',
  residual: 'Agree, with residual',
  scatter: 'Scatter',
  divergent: 'Substantive disagreement',
  conflict: 'Different ordering',
  insufficient: 'Too few shared entries',
};

export const CLASS_MEANING: Record<DiffClass, string> = {
  same: 'The two series agree to within rounding. That is usually not independent confirmation — it means one is derived from the other, or both trace back to the same national submission. Treat them as one source, not two.',
  offset: 'Every country is shifted by about the same factor. That is a definition or a base, not a disagreement: the sources are measuring slightly different things, consistently. Convert between them and the gap closes.',
  residual: 'The levels match and the ordering matches; what is left is the ordinary residual of two organisations compiling the same national accounts on their own schedules. Either figure is quotable; the spread is the precision you actually have.',
  scatter: 'The sources agree about which countries are larger, but not by how much, and the gap is not uniform. No single conversion factor fixes it. Read the country list before quoting either figure.',
  divergent: 'For a typical country the two figures differ by more than they share. These are not two measurements of one number — they are two models, and the spread is the honest uncertainty on the quantity itself.',
  conflict: 'The sources do not even order entries the same way. At least one is wrong about something structural, and no average of the two is meaningful.',
  insufficient: 'Fewer entries are covered by both sources than it takes to say anything about the shape of the difference.',
};

/** Worst first. Used to rank the pair list so the least trustworthy comparison leads. */
export const CLASS_SEVERITY: Record<DiffClass, number> = {
  conflict: 6, divergent: 5, scatter: 4, residual: 3, offset: 2, same: 1, insufficient: 0,
};
