// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// IMF Balance of Payments — personal transfers, quarterly, in BOTH directions.
//
// Why this adapter exists at all: the other country layers in this app terminate in an annual
// reference period. Directly observed on 2026-09-20: the World Bank's own remittance series
// BX.TRF.PWKR.CD.DT reaches 2024 and carries lastupdated 2026-07-13, and scripts/adapters/
// worldbank.mjs records its widest WDI series reaching 2025, while this dataflow carries a
// populated 2026-Q1. It is the freshest reference period in the macro stack by two years
// against the nearest same-concept series, and it is the only one that reads in two directions:
// the World Bank ships receipts only, whereas BOP splits the same concept into credit (money
// reaching resident households from abroad — roughly what this country's emigrants send home)
// and debit (money leaving resident households — roughly what immigrants living here send out).
//
// What it is NOT is bilateral. The series key has exactly five dimensions — COUNTRY,
// BOP_ACCOUNTING_ENTRY, INDICATOR, UNIT, FREQUENCY, read off the live response and asserted
// below — and none of them is a counterpart country. There is no origin-by-destination matrix
// hiding in here, and crossing one country's credit with another's debit invents the pairing.
//
// ---------------------------------------------------------------- LICENCE
// Read in full on 2026-09-20 at https://www.imf.org/en/_site_imf/about/copyright-and-terms
// (HTTP 200). The canonical https://www.imf.org/en/About/copyright-and-terms answers HTTP 403
// to this client, which is why the _site_imf mirror is the URL quoted.
//
// The trap this project has been burned by twice is an organisation licensing its WEBSITE
// CONTENT one way and its DATA another. The IMF is that shape, but inverted: the website
// content is the RESTRICTIVE side. Verbatim, from the general terms:
//
//   "Unless stated otherwise, the Content presented on the IMF Sites are the intellectual
//    property of the IMF and are published "All Rights Reserved.""
//
// Published statistical Data are carved out of that, and the carve-out names this dataflow:
//
//   "Notwithstanding the general prohibition on the commercial use of IMF Content, with
//    respect to published statistical data made available on IMF Sites, the following special
//    terms shall govern. [...] "Data" refers to the following: IMF Statistical Data,
//    including but not limited to, International Financial Statistics (IFS), Balance of
//    Payments (BOP), Direction of Trade (DOT), and Government Finance Statistics (GFS)"
//
//   "You may download, extract, copy, create derivative works, publish, distribute, and use
//    Data obtained from IMF Sites, subject to the following conditions: Whether obtained
//    directly from the IMF or another party, when Data is distributed or reproduced in any
//    manner, it must appear accurately with attribution to the IMF as the source, e.g.
//    "Source: International Monetary Fund, Database Name, <<link to the dataset>>." [...] If
//    the Data is materially transformed by the User, this must be stated explicitly along with
//    the required source citation."
//
// So far so open. But the same section closes with the sentence that decides this field:
//
//   "For any potential commercial reuse of IMF Data, please email copyright@imf.org to request
//    permission."
//
// Exodus is AGPL-3.0. The AGPL permits commercial downstream use unconditionally; these terms
// make commercial reuse conditional on an email nobody downstream has sent. A grant you have to
// ask for is not a grant, so `commercialUseClear` is FALSE and this layer must not be badged
// beside the CC BY 4.0 layers as though the two were the same instrument. That is not a
// judgement about whether the IMF would say yes — it is the observation that the question is
// open, and an open question is exactly what this flag exists to carry.
//
// Consistent with LICENSES/LicenseRef-IMF-Data.txt, which reaches the same conclusion about the
// same sentence. Two things in the general terms are NOT in that file and are recorded here
// because they bear on this adapter specifically:
//
//   "The IMF prohibits the bulk download of information by automated technology without
//    explicit permission and reserves the right to terminate access to its Sites or Content."
//
// This adapter issues exactly two requests per run and caches both for six hours. It reads two
// slices of one dataflow; it does not mirror the database. And, read on 2026-09-20, new since
// that file was written:
//
//   "The IMF does not permit use of its Content or Sites for the training of large language
//    models (LLMs) without explicit permission."
//
// Attribution in the form the licence asks for, to be carried wherever these numbers are shown:
//   Source: International Monetary Fund, Balance of Payments (BOP),
//   https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/BOP/21.0.0
//
// The material transformations this adapter makes, stated as the licence requires: regional and
// historical aggregates are dropped, two IMF country codes are renamed to ISO-3166-1 alpha-3,
// values are rounded to whole US dollars, periods before 1990-Q1 and after the accepted
// quarter are dropped, and country series that are exactly zero in every period inside that
// window are dropped as non-reports. Each is justified at its own site below.
// ------------------------------------------------------------------------------------

import { mkdir, readFile, rename, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);

export const meta = {
  id: 'imf-bop',
  producer: 'International Monetary Fund',
  licenceId: 'LicenseRef-IMF-Data',
  commercialUseClear: false,
};

// The dataflow version is part of the path, not an optional refinement. Probed 2026-09-20:
// dropping `/21.0.0` from this URL answers HTTP 404, it does not fall back to the latest.
const FLOW = 'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/BOP/21.0.0';

