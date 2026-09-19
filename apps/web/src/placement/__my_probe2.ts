import { makeLocalities, makeCases } from './fixtures';
import { generateCandidates } from './candidates';
import { solve } from './solve';

async function run() {
  for (const seed of [7, 1, 2, 3, 42]) {
    const locs = makeLocalities(24, seed);
    const sp = locs.reduce((s,l)=>s+(l.pledge??0),0);
    const out: string[] = [];
    for (const n of [13, 20, 30, 40]) {
      const cases = makeCases(n, locs, 11 + seed);
      const c = generateCandidates(cases, locs, { K: 8, advisories: [] });
      if (c.kind !== 'ok') { out.push(`n=${n}:candREF`); continue; }
      const r = await solve(cases, locs, c.value, [], {});
      out.push(`n=${n}:${r.kind === 'ok' ? 'ok/unpl=' + r.value.unplacedCount : 'INFEAS'}`);
    }
    console.log(`seed=${seed} sumPledge=${sp}  ${out.join('  ')}`);
  }
}
run().then(()=>process.exit(0));
