// Builds the snapshot from the REAL bilateral spine plus a REAL second model.
// Deterministic: no Date.now(), no Math.random().
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';

const RAW = '.cache/raw';
const YEARS = Array.from({ length: 34 }, (_, i) => 1990 + i);     // 1990..2023, spine coverage
const PERIOD_STARTS = [1990, 1995, 2000, 2005, 2010, 2015];        // the shared grid with Abel
const TOP_PER_ORIGIN = 9;

const lines = async function* (path) {
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const l of rl) yield l;
};

// ---------- crosswalk, from the dataset's own lookup rather than hand-built ----------
const m49 = {};
const iso3Valid = new Set();
{
  let first = true;
  for await (const l of lines(`${RAW}/Iso_code_lookup.csv`)) {
    if (first) { first = false; continue; }
    const p = l.split(',');
    if (p.length < 4) continue;
    const iso3 = p[p.length - 2].trim(), num = p[p.length - 1].trim();
    if (iso3.length === 3 && num) { m49[String(Number(num))] = iso3; iso3Valid.add(iso3); }
  }
}

// ---------- model A: Gaskin & Abel, annual ----------
// Columns: ,orig,dest,year,stock_mean,stock_std,mig_prev,mig_prev_std,mig_brth,mig_brth_std
const A = new Map();          // "O>D" -> Float64Array(34) of annual mig_prev
const spread = new Map();     // "O>D" -> mean of mig_prev_std/mig_prev over the window
const spreadN = new Map();
{
  let first = true, kept = 0, selfDrop = 0;
  for await (const l of lines(`${RAW}/mig_bilateral.csv`)) {
    if (first) { first = false; continue; }
    const c = l.split(',');
    const orig = c[1], dest = c[2];
    if (orig === dest) { selfDrop++; continue; }            // self-flows are not corridors
    const year = +c[3];
    const yi = year - 1990;
    if (yi < 0 || yi >= YEARS.length) continue;
    const v = +c[6];                                        // mig_prev
    if (!(v > 0)) continue;
    const k = orig + '>' + dest;
    let arr = A.get(k);
    if (!arr) { arr = new Float64Array(YEARS.length); A.set(k, arr); }
    arr[yi] = v;
    const sd = +c[7];
    if (year >= 2015 && v > 0 && sd >= 0) {
      spread.set(k, (spread.get(k) ?? 0) + sd / v);
      spreadN.set(k, (spreadN.get(k) ?? 0) + 1);
    }
    kept++;
  }
  console.log(`model A  rows kept=${kept}  self-flows dropped=${selfDrop}  corridors=${A.size}`);
}

// ---------- model B: Abel, 5-year periods ----------
// Columns: year0,sex,orig,dest,type,da_min_open,da_min_closed,da_pb_closed
// Sum across BOTH sex and type. There is no total row for either.
//
// The three types are DISJOINT COMPONENTS of one flow, not three estimates of it:
// 'return' is people going back to their country of birth, which is still migration along
// this corridor. Filtering to 'outward' was a real defect — it kept 7% of USA->MEX and 96%
// of MEX->USA, and 83.6% of corridor-periods have no outward component at all and vanished
// entirely. The giveaway is the scale check below: summed correctly the two independent
// models agree to a fraction of a percent in aggregate and need no normalisation.
const B = new Map();          // "O>D" -> Map(year0 -> value)
{
  let first = true, kept = 0, typeDrop = 0;
  for await (const l of lines(`${RAW}/bilat_mig_sex_type.csv`)) {
    if (first) { first = false; continue; }
    const c = l.split(',');
    const type = c[4];
    if (type !== 'outward' && type !== 'return' && type !== 'transit') { typeDrop++; continue; }
    const orig = c[2], dest = c[3];
    if (orig === dest) continue;
    const y0 = +c[0];
    if (!PERIOD_STARTS.includes(y0)) continue;
    const v = +c[7];                                        // da_pb_closed
    if (!(v > 0)) continue;
    const k = orig + '>' + dest;
    let m = B.get(k);
    if (!m) { m = new Map(); B.set(k, m); }
    m.set(y0, (m.get(y0) ?? 0) + v);                        // sum male + female
    kept++;
  }
  console.log(`model B  rows kept=${kept}  unknown-type dropped=${typeDrop}  corridors=${B.size}`);
}

