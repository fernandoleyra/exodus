// Builds the committed snapshot the app reads. Deterministic: no Date.now(), no Math.random().
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';

const YEARS = Array.from({ length: 34 }, (_, i) => 1990 + i); // 1990..2023

// ---------- real geometry ----------
const topo = JSON.parse(await readFile('/tmp/ne110.json', 'utf8'));
const fc = feature(topo, topo.objects.countries);

// ---------- real indicators ----------
const load = async (k) => JSON.parse(await readFile(`.cache/${k}.json`, 'utf8'));
const [pop, stock, unemp, gdppc] = await Promise.all(['pop','stock','unemp','gdppc'].map(load));
const byIso = (rows) => {
  const m = new Map();
  for (const r of rows) {
    const iso = r.countryiso3code; if (!iso || iso.length !== 3) continue;
    const y = +r.date;
    if (!m.has(iso)) m.set(iso, new Map());
    m.get(iso).set(y, r.value);
  }
  return m;
};
const POP = byIso(pop), STOCK = byIso(stock), UNEMP = byIso(unemp), GDP = byIso(gdppc);
const NAME = new Map();
for (const r of pop) if (r.countryiso3code?.length === 3) NAME.set(r.countryiso3code, r.country.value);

// M49 numeric -> ISO3, from the World Bank rows we already have + NE names
const m49 = JSON.parse(await readFile('scripts/m49.json', 'utf8'));

// ---------- ring area + centroid (spherical-ish, good enough for label/arc anchors) ----------
function ringCentroid(coords) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [x0, y0] = coords[j], [x1, y1] = coords[i];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return Math.abs(a) < 1e-12 ? null : { c: [cx / (6 * a), cy / (6 * a)], a: Math.abs(a) };
}
function centroidOf(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let best = null;
  for (const p of polys) { const r = ringCentroid(p[0]); if (r && (!best || r.a > best.a)) best = r; }
  if (!best) return null;
  // Polygons crossing the antimeridian (Fiji, Russia, NZ) produce an out-of-range
  // planar centroid. Wrap it rather than shipping a longitude of 202.8.
  let [lon, lat] = best.c;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return [lon, lat];
}

// ---------- places, with REAL coverage ----------
const places = [];
const disputed = [];
for (const f of fc.features) {
  // NE ids carry leading zeros ("032"); the crosswalk is keyed by the integer form.
  // Features with no M49 code at all (Kosovo, N. Cyprus, Somaliland) are disputed or
  // non-self-governing: they render as geometry with NO data join and NO corridors.
  // That is the disputed-territory policy, not an oversight.
  const iso = f.id == null ? null : m49[String(Number(f.id))];
  if (!iso) { disputed.push(f.properties.name); continue; }
  const centroid = centroidOf(f.geometry);
  if (!centroid) continue;
  const latest = (m, yMax = 2023) => { for (let y = yMax; y >= 2000; y--) if (m?.get(iso)?.get(y) != null) return { v: m.get(iso).get(y), y }; return null; };
  const p = latest(POP), s = latest(STOCK, 2020), u = latest(UNEMP), g = latest(GDP);
  // Coverage is REAL: how many of the four indicators this country actually reports,
  // discounted by how stale its migrant-stock observation is.
  const present = [p, s, u, g].filter(Boolean).length;
  const staleness = s ? Math.max(0, (2023 - s.y) / 23) : 1;
  const coverage = Math.max(0.04, (present / 4) * (1 - 0.45 * staleness));
  places.push({
    iso3: iso, name: NAME.get(iso) ?? f.properties.name, centroid,
    pop: p?.v ?? null, popYear: p?.y ?? null,
    stock: s?.v ?? null, stockYear: s?.y ?? null,
    unemp: u?.v ?? null, unempYear: u?.y ?? null,
    gdppc: g?.v ?? null, gdppcYear: g?.y ?? null,
    coverage: +coverage.toFixed(4),
    indicatorsPresent: present,
  });
}
places.sort((a, b) => a.iso3.localeCompare(b.iso3));

// ---------- corridors: SYNTHETIC gravity fixture over REAL stocks ----------
// Two variants with different friction exponents stand in for two independent models.
// Their divergence is the disagreement channel. This is a FIXTURE, badged as such in the UI.
const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
const haversine = (a, b) => {
  const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};
