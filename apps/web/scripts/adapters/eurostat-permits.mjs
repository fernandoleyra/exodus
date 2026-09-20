// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Eurostat's migration family, centred on migr_resfirst (first residence permits).
//
// Why permits rather than protection: a first permit is issued for work, family or study,
// which is what the app's flow spine actually estimates. Asylum is 1-2% of global flows and
// is selected on the least representative corridors, so a protection layer looks like a
// migration layer and answers a different question.
//
// ---------------------------------------------------------------------------------------
// LICENCE — read at https://ec.europa.eu/eurostat/web/main/help/copyright-notice
// on 2026-09-20. The trap this project has already paid for twice is live on that page:
// the FIRST paragraph is about the website, not the data, and it is the CC BY one.
//
//   "The copyright for the editorial content of this website, which is owned by the EU, is
//    licensed under the Creative Commons Attribution 4.0 International licence."
//
// The sentence that actually governs the numbers below is the next one, and it is NOT CC BY
// — it is the Commission's own reuse decision:
//
//   "Reuse of statistical data, metadata, publications, and other dissemination tools
//    published on this website for commercial or non-commercial purposes is authorised
//    provided the source is acknowledged. The reuse policy of the European Commission is
//    implemented by the Decision of 12 December 2011."   [= Decision 2011/833/EU]
//
// Badging these layers "CC BY 4.0" would therefore be false even though CC BY 4.0 appears
// verbatim on the same page. Hence licenceId LicenseRef-Eurostat-Reuse, not CC-BY-4.0.
//
// The grant has a carve-out that bites this dataset family specifically. Same page:
//
//   "The following Eurostat data and documents may not be reused for commercial purposes,
//    but non-commercial reuse is possible without restriction: ... Data for countries other
//    than: Member States of the European Union (EU), Member States of the European Free
//    Trade Association (EFTA), official EU acceding and candidate countries. Examples are
//    data for the United States of America, Japan or China. In such cases, the user will
//    need to eliminate these data from the tables before reusing them commercially."
//
// Two questions follow, and the page answers both itself in its trade-data examples:
//
//   "it is not allowed to sell export/import data declared by Switzerland ... However, it
//    is allowed to sell Swiss export / import data declared by an EU Member State."
//
// So the carve-out is scoped to the DECLARING country, not to the subject of the record.
// A permit issued by Germany to a US citizen is German declared data and is in scope of the
// commercial grant; the citizenship axis therefore needs no filtering. A row whose *geo*
// (reporting) code is outside EU/EFTA/candidate does not, and is eliminated below rather
// than shipped — which is the action the page itself prescribes. That elimination is what
// makes commercialUseClear true here instead of a hopeful assertion: see dropReporters().
// It is not theoretical. migr_pop1ctz reports Monaco (MC), which is none of the three.
// ---------------------------------------------------------------------------------------

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

export const meta = {
  id: 'eurostat-permits',
  producer: 'Eurostat',
  licenceId: 'LicenseRef-Eurostat-Reuse',
  commercialUseClear: true,
};

const API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const CACHE = '.cache/layers/eurostat-permits';
/** Periods pulled per dataset. Five is enough to compute a trailing median reporter count
 *  (contract rule 4) without which a thin tail cannot be told from a real period. */
const WINDOW = 5;

/* ------------------------------------------------------------------ transport ---------- */

/** Eurostat answers a malformed query with HTTP 400 and a JSON error body whose `label`
 *  names the offending dimension. Surfacing that label is the difference between
 *  "request failed" and "AGEDEF is not defined", which is the whole bug. */
const eurostatError = (body) => {
  try { return JSON.parse(body).error?.map((e) => e.label).join('; ') || null; } catch { return null; }
};

