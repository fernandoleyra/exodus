import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1400,height:900} });
const logs=[]; p.on('console',m=>logs.push(m.type()+': '+m.text()));
await p.goto(`${BASE}/`,{waitUntil:'networkidle'});
await p.waitForFunction(()=>document.querySelectorAll('.src').length>0,{timeout:20000});
await p.waitForTimeout(3500);
console.log('rows:', await p.evaluate(()=>window.__rows));
console.log('sample:', JSON.stringify(await p.evaluate(()=>window.__sample)));
// inspect deck layers
const info = await p.evaluate(()=>{
  const cv=document.querySelector('canvas');
  const d = cv && (cv.__deck || window.deck);
  const any = Object.keys(window).filter(k=>k.toLowerCase().includes('deck'));
  return { canvas: !!cv, w: cv?.width, h: cv?.height, deckKeys: any };
});
console.log('info:', JSON.stringify(info));
console.log('--- console ---'); logs.slice(0,25).forEach(l=>console.log(l.slice(0,300)));
await b.close();
