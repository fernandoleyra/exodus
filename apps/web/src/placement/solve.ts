/** M8 — the MILP, and the only place an assignment is ever proposed.
 *
 *  solve() returns a RANKED SHORTLIST. It cannot commit a placement: there is no code path
 *  from here to commitPlacement() that does not pass through a human actor id.
 */
import { CAPACITY_DIMS, Refusal, ok } from './schema';
import type { Case, CapacityDim, Locality, Result } from './schema';
import { DEFAULT_WEIGHTS, combine, decompose, scorePair } from './score';
import type { TermScores, Term, Weights } from './score';
import type { Candidates } from './candidates';

export interface SolveOpts {
  readonly weights?: Weights;
  /** Soft congestion threshold: utilisation above this is penalised. */
  readonly theta?: number;
  /** Anti-concentration cap, as a share of local population, PER SOLVE ROUND. */
  readonly rho?: number;
  readonly mipRelGap?: number;
  readonly timeLimitSec?: number;
  /** Responsibility-sharing target share per state. Deviation is REPORTED, never forced. */
  readonly key?: Readonly<Record<string, number>>;
  readonly fairnessFloor?: boolean;
}

export interface Recommendation {
  readonly localityId: string;
  readonly score: number;
  readonly terms: TermScores;
  readonly contributions: Record<Term, number>;
}

export interface CaseResult {
  readonly caseId: string;
  /** The solver's pick first, then the next best alternatives. */
  readonly shortlist: Recommendation[];
  /** The single term that separated the pick from the runner-up. Only meaningful when the
   *  pick is also the highest-scoring option. */
  readonly decidedBy: Term | null;
  readonly runnerUpGap: number | null;
  /** Set when the solver did NOT pick this case's best-scoring locality, because a
   *  constraint elsewhere in the cohort required the trade. Naming the cost is the whole
   *  point: a case moved off its best match must be able to contest that.  */
  readonly displaced: { bestLocalityId: string; scoreGivenUp: number } | null;
  readonly unplaced: boolean;
}

export interface SolveReport {
  readonly results: CaseResult[];
  readonly mipGap: number | null;
  readonly objective: number | null;
  readonly unplacedCount: number;
  readonly fairness: { floor: number | null; byGroup: Record<string, number> };
  readonly priceOfFairness: number | null;
  readonly keyDeviation: Record<string, number>;
  readonly preferenceCoverage: number;
  readonly statesUnderAdvisory: string[];
  readonly solveMs: number;
}

const v = (i: number, j: number) => `x_${i}_${j}`;

