// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// World Bank WDI — the context indicators the app already ships, refreshed off the live API,
// plus the five UNHCR displacement series that were never wired at all.
//
// Why this file exists: `scripts/fetch-wb.mjs` pins `date=2010:2023` and
// `build-snapshot-real.mjs` reads migrant stock with `latest(STOCK, 2020)`, so the app draws
// population at 2023 and migrant stock at 2020. Observed on 2026-09-20 against the live API,
// population, net migration, unemployment and every UNHCR series now reach 2025 and migrant
// stock reaches 2024. Nothing about that was published on a schedule anyone here controls, so
// the period is chosen from the response every run and is never written into this file.
//
// ---------------------------------------------------------------- LICENCE
// Read at https://datacatalog.worldbank.org/public-licenses on 2026-09-20.
//
// The operative sentence, verbatim:
//
//   "The World Bank Group makes data publicly available according to open data standards and
//    licenses datasets under the Creative Commons Attribution 4.0 International license
//    (CC-BY 4.0)."
//
// and, on commercial reuse specifically:
//
//   "The Creative Commons Attribution 4.0 International license allows users to copy, modify
//    and distribute data in any format for any purpose, including commercial use. Users are
//    only obligated to give appropriate credit (attribution) and indicate if they have made
//    any changes, including translations."
//
// The trap this project has twice been burned by is website-content-CC-BY over data-under-
// something-else. That is NOT the trap here, and stopping at the sentence above would still
// have been wrong, because the same page immediately qualifies itself:
//
//   "Many datasets are available under other licenses. They are labeled accordingly [...]"
//   "CC-BY 4.0 [...] is the default license for all Datasets produced by the World Bank itself"
//
// A default is not a grant, and several of the series below are not produced by the World Bank
// at all — SP.POP.TOTL, SM.POP.NETM and SM.POP.TOTL come from the UN Population Division,
// SL.UEM.TOTL.ZS from the ILO, and the whole displacement family from UNHCR's Refugee
// Population Statistics Database (each stated in that indicator's own `sourceOrganization`,
// fetched and printed by the standalone report below). The page also has a "License Specified
// Externally" clause for exactly that situation. So the label that governs is the one on the
// DATASET this API serves, not the default on the page. Read on 2026-09-20 from the catalogue's
// own record for World Development Indicators
// (https://datacatalogapi.worldbank.org/ddhxext/DatasetView?dataset_unique_id=0037712):
//
//   "license": { "license_id": "Creative Commons Attribution 4.0",
//                "custom_license_information": null, "license_reference": null }
//
// Labelled CC BY 4.0, with no custom terms, for the compilation as distributed. Hence
// commercialUseClear: true.
//
// One rider worth knowing before anyone quotes the bare SPDX id: the same page attaches
// "additional mandatory terms" to its CC-BY 4.0 — a non-binding mediation step followed by
// UNCITRAL arbitration for disputes under the licence. It adds a dispute-resolution procedure;
// it does not narrow the grant, and in particular does not touch commercial use. `licenceId`
// stays 'CC-BY-4.0' because that is what the producer labels the dataset, but the rider is why
// this paragraph is here rather than in nobody's head.
//
// Attribution required by the licence, as the catalogue record's own citation field gives it:
// "World Development Indicators, The World Bank".
// ------------------------------------------------------------------------------------

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);

export const meta = {
  id: 'worldbank',
  producer: 'World Bank',
  licenceId: 'CC-BY-4.0',
  commercialUseClear: true,
};

const BASE = 'https://api.worldbank.org/v2';
const CACHE = '.cache/layers/worldbank';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// One request per indicator over a range, not one per year. The per-year form in the brief
// works, but it hides the only thing that decides which year to ship — how coverage moves
// across the tail — behind ten separate calls that each look fine on their own.
const PER_PAGE = 20000;

