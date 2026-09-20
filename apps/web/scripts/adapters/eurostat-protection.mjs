// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Eurostat `migr_asy*` — EU/EFTA asylum and temporary-protection administrative returns.
//
// ---------------------------------------------------------------- LICENCE
// Read at https://ec.europa.eu/eurostat/web/main/help/copyright-notice on 2026-09-20.
//
// The trap this project has been burned by twice is on that page in black and white: the
// page grants TWO DIFFERENT things under TWO DIFFERENT instruments, and the CC BY one is
// not the one that covers the numbers below.
//
//   Website content (NOT what we take):
//     "The copyright for the editorial content of this website, which is owned by the EU,
//      is licensed under the Creative Commons Attribution 4.0 International licence."
//
//   Statistical data (what we take) — the operative sentence, verbatim:
//     "Reuse of statistical data, metadata, publications, and other dissemination tools
//      published on this website for commercial or non-commercial purposes is authorised
//      provided the source is acknowledged. The reuse policy of the European Commission is
//      implemented by the Decision of 12 December 2011."
//
// So the data is Commission Decision 2011/833/EU, not CC BY-4.0. Badging these layers
// "CC BY" would be the same false claim in a third outfit. Commercial reuse IS clearly
// granted for the data, hence commercialUseClear: true — but only after the exception
// below is honoured, which is why it is enforced in code rather than trusted.
//
//   "The following Eurostat data and documents may not be reused for commercial purposes,
//    but non-commercial reuse is possible without restriction: [...] Data for countries
//    other than: Member States of the European Union (EU), Member States of the European
//    Free Trade Association (EFTA), official EU acceding and candidate countries."
//
// The exception bites on the REPORTING axis, not the citizenship axis: the same page's
// trade example ("it is allowed to sell Swiss export / import data declared by an EU
// Member State") establishes that a non-EU breakdown of a figure DECLARED BY an EU state
// is still EU data. Every reporter we ship is EU27, EFTA (IS/LI/NO/CH) or a candidate
// (ME) — except UK, which sits in two of these codelists and is none of the three since
// 2020. UK is therefore dropped on the geo axis (GEO_NON_REUSABLE). It happens to be null
// in every period observed on 2026-09-20, so this costs nothing today; it is in code so
// that the day the UK backfills, the licence position does not silently change.
//
// Attribution required by the notice is carried per layer as vintage.doi, read out of each
// dataset's own DISSEMINATION_DOI_XML annotation rather than assembled from a pattern.
// ------------------------------------------------------------------------------------

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { checkIso3, toIso3 } from './_iso3.mjs';

const run = promisify(execFile);

export const meta = {
  id: 'eurostat-protection',
  producer: 'Eurostat',
  licenceId: 'LicenseRef-Eurostat-Reuse',
  commercialUseClear: true,
};

const BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
const CACHE = '.cache/layers/eurostat-protection';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// ---------------------------------------------------------------- deny-lists
//
// Both lists are the codes OBSERVED in the codelists of these seven tables on 2026-09-20,
// not the codes Eurostat's aggregate documentation lists in general. EA19/EA20/EA21 and
// the EEA aggregates are absent from the geo axis of this family, so listing them here
// would be decoration; if one ever appears, the closure assertion below is what catches it.
const GEO_AGGREGATES = new Set(['EU27_2020']);

// Not an aggregate — a licence exclusion. See the header. Kept separate from the
// aggregates so a reader cannot mistake the reason.
const GEO_NON_REUSABLE = new Set(['UK']);

// The citizen axis is the expensive one. At geo=DE, time=2026-Q2 (migr_asydcfstq,
// decision=TOTAL) the 206 members sum to 128,480 against a TOTAL of 42,825 — three times
// the truth — because TOTAL, EU27_2020 and EXT_EU27_2020 all sit INSIDE the axis beside
// their own members. STLS/UNK/RNC/UK_OCT are not aggregates but are not countries either,
// so they cannot key a corridor; they are subtracted from the closure check instead of
// being dropped silently.
const CITIZEN_NOT_A_COUNTRY = new Set(['TOTAL', 'EU27_2020', 'EXT_EU27_2020', 'STLS', 'UNK', 'RNC', 'UK_OCT']);

// ---------------------------------------------------------------- transport
//
// node's fetch reaches ec.europa.eu without a User-Agent dance (verified 2026-09-20), so
// unlike the imf.org path in fetch-concordance.mjs there is no UA to get wrong. curl stays
// as a fallback only because a 15 MB JSON-stat body over a flaky proxy is the one thing
// that actually fails here, and curl retries the transfer rather than the request.
async function getJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.includes('json')) throw new Error(`content-type ${ct}, expected JSON`);
    return await r.json();
  } catch (e) {
    const { stdout } = await run('curl', ['-sS', '--max-time', '300', '--retry', '2', url], { maxBuffer: 512 * 1024 * 1024 });
    try { return JSON.parse(stdout); }
    catch { throw new Error(`${url}: ${e.message}; curl fallback did not return JSON either`); }
  }
}