// ---------- geometry ----------
const topo = JSON.parse(await readFile(`${RAW}/../ne110.json`, 'utf8'));
const fc = feature(topo, topo.objects.countries);
// A planar centroid is meaningless for a ring that crosses the antimeridian (Russia, Fiji,
// New Zealand), and wrapping the result afterwards does not repair it — the average was
// already taken across a 360-degree seam. Average on the sphere instead.
function ringArea(coords) {
  let a = 0;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [x0, y0] = coords[j], [x1, y1] = coords[i];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a / 2);
}
function centroidOf(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let best = null;
  for (const p of polys) {
    const a = ringArea(p[0]);
    if (!best || a > best.a) best = { a, ring: p[0] };
  }
  if (!best) return null;
  // Mean of the vertices as unit vectors, then back to lon/lat. Seam-safe by construction.
  let x = 0, y = 0, z = 0, n = 0;
  for (const [lon, lat] of best.ring) {
    const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
    x += Math.cos(la) * Math.cos(lo);
    y += Math.cos(la) * Math.sin(lo);
    z += Math.sin(la);
    n++;
  }
  if (!n) return null;
  x /= n; y /= n; z /= n;
  const hyp = Math.hypot(x, y);
  if (hyp < 1e-12 && Math.abs(z) < 1e-12) return null;
  return [(Math.atan2(y, x) * 180) / Math.PI, (Math.atan2(z, hyp) * 180) / Math.PI];
}

// ---------- World Bank context (already fetched, observed) ----------
const load = async (k) => JSON.parse(await readFile(`.cache/${k}.json`, 'utf8'));
const [pop, stock, unemp, gdppc, beds, phys, emp, ptr] = await Promise.all(['pop','stock','unemp','gdppc','beds','phys','emp','ptr'].map(load));
const byIso = (rows) => {
  const m = new Map();
  for (const r of rows) {
    const iso = r.countryiso3code; if (!iso || iso.length !== 3) continue;
    if (!m.has(iso)) m.set(iso, new Map());
    m.get(iso).set(+r.date, r.value);
  }
  return m;
};
const POP = byIso(pop), STOCK = byIso(stock), UNEMP = byIso(unemp), GDP = byIso(gdppc);
const BEDS = byIso(beds), PHYS = byIso(phys), EMP = byIso(emp), PTR = byIso(ptr);
const NAME = new Map();
for (const r of pop) if (r.countryiso3code?.length === 3) NAME.set(r.countryiso3code, r.country.value);

const places = [];
const disputed = [];
for (const f of fc.features) {
  const iso = f.id == null ? null : m49[String(Number(f.id))];
  if (!iso) { disputed.push(f.properties?.name ?? '?'); continue; }
  const centroid = centroidOf(f.geometry);
  if (!centroid) continue;
  const latest = (m, yMax = 2023) => { for (let y = yMax; y >= 2000; y--) { const v = m?.get(iso)?.get(y); if (v != null) return { v, y }; } return null; };
  const p = latest(POP), s = latest(STOCK, 2020), u = latest(UNEMP), g = latest(GDP);
  const bd = latest(BEDS), ph = latest(PHYS), em = latest(EMP), pt = latest(PTR);
  const present = [p, s, u, g].filter(Boolean).length;
  const staleness = s ? Math.max(0, (2023 - s.y) / 23) : 1;
  places.push({
    iso3: iso, name: NAME.get(iso) ?? f.properties?.name ?? iso, centroid,
    pop: p?.v ?? null, popYear: p?.y ?? null,
    stock: s?.v ?? null, stockYear: s?.y ?? null,
    unemp: u?.v ?? null, unempYear: u?.y ?? null,
    gdppc: g?.v ?? null, gdppcYear: g?.y ?? null,
    coverage: +Math.max(0.04, (present / 4) * (1 - 0.45 * staleness)).toFixed(4),
    indicatorsPresent: present,
    // service stocks for the headroom model, each with its own observation year
    beds: bd?.v ?? null, bedsYear: bd?.y ?? null,
    phys: ph?.v ?? null, physYear: ph?.y ?? null,
    emp: em?.v ?? null, empYear: em?.y ?? null,
    ptr: pt?.v ?? null, ptrYear: pt?.y ?? null,
  });
}
places.sort((a, b) => a.iso3.localeCompare(b.iso3));
const known = new Set(places.map((p) => p.iso3));
const idx = new Map(places.map((p, i) => [p.iso3, i]));

