// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
/** Tests the claim on the badges page: no third-party request at runtime.
 *  Fails on ANY cross-origin request, from any route, including workers and beacons. */
import { chromium } from 'playwright';

const ORIGIN = process.env.BASE ?? process.env.VITE_BASE ?? 'http://127.0.0.1:4173';
const ROUTES = ['/', '/#/sources', '/#/methods', '/#/legal', '/#/concordance', '/#/observer'];

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const external = [];
page.on('request', (r) => {
  const u = r.url();
  if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith(ORIGIN)) return;
  external.push(`${r.resourceType()} ${u}`);
});

await page.goto(ORIGIN, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));

for (const route of ROUTES) {
  await page.goto(ORIGIN + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  // Exercise the globe, which is where a worker-backed loader would fire.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1500);
}

await browser.close();

if (external.length) {
  console.error(`FAIL: ${external.length} cross-origin request(s) — the "no third-party requests" claim is false:`);
  for (const e of [...new Set(external)]) console.error('  ' + e);
  process.exit(1);
}
console.log(`PASS: no cross-origin request across ${ROUTES.length} routes.`);