// D752_S1W, resolved against CL_BOP_INDICATOR in the dataflow's own structure response rather
// than from documentation: "Personal transfers (current transfers between resident and
// nonresident households), Financial corporations, nonfinancial corporations, households, and
// NPISHs". Its sibling R1_S1W ("Personal remittances (supplementary item)") is the wider
// concept — personal transfers plus compensation of employees — and would be the better
// migration proxy if it were populated. It is not: probed on 2026-09-20 the same query against
// R1_S1W returns 25 countries in the key space, 16 with a value at 2025-Q1 of which 5 are
// non-zero (and one of those five is the CWX territory aggregate), and 15 with a value at
// 2026-Q1 of which 4 are non-zero — BLR, GEO, MDA and PHL — against 87 here. Where both exist
// at 2026-Q1 the wider item runs 1.17x (GEO) to 3.16x (BLR) the narrower one, which is the size
// of what this layer leaves out and why the note refuses the word "remittances".
const INDICATOR = 'D752_S1W';

// `attributes=none` is deliberately NOT sent, although it is the obvious way to shave 150 KB
// off a 520 KB response. Contract rule 3 says read status alongside value, and STATUS lives in
// the observation attributes: with `attributes=none` there is no status to read and
// `provisional` could only be asserted rather than derived. 150 KB is the price of that.
const url = (entry) => `${FLOW}/*.${entry}.${INDICATOR}.USD.Q?format=sdmx-json`;

const CACHE = '.cache/layers/imf-bop';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// The corridor spine this app is built around starts at 1990, and a country layer reaching
// further back cannot be placed beside it — the same boundary scripts/adapters/worldbank.mjs
// draws, for the same reason. The API itself goes back to 1970-Q1 (226 quarters observed in the
// time codelist on 2026-09-20); trimming costs about 12% of the payload and buys a shared axis.
const FIRST_PERIOD = '1990-Q1';

// ---------------------------------------------------------------- geography
//
// The COUNTRY dimension already emits ISO-3166-1 alpha-3 for real countries, so contract rule 8
// needs no two-letter crosswalk here. It also emits four kinds of thing that are not a country,
// all four observed in the 2026-09-20 payload, and all four caught by the same rule: a code
// ships only if it is three letters AND appears in scripts/m49.json, or is one of the two
// renames below.
//
//   G163   "Euro Area (EA)" per CL_COUNTRY — an aggregate, and not a small one: unfiltered it
//          is the third-largest debit value at 2026-Q1, above France. Four characters, so the
//          shape test drops it; the positive assertion in decode() is what proves that happened.
//   GX126  absent from CL_COUNTRY entirely — an undocumented code, which as it happens carries
//          no observations and so never reaches the shape test at all.
//   ANT / CWX  Netherlands Antilles and "Curaçao and Sint Maarten". Three letters each, so
//          shape is not enough; they fail on m49. ANT is a dissolved state (ISO 3166-3, not
//          -1) and CWX is an aggregate of two territories that also appear separately here as
//          CUW and SXM. These two are the ONLY codes the m49 test actually rejects — the
//          adapter's own report prints "non-country codes dropped: ANT,CWX,G163".
//   CSK / YAR  Czechoslovakia and the Yemen Arab Republic, also dissolved states, are in the
//          key space but carry no `observations` key at all (with TKM and GX126), so they are
//          skipped before the m49 test is reached and never appear in the dropped list. Do
//          not read their absence from that list as the filter having missed them.
//
// The two renames are countries the IMF codes its own way. Both were checked for a collision
// against the codes already present, and decode() re-checks at run time.
const RENAME = {
  // The IMF's KOS. XKX is the user-assigned code the World Bank, Eurostat (via XK) and
  // scripts/adapters/_iso3.mjs all settle on; Kosovo has no M49 entry because it has no UN
  // membership, which is why it is listed here rather than reached through m49.
  KOS: 'XKX',
  // "West Bank and Gaza" is the IMF's name for the territory ISO-3166-1 codes as PSE.
  WBG: 'PSE',
};

// ---------------------------------------------------------------- freshness
//
// Contract rule 4, arithmetic. Quarterly BOP has no complete quarter: coverage accumulates for
// years after a reference period, so the credit tail on 2026-09-20, after this adapter's own
// filtering, reads
// 2024-Q3:123 2024-Q4:123 2025-Q1:114 2025-Q2:108 2025-Q3:104 2025-Q4:103 2026-Q1:87 2026-Q2:21.
// Every one of those is short against its own trailing median. The 0.95 threshold that
// scripts/adapters/worldbank.mjs uses on annual data, applied here, rejects all four of the last
// four quarters and the adapter ships nothing at all.
//
// What rule 4 is actually defending against is "a tail of three fast reporters is not a
// period", and the tail says exactly where that line falls: 87 is 0.763 of its trailing median
// of 114, 21 is 0.194 of its own 108. That is a factor of four, so the threshold is insensitive
// to where in the gap it sits and 0.55 is simply its middle. The accepted quarter is still
// materially incomplete, which is what vintage.reporters carries and what the note says in words.
const FRESH_RATIO = 0.55;
const TRAIL = 6;
const MAX_STEP_BACK = 2;

