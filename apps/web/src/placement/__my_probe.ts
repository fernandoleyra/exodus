import { makeLocalities, makeCases } from './fixtures';
import { generateCandidates } from './candidates';
import { solve } from './solve';

async function run() {
  const locs = makeLocalities(24);
  const pledged = locs.filter(l => l.pledge != null && l.pledge > 0);
  console.log('pledged localities:', pledged.map(l => `${l.id}=${l.pledge}`).join(' '));
  console.log('sum pledge =', pledged.reduce((s,l)=>s+(l.pledge??0),0));
  const nopledge = locs.map(l => ({ ...l, pledge: null }));
  for (const n of [1,2,4,6,8,10,12,14,16,18,20]) {
    const cases = makeCases(n, locs);
    const c1 = generateCandidates(cases, locs, { K: 8, advisories: [] });
    const c2 = generateCandidates(cases, nopledge, { K: 8, advisories: [] });
    if (c1.kind !== 'ok' || c2.kind !== 'ok') { console.log(`n=${n} cand refused`); continue; }
    const a = await solve(cases, locs, c1.value, [], {});
    const b = await solve(cases, nopledge, c2.value, [], {});
    const f = (r:any) => r.kind === 'ok' ? `ok unplaced=${r.value.unplacedCount}` : `REFUSAL ${r.code}`;
    console.log(`n=${String(n).padStart(2)}  withC5: ${f(a).padEnd(18)}  noPledge(noC5): ${f(b)}`);
  }
}
run().then(()=>process.exit(0));
