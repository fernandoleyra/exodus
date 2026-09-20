// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Builds public/snapshot/concordance.json from .cache/conc/ and the bilateral
// spine CSV. Run scripts/fetch-concordance.mjs first.
//
// Every measure here pairs series that claim to describe the SAME quantity for
// the SAME year. Where they do not quite — Eurostat immigration counts returning
// nationals and the bilateral models do not — the difference is named in the
// measure's `note`, because that difference is the point of the view, not a flaw
// in it.
import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { comparePair, quantile } from '../src/concordance/stats.js';

const C = '.cache/conc';
const j = async (n) => JSON.parse(await readFile(`${C}/${n}.json`, 'utf8'));

const wbCountries = await j('wb_countries');
const REAL = new Set(wbCountries.filter(c => !c.aggregate).map(c => c.iso3));
const NAME = new Map(wbCountries.map(c => [c.iso3, c.name]));
const ISO2 = new Map(wbCountries.filter(c => !c.aggregate && c.iso2).map(c => [c.iso2, c.iso3]));
// Eurostat departs from ISO 3166-1 alpha-2 in exactly two places.
ISO2.set('EL', 'GRC');
ISO2.set('UK', 'GBR');

const imfCountries = await j('imf_countries');
const IMF_REAL = new Set(Object.keys(imfCountries));

/** IMF DataMapper returns region aggregates alongside countries in the same map. */
function imfSeries(raw, year, scale = 1) {
  const out = new Map();
  for (const [code, byYear] of Object.entries(raw)) {
    if (!IMF_REAL.has(code) || !REAL.has(code)) continue;
    const v = byYear?.[String(year)];
    if (typeof v === 'number' && Number.isFinite(v)) out.set(code, v * scale);
  }
  return out;
}

function wbSeries(rows, year) {
  const out = new Map();
  for (const r of rows) {
    if (r.year !== year || !REAL.has(r.iso3)) continue;
    if (typeof r.value === 'number' && Number.isFinite(r.value)) out.set(r.iso3, r.value);
  }
  return out;
}

/** JSON-stat flattens every dimension into one index; decode all of them or the keys shift. */
function jsonStat(doc) {
  const ids = doc.id;
  const size = doc.size;
  const cats = ids.map(id => {
    const idx = doc.dimension[id].category.index;
    if (Array.isArray(idx)) return idx;
    const inv = [];
    for (const [k, n] of Object.entries(idx)) inv[n] = k;
    return inv;
  });
  const rows = [];
  for (const [k, value] of Object.entries(doc.value)) {
    let n = Number(k);
    const key = {};
    for (let d = size.length - 1; d >= 0; d--) {
      key[ids[d]] = cats[d][n % size[d]];
      n = Math.floor(n / size[d]);
    }
    rows.push({ key, value });
  }
  return rows;
}

function estatSeries(doc, where = () => true) {
  const out = new Map();
  for (const { key, value } of jsonStat(doc)) {
    if (!where(key)) continue;
    const iso3 = ISO2.get(key.geo);
    if (!iso3 || !REAL.has(iso3)) continue;     // drops EU27_2020, EA20, EA21
    if (typeof value === 'number' && Number.isFinite(value)) out.set(iso3, value);
  }
  return out;
}

// ------------------------------------------------- modelled inflow, from the spine
const MODEL_YEAR = 2022;
const inflow = new Map();
{
  const rl = createInterface({ input: createReadStream('.cache/raw/mig_bilateral.csv'), crlfDelay: Infinity });
  let first = true;
  for await (const line of rl) {
    if (first) { first = false; continue; }
    const c = line.split(',');
    if (+c[3] !== MODEL_YEAR) continue;
    const o = c[1], d = c[2];
    if (o === d) continue;                       // self-flows carry 0 and would only add noise
    const v = +c[6];                             // mig_prev
    if (!Number.isFinite(v)) continue;
    inflow.set(d, (inflow.get(d) ?? 0) + v);
  }
}
console.log(`spine          modelled ${MODEL_YEAR} inflow for ${inflow.size} destinations`);

