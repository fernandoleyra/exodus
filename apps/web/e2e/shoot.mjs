import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL = 'http://127.0.0.1:5173/';
const errors = [];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
// Wait for the snapshot to load and deck to paint.
await page.waitForFunction(() => document.querySelectorAll('.src').length > 0, { timeout: 30000 });
await page.waitForTimeout(4500);

const shot = async (name) => { await page.screenshot({ path: `shots/${name}.png` }); console.log('shot:', name); };

await shot('01-globe-2019');

// Year 1995 — the flipbook
const slider = page.locator('input[type=range]');
await slider.fill('2015');
await page.waitForTimeout(2200);
await shot('02-year-2015-corroborated');

// Year 2023
await slider.fill('2022');
await page.waitForTimeout(2200);
await shot('03-year-2022-no-second-model');

// Focus a high-coverage reporter, then a low-coverage one: the contrast in arc
// opacity is the product's core claim, so it needs to be visible in a still.
const pick = async (iso) => { await page.evaluate((i) => window.__select(i), iso); await page.waitForTimeout(2600); };

await pick('DEU');
await shot('04-focus-germany-high-coverage');

await pick('IND');
await shot('05-focus-india-disagreement');

await pick(null);
await page.waitForTimeout(1200);

// Drag to rotate to another hemisphere
const box = await page.locator('.stage').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 - 340, box.y + box.height / 2 + 40, { steps: 25 });
await page.mouse.up();
await page.waitForTimeout(2200);
await shot('06-rotated');

const stats = await page.evaluate(() => ({
  canvas: !!document.querySelector('canvas'),
  w: document.querySelector('canvas')?.width ?? 0,
  h: document.querySelector('canvas')?.height ?? 0,
  sources: document.querySelectorAll('.src').length,
  figures: document.querySelectorAll('.figure').length,
  emdash: Array.from(document.querySelectorAll('.val')).filter(e => e.textContent === '—').length,
}));
writeFileSync('shots/report.json', JSON.stringify({ stats, errors }, null, 2));
console.log('stats:', JSON.stringify(stats));
console.log('console errors:', errors.length);
errors.slice(0, 8).forEach(e => console.log('  !', e.slice(0, 220)));
await browser.close();