async function getJson(url) {
  let res = null, transport = null;
  try { res = await fetch(url); } catch (e) { transport = e; }
  if (res) {
    const body = await res.text();
    // A bad status is a real answer, not a transport failure: retrying it through curl
    // would only hide the error label Eurostat just handed us.
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}: ${eurostatError(body) ?? body.slice(0, 300)}`);
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('json')) throw new Error(`${url}: content-type ${ct}, expected JSON (a block page also answers 200)`);
    return JSON.parse(body);
  }
  // House pattern: where node's fetch is refused at the TLS layer, curl still gets through.
  const { stdout } = await run('curl', ['-sS', '--max-time', '180', url], { maxBuffer: 256 * 1024 * 1024 });
  try { return JSON.parse(stdout); }
  catch { throw new Error(`${url}: ${transport?.message}; curl fallback did not return JSON either`); }
}

async function estat(slug, dataset, params) {
  // URLSearchParams takes an array of pairs so a dimension can be repeated (citizen twice),
  // which is how two codes of one dimension come back in a single response.
  const qs = new URLSearchParams([['format', 'JSON'], ...Object.entries(params).flatMap(
    ([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]))]);
  const j = await getJson(`${API}/${dataset}?${qs}`);
  await mkdir(CACHE, { recursive: true });
  await writeFile(`${CACHE}/${slug}.json`, JSON.stringify(j));
  return j;
}

/* ------------------------------------------------------------------ structure ---------- */

/** The dimension list and the newest period, without pulling a single observation.
 *
 *  `time=1900` is accepted as a well-formed filter that selects nothing, so the response
 *  carries the full dimension declaration and `extension.annotation` at a few kB. That is
 *  where OBS_PERIOD_OVERALL_LATEST lives, and asking it first is how the period gets chosen
 *  by the producer's own answer rather than by the tail of a codelist. */
async function structure(dataset) {
  const j = await estat(`struct_${dataset}`, dataset, { time: '1900' });
  if (!Array.isArray(j.id) || !j.dimension) throw new Error(`${dataset}: no dimension declaration in a 200 response`);
  const ann = Object.fromEntries((j.extension?.annotation ?? []).map((a) => [a.type, a.title ?? a.date]));
  const latest = ann.OBS_PERIOD_OVERALL_LATEST;
  if (!latest) throw new Error(`${dataset}: no OBS_PERIOD_OVERALL_LATEST annotation — cannot choose a period honestly`);
  return {
    dataset, dims: j.id, latest, oldest: ann.OBS_PERIOD_OVERALL_OLDEST ?? null,
    updated: j.updated, label: j.label,
    codes: Object.fromEntries(j.id.map((d) => [d, j.dimension[d].category])),
  };
}

/* ------------------------------------------------------------------ decoding ----------- */

/** JSON-stat 2.0 -> one record per observation, carrying EVERY dimension in `id`.
 *
 *  Decoding only the dimensions you asked for is the silent-corruption case: an undeclared
 *  dimension (migr_imm1ctz's `agedef`) multiplies every stride and each cell lands under the
 *  wrong key without anything failing. So the strides are computed from `size` as declared. */
function decode(j, dataset) {
  if (j?.class !== 'dataset' || !j.dimension || !j.id || !j.size)
    throw new Error(`${dataset}: 200 without a JSON-stat dataset body`);
  const { id, size } = j;
  if (id.length !== size.length) throw new Error(`${dataset}: ${id.length} dimensions but ${size.length} sizes`);
  // A wrong code on any axis comes back as HTTP 200 with that axis emptied and `value` {}.
  // unit=NR on migr_resfirst is exactly this, verified 2026-09-20: size[unit] === 0.
  const empty = id.filter((d, i) => size[i] === 0);
  if (empty.length) throw new Error(`${dataset}: HTTP 200 but dimension(s) ${empty.join(', ')} came back zero-length — a filter code is wrong, not the network`);

  const stride = new Array(size.length).fill(1);
  for (let i = size.length - 2; i >= 0; i--) stride[i] = stride[i + 1] * size[i + 1];
  const names = id.map((d) => {
    const idx = j.dimension[d].category.index;
    const back = [];
    for (const [code, pos] of Object.entries(idx)) back[pos] = code;
    return back;
  });

  const status = j.status ?? {};
  const value = j.value ?? {};
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v]) : Object.entries(value);
  const rows = [];
  for (const [flat, v] of entries) {
    if (v === null || v === undefined) continue;
    const f = Number(flat);
    const rec = { v, flag: status[flat] ?? null };
    for (let i = 0; i < id.length; i++) rec[id[i]] = names[i][Math.floor(f / stride[i]) % size[i]];
    rows.push(rec);
  }
  return { rows, size: Object.fromEntries(id.map((d, i) => [d, size[i]])), updated: j.updated };
}

/** Every dimension that is meant to be pinned must have come back with exactly one code.
 *  This is the guard that survives Eurostat adding a dimension: a pin that silently failed
 *  to apply, or a new axis nobody knew about, shows up here instead of as doubled rows. */
function assertPinned(dec, dataset, varying) {
  const loose = Object.entries(dec.size).filter(([d, n]) => n !== 1 && !varying.includes(d));
  if (loose.length) throw new Error(`${dataset}: dimension(s) ${loose.map(([d, n]) => `${d}×${n}`).join(', ')} came back with more than one code but are not part of the key — a pin did not apply`);
}

/* ------------------------------------------------------------------ codes -------------- */

// Eurostat codes geo and citizen as ISO 3166-1 alpha-2 with two standing departures — EL for
// Greece, UK for the United Kingdom — so the app's alpha-3 place keys need a crosswalk.
// Derived on 2026-09-20 from the World Bank country list (iso2Code -> id), which covers 193
// of the 199 two-letter codes these seven datasets use; the remaining six (CK, EH, EL, TW,
// UK, VA) are filled from scripts/m49.json, against whose 250 alpha-3 values the whole table
// is re-checked at load time. Hardcoded rather than fetched so the snapshot still rebuilds
// from a clean clone with one producer and no second network dependency.
const ISO3 = {
  AD:'AND', AE:'ARE', AF:'AFG', AG:'ATG', AL:'ALB', AM:'ARM', AO:'AGO', AR:'ARG', AT:'AUT',
  AU:'AUS', AZ:'AZE', BA:'BIH', BB:'BRB', BD:'BGD', BE:'BEL', BF:'BFA', BG:'BGR', BH:'BHR',
  BI:'BDI', BJ:'BEN', BN:'BRN', BO:'BOL', BR:'BRA', BS:'BHS', BT:'BTN', BW:'BWA', BY:'BLR',
  BZ:'BLZ', CA:'CAN', CD:'COD', CF:'CAF', CG:'COG', CH:'CHE', CI:'CIV', CK:'COK', CL:'CHL',
  CM:'CMR', CN:'CHN', CO:'COL', CR:'CRI', CU:'CUB', CV:'CPV', CY:'CYP', CZ:'CZE', DE:'DEU',
  DJ:'DJI', DK:'DNK', DM:'DMA', DO:'DOM', DZ:'DZA', EC:'ECU', EE:'EST', EG:'EGY', EH:'ESH',
  EL:'GRC', ER:'ERI', ES:'ESP', ET:'ETH', FI:'FIN', FJ:'FJI', FM:'FSM', FR:'FRA', GA:'GAB',
  GD:'GRD', GE:'GEO', GH:'GHA', GM:'GMB', GN:'GIN', GQ:'GNQ', GT:'GTM', GW:'GNB', GY:'GUY',
  HN:'HND', HR:'HRV', HT:'HTI', HU:'HUN', ID:'IDN', IE:'IRL', IL:'ISR', IN:'IND', IQ:'IRQ',
  IR:'IRN', IS:'ISL', IT:'ITA', JM:'JAM', JO:'JOR', JP:'JPN', KE:'KEN', KG:'KGZ', KH:'KHM',
  KI:'KIR', KM:'COM', KN:'KNA', KP:'PRK', KR:'KOR', KW:'KWT', KZ:'KAZ', LA:'LAO', LB:'LBN',
  LC:'LCA', LI:'LIE', LK:'LKA', LR:'LBR', LS:'LSO', LT:'LTU', LU:'LUX', LV:'LVA', LY:'LBY',
  MA:'MAR', MC:'MCO', MD:'MDA', ME:'MNE', MG:'MDG', MH:'MHL', MK:'MKD', ML:'MLI', MM:'MMR',
  MN:'MNG', MR:'MRT', MT:'MLT', MU:'MUS', MV:'MDV', MW:'MWI', MX:'MEX', MY:'MYS', MZ:'MOZ',
  NA:'NAM', NE:'NER', NG:'NGA', NI:'NIC', NL:'NLD', NO:'NOR', NP:'NPL', NR:'NRU', NZ:'NZL',
  OM:'OMN', PA:'PAN', PE:'PER', PG:'PNG', PH:'PHL', PK:'PAK', PL:'POL', PS:'PSE', PT:'PRT',
  PW:'PLW', PY:'PRY', QA:'QAT', RO:'ROU', RS:'SRB', RU:'RUS', RW:'RWA', SA:'SAU', SB:'SLB',
  SC:'SYC', SD:'SDN', SE:'SWE', SG:'SGP', SI:'SVN', SK:'SVK', SL:'SLE', SM:'SMR', SN:'SEN',
  SO:'SOM', SR:'SUR', SS:'SSD', ST:'STP', SV:'SLV', SY:'SYR', SZ:'SWZ', TD:'TCD', TG:'TGO',
  TH:'THA', TJ:'TJK', TL:'TLS', TM:'TKM', TN:'TUN', TO:'TON', TR:'TUR', TT:'TTO', TV:'TUV',
  TW:'TWN', TZ:'TZA', UA:'UKR', UG:'UGA', UK:'GBR', US:'USA', UY:'URY', UZ:'UZB', VA:'VAT',
  VC:'VCT', VE:'VEN', VN:'VNM', VU:'VUT', WS:'WSM', XK:'XKX', YE:'YEM', ZA:'ZAF', ZM:'ZMB',
  ZW:'ZWE',
};

/** Kosovo has no M49 entry because it has no UN membership; XKX is the user-assigned code
 *  the World Bank, the IMF and Eurostat's own XK all resolve to. Listing it here keeps the
 *  m49 cross-check strict for the other 198 instead of loosening it for all of them. */
const NOT_IN_M49 = new Set(['XKX']);

async function checkIso3() {
  const m49 = JSON.parse(await readFile(new URL('../m49.json', import.meta.url), 'utf8'));
  const valid = new Set(Object.values(m49));
  const bad = Object.entries(ISO3).filter(([, a3]) => !valid.has(a3) && !NOT_IN_M49.has(a3));
  if (bad.length) throw new Error(`ISO3 table has ${bad.length} alpha-3 code(s) absent from scripts/m49.json: ${bad.map(([a2, a3]) => `${a2}->${a3}`).join(', ')}`);
  const seen = new Map();
  for (const [a2, a3] of Object.entries(ISO3)) {
    if (seen.has(a3)) throw new Error(`ISO3 table maps both ${seen.get(a3)} and ${a2} to ${a3}`);
    seen.set(a3, a2);
  }
}

/** A code is an aggregate unless it is exactly two letters. That is stronger than an
 *  enumerated deny-list because it also catches the ones nobody has met yet: EU27_2020,
 *  EU28, EA20 and EA21 on geo, and on citizen the nesting set that makes a naive sum read
 *  about three times the truth — EXT, HDC_EXT, AFR beside AFR_N, NEU27_2020_FOR, TOTAL,
 *  UK_OCT, STLS, RNC, UNK. Every dropped code is returned so none of it goes unseen. */
const isCountryCode = (c) => /^[A-Z]{2}$/.test(c);

/* ------------------------------------------------------------------ licence guard ------ */

// The commercial grant covers data declared by an EU Member State, an EFTA member or an
// official candidate. EU27 from 2020 and the four EFTA members are stable sets; the
// candidate set is not, so it is cross-checked below against Eurostat's own count.
const EU27 = 'BE BG CZ DK DE EE IE EL ES FR HR IT CY LV LT LU HU MT NL AT PL PT RO SI SK FI SE'.split(' ');
const EFTA = 'IS LI NO CH'.split(' ');
const CANDIDATES = 'AL BA GE MD ME MK RS TR UA'.split(' ');
const LICENSED_REPORTERS = new Set([...EU27, ...EFTA, ...CANDIDATES]);

/** Eurostat labels its own candidate aggregate "Candidate countries from 2023 (9 countries)".
 *  Parsing that count out of a live codelist and comparing it to CANDIDATES turns a list
 *  typed here into a claim the source can refute: the day a tenth country is admitted, or
 *  Eurostat publishes a CC10_26_FOR, this throws instead of quietly shipping data the
 *  licence does not cover commercially. */
function checkCandidateSet(codes) {
  const cc = Object.entries(codes.citizen?.label ?? {})
    .map(([code, label]) => ({ code, label, m: /^CC(\d+)_(\d+)_FOR$/.exec(code) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(b.m[2]) - Number(a.m[2]))[0];
  if (!cc) throw new Error('no CC<n>_<yy>_FOR aggregate in the citizen codelist — the candidate-country count can no longer be checked against the source');
  const n = Number(/\((\d+) countries\)/.exec(cc.label)?.[1]);
  if (!Number.isFinite(n)) throw new Error(`cannot read a country count out of ${cc.code} label "${cc.label}"`);
  if (n !== CANDIDATES.length) throw new Error(`Eurostat's ${cc.code} says ${n} candidate countries, CANDIDATES lists ${CANDIDATES.length} — the licence carve-out set has moved and the reporter filter is now wrong`);
  return { code: cc.code, n };
}

