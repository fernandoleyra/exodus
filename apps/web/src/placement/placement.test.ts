import { describe, expect, it } from 'vitest';
import { DESTINATION_LEGAL_BASIS, ImportError, importCases, suppress } from './schema';
import { generateCandidates } from './candidates';
import { commitPlacement, solve } from './solve';
import { makeCases, makeLocalities } from './fixtures';
import { DEFAULT_WEIGHTS } from './score';

const L = makeLocalities(24);
const C = makeCases(90, L);
const cand = () => {
  const r = generateCandidates(C, L, { K: 8, advisories: [] });
  if (r.kind !== 'ok') throw new Error('expected candidates');
  return r.value;
};

describe('the harm is unrepresentable, not discouraged', () => {
  it('has no removal-shaped legal basis anywhere in the enum', () => {
    for (const forbidden of ['return', 'readmission', 'transit', 'offshore_processing', 'deportation']) {
      expect(DESTINATION_LEGAL_BASIS).not.toContain(forbidden);
    }
  });

  it('writes ZERO rows when an import carries an unknown legal basis', () => {
    const rows = [
      { id: 'a', legalBasis: 'resettlement' },
      { id: 'b', legalBasis: 'return' },        // the one that must kill the import
      { id: 'c', legalBasis: 'resettlement' },
    ];
    expect(() => importCases(rows)).toThrow(ImportError);
    try { importCases(rows); } catch (e) { expect((e as Error).message).toMatch(/Zero rows written/); }
  });

  it('writes ZERO rows when legal basis is null', () => {
    expect(() => importCases([{ id: 'a', legalBasis: null }])).toThrow(ImportError);
  });

  it('cannot commit a placement without a human actor id and a reason', () => {
    expect(() => commitPlacement({ caseId: 'c', localityId: 'l', humanActorId: '', reason: 'x' })).toThrow(/human actor/);
    expect(() => commitPlacement({ caseId: 'c', localityId: 'l', humanActorId: 'u1', reason: '' })).toThrow(/reason/);
    expect(commitPlacement({ caseId: 'c', localityId: 'l', humanActorId: 'u1', reason: 'ok' }).humanActorId).toBe('u1');
  });
});

describe('gates remove options rather than pricing them', () => {
  it('strips every locality in a state under a non-return advisory', () => {
    const blocked = L.filter((l) => l.state === 'ST-B').map((l) => l.id);
    const r = generateCandidates(C, L, { K: 8, advisories: [{ state: 'ST-B', source: 'UNHCR position' }] });
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    // A generator that returned nothing at all would also satisfy "no blocked locality".
    const total = [...r.value.byCase.values()].reduce((n, ids) => n + ids.length, 0);
    expect(total).toBeGreaterThan(0);
    for (const [, ids] of r.value.byCase) {
      for (const id of ids) expect(blocked).not.toContain(id);
    }
    expect(r.value.droppedByGate.refoulement).toBeGreaterThan(0);
  });

  it('refuses the whole cohort when a case has no consent record', () => {
    const noConsent = C.map((c, i) => (i === 3 ? { ...c, consent: null } : c));
    const r = generateCandidates(noConsent, L, { K: 8, advisories: [] });
    expect(r.kind).toBe('refusal');
    if (r.kind === 'refusal') expect(r.code).toBe('NoConsentRecord');
  });

  it('refuses a cohort whose median case ranked nothing', () => {
    const noPrefs = makeCases(60, L, 11, { noPrefs: true });
    const r = generateCandidates(noPrefs, L, { K: 8, advisories: [] });
    expect(r.kind).toBe('refusal');
    if (r.kind === 'refusal') {
      expect(r.code).toBe('NoPreferenceCoverage');
      expect(r.reason).toMatch(/shuffling people/);
    }
  });

  it('never offers a vetoed locality', () => {
    const r = generateCandidates(C, L, { K: 8, advisories: [] });
    if (r.kind !== 'ok') throw new Error();
    for (const c of C) {
      for (const id of r.value.byCase.get(c.id) ?? []) expect(c.preference.veto).not.toContain(id);
    }
  });
});