// 1990 because the corridor spine this app is built around starts at 1990; a country layer
// reaching further back cannot be placed beside it, and the early tail is thin anyway
// (SM.POP.RHCR.EA has 19 reporters in 1960 against 176 in 2025). The upper bound is derived
// from the clock rather than pinned, so the run after the next vintage lands finds it instead
// of stopping at a ceiling somebody forgot. Asking past the data is safe in RANGE form; asking
// `date=2026` ALONE is not — see assertRows.
const FIRST_YEAR = 1990;
const lastYear = () => new Date().getUTCFullYear() + 1;

// Rule 4 of the contract, made arithmetic: the last period in a response is a candidate, not a
// period. A candidate is accepted only if it carries at least this share of the median count of
// the five periods before it. The threshold is not a taste: applied to all ten series on
// 2026-09-20 it accepts nine of them (ratios 0.978 to 1.015) and rejects exactly one,
// NY.GDP.PCAP.PP.KD at 2025 (185 against a trailing median of 199, ratio 0.930), which is the
// one series independent research had already flagged as a year behind the rest. A threshold
// that accepted 0.93 would ship a GDP map missing ten countries that had one last year.
const FRESH_RATIO = 0.95;
const TRAIL = 5;
const MAX_STEP_BACK = 3;

// ---------------------------------------------------------------- transport
//
// api.worldbank.org answers node's fetch without any User-Agent dance (verified 2026-09-20),
// unlike the imf.org path in fetch-concordance.mjs. curl stays as a fallback only because the
// transfer, not the request, is what fails over a flaky proxy — curl retries the transfer.
async function getJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.includes('json')) throw new Error(`content-type ${ct}, expected JSON`);
    return await r.json();
  } catch (e) {
    const { stdout } = await run('curl', ['-sS', '--max-time', '300', '--retry', '2', url], { maxBuffer: 256 * 1024 * 1024 });
    try { return JSON.parse(stdout); }
    catch { throw new Error(`${url}: ${e.message}; curl fallback did not return JSON either`); }
  }
}

async function cached(label, url) {
  const key = `${CACHE}/${label}.json`;
  if (!process.env.EXODUS_NOCACHE) {
    try {
      const s = await stat(key);
      if (Date.now() - s.mtimeMs < CACHE_TTL_MS) return JSON.parse(await readFile(key, 'utf8'));
    } catch { /* no cache entry, or an unreadable one: fetch it */ }
  }
  const j = await getJson(url);
  await mkdir(CACHE, { recursive: true });
  await writeFile(key, JSON.stringify(j));
  return j;
}

/**
 * Every way this API lies with HTTP 200, checked in one place.
 *
 * All three were reproduced on 2026-09-20 before this function was written:
 *
 *   SM.POP.REFG and SM.POP.REFG.OR — deleted indicators — answer 200 with a ONE-element body
 *   `[{"message":[{"id":"175","key":"Invalid format","value":"The indicator was not found. It
 *   may have been deleted or archived."}]}]`, so the idiomatic `j[1]` throws "undefined is not
 *   iterable" on a success status and the reason is never read.
 *
 *   `date=2026` (a year with no data yet) answers 200 with
 *   `[{"page":0,"pages":0,"per_page":0,"total":0,...}, null]` — two elements, so a length check
 *   alone passes and the null reaches the decoder.
 *
 *   An unknown indicator answers 200 with message id 120, "The provided parameter value is not
 *   valid". Same one-element shape.
 *
 * The paging check is a different failure with the same signature: per_page too small returns a
 * complete-looking first page and silently drops the rest, which reads as a coverage collapse
 * rather than as an error.
 */