/* ------------------------------------------------------------------ period choice ------ */

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Choose the period to headline, given how many reporters each period actually has.
 *
 *  `lastTimePeriod=N` returns the last N entries of the time CODELIST, so the newest entry
 *  can be a handful of fast reporters and charting it shows a collapse that never happened.
 *  The annotation's latest period is the candidate; it is accepted only if its reporter
 *  count holds up against the median of the periods behind it, and otherwise the adapter
 *  steps back a period and says so. */
function pickPeriod(counts, annotationLatest, dataset) {
  const periods = Object.keys(counts).sort();
  if (!periods.includes(annotationLatest))
    throw new Error(`${dataset}: OBS_PERIOD_OVERALL_LATEST is ${annotationLatest} but the pull returned ${periods.join(', ')} — the window missed the newest period`);
  const notes = [];
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    const prior = periods.slice(0, i).map((q) => counts[q]);
    const expected = prior.length ? Math.round(median(prior)) : counts[p];
    // 0.6 rather than 1.0: a real period does lose a reporter or two (migr_resfirst 2025
    // loses only Iceland). A tail with under 60% of the usual reporters is not a period.
    if (!prior.length || counts[p] >= 0.6 * expected) return { period: p, n: counts[p], expected, notes };
    notes.push(`${p} rejected: ${counts[p]} reporters against a trailing median of ${expected}`);
  }
  throw new Error(`${dataset}: no period in the pulled window has a credible reporter count (${notes.join('; ')})`);
}