// A 10^6 scale error is the one mistake here that would produce a plausible-looking map, and
// the payload invites it: the SCALE / UNIT_MULT attribute on every series is code "6", which
// CL_UNIT_MULT names "Millions", while the observations are plainly already in whole dollars.
// The arbiter is an external total, not the attribute. Summed to calendar years on 2026-09-20,
// credit gives IND 2024 = 129.43bn against the World Bank's BX.TRF.PWKR.CD.DT 137.67bn, MEX
// 65.02 against 67.64, PHL 30.81 against 40.28, PAK 34.66 against 34.91, BGD 27.39 against
// 27.52, NGA 21.81 against 22.13 and EGY 29.56 against 29.56 — the World Bank figure at or just
// above the IMF one in all seven countries checked, which is what the definitions predict, since
// are personal transfers plus compensation of employees. So SCALE is a display hint that
// contradicts its own payload and is ignored; this band is what stands in for it. A response in
// millions lands the maximum at 4.4e4, a response scaled up by 10^6 lands it at 4.4e16, and
// both trip.
const MAX_OBS_FLOOR = 1e8;
const MAX_OBS_CEILING = 1e12;

// ---------------------------------------------------------------- transport
//
// curl, via child_process, with curl's OWN default User-Agent and no header of ours at all.
//
// CONTRACT.md and scripts/fetch-concordance.mjs both record that imf.org rejects node's fetch
// outright and answers a BROWSER User-Agent with HTTP 403 while letting curl straight through.
// That was probed on 2026-09-20 against THIS host and did not reproduce: api.imf.org answered
// all four of {curl, node fetch} x {default UA, Chrome UA} with HTTP 200 application/json. The
// WAF that rule describes is on www.imf.org, and it is emphatically still there — the canonical
// terms page at www.imf.org/en/About/copyright-and-terms answered 403 to the same curl that got
// 200 from here, which is why the licence above is quoted from the _site_imf mirror.
//
// curl stays anyway, for two reasons that survive that finding. Outbound traffic in the build
// environment goes through a TLS-terminating proxy, so a block keyed on a client's TLS
// fingerprint would be invisible from here and would appear the first time somebody runs this
// on a bare machine; and curl retries the TRANSFER, not just the request, which is what
// actually fails on a 500 KB body over a flaky link. No User-Agent is set, because if that WAF
// ever does extend to this host, curl's own is the one already known to get through — do not
// "fix" a 403 here by adding a browser UA, that is what causes it.
//
// The body goes to a file rather than stdout so that the status code can be read from -w
// without having to guess where a 500 KB single-line JSON body ends.
async function fetchJson(entry) {
  const u = url(entry);
  await mkdir(CACHE, { recursive: true });
  const part = `${CACHE}/.${entry}.part`;
  const { stdout } = await run('curl', [
    '-sS', '--max-time', '300', '--retry', '2', '-o', part, '-w', '%{http_code} %{content_type}', u,
  ], { maxBuffer: 1 << 20 });
  const [code, ...ctParts] = stdout.trim().split(/\s+/);
  const ct = ctParts.join(' ');
  const body = await readFile(part, 'utf8');
  if (code !== '200') throw new Error(`${entry}: HTTP ${code} from ${u} — ${body.slice(0, 300)}`);
  // The same WAF answers 200 with an HTML block page, so the status code alone proves nothing.
  if (!ct.includes('json')) throw new Error(`${entry}: HTTP 200 with content-type ${ct} from ${u} — a WAF block page does this. Body starts ${body.slice(0, 200)}`);
  let j;
  try { j = JSON.parse(body); }
  catch (e) { throw new Error(`${entry}: HTTP 200, content-type ${ct}, but the body is not JSON (${e.message}). Starts ${body.slice(0, 200)}`); }
  await rename(part, `${CACHE}/${entry}.json`);
  return j;
}

async function cached(entry) {
  const key = `${CACHE}/${entry}.json`;
  if (!process.env.EXODUS_NOCACHE) {
    try {
      const s = await stat(key);
      if (Date.now() - s.mtimeMs < CACHE_TTL_MS) return JSON.parse(await readFile(key, 'utf8'));
    } catch { /* no cache entry, or an unreadable one: fetch it */ }
  }
  return fetchJson(entry);
}

