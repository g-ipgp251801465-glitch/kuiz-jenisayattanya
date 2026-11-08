const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 await page.addInitScript(()=>{
  window.__audioTimeline=[];window.__playedClips=[];
  const Original=window.Audio;
  window.Audio=function(url){
   const audio=new Original(url);
   audio.addEventListener('playing',()=>{window.__audioTimeline.push('playing');window.__playedClips.push(url)});
   audio.addEventListener('ended',()=>window.__audioTimeline.push('ended'));
   audio.addEventListener('error',()=>window.__audioTimeline.push('error'));
   return audio;
  };
  window.Audio.prototype=Original.prototype;
  speechSynthesis.speak=u=>window.__audioTimeline.push(u.text);
 });
 await page.goto(process.env.TEST_URL||'http://localhost:5173');
 await page.getByRole('button',{name:'ARAHAN',exact:true}).click();
 await page.locator('dialog').getByRole('button',{name:'MULA MISI',exact:true}).click();
 await page.waitForFunction(()=>window.__audioTimeline.includes('Jom kita mulakan! Baca ayat dan pilih jenis ayat tanya.'));
 await page.locator('[data-answer="dengan"]').click();
 await page.waitForFunction(()=>window.__audioTimeline.includes('Yeay! Kamu hebat! Jawapan kamu betul!'));
 let timeline=await page.evaluate(()=>window.__audioTimeline);
 assert.equal(timeline[timeline.indexOf('Yeay! Kamu hebat! Jawapan kamu betul!')-1],'ended');
 await page.locator('[data-action="next"]').click();await page.locator('.leave').waitFor({state:'detached'});
 await page.locator('[data-answer="dengan"]').click();
 await page.waitForFunction(()=>window.__audioTimeline.includes('Alaaa... tak mengapa! Jom kita lihat jawapan yang betul!'));
 timeline=await page.evaluate(()=>window.__audioTimeline);
 assert.equal(timeline[timeline.indexOf('Alaaa... tak mengapa! Jom kita lihat jawapan yang betul!')-1],'ended');
 const samples=await page.evaluate(async()=>{
  const context=new OfflineAudioContext(1,44100,44100);
  const unique=[...new Set(window.__playedClips)];
  return Promise.all(unique.map(async url=>{
   const bytes=await (await fetch(url)).arrayBuffer();
   const buffer=await context.decodeAudioData(bytes);
   const data=buffer.getChannelData(0);
   return {peak:Math.max(...data.map(Math.abs)),rms:Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length),duration:buffer.duration};
  }));
 });
 assert(samples.length>=3);for(const s of samples){assert(s.peak>.4);assert(s.rms>.15)}
 const before=await page.locator('.score-chip strong').innerText();
 await page.getByRole('button',{name:'Uji bunyi',exact:true}).click();await page.waitForTimeout(1000);
 assert.equal(await page.locator('.score-chip strong').innerText(),before);
 await page.getByRole('button',{name:'Matikan bunyi',exact:true}).click();
 const count=await page.evaluate(()=>window.__playedClips.length);
 await page.locator('[data-action="next"]').click();await page.locator('.leave').waitFor({state:'detached'});await page.locator('[data-answer="dengan"]').click();await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>window.__playedClips.length),count);
 assert.equal(await page.locator('#audio-status').innerText(),'');
 console.log('PASS real native-audio playing/ended events, audible WAV signal, correct/wrong distinction, speech after chime, mute, sound-test without scoring. Signal:',samples);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