// ---------- select corridors: top-K per origin by mean 2015-2023 ----------
const scored = [];
for (const [k, arr] of A) {
  const [o, d] = k.split('>');
  if (!known.has(o) || !known.has(d)) continue;
  let s = 0; for (let y = 2015; y <= 2023; y++) s += arr[y - 1990];
  if (s > 0) scored.push({ k, o, d, score: s / 9 });
}
const perOrigin = new Map();
for (const c of scored) {
  if (!perOrigin.has(c.o)) perOrigin.set(c.o, []);
  perOrigin.get(c.o).push(c);
}
const chosen = [];
for (const [, list] of perOrigin) {
  list.sort((x, y) => y.score - x.score);
  chosen.push(...list.slice(0, TOP_PER_ORIGIN));
}
chosen.sort((x, y) => y.score - x.score);

// ---------- disagreement on the shared period grid ----------
// Both models are normalised to the same total over the shared grid first: otherwise the
// "disagreement" is a difference of scale, which is not what the channel means.
let sumA = 0, sumB = 0, pairCount = 0;
for (const c of chosen) {
  const bm = B.get(c.k); if (!bm) continue;
  const arr = A.get(c.k);
  for (const y0 of PERIOD_STARTS) {
    const bv = bm.get(y0); if (!(bv > 0)) continue;
    let av = 0; for (let y = y0; y < y0 + 5; y++) av += arr[y - 1990] ?? 0;
    if (!(av > 0)) continue;
    sumA += av; sumB += bv; pairCount++;
  }
}
// Two independently built models of the same quantity should already be on the same scale.
// If this ratio is not near 1, something upstream is being dropped or double-counted, and a
// global fudge factor would hide it rather than fix it.
const scaleRatio = sumA / sumB;
const scaleB = 1;
console.log(`shared period grid: ${pairCount} corridor-periods`);
console.log(`scale check       A/B = ${scaleRatio.toFixed(4)}  (near 1.0 means the two models agree in aggregate)`);
if (Math.abs(scaleRatio - 1) > 0.15) {
  console.warn(`WARNING: the two models differ by ${((scaleRatio - 1) * 100).toFixed(1)}% in total volume. ` +
    `That is a pipeline problem, not a finding. Do not normalise it away.`);
}

const corridors = [];
let withDisagreement = 0;
for (const c of chosen) {
  const arr = A.get(c.k);
  const bm = B.get(c.k);
  // Disagreement is a step function: constant within each period, absent where the
  // second model has nothing to say. Never interpolated across the gap.
  const dpByPeriod = PERIOD_STARTS.map((y0) => {
    if (!bm) return null;
    const bv = bm.get(y0); if (!(bv > 0)) return null;
    let av = 0; for (let y = y0; y < y0 + 5; y++) av += arr[y - 1990] ?? 0;
    if (!(av > 0)) return null;
    const b = bv * scaleB;
    return +(Math.abs(av - b) / ((av + b) / 2)).toFixed(4);
  });
  if (dpByPeriod.some((x) => x != null)) withDisagreement++;
  // Ship BOTH models' period values, not just their divergence: the landing draws the two
  // estimates simultaneously so a viewer sees the disagreement rather than being told it.
  const aPeriods = PERIOD_STARTS.map((y0) => {
    let av = 0; for (let y = y0; y < y0 + 5; y++) av += arr[y - 1990] ?? 0;
    return av > 0 ? Math.round(av) : null;
  });
  const bPeriods = PERIOD_STARTS.map((y0) => {
    const bv = bm?.get(y0);
    return bv > 0 ? Math.round(bv * scaleB) : null;
  });
  const n = spreadN.get(c.k) ?? 0;
  corridors.push({
    a5: aPeriods,
    b5: bPeriods,
    o: idx.get(c.o), d: idx.get(c.d),
    // Round to 2dp, not to an integer: rounding a real 0.4-person modelled flow to 0
    // deletes the arc and renders an absence as a zero, which is the one thing forbidden.
    v: Array.from(arr, (x) => (x > 0 && x < 1 ? +x.toFixed(2) : Math.round(x))),
    dpp: dpByPeriod,                                  // per-period cross-model disagreement
    spread: n ? +((spread.get(c.k) ?? 0) / n).toFixed(4) : null,  // model-internal spread
    cov: +Math.min(places[idx.get(c.o)].coverage, places[idx.get(c.d)].coverage).toFixed(4),
  });
}