describe('the solver explains itself', () => {
  it('returns a ranked shortlist of at most three with a per-term decomposition', async () => {
    const r = await solve(C, L, cand(), [], { timeLimitSec: 8 });
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.value.results).toHaveLength(C.length);
    for (const res of r.value.results) {
      expect(res.shortlist.length).toBeGreaterThan(0);
      expect(res.shortlist.length).toBeLessThanOrEqual(3);
      const top = res.shortlist[0]!;
      const sum = Object.values(top.contributions).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(top.score, 6);          // contributions must sum to the score
      // Either a term decided it, or the case was displaced off its best match and we say
      // so. Claiming a deciding term for a displaced case is the failure mode we test for.
      if (res.shortlist.length >= 2) {
        expect(res.decidedBy !== null || res.displaced !== null).toBe(true);
        if (res.displaced) {
          expect(res.decidedBy).toBeNull();
          expect(res.displaced.scoreGivenUp).toBeGreaterThan(0);
        }
        if (res.runnerUpGap !== null) expect(res.runnerUpGap).toBeGreaterThanOrEqual(0);
      }
    }
  }, 60_000);

  it('respects capacity: no locality is assigned beyond its beds', async () => {
    const cd = cand();
    const r = await solve(C, L, cd, [], { timeLimitSec: 8 });
    if (r.kind !== 'ok') throw new Error();
    // Without this the test passes vacuously against a solver that places nobody.
    const placedCount = r.value.results.filter((x) => !x.unplaced).length;
    expect(placedCount).toBeGreaterThan(C.length * 0.5);
    const load = new Map<string, number>();
    for (const res of r.value.results) {
      if (res.unplaced) continue;
      const pick = res.shortlist[0]!.localityId;
      const c = C.find((x) => x.id === res.caseId)!;
      load.set(pick, (load.get(pick) ?? 0) + c.demand.beds);
    }
    for (const [lid, used] of load) {
      const l = L.find((x) => x.id === lid)!;
      expect(used).toBeLessThanOrEqual(l.capacity.beds);
    }
  }, 60_000);

  it('reports key deviation instead of silently forcing the key', async () => {
    const key = { 'ST-A': 0.4, 'ST-B': 0.3, 'ST-C': 0.2, 'ST-D': 0.1 };
    const r = await solve(C, L, cand(), [], { key, timeLimitSec: 8 });
    if (r.kind !== 'ok') throw new Error();
    expect(Object.keys(r.value.keyDeviation).length).toBeGreaterThan(0);
  }, 60_000);
});

describe('the solver does not report outcomes it did not produce', () => {
  it('names no deciding term for an unplaced case', async () => {
    const r = await solve(C, L, cand(), [], { timeLimitSec: 8 });
    if (r.kind !== 'ok') throw new Error();
    for (const res of r.value.results) {
      if (res.unplaced) {
        expect(res.decidedBy).toBeNull();
        expect(res.runnerUpGap).toBeNull();
      }
    }
  }, 60_000);

  it('excludes unplaced cases from group outcome means and counts them separately', async () => {
    const r = await solve(C, L, cand(), [], { timeLimitSec: 8 });
    if (r.kind !== 'ok') throw new Error();
    expect(r.value.fairness.unplacedByGroup).toBeDefined();
    const totalUnplaced = Object.values(r.value.fairness.unplacedByGroup).reduce((a, b) => a + b, 0);
    expect(totalUnplaced).toBe(r.value.unplacedCount);
  }, 60_000);

  it('refuses rather than returning an empty result when the model cannot be solved', async () => {
    // An anti-dumping floor larger than the whole cohort cannot be satisfied.
    const impossible = L.map((l) => ({ ...l, pledge: 9999 }));
    const cd = generateCandidates(C, impossible, { K: 8, advisories: [] });
    if (cd.kind !== 'ok') throw new Error();
    const r = await solve(C, impossible, cd.value, [], { timeLimitSec: 8 });
    expect(r.kind).toBe('refusal');
  }, 60_000);
});

describe('weights and disclosure', () => {
  it('the seven score weights sum to exactly 1.00', () => {
    const w = DEFAULT_WEIGHTS;
    const sum = w.wE + w.wN + w.wL + w.wH + w.wP + w.wK + w.wF;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('suppresses any public aggregate below k=10', () => {
    expect(suppress(9)).toBe('SUPPRESSED');
    expect(suppress(10)).toBe(10);
  });
});