// ------------------------------------------------- corridor pair, from the snapshot
const snap = JSON.parse(await readFile('public/snapshot/corridors.json', 'utf8'));
const places = JSON.parse(await readFile('public/snapshot/places.json', 'utf8')).places;
const byIdx = places.map(p => p.iso3);
const PERIOD = 5;                                 // periodStarts[5] === 2015
const corridorA = new Map();
const corridorB = new Map();
for (const c of snap.corridors) {
  const a = c.a5?.[PERIOD];
  const b = c.b5?.[PERIOD];
  if (!(a > 0) || !(b > 0)) continue;             // b5 is absent where the second model has no estimate
  const key = `${byIdx[c.o]}>${byIdx[c.d]}`;
  corridorA.set(key, a);
  corridorB.set(key, b);
}
console.log(`corridors      ${corridorA.size} corridors carry both models for ${snap.periodStarts[PERIOD]}-${snap.periodStarts[PERIOD] + 5}`);

// ------------------------------------------------- measures
const YEAR_ECON = 2023;

const imfPPPPC = await j('imf_PPPPC');
const imfLP = await j('imf_LP');
const imfLUR = await j('imf_LUR');

// The flow model is fitted against UN DESA's bilateral stock tables, and the World Bank
// republishes those same UN DESA estimates as SM.POP.TOTL. So at a shared anchor year the two
// are not independent measurements — one is a model of the other's source. Comparing them
// does not ask who is right; it measures how much of the model's stock is imputation over
// corridors UN DESA never observed.
const spineStocks = (await import('./adapters/spine-stocks.mjs')).load;
const stockLayers = (await spineStocks()).layers;
const foreignBorn = stockLayers.find((l) => l.id === 'stock-foreign-born');
const STOCK_ANCHOR = '2020';
const gaskinStock = new Map();
for (const [iso, byYear] of Object.entries(foreignBorn.rows)) {
  const v = byYear[STOCK_ANCHOR];
  if (v > 0 && REAL.has(iso)) gaskinStock.set(iso, v);
}

