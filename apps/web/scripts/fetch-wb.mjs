// Fetches real World Bank indicators. No API key. Writes raw JSON to .cache/
import { mkdir, writeFile } from 'node:fs/promises';
const IND = {
  pop:      'SP.POP.TOTL',      // population, total
  stock:    'SM.POP.TOTL',      // international migrant stock, total
  unemp:    'SL.UEM.TOTL.ZS',   // unemployment, % of labour force
  gdppc:    'NY.GDP.PCAP.PP.KD',// GDP per capita, PPP constant
  refugees: 'SM.POP.REFG',      // refugee population by country of asylum
};
await mkdir('.cache', { recursive: true });
for (const [key, code] of Object.entries(IND)) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=2010:2023`;
  const r = await fetch(url);
  if (!r.ok) { console.error(`${key} ${code}: HTTP ${r.status}`); continue; }
  const j = await r.json();
  const rows = (j[1] ?? []).filter(d => d.value !== null);
  await writeFile(`.cache/${key}.json`, JSON.stringify(rows));
  console.log(`${key.padEnd(9)} ${code.padEnd(18)} rows=${String(rows.length).padStart(5)}  latest=${rows[0]?.date}`);
}
