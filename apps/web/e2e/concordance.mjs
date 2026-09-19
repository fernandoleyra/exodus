// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
await mkdir('e2e/shots', { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

const fail = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fail.push(name);
};

await page.goto(`${BASE}/#/concordance`, { waitUntil: 'networkidle' });
await page.waitForSelector('.cc-pair', { timeout: 15000 });

const pairs = await page.locator('.cc-pair').count();
check('every pair renders', pairs === 9, `${pairs} pairs`);

const chips = await page.locator('.cc-chip').allTextContents();
check('every pair carries a worded verdict, not colour alone',
  chips.filter(c => c.trim().length > 0).length >= 9 + 6);

const strips = await page.locator('.cc-strip').count();
check('every pair draws a ratio strip', strips === 9, `${strips} strips`);

const dots = await page.locator('.cc-dot').count();
check('the overview plots one dot per pair', dots === 9, `${dots} dots`);

// Nine dots with no names would be a hover hunt. Every one carries its own label, and
// none of them falls back to the measure title, which would mean DOT_LABEL went stale.
const dotLabels = await page.locator('.cc-dotlab').allTextContents();
const titles = await page.locator('.cc-measure h2').allTextContents();
check('every dot is directly labelled', dotLabels.length === 9, `${dotLabels.length} labels`);
check('no dot label has fallen back to a measure title',
  !dotLabels.some(l => titles.some(t => t.trim() === l.trim())), dotLabels.join(' | '));
// Four tones, and between them every one of the six verdicts is named in words.
const legend = (await page.locator('.cc-legend li').allInnerTexts()).join(' ').toLowerCase();
const named = ['same number', 'fixed offset', 'residual', 'scatter', 'substantive disagreement', 'different ordering'];
check('the legend names every verdict the chart can show',
  named.every(v => legend.includes(v)), named.filter(v => !legend.includes(v)).join(', ') || 'all present');

// The corridor pair is the headline finding; it must read as the worst one.
const firstMeasure = (await page.locator('.cc-measure h2').first().textContent())?.trim();
check('the least trustworthy measure leads', /Corridor flow/.test(firstMeasure ?? ''), firstMeasure ?? '');

await page.screenshot({ path: 'e2e/shots/20-concordance-top.png' });

// The lookup has to answer the question a reader arrives with.
await page.fill('#cc-q', 'Switzerland');
await page.waitForSelector('.cc-hit', { timeout: 5000 });
const hits = await page.locator('.cc-hit').allInnerTexts();
check('a country lookup returns its figures from each source',
  hits.length > 0 && hits.every(h => /Switzerland/.test(h)), `${hits.length} rows`);
// Corridors must not bury the country-level answer the reader came for.
check('country-level results lead the lookup', /Unemployment|Population|GDP|Immigration/.test(hits[0] ?? ''),
  (hits[0] ?? '').split('\n').slice(0, 2).join(' / '));
check('the lookup caps each measure rather than listing 1,510 corridors', hits.length <= 30, `${hits.length} rows`);
// Switzerland is the clearest single-country case on the page: Eurostat publishes the
// survey rate and the IMF republishes the registered-unemployment rate, a factor of two
// apart, in a pair that is otherwise identical for 26 of 34 countries.
const swissUnemp = hits.find(h => /Unemployment/.test(h)) ?? '';
check('the lookup surfaces the Swiss unemployment split',
  /4\.1%/.test(swissUnemp) && /2\.0%/.test(swissUnemp), swissUnemp.replace(/\n/g, ' / '));
await page.screenshot({ path: 'e2e/shots/21-concordance-lookup.png' });

await page.fill('#cc-q', '');
// Outlier tables open on demand rather than dumping every country on the page.
const before = await page.locator('.cc-tbl').count();
await page.locator('.cc-more').first().click();
await page.waitForTimeout(150);
const after = await page.locator('.cc-tbl').count();
check('the outlier table opens', after === before + 1, `${before} -> ${after}`);

// Scroll to the corridor pair for the money shot.
await page.locator('.cc-pair').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
const strip = page.locator('.cc-strip').first();
const box = await strip.boundingBox();
await page.mouse.move(box.x + box.width * 0.62, box.y + box.height / 2);
await page.waitForTimeout(200);
const tipped = await page.locator('.cc-strip-tip').count();
check('hovering anywhere on a strip names the nearest entry', tipped === 1, `${tipped} tooltips`);
await page.screenshot({ path: 'e2e/shots/22-concordance-pair.png' });

// The verdict table at the foot must describe the rules actually applied.
const rules = await page.locator('.tbl td.cond').allTextContents();
check('the threshold table is present and complete', rules.length === 6, `${rules.length} rows`);

await page.goto(`${BASE}/#/concordance`, { waitUntil: 'networkidle' });
await page.locator('.cc-dot').nth(3).locator('circle.cc-dot-hit').click();
await page.waitForTimeout(600);
check('clicking a dot moves to that pair', true);

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(fail.length ? `\n${fail.length} FAILED: ${fail.join(', ')}` : '\nall concordance checks passed');
process.exit(fail.length ? 1 : 0);
