// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The app used to have one annual axis ending at 2023. It now carries layers at four
// cadences, from a quinquennial stock table to a monthly register 51 days old, and the thing
// that can go wrong is not a crash — it is a layer quietly answering for a period it does not
// cover. Every check here is about that.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
await mkdir('e2e/shots', { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const fail = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fail.push(name);
};

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));
await page.goto(`${BASE}/#/observer`, { waitUntil: 'networkidle' });
await page.waitForSelector('.layerrow', { timeout: 30000 });
await page.waitForTimeout(4000);

const index = await page.evaluate(async () => (await fetch('/snapshot/layers/index.json')).json());
const layers = index.layers ?? [];
check('the snapshot ships data layers', layers.length > 0, `${layers.length} layers`);
check('no adapter failed silently', (index.failures ?? []).length === 0,
  (index.failures ?? []).map((f) => f.file).join(', ') || 'none');

// The point of the whole exercise: something in here has to be genuinely current.
const freshest = layers.map((l) => l.vintage.periodEnd).sort().at(-1);
check('at least one layer reaches 2026', String(freshest ?? '') >= '2026-01-01', `freshest periodEnd ${freshest}`);
check('more than one cadence is present', new Set(layers.map((l) => l.vintage.cadence)).size >= 3,
  [...new Set(layers.map((l) => l.vintage.cadence))].join(', '));

// A stored latency is wrong the day after it is written, so there must not be one.
check('no layer stores a latency', !layers.some((l) => 'latencyDays' in l.vintage));

