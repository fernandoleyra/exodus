// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Immigration, Refugees and Citizenship Canada — permanent-resident ADMISSIONS and ASYLUM
// CLAIMS, both monthly by country of citizenship, both from IRCC's own open-data drops.
//
// Everything asserted, printed or written below was read off a live response on 2026-09-20.
//
// ---------------------------------------------------------------------------------------
// WHAT THESE NUMBERS ARE, AND WHY THEY DO NOT LINE UP WITH THE EUROPEAN LAYERS
// ---------------------------------------------------------------------------------------
// Every other country layer in this app is a population register: somebody moved, and a
// municipality wrote it down. These two are neither.
//
// A PR *admission* is the moment a person's legal status changes to permanent resident. It
// is an administrative event with a date, not a border crossing and not a registration of
// residence. A large share of Canadian admissions are people who were already living in
// Canada on a study or work permit and who never move an inch on the day they are admitted,
// and a person landing from abroad appears here on the day status is granted, not the day
// they arrive. So `nl-immigration-by-origin` and `ca-pr-admissions` are not two measurements
// of one quantity, and the difference between them is not a story about Canada and the
// Netherlands. The layer notes say this because the chip alone cannot.
//
// An asylum *claim* is likewise an event: a claim received in a month, counted where it was
// received.
//
// Both axes are COUNTRY OF CITIZENSHIP, which is an attribute of the person, not of the
// journey. That is the same reason cbs-netherlands.mjs ships no corridor layer, and it is
// why neither of these is keyed 'XXX>CAN'. IRCC's own July 2026 asylum table has the United
// States at rank 11 with 40 claims in Ontario alone; nothing in the file says those people
// travelled from the United States, only that they hold its passport. A corridor layer here
// would be an assertion the data does not make.
//
// ---------------------------------------------------------------------------------------
// LICENCE — Open Government Licence – Canada 2.0, dataset-scoped, commercial use granted
// ---------------------------------------------------------------------------------------
// Read at https://open.canada.ca/en/open-government-licence-canada on 2026-09-20. The
// operative grant, verbatim:
//
//   "The Information Provider grants you a worldwide, royalty-free, perpetual, non-exclusive
//    licence to use the Information, including for commercial purposes, subject to the terms
//    below."
//
//   "You are free to: Copy, modify, publish, translate, adapt, distribute or otherwise use
//    the Information in any medium, mode or format for any lawful purpose."
//
// The same page states "This is version 2.0 of the Open Government Licence – Canada", which
// is why licenceId is the SPDX identifier OGL-Canada-2.0 (present and not deprecated in SPDX
// license list 3.29.0, checked against the published licenses.json on 2026-09-20) rather
// than a LicenseRef. Commercial reuse is named in the grant itself, so commercialUseClear is
// true. The required attribution, where the Information Provider specifies none of its own,
// is verbatim: "Contains information licensed under the Open Government Licence – Canada."
//
// The trap this repository has been burned by twice is a website-content licence being
// mistaken for a data licence, so the binding is taken DATASET-scoped and machine-readably,
// not from any terms page:
//
//   open.canada.ca CKAN package f7e5498e-0ad8-4417-85c9-9b8aff9b9eda ("Permanent Residents
//   – Monthly IRCC Updates") and package b6cbcf4d-f763-4924-a2fb-8cc4a06e3de4 ("Asylum
//   Claimants – Monthly IRCC Updates") both declare license_id "ca-ogl-lgo", license_url
//   "https://open.canada.ca/en/open-government-licence-canada", and each carries the exact
//   download URL used below as one of its resources (resource ids
//   d1c1f4f3-2d7f-4e02-9a79-7af98209c2f3 and 8ef52537-1ff2-4701-98f0-66ff0d0b7042).
//
// Both records also carry "isopen": false. That is the same CKAN registry artefact already
// documented in cbs-netherlands.mjs — CKAN sets isopen only for licences in its own internal
// register, and a departmental licence id never is. It is noted here rather than hidden.
//
// One caveat that is NOT a licence question but reads like one: the CKAN resource title for
// the asylum CSV literally begins "[rounded numbers - not for calculations]". That is the
// producer telling you the cells are rounded to 5 and should not be summed. This adapter
// sums them anyway, on purpose, to get a national figure — and says so in the layer note,
// with the size of the resulting slack computed rather than asserted.
//
// ---------------------------------------------------------------------------------------
// THE TWO PARSER TRAPS, BOTH OF WHICH PRODUCE SILENT GARBAGE RATHER THAN AN ERROR
// ---------------------------------------------------------------------------------------
//  1. EN_ODP-PR-Citz.xlsx has NO xl/sharedStrings.xml. Its zip holds exactly eight entries
//     and that is not one of them. Every cell in the sheet, the counts included, is an
//     inline <is><t> string: the sheet contains 43,845 <is> elements and ZERO <v> elements.
//     A reader that looks for <v> — which is what every hand-rolled xlsx parser does first —
//     comes back with an empty sheet and no error at all. `readSheet` below therefore counts
//     what it read and refuses to continue if the count collapses, and `load` refuses
//     outright if a sharedStrings part ever appears, because that would mean the file format
//     changed under a parser written for the old one.
//  2. ODP-Asylum-Top25CitzProv-LastMonth.csv is TAB-separated despite the .csv extension,
//     and it is valid UTF-8. The research note this adapter was written from said to decode
//     it as latin-1; that instruction is exactly backwards and following it would have put
//     mojibake through every French column and every accented country name. Verified on the
//     live bytes: a strict (fatal) UTF-8 decoder accepts all 1,176,882 of them, and the É in
//     the header field FR_ANNEÉ is the two-byte sequence C3 89 at offsets 35-36. Commas are
//     not separators here — they sit inside country names like "Cameroon, Federal Republic
//     of" — so a comma split does not fail, it silently shreds the row.
//
// ---------------------------------------------------------------------------------------
// THE QUARTER-TOTAL TRAP IN THE WORKBOOK
// ---------------------------------------------------------------------------------------
// The sheet interleaves months with totals, on TWO header rows rather than one, and the
// difference matters to how much the guard below actually covers. Row 5 carries the 139
// month abbreviations and the 47 "Qn Total" columns. The twelve year totals are not on row 5
// at all: "2015 Total" .. "2026 Total" sit in row 4 (columns R, AI, AZ, BQ, CH, CY, DP, EG,
// EX, FO, GF, GQ) with row 5 left blank, so they are skipped for having no month header and
// are never seen by the end-in-"Total" assertion. That is safe — they stay out of the layer —
// but the assertion's reach is row 5 only, and anything new arriving with a blank row-5 cell
// would be dropped silently. What catches a month going missing that way is the contiguity
// check and the A1 title span, not this one.
//
// The year currently in progress carries a "Q3 Total" column that holds July alone, identical
// to the July column for all 217 label rows, because Q3 has one month of data in it. Publishing
// that as a quarter would put a one-month figure on a quarterly chip. Nothing is filtered by
// position: only columns whose month-header cell is one of the twelve month abbreviations
// survive, and every discarded non-empty header is asserted to end in "Total" so that a new
// kind of column cannot slip through unnoticed.
//
// ---------------------------------------------------------------------------------------
// SUPPRESSION: '--' AND 0 ARE DIFFERENT ANSWERS, AND THE WORKBOOK'S OWN NOTE IS WRONG
// ---------------------------------------------------------------------------------------
// The note row of the workbook says, verbatim: "Please note that all values between 0 and 5
// are shown as “--”." The data contradicts it. In the July 2026 column there are 28 '--'
// cells and 46 literal '0' cells. If 0 were always shown as '--' there would be none of the
// latter. So a literal 0 is a real observed zero (IRCC admitted nobody of that citizenship
// that month) and '--' is a suppressed count somewhere in 1-5. They are kept and dropped
// respectively: a suppressed cell is absent, never zero, which is the same rule the app
// already applies in space.
//
// ---------------------------------------------------------------------------------------
// CACHING AND FRESHNESS — why there is no conditional GET here
// ---------------------------------------------------------------------------------------
// ircc.canada.ca sits behind a BIG-IP pool whose members disagree about the file's metadata.
// Four HEAD requests to EN_ODP-PR-Citz.xlsx one second apart returned, alternating,
// Last-Modified 11:30:32 with ETag "b53d279e545dd1:0" and Last-Modified 11:31:09 with ETag
// "f7a61fb4545dd1:0" — same 204,764-byte body both times. So neither header is a cache key,
// neither is a freshness signal, and an If-None-Match would thrash forever. The two files
// together are 1.35 MB, so this adapter simply downloads them every run and writes the bytes
// under .cache/layers/ as a record of what was parsed; the cache is read only when the
// network fails. Every vintage figure below comes from inside the files instead.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