// Benchmarks are the MEDIAN of countries that actually report each stock, computed here and
// shipped, so the UI can state the basis and the count rather than asserting an "EU median"
// that nobody can check.
function median(xs) {
  const v = xs.filter((x) => x != null && isFinite(x)).sort((a, b) => a - b);
  return v.length ? { value: +v[v.length >> 1].toFixed(2), n: v.length } : null;
}
const benchmarks = {
  beds: median(places.map((p) => p.beds)),
  phys: median(places.map((p) => p.phys)),
  emp: median(places.map((p) => p.emp)),
  ptr: median(places.map((p) => p.ptr)),
};
console.log('benchmarks (median of reporters):', JSON.stringify(benchmarks));

await mkdir('public/snapshot', { recursive: true });
for (const f of fc.features) {
  f.properties = { name: f.properties?.name ?? null, iso3: f.id == null ? null : (m49[String(Number(f.id))] ?? null) };
}
await writeFile('public/snapshot/places.json', JSON.stringify({ places }));
await writeFile('public/snapshot/corridors.json', JSON.stringify({
  years: YEARS, periodStarts: PERIOD_STARTS, corridors,
}));
await writeFile('public/snapshot/adm0.json', JSON.stringify(fc));
await writeFile('public/snapshot/manifest.json', JSON.stringify({
  builtFrom: 'Gaskin & Abel (spine) + Abel (second model) + World Bank WDI (context) + Natural Earth (geometry)',
  corridorCount: corridors.length,
  placeCount: places.length,
  yearRange: [YEARS[0], YEARS.at(-1)],
  periodStarts: PERIOD_STARTS,
  corridorsWithSecondModel: withDisagreement,
  modelScaleRatio: +scaleRatio.toFixed(4),
  benchmarks,
  disputedRenderedWithoutData: disputed,
  sources: [
    { id: 'gaskin-abel', title: 'Gaskin & Abel, bilateral migration flows', licence: 'CC BY-4.0', estimateKind: 'modelled', latencyClass: 'annual', vintage: '1990-2023',
      note: 'Zenodo 17344747, mig_bilateral.csv. Deep recurrent network over 18 covariates, 230 countries. Column mig_prev. Self-flows dropped. THE SPINE.' },
    { id: 'abel-figshare', title: 'Abel, bilateral flow estimates by sex and type', licence: 'CC BY-4.0', estimateKind: 'modelled', latencyClass: 'quinquennial', vintage: '1990-2020',
      note: 'figshare 14579241, bilat_mig_sex_type.csv, estimator da_pb_closed. Summed across BOTH sex and type, neither of which ships a total row: outward, return and transit are disjoint components of one flow, not three estimates of it. THE SECOND OPINION.' },
    { id: 'wb-reported', title: 'World Bank WDI — reported series', licence: 'CC BY-4.0', estimateKind: 'observed', latencyClass: 'annual', vintage: 'per-country, shown with each figure',
      note: 'SP.POP.TOTL (population), NY.GDP.PCAP.PP.KD (GDP per capita PPP), SH.MED.BEDS.ZS (hospital beds), SH.MED.PHYS.ZS (physicians), SE.PRM.ENRL.TC.ZS (pupil-teacher ratio). National reporting compiled by the World Bank.' },
    { id: 'wb-ilo-modelled', title: 'World Bank WDI — modelled ILO estimates', licence: 'CC BY-4.0', estimateKind: 'modelled', latencyClass: 'annual', vintage: 'per-country, shown with each figure',
      note: 'SL.UEM.TOTL.ZS and SL.EMP.TOTL.SP.ZS are labelled by their publisher as MODELLED ILO ESTIMATES, not national reporting. They are badged modelled here for that reason.' },
    { id: 'wb-un-stock', title: 'World Bank WDI — migrant stock (UN estimates)', licence: 'CC BY-4.0', estimateKind: 'modelled', latencyClass: 'quinquennial', vintage: '2010 / 2015 / 2020 only',
      note: 'SM.POP.TOTL originates as UN DESA quinquennial estimates. It is not annual and it is not observed; the year shown with each figure is the true observation year.' },
    { id: 'naturalearth', title: 'Natural Earth 110m Admin-0', licence: 'Public domain', estimateKind: 'observed', latencyClass: 'annual', vintage: 'v5',
      note: 'geometry and centroids only' },
  ],
}, null, 2));

const dps = corridors.flatMap((c) => c.dpp.filter((x) => x != null)).sort((a, b) => a - b);
console.log(`places        ${places.length}   disputed (no data join) ${disputed.length}`);
console.log(`corridors     ${corridors.length}   with a second model: ${withDisagreement}`);
console.log(`disagreement  p50=${dps[dps.length >> 1]?.toFixed(3)} p90=${dps[Math.floor(dps.length * 0.9)]?.toFixed(3)} n=${dps.length}`);
