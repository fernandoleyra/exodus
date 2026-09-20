import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const [lon, lat, name] = [process.env.LON||'-60', process.env.LAT||'-20', process.env.NAME||'shot'];
const b = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
const page = await b.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));
await page.goto(`${BASE}/#/observer`, { waitUntil: 'networkidle' });
await page.waitForSelector('.layerrow', { timeout: 25000 });
await page.waitForTimeout(2500);
await page.evaluate(([lo, la]) => window.__setView && window.__setView(+lo, +la), [lon, lat]);
await page.waitForTimeout(2500);
await page.screenshot({ path: `shots/${name}.png` });
console.log('shot:', name);
await b.close();
