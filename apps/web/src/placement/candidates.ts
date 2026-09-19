/** M6 — candidate generation. Every hard gate removes a locality from the candidate set.
 *  None of them is a penalty weight: a gate you can outbid is not a gate. */
import { CAPACITY_DIMS, Refusal, ok } from './schema';
import type { Case, Locality, Result } from './schema';

export interface Advisory {
  /** Destination state under a current non-return position. */
  readonly state: string;
  readonly source: string;
}

export interface CandidateOpts {
  readonly K: number;
  readonly advisories: readonly Advisory[];
}

export interface Candidates {
  readonly byCase: Map<string, string[]>;
  readonly droppedByGate: Record<'service' | 'refoulement' | 'veto' | 'capacity', number>;
}

/** Cheap pre-score used only to pick the top K. The real scoring is M7. */
function preScore(c: Case, j: Locality): number {
  const lang = c.languages.filter((l) => j.languagesServed.includes(l)).length / Math.max(1, c.languages.length);
  const dia = Math.log1p(j.diaspora[c.auditGroup] ?? 0);
  const fits = CAPACITY_DIMS.every((d) => (c.demand[d] ?? 0) <= (j.capacity[d] ?? 0));
  return (fits ? 1 : 0) * (1 + 2 * lang + 0.35 * dia);
}

export function generateCandidates(
  cases: readonly Case[], localities: readonly Locality[], opts: CandidateOpts,
): Result<Candidates> {
  // C10 — consent is a gate, not a score. No consent record, no assignment, full stop.
  const withoutConsent = cases.filter((c) => !c.consent);
  if (withoutConsent.length) {
    return new Refusal('NoConsentRecord',
      `${withoutConsent.length} of ${cases.length} cases have no stored consent record. ` +
      `No assignment can be proposed for them.`);
  }

  // A cohort where the median case ranked nothing is a people-shuffler. Refuse to be one.
  const ranks = [...cases].map((c) => c.preference.ranked.length).sort((a, b) => a - b);
  const median = ranks[ranks.length >> 1] ?? 0;
  if (median === 0) {
    return new Refusal('NoPreferenceCoverage',
      `The median case in this cohort ranked zero localities. Allocating on that basis is ` +
      `shuffling people, not matching them. Collect preferences first.`);
  }

  const blockedStates = new Set(opts.advisories.map((a) => a.state));
  const dropped = { service: 0, refoulement: 0, veto: 0, capacity: 0 };
  const byCase = new Map<string, string[]>();

  for (const c of cases) {
    const scored: { id: string; s: number }[] = [];
    for (const j of localities) {
      // C9 — non-refoulement. A destination under a current non-return position is removed
      // outright, not penalised.
      if (blockedStates.has(j.state)) { dropped.refoulement++; continue; }
      // Veto. Unlimited, hard, unoverridable.
      if (c.preference.veto.includes(j.id)) { dropped.veto++; continue; }
      // C3 — minimum service. A required service absent at j removes j.
      if (c.required.some((q) => !j.servicesOffered.includes(q))) { dropped.service++; continue; }
      // Physical impossibility is a gate too.
      if (!CAPACITY_DIMS.every((d) => (c.demand[d] ?? 0) <= (j.capacity[d] ?? 0))) { dropped.capacity++; continue; }
      scored.push({ id: j.id, s: preScore(c, j) });
    }
    scored.sort((a, b) => b.s - a.s);
    byCase.set(c.id, scored.slice(0, opts.K).map((x) => x.id));
  }
  return ok({ byCase, droppedByGate: dropped });
}
