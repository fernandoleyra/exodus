// Downloads the two published bilateral models. ~210 MB, CC BY-4.0 both.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const FILES = [
  { name: 'Iso_code_lookup.csv',    url: 'https://zenodo.org/records/17344747/files/Iso_code_lookup.csv?download=1',  minBytes: 3_000 },
  { name: 'mig_bilateral.csv',      url: 'https://zenodo.org/records/17344747/files/mig_bilateral.csv?download=1',    minBytes: 100_000_000 },
  { name: 'bilat_mig_sex_type.csv', url: 'https://ndownloader.figshare.com/files/53236079',                           minBytes: 50_000_000 },
];

await mkdir('.cache/raw', { recursive: true });
for (const f of FILES) {
  const path = `.cache/raw/${f.name}`;
  try {
    const st = await stat(path);
    if (st.size >= f.minBytes) { console.log(`${f.name.padEnd(24)} cached  ${(st.size / 1e6).toFixed(1)} MB`); continue; }
  } catch { /* not cached */ }
  const r = await fetch(f.url);
  if (!r.ok) throw new Error(`${f.name}: HTTP ${r.status}`);
  await pipeline(Readable.fromWeb(r.body), createWriteStream(path));
  const st = await stat(path);
  if (st.size < f.minBytes) throw new Error(`${f.name}: got ${st.size} bytes, expected >= ${f.minBytes}`);
  console.log(`${f.name.padEnd(24)} fetched ${(st.size / 1e6).toFixed(1)} MB`);
}