function assertRows(code, j, url) {
  if (!Array.isArray(j)) throw new Error(`${code}: body is ${typeof j}, not the 2-element array this API returns. URL ${url}`);
  const msg = j[0]?.message?.[0];
  if (msg) {
    throw new Error(`${code}: HTTP 200 carrying an API error, not data — id ${msg.id} "${msg.key}: ${msg.value}". ` +
      `id 175 is a DELETED indicator (SM.POP.REFG and SM.POP.REFG.OR answered exactly this on 2026-09-20); ` +
      `id 120 is a code this API has never heard of. Either way the body is a one-element array with a success status.`);
  }
  if (j.length < 2 || j[1] == null) {
    throw new Error(`${code}: HTTP 200 with j[1] = ${JSON.stringify(j[1])} and header ${JSON.stringify(j[0])} — ` +
      `an out-of-range date does this. URL ${url}`);
  }
  if (!Array.isArray(j[1]) || j[1].length === 0) throw new Error(`${code}: j[1] is not a non-empty array of rows. URL ${url}`);
  const h = j[0];
  if (h.pages !== 1) throw new Error(`${code}: ${h.pages} pages for ${h.total} rows — per_page=${PER_PAGE} is too small and everything past page 1 would be dropped without an error`);
  if (h.total !== j[1].length) throw new Error(`${code}: header says ${h.total} rows, body carries ${j[1].length}`);
  const got = j[1][0]?.indicator?.id;
  if (got !== code) throw new Error(`${code}: rows carry indicator ${got} — the API resolved the code to a different series`);
  return h;
}

/**
 * The 217 real countries, and proof that the filter bit.
 *
 * Aggregates are not a nuisance here, they are most of the top of every ranking: sorted by
 * SM.POP.NETM at 2025 the leaders are PST, OED, NAC, ECA and two rows whose `countryiso3code`
 * is the empty string (the income groups). An unfiltered payload paints "World" as a country.
 *
 * `region.id === 'NA'` is how the API marks one — the same rows carry `region.value ===
 * "Aggregates"`, and `fetch-concordance.mjs` keys off that string instead. The id is the safer
 * side of the same fact: a display string can be retitled, and the trailing space in
 * "Latin America & Caribbean " shows how carefully these strings are maintained.
 *
 * Observed 2026-09-20: 295 entries, 217 real, 78 aggregates.
 */
async function realCountries() {
  const url = `${BASE}/country?format=json&per_page=400`;
  const j = await cached('country-list', url);
  if (!Array.isArray(j) || j.length < 2 || !Array.isArray(j[1])) throw new Error(`country list: unexpected body ${JSON.stringify(j).slice(0, 200)}`);
  if (j[0]?.pages !== 1) throw new Error(`country list: ${j[0]?.pages} pages — per_page=400 no longer covers the list`);
  if (j[0]?.total !== j[1].length) throw new Error(`country list: header says ${j[0].total}, body carries ${j[1].length}`);

  const real = j[1].filter((d) => d.region?.id && d.region.id !== 'NA');
  const names = new Map(real.map((d) => [d.id, d.name]));

  // Positive tests, not a count. A count that drifts tells you something changed; these tell
  // you WHICH thing, and they fail closed if the region field is ever emptied wholesale.
  for (const agg of ['WLD', 'EUU', 'HIC', 'OED', 'ARB', 'AFE']) {
    if (names.has(agg)) throw new Error(`aggregate ${agg} survived the region.id filter — it would be drawn as a country`);
  }
  for (const c of ['DEU', 'UKR', 'USA', 'SYR']) {
    if (!names.has(c)) throw new Error(`${c} was filtered out as an aggregate — the region.id test has inverted`);
  }
  const aggregates = j[1].length - real.length;
  if (aggregates === 0) throw new Error('every entry passed the aggregate filter, so the filter is not filtering');
  if (real.length < 200) throw new Error(`only ${real.length} real countries in the list (217 on 2026-09-20); something upstream changed`);
  return { iso: new Set(names.keys()), names, total: j[1].length, aggregates };
}

const median = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  return v[v.length >> 1];
};

/** Rule 4, applied. Returns the newest period that is a period rather than a head start. */
function chooseNewest(code, counts) {
  const periods = [...counts.keys()].sort();
  for (let back = 0, i = periods.length - 1; back <= MAX_STEP_BACK && i >= 0; back++, i--) {
    const p = periods[i];
    const trail = periods.slice(Math.max(0, i - TRAIL), i).map((x) => counts.get(x));
    // The first period of a series has nothing behind it to be short against.
    const expected = trail.length ? median(trail) : counts.get(p);
    if (counts.get(p) >= FRESH_RATIO * expected) {
      return { period: p, n: counts.get(p), expected, steppedBack: back, ratio: counts.get(p) / expected };
    }
  }
  throw new Error(`${code}: none of the last ${MAX_STEP_BACK + 1} periods carries ${FRESH_RATIO * 100}% of its trailing median coverage ` +
    `(${periods.slice(-6).map((p) => `${p}:${counts.get(p)}`).join(' ')}) — the series is being withdrawn, not published late`);
}

