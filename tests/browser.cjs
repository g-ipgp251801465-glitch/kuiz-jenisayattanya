const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
fs.mkdirSync('.test-results', {recursive:true});
(async () => {
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.goto((process.env.TEST_URL || 'http://localhost:5173')); await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(500);
 await page.screenshot({path:'.test-results/home-desktop.png'});
 const sentences=['Apakah fungsi komputer?','Kamu menggunakan komputer?','Di manakah bilik komputer?','Komputer itu milik kamu?','Siapakah yang menggunakan komputer itu?'];
 const correct=['dengan','tanpa','dengan','tanpa','dengan'];
 const explanations=["Ayat ini menggunakan kata tanya 'apakah' untuk menanyakan sesuatu perkara.",'Ayat ini tidak menggunakan kata tanya. Pertanyaan disampaikan melalui intonasi dan diakhiri dengan tanda soal (?).',"Ayat ini menggunakan kata tanya 'di manakah' untuk menanyakan tempat.",'Ayat ini tidak menggunakan kata tanya. Pertanyaan disampaikan melalui intonasi dan diakhiri dengan tanda soal (?).',"Ayat ini menggunakan kata tanya 'siapakah' untuk menanyakan orang."];
 await page.getByRole('button',{name:'ARAHAN',exact:true}).click();
 assert(await page.locator('dialog').evaluate(d=>d.open));
 assert((await page.locator('dialog').innerText()).includes('Setiap jawapan yang betul mendapat satu markah.'));
 await page.getByRole('button',{name:'Tutup',exact:true}).click();
 await page.getByRole('button',{name:'Matikan bunyi',exact:true}).click();
 assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 for(let target=0;target<=5;target++) {
  if(target===0) await page.getByRole('button',{name:'MULA MISI',exact:true}).click();
  else await page.getByRole('button',{name:'CUBA LAGI',exact:true}).click();
  assert.equal(await page.locator('.score-chip strong').innerText(),'0 / 5');
  assert.equal(await page.locator('.sentence-panel p').innerText(),sentences[0]);
  assert.equal(await page.locator('[data-answer]:disabled').count(),0);
  assert.equal(await page.locator('.particles i').count(),0);
  assert.equal(await page.locator('.reaction-badge svg').count(),0);
  for(let i=0;i<5;i++) {
   assert.equal(await page.locator('.sentence-panel p').innerText(),sentences[i]);
   let choice=i<target?correct[i]:correct[i]==='dengan'?'tanpa':'dengan';
   await page.locator(`[data-answer="${choice}"]`).click();
   assert.equal(await page.locator('[data-answer]:disabled').count(),2);
   const score=await page.locator('.score-chip strong').innerText();
   await page.locator(`[data-answer="${choice}"]`).dispatchEvent('click');
   assert.equal(await page.locator('.score-chip strong').innerText(),score);
   assert.equal(await page.locator('.feedback p:last-child').innerText(),explanations[i]);
   if(target===5 && i===0) { await page.waitForTimeout(450); await page.screenshot({path:'.test-results/correct-desktop.png'}); }
   await page.locator('[data-action="next"]').click();
   await page.locator('.leave').waitFor({state:'detached'});
  }
  assert.equal(await page.locator('.result-score>strong').innerText(),`${target} / 5`);
  assert.equal(await page.locator(target>=3?'.success-ending':'.revision-ending').count(),1);
  if(target===2) {
   assert.equal(await page.locator('.scene.sad').count(),1);
   await page.waitForTimeout(2100);
   assert.equal(await page.locator('.scene.sad').count(),0);
   await page.screenshot({path:'.test-results/revision-desktop.png'});
  }
  console.log(`PASS browser score ${target}/5, locked answers, exact explanations, reset`);
 }
 assert.equal(await page.locator('[data-action="continue"]').count(),0);
 assert.equal(await page.locator('.next-activity-note').innerText(),'Seterusnya, teruskan dengan aktiviti yang lain.');
 await page.getByRole('button',{name:'Kembali ke halaman utama',exact:true}).click();
 for(const [width,height] of [[1366,768],[1024,768],[800,600],[960,540],[800,450],[390,844],[320,700]]) {
  await page.setViewportSize({width,height}); await page.waitForTimeout(120);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width>=800) assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),`vertical overflow at ${width}x${height}`);
  await page.screenshot({path:`.test-results/home-${width}.png`});
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'MULA MISI',exact:true}).click();
 await page.locator('[data-answer="dengan"]').click();
 await page.screenshot({path:'.test-results/mobile-feedback.png',fullPage:true});
 // Audio gesture actually creates a running Web Audio context and speech request.
 await page.addInitScript(()=>{
  window.__audioCalls=0;window.__speechCalls=[];window.__currentSpeech=null;
  window.speechSynthesis.cancel=()=>{window.__currentSpeech=null};
  const Original=window.Audio;
  window.Audio=function(...args){window.__audioCalls++;return new Original(...args)};
  window.Audio.prototype=Original.prototype;
  window.speechSynthesis.speak=(u)=>{window.__currentSpeech=u.text;window.__speechCalls.push({text:u.text,lang:u.lang})};
 });
 await page.reload();
 await page.getByRole('button',{name:'ARAHAN',exact:true}).click();
 await page.locator('dialog').getByRole('button',{name:'MULA MISI',exact:true}).click();
 await page.waitForFunction(()=>window.__currentSpeech==='Jom kita mulakan! Baca ayat dan pilih jenis ayat tanya.');
 await page.locator('[data-answer="dengan"]').click();
 await page.waitForFunction(()=>window.__speechCalls.some(s=>s.text==='Yeay! Kamu hebat! Jawapan kamu betul!'));
 const audio=await page.evaluate(()=>({audio:window.__audioCalls, speech:window.__speechCalls}));
 assert.equal(audio.audio,2); assert(audio.speech.some(s=>s.text==='Yeay! Kamu hebat! Jawapan kamu betul!' && s.lang==='ms-MY'));
 await page.getByRole('button',{name:'Matikan bunyi',exact:true}).click();
 const count=await page.evaluate(()=>window.__speechCalls.length);
 await page.locator('[data-action="next"]').click();
   await page.locator('.leave').waitFor({state:'detached'});
 await page.locator('[data-answer="dengan"]').click();
 assert.equal(await page.evaluate(()=>window.__speechCalls.length),count);
 assert.deepEqual(errors,[]);
 console.log('PASS instructions, sound toggle, native media audio, Malay TTS calls, final activity message, responsive layouts; no page errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