// ---------------------------------------------------------------- shape assertions
//
// Every way this endpoint lies with HTTP 200, checked in one place. All three were reproduced
// on 2026-09-20 before this function was written:
//
//   An empty path segment — `*.CD_T..USD.Q`, an indicator variable that came back undefined —
//   answers 200 with a 3,254-byte body (649 gzipped) in which every dimension's `values` array is empty and
//   `dataSets[0]` has NO `series` key at all. `Object.entries(undefined)` is where that lands.
//
//   An indicator code the dataflow has never heard of answers with the byte-identical body. A
//   typo is indistinguishable from an empty segment, and both are indistinguishable from
//   success by status code.
//
//   `dimensionAtObservation=AllDimensions` answers 200, silently discards the key filter, and
//   moves the data under `dataSets[0].observations` instead of `series`. It is not a subtle
//   difference in size: the filtered query is 520 KB and this one had streamed 19.5 MB without
//   finishing when it was cut off at 180 s. Asserting that `series` is present AND that each
//   filtered dimension carries exactly the one code asked for is what catches it — the second
//   of those is what actually fired when this was tested against the empty-segment body, which
//   is why the checks below are on the dimensions and not only on the presence of a key.
function assertShape(entry, j) {
  const d = j?.data;
  if (!d) throw new Error(`${entry}: 200 with no data key — top-level keys were ${Object.keys(j ?? {}).join(',') || '(none)'}`);
  const s = d.structures?.[0];
  if (!s) throw new Error(`${entry}: 200 with no structures[0]`);

  const series = s.dimensions?.series;
  const expect = ['COUNTRY', 'BOP_ACCOUNTING_ENTRY', 'INDICATOR', 'UNIT', 'FREQUENCY'];
  if (!Array.isArray(series) || series.map((x) => x.id).join(',') !== expect.join(',')) {
    throw new Error(`${entry}: series dimensions are ${series?.map((x) => x.id).join(',')}, expected ${expect.join(',')} — ` +
      `an added or reordered dimension shifts every key index silently`);
  }
  // keyPosition, not array order. The key string is positional and the two agree today; if they
  // ever stop agreeing, splitting on ':' by array index reads every country as a different one.
  series.forEach((dim, i) => {
    if (dim.keyPosition !== i) throw new Error(`${entry}: dimension ${dim.id} sits at array index ${i} but declares keyPosition ${dim.keyPosition}`);
  });

  // Each filtered dimension must carry exactly the one code that was asked for. This is the
  // check that catches a filter being ignored rather than applied.
  const only = (i, want) => {
    const got = (series[i].values ?? []).map((v) => v.id);
    if (got.length !== 1 || got[0] !== want) {
      throw new Error(`${entry}: dimension ${series[i].id} carries [${got.join(',')}] where exactly [${want}] was requested — the key filter was not applied`);
    }
  };
  only(1, entry);
  only(2, INDICATOR);
  only(3, 'USD');
  only(4, 'Q');

  const geo = (series[0].values ?? []).map((v) => v.id);
  if (geo.length < 100) throw new Error(`${entry}: COUNTRY dimension has ${geo.length} values (151 credit / 158 debit on 2026-09-20) — an empty or near-empty dimension on a 200 is how a wrong code shows up here`);

  const obsDim = s.dimensions?.observation?.[0];
  if (obsDim?.id !== 'TIME_PERIOD') throw new Error(`${entry}: observation dimension is ${obsDim?.id}, expected TIME_PERIOD`);
  // The trap that costs an hour: observation dimension entries carry `value`, not `id`. Reading
  // `id` here yields an array of undefined, every period label becomes undefined, and the rows
  // object collapses to a single key.
  const times = (obsDim.values ?? []).map((v) => v.value);
  if (!times.length || times.some((t) => typeof t !== 'string')) {
    throw new Error(`${entry}: TIME_PERIOD values did not yield strings from the .value key — sample ${JSON.stringify(obsDim.values?.[0])}. These entries carry \`value\`, never \`id\`.`);
  }
  if (!times.every((t) => /^\d{4}-Q[1-4]$/.test(t))) throw new Error(`${entry}: TIME_PERIOD carries a label that is not YYYY-Qn, e.g. ${times.find((t) => !/^\d{4}-Q[1-4]$/.test(t))}`);
  // The codelist is NOT in chronological order — on 2026-09-20 it began 1986-Q1 and ended
  // 1974-Q4 — so index order carries no meaning and every label has to be looked up.
  const ds = d.dataSets?.[0];
  if (!ds) throw new Error(`${entry}: 200 with no dataSets[0]`);
  if (!ds.series) {
    throw new Error(`${entry}: 200 with dataSets[0] = ${JSON.stringify(ds)} and no \`series\` key. ` +
      `An empty path segment and an unknown dimension code both produce exactly this 3,254-byte body, byte for byte; ` +
      `dimensionAtObservation=AllDimensions produces a body with \`observations\` here instead.`);
  }
  if (!Object.keys(ds.series).length) throw new Error(`${entry}: dataSets[0].series is present but empty`);

  return { geo, times, series: ds.series, attrs: s.attributes ?? {} };
}

/**
 * Read one attribute out of an SDMX attribute array.
 *
 * The array mixes integer indices into the descriptor's `values` list with inline literal
 * strings for attributes whose descriptor carries no `values` list at all — BPM6_BASIS_START_DATE
 * is the one in this DSD that does it, and an array like [0, 0, 0, '9/30/2025'] is the result.
 * Handling only the integer case does not throw: it looks up `values[…]` on a descriptor whose
 * list is empty, gets undefined, and reports a populated attribute as unpopulated. So the type
 * of the entry decides how it is read, and anything that is neither is loud rather than silent.
 *
 * On the 2026-09-20 payload for this particular key nothing took the literal branch — every
 * series attribute array was [0,null,null,null] across all 151 credit and 158 debit series. The
 * branch stays because the DSD still declares the attribute that produces it.
 */
