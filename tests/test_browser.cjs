// Set NODE_PATH to a local Playwright installation. No vendor credentials needed.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const baseURL=process.env.BASE_URL||'http://127.0.0.1:8765';
const artifact=process.env.QA_DIR||'../../browser-qa';fs.mkdirSync(artifact,{recursive:true});
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});let checks=0;const errors=[];
 async function exercise(width,mode,room,area,install){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();
  await context.addInitScript(()=>{window.qaHDEvents=[];window.addEventListener('home-decision',e=>window.qaHDEvents.push(e.detail))});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  const response=await page.goto(baseURL);
  if(process.env.VERIFY_SOURCE==='1'){assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n'),'live release source differs from tested checkout');checks++}
  await page.getByRole('button',{name:mode==='quick'?'แบบง่าย':'แบบละเอียด',exact:false}).first().click();
  const answers={room,area,sun:'shade',usage:'night',install,phase:'1',height:'2.7',glass:'low',roof:'no',open:room==='ld'?'open':'closed',people:2,zoneUsage:'partial',shape:area>=40?'long':'compact',zoneControl:'yes',ceiling:install==='wall'?'no':'yes',outdoorSpace:'two'};
  for(let j=0;j<25;j++){
   if(await page.locator('#result').isVisible())break;
   const {key,options}=await page.evaluate(()=>({key:getQs()[i][0],options:getQs()[i][2]}));
   if(['area','people'].includes(key)){await page.locator('#box input').fill(String(answers[key]));await page.locator('#box').getByRole('button',{name:'ต่อไป',exact:true}).click()}
   else if(key==='specialNeeds'){await page.locator('#box').getByRole('button',{name:'ไม่มีเป็นพิเศษ',exact:true}).click();await page.locator('#box').getByRole('button',{name:'ต่อไป',exact:true}).click()}
   else if(key==='budget'){await page.locator('#box').getByRole('button',{name:'ไม่ล็อกงบ',exact:false}).click();await page.locator('#box').getByRole('button',{name:'ต่อไป',exact:true}).click()}
   else if(key==='priorities'){for(const text of ['ค่าไฟประหยัด','เงียบ','คุ้มค่า']){const button=page.locator('#box .pchip').filter({hasText:text});if(await button.count())await button.first().click()}
    // Select by existing priority keys when copy differs; each action remains a real click.
    if(await page.evaluate(()=>s.priorities.length)!==3){await page.evaluate(()=>{s.priorities=[];render()});for(const key of ['saving','quiet','price'])await page.locator('#box .pchip[onclick="toggleP(\''+key+'\')"]').click()}
    await page.locator('#box').getByRole('button',{name:'ดูผลลัพธ์',exact:true}).click();
   }else {const option=options.find(o=>o[0]===answers[key])||options[0];await page.locator('#box .opt').filter({hasText:option[1]}).first().click()}
  }
  assert(await page.locator('#result').isVisible());checks++;
  assert(await page.locator('#result h1').innerText());checks++;
  const initialEvents=await page.evaluate(()=>window.qaHDEvents);for(const name of ['flow_started','flow_mode_selected','step_viewed','step_answered','flow_completed','result_shown','recommended_setup_type']){assert(initialEvents.some(e=>e.event===name),name);checks++}
  await page.locator('#hdFeedback').getByRole('button',{name:'😐 พอใช้',exact:true}).click();assert(await page.locator('#hdFeedback').getByRole('button',{name:'ข้อมูลเยอะไป',exact:true}).isVisible());checks++;
  assert(!(await page.locator('#hdFeedback textarea').count()));checks++;
  await page.locator('#hdFeedback').getByRole('button',{name:'อื่น ๆ',exact:true}).click();await page.locator('#hdFeedback textarea').fill('synthetic optional note');checks++;
  assert(!(await page.evaluate(()=>JSON.stringify(window.qaHDEvents))).includes('synthetic optional note'));checks++;
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert(!overflow,'horizontal overflow');checks++;
  if(width>600){const rect=await page.locator('#result').boundingBox();assert(rect.width<600&&Math.abs((rect.x+rect.width/2)-width/2)<5);checks++}
  await page.screenshot({path:artifact+'/'+mode+'-'+width+'-'+area+'-setup.png',fullPage:false});
  await page.getByRole('button',{name:'ดูรุ่นที่เหมาะกับแบบนี้',exact:false}).click();assert(await page.locator('#setupProducts').isVisible());checks++;
  const detail=page.locator('#setupProducts').getByRole('button',{name:'ดูรุ่นนี้',exact:true});
  if(await detail.count()){
   await detail.first().click();assert(await page.locator('.productDetail').isVisible());checks++;
   const official=page.getByRole('link',{name:'ดูเว็บทางการ',exact:true});assert((await official.getAttribute('href')).startsWith('https://'));checks++;
   await page.getByRole('button',{name:'ใช้รุ่นนี้ไปถามราคา',exact:false}).click();assert(await page.locator('#quote').isVisible());checks++;
   assert((await page.locator('#quote').innerText()).includes('ร้าน'));checks++;
  }
  // Verify complete brief and local manual fallback without sending any data.
  const brief=await page.evaluate(()=>briefText());assert(brief.includes('แบบติดตั้งเบื้องต้น'));checks++;
  await page.evaluate(()=>finish());
  const alternative=page.getByRole('button',{name:'เปรียบเทียบกับแบบที่เลือก',exact:true});
  if(await alternative.count()){await alternative.first().click();assert(await page.locator('#setupCompare').isVisible());checks++;await page.getByRole('button',{name:'เลือกแบบนี้และดูรุ่น',exact:true}).click();assert(await page.locator('#setupProducts').isVisible());checks++}
  if(room==='ld'){
   const gap=await page.evaluate(()=>{s.budgetMode='ceiling';s.budgetAmount=1;finish();return document.getElementById('budgetReality').textContent});assert(gap.includes('งบค่าเครื่อง'));checks++;
   for(const budgetMode of ['value','unset']){await page.evaluate(mode=>{s.budgetMode=mode;finish()},budgetMode);assert(await page.locator('#budgetReality').isVisible());checks++}
   await page.evaluate(()=>{s.specialNeeds=['dust','noise'];s.priorities=['quiet','saving','price'];finish()});assert((await page.locator('#result').innerText()).includes('ต้อง'));checks++;
   await page.evaluate(()=>{setupProductsOpen=true;finish()});
   const fallback=await page.evaluate(()=>{const root=document.getElementById('setupProducts');const img=root.querySelector('.productimg img');if(img)img.dispatchEvent(new Event('error'));return root.textContent.includes('ยังไม่มีรูป')});assert(fallback);checks++;
   await page.getByRole('button',{name:'ปรับข้อมูลห้อง',exact:false}).click();assert(await page.locator('#advanced').isVisible());checks++;
   await page.locator('#advZoneShare').selectOption('0.6');await page.getByRole('button',{name:'บันทึกและกลับ',exact:true}).click();assert(await page.locator('#result').isVisible());checks++;
  }
  await context.close();
 }
 if(process.env.PWA_ONLY!=='1'){await exercise(390,'quick','bed',18,'any');await exercise(390,'quick','ld',50,'any');await exercise(390,'detailed','living',30,'wall');await exercise(1440,'quick','ld',50,'any')}
 const pwaContext=await browser.newContext({viewport:{width:390,height:844}}),pwaPage=await pwaContext.newPage();
 await pwaContext.addInitScript(()=>{if(!sessionStorage.getItem('qaSeededOldCache')){sessionStorage.setItem('qaSeededOldCache','1');const oldCache=caches.open('home-decision-v4-catalog-sprint1');const register=navigator.serviceWorker.register.bind(navigator.serviceWorker);navigator.serviceWorker.register=(...args)=>oldCache.then(()=>register(...args))}});
 await pwaPage.goto(baseURL);
 await pwaPage.evaluate(async()=>{await navigator.serviceWorker.ready});
 await pwaPage.waitForFunction(async()=>!(await caches.keys()).includes('home-decision-v4-catalog-sprint1'));checks++;
 await pwaPage.reload();await pwaPage.waitForFunction(()=>navigator.serviceWorker.controller!==null);checks++;
 await pwaPage.waitForFunction(async()=>Boolean(await caches.match('/')));checks++;
 console.log('PWA evidence '+JSON.stringify(await pwaPage.evaluate(async()=>({controller:navigator.serviceWorker.controller.scriptURL,cache_names:await caches.keys(),cached_shell:!!(await caches.match('/'))}))));
 // Test navigation as an installed PWA starts offline; browser hard-reload can bypass SW.
 await pwaContext.setOffline(true);await pwaPage.goto(baseURL+'/?qa_offline=1');assert(await pwaPage.getByRole('button',{name:'แบบง่าย',exact:false}).first().isVisible());checks++;
 await pwaPage.getByRole('button',{name:'แบบง่าย',exact:false}).first().click();assert(await pwaPage.locator('#wiz').isVisible());checks++;
 await pwaContext.close();
 assert.deepEqual(errors,[]);checks++;
 await browser.close();console.log(checks+' browser checks passed at '+baseURL);fs.writeFileSync(artifact+'/result.json',JSON.stringify({baseURL,checks,page_errors:errors},null,2));
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
