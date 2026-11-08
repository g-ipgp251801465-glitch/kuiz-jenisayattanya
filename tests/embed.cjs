const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:850}});
 const address=process.env.TEST_URL||'http://localhost:5173';
 await page.setContent(`<iframe title="Permainan" src="${address}" width="960" height="540" style="border:0" allow="autoplay"></iframe>`);
 const frame=page.frameLocator('iframe');
 await frame.locator('.workspace').evaluate(el=>el.classList.add('original-background'));
 async function fits(label){await page.waitForTimeout(150);const size=await frame.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight}));assert(size.scrollW<=size.width&&size.scrollH<=size.height,`${label}: ${JSON.stringify(size)}`)}
 for(const [w,h] of [[960,540],[800,450]]){
  await page.locator('iframe').evaluate((el,{w,h})=>{el.width=w;el.height=h},{w,h});
  await fits('home');await frame.getByRole('button',{name:'ARAHAN',exact:true}).click();
  const close=await frame.getByRole('button',{name:'Tutup',exact:true}).boundingBox();assert(close);
  await frame.getByRole('button',{name:'Tutup',exact:true}).click();await frame.getByRole('button',{name:'Matikan bunyi',exact:true}).click();
  await frame.getByRole('button',{name:'MULA MISI',exact:true}).click();
  for(let i=0;i<5;i++){
   await fits(`question ${i+1}`);await frame.locator('[data-answer="tanpa"]').click();await fits(`feedback ${i+1}`);await frame.locator('[data-action="next"]').click();await frame.locator('.leave').waitFor({state:'detached'});
  }
  await fits('revision');
  await frame.getByRole('button',{name:'HALAMAN SETERUSNYA',exact:true}).click();await fits('outro after revision');
  await frame.getByRole('button',{name:'← Lihat skor semula',exact:true}).click();await fits('revision restored');
  await frame.getByRole('button',{name:'CUBA LAGI',exact:true}).click();
  for(const a of ['dengan','tanpa','dengan','tanpa','dengan']){await frame.locator(`[data-answer="${a}"]`).click();await frame.locator('[data-action="next"]').click();await frame.locator('.leave').waitFor({state:'detached'})}
  await fits('success');await frame.getByRole('button',{name:'HALAMAN SETERUSNYA',exact:true}).click();await fits('final outro');await frame.getByRole('button',{name:'Kembali ke halaman utama',exact:true}).click();
  await page.waitForTimeout(450);await page.screenshot({path:`.test-results/embed-${w}.png`});
  await frame.getByRole('button',{name:'Hidupkan bunyi',exact:true}).click();
  console.log(`PASS embedded ${w}x${h}: home, all questions and feedback, revision, success; no scrolling`);
 }
 console.log('Available browser voice languages:',await frame.locator('body').evaluate(()=>speechSynthesis.getVoices().map(v=>v.lang)));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
