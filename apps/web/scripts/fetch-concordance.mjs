// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Fetches the same quantity from more than one producer, so the app can show how
// far apart they are. Nothing here is a key-gated endpoint; every response is
// cached under .cache/conc/ and the build step reads only the cache.
//
// Licence position for each producer is recorded in build-concordance.mjs and
// rendered on /#/sources. Do not add a producer here before its terms are read.
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

// imf.org sits behind a WAF that rejects node's fetch outright and, counter to the
// usual advice, rejects a *browser* User-Agent with HTTP 403 while letting curl's
// own default UA straight through. Do not "fix" this by adding a browser UA.
// Every response is checked for content-type regardless, because the same WAF
// also answers 200 with an HTML block page.
const getJson = async (url, headers = {}) => {
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.includes('json')) throw new Error(`content-type ${ct}, expected JSON (a WAF block page answers 200)`);
    return await r.json();
  } catch (e) {
    // The WAF in front of imf.org rejects node's TLS fingerprint regardless of
    // headers — 403, or 200 with an HTML block page. curl gets through. Falling
    // back keeps the script working on either path rather than on one machine.
    const { stdout } = await run('curl', ['-sS', '--max-time', '120', url], { maxBuffer: 256 * 1024 * 1024 });
    try { return JSON.parse(stdout); }
    catch { throw new Error(`${url}: ${e.message}; curl fallback did not return JSON either`); }
  }
};

const OUT = '.cache/conc';
await mkdir(OUT, { recursive: true });

const save = async (name, obj) => {
  await writeFile(`${OUT}/${name}.json`, JSON.stringify(obj));
  return obj;
};

// ---------------------------------------------------------------- IMF WEO
// DataMapper answers HTTP 200 to an unknown indicator with a body that has no
// `values` key at all, and it answers 200 with HTML when a query parameter it
// does not know is present. Both are checked, because neither shows up as a
// status code.
async function imf(indicator) {
  const j = await getJson(`https://www.imf.org/external/datamapper/api/v1/${indicator}`);
  const v = j?.values?.[indicator];
  if (!v || typeof v !== 'object') throw new Error(`IMF ${indicator}: no values.${indicator} in a 200 response — the indicator code is probably wrong`);
  return v;
}

const imfCountries = (await getJson('https://www.imf.org/external/datamapper/api/v1/countries')).countries;
await save('imf_countries', imfCountries);
console.log(`imf countries    ${Object.keys(imfCountries).length} entities (the values payload also carries region aggregates; this list is how they get dropped)`);

for (const code of ['PPPPC', 'LP', 'LUR']) {
  const v = await imf(code);
  await save(`imf_${code}`, v);
  const yrs = Object.values(v).flatMap(s => Object.keys(s));
  console.log(`imf ${code.padEnd(12)} ${String(Object.keys(v).length).padStart(3)} entities, ${Math.min(...yrs)}-${Math.max(...yrs)} (the upper years are WEO projections, not outturns)`);
}

// ---------------------------------------------------------------- World Bank
// The country list is what separates real countries from aggregates: a World Bank
// aggregate (WLD, EUU, ARB...) carries region.value === 'Aggregates'. It also
// carries iso2Code, which is how Eurostat's two-letter geo codes get resolved.
{
  const j = await getJson('https://api.worldbank.org/v2/country?format=json&per_page=400');
  const rows = (j[1] ?? []).map(d => ({ iso3: d.id, iso2: d.iso2Code, name: d.name, aggregate: d.region?.value === 'Aggregates' }));
  await save('wb_countries', rows);
  console.log(`wb  country list       ${rows.length} entries, ${rows.filter(r => r.aggregate).length} of them aggregates`);
}

for (const [name, code] of Object.entries({
  wb_gdppc_ppp_cd: 'NY.GDP.PCAP.PP.CD',
  wb_pop: 'SP.POP.TOTL',
  wb_unemp: 'SL.UEM.TOTL.ZS',
})) {
  const j = await getJson(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=2015:2024`);
  const rows = (j[1] ?? []).filter(d => d.value !== null)
    .map(d => ({ iso3: d.countryiso3code, year: +d.date, value: d.value }));
  await save(name, rows);
  console.log(`wb  ${code.padEnd(20)} rows=${rows.length}`);
}

// ---------------------------------------------------------------- Eurostat
// JSON-stat. The value object is a flat index into the product of the dimension
// sizes, so a dataset with an extra dimension (migr_imm1ctz carries `agedef`)
// silently shifts every index if you assume the dimensions you asked for.
async function eurostat(name, dataset, params) {
  const qs = new URLSearchParams({ format: 'JSON', ...params });
  const j = await getJson(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?${qs}`);
  if (!j.value || !j.dimension) throw new Error(`Eurostat ${dataset}: unexpected payload shape`);
  await save(name, j);
  console.log(`estat ${dataset.padEnd(16)} ${Object.keys(j.value).length} cells, dims ${j.id.join('/')}, updated ${j.updated}`);
  return j;
}

await eurostat('estat_unemp', 'une_rt_a', { sex: 'T', age: 'Y15-74', unit: 'PC_ACT', time: '2023' });
await eurostat('estat_imm_total', 'migr_imm1ctz', { sex: 'T', age: 'TOTAL', citizen: 'TOTAL', unit: 'NR', time: '2022' });
await eurostat('estat_imm_foreign', 'migr_imm1ctz', { sex: 'T', age: 'TOTAL', citizen: 'FOR_STLS', unit: 'NR', time: '2022' });

console.log('\nconcordance inputs cached in .cache/conc/');
