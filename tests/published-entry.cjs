const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const root=fs.readFileSync('preview/pages/index.html','utf8');
 const app=fs.readFileSync('preview/pages/play/index.html','utf8')
   .replace(/^---[\s\S]*?---\n/,'')
   .replace(/<script>window\.MIMI_UPLOADED_PNGS = \[[\s\S]*?\];<\/script>/,'<script>window.MIMI_UPLOADED_PNGS = [];</script>');
 const server=http.createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/kuiz-jenisayattanya/'||path==='/kuiz-jenisayattanya/play/'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(path.endsWith('/play/')?app:root);
  }else{res.writeHead(404);res.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({reducedMotion:'reduce'});
 const address=`http://127.0.0.1:${server.address().port}/kuiz-jenisayattanya/`;
 await page.goto(address+'?old-link=1');
 await page.waitForURL('**/play/?old-link=1');
 assert.equal(await page.locator('.pass-badge').innerText(),'LULUS: 4/5');
 await page.getByRole('button',{name:'Matikan bunyi',exact:true}).click();
 const answers=['dengan','tanpa','dengan','tanpa','dengan'];
 for(const target of [3,4]){
  await page.getByRole('button',{name:target===3?'MULA MISI':'CUBA LAGI',exact:true}).click();
  for(let i=0;i<5;i++){
   await page.locator(`[data-answer="${i<target?answers[i]:answers[i]==='dengan'?'tanpa':'dengan'}"]`).click();
   await page.locator('[data-action="next"]').click();await page.locator('.leave').waitFor({state:'detached'});
  }
  assert.equal(await page.locator('.result-score>strong').innerText(),`${target} / 5`);
  assert.equal(await page.locator('[data-action="activity-outro"]').count(),target===4?1:0);
 }
 await page.getByRole('button',{name:'HALAMAN SETERUSNYA',exact:true}).click();
 assert.equal(await page.locator('.outro-heading').innerText(),'Tahniah!');
 console.log('PASS generated Pages entry: old root redirects to /play/ with query preserved; visible 4/5 marker; 3/5 blocked; 4/5 continues.');
 await browser.close();await new Promise(resolve=>server.close(resolve));
})().catch(e=>{console.error(e);process.exit(1)});