// ---------------------------------------------------------------- what to ship
//
// `estimateKind` on every line below is taken from that indicator's own metadata at
// /v2/indicator/<code>, read on 2026-09-20, not from what the series is called. Three of these
// contradict how the app currently badges them, which is the point of reading it.
//
// `cadence` obeys contract rule 9. SP.POP.TOTL's own sourceNote says "The values shown are
// midyear estimates" and SM.POP.TOTL's says "the number of people at mid-year born in a country
// other than that in which they live", so both are instants, not years: 'point' at YYYY-07-01.
// Dating them to 31 December would report a mid-2025 stock as six months fresher than it is.
// The UNHCR series carry no reference instant anywhere in this API, so they are dated to the
// last day of the labelled year — the conservative direction — and their notes say so.
//
// `unit` is NOT read from the row's `unit` field: that field is the empty string on every one
// of the 95,400 rows these ten requests return (10 x header.total 9,540; recounted 2026-09-20,
// and the same recount finds 0 rows carrying a non-empty `obs_status`). The unit lives in the
// indicator name, which is why it is written out here.
const SPEC = [
  {
    layerId: 'wb-population', code: 'SP.POP.TOTL',
    title: 'Population',
    question: 'How many people live here?',
    unit: 'people', instant: 'midyear', estimateKind: 'modelled', decimals: 0,
    note: 'A denominator, not a headline. The World Bank\'s own sourceNote says "The values shown are midyear estimates" and lists UN World Population Prospects first among its sources, so this is a demographic model fitted to censuses and registers rather than a count — it is badged modelled for that reason, and all 217 countries carry a value in every single year this layer ships because the model has no gaps, not because everyone counted. De facto residents, regardless of legal status or citizenship.',
  },
  {
    layerId: 'wb-net-migration', code: 'SM.POP.NETM',
    title: 'Net migration',
    question: 'Did more people arrive here than left, and by how many?',
    unit: 'people (net)', instant: 'period', estimateKind: 'modelled', decimals: 0,
    note: 'Immigrants minus emigrants, citizens and non-citizens alike, so it is SIGNED: at 2025, 130 of 217 countries are negative and one is exactly zero. It is also the residual of UN World Population Prospects — the part of population change that births and deaths do not explain — not a counted flow, which is why a country can show a clean annual figure nobody ever measured. Two directions of the same size cancel to nothing here; a zero means balance, never absence.',
  },
  {
    layerId: 'wb-migrant-stock', code: 'SM.POP.TOTL',
    title: 'Foreign-born population',
    question: 'How many people living here were born somewhere else?',
    unit: 'people', instant: 'midyear', estimateKind: 'modelled', decimals: 0,
    note: 'UN DESA mid-year estimates of the number of people born in a country other than the one they live in, refugees included. NOT annual: the periods are 1990, 1995, 2000, 2005, 2010, 2015, 2020 and then 2024, so the gap either side of a point is years wide and the line between two points is drawn by the reader, not by the producer. A stock is a standing population — never sum it across periods, and never read the change between two of these as a flow.',
  },
  {
    layerId: 'wb-unemployment', code: 'SL.UEM.TOTL.ZS',
    title: 'Unemployment rate',
    question: 'What share of the labour force is out of work and looking?',
    unit: '% of labour force', instant: 'period', estimateKind: 'modelled', decimals: 3,
    note: 'The indicator\'s own name ends "(modeled ILO estimate)": these are ILO model outputs harmonised across countries for comparability, not the national unemployment rates the same countries publish, and the two routinely differ. Coverage is the thinnest of this family — 182 of 217 countries at the newest period — so a blank here is a country the ILO does not model, not a country with no unemployment.',
  },
  {
    layerId: 'wb-gdp-per-capita', code: 'NY.GDP.PCAP.PP.KD',
    title: 'GDP per capita, PPP',
    question: 'How much output per person does this economy produce, at comparable prices?',
    unit: 'constant 2021 international $', instant: 'period', estimateKind: 'reported', decimals: 2,
    note: 'National accounts as reported, converted with purchasing-power parities from the International Comparison Program. The PPPs are benchmarked on the 2021 ICP round and extrapolated to every other year, so the comparison across countries is a World Bank construction even though the underlying GDP is nationally reported. This is the one series in this adapter whose newest year is a year behind the others, and deliberately so: the year after the one shipped here exists in the API with roughly ten fewer countries, and is dropped rather than charted.',
  },
  {
    layerId: 'wb-refugees-hosted', code: 'SM.POP.RHCR.EA',
    title: 'Refugees hosted',
    question: 'How many refugees is this country hosting?',
    unit: 'people', instant: 'year-end', estimateKind: 'reported', decimals: 0, family: 'unhcr', side: 'asylum',
    note: 'UNHCR-mandate refugees by country of asylum, including people in a refugee-like situation. MARGINAL TOTAL, NOT A MATRIX — see the shared warning below. A standing population reported once a year, not arrivals during the year: do not sum it across periods. Zero is a real value here (9 countries report zero at the newest period) and is not the same as a country that does not report.',
  },
  {
    layerId: 'wb-refugees-origin', code: 'SM.POP.RHCR.EO',
    title: 'Refugees from here',
    question: 'How many refugees originate from this country?',
    unit: 'people', instant: 'year-end', estimateKind: 'reported', decimals: 0, family: 'unhcr', side: 'origin',
    note: 'The same UNHCR refugee population counted by country of ORIGIN instead of asylum. MARGINAL TOTAL, NOT A MATRIX — see the shared warning below. Origin coverage is wider than asylum coverage (198 against 176 at the newest period) because a country can produce refugees without hosting any.',
  },
  {
    layerId: 'wb-asylum-seekers-hosted', code: 'SM.POP.ASYS.EA',
    title: 'Asylum seekers hosted',
    question: 'How many people are waiting on a claim in this country?',
    unit: 'people', instant: 'year-end', estimateKind: 'reported', decimals: 0, family: 'unhcr', side: 'asylum',
    note: 'People who have sought international protection and whose claims are undetermined, by country of asylum. MARGINAL TOTAL, NOT A MATRIX — see the shared warning below. A pending caseload is a queue length, not a flow: it grows with arrivals and shrinks with decisions, so a fall can mean fewer claims or faster processing and the number alone cannot tell you which.',
  },
  {
    layerId: 'wb-asylum-seekers-origin', code: 'SM.POP.ASYS.EO',
    title: 'Asylum seekers from here',
    question: 'How many people from this country are waiting on a claim somewhere?',
    unit: 'people', instant: 'year-end', estimateKind: 'reported', decimals: 0, family: 'unhcr', side: 'origin',
    note: 'The pending caseload counted by country of ORIGIN. MARGINAL TOTAL, NOT A MATRIX — see the shared warning below, which matters most on this pair: the two asylum-seeker margins do not even sum to the same world total.',
  },
  {
    layerId: 'wb-forcibly-displaced', code: 'SM.POP.FDIP',
    title: 'Forcibly displaced people',
    question: 'How many displaced people are inside this country\'s borders?',
    unit: 'people', instant: 'year-end', estimateKind: 'reported', decimals: 0, family: 'unhcr', side: 'asylum',
    note: 'UNHCR\'s own composite: refugees (and refugee-like situations) under UNHCR mandate, plus UNRWA refugees, plus asylum-seekers, plus others in need of international protection, plus internally displaced people, deduplicated by UNHCR where it can be. It is therefore ASYLUM-SIDE and dominated by IDPs in the largest cases — Colombia and Sudan lead it, and both are mostly people displaced inside their own country. It is not comparable with the origin-side layers and must not be differenced against them. The series starts at 2010; there is nothing before that.',
  },
];

