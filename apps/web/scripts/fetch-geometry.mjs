// Fetches world geometry. Kept separate so a clean clone can rebuild the snapshot
// end to end without a file appearing in /tmp by magic.
import { mkdir, writeFile } from 'node:fs/promises';
const URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
await mkdir('.cache', { recursive: true });
const r = await fetch(URL);
if (!r.ok) throw new Error(`geometry fetch failed: HTTP ${r.status}`);
const text = await r.text();
const topo = JSON.parse(text);
if (topo.type !== 'Topology' || !topo.objects?.countries) throw new Error('unexpected topology shape');
const n = topo.objects.countries.geometries.length;
if (n < 150) throw new Error(`expected >=150 countries, got ${n}`);
await writeFile('.cache/ne110.json', text);
console.log(`geometry  ${n} features  ${(text.length / 1e3).toFixed(0)} kB  -> .cache/ne110.json`);