/* ------------------------------------------------------------------ layer assembly ----- */

const periodEndOfLabel = (label) => {
  if (/^\d{4}$/.test(label)) return `${label}-12-31`;
  throw new Error(`unhandled period label ${label} — every dataset in this family is annual`);
};

/** Eurostat's observation flags are COMPOUND: the codelist (ESTAT/OBS_FLAG, read live on
 *  2026-09-20) has 'ep' estimated+provisional, 'bep', 'ip', 'bdu' and 38 more. A test for
 *  flag === 'p' therefore misses most provisional values in this family; the flags are
 *  single letters concatenated, so membership is what to test. */
const hasFlag = (flag, letter) => !!flag && flag.includes(letter);

function buildLayer({ id, title, question, unit, entity, cells, key, struct, periodEnd, note, cadence = 'annual', estimateKind = 'reported' }) {
  // Count reporters on the cells that SURVIVE the aggregate and licence filters. Counting
  // raw geo instead inflates every layer by EU27_2020 (and by EA20/EA21 on une_rt_a), which
  // is how a reporters chip ends up claiming more countries than the layer has rows for.
  const kept = cells.filter((c) => key(c) !== null);
  const counts = {};
  for (const c of kept) (counts[c.time] ??= new Set()).add(c.geo);
  const chosen = pickPeriod(Object.fromEntries(Object.entries(counts).map(([t, s]) => [t, s.size])), struct.latest, struct.dataset);

  const rows = {};
  for (const c of kept) (rows[key(c)] ??= {})[c.time] = c.v;
  const periods = [...new Set(kept.map((c) => c.time))].sort();
  const newest = kept.filter((c) => c.time === chosen.period);
  const provisionalIn = [...new Set(newest.filter((c) => hasFlag(c.flag, 'p')).map(key))].sort();
  const breaks = [...new Set(newest.filter((c) => hasFlag(c.flag, 'b')).map(key))].sort().map((k) => `${k}@${chosen.period}`);

  const layer = {
    id, title, question, unit, entity,
    rows: Object.fromEntries(Object.keys(rows).sort().map((k) => [k, rows[k]])),
    periods,
    vintage: {
      periodEnd: periodEnd ? periodEnd(chosen.period) : periodEndOfLabel(chosen.period),
      periodLabel: chosen.period,
      cadence,
      coverage: [periods[0], periods[periods.length - 1]],
      estimateKind,
      provisional: provisionalIn.length > 0,
      ...(breaks.length ? { breaks } : {}),
      reporters: { n: chosen.n, expected: chosen.expected },
      producer: meta.producer,
      licenceId: meta.licenceId,
      doi: `10.2908/${struct.dataset.toUpperCase()}`,
      commercialUseClear: meta.commercialUseClear,
    },
    note,
  };
  return { layer, chosen, provisionalIn, newest };
}

