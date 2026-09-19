import { chromium } from 'playwright';
const b = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
const page = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('exodus.terms.accepted.v1', new Date().toISOString()));
await page.goto('http://127.0.0.1:5173/#/observer', { waitUntil: 'networkidle' });
await page.waitForSelector('.layerrow', { timeout: 20000 });
await page.waitForTimeout(3000);
// Rotate to the Americas, where the biggest polygons are.
const box = await page.locator('.stage').boundingBox();
await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
await page.mouse.down();
await page.mouse.move(box.x + box.width/2 + 430, box.y + box.height/2 + 70, { steps: 30 });
await page.mouse.up();
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/Z-americas.png' });
console.log('shot: americas');
await b.close();