/**
 * One Eurostat JSON-stat request, cached raw.
 *
 * Everything asserted here is a 200-with-a-lie observed live on 2026-09-20:
 *  - `unit=NR` (or THS_PER, or PC) on migr_asydcfstq answers HTTP 200 with size [1,0,...]
 *    and `value: {}`. A zero-length dimension is the only symptom.
 *  - a request for migr_asydcfstq came back once this session carrying
 *    extension.id === 'MIGR_RESFIRST' — a different dataset, 200, valid JSON-stat, right
 *    content-type. Whether that was an upstream cache or the proxy in front of it, decoding
 *    it would have shipped residence permits labelled as asylum decisions. The dataset
 *    identity is therefore checked against the body, not against the URL we sent.
 */
async function estat(dataset, params, { label = dataset } = {}) {
  const qs = new URLSearchParams({ format: 'JSON', ...params });
  const url = `${BASE}${dataset}?${qs}`;
  const key = `${CACHE}/${label}.json`;

  if (!process.env.EXODUS_NOCACHE) {
    try {
      const s = await stat(key);
      if (Date.now() - s.mtimeMs < CACHE_TTL_MS) return JSON.parse(await readFile(key, 'utf8'));
    } catch { /* cold cache is the normal path on a clean clone */ }
  }

  const j = await getJson(url);
  if (!j || !j.value || !j.dimension || !Array.isArray(j.id) || !Array.isArray(j.size)) {
    throw new Error(`${label}: 200 but not JSON-stat — keys ${Object.keys(j ?? {}).join(',')}`);
  }
  const got = String(j.extension?.id ?? '').toLowerCase();
  if (got !== dataset.toLowerCase()) {
    throw new Error(`${label}: asked for ${dataset}, body says extension.id=${got} ("${j.label}") — refusing to decode another table`);
  }
  if (Math.min(...j.size) <= 0) {
    const empty = j.id.filter((d, i) => j.size[i] === 0);
    throw new Error(`${label}: zero-length dimension ${empty.join(',')} — a wrong code on that axis answers 200 with an empty value object, not an error`);
  }
  if (j.size.length !== j.id.length) throw new Error(`${label}: id/size length mismatch`);

  await mkdir(CACHE, { recursive: true });
  await writeFile(key, JSON.stringify(j));
  return j;
}

// ---------------------------------------------------------------- JSON-stat unpacking
//
// `value` is a SPARSE object keyed by the decimal flat index into the product of ALL
// dimensions in `id`, in `id` order — not the dimensions we pinned. migr_asyappctzm carries
// an `applicant` axis we never asked about and migr_asywitfstq carries `reason`; assuming
// the query's own axes would shift every index by a whole stride and quietly relabel every
// number. So strides come from j.id/j.size, always.
function unpack(j) {
  const ids = j.id;
  const sizes = j.size;
  const strides = new Array(ids.length).fill(1);
  for (let k = ids.length - 2; k >= 0; k--) strides[k] = strides[k + 1] * sizes[k + 1];
  const cats = ids.map((d) => {
    const index = j.dimension[d]?.category?.index;
    if (!index) throw new Error(`dimension ${d} declared in id but carries no category.index`);
    const a = [];
    for (const [code, i] of Object.entries(index)) a[i] = code;
    if (a.length !== sizes[ids.indexOf(d)]) throw new Error(`dimension ${d}: ${a.length} codes for size ${sizes[ids.indexOf(d)]}`);
    return a;
  });
  const pos = Object.fromEntries(ids.map((d, k) => [d, k]));
  const flatOf = (sel) => {
    let f = 0;
    for (const [d, code] of Object.entries(sel)) {
      const k = pos[d];
      if (k === undefined) throw new Error(`no dimension ${d} in ${ids.join('/')}`);
      const i = j.dimension[d].category.index[code];
      if (i === undefined) throw new Error(`no code ${code} on ${d} — codelist is ${cats[k].join(',')}`);
      f += strides[k] * i;
    }
    return f;
  };
  // Any axis the query did not pin to size 1 makes `value` ambiguous at the coordinates we
  // actually read, so requireFree() below rejects the payload rather than letting flatOf()
  // silently resolve to whichever member happens to sit at index 0.
  const free = new Set(ids.filter((d, k) => sizes[k] > 1));
  return {
    ids, sizes, strides, cats, pos, free,
    codes: (d) => cats[pos[d]],
    value: (sel) => { const v = j.value[String(flatOf(sel))]; return v === undefined ? null : v; },
    status: (sel) => j.status?.[String(flatOf(sel))] ?? null,
  };
}