function attrOf(descriptors, arr, id, offset) {
  const i = (descriptors ?? []).findIndex((a) => a.id === id);
  if (i < 0) return null;
  const raw = arr?.[offset + i];
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') {
    const v = descriptors[i].values?.[raw];
    if (v === undefined) {
      throw new Error(`attribute ${id} is index ${raw} but its descriptor lists ${descriptors[i].values?.length ?? 0} values — ` +
        `this is the mixed integer/literal array trap read the wrong way round`);
    }
    return v.id ?? v.value ?? null;
  }
  throw new Error(`attribute ${id} carries ${JSON.stringify(raw)}, which is neither an index nor a literal`);
}

// DERIVATION_TYPE decides estimateKind rather than the word "reported" being written into this
// file. Observed 2026-09-20: every one of the 15,443 credit and 15,784 debit observations
// carries "O" = "Reported official data". The mapping exists so that the day the IMF starts
// imputing a country the layer says modelled instead of quietly going on claiming reported.
//
// The keys below are the ones CL_DERIVATION_TYPE actually contains, re-read on 2026-09-20 from
// the live structure response (structure/dataflow/IMF.STA/BOP/21.0.0?references=all). It holds
// exactly twelve codes: SEME SEHI R SC SCC SE SP M O OU FA TPD. An earlier revision of this
// table also listed `I` and `DV` as derivation types; they are not — they belong to
// CL_OBS_STATUS ("Value imputed", "Derived value"), which is the codelist NOT_FINAL below reads.
// Carrying a code from the wrong codelist is how a mapping comes to look complete while the two
// real gaps go unnoticed, so they are gone.
//
// FA ("Adjusted using Fund records") and TPD ("Third party data") ARE in the codelist and are
// deliberately left unmapped: neither has ever appeared on this query, and classifying an
// unseen code as reported or modelled is the guess this repository does not make. An unmapped
// code throws by design (see decode()), which costs the layer rather than mis-labelling it —
// but note that one such observation anywhere in 36 years of history removes BOTH layers from
// the snapshot, so whoever hits it should classify FA/TPD here rather than widen the net.
const DERIVATION_KIND = {
  O: 'reported', OU: 'reported', R: 'reported',
  SE: 'modelled', SEME: 'modelled', SEHI: 'modelled', SP: 'modelled',
  SC: 'modelled', SCC: 'modelled', M: 'modelled',
};

// CL_OBS_STATUS, same source. P provisional, E estimated, F forecast, V unvalidated, U low
// reliability, _U unknown — all of them reasons not to let a headline read as final. B is a
// break in series and goes to vintage.breaks. Observed 2026-09-20: STATUS is null on every
// observation of both entries and its descriptor carries an empty `values` list, so nothing is
// flagged. `provisional` is still derived from it rather than written as false, because the day
// a P appears the layer has to say so.
const NOT_FINAL = new Set(['P', 'E', 'F', 'V', 'U', '_U']);

const median = (xs) => { const v = [...xs].sort((a, b) => a - b); return v[v.length >> 1]; };

/** Rule 4, applied. Returns the newest quarter that is a quarter rather than a leading edge. */
function chooseNewest(entry, counts) {
  const periods = [...counts.keys()].sort();
  const tried = [];
  for (let back = 0, i = periods.length - 1; back <= MAX_STEP_BACK && i >= 0; back++, i--) {
    const p = periods[i];
    const trail = periods.slice(Math.max(0, i - TRAIL), i).map((x) => counts.get(x));
    const expected = trail.length ? median(trail) : counts.get(p);
    const ratio = counts.get(p) / expected;
    tried.push(`${p}:${counts.get(p)}/${expected}=${ratio.toFixed(2)}`);
    if (ratio >= FRESH_RATIO) return { period: p, n: counts.get(p), expected, ratio, steppedBack: back };
  }
  throw new Error(`${entry}: none of the last ${MAX_STEP_BACK + 1} quarters carries ${FRESH_RATIO} of its trailing median coverage (${tried.join(' ')}) — ` +
    `the series is being withdrawn, not published late`);
}

async function m49Iso3() {
  const m = JSON.parse(await readFile(new URL('../m49.json', import.meta.url), 'utf8'));
  return new Set(Object.values(m));
}

