'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hd-chrome-'));
const binary=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!binary)throw new Error('Chrome/Chromium required for real browser QA');
const proc=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-allow-origins=*','--remote-debugging-port=9229','--user-data-dir='+tmp,'about:blank'],{stdio:'ignore'});
const messages=new Map();let next=1,ws;
function send(method,params={}){const id=next++;return new Promise((resolve,reject)=>{messages.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(messages.has(id)){messages.delete(id);reject(new Error('CDP timeout: '+method))}},12000).unref()})}
async function expr(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result?.exceptionDetails)throw new Error(r.result.exceptionDetails.text+': '+(r.result.exceptionDetails.exception?.description||expression));return r.result.result?.value}
async function reset(){await expr("restartToWizard();flowMode='quick';render()")}
async function completeBase(){await expr("s.sun='morning';s.glass='low';s.overhead='room_above';s.people=2;s.usage='night';s.budgetMode='unset';s.priorities=['saving','quiet','price'];")}
async function run(){
 let targets;
 for(let n=0;n<55;n++){try{targets=await(await fetch('http://127.0.0.1:9229/json')).json();if(targets?.find(x=>x.type==='page')?.webSocketDebuggerUrl)break}catch(e){}await sleep(160)}
 assert(targets?.[0]?.webSocketDebuggerUrl,'Chrome CDP endpoint unavailable');
 ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 ws.onmessage=event=>{const j=JSON.parse(event.data);if(j.id&&messages.has(j.id)){const x=messages.get(j.id);messages.delete(j.id);j.error?x.reject(new Error(j.error.message)):x.resolve(j)}};
 await send('Page.enable');await send('Runtime.enable');
 for(const width of [390,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width===390});
  await send('Page.navigate',{url:'file://'+path.resolve('index.html')});await sleep(1700);
  assert.equal(await expr("document.querySelector('.hd-new-home')!==null"),true,'new home present '+JSON.stringify(await expr("({url:location.href,ready:document.readyState,title:document.title,body:document.body?.innerText?.slice(0,180)})")));
  assert.equal(await expr("document.documentElement.scrollWidth<=innerWidth+1"),true,'no horizontal overflow on '+width);
  await expr("startMode('quick')");
  await expr("hdCorePick('room','bed');hdCorePick('openDetail','closed');");
  await expr("next()");
  assert.equal(await expr("i"),1,'first quick page navigable');
  await expr("s.dimensionMode='area';s.area=16;hdCorePick('ceilingClass','normal');next()");
  assert.equal(await expr("i"),2,'size page navigable');
  await completeBase();
  await expr("next();next()");
  assert.equal(await expr("getQs()[i][0]"),'budget','simple room reaches preferences');
  await expr("next();next()");
  assert.equal(await expr("!result.classList.contains('hidden')"),true,'simple room shows result');
  assert.equal(await expr("!!result.querySelector('.hdV6Hero')||!!result.querySelector('.answerHero')"),true,'simple room result visible');
  const productCount=await expr("result.querySelectorAll('.hdV6Product').length");
  if(productCount){
   await expr("result.querySelector('.hdV6Product').click()");
   assert.equal(await expr("!!result.querySelector('.productDetail')"),true,'shortlist item opens its own product');
   await expr("finish()");
   assert.equal(await expr("!!result.querySelector('.hdV6Hero')"),true,'back from product restores result');
  }else{
   assert.equal(await expr("!!result.querySelector('.hdV6Next')||result.textContent.includes('ตรวจ')"),true,'no products yields honest next steps');
  }

  await reset();
  await expr("hdCorePick('room','ld');hdCorePick('openDetail','open');next();s.dimensionMode='area';s.area=50;hdCorePick('ceilingClass','normal');next()");
  await completeBase();
  await expr("next();next()");
  assert.equal(await expr("result.textContent.includes('เริ่มเปรียบเทียบจากรูปแบบติดตั้ง')"),true,'50sqm connected room handoff');
  assert.equal(await expr("result.querySelectorAll('.hdV6Product').length"),0,'no product shortlist for connected area');
  assert.equal(await expr("!!result.querySelector('details')"),true,'complex area retains decision brief');

  await expr("hdReturnToSurvey()");
  assert.equal(await expr("i===0 && s.area===50 && s.room==='ld' && !wiz.classList.contains('hidden')"),true,'edit restores answers');
  console.log('PASS chromium viewport '+width+'px: simple room result, connected-area gate, edit flow, no overflow');
 }
}
run().catch(e=>{console.error('FAIL browser MVP:',e);process.exitCode=1}).finally(()=>{ws?.close();proc.kill('SIGTERM');try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch(e){console.warn('Chrome temporary profile cleanup deferred:',e.code)}});
