const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const address=process.env.TEST_URL||'http://localhost:5173';
 await page.goto(address+'/?gambar=1');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=16;c.height=16;const ctx=c.getContext('2d');ctx.fillStyle='#7363aa';ctx.fillRect(0,0,16,16);return c.toDataURL().split(',')[1]});
 for(const key of ['background','mimi']){
  await page.locator(`[data-art="${key}"]`).setInputFiles({name:key+'.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.waitForFunction(label=>document.querySelector('.art-picker-status').textContent.startsWith(label)&&document.querySelector('.art-picker-status').textContent.includes('disimpan pada pelayar ini'), key==='background'?'Latar':'Mimi');
  if(key==='background') assert.equal(await page.locator('svg.mimi').isVisible(),false);
 }
 assert.equal(await page.locator('.workspace.original-background').count(),1);
 assert.equal(await page.locator('img.original-mimi').count(),1);
 assert.equal(await page.locator('svg.mimi').count(),0);
 await page.reload();await page.waitForSelector('img.original-mimi');
 assert.equal(await page.locator('.workspace.original-background').count(),1);
 assert(await page.locator('img.original-mimi').evaluate(img=>img.complete&&img.naturalWidth===16));
 await page.getByRole('button',{name:'MULA MISI',exact:true}).click();await page.locator('[data-answer="dengan"]').click();
 assert.equal(await page.locator('.feedback.is-correct').count(),1);
 await page.goto(address);await page.waitForSelector('img.original-mimi');
 assert.equal(await page.locator('.art-picker').count(),0);
 assert.deepEqual(errors,[]);
 // Public repository artwork works in a clean student browser, without local saved images.
 const student=await browser.newPage();
 await student.route('**/test-landscape.png',route=>route.fulfill({contentType:'image/png',body:Buffer.from(png,'base64')}));
 await student.addInitScript(()=>{window.MIMI_UPLOADED_PNGS=['/test-landscape.png']});
 await student.goto(address);
 // The square fixture is intentionally treated as a Mimi portrait.
 await student.waitForSelector('img.original-mimi');
 assert.equal(await student.locator('svg.mimi').count(),0);
 console.log('PASS unchanged PNG selection, image decoding, persistence, quiz interaction, hidden student controls, public artwork loading.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
