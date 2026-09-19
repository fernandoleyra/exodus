import { chromium } from 'playwright';
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
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
  // Wheel events, not window.scrollTo: programmatic scrolling works even when CSS
  // prevents a user from scrolling at all, which is exactly how a real scroll bug hid here.
  await page.mouse.move(800, 500);
  const target = total * frac;
  let guard = 0;
  while (await page.evaluate(() => window.scrollY) < target - 60 && guard++ < 400) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(16);
  }
  const reached = await page.evaluate(() => window.scrollY);
  if (reached < target - 200) {
    throw new Error(`SCROLL BLOCKED: wheel reached ${Math.round(reached)} of ${Math.round(target)} — a user cannot scroll this page.`);
  }
  await page.waitForTimeout(1500);
  await shot(`${i + 2}-scroll-${Math.round(frac * 100)}`);
}

// The gate
await page.mouse.move(800, 500);
for (let i = 0; i < 400; i++) await page.mouse.wheel(0, -900);
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