/* ------------------------------------------------------------------ load --------------- */

export async function load() {
  await checkIso3();
  const say = (s) => console.log(s);

  // Structures first: eight cheap requests that decide the periods and the pins before a
  // single observation is pulled.
  const S = {};
  for (const d of ['migr_resfirst', 'migr_imm1ctz', 'migr_emi1ctz', 'migr_pop1ctz', 'une_rt_a', 'migr_resvalid', 'migr_eirtn']) {
    S[d] = await structure(d);
    say(`struct ${d.padEnd(14)} latest=${S[d].latest} oldest=${S[d].oldest} dims=${S[d].dims.join('/')}`);
  }
  const cc = checkCandidateSet(S.migr_imm1ctz.codes);
  say(`licence  reporter set = EU27(${EU27.length}) + EFTA(${EFTA.length}) + ${cc.code}(${cc.n}) = ${LICENSED_REPORTERS.size} codes`);

  const dropped = { reporters: new Set(), unmapped: new Set(), aggregates: new Set() };

  /** Eliminate rows declared by a country the commercial grant does not cover, and map the
   *  survivors to alpha-3. Every rejection is recorded rather than swallowed. */
  const reporter = (geo) => {
    if (!isCountryCode(geo)) { dropped.aggregates.add(geo); return null; }
    if (!LICENSED_REPORTERS.has(geo)) { dropped.reporters.add(geo); return null; }
    const a3 = ISO3[geo];
    if (!a3) { dropped.unmapped.add(geo); return null; }
    return a3;
  };
  const citizen = (c) => {
    if (!isCountryCode(c)) { dropped.aggregates.add(c); return null; }
    const a3 = ISO3[c];
    if (!a3) { dropped.unmapped.add(c); return null; }
    return a3;
  };

  /** Apply only the pins a dataset actually declares. migr_imm1ctz and migr_emi1ctz carry
   *  `agedef`; migr_pop1ctz does not, and sending agedef to it is HTTP 400
   *  "INVALID_QUERY_DIMENSION ... Dimension \"AGEDEF\" is not defined" (verified 2026-09-20).
   *  Deriving the pins from the probed dimension list is what keeps one code path over three
   *  register datasets without a special case per dataset. */
  const pinsFor = (struct, wanted) => Object.fromEntries(Object.entries(wanted).filter(([k]) => struct.dims.includes(k)));

  const layers = [];

  /* ---- migr_resfirst: reason facets and the country total ---------------------------- */
  // unit=PER, never NR. NR is in the SDMX structure but carries nothing for this dataset:
  // it answers HTTP 200 with size[unit] === 0 and value {} (verified 2026-09-20), which is
  // why decode() refuses a zero-length dimension instead of returning an empty layer.
  const reasonPins = pinsFor(S.migr_resfirst, { citizen: 'TOTAL', duration: 'TOTAL', unit: 'PER' });
  const reasonDec = decode(await estat('resfirst_reason', 'migr_resfirst', { ...reasonPins, lastTimePeriod: WINDOW }), 'migr_resfirst');
  assertPinned(reasonDec, 'migr_resfirst/reason', ['reason', 'geo', 'time']);
  say(`pull   migr_resfirst reason×geo  cells=${reasonDec.rows.length} sizes=${JSON.stringify(reasonDec.size)}`);

  const RESFIRST_NOTE = `First permits are issued to non-EU citizens only, so a member state's own EU-citizen arrivals are absent by construction; full series runs ${S.migr_resfirst.oldest}-${S.migr_resfirst.latest}.`;
  const REASONS = [
    ['TOTAL', 'eu-first-permits', 'EU first residence permits', 'How many first residence permits did this country issue?'],
    ['EMP', 'eu-first-permits-employment', 'EU first permits issued for employment', 'How many first permits did this country issue for work?'],
    ['FAM', 'eu-first-permits-family', 'EU first permits issued for family reasons', 'How many first permits did this country issue for family reasons?'],
    ['EDUC', 'eu-first-permits-education', 'EU first permits issued for education', 'How many first permits did this country issue for study?'],
    ['OTH', 'eu-first-permits-other', 'EU first permits issued for other reasons', 'How many first permits did this country issue for reasons other than work, family or study?'],
  ];
  // The four facets ship as four sibling country layers rather than as one layer with a
  // facet field, because the Layer contract has no facet axis and inventing one here would
  // make this adapter's rows unreadable to anything that reads the others.
  for (const [code, id, title, question] of REASONS) {
    const cells = reasonDec.rows.filter((r) => r.reason === code);
    const built = buildLayer({
      id, title, question, unit: 'people', entity: 'country', cells, struct: S.migr_resfirst,
      key: (c) => reporter(c.geo),
      note: code === 'TOTAL'
        ? `${RESFIRST_NOTE} The four reason facets shipped alongside sum exactly to this total.`
        : `One of four disjoint reason facets that sum to eu-first-permits; ${RESFIRST_NOTE.charAt(0).toLowerCase()}${RESFIRST_NOTE.slice(1)}`,
    });
    layers.push(built.layer);
    say(`layer  ${id.padEnd(30)} ${built.chosen.period} n=${built.chosen.n}/${built.chosen.expected} rows=${Object.keys(built.layer.rows).length}${built.layer.vintage.provisional ? ' PROVISIONAL' : ''}`);
  }

  /* ---- migr_resfirst: the corridor layer --------------------------------------------- */
  // This is the layer worth having. The citizen axis resolves against the geo axis, so a
  // cell is genuinely bilateral: SY>DE is a Syrian citizen receiving a German permit, not a
  // country total apportioned by a model.
  const corrPins = pinsFor(S.migr_resfirst, { reason: 'TOTAL', duration: 'TOTAL', unit: 'PER' });
  const corrDec = decode(await estat('resfirst_corridors', 'migr_resfirst', { ...corrPins, lastTimePeriod: WINDOW }), 'migr_resfirst');
  assertPinned(corrDec, 'migr_resfirst/corridors', ['citizen', 'geo', 'time']);
  const corrBuilt = buildLayer({
    id: 'eu-first-permits-corridors',
    title: 'EU first residence permits by citizenship and issuing country',
    question: 'How many first residence permits did this destination issue to citizens of this origin?',
    unit: 'people', entity: 'corridor', cells: corrDec.rows, struct: S.migr_resfirst,
    key: (c) => { const o = citizen(c.citizen), d = reporter(c.geo); return o && d ? `${o}>${d}` : null; },
    // These corridors deliberately do NOT sum to eu-first-permits. The gap is the permits
    // held by people with no country of citizenship to key on — STLS, RNC, UNK and UK_OCT —
    // and it is exact: DE 2025 totals 605,292 against 598,313 across corridors, and
    // STLS 1,662 + UNK 5,307 + UK_OCT 10 + RNC 0 is precisely the 6,979 difference.
    note: 'These corridors fall short of the country total by exactly the stateless, recognised-non-citizen, unknown-citizenship and British-overseas-territory permits, which have no origin country to key on; a reported zero is kept as a zero, because absent and nil are different answers here.',
  });
  layers.push(corrBuilt.layer);
  {
    const nz = corrBuilt.newest.filter((c) => c.v > 0);
    say(`layer  eu-first-permits-corridors    ${corrBuilt.chosen.period} destinations=${corrBuilt.chosen.n}/${corrBuilt.chosen.expected} corridors=${Object.keys(corrBuilt.layer.rows).length} non-zero-in-${corrBuilt.chosen.period}=${nz.length} origins=${new Set(nz.map((c) => c.citizen)).size}`);
  }

  /* ---- the registers the app already ships ------------------------------------------- */
  // agedef=REACH is pinned not because the two age definitions disagree — at age=TOTAL they
  // return byte-identical values for all 34 reporters (checked 2026-09-20) — but because
  // leaving it open returns both and any key that ignores agedef then halves or doubles
  // depending on iteration order.
  const REGISTERS = [
    { ds: 'migr_imm1ctz', id: 'eu-immigration', title: 'EU immigration (population register)',
      question: 'How many people did this country register as immigrating?', citizen: 'TOTAL',
      note: 'Register immigration counts anyone taking up residence for 12 months or more, EU citizens included, so it is a wider quantity than a permit count and the two must not be differenced.' },
    { ds: 'migr_emi1ctz', id: 'eu-emigration', title: 'EU emigration (population register)',
      question: 'How many people did this country register as emigrating?', citizen: 'TOTAL',
      note: 'Emigration is the worst-measured side of a register: a departure is reported by the person leaving, so these counts run low against the receiving country’s immigration figure for the same flow.' },
  ];
  for (const r of REGISTERS) {
    const pins = pinsFor(S[r.ds], { citizen: r.citizen, agedef: 'REACH', age: 'TOTAL', unit: 'NR', sex: 'T' });
    const dec = decode(await estat(r.id, r.ds, { ...pins, lastTimePeriod: WINDOW }), r.ds);
    assertPinned(dec, r.ds, ['geo', 'time']);
    const built = buildLayer({
      id: r.id, title: r.title, question: r.question, unit: 'people', entity: 'country',
      cells: dec.rows, struct: S[r.ds], key: (c) => reporter(c.geo), note: r.note,
    });
    layers.push(built.layer);
    say(`layer  ${r.id.padEnd(30)} ${built.chosen.period} n=${built.chosen.n}/${built.chosen.expected} rows=${Object.keys(built.layer.rows).length}${built.layer.vintage.provisional ? ` PROVISIONAL(${built.provisionalIn.join(',')})` : ''}`);
  }

  /* ---- migr_pop1ctz: two stocks, one request ----------------------------------------- */
  const popPins = pinsFor(S.migr_pop1ctz, { agedef: 'REACH', age: 'TOTAL', unit: 'NR', sex: 'T' });
  if ('agedef' in popPins) throw new Error('migr_pop1ctz unexpectedly declares agedef — the 400 that motivated pinsFor() would now be a silent extra dimension');
  const popDec = decode(await estat('pop1ctz', 'migr_pop1ctz', { ...popPins, citizen: ['TOTAL', 'FOR_STLS'], lastTimePeriod: WINDOW }), 'migr_pop1ctz');
  assertPinned(popDec, 'migr_pop1ctz', ['citizen', 'geo', 'time']);
  const POP = [
    { code: 'TOTAL', id: 'eu-population', title: 'EU population on 1 January',
      question: 'How many people lived here on 1 January?',
      note: 'The denominator layer, not a migration measure: citizen=TOTAL on this table is the whole resident population.' },
    { code: 'FOR_STLS', id: 'eu-foreign-citizens', title: 'EU foreign citizens resident on 1 January',
      question: 'How many residents here held foreign or no citizenship on 1 January?',
      note: 'A citizenship stock, not a foreign-born stock: naturalised residents leave this count without moving, so it falls where naturalisation is easy and rises where it is not.' },
  ];
  for (const p of POP) {
    const built = buildLayer({
      id: p.id, title: p.title, question: p.question, unit: 'people', entity: 'country',
      cells: popDec.rows.filter((r) => r.citizen === p.code), struct: S.migr_pop1ctz,
      key: (c) => reporter(c.geo), note: p.note,
      // Contract rule 8. The reference instant is 1 January of the labelled year, so the
      // stock is measured AT 2025-01-01, not across 2025. Deriving periodEnd from the label
      // would render a January stock 364 days fresher than it is.
      cadence: 'point', periodEnd: (label) => `${label}-01-01`,
    });
    layers.push(built.layer);
    say(`layer  ${p.id.padEnd(30)} ${built.chosen.period} n=${built.chosen.n}/${built.chosen.expected} rows=${Object.keys(built.layer.rows).length} periodEnd=${built.layer.vintage.periodEnd}`);
  }

  /* ---- une_rt_a ---------------------------------------------------------------------- */
  const uneDec = decode(await estat('une_rt_a', 'une_rt_a', { sex: 'T', age: 'Y15-74', unit: 'PC_ACT', lastTimePeriod: WINDOW }), 'une_rt_a');
  assertPinned(uneDec, 'une_rt_a', ['geo', 'time']);
  const une = buildLayer({
    id: 'eu-unemployment', title: 'EU unemployment rate, 15-74',
    question: 'What share of this country’s labour force was unemployed?',
    unit: '% of labour force', entity: 'country', cells: uneDec.rows, struct: S.une_rt_a,
    key: (c) => reporter(c.geo),
    note: 'A rate, so it must never be summed or area-weighted across countries; the flag ‘d’ that France and Spain carry means their definition differs from the rest and the gap is partly definitional.',
  });
  layers.push(une.layer);
  say(`layer  eu-unemployment                ${une.chosen.period} n=${une.chosen.n}/${une.chosen.expected} rows=${Object.keys(une.layer.rows).length}`);

  /* ---- migr_resvalid: the stock behind the flow --------------------------------------- */
  const validPins = pinsFor(S.migr_resvalid, { citizen: 'TOTAL', reason: 'TOTAL', duration: 'TOTAL', unit: 'PER' });
  const validDec = decode(await estat('resvalid', 'migr_resvalid', { ...validPins, lastTimePeriod: WINDOW }), 'migr_resvalid');
  assertPinned(validDec, 'migr_resvalid', ['geo', 'time']);
  const valid = buildLayer({
    id: 'eu-valid-permits', title: 'EU residence permits valid on 31 December',
    question: 'How many residence permits were valid here at the end of the year?',
    unit: 'people', entity: 'country', cells: validDec.rows, struct: S.migr_resvalid,
    key: (c) => reporter(c.geo),
    // Contract rule 8 again, the easy case: this stock's instant is 31 December, which
    // happens to coincide with the end of the labelled year, so only the cadence changes.
    cadence: 'point',
    note: 'A stock of valid permits at a year end, not a flow: it moves with how long permits last as much as with how many were issued, so it must not be differenced against eu-first-permits.',
  });
  layers.push(valid.layer);
  say(`layer  eu-valid-permits               ${valid.chosen.period} n=${valid.chosen.n}/${valid.chosen.expected} rows=${Object.keys(valid.layer.rows).length}`);

  /* ---- migr_eirtn: returns ------------------------------------------------------------ */
  // c_dest is NOT a destination-country axis. Its whole codelist is TOTAL and THRD
  // ("Third country"), so it says whether the return was to a country outside the EU, not
  // to which one. This family has no outbound-directed country axis.
  const rtnPins = pinsFor(S.migr_eirtn, { citizen: 'TOTAL', c_dest: 'TOTAL', age: 'TOTAL', sex: 'T', unit: 'PER' });
  const rtnDec = decode(await estat('eirtn', 'migr_eirtn', { ...rtnPins, lastTimePeriod: WINDOW }), 'migr_eirtn');
  assertPinned(rtnDec, 'migr_eirtn', ['geo', 'time']);
  const rtn = buildLayer({
    id: 'eu-returns', title: 'EU returns of non-EU citizens ordered to leave',
    question: 'How many non-EU citizens returned after being ordered to leave this country?',
    unit: 'people', entity: 'country', cells: rtnDec.rows, struct: S.migr_eirtn,
    key: (c) => reporter(c.geo),
    note: 'Eurostat rounds every value in this table to the nearest 5 for disclosure control — the dataset title says "(rounded)" — so small reporters carry rounding error of the same order as the count.',
  });
  layers.push(rtn.layer);
  say(`layer  eu-returns                     ${rtn.chosen.period} n=${rtn.chosen.n}/${rtn.chosen.expected} rows=${Object.keys(rtn.layer.rows).length}`);

  /* ---- what was thrown away ----------------------------------------------------------- */
  if (dropped.unmapped.size) throw new Error(`two-letter codes with no ISO3 mapping: ${[...dropped.unmapped].sort().join(', ')} — the crosswalk is short, fix it rather than shipping the gap`);
  say(`dropped aggregates: ${[...dropped.aggregates].sort().join(' ') || '(none)'}`);
  say(`dropped reporters outside the commercial grant: ${[...dropped.reporters].sort().join(' ') || '(none)'}`);

  return { layers };
}

/* ------------------------------------------------------------------ cli ---------------- */

if (import.meta.url === `file://${process.argv[1]}`) {
  const { layers } = await load();
  console.log('\n--- summary ---');
  for (const l of layers) {
    const v = l.vintage;
    console.log(`${l.id.padEnd(30)} ${l.entity.padEnd(8)} ${v.periodLabel} end=${v.periodEnd} rows=${Object.keys(l.rows).length} n=${v.reporters.n}/${v.reporters.expected} prov=${v.provisional} breaks=${v.breaks?.length ?? 0}`);
  }
}