export const meta = {
  id: 'ircc-canada',
  producer: 'Immigration, Refugees and Citizenship Canada (IRCC)',
  licenceId: 'OGL-Canada-2.0',
  commercialUseClear: true,
};

const CACHE = '.cache/layers/ircc-canada';

const PR_URL = 'https://www.ircc.canada.ca/opendata-donneesouvertes/data/EN_ODP-PR-Citz.xlsx';
const ASYLUM_URL = 'https://www.ircc.canada.ca/opendata-donneesouvertes/data/ODP-Asylum-Top25CitzProv-LastMonth.csv';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthIndex = (s) => MONTH_ABBR.indexOf(s) + 1;

// ------------------------------------------------------------------ network

/** Downloads, records the bytes under .cache/layers/, and falls back to that record only if
 *  the network is unavailable — see the freshness note above for why this is not cache-first
 *  the way cbs-netherlands.mjs is. A short body is treated as a failure because a WAF or an
 *  IIS error page answers 200 just as happily as the file does. */
async function grab(url, name, minBytes) {
  const file = `${CACHE}/${name}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < minBytes) throw new Error(`${buf.length} bytes, expected at least ${minBytes} — a block page or an error page also answers 200`);
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, buf);
    return buf;
  } catch (e) {
    try {
      const buf = await readFile(file);
      console.warn(`ircc: ${url} unreachable (${e.message}); falling back to the cached copy at ${file}`);
      return buf;
    } catch {
      throw new Error(`${url}: ${e.message}, and no cached copy at ${file}`);
    }
  }
}

// ------------------------------------------------------------------ xlsx

/**
 * Just enough of the ZIP container to read an xlsx, on node's own zlib.
 *
 * Deliberately not a library: package.json declares no zip dependency, and rule 10 of the
 * contract is that the snapshot rebuilds from a clean clone. jszip happens to be present in
 * node_modules as somebody else's transitive dependency, which is not the same as being
 * available.
 */
function unzip(buf) {
  let eocd = -1;
  // Scan back for the end-of-central-directory signature rather than assuming the 22-byte
  // minimum: a zip comment, which this file does not have today, would shift it.
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('no ZIP end-of-central-directory record: the download is not an xlsx');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`ZIP central directory entry ${i} has a bad signature`);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (buf.readUInt32LE(lho) !== 0x04034b50) throw new Error(`ZIP local header for ${name} has a bad signature`);
    // The local header's own name/extra lengths are authoritative; the central directory's
    // extra field is a different field of a different length and using it lands mid-stream.
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(start, start + csize);
    if (method === 8) out.set(name, inflateRawSync(raw));
    else if (method === 0) out.set(name, Buffer.from(raw));
    else throw new Error(`ZIP entry ${name} uses compression method ${method}, which this reader does not implement`);
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

const XML_ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
/** The country labels carry &apos; ("China, People&apos;s Republic of"). Leaving it encoded
 *  turns the lookup key into a string no table will ever match, and the miss is silent. */
const unescapeXml = (s) => s.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|(amp|lt|gt|quot|apos));/g,
  (_, dec, hex, name) => dec ? String.fromCodePoint(+dec) : hex ? String.fromCodePoint(parseInt(hex, 16)) : XML_ENTITY[name]);

const colNum = (letters) => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

const ROW_RE = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
const CELL_RE = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
const TEXT_RE = /<t\b[^>]*>([\s\S]*?)<\/t>/;
const REF_RE = /\br="([A-Z]+)(\d+)"/;

/**
 * Reads the sheet into rowNumber -> Map(columnLetters -> text), and counts what it read.
 *
 * The count is the whole point. This workbook stores its numbers as inline strings, so a
 * parser aimed at <v> returns an empty sheet on a perfectly healthy file. An empty sheet
 * downstream looks like "no countries matched" rather than like a broken reader, and that is
 * how a wrong number gets shipped. The caller asserts against `inlineCells`.
 */
function readSheet(xml) {
  const rows = new Map();
  let inlineCells = 0;
  ROW_RE.lastIndex = 0;
  for (let m; (m = ROW_RE.exec(xml));) {
    const cells = new Map();
    const body = m[2];
    CELL_RE.lastIndex = 0;
    for (let c; (c = CELL_RE.exec(body));) {
      const ref = REF_RE.exec(c[1]);
      if (!ref) continue;
      const inner = c[2] ?? '';
      const t = TEXT_RE.exec(inner);
      if (t) { cells.set(ref[1], unescapeXml(t[1])); inlineCells++; }
      else cells.set(ref[1], null);
    }
    rows.set(+m[1], cells);
  }
  return { rows, inlineCells, valueElements: (xml.match(/<v>/g) ?? []).length };
}

/** IRCC's three kinds of cell, kept apart on purpose. '--' is a count of 1-5 withheld and is
 *  NOT zero; a literal 0 in the same column is a real zero; anything else is a label. */
function cellValue(raw) {
  if (raw == null) return { kind: 'empty' };
  const s = raw.trim();
  if (s === '') return { kind: 'empty' };
  if (s === '--') return { kind: 'suppressed' };
  if (!/^\d{1,3}(,\d{3})*$|^\d+$/.test(s)) return { kind: 'text', text: s };
  return { kind: 'number', n: Number(s.replace(/,/g, '')) };
}

// ------------------------------------------------------------------ nomenclature

/**
 * IRCC's citizenship nomenclature to ISO-3166-1 alpha-3.
 *
 * Hand-built because IRCC publishes no code column at all — the country is a display string
 * in its own house spelling ("Bahama Islands, The", "Ivory Coast, Republic of", "Surinam"),
 * and there is nothing to join on. Every one of the 217 labels below was read off the live
 * sheet this session, and every alpha-3 is checked against scripts/m49.json at load time so
 * that a typo cannot survive into a layer that would then paint the wrong country.
 *
 * Two labels are folded into a parent state because they have no alpha-3 of their own:
 * "Azores" into PRT and "Nevis" into KNA (IRCC lists "St. Kitts-Nevis" separately as well).
 * Neither child row ever carries a count: across the 139 months both hold only '0' or '--'.
 * That is NOT the same as the fold being harmless, and reading it as though it were is how
 * this adapter shipped a wrong headline figure once already. The parent can be withheld in a
 * month where the child reads a literal 0, and 0 + unknown was being emitted as 0: in 77 of
 * the 139 months "St. Kitts-Nevis" is '--' while "Nevis" is '0', so KNA was published as a
 * real observed zero — including in 2026-07 — when what IRCC actually says is "somewhere in
 * 1-5". FOLDED_ISO3 below exists to stop that; see `partlyWithheld` in loadPrAdmissions.
 */
const NAME_TO_ISO3 = {
  'Afghanistan': 'AFG', 'Albania': 'ALB', 'Algeria': 'DZA', 'Andorra': 'AND', 'Angola': 'AGO',
  'Antigua and Barbuda': 'ATG', 'Argentina': 'ARG', 'Armenia': 'ARM', 'Australia': 'AUS',
  'Austria': 'AUT', 'Azerbaijan': 'AZE', 'Azores': 'PRT', 'Bahama Islands, The': 'BHS',
  'Bahrain': 'BHR', 'Bangladesh': 'BGD', 'Barbados': 'BRB', 'Belarus': 'BLR', 'Belgium': 'BEL',
  'Belize': 'BLZ', 'Benin, Republic of': 'BEN', 'Bermuda': 'BMU', 'Bhutan': 'BTN',
  'Bolivia': 'BOL', 'Bosnia-Herzegovina': 'BIH', 'Botswana, Republic of': 'BWA',
  'Brazil': 'BRA', 'Brunei': 'BRN', 'Bulgaria': 'BGR', 'Burkina-Faso': 'BFA', 'Burundi': 'BDI',
  'Cambodia': 'KHM', 'Cameroon, Federal Republic of': 'CMR', 'Cape Verde Islands': 'CPV',
  'Central African Republic': 'CAF', 'Chad, Republic of': 'TCD', 'Chile': 'CHL',
  "China, People's Republic of": 'CHN', 'Colombia': 'COL', 'Comoros': 'COM',
  'Congo, Democratic Republic of the': 'COD', "Congo, People's Republic of the": 'COG',
  'Costa Rica': 'CRI', 'Croatia': 'HRV', 'Cuba': 'CUB', 'Curacao': 'CUW', 'Cyprus': 'CYP',
  'Czech Republic': 'CZE', 'Denmark': 'DNK', 'Djibouti, Republic of': 'DJI', 'Dominica': 'DMA',
  'Dominican Republic': 'DOM', 'East Timor, Democratic Republic of': 'TLS', 'Ecuador': 'ECU',
  'Egypt': 'EGY', 'El Salvador': 'SLV', 'Equatorial Guinea, Republic of': 'GNQ',
  'Eritrea': 'ERI', 'Estonia': 'EST', 'Ethiopia': 'ETH', 'Fiji': 'FJI', 'Finland': 'FIN',
  'France': 'FRA', 'French Polynesia': 'PYF', 'Gabon Republic': 'GAB', 'Gambia': 'GMB',
  'Georgia': 'GEO', 'Germany': 'DEU', 'Ghana': 'GHA', 'Greece': 'GRC', 'Grenada': 'GRD',
  'Guadeloupe': 'GLP', 'Guatemala': 'GTM', 'Guinea, Republic of': 'GIN', 'Guinea-Bissau': 'GNB',
  'Guyana': 'GUY', 'Haiti': 'HTI', 'Holy See': 'VAT', 'Honduras': 'HND', 'Hong Kong SAR': 'HKG',
  'Hungary': 'HUN', 'Iceland': 'ISL', 'India': 'IND', 'Indonesia, Republic of': 'IDN',
  'Iran': 'IRN', 'Iraq': 'IRQ', 'Ireland, Republic of': 'IRL', 'Israel': 'ISR', 'Italy': 'ITA',
  'Ivory Coast, Republic of': 'CIV', 'Jamaica': 'JAM', 'Japan': 'JPN', 'Jordan': 'JOR',
  'Kazakhstan': 'KAZ', 'Kenya': 'KEN', 'Kiribati': 'KIR',
  "Korea, People's Democratic Republic of": 'PRK', 'Korea, Republic of': 'KOR',
  'Kosovo, Republic of': 'XKX', 'Kuwait': 'KWT', 'Kyrgyzstan': 'KGZ', 'Laos': 'LAO',
  'Latvia': 'LVA', 'Lebanon': 'LBN', 'Lesotho': 'LSO', 'Liberia': 'LBR', 'Libya': 'LBY',
  'Liechtenstein': 'LIE', 'Lithuania': 'LTU', 'Luxembourg': 'LUX', 'Macau SAR': 'MAC',
  'Macedonia': 'MKD', 'Madagascar': 'MDG', 'Malawi': 'MWI', 'Malaysia': 'MYS',
  'Maldives, Republic of': 'MDV', 'Mali, Republic of': 'MLI', 'Malta': 'MLT',
  'Marshall Islands, Republic of the': 'MHL', 'Mauritania': 'MRT', 'Mauritius': 'MUS',
  'Mexico': 'MEX', 'Micronesia, Federated States of': 'FSM', 'Moldova': 'MDA', 'Monaco': 'MCO',
  "Mongolia, People's Republic of": 'MNG', 'Montenegro, Republic of': 'MNE', 'Morocco': 'MAR',
  'Mozambique': 'MOZ', 'Myanmar (Burma)': 'MMR', 'Namibia': 'NAM', 'Nauru': 'NRU',
  'Nepal': 'NPL', 'Netherlands, The': 'NLD', 'Nevis': 'KNA', 'New Caledonia': 'NCL',
  'New Zealand': 'NZL', 'Nicaragua': 'NIC', 'Niger, Republic of the': 'NER', 'Nigeria': 'NGA',
  'Northern Mariana Islands, Commonwealth of the': 'MNP', 'Norway': 'NOR', 'Oman': 'OMN',
  'Pakistan': 'PAK', 'Palau, Republic of': 'PLW',
  'Palestinian Authority (Gaza/West Bank)': 'PSE', 'Panama, Republic of': 'PAN',
  'Papua New Guinea': 'PNG', 'Paraguay': 'PRY', 'Peru': 'PER', 'Philippines': 'PHL',
  'Poland': 'POL', 'Portugal': 'PRT', 'Puerto Rico': 'PRI', 'Qatar': 'QAT', 'Reunion': 'REU',
  'Romania': 'ROU', 'Russia': 'RUS', 'Rwanda': 'RWA', 'Samoa, American': 'ASM',
  'Samoa, Independent State of': 'WSM', 'San Marino': 'SMR', 'Sao Tome and Principe': 'STP',
  'Saudi Arabia': 'SAU', 'Senegal': 'SEN', 'Serbia, Republic of': 'SRB', 'Seychelles': 'SYC',
  'Sierra Leone': 'SLE', 'Singapore': 'SGP', 'Sint-Maarten': 'SXM', 'Slovak Republic': 'SVK',
  'Slovenia': 'SVN', 'Solomon Islands': 'SLB', 'Somalia, Democratic Republic of': 'SOM',
  'South Africa, Republic of': 'ZAF', 'South Sudan, Republic of': 'SSD', 'Spain': 'ESP',
  'Sri Lanka': 'LKA', 'St. Kitts-Nevis': 'KNA', 'St. Lucia': 'LCA',
  'St. Vincent and the Grenadines': 'VCT', 'Sudan, Democratic Republic of': 'SDN',
  'Surinam': 'SUR', 'Swaziland': 'SWZ', 'Sweden': 'SWE', 'Switzerland': 'CHE', 'Syria': 'SYR',
  'Taiwan': 'TWN', 'Tajikistan': 'TJK', 'Tanzania, United Republic of': 'TZA',
  'Thailand': 'THA', 'Togo, Republic of': 'TGO', 'Tonga': 'TON',
  'Trinidad and Tobago, Republic of': 'TTO', 'Tunisia': 'TUN', 'Turkey': 'TUR',
  'Turkmenistan': 'TKM', 'Turks and Caicos Islands': 'TCA', 'Tuvalu': 'TUV', 'Uganda': 'UGA',
  'Ukraine': 'UKR', 'United Arab Emirates': 'ARE',
  'United Kingdom and Overseas Territories': 'GBR', 'United States of America': 'USA',
  'Uruguay': 'URY', 'Uzbekistan': 'UZB', 'Vanuatu': 'VUT', 'Venezuela': 'VEN',
  'Vietnam': 'VNM', 'Virgin Islands, British': 'VGB', 'Western Sahara': 'ESH', 'Yemen': 'YEM',
  'Zambia': 'ZMB', 'Zimbabwe': 'ZWE',
};

/** The alpha-3s that more than one IRCC label feeds, derived rather than listed so that a
 *  new sub-national label cannot be added above without this following it. A folded cell is
 *  a sum, and a sum is only as observed as its least observed term, so these keys cannot use
 *  the plain "skip the '--', keep what is left" rule the single-label countries use. */
const FOLDED_ISO3 = new Set(Object.values(NAME_TO_ISO3).filter((a, i, all) => all.indexOf(a) !== i));

/**
 * Labels that are not places, with the reason each one is dropped rather than mapped.
 *
 * The deny-list is enumerated rather than inferred because these are the rows that turn a
 * country layer into a wrong one. 'Stateless' is the dangerous member: it is not small
 * (13,845 admissions over the 139 months, 250 of them in July 2026 alone), it has no
 * citizenship to key on, and folding it into any country would invent a nationality for
 * people whose whole legal situation is that they have none.
 */
const NOT_A_PLACE = {
  'Other': 'residual bucket for citizenships too small to name',
  'Stateless': 'no citizenship to key on; inventing one would be a fabrication',
  'Country not stated': 'missing value, not a place',
  'Netherlands Antilles, The': 'dissolved in 2010; ISO 3166-1 withdrew ANT and its successors (CUW, SXM) are separate rows in this same sheet',
  'Other Countries': 'the asylum file’s residual for everything outside the newest month’s top 25',
  'Total': 'the sheet’s own margin, used for reconciliation and never emitted',
};

/** Checked against the UN M49 table the repo already ships, for the same reason _iso3.mjs
 *  does it: a mistyped alpha-3 produces a layer that validates and paints nothing, or worse,
 *  paints the wrong country. XKX is exempt because Kosovo has no M49 entry to be in. */
async function assertIso3Table() {
  const m49 = JSON.parse(await readFile(new URL('../m49.json', import.meta.url), 'utf8'));
  const valid = new Set(Object.values(m49));
  const bad = [...new Set(Object.values(NAME_TO_ISO3))].filter((a3) => a3 !== 'XKX' && !valid.has(a3));
  if (bad.length) throw new Error(`NAME_TO_ISO3 contains ${bad.length} alpha-3 code(s) absent from scripts/m49.json: ${bad.join(', ')}`);
}

/** Every label must be a decided case. An unknown one throws instead of being skipped,
 *  because a silently skipped label is a country that vanishes off the globe without anyone
 *  being told, and IRCC's nomenclature does change (Swaziland and Macedonia are still in it). */
function resolve(label, where) {
  if (Object.hasOwn(NAME_TO_ISO3, label)) return NAME_TO_ISO3[label];
  if (Object.hasOwn(NOT_A_PLACE, label)) return null;
  throw new Error(`${where}: citizenship label ${JSON.stringify(label)} is in neither NAME_TO_ISO3 nor NOT_A_PLACE — IRCC has changed its nomenclature and the table needs a human`);
}

// ------------------------------------------------------------------ shared vintage helpers

const lastDayOf = (period) => {
  const [y, m] = period.split('-').map(Number);
  return `${period}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * Contract rule 4, applied to a file rather than to a codelist.
 *
 * These sheets do not have Eurostat's "last N periods of the codelist" problem — the newest
 * column is the newest month by construction — but they can still be published with a thin
 * final month, and a thin month charts as a collapse. So the newest period's live reporter
 * count is measured against the median of the twelve before it and the period is stepped back
 * if it is under 70% of that. The threshold has to tolerate genuine seasonality: Canadian PR
 * admissions run 24,025 in November 2025 against 40,335 in July 2026, and a count-of-countries
 * measure moves far less than the totals do, which is why it is the count and not the sum.
 */
function chooseNewest(periods, countsByPeriod) {
  for (let i = periods.length - 1; i >= 1; i--) {
    const p = periods[i];
    const trailing = periods.slice(Math.max(0, i - 12), i).map((q) => countsByPeriod.get(q) ?? 0);
    const expected = Math.round(median(trailing));
    const n = countsByPeriod.get(p) ?? 0;
    if (n >= expected * 0.7) return { period: p, n, expected, steppedBack: periods.length - 1 - i };
    console.warn(`ircc: ${p} has ${n} reporters against a trailing median of ${expected}; stepping back a month`);
  }
  const p = periods[0];
  return { period: p, n: countsByPeriod.get(p) ?? 0, expected: countsByPeriod.get(p) ?? 0, steppedBack: periods.length - 1 };
}

// ------------------------------------------------------------------ layer 1: PR admissions

async function loadPrAdmissions() {
  const zip = unzip(await grab(PR_URL, 'EN_ODP-PR-Citz.xlsx', 100_000));

  // Trap 1, made fatal. If this part ever appears, the workbook has moved to shared strings
  // and every cell read below would come back null with no error of its own.
  if (zip.has('xl/sharedStrings.xml')) {
    throw new Error('EN_ODP-PR-Citz.xlsx now has xl/sharedStrings.xml; this reader only handles the inline-string form and must be updated before it is trusted');
  }
  const sheetXml = zip.get('xl/worksheets/sheet1.xml');
  if (!sheetXml) throw new Error(`xl/worksheets/sheet1.xml missing; zip holds ${[...zip.keys()].join(', ')}`);

  const { rows, inlineCells, valueElements } = readSheet(sheetXml.toString('utf8'));
  // Observed 2026-09-20: 43,845 inline cells and 0 <v> elements. The floor is well under
  // that so a month of growth does not trip it, but far above what a <v>-reading parser
  // would produce, which is nothing at all.
  if (inlineCells < 40_000) {
    throw new Error(`read only ${inlineCells} inline <is><t> cells (${valueElements} <v> elements): this workbook stores every value, counts included, as an inline string, so a low count means the reader is looking in the wrong place rather than that the file is small`);
  }

  const yearRow = rows.get(3), quarterRow = rows.get(4), monthRow = rows.get(5);
  if (!yearRow || !quarterRow || !monthRow) throw new Error('header rows 3/4/5 missing');
  if (rows.get(3)?.get('A') !== 'Country of Citizenship') {
    throw new Error(`A3 is ${JSON.stringify(rows.get(3)?.get('A'))}, expected 'Country of Citizenship' — the layout has moved`);
  }

  // The year band is a merged cell, so only its first column carries the text; carrying it
  // forward in column order is what gives each month its year. Position is never assumed:
  // a column survives only if its own row-5 label is a month abbreviation.
  const cols = [...monthRow.keys()].sort((a, b) => colNum(a) - colNum(b));
  const monthCols = [];
  const discarded = [];
  let year = null;
  for (const c of cols) {
    const y = yearRow.get(c);
    if (y && /^\d{4}$/.test(y.trim())) year = y.trim();
    const label = monthRow.get(c)?.trim() ?? '';
    if (MONTH_ABBR.includes(label)) {
      if (!year) throw new Error(`column ${c} carries month ${label} with no year band above it`);
      monthCols.push({ col: c, period: `${year}-${String(monthIndex(label)).padStart(2, '0')}` });
    } else if (label) {
      discarded.push({ col: c, label, band: quarterRow.get(c)?.trim() ?? '' });
    }
  }

  // Every non-month column must be a total of some kind. This is the guard that keeps the
  // trailing "Q3 Total" — which currently holds July alone — out of the layer, and it fails
  // loudly if IRCC introduces a column shape nobody has met.
  const unexpected = discarded.filter((d) => !/Total$/.test(d.label));
  if (unexpected.length) {
    throw new Error(`${unexpected.length} non-month column(s) whose header does not end in 'Total': ${unexpected.slice(0, 4).map((d) => `${d.col}=${JSON.stringify(d.label)}`).join(', ')}`);
  }

  const periods = monthCols.map((m) => m.period);
  for (let i = 1; i < periods.length; i++) {
    const [py, pm] = periods[i - 1].split('-').map(Number);
    const want = pm === 12 ? `${py + 1}-01` : `${py}-${String(pm + 1).padStart(2, '0')}`;
    if (periods[i] !== want) throw new Error(`month columns are not contiguous: ${periods[i - 1]} is followed by ${periods[i]}`);
  }
  const newestColumn = periods.at(-1);

  // Cross-check the derived span against the sheet's own title, which is written by whoever
  // cut the file rather than derived from the columns. Two independent statements of the same
  // fact is the only reason to trust either.
  const title = rows.get(1)?.get('A') ?? '';
  const span = /(\w+)\s+(\d{4})\s*[-–]\s*(\w+)\s+(\d{4})/.exec(title);
  if (!span) throw new Error(`title cell A1 does not carry a period span: ${JSON.stringify(title)}`);
  const fromTitle = (name, y) => `${y}-${String(MONTH_FULL.indexOf(name) + 1).padStart(2, '0')}`;
  const titleFirst = fromTitle(span[1], span[2]), titleLast = fromTitle(span[3], span[4]);
  if (titleFirst !== periods[0] || titleLast !== newestColumn) {
    throw new Error(`title says ${titleFirst}..${titleLast} but the month columns run ${periods[0]}..${newestColumn}`);
  }

  // Country rows run from row 6 to the sheet's own 'Total' margin, which is then used to
  // reconcile rather than emitted.
  const labelRows = [];
  let totalRow = null;
  for (let r = 6; ; r++) {
    const row = rows.get(r);
    if (!row) break;
    const label = row.get('A')?.trim();
    if (!label) break;
    if (label === 'Total') { totalRow = row; break; }
    labelRows.push({ r, label, row });
  }
  if (!totalRow) throw new Error("no 'Total' row found under the country block");
  if (labelRows.length < 200) throw new Error(`only ${labelRows.length} label rows above 'Total', expected a couple of hundred`);

  // The workbook's own footnotes, read rather than paraphrased: one of them sets
  // vintage.provisional and one of them is contradicted by the data (see the header).
  let notes = '', sourceStamp = null;
  for (let r = labelRows.at(-1).r + 1; r < labelRows.at(-1).r + 12; r++) {
    const a = rows.get(r)?.get('A');
    if (!a) continue;
    if (a.startsWith('Notes:')) notes = a;
    const s = /^Source:\s*IRCC,\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(a);
    if (s) sourceStamp = { month: `${s[3]}-${String(MONTH_FULL.indexOf(s[1]) + 1).padStart(2, '0')}`, day: +s[2], raw: a };
  }
  if (!notes) throw new Error('the workbook notes row is gone; provisional status cannot be read off the file');
  const provisional = /preliminary and subject to change/i.test(notes);
  if (!sourceStamp) throw new Error("no 'Source: IRCC, <month> <day>, <year>' stamp under the table");
  if (sourceStamp.month !== newestColumn) {
    throw new Error(`the source stamp (${sourceStamp.raw}) is for ${sourceStamp.month} but the newest month column is ${newestColumn}`);
  }

  // ---- decode ----
  const byIso = new Map();              // iso3 -> Map(period -> count)
  const excluded = new Map();           // dropped label -> count in the newest column
  const nonZeroByPeriod = new Map();
  let suppressedNewest = 0, zeroNewest = 0, numericNewest = 0, allRowsNewest = 0;
  const foldedInto = new Map();
  // `${iso3}|${period}` for the folded keys whose sum has a withheld term in that month. For
  // a single-label country a '--' needs no bookkeeping: nothing is written and the month is
  // absent by construction. For a folded key the sibling row can still write a number — or a
  // literal 0 — over the top of the gap, which turns "IRCC withheld this" into "IRCC counted
  // none", the one substitution this whole adapter is arranged to prevent.
  const partlyWithheld = new Set();

  for (const { label, row } of labelRows) {
    const iso3 = resolve(label, 'EN_ODP-PR-Citz.xlsx');
    for (const { col, period } of monthCols) {
      const v = cellValue(row.get(col));
      if (v.kind === 'text') throw new Error(`row ${JSON.stringify(label)} column ${col} (${period}) holds ${JSON.stringify(v.text)}, which is neither a count nor the '--' suppression token`);
      if (period === newestColumn) {
        if (v.kind === 'suppressed') suppressedNewest++;
        else if (v.kind === 'number') { numericNewest++; allRowsNewest += v.n; if (v.n === 0) zeroNewest++; }
      }
      if (iso3 && v.kind === 'suppressed' && FOLDED_ISO3.has(iso3)) partlyWithheld.add(`${iso3}|${period}`);
      if (!iso3 || v.kind !== 'number') continue;   // '--' is absent, never zero
      const series = byIso.get(iso3) ?? byIso.set(iso3, new Map()).get(iso3);
      if (series.has(period)) foldedInto.set(iso3, (foldedInto.get(iso3) ?? 0) + 1);
      series.set(period, (series.get(period) ?? 0) + v.n);
      if (v.n > 0) nonZeroByPeriod.set(period, (nonZeroByPeriod.get(period) ?? 0) + 1);
    }
    if (!iso3) {
      const v = cellValue(row.get(monthCols.at(-1).col));
      excluded.set(label, v.kind === 'number' ? v.n : v.kind === 'suppressed' ? -1 : 0);
    }
  }

  // Reconciliation against the sheet's own margin. The gap can only be the suppressed cells,
  // each of which hides a number in 1-5, so it is bounded — and if the gap ever exceeds that
  // bound, a column has been mis-assigned and the layer is wrong in a way no eyeball catches.
  const tv = cellValue(totalRow.get(monthCols.at(-1).col));
  if (tv.kind !== 'number') throw new Error(`the Total row's ${newestColumn} cell is ${tv.kind}, so there is nothing to reconcile against`);
  const gap = tv.n - allRowsNewest;
  const slack = 5 * suppressedNewest;
  if (gap < 0 || gap > slack) {
    throw new Error(`${newestColumn}: rows sum to ${allRowsNewest} against a published Total of ${tv.n}; the ${gap} gap is outside the ${slack} that ${suppressedNewest} suppressed cells can account for`);
  }

  // Counting non-zero countries, not rows: 217 labels, 189 of them numeric in July 2026 and
  // only 143 of those above zero. A row count would overstate coverage by half.
  const periodsWithData = periods.filter((p) => (nonZeroByPeriod.get(p) ?? 0) > 0);
  const chosen = chooseNewest(periodsWithData, nonZeroByPeriod);
  // Stepping the headline back is only half the job: a thin month left in `rows` is still
  // selectable on the time cursor and still charts as a collapse. If it is not good enough
  // to lead with, it is not good enough to ship.
  const kept = periods.slice(0, periods.indexOf(chosen.period) + 1);

  const rowsOut = {};
  let withheldFolds = 0;
  for (const [iso3, series] of byIso) {
    const o = {};
    for (const p of kept) {
      if (!series.has(p)) continue;
      if (partlyWithheld.has(`${iso3}|${p}`)) { withheldFolds++; continue; }
      o[p] = series.get(p);
    }
    if (Object.keys(o).length) rowsOut[iso3] = o;
  }

  const excludedNewest = [...excluded].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const stat = {
    labelRows: labelRows.length, monthCols: monthCols.length, discarded: discarded.length,
    numericNewest, zeroNewest, suppressedNewest, publishedTotal: tv.n, rowsSum: allRowsNewest,
    inlineCells, valueElements, folded: [...foldedInto.keys()], withheldFolds,
    quarterTrap: discarded.filter((d) => d.label === 'Q3 Total').at(-1) ?? null,
  };

  const layer = {
    id: 'ca-pr-admissions',
    title: 'Canada: permanent residents admitted',
    question: 'How many people of this citizenship were granted permanent residence in Canada?',
    unit: 'people',
    entity: 'country',
    rows: rowsOut,
    periods: kept,
    vintage: {
      periodEnd: lastDayOf(chosen.period),
      periodLabel: chosen.period,
      cadence: 'monthly',
      coverage: [kept[0], kept.at(-1)],
      estimateKind: 'reported',
      provisional,
      reporters: { n: chosen.n, expected: chosen.expected },
      producer: 'Immigration, Refugees and Citizenship Canada (IRCC)',
      licenceId: 'OGL-Canada-2.0',
      commercialUseClear: true,
    },
    note:
      'An admission is the grant of permanent-resident status, not a move. Many of the people ' +
      'counted here were already living in Canada on a study or work permit and did not travel ' +
      'on the day they were admitted, so this is not the same measurement as a European ' +
      'population register and the two should not be differenced. The axis is country of ' +
      'citizenship, an attribute of the person rather than of the journey, which is why there ' +
      'is no corridor layer. IRCC rounds every count to the nearest 5 and withholds counts of ' +
      `1-5 as '--': in ${chosen.period} ${stat.suppressedNewest} of the ${stat.labelRows} citizenship rows are withheld and are ` +
      `absent here rather than zero, while ${stat.zeroNewest} rows carry a literal 0 that is a real zero — the ` +
      "workbook's own note claiming 0-5 are all shown as '--' is contradicted by its own data. " +
      `${chosen.n} citizenships have a non-zero figure in ${chosen.period}; a row count would say ${stat.labelRows} and overstate it. ` +
      `Quarter and year totals in the sheet are discarded, including the trailing 'Q3 Total' column that currently holds July alone. ` +
      (excludedNewest.length
        ? `Rows with no country to key on are excluded: ${excludedNewest.map(([l, n]) => `${l} ${n.toLocaleString('en')}`).join(', ')} in ${chosen.period}.`
        : 'No non-country rows carried a value in the newest month.'),
  };
  return { layer, stat, chosen, excludedNewest };
}

// ------------------------------------------------------------------ layer 2: asylum claims

const ASYLUM_HEADER = ['EN_YEAR', 'EN_QUARTER', 'EN_MONTH', 'FR_ANNEÉ', 'FR_TRIMESTRE', 'FR_MOIS',
  'EN_PROVINCE_TERRITORY', 'FR_PROVINCE_TERRITOIRE', 'EN_COUNTRY_RANK', 'FR_CLASSEMENT_PAR_PAYS',
  'EN_COUNTRY_OF_CITIZENSHIP', 'FR_PAYS_DE_CITOYENNETÉ', 'TOTAL'];

async function loadAsylum() {
  const raw = await grab(ASYLUM_URL, 'ODP-Asylum-Top25CitzProv-LastMonth.csv', 500_000);

  // Trap 2, settled by measurement rather than by instruction. A fatal decoder is the whole
  // test: it throws on the first byte sequence that is not UTF-8, so if it returns at all,
  // the file is UTF-8 and the latin-1 advice this adapter was briefed with is simply wrong.
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
  } catch (e) {
    throw new Error(`ODP-Asylum-Top25CitzProv-LastMonth.csv is not valid UTF-8 (${e.message}); it may have changed to a single-byte encoding and the decoder here needs revisiting`);
  }
  // Decoding cleanly is necessary but not sufficient: latin-1 bytes can also round-trip. The
  // French header fields carry É, and if the accented characters survived as themselves
  // rather than as 'Ã‰' then the encoding really is UTF-8 and not mojibake in either
  // direction. 'Ã' cannot occur in any of IRCC's French labels, so its presence is the tell.
  if (text.includes('Ã')) throw new Error("decoded text contains 'Ã', the signature of UTF-8 bytes read as latin-1");

  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0].split('\t');
  // The extension says .csv and the file is tab-separated; a comma split does not fail, it
  // returns one field for the header and silently splits country names like
  // "Cameroon, Federal Republic of" in two for the rows.
  if (lines[0].split(',').length !== 1) throw new Error('the header line contains a comma: this file is tab-separated despite the .csv extension and the assumption above no longer holds');
  if (header.length !== ASYLUM_HEADER.length || header.some((h, i) => h !== ASYLUM_HEADER[i])) {
    throw new Error(`asylum header is ${JSON.stringify(header)}, expected ${JSON.stringify(ASYLUM_HEADER)}`);
  }

  const col = Object.fromEntries(ASYLUM_HEADER.map((h, i) => [h, i]));
  const byIso = new Map();              // iso3 -> Map(period -> { sum, numeric, suppressed })
  const rankOf = new Map();             // label -> Set(rank)
  const provinces = new Set();
  const residual = new Map();           // period -> 'Other Countries' national sum
  let suppressedCells = 0, numericCells = 0;

  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split('\t');
    if (f.length !== ASYLUM_HEADER.length) throw new Error(`line ${i + 1} splits into ${f.length} tab fields, expected ${ASYLUM_HEADER.length}`);
    const mi = monthIndex(f[col.EN_MONTH]);
    if (!mi) throw new Error(`line ${i + 1} has month ${JSON.stringify(f[col.EN_MONTH])}`);
    // The English and French year columns and the two rank columns are duplicates of each
    // other, and the quarter column is derivable from the month. Checking all three costs
    // nothing and is the only cheap way to notice a row-shredding delimiter bug: a mis-split
    // line lands its fields one column over and these stop agreeing immediately.
    if (f[col.EN_YEAR] !== f[col['FR_ANNEÉ']]) throw new Error(`line ${i + 1}: EN_YEAR and FR_ANNEÉ disagree`);
    if (f[col.EN_COUNTRY_RANK] !== f[col.FR_CLASSEMENT_PAR_PAYS]) throw new Error(`line ${i + 1}: the two rank columns disagree`);
    if (f[col.EN_QUARTER] !== `Q${Math.ceil(mi / 3)}`) throw new Error(`line ${i + 1}: quarter ${f[col.EN_QUARTER]} does not contain month ${f[col.EN_MONTH]}`);

    const period = `${f[col.EN_YEAR]}-${String(mi).padStart(2, '0')}`;
    const label = f[col.EN_COUNTRY_OF_CITIZENSHIP];
    provinces.add(f[col.EN_PROVINCE_TERRITORY]);
    (rankOf.get(label) ?? rankOf.set(label, new Set()).get(label)).add(f[col.EN_COUNTRY_RANK]);

    const v = cellValue(f[col.TOTAL]);
    if (v.kind === 'text') throw new Error(`line ${i + 1}: TOTAL is ${JSON.stringify(v.text)}`);
    if (v.kind === 'suppressed') suppressedCells++;
    if (v.kind === 'number') numericCells++;

    const iso3 = resolve(label, 'ODP-Asylum-Top25CitzProv-LastMonth.csv');
    if (!iso3) {
      if (v.kind === 'number') residual.set(period, (residual.get(period) ?? 0) + v.n);
      continue;
    }
    const series = byIso.get(iso3) ?? byIso.set(iso3, new Map()).get(iso3);
    const cell = series.get(period) ?? series.set(period, { sum: 0, numeric: 0, suppressed: 0 }).get(period);
    if (v.kind === 'number') { cell.sum += v.n; cell.numeric++; } else if (v.kind === 'suppressed') cell.suppressed++;
  }

  // This is the finding that decides what the note has to say. The rank a citizenship carries
  // is the SAME in every province and in every one of the 139 months: it is one national
  // ranking, taken in the newest month, and then carried back over the whole history. So the
  // 25 named citizenships are not "the top 25 that month" — they are the top 25 in July 2026,
  // and a citizenship that was large in 2018 and small now sits inside 'Other Countries' for
  // its entire history. Asserting it is what keeps the note true: if IRCC ever switches to a
  // per-month ranking this throws instead of quietly making the note a lie.
  const multiRank = [...rankOf].filter(([, s]) => s.size > 1);
  if (multiRank.length) {
    throw new Error(`${multiRank.length} citizenship(s) carry more than one rank across the file (e.g. ${multiRank[0][0]}: ${[...multiRank[0][1]].join('/')}); the ranking is no longer a single fixed one and the layer note must be rewritten`);
  }

  const periods = [...new Set([...byIso.values()].flatMap((s) => [...s.keys()]))].sort();
  const nonZeroByPeriod = new Map();
  for (const series of byIso.values()) {
    for (const [p, c] of series) if (c.numeric > 0 && c.sum > 0) nonZeroByPeriod.set(p, (nonZeroByPeriod.get(p) ?? 0) + 1);
  }
  const chosen = chooseNewest(periods, nonZeroByPeriod);
  // Same reason as the admissions layer: a month too thin to lead with is too thin to ship.
  const kept = periods.slice(0, periods.indexOf(chosen.period) + 1);

  const rowsOut = {};
  let newestSuppressed = 0, newestObserved = 0;
  for (const [iso3, series] of byIso) {
    const o = {};
    for (const p of kept) {
      const c = series.get(p);
      // A month in which every province cell for this citizenship was withheld is not a
      // zero month; it is an unknown somewhere in 1..5*k, and it is left out.
      if (c && c.numeric > 0) o[p] = c.sum;
    }
    if (Object.keys(o).length) rowsOut[iso3] = o;
    const n = series.get(chosen.period);
    if (n) { newestSuppressed += n.suppressed; newestObserved += n.sum; }
  }

  const residualNewest = residual.get(chosen.period) ?? 0;
  const stat = {
    lines: lines.length - 1, provinces: provinces.size, numericCells, suppressedCells,
    countries: Object.keys(rowsOut).length, residualNewest, newestObserved, newestSuppressed,
    ranks: [...rankOf].sort((a, b) => (+[...a[1]][0] || 99) - (+[...b[1]][0] || 99)).slice(0, 5).map(([l, s]) => `${[...s][0]}=${l}`),
  };

  const layer = {
    id: 'ca-asylum-claimants',
    title: 'Canada: asylum claims received',
    question: 'How many people of this citizenship lodged an asylum claim in Canada?',
    unit: 'people',
    entity: 'country',
    rows: rowsOut,
    periods: kept,
    vintage: {
      periodEnd: lastDayOf(chosen.period),
      periodLabel: chosen.period,
      cadence: 'monthly',
      coverage: [kept[0], kept.at(-1)],
      estimateKind: 'reported',
      provisional: true,
      reporters: { n: chosen.n, expected: chosen.expected },
      producer: 'Immigration, Refugees and Citizenship Canada (IRCC)',
      licenceId: 'OGL-Canada-2.0',
      commercialUseClear: true,
    },
    note:
      'Claims received in the month, by the claimant’s country of citizenship — an event, not ' +
      'a stock of people waiting, and not a decision. Citizenship is an attribute of the person ' +
      'and says nothing about where they travelled from, so there is no corridor layer. ' +
      `Only ${stat.countries} citizenships are in this file at all: IRCC publishes the top 25 of the NEWEST ` +
      `month — ${chosen.period} — and then carries that one ranking back across the whole ${kept.length}-month history, ` +
      'so everyone outside it sits in an unnamed residual for every month, and a citizenship ' +
      'that was large years ago but small now never appears. Rebuilding this layer in a later ' +
      `month will change which countries have history. The residual held ${residualNewest.toLocaleString('en')} claims in ${chosen.period} ` +
      `against ${newestObserved.toLocaleString('en')} across the named countries. The published cells are province-by-month counts ` +
      `rounded to 5 with counts of 1-5 withheld as '--', and IRCC titles the file itself ` +
      '"[rounded numbers - not for calculations]" for that reason; each national figure here ' +
      'is a sum of those cells, so it ' +
      `is a lower bound — ${newestSuppressed} withheld province cells sit under the named countries in ${chosen.period}, ` +
      `hiding between ${newestSuppressed} and ${newestSuppressed * 5} claims. A citizenship-month whose every province cell was ` +
      'withheld is left out rather than recorded as zero. Claims lodged outside Canada are ' +
      'counted here under the citizenship, the same as any other.',
  };
  return { layer, stat, chosen };
}

