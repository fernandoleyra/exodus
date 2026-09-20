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

const rows = page.locator('[aria-label="Data layers"] .layerrow');
const nRows = await rows.count();
check('every country layer has a chip', nRows === layers.filter((l) => l.entity === 'country').length,
  `${nRows} chips`);

// Every chip states its own vintage, so a reader never has to assume a layer shares the
// spine's year. Colour alone never carries the provisional flag — it is a word.
const chip = await rows.first().innerText();
check('a chip prints period, age and kind', /\d{4}(-\d{2}|-Q\d)?\s+·\s+\d+ d\s+·\s+(reported|observed|modelled)/.test(chip),
  chip.split('\n').at(-1));

// The load-bearing behaviour. A layer starting in 2025 asked for 2019 must paint nothing and
// say so, not reach backwards. The opposite failure — carrying a value forward — is the same
// bug wearing a different hat, and it is what makes stale data look current.
await rows.first().click();
await page.waitForTimeout(1600);
await setYear(2019);
const at2019 = await page.locator('.layernote').innerText();
check('a layer with nothing at the cursor paints nothing and says so',
  /has nothing at or before 2019/.test(at2019) && /carried backwards/.test(at2019),
  at2019.slice(0, 90));

await setYear(axisMax);
const atMax = await page.locator('.layernote').innerText();
check('at its own period the layer paints and names it', /^Painting /.test(atMax), atMax.slice(0, 80));
check('the painted period is stated, not assumed', /Painting\s+\d{4}(-\d{2}|-Q\d)?/.test(atMax));
await page.screenshot({ path: 'e2e/shots/40-vintage-current.png' });

// Past the spine, the app says so rather than showing an empty globe with no explanation.
const hint = await page.locator('.hint').innerText();
check('the app says when the cursor is past the flow spine', /past the flow spine/.test(hint), hint);

// A provisional layer must be legible as provisional in words.
const provisional = layers.filter((l) => l.vintage.provisional);
if (provisional.length) {
  const text = await page.locator('[aria-label="Data layers"]').innerText();
  check('provisional layers are labelled in words', /provisional/i.test(text), `${provisional.length} provisional layers`);
}

// A producer that does not clearly grant commercial reuse is badged, not quietly mixed in.
const unclear = layers.filter((l) => !l.vintage.commercialUseClear);
console.log(`note  ${unclear.length} layers without a clear commercial grant${unclear.length ? `: ${unclear.map((l) => l.id).join(', ')}` : ''}`);

// Corridor layers are origin-destination matrices; a globe paints countries, so they must not
// appear as surfaces. They belong to the inspector.
const corridorTitles = layers.filter((l) => l.entity === 'corridor').map((l) => l.title);
const chipTitles = await page.locator('[aria-label="Data layers"] .layername').allTextContents();
check('corridor layers are not offered as globe surfaces',
  !corridorTitles.some((t) => chipTitles.includes(t)), `${corridorTitles.length} corridor layers`);

// And the inspector does show corridor detail for a selected country.
await page.evaluate(() => { window.__select('DEU'); window.__setView(10, 51, 2.0); });
await page.waitForTimeout(3000);
check('the inspector shows corridor detail the globe cannot',
  (await page.locator('.origins').count()) >= 1,
  `${await page.locator('.origin-row').count()} corridor rows`);
await page.screenshot({ path: 'e2e/shots/41-vintage-inspector.png' });

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(fail.length ? `\n${fail.length} FAILED: ${fail.join(', ')}` : '\nall vintage checks passed');
process.exit(fail.length ? 1 : 0);
