import { makeLocalities, makeCases } from './fixtures';
import { generateCandidates } from './candidates';
import { solve } from './solve';

async function run() {
  // (a) does it fail even when n > sum(pledge)?
  for (const seed of [1,2,3,7,42]) {
    const locs = makeLocalities(24, seed);
    const sp = locs.reduce((s,l)=>s+(l.pledge??0),0);
    const row: string[] = [];
    for (const n of [sp-1, sp, sp+1, sp+3]) {
      const cases = makeCases(n, locs, 11+seed);
      const c = generateCandidates(cases, locs, { K: 8, advisories: [] });
      if (c.kind !== 'ok') { row.push(`${n}:candREF`); continue; }
      const r = await solve(cases, locs, c.value, [], {});
      row.push(`${n}:${r.kind==='ok'?'ok':'INFEAS'}`);
    }
    console.log(`seed=${seed} sumPledge=${sp}  ${row.join(' ')}`);
  }
  // (b) tighter candidate sets, full 90-case cohort
  const locs = makeLocalities(24);
  const cases = makeCases(90, locs);
  for (const K of [1,2,3,4,8]) {
    const c = generateCandidates(cases, locs, { K, advisories: [] });
    if (c.kind !== 'ok') { console.log(`K=${K} candREF`); continue; }
    const r = await solve(cases, locs, c.value, [], {});
    console.log(`n=90 K=${K}: ${r.kind==='ok'?`ok unplaced=${r.value.unplacedCount}`:`INFEAS`}`);
  }
}
run().then(()=>process.exit(0));
