// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Two geometry defects were reported from the running app and were invisible in the data:
//
//   1. Fiji, Russia and Antarctica are each stored as a ring that crosses the antimeridian
//      inside a single ring, with a 360-degree jump between consecutive vertices. Drawn
//      as stored, that jump is interpolated the long way and the country is painted as a
//      band wrapping the entire planet.
//   2. Antarctica's ring winds right around the south pole but never reaches it — its
//      southernmost vertex is at -85.6 — so the polar cap was a hole in the polygon.
//
// Neither is detectable by reading the GeoJSON, and both are obvious on screen. So this
// test looks at pixels. The focus fill is a colour nothing else on the globe uses, which
// makes "is this country painted here?" a question a screenshot can answer.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { PNG } from 'pngjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const FOCUS = [34, 74, 66];        // Globe.tsx paints the focused country this and only this
const TOL = 10;                    // tight: a looser match also catches the semi-transparent arcs

await mkdir('e2e/shots', { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));

const fail = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fail.push(name);
};

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));
await page.goto(`${BASE}/#/observer`, { waitUntil: 'networkidle' });
await page.waitForSelector('.layerrow', { timeout: 30000 });
await page.waitForTimeout(4500);

/** Park the camera, focus a country, and return the rendered frame. */
async function frame(iso3, lon, lat, zoom = 1.6) {
  await page.evaluate(([i, lo, la, z]) => {
    window.__select(i);
    window.__setView(lo, la, z);
  }, [iso3, lon, lat, zoom]);
  await page.waitForTimeout(1600);
  return PNG.sync.read(await page.screenshot());
}

const isFocus = (png, i) =>
  Math.abs(png.data[i] - FOCUS[0]) < TOL &&
  Math.abs(png.data[i + 1] - FOCUS[1]) < TOL &&
  Math.abs(png.data[i + 2] - FOCUS[2]) < TOL;

function countFocus(png) {
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) if (isFocus(png, i)) n++;
  return n;
}

// ------------------------------------------------------------------ the wrap
// A country whose polygon wraps the planet is painted on the far side of the globe too.
// So park the camera on each one's ANTIPODE: whatever is drawn there cannot be the country.
const ANTIPODES = [
  { iso3: 'FJI', name: 'Fiji', lon: -2, lat: 17 },
  { iso3: 'RUS', name: 'Russia', lon: -80, lat: -60 },
  { iso3: 'ATA', name: 'Antarctica', lon: 0, lat: 90 },
];
for (const a of ANTIPODES) {
  const png = await frame(a.iso3, a.lon, a.lat);
  const n = countFocus(png);
  const pct = (n / (png.width * png.height)) * 100;
  check(`${a.name} is not painted on the opposite side of the planet`, pct < 0.25,
    `${pct.toFixed(2)}% of the frame carries its focus colour`);
  if (pct >= 0.25) await page.screenshot({ path: `e2e/shots/geom-wrap-${a.iso3}.png` });
}

// ------------------------------------------------------------------ the pole
// Looking straight down at the south pole, the pole sits at the centre of the globe. If
// Antarctica's polygon covers the pole, the centre pixels are Antarctica; if it is a hole,
// they are the sphere behind it.
{
  const png = await frame('ATA', 0, -90, 2.0);
  const cx = png.width >> 1, cy = png.height >> 1;
  let hit = 0, total = 0;
  const R = 26;                                   // a small disc right at the pole
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      total++;
      if (isFocus(png, ((cy + dy) * png.width + (cx + dx)) << 2)) hit++;
    }
  }
  const pct = (hit / total) * 100;
  check('the south pole is inside Antarctica, not a hole in it', pct > 90,
    `${pct.toFixed(1)}% of a ${R}px disc at the pole is Antarctica`);
  await page.screenshot({ path: 'e2e/shots/30-south-pole.png' });
}

// ------------------------------------------------------------------ still drawn at all
// A fix that deleted the geometry would pass everything above. Each country must still be
// painted where it actually is.
const HOMES = [
  { iso3: 'FJI', name: 'Fiji', lon: 178, lat: -17, zoom: 3.4, min: 0.01 },
  { iso3: 'RUS', name: 'Russia', lon: 100, lat: 60, zoom: 1.6, min: 4 },
  { iso3: 'ATA', name: 'Antarctica', lon: 0, lat: -70, zoom: 1.6, min: 4 },
  // South Africa is the one polygon with an interior ring. It was passed through the grid
  // cut uncut, so it kept the exact defect the cut exists to prevent: 16.4 degrees of arc
  // sagging 65 km against 36 km of clearance, punched through like a colander.
  { iso3: 'ZAF', name: 'South Africa', lon: 24.7, lat: -29, zoom: 4.0, min: 2 },
];
for (const h of HOMES) {
  const png = await frame(h.iso3, h.lon, h.lat, h.zoom);
  const pct = (countFocus(png) / (png.width * png.height)) * 100;
  check(`${h.name} is still drawn where it belongs`, pct > h.min,
    `${pct.toFixed(2)}% of the frame, floor ${h.min}%`);
  await page.screenshot({ path: `e2e/shots/31-home-${h.iso3}.png` });
}

// Chukotka is the half of Russia on the far side of the antimeridian. It is the piece a
// naive "just clamp the longitudes" fix loses, so it gets its own check.
{
  const png = await frame('RUS', -175, 66, 3.0);
  const pct = (countFocus(png) / (png.width * png.height)) * 100;
  check('Chukotka survives east of the antimeridian', pct > 0.5, `${pct.toFixed(2)}% of the frame`);
  await page.screenshot({ path: 'e2e/shots/32-chukotka.png' });
}

// Cutting South Africa on the grid means cutting its hole with it. If the hole were dropped,
// South Africa would simply be painted over Lesotho and nothing above would notice.
{
  const png = await frame('ZAF', 28.25, -29.6, 6.0);
  const cx = png.width >> 1, cy = png.height >> 1;
  let hit = 0, total = 0;
  const R = 14;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      total++;
      if (isFocus(png, ((cy + dy) * png.width + (cx + dx)) << 2)) hit++;
    }
  }
  const pct = (hit / total) * 100;
  check('Lesotho is still a hole in South Africa, not painted over', pct < 10,
    `${pct.toFixed(1)}% of a disc over Lesotho carries South Africa's fill`);
  await page.screenshot({ path: 'e2e/shots/33-lesotho.png' });
}

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(fail.length ? `\n${fail.length} FAILED: ${fail.join(', ')}` : '\nall geometry checks passed');
process.exit(fail.length ? 1 : 0);
