const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const html=fs.readFileSync(path.resolve('preview/misi-preview.html'));
 const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()) && r.url()!==address)external.push(r.url())});
 await page.goto(address);
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
 fs.mkdirSync('preview',{recursive:true});
 await page.screenshot({path:'preview/01-halaman-utama.png'});
 await page.getByRole('button',{name:'Matikan bunyi',exact:true}).click();
 const answers=['dengan','tanpa','dengan','tanpa','dengan'];
 for(let target=0;target<=5;target++){
  await page.getByRole('button',{name:target===0?'MULA MISI':'CUBA LAGI',exact:true}).click();
  assert.equal(await page.locator('.particles i').count(),0);
  for(let i=0;i<5;i++){
   const choice=i<target?answers[i]:answers[i]==='dengan'?'tanpa':'dengan';
   await page.locator(`[data-answer="${choice}"]`).click();
   if(target===5&&i===0){await page.waitForTimeout(500);await page.screenshot({path:'preview/02-jawapan-betul.png'})}
   const next=page.locator('[data-action="next"]');
   await next.click();
   await next.dispatchEvent('click').catch(()=>{});
   await page.locator('.leave').waitFor({state:'detached'});
   if(i<4) assert.equal(await page.locator('.progress-row>span').innerText(),`SOALAN ${i+2} / 5`);
  }
  assert.equal(await page.locator('.result-score>strong').innerText(),`${target} / 5`);
  assert.equal(await page.locator(target>=3?'.success-ending':'.revision-ending').count(),1);
  if(target===0){await page.waitForTimeout(450);await page.screenshot({path:'preview/03-ulang-kaji.png'})}
  if(target===5){await page.waitForTimeout(600);await page.screenshot({path:'preview/04-misi-berjaya.png'})}
 }
 await page.getByRole('button',{name:'Kembali ke halaman utama',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
 await page.screenshot({path:'preview/05-telefon.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS self-contained HTML preview: all 6 scores, transitions, rapid duplicate next, clean restart, no network requests or page errors');
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
})().catch(e=>{console.error(e);process.exit(1)});
