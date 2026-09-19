import { chromium } from 'playwright';
const b = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
const page = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));
await page.goto('http://127.0.0.1:5173/#/observer', { waitUntil: 'networkidle' });
await page.waitForSelector('.layerrow', { timeout: 20000 });
await page.waitForTimeout(4000);
const shot = async n => { await page.screenshot({ path: `shots/Y${n}.png` }); console.log('shot:', n); };
await shot('1-inbound');
for (const [i, name] of [['3','outbound'],['4','net'],['5','share'],['6','disagreement']]) {
  await page.keyboard.press(i); await page.waitForTimeout(2200); await shot(`${i}-${name}`);
}
await page.keyboard.press('2'); await page.waitForTimeout(1200);
await page.keyboard.press('Q'); await page.waitForTimeout(1500); await shot('7-no-corridors');
console.log('pageerrors:', errs.length); errs.slice(0,4).forEach(e=>console.log(' !',e.slice(0,160)));
await b.close();