// ------------------------------------------------------------------

export async function load() {
  await assertIso3Table();
  const pr = await loadPrAdmissions();
  const asylum = await loadAsylum();
  return { layers: [pr.layer, asylum.layer], diagnostics: { pr: pr.stat, asylum: asylum.stat } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await assertIso3Table();
  const pr = await loadPrAdmissions();
  const as = await loadAsylum();

  console.log('\n--- EN_ODP-PR-Citz.xlsx ---');
  console.log(`  inline <is><t> cells read   ${pr.stat.inlineCells.toLocaleString('en')}   (<v> elements in the sheet: ${pr.stat.valueElements})`);
  console.log(`  label rows above 'Total'    ${pr.stat.labelRows}`);
  console.log(`  month columns kept          ${pr.stat.monthCols}   (${pr.stat.discarded} quarter/year total columns discarded)`);
  if (pr.stat.quarterTrap) console.log(`  the trap column             ${pr.stat.quarterTrap.col} '${pr.stat.quarterTrap.label}' — discarded`);
  console.log(`  ${pr.chosen.period} numeric / zero / '--'  ${pr.stat.numericNewest} / ${pr.stat.zeroNewest} / ${pr.stat.suppressedNewest}`);
  console.log(`  reconciliation              rows ${pr.stat.rowsSum.toLocaleString('en')} vs published Total ${pr.stat.publishedTotal.toLocaleString('en')} (gap ${pr.stat.publishedTotal - pr.stat.rowsSum} <= ${5 * pr.stat.suppressedNewest})`);
  if (pr.stat.folded.length) console.log(`  labels folded into a parent ${pr.stat.folded.join(', ')}   (${pr.stat.withheldFolds} folded country-months dropped because one term of the sum was withheld)`);
  console.log(`  excluded in ${pr.chosen.period}          ${pr.excludedNewest.map(([l, n]) => `${l} ${n}`).join(', ') || 'none'}`);

  console.log('\n--- ODP-Asylum-Top25CitzProv-LastMonth.csv ---');
  console.log(`  data lines                  ${as.stat.lines.toLocaleString('en')}   provinces/territories ${as.stat.provinces}`);
  console.log(`  numeric / withheld cells    ${as.stat.numericCells.toLocaleString('en')} / ${as.stat.suppressedCells.toLocaleString('en')}`);
  console.log(`  fixed national ranking      ${as.stat.ranks.join(', ')} ...`);
  console.log(`  ${as.chosen.period} named / residual     ${as.stat.newestObserved.toLocaleString('en')} / ${as.stat.residualNewest.toLocaleString('en')}  (${as.stat.newestSuppressed} withheld province cells under the named countries)`);

  console.log('');
  for (const l of [pr.layer, as.layer]) {
    const n = Object.keys(l.rows).length;
    const v = l.vintage;
    const top = Object.entries(l.rows)
      .map(([k, r]) => [k, r[v.periodLabel] ?? 0]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const bytes = JSON.stringify({ rows: l.rows }).length;
    console.log(`${l.id.padEnd(20)} ${String(n).padStart(4)} countries  ${v.periodLabel}  ${v.cadence}  ${v.estimateKind}${v.provisional ? ' (provisional)' : ''}  reporters ${v.reporters.n}/${v.reporters.expected}  ${(bytes / 1024).toFixed(0)} KB`);
    console.log(`  coverage ${v.coverage[0]}..${v.coverage[1]} (${l.periods.length} periods), periodEnd ${v.periodEnd}`);
    console.log(`  top in ${v.periodLabel}: ${top.map(([k, x]) => `${k} ${x.toLocaleString('en')}`).join(', ')}`);
  }
}