function requireFree(u, expected, label) {
  const extra = [...u.free].filter((d) => !expected.includes(d));
  if (extra.length) throw new Error(`${label}: unpinned dimension(s) ${extra.join(',')} — pin them or the flat index is ambiguous`);
}

// ---------------------------------------------------------------- the partial-tail gate
const median = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  return v.length % 2 ? v[v.length >> 1] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};

/**
 * `lastTimePeriod=N` returns the last N entries of the TIME CODELIST, not the last N with
 * data, and the difference is not visible as nullness at the aggregate: on 2026-09-20
 * migr_asyappctzm's EU27_2020 runs 57,725 → 52,660 → 50,670 → 43,120 across 2026-03..06 and
 * then simply stops, while BE (2,020) and CH (1,915) keep filing into 2026-07 and EE/LI/ME
 * into 2026-08. Charting that tail shows EU asylum applications collapsing ~90% in two
 * months. Nothing about those three numbers is wrong; the period is.
 *
 * So the test is population, not presence: a period is a period when the countries that
 * normally file have filed. Compared against the trailing median rather than against the
 * codelist size, because the expected roster genuinely moves (IS left migr_asytpsm at
 * 2026-07 and is not coming back to that month).
 */
function gateNewest(times, countOf, { window = 6, floor = 0.8, label = '' } = {}) {
  const rejected = [];
  for (let i = times.length - 1; i >= 0; i--) {
    const trailing = times.slice(Math.max(0, i - window), i).map(countOf);
    if (trailing.length < 3) break;
    const expected = median(trailing);
    const n = countOf(times[i]);
    if (n >= Math.ceil(floor * expected)) return { period: times[i], index: i, n, expected, rejected };
    rejected.push(`${times[i]} (${n}/${expected})`);
  }
  throw new Error(`${label}: no period in ${times[0]}..${times[times.length - 1]} clears ${floor * 100}% of its trailing median roster; rejected ${rejected.join(', ')}`);
}

