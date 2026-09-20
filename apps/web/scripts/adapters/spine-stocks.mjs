// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The flow spine stops at 2023 and cannot be moved. Gaskin & Abel read annual flows off a
// network trained to hit UN DESA bilateral stock anchors, and those anchors are 1990, 1995,
// 2000, 2005, 2010, 2015, 2020 and 2024 — so the terminal flow year is the terminal anchor
// minus one. It moves when UN DESA publishes the next anchor and somebody re-runs the model,
// and not before.
//
// The STOCKS in the same file run a year further, and the file proves both halves at once:
//
//   year   rows with stock_mean > 0   rows with mig_prev > 0
//   2022             53,348                   53,130
//   2023             53,343                   53,130
//   2024             53,284                        0
//
// So a 2024 bilateral stock layer is already sitting in the data this repository builds from,
// under a licence already cleared and credited, while the app ships migrant stock at 2020 from
// the World Bank. This adapter is the cheapest currency in the project: no network, no new
// producer, no new licence.
//
// Licence: CC BY 4.0, Gaskin & Abel, Zenodo 10.5281/zenodo.17344747 — the same record the flow
// spine already comes from and already credits on /#/sources.
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export const meta = {
  id: 'spine-stocks',
  producer: 'Gaskin & Abel',
  licenceId: 'CC-BY-4.0',
  commercialUseClear: true,
};

const RAW = '.cache/raw/mig_bilateral.csv';
const STOCK_YEARS = [2010, 2015, 2020, 2024];