const setYear = async (y) => {
  await page.evaluate((v) => {
    const el = document.querySelector('input[aria-label="Year"]');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, String(y));
  await page.waitForTimeout(1400);
};

const axisMax = Number(await page.getAttribute('input[aria-label="Year"]', 'max'));
check('the time axis reaches the freshest layer', axisMax >= Number(String(freshest).slice(0, 4)),
  `axis max ${axisMax}, freshest ${freshest}`);

// One list, not two. The spine surfaces and the snapshot layers used to live in separate
// sections with separate rules; a reader had to learn which kind they were looking at before
// they could tell what the cursor would do.
const rows = page.locator('[aria-label="Layers"] .layerrow');
const nRows = await rows.count();
const expected = layers.filter((l) => l.entity === 'country').length + 7;   // + the built-ins
check('one list holds the spine surfaces and the snapshot layers together', nRows === expected,
  `${nRows} rows, expected ${expected}`);

const groups = await page.locator('.layergroup-head').allTextContents();
check('the list is grouped by what a layer measures', groups.length === 3, groups.join(' / '));

// Every row states the period it would paint, so a reader never has to assume a layer shares
// the spine's year.
const first = await rows.first().innerText();
check('a row states the period it would paint', /\d{4}|any year/.test(first), first.replace(/\n/g, ' '));

// The load-bearing behaviour. A layer starting in 2025 asked for 2019 must paint nothing and
// say so, not reach backwards. The opposite failure — carrying a value forward — is the same
// bug wearing a different hat, and it is what makes stale data look current.
// Pick a layer that starts well after 1990 so the "nothing here yet" state is reachable.
const late = rows.filter({ hasText: 'Temporary protection' }).first();
await late.click();
await page.waitForTimeout(1600);
await setYear(2019);
const at2019 = await page.locator('.activewhen').innerText();
check('a layer with nothing at the cursor paints nothing and says so',
  /Nothing at 2019/.test(at2019) && /starts at/.test(at2019), at2019.replace(/\n/g, ' ').slice(0, 100));

await setYear(axisMax);
const atMax = await page.locator('.activewhen').innerText();
check('at its own period the layer paints and names it', /Showing\s+\d{4}/.test(atMax),
  atMax.replace(/\n/g, ' ').slice(0, 90));

// The failure this whole refactor exists to remove: a surface whose data stops mid-axis used
// to empty the globe and take its legend with it, with the only explanation a hint in the
// corner of the timeline. Every layer now keeps its legend and names the period it fell back
// to, so crossing 2020 changes a label rather than the behaviour of the map.
await rows.filter({ hasText: 'Model disagreement' }).first().click();
await page.waitForTimeout(1400);
let heldLegend = true, saidWhich = true;
for (const y of [2019, 2020, 2023, axisMax]) {
  await setYear(y);
  if (await page.locator('.legend').count() === 0) heldLegend = false;
  if (!/Showing\s+\d{4}/.test(await page.locator('.activewhen').innerText())) saidWhich = false;
}
check('a layer whose data stops mid-axis keeps its legend on both sides of the cliff', heldLegend);
check('and names the period it is actually painting', saidWhich);
await page.screenshot({ path: 'e2e/shots/40-vintage-current.png' });

// The same rule has to hold for the spine's own surfaces, which is where the reader
// actually noticed it: the cursor runs to 2026 and the spine's annual frames stop at 2023,
// and the map used to go blank at that line while the panel still claimed to be showing the
// cursor's year. It now holds the last frame everywhere it is read — choropleth, arcs and
// inspector — and each of them names it.
await rows.filter({ hasText: 'Arrivals' }).first().click();
await page.waitForTimeout(1200);
let spineLegend = true;
for (const y of [2015, 2023, axisMax]) {
  await setYear(y);
  if (await page.locator('.legend').count() === 0) spineLegend = false;
}
check('a spine surface keeps its legend past the end of the spine', spineLegend);
const spineWhen = await page.locator('.activewhen').innerText();
check('and says which frame it is holding', /Showing 2023, the newest it has/.test(spineWhen),
  spineWhen.replace(/\s+/g, ' ').trim().slice(0, 90));

await page.evaluate(() => { window.__select('DEU'); });
await page.waitForTimeout(1200);
const corridorHead = await page.locator('.panel.right h2').filter({ hasText: 'Corridors in' }).innerText();
check('the inspector heads its corridor figures with the frame, not the cursor',
  /corridors in 2023/i.test(corridorHead) && new RegExp(`cursor at ${axisMax}`).test(corridorHead),
  corridorHead.replace(/\s+/g, ' ').trim());
const inbound = await page.locator('.panel.right .figure').filter({ hasText: 'Inbound' }).innerText();
check('and still reports a figure there rather than a blank', /[0-9]/.test(inbound),
  inbound.replace(/\s+/g, ' ').trim());
await page.evaluate(() => { window.__select(null); });
await page.waitForTimeout(600);

// The halos hold the last five-year window past 2019 rather than vanishing, so the chip has
// to name it — nothing else on screen would.
const haloChip = await page.locator('.chip', { hasText: 'Disagreement halos' }).innerText();
check('the halo overlay names the window it is standing in for', /\b(19|20)\d{2}\b/.test(haloChip),
  haloChip.replace(/\s+/g, ' ').trim());
await setYear(2015);
const haloChipInside = await page.locator('.chip', { hasText: 'Disagreement halos' }).innerText();
check('and says nothing extra when the cursor is inside the window',
  !/\b(19|20)\d{2}\b/.test(haloChipInside), haloChipInside.replace(/\s+/g, ' ').trim());
await setYear(axisMax);

// Past the spine, the app says so rather than showing an empty globe with no explanation.
const hint = await page.locator('.hint').innerText();
check('the app says when the cursor is past the flow spine', /flow spine ends at \d{4}/.test(hint), hint);

// A provisional layer must be legible as provisional in words.
const provisional = layers.filter((l) => l.vintage.provisional);
if (provisional.length) {
  await rows.filter({ hasText: 'Temporary protection' }).first().click();
  await page.waitForTimeout(1200);
  const text = await page.locator('.activewhen').innerText();
  check('provisional layers are labelled in words', /provisional/i.test(text), `${provisional.length} provisional layers`);
}

// A producer that does not clearly grant commercial reuse is badged, not quietly mixed in.
const unclear = layers.filter((l) => !l.vintage.commercialUseClear);
console.log(`note  ${unclear.length} layers without a clear commercial grant${unclear.length ? `: ${unclear.map((l) => l.id).join(', ')}` : ''}`);

// Corridor layers are origin-destination matrices; a globe paints countries, so they must not
// appear as surfaces. They belong to the inspector.
const corridorTitles = layers.filter((l) => l.entity === 'corridor').map((l) => l.title);
const chipTitles = await page.locator('[aria-label="Layers"] .layername').allTextContents();
check('corridor layers are not offered as globe surfaces',
  !corridorTitles.some((t) => chipTitles.includes(t)), `${corridorTitles.length} corridor layers`);

// And the inspector does show corridor detail for a selected country.
await page.evaluate(() => { window.__select('DEU'); window.__setView(10, 51, 2.0); });
// The corridor matrix is half a megabyte and fetched only once a country is selected, so
// wait for the rows rather than for a fixed interval — a sleep here fails whenever the
// machine is busy, which says nothing about the app.
const origins = await page.waitForSelector('.origins', { timeout: 30000 }).catch(() => null);
check('the inspector shows corridor detail the globe cannot', origins != null,
  `${await page.locator('.origin-row').count()} corridor rows`);
await page.screenshot({ path: 'e2e/shots/41-vintage-inspector.png' });

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(fail.length ? `\n${fail.length} FAILED: ${fail.join(', ')}` : '\nall vintage checks passed');
process.exit(fail.length ? 1 : 0);