// ---------------------------------------------------------------- period arithmetic
// Mirrors periodEndOf() in src/vintage.ts. Duplicated rather than imported because this is
// a .mjs adapter and src/ is TypeScript; the adapter must not reach into the app's build.
function periodEndOf(label) {
  const q = /^(\d{4})-Q([1-4])$/.exec(label);
  if (q) return `${q[1]}-${['03-31', '06-30', '09-30', '12-31'][+q[2] - 1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(label);
  if (m) return `${m[1]}-${m[2]}-${new Date(Date.UTC(+m[1], +m[2], 0)).getUTCDate()}`;
  if (/^\d{4}$/.test(label)) return `${label}-12-31`;
  throw new Error(`unrecognised period label ${label}`);
}

// ---------------------------------------------------------------- status flags
//
// Eurostat ships one flat `status` dict beside `value`, keyed the same way. The flag is a
// STRING and may carry more than one letter: migr_asytpsm returns "dp" for Spain (definition
// differs AND provisional) and plain "d" for Greece, France and Cyprus. Testing `s === 'p'`
// would have missed Spain, which is exactly the country that matters — ES first-instance
// applications fall 8,275 → 3,005 between 2026-05 and 2026-06 and every one of those months
// is flagged provisional.
const isProvisional = (s) => typeof s === 'string' && s.includes('p');
const isBreak = (s) => typeof s === 'string' && s.includes('b');

/**
 * The two flags are scanned over DIFFERENT windows on purpose.
 *
 * `breaks` spans every shipped period, because a discontinuity anywhere in the window must
 * be drawn as one — Denmark's temporary-protection stock steps 40,045 → 44,525 at 2025-09
 * under a 'b' that sits ten months behind the newest period, and a chart that ignores it
 * draws an 11% jump as growth.
 *
 * `provisional` is read from the NEWEST period only, because that is the period
 * vintage.periodLabel names and the one a chip is about. Raising it for any 'p' anywhere in
 * two years of history would light every layer in this family permanently — Spain is
 * provisional in all seven tables — and a flag that is always on stops being read, which is
 * how a provisional headline gets quoted in the first place.
 */
function scanStatus(u, { geos, times, sel }) {
  const newest = times[times.length - 1];
  let provisional = false;
  const breaks = [];
  const otherFlags = new Map();
  for (const geo of geos) {
    for (const time of times) {
      const s = u.status({ ...sel, geo, time });
      if (!s) continue;
      if (time === newest && isProvisional(s)) provisional = true;
      if (isBreak(s)) breaks.push(`${geo}@${time}`);
      for (const ch of s) if (ch !== 'p' && ch !== 'b') otherFlags.set(ch, (otherFlags.get(ch) ?? 0) + 1);
    }
  }
  return { provisional, breaks, otherFlags };
}

// ---------------------------------------------------------------- shared layer assembly
function reportersAt(u, time, geos) {
  return geos.filter((g) => u.value({ geo: g, time }) !== null).length;
}

function buildVintage(u, j, { period, periods, cadence, n, expected, geos, sel }) {
  const scan = scanStatus(u, { geos, times: periods, sel });
  const { provisional, breaks } = scan;
  const doiXml = j.extension?.annotation?.find((a) => a.type === 'DISSEMINATION_DOI_XML')?.title ?? '';
  const doi = /10\.2908\/[A-Z0-9_]+/.exec(doiXml)?.[0];
  if (!doi) throw new Error('no DISSEMINATION_DOI_XML annotation — attribution is required by the licence, so a missing DOI is a hard stop');
  scan.vintage = {
    periodEnd: periodEndOf(period),
    periodLabel: period,
    cadence,
    coverage: [periods[0], periods[periods.length - 1]],
    estimateKind: 'reported',          // national administrative returns, transmitted to Eurostat. Not observed by Eurostat, not modelled.
    provisional,
    ...(breaks.length ? { breaks } : {}),
    reporters: { n, expected },
    producer: meta.producer,
    licenceId: meta.licenceId,
    doi,
    commercialUseClear: meta.commercialUseClear,
  };
  // Which reporters are flagged, not just that something is: a build log that says
  // "provisional" without naming Spain is the log that got read past twice before.
  scan.provisionalAt = geos.filter((g) => isProvisional(u.status({ ...sel, geo: g, time: period })));
  return scan;
}

/** Country layer: one row per reporting state, citizen pinned to TOTAL. */
function countryLayer(j, { id, title, question, note, cadence, sel, periodsBack, log }) {
  const u = unpack(j);
  requireFree(u, ['geo', 'time'], id);
  const times = u.codes('time');
  const geos = u.codes('geo').filter((g) => !GEO_AGGREGATES.has(g) && !GEO_NON_REUSABLE.has(g));

  const gate = gateNewest(times, (t) => reportersAt(u, t, geos), { label: id });
  const periods = times.slice(Math.max(0, gate.index + 1 - periodsBack), gate.index + 1);

  const rows = {};
  for (const geo of geos) {
    const series = {};
    for (const time of periods) {
      const v = u.value({ ...sel, geo, time });
      if (v !== null) series[time] = v;          // a null is "did not file", never a zero
    }
    // Keyed by ISO3, because places.json and the globe are. Keying by Eurostat's own
    // two-letter geo codes validates on every other axis and paints an empty world.
    const a3 = toIso3(geo);
    if (!a3) throw new Error(`geo code ${geo} has no ISO3 mapping — fix scripts/adapters/_iso3.mjs rather than dropping the country`);
    if (Object.keys(series).length) rows[a3] = series;
  }

  const scan = buildVintage(u, j, { period: gate.period, periods, cadence, n: gate.n, expected: gate.expected, geos, sel });
  log?.({ id, gate, periods, rows: Object.keys(rows).length, scan });
  return { id, title, question, unit: 'people', entity: 'country', rows, periods, vintage: scan.vintage, note };
}

/**
 * Corridor layer: rows keyed `CITIZENSHIP>REPORTER`.
 *
 * Codes are Eurostat's own, unreformatted, per the contract's "as the producer labels them":
 * two-letter ISO 3166-1 alpha-2 except EL (Greece, ISO GR), UK (United Kingdom, ISO GB) and
 * XK (Kosovo, no ISO code). build-concordance.mjs already resolves EL; UK is dropped here
 * for the licence reason above, so only XK is left for a consumer to decide about.
 *
 * Origin is CITIZENSHIP, not previous residence. An Afghan national applying in Austria is
 * AF>AT however long they lived in Iran first, so these corridors are not comparable with
 * the modelled residence-to-residence flows in the spine.
 */
function corridorLayer(j, { id, title, question, note, cadence, sel, periodsBack, gate, gatePeriods, log }) {
  const u = unpack(j);
  requireFree(u, ['citizen', 'geo', 'time'], id);
  const times = u.codes('time');
  const geos = u.codes('geo').filter((g) => !GEO_AGGREGATES.has(g) && !GEO_NON_REUSABLE.has(g));
  const origins = u.codes('citizen').filter((c) => !CITIZEN_NOT_A_COUNTRY.has(c));

  // After the deny-list every survivor must be a plain two-letter member code. A new
  // aggregate arriving under a compound code (EXT_EU28, EA20_2023) trips here rather than
  // doubling every destination's total in silence.
  const odd = origins.filter((c) => !/^[A-Z]{2}$/.test(c));
  if (odd.length) throw new Error(`${id}: citizen codes ${odd.join(',')} survived the deny-list and are not two-letter members — check for a new aggregate`);

  // The gate is a property of the reporting roster, so it is computed once on the country
  // cut of the same table and reused here; recomputing it on the citizen-detail payload
  // would let a destination that filed only a TOTAL row look like a full reporter.
  const end = times.indexOf(gate.period);
  if (end < 0) throw new Error(`${id}: gated period ${gate.period} absent from this cut's time codelist (${times.join(',')})`);
  const periods = times.slice(Math.max(0, end + 1 - periodsBack), end + 1);
  for (const p of gatePeriods.slice(-periods.length)) {
    if (!periods.includes(p)) throw new Error(`${id}: corridor and country cuts disagree on periods (${periods.join(',')} vs ${gatePeriods.join(',')})`);
  }

  // Closure: for every destination that filed a TOTAL, the kept members must add up to
  // TOTAL less the two non-country residuals. This is the assertion that would have caught
  // the 128,480-against-42,825 bug, and it runs on live numbers every build rather than on
  // a hand-maintained list of aggregate codes.
  let worst = { geo: null, rel: 0 };
  for (const geo of geos) {
    const total = u.value({ ...sel, citizen: 'TOTAL', geo, time: gate.period });
    if (total === null || total < 100) continue;      // below ~100 Eurostat's rounding to 5 dominates
    const residual = ['STLS', 'UNK', 'RNC'].reduce((a, c) => a + (u.value({ ...sel, citizen: c, geo, time: gate.period }) ?? 0), 0);
    const sum = origins.reduce((a, c) => a + (u.value({ ...sel, citizen: c, geo, time: gate.period }) ?? 0), 0);
    // Reported only for destinations big enough for the ratio to mean anything. Croatia's
    // 115 decisions at 2026-Q2 spread over ~20 origins each rounded to the nearest 5 come
    // out 17% "off" from pure rounding, which would make the build log's headline number
    // noise; the assertion below still runs on every destination.
    const rel = Math.abs(sum - (total - residual)) / total;
    if (total >= 1000 && rel > worst.rel) worst = { geo, rel, sum, total, residual };
    // 2% + 25 absorbs Eurostat rounding every cell to the nearest 5 (DE applications
    // 2026-06: members 5,695 against TOTAL 5,790 less UNK 80 = 5,710, a 15-person gap
    // across 199 rounded cells). An aggregate leaking in overshoots by 100%+, not 0.3%.
    if (sum > (total - residual) * 1.02 + 25) {
      throw new Error(`${id}: citizen members at geo=${geo}, ${gate.period} sum to ${sum} against TOTAL ${total} less residual ${residual} — an aggregate is still on the axis`);
    }
  }

  const rows = {};
  let dropped = 0;
  for (const orig of origins) {
    for (const dest of geos) {
      const series = {};
      let any = false;
      for (const time of periods) {
        const v = u.value({ ...sel, citizen: orig, geo: dest, time });
        if (v === null) continue;
        series[time] = v;
        if (v > 0) any = true;
      }
      // A corridor reported as zero in every shipped period carries no information and
      // would triple the payload. A corridor with a zero BESIDE a non-zero keeps its zero:
      // "Germany decided no Bhutanese cases this quarter" is a fact, and the contract's
      // rule is that absent must not be rendered as zero, not that zero must be hidden.
      if (!any) { dropped++; continue; }
      const o3 = toIso3(orig), d3 = toIso3(dest);
      if (!o3 || !d3) throw new Error(`corridor ${orig}>${dest} has no ISO3 mapping — fix scripts/adapters/_iso3.mjs`);
      if (Object.keys(series).length) rows[`${o3}>${d3}`] = series;
    }
  }

  // Status flags are replicated across the whole citizen axis rather than carried per
  // origin — verified 2026-09-20: the decisions corridor cut returns exactly 1,030 status
  // entries, which is 206 citizens × (4 provisional ES quarters + 1 EL break quarter). So
  // reading them off the TOTAL slice loses nothing and costs 206× fewer lookups.
  const scan = buildVintage(u, j, { period: gate.period, periods, cadence, n: gate.n, expected: gate.expected, geos, sel: { ...sel, citizen: 'TOTAL' } });
  log?.({ id, gate, periods, rows: Object.keys(rows).length, dropped, closure: worst, scan });
  return { id, title, question, unit: 'people', entity: 'corridor', rows, periods, vintage: scan.vintage, note };
}