const withStock = places.filter((p) => p.stock && p.pop && p.gdppc);
const gravity = (o, d, beta, gamma) => {
  const dist = Math.max(200, haversine(o.centroid, d.centroid));
  const pull = Math.pow(d.gdppc / o.gdppc, gamma);
  return (Math.pow(o.pop, 0.55) * Math.pow(d.stock, beta) * pull) / Math.pow(dist, 1.35);
};
const raw = [];
for (const o of withStock) for (const d of withStock) {
  if (o.iso3 === d.iso3) continue;
  if (d.gdppc < o.gdppc * 0.75) continue;          // keep the plausible direction
  const a = gravity(o, d, 0.62, 0.45);
  const b = gravity(o, d, 0.66, 0.38);             // second "model"
  raw.push({ o: o.iso3, d: d.iso3, a, b });
}
// Top-K per ORIGIN, not a global top-N: a global sort is dominated by a handful of
// rich destinations and leaves most of the planet blank, which misrepresents coverage.
const byOrigin = new Map();
for (const c of raw) {
  if (!byOrigin.has(c.o)) byOrigin.set(c.o, []);
  byOrigin.get(c.o).push(c);
}
const TOP = [];
for (const [, list] of byOrigin) {
  list.sort((x, y) => (y.a + y.b) - (x.a + x.b));
  TOP.push(...list.slice(0, 8));
}
TOP.sort((x, y) => (y.a + y.b) - (x.a + x.b));
// Two models are only comparable once normalised to the same global total — otherwise
// the "disagreement" is just a difference of scale, which is not what the channel means.
const sumA = TOP.reduce((t, c) => t + c.a, 0), sumB = TOP.reduce((t, c) => t + c.b, 0);
for (const c of TOP) { c.a /= sumA; c.b /= sumB; }
const maxAB = Math.max(...TOP.map((c) => Math.max(c.a, c.b)));
const SCALE = 900_000 / maxAB;

const idx = new Map(places.map((p, i) => [p.iso3, i]));
const corridors = TOP.map((c) => {
  const va = c.a * SCALE, vb = c.b * SCALE;
  const mean = (va + vb) / 2;
  const disagreement = Math.abs(va - vb) / Math.max(1, mean);   // d_p
  // annual shape: deterministic, driven by the corridor's own hash — no RNG at runtime
  const seed = [...(c.o + c.d)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const phase = (seed % 1000) / 1000;
  const series = YEARS.map((y, i) => {
    const t = i / (YEARS.length - 1);
    const trend = 0.55 + 0.9 * t;
    const wave = 1 + 0.28 * Math.sin(2 * Math.PI * (t * 1.7 + phase));
    return Math.round(mean * trend * wave);
  });
  return {
    o: idx.get(c.o), d: idx.get(c.d),
    v: series,
    dp: +disagreement.toFixed(4),
    cov: +Math.min(places[idx.get(c.o)].coverage, places[idx.get(c.d)].coverage).toFixed(4),
  };
});

await mkdir('public/snapshot', { recursive: true });
await writeFile('public/snapshot/places.json', JSON.stringify({ places }));
await writeFile('public/snapshot/corridors.json', JSON.stringify({ years: YEARS, corridors }));
// Stamp the ISO3 join onto the geometry so the renderer never re-derives it.
// Disputed features keep iso3: null and therefore never join to data.
for (const f of fc.features) {
  f.properties = { name: f.properties?.name ?? null, iso3: f.id == null ? null : (m49[String(Number(f.id))] ?? null) };
}
await writeFile('public/snapshot/adm0.json', JSON.stringify(fc));
await writeFile('public/snapshot/manifest.json', JSON.stringify({
  builtFrom: 'World Bank WDI (observed) + Natural Earth 110m (geometry)',
  corridorCount: corridors.length,
  placeCount: places.length,
  disputedRenderedWithoutData: disputed,
  yearRange: [YEARS[0], YEARS.at(-1)],
  sources: [
    { id: 'wb-wdi',        title: 'World Bank World Development Indicators', licence: 'CC BY-4.0', estimateKind: 'observed',  latencyClass: 'annual',  vintage: '2023', note: 'SP.POP.TOTL, SM.POP.TOTL, SL.UEM.TOTL.ZS, NY.GDP.PCAP.PP.KD' },
    { id: 'naturalearth',  title: 'Natural Earth 110m Admin-0',             licence: 'Public domain', estimateKind: 'observed', latencyClass: 'annual', vintage: 'v5',   note: 'geometry and centroids only' },
    { id: 'synthetic-grav',title: 'Gravity fixture (M0)',                   licence: 'n/a',          estimateKind: 'modelled',  latencyClass: 'modelled', vintage: 'M0',  note: 'SYNTHETIC. Two friction exponents stand in for two models; their divergence is the disagreement channel. Not a published estimate.' },
  ],
}, null, 2));

const dps = corridors.map(c => c.dp).sort((a,b)=>a-b);
console.log(`places      ${places.length}`);
console.log(`disputed    ${disputed.length} rendered without data join: ${disputed.join(', ')}`);
console.log(`corridors   ${corridors.length}  (years ${YEARS[0]}-${YEARS.at(-1)})`);
console.log(`coverage    min=${Math.min(...places.map(p=>p.coverage)).toFixed(2)} max=${Math.max(...places.map(p=>p.coverage)).toFixed(2)}`);
console.log(`disagreement p50=${dps[dps.length>>1].toFixed(3)} p95=${dps[Math.floor(dps.length*0.95)].toFixed(3)}`);
