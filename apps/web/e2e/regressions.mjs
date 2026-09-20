// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
/** The three bugs a real user hit. Each test drives the app the way a person does, not the
 *  way a script finds convenient — that distinction is exactly why the scroll bug hid. */
import { chromium } from 'playwright';
const B = process.env.BASE ?? process.env.VITE_BASE ?? 'http://127.0.0.1:4173';
const b = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
const page = await b.newPage({ viewport: { width: 1500, height: 940 } });
let failed = 0;
const ok = (name, pass, detail='') => { console.log(`${pass?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`); if(!pass) failed++; };

// 1. The landing must scroll by WHEEL, which is what a person does.
await page.goto(B, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.mouse.move(750, 500);
for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(40); }
const y = await page.evaluate(() => window.scrollY);
ok('landing scrolls with the wheel', y > 400, `scrollY=${Math.round(y)}`);

// 2. The Observer must still lock its viewport.
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));
await page.goto(B + '/#/observer', { waitUntil: 'networkidle' });
await page.waitForSelector('.layerrow', { timeout: 20000 });
await page.waitForTimeout(3500);
const locked = await page.evaluate(() => getComputedStyle(document.body).overflow);
ok('observer keeps its fixed viewport', locked === 'hidden', `body overflow=${locked}`);

// 3. Selecting a country must be reversible. Pin deterministically rather than clicking
// wherever the globe happens to have rotated to.
const box = await page.locator('.stage').boundingBox();
await page.evaluate(() => window.__select('DEU'));
await page.waitForTimeout(900);
ok('a country can be pinned', (await page.locator('.clear-sel').count()) === 1);

await page.keyboard.press('Escape');
await page.mouse.move(60, 500);          // off the globe, or hover repopulates the panel
await page.waitForTimeout(800);
ok('Escape returns to the global view', (await page.locator('.clear-sel').count()) === 0);

await page.evaluate(() => window.__select('DEU'));
await page.waitForTimeout(700);
// Top-left of the stage is empty space in every camera position.
await page.mouse.click(box.x + 30, box.y + 30);
await page.mouse.move(60, 500);
await page.waitForTimeout(900);
ok('clicking empty space clears the selection', (await page.locator('.clear-sel').count()) === 0);

await b.close();
process.exit(failed ? 1 : 0);