// ---------------------------------------------------------------- load
export async function load({ log } = {}) {
  await checkIso3();   // a typo in the crosswalk must fail here, not paint an empty world
  const layers = [];

  // ---- migr_asyappctzm: monthly applications ---------------------------------------
  // The dimension is `applicant`, NOT `asyl_app`. Both failures were reproduced on
  // 2026-09-20: asyl_app on a fully pinned query returns HTTP 400 id 150
  // (INVALID_QUERY_DIMENSION), and the same dataset unfiltered returns HTTP 413 — the size
  // check runs BEFORE dimension validation, so an unfiltered probe tells you nothing about
  // whether your dimension name is right.
  const appQ = { citizen: 'TOTAL', sex: 'T', age: 'TOTAL', unit: 'PER', applicant: 'TOTAL' };
  const appJ = await estat('migr_asyappctzm', { ...appQ, lastTimePeriod: 18 }, { label: 'asyappctzm-country' });
  const app = countryLayer(appJ, {
    id: 'eu-asylum-applications',
    title: 'EU asylum applications',
    question: 'How many people asked this country for asylum?',
    cadence: 'monthly',
    sel: { citizen: 'TOTAL', applicant: 'TOTAL' },
    periodsBack: 12,
    note: 'Applications lodged, first-time and repeat together; Spain is flagged provisional throughout 2026 and its fall from 8,275 in 2026-05 to 3,005 in 2026-06 should not be read as an outturn.',
    log,
  });
  layers.push(app);

  layers.push(countryLayer(
    await estat('migr_asyappctzm', { ...appQ, applicant: 'FRST', lastTimePeriod: 18 }, { label: 'asyappctzm-first' }),
    {
      id: 'eu-asylum-applications-first-time',
      title: 'EU first-time asylum applications',
      question: 'How many people asked this country for asylum for the first time?',
      cadence: 'monthly',
      sel: { citizen: 'TOTAL', applicant: 'FRST' },
      periodsBack: 12,
      note: 'FRST excludes repeat applications; FRST + SSEQ is the TOTAL layer, so never add this to it.',
      log,
    },
  ));

  layers.push(corridorLayer(
    await estat('migr_asyappctzm', { sex: 'T', age: 'TOTAL', unit: 'PER', applicant: 'TOTAL', lastTimePeriod: 8 }, { label: 'asyappctzm-corridor' }),
    {
      id: 'eu-asylum-applications-corridor',
      title: 'EU asylum applications by citizenship',
      question: 'How many citizens of this country applied for asylum in that one?',
      cadence: 'monthly',
      sel: { applicant: 'TOTAL' },
      periodsBack: 6,
      note: 'Origin is citizenship, not country of departure, and a corridor absent here was never reported rather than reported as none.',
      gate: { period: app.vintage.periodLabel, n: app.vintage.reporters.n, expected: app.vintage.reporters.expected },
      gatePeriods: app.periods,
      log,
    },
  ));

  // ---- migr_asydcfstq: quarterly first-instance decisions ---------------------------
  // `decision` carries SIX codes here — TOTAL, POS, POS_RFG, POS_HUM, POS_SPROT, NEG — and
  // POS is the sum of the three POS_*, verified at geo=DE, 2026-Q2: 13,040 + 4,130 + 1,485
  // = 18,655 = POS. migr_asywitfstq's `decision` has FOUR codes and no POS and no NEG, so
  // the two tables cannot share a decision enum and are not wired through one.
  // POS + NEG = 42,830 against TOTAL 42,825 in that same cell: Eurostat rounds every value
  // to the nearest 5, so the parts miss the whole by a rounding step. Do not "reconcile".
  const decQ = { citizen: 'TOTAL', sex: 'T', age: 'TOTAL', unit: 'PER' };
  const dec = countryLayer(
    await estat('migr_asydcfstq', { ...decQ, decision: 'TOTAL', lastTimePeriod: 12 }, { label: 'asydcfstq-total' }),
    {
      id: 'eu-asylum-decisions',
      title: 'EU first-instance asylum decisions',
      question: 'How many first-instance decisions did this country issue?',
      cadence: 'quarterly',
      sel: { citizen: 'TOTAL', decision: 'TOTAL' },
      periodsBack: 8,
      note: 'Decisions issued, not applications resolved into them; Greece carries a break in series at 2025-Q4 and Spain is provisional from 2025-Q1 onwards.',
      log,
    },
  );
  layers.push(dec);

  layers.push(countryLayer(
    await estat('migr_asydcfstq', { ...decQ, decision: 'POS', lastTimePeriod: 12 }, { label: 'asydcfstq-pos' }),
    {
      id: 'eu-asylum-decisions-positive',
      title: 'EU positive first-instance decisions',
      question: 'How many first-instance decisions granted some form of protection?',
      cadence: 'quarterly',
      sel: { citizen: 'TOTAL', decision: 'POS' },
      periodsBack: 8,
      // Greece's 'b' at 2025-Q4 is carried on TOTAL and NEG but NOT on POS — its refusals
      // step 3,370 → 8,585 across the break while its grants do not. So this layer honestly
      // ships no break where the TOTAL layer ships one; that is the source's own position,
      // not a decoding slip, and the two must not be "reconciled" to agree.
      note: 'POS already contains refugee status, humanitarian status and subsidiary protection; adding the three POS_* codes to it double-counts every grant.',
      log,
    },
  ));

  layers.push(corridorLayer(
    await estat('migr_asydcfstq', { sex: 'T', age: 'TOTAL', unit: 'PER', decision: 'TOTAL', lastTimePeriod: 5 }, { label: 'asydcfstq-corridor' }),
    {
      id: 'eu-asylum-decisions-corridor',
      title: 'EU first-instance decisions by citizenship',
      question: 'How many first-instance decisions did that country issue to citizens of this one?',
      cadence: 'quarterly',
      sel: { decision: 'TOTAL' },
      periodsBack: 4,
      note: 'All decision types together, so a large corridor says nothing about how many of those decisions granted protection; at geo=DE, 2026-Q2 only 101 of the 206 citizenships carry a non-zero value.',
      gate: { period: dec.vintage.periodLabel, n: dec.vintage.reporters.n, expected: dec.vintage.reporters.expected },
      gatePeriods: dec.periods,
      log,
    },
  ));

  // ---- migr_asytpsm: monthly temporary protection, STOCK ----------------------------
  const tpQ = { citizen: 'TOTAL', sex: 'T', age: 'TOTAL', unit: 'PER' };
  const tps = countryLayer(
    await estat('migr_asytpsm', { ...tpQ, lastTimePeriod: 18 }, { label: 'asytpsm-country' }),
    {
      id: 'eu-temporary-protection-stock',
      title: 'Beneficiaries of temporary protection',
      question: 'How many people held temporary protection here at the end of the month?',
      cadence: 'monthly',
      sel: { citizen: 'TOTAL' },
      periodsBack: 12,
      note: 'A stock at the end of each month, not a flow: summing it across months counts the same person once per month they stayed.',
      log,
    },
  );
  layers.push(tps);

  layers.push(corridorLayer(
    await estat('migr_asytpsm', { sex: 'T', age: 'TOTAL', unit: 'PER', lastTimePeriod: 6 }, { label: 'asytpsm-corridor' }),
    {
      id: 'eu-temporary-protection-stock-corridor',
      title: 'Temporary protection beneficiaries by citizenship',
      question: 'How many citizens of this country held temporary protection in that one?',
      cadence: 'monthly',
      sel: {},
      periodsBack: 4,
      note: 'Almost entirely one corridor set: Ukrainians are 1,250,825 of Germany’s 1,286,840 beneficiaries at 2026-06, so this answers a different question from asylum and must not be added to it.',
      gate: { period: tps.vintage.periodLabel, n: tps.vintage.reporters.n, expected: tps.vintage.reporters.expected },
      gatePeriods: tps.periods,
      log,
    },
  ));

  // ---- migr_asytpfm: monthly temporary protection, FLOW -----------------------------
  // Identical id shape to migr_asytpsm, so one decoder serves both — but they answer
  // different questions and are kept apart: 2026-07 grants across the EU27 are 45,015
  // against a stock of 4,428,315.
  layers.push(countryLayer(
    await estat('migr_asytpfm', { ...tpQ, lastTimePeriod: 18 }, { label: 'asytpfm-country' }),
    {
      id: 'eu-temporary-protection-grants',
      title: 'Temporary protection granted',
      question: 'How many people were newly granted temporary protection here this month?',
      cadence: 'monthly',
      sel: { citizen: 'TOTAL' },
      periodsBack: 12,
      note: 'A monthly flow of first grants; France is flagged throughout as measuring this to a different definition.',
      log,
    },
  ));

  // migr_asytpfq is the same measure a quarter at a time. Wired because it is one request
  // and it carries ME, which the monthly table's geo codelist does not; it is deliberately
  // NOT summed into or reconciled against the monthly layer.
  layers.push(countryLayer(
    await estat('migr_asytpfq', { ...tpQ, lastTimePeriod: 10 }, { label: 'asytpfq-country' }),
    {
      id: 'eu-temporary-protection-grants-quarterly',
      title: 'Temporary protection granted, quarterly',
      question: 'How many people were newly granted temporary protection here this quarter?',
      cadence: 'quarterly',
      sel: { citizen: 'TOTAL' },
      periodsBack: 6,
      note: 'The quarterly cut of the monthly grants table, published on a slower cycle and including Montenegro, which the monthly table omits.',
      log,
    },
  ));

  // ---- migr_asywitfstq: quarterly withdrawals ---------------------------------------
  // This table has NO sex and NO age axis — passing sex=T returns HTTP 400 id 150,
  // "Dimension SEX is not defined" (reproduced 2026-09-20). It carries `reason` (TOTAL,
  // WDN_RVOC, WDN_END, WDN_REF_RNEW, UNK) instead, which is the undeclared-dimension trap
  // running the other way: an axis you do not know about still has to be pinned.
  layers.push(countryLayer(
    await estat('migr_asywitfstq', { citizen: 'TOTAL', unit: 'PER', reason: 'TOTAL', decision: 'TOTAL', lastTimePeriod: 12 }, { label: 'asywitfstq-country' }),
    {
      id: 'eu-protection-withdrawals',
      title: 'Protection status withdrawn',
      question: 'How many first-instance protection statuses did this country withdraw?',
      cadence: 'quarterly',
      sel: { citizen: 'TOTAL', reason: 'TOTAL', decision: 'TOTAL' },
      periodsBack: 8,
      note: 'Withdrawals at first instance for any reason including a status simply ending; Germany quintupled from 1,015 in 2025-Q4 to 5,020 in 2026-Q2, which is a policy change and not a data error.',
      log,
    },
  ));

  // ---- migr_asypenctzm: pending applications ----------------------------------------
  // Carried partly to make the freshness point concrete. This table shares the LATEST
  // `updated` stamp in the family (2026-09-18T23:00+0200, the same as migr_asytpsm) and its
  // OBS_PERIOD_OVERALL_LATEST annotation says 2026-08 — yet at 2026-07 only five reporters
  // have filed (EE, HU, IS, LI, ME) and at 2026-08 only two. `updated` is when the table was
  // touched, not how far it reaches; the gate is what decides.
  layers.push(countryLayer(
    await estat('migr_asypenctzm', { ...tpQ, lastTimePeriod: 18 }, { label: 'asypenctzm-country' }),
    {
      id: 'eu-asylum-pending',
      title: 'Asylum applications pending',
      question: 'How many applications were still awaiting a first-instance decision here?',
      cadence: 'monthly',
      sel: { citizen: 'TOTAL' },
      periodsBack: 12,
      note: 'A stock of open cases at the end of the month, not a flow; Italy is flagged as low-reliability for 2026-01 to 2026-04 and Spain provisional throughout.',
      log,
    },
  ));

  return { layers };
}