function decode(entry, payload, valid) {
  const { geo, times, series, attrs } = payload;
  const rows = {};
  const dropped = new Map();          // IMF code -> why
  const noObservations = [];
  const renamedFrom = new Map();      // target ISO3 -> source IMF code, for the collision check
  const status = new Map();           // period -> Set of STATUS codes seen
  const kinds = new Map();            // period -> Set of estimateKind
  let maxObs = 0, obsCount = 0;

  for (const [key, ser] of Object.entries(series)) {
    const code = geo[+key.split(':')[0]];
    if (code === undefined) throw new Error(`${entry}: series key ${key} points past the COUNTRY dimension (${geo.length} values)`);

    // Trap (a): some series objects have no `observations` key at all. Observed 2026-09-20 on
    // CSK, GX126, TKM and YAR in both entries — a series that exists in the key space with
    // nothing behind it. Optional access and skip; iterating it unguarded throws.
    const obs = ser?.observations;
    if (!obs) { noObservations.push(code); continue; }

    // Mapped before the validity test, so a rename cannot be dropped as unknown.
    const iso = RENAME[code] ?? code;
    if (!/^[A-Z]{3}$/.test(iso)) { dropped.set(code, 'not three letters (aggregate or region)'); continue; }
    if (!valid.has(iso) && !Object.values(RENAME).includes(iso)) { dropped.set(code, 'three letters but absent from m49.json (dissolved state or territory aggregate)'); continue; }
    if (RENAME[code]) {
      if (rows[iso] || renamedFrom.has(iso)) throw new Error(`${entry}: renaming ${code} to ${iso} collides with a code already present — the rename table is wrong`);
      renamedFrom.set(iso, code);
    } else if (renamedFrom.has(iso)) {
      throw new Error(`${entry}: ${iso} arrived both directly and as a rename of ${renamedFrom.get(iso)}`);
    }

    // Series-level attributes start at index 0; observation arrays put OBS_VALUE at index 0 and
    // attributes from index 1. Reading the series offset on an observation array silently
    // returns the measure as though it were an attribute.
    attrOf(attrs.series, ser.attributes, 'SCALE', 0);   // called for its assertions only; see MAX_OBS_* above

    for (const [oi, cell] of Object.entries(obs)) {
      const period = times[+oi];
      if (period === undefined) throw new Error(`${entry}: ${code} carries observation index ${oi}, past the ${times.length} TIME_PERIOD values`);
      if (period < FIRST_PERIOD) continue;
      const raw = cell?.[0];
      // OBS_VALUE arrives as a STRING, not a number, so any arithmetic on it without Number()
      // concatenates. A null measure with attributes attached is legal SDMX and is not a zero.
      if (raw === null || raw === undefined) continue;
      const v = Number(raw);
      if (!Number.isFinite(v)) throw new Error(`${entry}: ${code} ${period} carries a non-finite OBS_VALUE ${JSON.stringify(raw)}`);

      const st = attrOf(attrs.observation, cell, 'STATUS', 1);
      if (st) (status.get(period) ?? status.set(period, new Set()).get(period)).add(st);
      const der = attrOf(attrs.observation, cell, 'DERIVATION_TYPE', 1);
      const kind = der === null ? 'reported' : DERIVATION_KIND[der];
      if (!kind) throw new Error(`${entry}: ${code} ${period} carries DERIVATION_TYPE "${der}", which is not in the mapping — decide whether it is reported or modelled before shipping it`);
      (kinds.get(period) ?? kinds.set(period, new Set()).get(period)).add(kind);

      // Whole US dollars. The smallest non-zero observation anywhere in either entry is 1,249.44
      // (MRT 2021-Q4 debit), so nothing here rounds a real value down to zero — the rounding
      // scar this repo already carries. The asserted floor below keeps that true if it changes.
      if (v !== 0 && Math.abs(v) < 1) throw new Error(`${entry}: ${code} ${period} = ${v} would round to zero, turning a value into an absence`);
      (rows[iso] ??= {})[period] = Math.round(v);
      obsCount++;
      if (Math.abs(v) > maxObs) maxObs = Math.abs(v);
    }
    if (rows[iso] && Object.keys(rows[iso]).length === 0) delete rows[iso];
  }

  // Positive tests that the filter bit, not a count. A count that drifts says something changed;
  // these say which thing, and they fail closed if the COUNTRY dimension is ever recoded.
  if (!dropped.size) throw new Error(`${entry}: not one code was dropped as an aggregate — the filter is not filtering, and Euro Area sits third in the debit ranking at 2026-Q1`);
  for (const agg of ['G163', 'GX126', 'CWX']) {
    if (rows[agg]) throw new Error(`${entry}: aggregate ${agg} survived the filter and would be drawn as a country`);
  }
  for (const c of ['MEX', 'IND', 'PHL', 'NGA']) {
    if (!rows[c]) throw new Error(`${entry}: ${c} was filtered out — the ISO3 test has inverted`);
  }
  if (maxObs < MAX_OBS_FLOOR || maxObs > MAX_OBS_CEILING) {
    throw new Error(`${entry}: largest observation is ${maxObs.toExponential(2)} USD, outside [${MAX_OBS_FLOOR.toExponential(0)}, ${MAX_OBS_CEILING.toExponential(0)}] — ` +
      `the payload is no longer in whole dollars. The SCALE attribute claims code 6 ("Millions") and has always been wrong; do not trust it to resolve this.`);
  }

  // A country whose every observation is exactly zero is not reporting zero, it is not reporting
  // this item — the zero is a placeholder. Observed 2026-09-20 in the shipped window: DNK on the
  // credit side, and DNK, HND, LSO and TUR on the debit side. Türkiye is the one that settles
  // it: 106 consecutive published zeros from 1998-Q1 to 2026-Q2 for money sent abroad by
  // resident households, which is a reporting convention and not a fact about Türkiye. Painting
  // those as the floor of a choropleth ships a falsehood, so they are dropped and named.
  // A country that has EVER reported a non-zero figure keeps its zeros, because there the zero
  // is a published value and deleting it would be the `value > 0` filter this repo has a scar
  // from — that is why the test is "never non-zero", not "zero in this period". (ISR, USA and
  // ZAF publish only zeros on the credit side too, but exclusively before 1990, so the window
  // trim removes them first and they never reach this test.)
  const allZero = [];
  for (const [iso, r] of Object.entries(rows)) {
    if (Object.values(r).every((v) => v === 0)) { allZero.push(iso); delete rows[iso]; }
  }

  return { rows, dropped, noObservations, allZero, status, kinds, obsCount, maxObs };
}

