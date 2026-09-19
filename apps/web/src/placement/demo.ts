/** Runs the placement kernel on a synthetic cohort and prints the report a caseworker
 *  would see. Proves the solver actually solves rather than refusing everything. */
import { generateCandidates } from './candidates';
import { solve } from './solve';
import { makeCases, makeLocalities } from './fixtures';

const L = makeLocalities(24);
const C = makeCases(90, L);

const cand = generateCandidates(C, L, { K: 8, advisories: [{ state: 'ST-D', source: 'UNHCR non-return position (synthetic)' }] });
if (cand.kind !== 'ok') { console.log('REFUSED:', cand.code, '-', cand.reason); process.exit(0); }

console.log(`cases ${C.length}  localities ${L.length}  K=8`);
console.log(`gates dropped: ${JSON.stringify(cand.value.droppedByGate)}`);

const key = { 'ST-A': 0.4, 'ST-B': 0.35, 'ST-C': 0.25 };
const r = await solve(C, L, cand.value, ['ST-D'], { key, timeLimitSec: 10 });
if (r.kind !== 'ok') { console.log('REFUSED:', r.code, '-', r.reason); process.exit(0); }
const rep = r.value;

console.log(`\nsolve            ${rep.solveMs.toFixed(0)} ms   objective ${rep.objective?.toFixed(3)}   gap ${rep.mipGap ?? 'n/a'}`);
console.log(`placed           ${C.length - rep.unplacedCount} of ${C.length}`);
console.log(`pref coverage    ${(rep.preferenceCoverage * 100).toFixed(0)}% ranked >= 3`);
console.log(`fairness floor   ${rep.fairness.floor?.toFixed(4) ?? 'off'}`);
console.log(`group means (E)  ${Object.entries(rep.fairness.byGroup).map(([g, v]) => `${g}=${v.toFixed(3)}`).join('  ')}`);
console.log(`key deviation    ${Object.entries(rep.keyDeviation).map(([s, v]) => `${s}=${v.toFixed(1)}`).join('  ')}`);
console.log(`advisory blocked ${rep.statesUnderAdvisory.join(', ')}`);

console.log('\n--- what a caseworker sees for three cases ---');
for (const res of rep.results.slice(0, 3)) {
  console.log(`\n${res.caseId}${res.unplaced ? '  [UNPLACED]' : ''}`);
  res.shortlist.forEach((s, i) => {
    const parts = Object.entries(s.contributions).map(([t, v]) => `${t}${v >= 0 ? '+' : ''}${v.toFixed(3)}`).join(' ');
    console.log(`  ${i + 1}. ${s.localityId.padEnd(8)} score ${s.score.toFixed(4)}   ${parts}`);
  });
  if (res.displaced) {
    console.log(`  NOT this case's best match: ${res.displaced.bestLocalityId} scored ${res.displaced.scoreGivenUp.toFixed(4)} higher.`);
    console.log(`  It was moved because a capacity, fairness or key constraint elsewhere required the trade.`);
  } else if (res.decidedBy) {
    console.log(`  decided by: ${res.decidedBy}   margin over runner-up ${res.runnerUpGap?.toFixed(4)}`);
  }
}