// ---------------------------------------------------------------- standalone report
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seen = [];
  const { layers } = await load({ log: (x) => seen.push(x) });
  for (const l of layers) {
    const v = l.vintage;
    const s = seen.find((x) => x.id === l.id) ?? {};
    const rej = s.gate?.rejected ?? [];
    const flags = [...(s.scan?.otherFlags ?? new Map())].map(([c, n]) => `${c}×${n}`);
    console.log(
      `${l.id.padEnd(42)} ${v.periodLabel.padEnd(8)} ${String(v.reporters.n).padStart(3)}/${String(v.reporters.expected).padEnd(3)} reporters  ` +
      `${String(Object.keys(l.rows).length).padStart(5)} rows  ${l.periods.length}p (${l.periods[0]}..${l.periods[l.periods.length - 1]})  ${v.cadence}\n` +
      `${' '.repeat(4)}provisional at ${v.periodLabel}: ${s.scan?.provisionalAt?.join(',') || 'none'}` +
      `${v.breaks ? `  | breaks: ${v.breaks.join(',')}` : ''}${flags.length ? `  | other flags: ${flags.join(',')}` : ''}` +
      `${rej.length ? `\n    rejected tail: ${rej.join('  ')}` : ''}` +
      `${s.closure?.geo ? `\n    worst citizen closure: ${s.closure.geo} members ${s.closure.sum} vs TOTAL ${s.closure.total} less residual ${s.closure.residual} (${(s.closure.rel * 100).toFixed(2)}% off, rounding)` : ''}` +
      `${s.dropped ? `\n    ${s.dropped} corridors dropped as zero in every shipped period` : ''}`,
    );
  }
  console.log(`\n${layers.length} layers, ${layers.reduce((a, l) => a + Object.keys(l.rows).length, 0)} rows total; raw cached under ${CACHE}/`);
  console.log(`licence ${meta.licenceId}, commercial reuse clear: ${meta.commercialUseClear} (see header, read ${new Date('2026-09-20').toISOString().slice(0, 10)})`);
}
