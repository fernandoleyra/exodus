import { expect, it } from 'vitest';
import { appendFileSync } from 'fs';
import { generateCandidates } from './candidates';
import { solve } from './solve';
import { makeCases, makeLocalities } from './fixtures';
import { CAPACITY_DIMS } from './schema';

const OUT = '/tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/probe.txt';
const log = (...a: unknown[]) => appendFileSync(OUT, a.map(String).join(' ') + '\n');

const L = makeLocalities(24);
const C = makeCases(90, L);

it('probe', async () => {
  const cr = generateCandidates(C, L, { K: 8, advisories: [] });
  if (cr.kind !== 'ok') throw new Error('cand not ok');
  const r = await solve(C, L, cr.value, [], { timeLimitSec: 8 });
  if (r.kind !== 'ok') throw new Error('solve not ok: ' + JSON.stringify(r));
  const placedCount = r.value.results.filter((x) => !x.unplaced).length;
  log('TOTAL CASES   =', C.length);
  log('placedCount   =', placedCount);
  log('unplacedCount =', C.length - placedCount, '| reported:', r.value.unplacedCount);
  log('guard: placedCount >', C.length * 0.5, '=>', placedCount > C.length * 0.5);

  const load = new Map<string, number>();
  for (const res of r.value.results) {
    if (res.unplaced) continue;
    const pick = res.shortlist[0]!.localityId;
    const c = C.find((x) => x.id === res.caseId)!;
    load.set(pick, (load.get(pick) ?? 0) + c.demand.beds);
  }
  log('load.size     =', load.size);
  let executed = 0;
  for (const [lid, used] of load) {
    const l = L.find((x) => x.id === lid)!;
    expect(used).toBeLessThanOrEqual(l.capacity.beds);
    executed++;
  }
  log('capacity assertions EXECUTED =', executed);

  const multi = new Map<string, Record<string, number>>();
  for (const res of r.value.results) {
    if (res.unplaced) continue;
    const pick = res.shortlist[0]!.localityId;
    const c = C.find((x) => x.id === res.caseId)!;
    const acc = multi.get(pick) ?? {};
    for (const d of CAPACITY_DIMS) acc[d] = (acc[d] ?? 0) + ((c.demand as Record<string, number>)[d] ?? 0);
    multi.set(pick, acc);
  }
  const viol: string[] = [];
  for (const [lid, acc] of multi) {
    const l = L.find((x) => x.id === lid)!;
    for (const d of CAPACITY_DIMS) {
      const cap = (l.capacity as Record<string, number>)[d] ?? 0;
      if ((acc[d] ?? 0) > cap) viol.push(`${lid}/${d}: ${acc[d]} > ${cap}`);
    }
  }
  log('CAPACITY_DIMS =', JSON.stringify(CAPACITY_DIMS));
  log('violations on OTHER dims =', viol.length, JSON.stringify(viol.slice(0, 10)));
}, 120_000);