const MEASURES = [
  {
    id: 'inflow',
    title: 'Immigration inflow',
    question: 'How many people arrived in this country in one year?',
    year: MODEL_YEAR,
    unit: 'people',
    entity: 'country',
    scope: 'Countries that report immigration to Eurostat — EU27, EFTA and candidates.',
    note: 'Eurostat counts anyone establishing residence for twelve months or more, including a country’s own citizens returning home. The bilateral model estimates flows between countries and has no separate notion of a returning national. The narrower Eurostat series, foreign and stateless citizens only, is shown alongside so that part of the gap can be read off directly rather than argued about.',
    series: [
      { id: 'estat-total', label: 'Eurostat, all citizenships', producer: 'Eurostat', kind: 'observed', method: 'Administrative and register counts submitted by national statistical institutes under Regulation (EC) 862/2007.' },
      { id: 'estat-foreign', label: 'Eurostat, foreign and stateless only', producer: 'Eurostat', kind: 'observed', method: 'Same collection, excluding arrivals holding the reporting country’s own citizenship.' },
      { id: 'model', label: 'Gaskin & Abel, modelled flow', producer: 'Gaskin & Abel', kind: 'modelled', method: 'Recurrent network over 18 covariates, trained to reproduce bilateral flows; total inflow here is the sum over all origins.' },
    ],
    data: {
      'estat-total': estatSeries(await j('estat_imm_total'), k => k.agedef === 'COMPLET'),
      'estat-foreign': estatSeries(await j('estat_imm_foreign'), k => k.agedef === 'COMPLET'),
      model: inflow,
    },
    pairs: [['estat-total', 'estat-foreign'], ['estat-total', 'model'], ['estat-foreign', 'model']],
  },
  {
    id: 'corridor',
    title: 'Corridor flow, 2015–2020',
    question: 'How many people moved along one origin–destination corridor?',
    year: 2015,
    unit: 'people over five years',
    entity: 'corridor',
    scope: 'Every corridor for which both models publish an estimate.',
    note: 'Neither series is an observation. Both are statistical reconstructions of flows that no country measures bilaterally, built from successive migrant-stock tables by different estimators. This pair is the honest floor on how much of the migration picture is inference.',
    series: [
      { id: 'gaskin-abel', label: 'Gaskin & Abel', producer: 'Gaskin & Abel', kind: 'modelled', method: 'Deep recurrent network over 18 covariates, annual, 230 countries.' },
      { id: 'abel', label: 'Abel, closed demographic accounting', producer: 'Abel', kind: 'modelled', method: 'Demographic accounting estimator da_pb_closed on quinquennial stock tables, summed over sex and over the disjoint outward, return and transit components.' },
    ],
    data: { 'gaskin-abel': corridorA, abel: corridorB },
    pairs: [['gaskin-abel', 'abel']],
  },
  {
    id: 'stock',
    title: 'Foreign-born population',
    question: 'How many people living here were born somewhere else?',
    year: +STOCK_ANCHOR,
    unit: 'people',
    entity: 'country',
    scope: 'Every country both sources cover at the 2020 stock anchor.',
    note: 'These are not two independent measurements. The World Bank republishes UN DESA\u2019s ' +
          'migrant-stock estimates, and the flow model is trained to reproduce the same UN DESA ' +
          'bilateral tables \u2014 so one is a model of the other\u2019s source. What the gap measures ' +
          'is how much of the model\u2019s stock is imputed across corridors UN DESA never observed. ' +
          'The anchor year 2020 is used rather than the model\u2019s newest 2024 because it is the ' +
          'newest year both carry; comparing 2024 against 2020 would report four years of real ' +
          'migration as a disagreement between producers.',
    series: [
      { id: 'wb', label: 'World Bank WDI, UN DESA estimates', producer: 'World Bank', kind: 'modelled', method: 'SM.POP.TOTL \u2014 UN DESA quinquennial migrant-stock estimates, republished by the World Bank.' },
      { id: 'gaskin', label: 'Gaskin & Abel, summed over origins', producer: 'Gaskin & Abel', kind: 'modelled', method: 'The destination margin of the model\u2019s own bilateral stock matrix, summed across all 53,130 corridors before any trimming.' },
    ],
    data: { wb: wbSeries(await j('wb_stock_anchor'), +STOCK_ANCHOR), gaskin: gaskinStock },
    pairs: [['wb', 'gaskin']],
  },
  {
    id: 'unemployment',
    title: 'Unemployment rate',
    question: 'What share of the labour force is out of work?',
    year: YEAR_ECON,
    unit: '% of labour force',
    entity: 'country',
    scope: 'All countries each source covers; the pairs run over the overlap.',
    note: 'The World Bank series is labelled by its publisher as a modelled ILO estimate, not national reporting. Eurostat publishes the harmonised Labour Force Survey rate for its own members. The IMF publishes what member authorities report to it. Three producers, three routes to the same number.',
    series: [
      { id: 'wb', label: 'World Bank, modelled ILO estimate', producer: 'World Bank', kind: 'modelled', method: 'SL.UEM.TOTL.ZS — ILO harmonised model over national inputs.' },
      { id: 'estat', label: 'Eurostat, Labour Force Survey', producer: 'Eurostat', kind: 'observed', method: 'une_rt_a, ages 15–74, annual average of the harmonised LFS.' },
      { id: 'imf', label: 'IMF, World Economic Outlook', producer: 'IMF', kind: 'reported', method: 'LUR — as reported by member authorities to the WEO; recent years may be staff estimates rather than outturns.' },
    ],
    data: {
      wb: wbSeries(await j('wb_unemp'), YEAR_ECON),
      estat: estatSeries(await j('estat_unemp')),
      imf: imfSeries(imfLUR, YEAR_ECON),
    },
    pairs: [['wb', 'estat'], ['wb', 'imf'], ['estat', 'imf']],
  },
  {
    id: 'gdppc',
    title: 'GDP per capita, PPP',
    question: 'What is one person’s share of output, adjusted for what it buys locally?',
    year: YEAR_ECON,
    unit: 'current international $',
    entity: 'country',
    scope: 'All countries covered by both.',
    note: 'Both series are in current international dollars on the 2021 ICP round, so this is as close to like-for-like as two independent producers get. Comparing either against a constant-price series instead would open a gap of about ten percent that has nothing to do with disagreement — which is precisely the trap this view exists to expose.',
    series: [
      { id: 'wb', label: 'World Bank WDI', producer: 'World Bank', kind: 'reported', method: 'NY.GDP.PCAP.PP.CD — national accounts compiled by the World Bank, ICP conversion factors.' },
      { id: 'imf', label: 'IMF, World Economic Outlook', producer: 'IMF', kind: 'reported', method: 'PPPPC — WEO database, current prices, PPP international dollars.' },
    ],
    data: { wb: wbSeries(await j('wb_gdppc_ppp_cd'), YEAR_ECON), imf: imfSeries(imfPPPPC, YEAR_ECON) },
    pairs: [['wb', 'imf']],
  },
  {
    id: 'population',
    title: 'Population',
    question: 'How many people live here?',
    year: YEAR_ECON,
    unit: 'people',
    entity: 'country',
    scope: 'All countries covered by both.',
    note: 'The simplest quantity in the app, and the one where two agencies should have least room to differ. Whatever gap survives here is the floor under every per-capita figure elsewhere in Exodus, because every one of them divides by this.',
    series: [
      { id: 'wb', label: 'World Bank WDI', producer: 'World Bank', kind: 'reported', method: 'SP.POP.TOTL — de facto mid-year population.' },
      { id: 'imf', label: 'IMF, World Economic Outlook', producer: 'IMF', kind: 'reported', method: 'LP — WEO population in millions, rescaled here to people.' },
    ],
    data: { wb: wbSeries(await j('wb_pop'), YEAR_ECON), imf: imfSeries(imfLP, YEAR_ECON, 1e6) },
    pairs: [['wb', 'imf']],
  },
];

