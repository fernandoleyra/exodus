import type { Case, Locality, CapacityDim } from './schema';
import { CAPACITY_DIMS } from './schema';
import type { Candidates } from './candidates';
import { solve } from './solve';

const zeroCap = () => Object.fromEntries(CAPACITY_DIMS.map(d => [d, 0])) as Record<CapacityDim, number>;

const loc: Locality = {
  id: 'L1', name: 'One', state: 'ST-A',
  capacity: { ...zeroCap(), beds: 1 },
  servicesOffered: [], languagesServed: ['de'],
  population: 100000, pledge: null, diaspora: { gX: 500 }, costPerPerson: 100,
};

const mkCase = (id: string): Case => ({
  id, persons: 1,
  demand: { ...zeroCap(), beds: 1 },
  required: [], languages: ['de'], legalBasis: 'resettlement',
  consent: { id: `cons-${id}`, recordedAt: '2026-01-01', withdrawable: true },
  preference: { veto: [], ranked: ['L1'] },
  linkedTo: [], auditGroup: 'gX',
});

const cases = [mkCase('C1'), mkCase('C2')];
const cand: Candidates = {
  byCase: new Map([['C1', ['L1']], ['C2', ['L1']]]),
  droppedByGate: { service: 0, refoulement: 0, veto: 0, capacity: 0 },
};

const r = await solve(cases, [loc], cand, [], {});
if (r.kind !== 'ok') { console.log('REFUSAL', r.code, r.reason); process.exit(0); }
const v = r.value;
console.log('unplacedCount =', v.unplacedCount, '/', cases.length);
console.log('fairness.floor (LP t) =', v.fairness.floor);
console.log('fairness.byGroup =', JSON.stringify(v.fairness.byGroup));
console.log('fairness.unplacedByGroup =', JSON.stringify(v.fairness.unplacedByGroup));
for (const res of v.results) {
  console.log(` case ${res.caseId}: unplaced=${res.unplaced} shortlist[0]=${res.shortlist[0]?.localityId} E=${res.shortlist[0]?.terms.E}`);
}
process.exit(0);
