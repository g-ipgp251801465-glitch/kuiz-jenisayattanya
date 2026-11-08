const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const address=process.env.TEST_URL||'http://localhost:5173';
 await page.goto(address+'/?gambar=1');
 assert.equal(await page.locator('[data-art="mimi"]').count(),0);
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=16;c.height=9;const ctx=c.getContext('2d');ctx.fillStyle='#7363aa';ctx.fillRect(0,0,16,9);return c.toDataURL().split(',')[1]});
 // Simulate the old user-selected Mimi record. The updated app must ignore it while preserving the background.
 await page.evaluate(async data=>{
  const blob=await (await fetch('data:image/png;base64,'+data)).blob();
  await new Promise((resolve,reject)=>{const r=indexedDB.open('mimi-original-art',1);r.onsuccess=()=>{const tx=r.result.transaction('images','readwrite');tx.objectStore('images').put(blob,'mimi');tx.oncomplete=resolve;tx.onerror=reject}});
 },png);
 await page.locator('[data-art="background"]').setInputFiles({name:'original-background.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(()=>document.querySelector('.art-picker-status').textContent.includes('disimpan pada pelayar ini'));
 await page.reload();
 await page.waitForSelector('.workspace.original-background');
 assert.equal(await page.locator('img.original-mimi').count(),0);
 assert.equal(await page.locator('.scene.original-character').count(),0);
 assert.equal(await page.locator('svg.mimi').isVisible(),false);
 assert.equal(await page.locator('[data-art="mimi"]').count(),0);
 await page.getByRole('button',{name:'MULA MISI',exact:true}).click();await page.locator('[data-answer="dengan"]').click();
 assert.equal(await page.locator('.feedback.is-correct').count(),1);
 const sizes=await page.locator('.content').evaluate(el=>Object.fromEntries(['.feedback strong','.feedback p:last-child','.answer','.correct-label'].map(s=>[s,parseFloat(getComputedStyle(el.querySelector(s)).fontSize)])));
 assert(sizes['.feedback p:last-child']>=25);assert(sizes['.feedback strong']>=30);assert(sizes['.correct-label']>=26);
 await page.goto(address);await page.waitForSelector('.workspace.original-background');
 assert.equal(await page.locator('.art-picker').count(),0);
 assert.deepEqual(errors,[]);
 const student=await browser.newPage();
 await student.route('**/published-bg.png',route=>route.fulfill({contentType:'image/png',body:Buffer.from(png,'base64')}));
 await student.addInitScript(()=>{window.MIMI_UPLOADED_PNGS=['/published-bg.png']});
 await student.goto(address);await student.waitForSelector('.workspace.original-background');
 assert.equal(await student.locator('img.original-mimi').count(),0);
 assert.equal(await student.locator('svg.mimi').isVisible(),false);
 console.log('PASS background preserved, legacy Mimi ignored, no Mimi picker or overlay, public PNG loading, enlarged high-contrast feedback.',sizes);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