// One warning, appended to all five UNHCR layers, so the wording cannot drift between them.
// The figures in it are computed at run time from the response, because a figure written into a
// sentence goes stale while the sentence goes on being quoted.
const marginalWarning = (t) =>
  'These are marginal totals of UNHCR\'s origin-by-asylum matrix, not the matrix. The asylum-side ' +
  'layers say how many people are here and nothing about where they came from; the origin-side ' +
  'layers say how many came from here and nothing about where they went. No corridor can be ' +
  `built from them, and the totals prove it: at ${t.period} the refugee margins are ` +
  `${t.rhcrAsylum.toLocaleString('en')} by asylum against ${t.rhcrOrigin.toLocaleString('en')} by origin, and the ` +
  `asylum-seeker margins ${t.asysAsylum.toLocaleString('en')} against ${t.asysOrigin.toLocaleString('en')} — ` +
  `${((t.asysAsylum / t.asysOrigin - 1) * 100).toFixed(0)}% apart, because a large share of claims are lodged by people ` +
  'whose origin is recorded as stateless, unknown or as an aggregate that is not a country. ' +
  'Pairing a row from one side with a row from the other invents the pairing.';

export async function load({ log = () => {} } = {}) {
  const countries = await realCountries();
  const to = lastYear();

  const series = new Map();
  for (const spec of SPEC) {
    const url = `${BASE}/country/all/indicator/${spec.code}?format=json&date=${FIRST_YEAR}:${to}&per_page=${PER_PAGE}`;
    const j = await cached(spec.code, url);
    const header = assertRows(spec.code, j, url);

    // Aggregate filter and null filter, and nothing else. In particular NOT `value > 0`, which
    // every other loader in this repo uses and which would be a silent catastrophe here: at
    // 2025 it deletes 131 of 217 net-migration rows (130 negative, 1 exactly zero) and 31 of
    // the UNHCR rows that legitimately report zero. Absent and zero are different facts, and
    // the app's whole no-fill discipline rests on keeping them different.
    const rows = {};
    const counts = new Map();
    const flagged = new Map();
    let aggregateRows = 0;
    for (const d of j[1]) {
      if (!countries.iso.has(d.countryiso3code)) { aggregateRows++; continue; }
      if (d.value === null || d.value === undefined) continue;
      const v = Number(d.value);
      if (!Number.isFinite(v)) throw new Error(`${spec.code}: ${d.countryiso3code} ${d.date} carries a non-finite value ${JSON.stringify(d.value)}`);
      // Rounding is per-series and stated in SPEC rather than global: the ILO rate arrives at
      // three decimals and is kept at three, GDP per capita arrives at fifteen significant
      // figures of which two decimals are meaning and the rest is float noise, and counts of
      // people are counts of people. Nothing here rounds a small non-zero to zero, which is the
      // rounding mistake this repo already has a scar from.
      (rows[d.countryiso3code] ??= {})[d.date] = spec.decimals > 0 ? +v.toFixed(spec.decimals) : Math.round(v);
      counts.set(d.date, (counts.get(d.date) ?? 0) + 1);
      // Eurostat ships 'p'/'b' here; this API ships the empty string on every row of every one
      // of these ten indicators (checked 2026-09-20). `provisional` is still derived from it
      // rather than written as false, so the day it starts carrying a flag the layer says so
      // instead of quietly claiming to be final.
      if (d.obs_status) flagged.set(d.date, (flagged.get(d.date) ?? 0) + 1);
    }
    if (counts.size === 0) throw new Error(`${spec.code}: 200 with ${j[1].length} rows but none for a country in the region-filtered list`);
    if (aggregateRows === 0) throw new Error(`${spec.code}: not one row was an aggregate, so the join against the country list did nothing`);

    const chosen = chooseNewest(spec.code, counts);

    // Drop everything after the accepted period rather than shipping it with an older
    // periodLabel. A layer that carries a period it has just rejected as too thin invites the
    // exact chart rule 4 exists to prevent — the UI has no way to know that the last point is
    // one the adapter refused to stand behind.
    const periods = [...counts.keys()].sort().filter((p) => p <= chosen.period);
    const dropped = [...counts.keys()].sort().filter((p) => p > chosen.period);
    for (const iso of Object.keys(rows)) {
      for (const p of dropped) delete rows[iso][p];
      if (Object.keys(rows[iso]).length === 0) delete rows[iso];
    }

    series.set(spec.code, { spec, rows, periods, chosen, counts, dropped, flagged, header, aggregateRows });
  }

  // ---------------------------------------------------------------- cross-checks
  //
  // Both of these come out of the producers' own definitions and both are cheap. They exist
  // because a wrong indicator code here would still return 200, still return ~180 plausible
  // country totals, and still draw a convincing map.
  const at = (code, period) => {
    const s = series.get(code);
    const m = new Map();
    for (const [iso, r] of Object.entries(s.rows)) if (r[period] != null) m.set(iso, r[period]);
    return m;
  };
  const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0);
  const unhcrPeriod = series.get('SM.POP.FDIP').chosen.period;
  const totals = {
    period: unhcrPeriod,
    rhcrAsylum: sum(at('SM.POP.RHCR.EA', unhcrPeriod)),
    rhcrOrigin: sum(at('SM.POP.RHCR.EO', unhcrPeriod)),
    asysAsylum: sum(at('SM.POP.ASYS.EA', unhcrPeriod)),
    asysOrigin: sum(at('SM.POP.ASYS.EO', unhcrPeriod)),
    fdip: sum(at('SM.POP.FDIP', unhcrPeriod)),
  };

  // SM.POP.FDIP is defined by its own sourceNote as the sum of refugees + UNRWA refugees +
  // asylum-seekers + others in need of protection + IDPs, all asylum-side. So per country it
  // cannot be smaller than refugees-hosted plus asylum-seekers-hosted. Zero violations on
  // 2026-09-20. If RHCR.EA and RHCR.EO were ever swapped — the single likeliest edit anyone
  // will make to this file — Ukraine alone breaks it by five million.
  const fd = at('SM.POP.FDIP', unhcrPeriod), ra = at('SM.POP.RHCR.EA', unhcrPeriod), aa = at('SM.POP.ASYS.EA', unhcrPeriod);
  const violations = [];
  for (const [iso, v] of fd) {
    const parts = (ra.get(iso) ?? 0) + (aa.get(iso) ?? 0);
    if (parts - v > 1000) violations.push({ iso, fdip: v, parts });
  }
  // A handful could be a genuine UNHCR revision between two of its own tables; a crowd is a
  // mixed-up code. Only the crowd is fatal, because build-layers loses all ten layers on a throw.
  if (violations.length > 5) {
    throw new Error(`${violations.length} countries have refugees+asylum-seekers hosted exceeding forcibly-displaced at ${unhcrPeriod} ` +
      `(worst ${violations.sort((a, b) => (b.parts - b.fdip) - (a.parts - a.fdip))[0].iso}) — an origin-side series is wired into an asylum-side slot`);
  }

  const layers = [];
  for (const spec of SPEC) {
    const s = series.get(spec.code);
    const y = s.chosen.period;
    const periodEnd = spec.instant === 'midyear' ? `${y}-07-01` : `${y}-12-31`;
    // 'point' beats a spacing word wherever the producer states an instant, which is the
    // precedent contract rule 9 sets for a 1 January population table. So SM.POP.TOTL is
    // 'point' rather than 'quinquennial' even though its periods are five years apart — the
    // spacing is in its note and in `periods`, where the UI can act on it, while the instant is
    // the thing `periodEnd` would otherwise get wrong by six months.
    const cadence = spec.instant === 'midyear' ? 'point' : 'annual';
    layers.push({
      // Layer ids are filenames in one shared public/snapshot/layers/ directory that every
      // adapter writes into, so they carry the producer prefix even though the contract does
      // not demand it.
      id: spec.layerId,
      title: spec.title,
      question: spec.question,
      unit: spec.unit,
      entity: 'country',
      rows: s.rows,
      periods: s.periods,
      vintage: {
        periodEnd,
        periodLabel: y,
        cadence,
        coverage: [s.periods[0], y],
        estimateKind: spec.estimateKind,
        provisional: (s.flagged.get(y) ?? 0) > 0,
        reporters: { n: s.chosen.n, expected: s.chosen.expected },
        producer: 'World Bank',
        licenceId: 'CC-BY-4.0',
        commercialUseClear: true,
      },
      note: spec.family === 'unhcr' ? `${spec.note} ${marginalWarning(totals)}` : spec.note,
    });
    log({
      id: spec.layerId, code: spec.code, chosen: s.chosen, dropped: s.dropped,
      entities: Object.keys(s.rows).length, lastupdated: s.header.lastupdated,
      counts: s.counts, cadence, periodEnd,
    });
  }
  log({ totals, violations, countries: { real: countries.iso.size, aggregates: countries.aggregates, total: countries.total } });
  return { layers };
}