export async function load() {
  // Columns: ,orig,dest,year,stock_mean,stock_std,mig_prev,mig_prev_std,mig_brth,mig_brth_std
  const corridor = new Map();     // "O>D" -> { [year]: stock }
  const byDest = new Map();       // dest  -> { [year]: summed stock }
  const byOrig = new Map();
  let maxStockYear = -Infinity;
  let flowYearsSeen = new Set();

  const rl = createInterface({ input: createReadStream(RAW), crlfDelay: Infinity });
  let first = true;
  for await (const line of rl) {
    if (first) { first = false; continue; }
    const c = line.split(',');
    const year = +c[3];
    if (+c[6] > 0) flowYearsSeen.add(year);
    if (!STOCK_YEARS.includes(year)) continue;
    const o = c[1], d = c[2];
    if (o === d) continue;                       // a self-stock is a resident, not a migrant
    const v = +c[4];                             // stock_mean
    if (!(v > 0)) continue;
    if (year > maxStockYear) maxStockYear = year;

    const key = `${o}>${d}`;
    (corridor.get(key) ?? corridor.set(key, {}).get(key))[year] = v;
    const dd = byDest.get(d) ?? byDest.set(d, {}).get(d);
    dd[year] = (dd[year] ?? 0) + v;
    const oo = byOrig.get(o) ?? byOrig.set(o, {}).get(o);
    oo[year] = (oo[year] ?? 0) + v;
  }

  // The whole point of this adapter is that stocks outrun flows. If that ever stops being
  // true the layer is redundant and should be removed rather than quietly duplicated.
  const maxFlowYear = Math.max(...flowYearsSeen);
  if (!(maxStockYear > maxFlowYear)) {
    throw new Error(`stocks reach ${maxStockYear} and flows reach ${maxFlowYear}: this adapter exists only while stocks are ahead`);
  }

  const periods = STOCK_YEARS.map(String);
  const vintage = {
    periodEnd: `${maxStockYear}-12-31`,
    periodLabel: String(maxStockYear),
    cadence: 'quinquennial',
    coverage: [String(STOCK_YEARS[0]), String(maxStockYear)],
    estimateKind: 'modelled',
    provisional: false,
    producer: 'Gaskin & Abel',
    licenceId: 'CC-BY-4.0',
    doi: '10.5281/zenodo.17344747',
    commercialUseClear: true,
  };

  const asRows = (m) => {
    const out = {};
    for (const [k, v] of m) {
      const row = {};
      for (const y of periods) if (v[y] != null) row[y] = Math.round(v[y]);
      if (Object.keys(row).length) out[k] = row;
    }
    return out;
  };

  // The full matrix is 53,130 corridors and 2.7 MB, which is most of the snapshot's whole
  // budget for one layer. Trim to the 25 largest on BOTH sides — top 25 origins for each
  // destination AND top 25 destinations for each origin, unioned. One-sided trimming looks
  // cheaper but leaves the worst-served destination with 60% of its own stock; two-sided
  // takes it to 76%. The country margins above are summed BEFORE this and stay exact, so the
  // trim costs corridor detail and nothing else. The retention figures in the note are
  // computed here rather than written down, because a figure written down goes stale.
  const TOP = 25;
  const groupBy = (fn) => {
    const m = new Map();
    for (const k of corridor.keys()) {
      const g = fn(k);
      (m.get(g) ?? m.set(g, []).get(g)).push(k);
    }
    return m;
  };
  const newest = String(maxStockYear);
  const sizeOf = (k) => corridor.get(k)?.[newest] ?? 0;
  const keep = new Set();
  for (const side of [groupBy((k) => k.split('>')[0]), groupBy((k) => k.split('>')[1])]) {
    for (const ks of side.values()) {
      ks.sort((a, b) => sizeOf(b) - sizeOf(a));
      for (const k of ks.slice(0, TOP)) keep.add(k);
    }
  }
  let keptStock = 0, allStock = 0;
  for (const k of corridor.keys()) {
    allStock += sizeOf(k);
    if (keep.has(k)) keptStock += sizeOf(k);
  }
  const trimmed = new Map([...corridor].filter(([k]) => keep.has(k)));
  const retained = ((keptStock / allStock) * 100).toFixed(1);

  const NOTE_MODEL =
    'Modelled, not counted. These are the migrant-stock estimates the flow model is fitted ' +
    'against, and they reach a year further than the flows do because the flow for a year is ' +
    'inferred from the change between two stock anchors. The model also fills in corridors the ' +
    'underlying tables never observed, so a corridor can carry a confident-looking number that ' +
    'nobody counted \u2014 the concordance page measures how large that filling-in is, country by ' +
    'country, against the UN DESA figures the model was fitted to.';

  return {
    layers: [
      {
        id: 'stock-corridor',
        title: 'Foreign-born stock by corridor',
        question: 'How many people born in one country are living in another?',
        unit: 'people',
        entity: 'corridor',
        rows: asRows(trimmed),
        periods,
        vintage,
        note: `${NOTE_MODEL} A stock is a standing population, not a movement: do not read a ` +
              'change between two anchors as a flow, and never sum stocks across years. ' +
              `This layer ships the ${trimmed.size.toLocaleString('en')} largest of ${corridor.size.toLocaleString('en')} corridors — ` +
              `the top ${TOP} on each side of every country — which is ${retained}% of the estimated stock. ` +
              'The two country layers are summed over all of them and are not trimmed.',
      },
      {
        id: 'stock-foreign-born',
        title: 'Foreign-born population',
        question: 'How many people living here were born somewhere else?',
        unit: 'people',
        entity: 'country',
        rows: asRows(byDest),
        periods,
        vintage,
        note: `${NOTE_MODEL} Summed over every origin, so it is the destination margin of the ` +
              'corridor layer rather than an independent measurement of it.',
      },
      {
        id: 'stock-diaspora',
        title: 'People born here living abroad',
        question: 'How many people born in this country are living somewhere else?',
        unit: 'people',
        entity: 'country',
        rows: asRows(byOrig),
        periods,
        vintage,
        note: `${NOTE_MODEL} The origin margin of the same matrix. A country can be large on ` +
              'this layer and small on the foreign-born layer, or both at once.',
      },
    ],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { layers } = await load();
  for (const l of layers) {
    const n = Object.keys(l.rows).length;
    const newest = l.vintage.periodLabel;
    const total = Object.values(l.rows).reduce((s, r) => s + (r[newest] ?? 0), 0);
    void 0;
    console.log(`${l.id.padEnd(20)} ${l.entity.padEnd(8)} ${String(n).padStart(6)} entities  ${newest} total=${(total / 1e6).toFixed(2)}M`);
  }
}