// ---------------------------------------------------------------- what to ship
const SPEC = {
  CD_T: {
    layerId: 'imf-personal-transfers-received',
    title: 'Personal transfers received',
    question: 'How much money did households here receive from abroad this quarter?',
    direction: 'received by resident households from non-resident households',
    proxy: 'a proxy for what this country\'s emigrants send home',
  },
  DB_T: {
    layerId: 'imf-personal-transfers-sent',
    title: 'Personal transfers sent',
    question: 'How much money did households here send abroad this quarter?',
    direction: 'sent by resident households to non-resident households',
    proxy: 'a proxy for what immigrants living here send out',
  },
};

export async function load({ log = () => {} } = {}) {
  const valid = await m49Iso3();
  const out = [];

  for (const entry of ['CD_T', 'DB_T']) {
    const spec = SPEC[entry];
    const payload = assertShape(entry, await cached(entry));
    const d = decode(entry, payload, valid);

    const counts = new Map();
    for (const r of Object.values(d.rows)) for (const p of Object.keys(r)) counts.set(p, (counts.get(p) ?? 0) + 1);
    const chosen = chooseNewest(entry, counts);

    // Drop everything after the accepted quarter rather than shipping it under an older
    // periodLabel. 2026-Q2 exists here with 21 reporters against a trailing median of 108; a
    // layer that carries a period it has just refused to stand behind invites the exact chart
    // rule 4 exists to prevent, because the UI cannot know the last point is one the adapter
    // rejected.
    const dropped = [...counts.keys()].sort().filter((p) => p > chosen.period);
    for (const iso of Object.keys(d.rows)) {
      for (const p of dropped) delete d.rows[iso][p];
      if (!Object.keys(d.rows[iso]).length) delete d.rows[iso];
    }
    const periods = [...counts.keys()].sort().filter((p) => p <= chosen.period);

    const statusAt = [...(d.status.get(chosen.period) ?? [])];
    const breaks = [...d.status].filter(([, s]) => s.has('B')).map(([p]) => p).sort();
    const kindsAt = d.kinds.get(chosen.period) ?? new Set(['reported']);
    // The weakest claim wins: one modelled country in the quarter makes the quarter modelled.
    const estimateKind = kindsAt.has('modelled') ? 'modelled' : 'reported';

    const zerosAt = Object.entries(d.rows).filter(([, r]) => r[chosen.period] === 0).map(([iso]) => iso).sort();
    const entitiesAt = Object.values(d.rows).filter((r) => r[chosen.period] != null).length;

    out.push({
      id: spec.layerId,
      title: spec.title,
      question: spec.question,
      unit: 'current US$',
      entity: 'country',
      rows: d.rows,
      periods,
      vintage: {
        // A flow over a quarter, not a stock at an instant: contract rule 9, so periodEnd is the
        // last day the quarter covers rather than the day the IMF released it.
        periodEnd: `${chosen.period.slice(0, 4)}-${['03-31', '06-30', '09-30', '12-31'][+chosen.period.slice(-1) - 1]}`,
        periodLabel: chosen.period,
        cadence: 'quarterly',
        coverage: [periods[0], chosen.period],
        estimateKind,
        provisional: statusAt.some((s) => NOT_FINAL.has(s)),
        ...(breaks.length ? { breaks } : {}),
        reporters: { n: chosen.n, expected: chosen.expected },
        producer: 'International Monetary Fund',
        licenceId: 'LicenseRef-IMF-Data',
        commercialUseClear: false,
      },
      note: note(spec, chosen, zerosAt, d),
    });

    log({ entry, spec, chosen, counts, dropped, decoded: d, statusAt, estimateKind, zerosAt, entitiesAt, periods });
  }

  return { layers: out };
}

