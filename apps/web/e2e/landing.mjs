import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4500);
const shot = async (n) => { await page.screenshot({ path: `shots/L${n}.png` }); console.log('shot:', n); };
await shot('1-open');

// Scroll through the narrative
const total = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
for (const [i, frac] of [0.18, 0.38, 0.58, 0.80, 0.99].entries()) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), total * frac);
  await page.waitForTimeout(1500);
  await shot(`${i + 2}-scroll-${Math.round(frac * 100)}`);
}

// The gate
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.click('.nav-enter');
await page.waitForTimeout(1200);
await shot('7-gate');

// Accept and enter
await page.check('.gate-check input');
await page.waitForTimeout(400);
await page.click('.gate-enter');
await page.waitForTimeout(5000);
await shot('8-observer');

// Legal + sources
await page.goto('http://127.0.0.1:5173/#/legal', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200); await shot('9-legal');
await page.goto('http://127.0.0.1:5173/#/sources', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800); await shot('10-sources');

console.log('errors:', errors.length);
errors.slice(0, 6).forEach((e) => console.log('  !', e.slice(0, 200)));
await browser.close();