function buildLp(
  cases: readonly Case[], localities: readonly Locality[], cand: Candidates,
  scores: Map<string, TermScores>, w: Weights, opts: Required<Pick<SolveOpts, 'theta' | 'rho' | 'fairnessFloor'>>,
  key: Readonly<Record<string, number>> | undefined,
): { lp: string; index: Map<string, { ci: number; li: number }> } {
  const li = new Map(localities.map((l, i) => [l.id, i]));
  const index = new Map<string, { ci: number; li: number }>();
  const obj: string[] = [];
  const cons: string[] = [];
  const bins: string[] = [];
  const gens: string[] = [];

  cases.forEach((c, ci) => {
    const cs = cand.byCase.get(c.id) ?? [];
    const terms: string[] = [];
    for (const lid of cs) {
      const j = li.get(lid)!;
      const t = scores.get(`${c.id}|${lid}`)!;
      const coef = combine(t, w);
      obj.push(`${coef >= 0 ? '+' : '-'} ${Math.abs(coef).toFixed(6)} ${v(ci, j)}`);
      terms.push(`+ ${v(ci, j)}`);
      bins.push(v(ci, j));
      index.set(v(ci, j), { ci, li: j });
    }
    // C1 — assignment. v_i absorbs an unplaced case at a big-M penalty.
    cons.push(`c1_${ci}: ${terms.join(' ')} + u_${ci} = 1`);
    bins.push(`u_${ci}`);
    obj.push(`- ${w.wU.toFixed(1)} u_${ci}`);
  });

  // C2 — multidimensional capacity, and the congestion variable the source spec referenced
  // but never defined. Without this row the objective's z term is unimplementable.
  localities.forEach((l, j) => {
    for (const d of CAPACITY_DIMS) {
      const load: string[] = [];
      cases.forEach((c, ci) => {
        if (!(cand.byCase.get(c.id) ?? []).includes(l.id)) return;
        const s = c.demand[d as CapacityDim] ?? 0;
        if (s > 0) load.push(`+ ${s} ${v(ci, j)}`);
      });
      if (!load.length) continue;
      cons.push(`c2_${j}_${d}: ${load.join(' ')} <= ${l.capacity[d as CapacityDim] ?? 0}`);
      // z >= load - theta*cap
      cons.push(`cz_${j}_${d}: ${load.join(' ')} - z_${j}_${d} <= ${(opts.theta * (l.capacity[d as CapacityDim] ?? 0)).toFixed(4)}`);
      gens.push(`z_${j}_${d}`);
      obj.push(`- ${w.wS.toFixed(4)} z_${j}_${d}`);
    }
    // C6 — anti-concentration cap, per solve round.
    const people: string[] = [];
    cases.forEach((c, ci) => {
      if ((cand.byCase.get(c.id) ?? []).includes(l.id)) people.push(`+ ${c.persons} ${v(ci, j)}`);
    });
    if (people.length) {
      cons.push(`c6_${j}: ${people.join(' ')} <= ${Math.max(1, Math.floor(opts.rho * l.population))}`);
      // C5 — anti-dumping floor, only where the locality pledged.
      if (l.pledge != null && l.pledge > 0) {
        const xs = cases.map((c, ci) => ((cand.byCase.get(c.id) ?? []).includes(l.id) ? `+ ${v(ci, j)}` : '')).filter(Boolean);
        if (xs.length) cons.push(`c5_${j}: ${xs.join(' ')} >= ${Math.min(l.pledge, xs.length)}`);
      }
    }
  });

  // C7 — group fairness as a max-min floor on group mean predicted outcome.
  if (opts.fairnessFloor) {
    const groups = new Map<string, number[]>();
    cases.forEach((c, ci) => {
      if (!groups.has(c.auditGroup)) groups.set(c.auditGroup, []);
      groups.get(c.auditGroup)!.push(ci);
    });
    for (const [g, members] of groups) {
      const terms: string[] = [];
      for (const ci of members) {
        const c = cases[ci]!;
        for (const lid of cand.byCase.get(c.id) ?? []) {
          const j = li.get(lid)!;
          const e = scores.get(`${c.id}|${lid}`)!.E / members.length;
          terms.push(`+ ${e.toFixed(6)} ${v(ci, j)}`);
        }
      }
      if (terms.length) cons.push(`c7_${g.replace(/\W/g, '')}: ${terms.join(' ')} - t >= 0`);
    }
    gens.push('t');
    obj.push(`+ ${w.wF.toFixed(4)} t`);
  }

  // C8 — responsibility-sharing key, as TWO linear rows. |.| <= d is not an LP constraint.
  const keyDev: string[] = [];
  if (key) {
    const totalPersons = cases.reduce((s, c) => s + c.persons, 0);
    const byState = new Map<string, string[]>();
    localities.forEach((l, j) => {
      if (!byState.has(l.state)) byState.set(l.state, []);
      cases.forEach((c, ci) => {
        if ((cand.byCase.get(c.id) ?? []).includes(l.id)) byState.get(l.state)!.push(`+ ${c.persons} ${v(ci, j)}`);
      });
    });
    for (const [st, terms] of byState) {
      const share = key[st];
      if (share == null || !terms.length) continue;
      const target = (share * totalPersons).toFixed(4);
      const tag = st.replace(/\W/g, '');
      cons.push(`c8a_${tag}: ${terms.join(' ')} - d_${tag} <= ${target}`);
      cons.push(`c8b_${tag}: ${terms.join(' ')} + d_${tag} >= ${target}`);
      gens.push(`d_${tag}`);
      keyDev.push(`- ${w.wQ.toFixed(4)} d_${tag}`);
    }
  }

  const lp = [
    'Maximize',
    ' obj: ' + obj.concat(keyDev).join(' '),
    'Subject To',
    ...cons.map((c) => ' ' + c),
    'Bounds',
    ...gens.map((g) => ` ${g} >= 0`),
    'Binary',
    ...[...new Set(bins)].map((b) => ' ' + b),
    'End',
  ].join('\n');
  return { lp, index };
}