// Every figure in this sentence that describes THIS layer is recomputed from the response on
// every run, because a figure written into a sentence goes stale while the sentence goes on
// being quoted.
//
// The R1_S1W comparison that closes it is the one exception, and it is the reason this comment
// is longer than it was. Those ratios come from a SECOND query (*.CD_T.R1_S1W.USD.Q) that this
// adapter deliberately does not make, so they cannot be recomputed here. They were interpolated
// with `at ${chosen.period}`, which read correctly only because the run that wrote them and the
// run that reads them were the same quarter: the moment the accepted quarter advances, that
// sentence asserts, in text a reader is told to trust before quoting a number, a measurement at
// a quarter nobody took. The quarter is therefore pinned to the one it was measured at and the
// sentence says so. Re-measured 2026-09-20: 4 countries publish both at 2026-Q1 — GEO 1.168x,
// PHL 1.249x, MDA 1.881x, BLR 3.155x.
function note(spec, chosen, zerosAt, d) {
  return `Personal transfers — "current transfers between resident and nonresident households" in the IMF's own words — ${spec.direction}, in current US dollars, ${spec.proxy}. ` +
    `It is money, not people, and it is NOT BILATERAL: this dataflow has no counterpart-country dimension, so nothing here says where the money came from or went, and pairing one country's figure with another's invents the corridor. ` +
    `${chosen.period} is an incomplete quarter by construction — ${chosen.n} countries have reported against a trailing median of ${chosen.expected}, because BOP coverage keeps accumulating for years after a reference period. A country missing here has not reported yet; it has not reported zero. ` +
    `${zerosAt.length ? `${zerosAt.length} ${zerosAt.length === 1 ? 'country publishes' : 'countries publish'} an exact zero at ${chosen.period} (${zerosAt.join(', ')}). That is a published value rather than an absence, and against a non-zero previous quarter it is the commonest way a first release reads as a collapse — check the quarter before it and the same country's next revision before quoting it. ` : ''}` +
    `${d.allZero.length ? `${d.allZero.join(', ')} ${d.allZero.length === 1 ? 'is' : 'are'} dropped rather than drawn: ${d.allZero.length === 1 ? 'it has never published' : 'they have never published'} a non-zero figure in any quarter ${d.allZero.length === 1 ? 'it files' : 'they file'} inside this layer's window. Such a series can stop decades before the window does (DNK's ends in 1993), so that is "never non-zero wherever it reports", not "filed a zero for every quarter this layer covers". A zero filed quarter after quarter is a reporting convention, not a measurement. ` : ''}` +
    `Current dollars are not deflated and not exchange-rate adjusted, so a rise can be prices or a currency move. ` +
    `It is narrower than "remittances": the IMF's own personal remittances item (R1_S1W) adds compensation of employees, and at 2026-Q1 it ran between 1.17 and 3.16 times this one across the four countries that published both. That ratio is a one-off measurement taken on 2026-09-20, not a figure this layer recomputes, so read it as the order of magnitude of what personal transfers leaves out rather than as a current number. Only four countries publish R1_S1W at all, which is why it cannot be shipped instead.`;
}

// ---------------------------------------------------------------- standalone report
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seen = [];
  const { layers } = await load({ log: (x) => seen.push(x) });

  for (const l of layers) {
    const s = seen.find((x) => x.spec.layerId === l.id);
    const v = l.vintage;
    const tail = [...s.counts.keys()].sort().slice(-8).map((p) => `${p}:${s.counts.get(p)}`).join(' ');
    const top = Object.entries(l.rows)
      .filter(([, r]) => r[v.periodLabel] != null)
      .sort((a, b) => b[1][v.periodLabel] - a[1][v.periodLabel])
      .slice(0, 6).map(([iso, r]) => `${iso}=${r[v.periodLabel].toLocaleString('en')}`);
    console.log(
      `${l.id.padEnd(34)} ${s.entry.padEnd(5)} ${v.periodLabel}  ${s.entitiesAt}/${v.reporters.expected} reporters (ratio ${s.chosen.ratio.toFixed(3)}${s.chosen.steppedBack ? `, stepped back ${s.chosen.steppedBack}` : ''})  ` +
      `${l.periods.length}p ${l.periods[0]}..${l.periods.at(-1)}  ${v.cadence} ${v.estimateKind}${v.provisional ? ' provisional' : ''}\n` +
      `${' '.repeat(4)}periodEnd ${v.periodEnd}  entities ${Object.keys(l.rows).length}  observations ${s.decoded.obsCount}  max ${s.decoded.maxObs.toExponential(3)} USD  STATUS at ${v.periodLabel}: ${s.statusAt.length ? s.statusAt.join(',') : '(none flagged)'}\n` +
      `${' '.repeat(4)}tail ${tail}${s.dropped.length ? `  | DROPPED as a leading edge: ${s.dropped.map((p) => `${p}:${s.counts.get(p)}`).join(' ')}` : ''}\n` +
      `${' '.repeat(4)}top ${top.join(' ')}\n` +
      `${' '.repeat(4)}zeros at ${v.periodLabel}: ${s.zerosAt.join(',') || '(none)'}   all-zero series dropped: ${s.decoded.allZero.join(',') || '(none)'}\n` +
      `${' '.repeat(4)}no observations key: ${s.decoded.noObservations.join(',') || '(none)'}\n` +
      `${' '.repeat(4)}non-country codes dropped: ${[...s.decoded.dropped.keys()].join(',')}`);
  }

  const [cd, db] = layers;
  const p = cd.vintage.periodLabel;
  const both = Object.keys(cd.rows).filter((iso) => cd.rows[iso][p] != null && db.rows[iso]?.[p] != null);
  const sum = (l) => Object.values(l.rows).reduce((a, r) => a + (r[p] ?? 0), 0);
  console.log(`\nboth directions at ${p}: ${both.length} countries carry credit and debit, world credit ${(sum(cd) / 1e9).toFixed(1)}bn USD against world debit ${(sum(db) / 1e9).toFixed(1)}bn`);
  console.log(`net senders at ${p}: ${both.filter((i) => db.rows[i][p] > cd.rows[i][p]).length}; net receivers: ${both.filter((i) => cd.rows[i][p] > db.rows[i][p]).length}`);
  console.log(`\nlicence ${meta.licenceId}, commercial reuse clear: ${meta.commercialUseClear} — imf.org/en/_site_imf/about/copyright-and-terms, read 2026-09-20; raw cached under ${CACHE}/`);
}