// ---------------------------------------------------------------- standalone report
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seen = [];
  const { layers } = await load({ log: (x) => seen.push(x) });
  const c = seen.find((x) => x.countries).countries;
  console.log(`country list: ${c.total} entries, ${c.real} real, ${c.aggregates} aggregates dropped\n`);

  for (const l of layers) {
    const s = seen.find((x) => x.id === l.id);
    const v = l.vintage;
    const tail = [...s.counts.keys()].sort().slice(-6).map((p) => `${p}:${s.counts.get(p)}`).join(' ');
    const top = Object.entries(l.rows)
      .filter(([, r]) => r[v.periodLabel] != null)
      .sort((a, b) => b[1][v.periodLabel] - a[1][v.periodLabel])
      .slice(0, 3).map(([iso, r]) => `${iso}=${r[v.periodLabel].toLocaleString('en')}`);
    const probe = ['UKR', 'DEU'].filter((i) => l.rows[i]?.[v.periodLabel] != null)
      .map((i) => `${i}=${l.rows[i][v.periodLabel].toLocaleString('en')}`);
    console.log(
      `${l.id.padEnd(28)} ${s.code.padEnd(18)} ${v.periodLabel}  ${String(v.reporters.n).padStart(3)}/${String(v.reporters.expected).padEnd(3)} reporters ` +
      `(${s.chosen.ratio.toFixed(3)}${s.chosen.steppedBack ? `, stepped back ${s.chosen.steppedBack}` : ''})  ` +
      `${String(l.periods.length).padStart(2)}p ${l.periods[0]}..${l.periods.at(-1)}  ${v.cadence.padEnd(12)} ${v.estimateKind}\n` +
      `${' '.repeat(4)}periodEnd ${v.periodEnd}  WDI updated ${s.lastupdated}  tail ${tail}` +
      `${s.dropped.length ? `  | DROPPED as too thin: ${s.dropped.map((p) => `${p}:${s.counts.get(p)}`).join(' ')}` : ''}\n` +
      `${' '.repeat(4)}top ${top.join(' ')}${probe.length ? `   ${probe.join(' ')}` : ''}`);
  }

  const t = seen.find((x) => x.totals).totals;
  console.log(`\nUNHCR margins at ${t.period}: refugees ${t.rhcrAsylum.toLocaleString('en')} asylum / ${t.rhcrOrigin.toLocaleString('en')} origin ` +
    `(ratio ${(t.rhcrAsylum / t.rhcrOrigin).toFixed(4)}); asylum-seekers ${t.asysAsylum.toLocaleString('en')} / ${t.asysOrigin.toLocaleString('en')} ` +
    `(ratio ${(t.asysAsylum / t.asysOrigin).toFixed(4)}); forcibly displaced ${t.fdip.toLocaleString('en')}`);
  console.log(`composite check: ${seen.find((x) => x.violations).violations.length} countries where refugees+asylum-seekers hosted exceed forcibly displaced`);
  console.log(`\n${layers.length} layers, ${layers.reduce((a, l) => a + Object.keys(l.rows).length, 0)} country-series total; raw cached under ${CACHE}/`);
  console.log(`licence ${meta.licenceId}, commercial reuse clear: ${meta.commercialUseClear} — datacatalog.worldbank.org/public-licenses, read 2026-09-20`);
}