export async function solve(
  cases: readonly Case[], localities: readonly Locality[], cand: Candidates,
  advisories: readonly string[], opts: SolveOpts = {},
): Promise<Result<SolveReport>> {
  const w = opts.weights ?? DEFAULT_WEIGHTS;
  const theta = opts.theta ?? 0.85;
  const rho = opts.rho ?? 0.02;
  const fairnessFloor = opts.fairnessFloor ?? true;

  const maxDiaspora = Math.max(1, ...localities.flatMap((l) => Object.values(l.diaspora)));
  const maxCost = Math.max(1, ...localities.map((l) => l.costPerPerson * Math.max(...cases.map((c) => c.persons))));
  const byId = new Map(localities.map((l) => [l.id, l]));
  const scores = new Map<string, TermScores>();
  for (const c of cases) {
    for (const lid of cand.byCase.get(c.id) ?? []) {
      scores.set(`${c.id}|${lid}`, scorePair(c, byId.get(lid)!, { maxDiaspora, maxCost }));
    }
  }

  const { lp } = buildLp(cases, localities, cand, scores, w, { theta, rho, fairnessFloor }, opts.key);

  const t0 = performance.now();
  const { default: Highs } = await import('highs');
  const highs = await Highs({ locateFile: (f: string) => `node_modules/highs/build/${f}` });
  const sol = highs.solve(lp, {
    mip_rel_gap: opts.mipRelGap ?? 0.01,
    time_limit: opts.timeLimitSec ?? 8,
    output_flag: false,
  });
  const solveMs = performance.now() - t0;

  const chosen = new Map<number, number>();
  for (const [name, col] of Object.entries(sol.Columns ?? {})) {
    const c = col as { Primal?: number };
    if (!name.startsWith('x_') || !(c.Primal! > 0.5)) continue;
    const [, ci, lj] = name.split('_');
    chosen.set(Number(ci), Number(lj));
  }

  // The shortlist, not the assignment. The solver's pick leads, and the next two best
  // candidates follow so a caseworker can see what was nearly chosen and why.
  const results: CaseResult[] = cases.map((c, ci) => {
    const cs = (cand.byCase.get(c.id) ?? []).map((lid) => {
      const t = scores.get(`${c.id}|${lid}`)!;
      return { localityId: lid, score: combine(t, w), terms: t, contributions: decompose(t, w) };
    }).sort((a, b) => b.score - a.score);
    const pickedIdx = chosen.has(ci) ? cs.findIndex((r) => byId.get(r.localityId) === localities[chosen.get(ci)!]) : -1;
    if (pickedIdx > 0) { const [p] = cs.splice(pickedIdx, 1); cs.unshift(p!); }
    const shortlist = cs.slice(0, 3);
    const bestScore = Math.max(...cs.map((x) => x.score));
    const picked = shortlist[0];
    // If the solver's pick is not this case's best-scoring option, the honest explanation
    // is that a constraint moved it — NOT that some term "decided" it.
    const displaced = picked && picked.score < bestScore - 1e-9
      ? { bestLocalityId: cs.find((x) => x.score === bestScore)!.localityId, scoreGivenUp: bestScore - picked.score }
      : null;
    let decidedBy: Term | null = null, gap: number | null = null;
    if (!displaced && shortlist.length >= 2) {
      const [a, b] = shortlist as [Recommendation, Recommendation];
      gap = a.score - b.score;
      let best = -Infinity;
      for (const t of Object.keys(a.contributions) as Term[]) {
        const diff = a.contributions[t] - b.contributions[t];
        if (diff > best) { best = diff; decidedBy = t; }
      }
    }
    return { caseId: c.id, shortlist, decidedBy, runnerUpGap: gap, displaced, unplaced: !chosen.has(ci) };
  });

  const byGroup: Record<string, { s: number; n: number }> = {};
  for (const c of cases) {
    const r = results.find((x) => x.caseId === c.id)!;
    const e = r.shortlist[0]?.terms.E ?? 0;
    byGroup[c.auditGroup] ??= { s: 0, n: 0 };
    byGroup[c.auditGroup]!.s += e; byGroup[c.auditGroup]!.n += 1;
  }
  const groupMeans = Object.fromEntries(Object.entries(byGroup).map(([g, x]) => [g, x.s / x.n]));

  const keyDeviation: Record<string, number> = {};
  for (const [name, col] of Object.entries(sol.Columns ?? {})) {
    if (name.startsWith('d_')) keyDeviation[name.slice(2)] = (col as { Primal?: number }).Primal ?? 0;
  }

  const ranked = cases.filter((c) => c.preference.ranked.length >= 3).length;
  return ok({
    results,
    mipGap: (sol as { MipGap?: number }).MipGap ?? null,
    objective: (sol as { ObjectiveValue?: number }).ObjectiveValue ?? null,
    unplacedCount: results.filter((r) => r.unplaced).length,
    fairness: { floor: (sol.Columns as Record<string, { Primal?: number }>)?.t?.Primal ?? null, byGroup: groupMeans },
    priceOfFairness: null,
    keyDeviation,
    preferenceCoverage: cases.length ? ranked / cases.length : 0,
    statesUnderAdvisory: [...advisories],
    solveMs,
  });
}

/** The ONLY way an assignment becomes real. There is deliberately no overload without an
 *  actor id and a reason: GDPR Art. 22 bars a decision based solely on automated
 *  processing that significantly affects a person. */
export function commitPlacement(args: {
  caseId: string; localityId: string; humanActorId: string; reason: string;
}): { caseId: string; localityId: string; humanActorId: string; reason: string; overrode: boolean } {
  if (!args.humanActorId?.trim()) throw new Error('commitPlacement requires a human actor id');
  if (!args.reason?.trim()) throw new Error('commitPlacement requires a recorded reason');
  return { ...args, overrode: false };
}