// ------------------------------------------------- assemble
const out = { year: null, measures: [] };
for (const m of MEASURES) {
  const keys = [...new Set(Object.values(m.data).flatMap(d => [...d.keys()]))].sort();
  const values = {};
  for (const k of keys) {
    const row = {};
    for (const [sid, d] of Object.entries(m.data)) if (d.has(k)) row[sid] = d.get(k);
    if (Object.keys(row).length > 1) values[k] = row;   // a key only one source covers cannot be compared
  }
  const pairs = m.pairs.map(([aId, bId]) => {
    const shared = Object.keys(values).filter(k => values[k][aId] != null && values[k][bId] != null);
    const stats = comparePair(shared.map(k => values[k][aId]), shared.map(k => values[k][bId]));

    // The outlier list has to earn its place. Ranked on ratio alone it fills with
    // entries where one model estimates almost nothing — a corridor of 59,000 against
    // a corridor of 1 scores 59,000x and tells the reader only that one side rounded
    // to zero. Those belong in the spread statistic, which is why they stay in it, but
    // as a showcase they are noise. So the table is drawn from entries that are
    // material on BOTH sides: at or above each series' own lower quartile.
    const floorA = quantile(shared.map(k => values[k][aId]).sort((x, y) => x - y), 0.25);
    const floorB = quantile(shared.map(k => values[k][bId]).sort((x, y) => x - y), 0.25);
    const material = shared.filter(k => values[k][aId] >= floorA && values[k][bId] >= floorB);
    const worst = material
      .map(k => ({ key: k, ratio: values[k][aId] / values[k][bId] }))
      .filter(r => Number.isFinite(r.ratio) && r.ratio > 0)
      .sort((x, y) => Math.abs(Math.log(y.ratio / stats.medianRatio)) - Math.abs(Math.log(x.ratio / stats.medianRatio)))
      .slice(0, 12)
      .map(r => ({ key: r.key, ratio: +r.ratio.toFixed(4) }));

    return {
      a: aId, b: bId, ...stats,
      medianRatio: +stats.medianRatio.toFixed(4),
      spreadPct: +stats.spreadPct.toFixed(2),
      rankRho: stats.rankRho === null ? null : +stats.rankRho.toFixed(4),
      quantiles: stats.quantiles.map(q => +q.toFixed(4)),
      worst, materialN: material.length,
      floors: [+floorA.toPrecision(4), +floorB.toPrecision(4)],
    };
  });
  const labels = {};
  for (const k of Object.keys(values)) {
    labels[k] = m.entity === 'corridor'
      ? k.split('>').map(p => NAME.get(p) ?? p).join(' → ')
      : NAME.get(k) ?? k;
  }
  out.measures.push({
    id: m.id, title: m.title, question: m.question, year: m.year, unit: m.unit,
    entity: m.entity, scope: m.scope, note: m.note, series: m.series, pairs,
    labels, values,
  });
  console.log(`\n${m.title} (${Object.keys(values).length} comparable ${m.entity === 'corridor' ? 'corridors' : 'countries'})`);
  for (const p of pairs) {
    console.log(`  ${p.a.padEnd(13)} vs ${p.b.padEnd(13)} n=${String(p.n).padStart(4)}  median ratio ${p.medianRatio.toFixed(3).padStart(7)}  spread +-${p.spreadPct.toFixed(1).padStart(5)}%  rho ${p.rankRho === null ? '  n/a' : p.rankRho.toFixed(3)}  -> ${p.cls}`);
  }
}

await writeFile('public/snapshot/concordance.json', JSON.stringify(out));
const bytes = JSON.stringify(out).length;
console.log(`\nwrote public/snapshot/concordance.json  ${(bytes / 1024).toFixed(0)} KB`);
