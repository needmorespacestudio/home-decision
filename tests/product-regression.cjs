const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv[2]||'http://127.0.0.1:4173');
  await page.evaluate(()=>{s={...s,area:15,room:'bed',usage:'night',sun:'shade',install:'wall',phase:'1',priorities:['saving','quiet','design'],budgetMode:'value'};finish()});
  await page.locator('.alternatives>summary').click();
  const ids=await page.evaluate(()=>lastTop.map(p=>p.id));assert(ids.length>1);
  for(const [index,id] of ids.entries()){
   const card=page.locator('.recommendation').nth(index);
   await card.getByRole('button',{name:'ดูรุ่นนี้',exact:true}).waitFor({state:'visible'});
   const link=card.getByRole('link',{name:'ดูเว็บทางการ',exact:true});assert(await link.isVisible());assert.equal(await link.getAttribute('target'),'_blank');assert((await link.getAttribute('rel')).includes('noopener'));
   assert(await card.locator('.productimg').isVisible());
   assert.equal(await card.locator('.productLinks a').count(),await page.evaluate(id=>verifiedPrice(PRODUCTS.find(p=>p.id===id))?2:1,id));
  }
  await page.locator('.mainRecommendation').getByRole('button',{name:'ดูรุ่นนี้',exact:true}).click();
  assert(await page.locator('.productDetail').isVisible());
  assert((await page.locator('.productDetail .model').innerText()).length>0);
  const official=page.locator('.productDetail').getByRole('link',{name:'ดูเว็บทางการ',exact:true});
  const destination=await official.getAttribute('href');
  const popupPromise=page.waitForEvent('popup');await official.click();const popup=await popupPromise;
  await popup.waitForURL(destination,{waitUntil:'commit'});assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close();
  for(const id of await page.evaluate(()=>PRODUCTS.map(p=>p.id))){
   await page.evaluate(id=>showProductDetail(id),id);
   const d=page.locator('.productDetail');assert(await d.locator('.productimg').isVisible());assert(await d.getByRole('link',{name:'ดูเว็บทางการ',exact:true}).isVisible());
   const count=await d.locator('.keyReasons li').count();assert(count>=2&&count<=4);assert.equal(await d.locator('.warning').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.route('https://image-fallback.test/**',r=>r.abort());
  await page.evaluate(()=>{PRODUCT_IMAGES[PRODUCTS[0].id]='https://image-fallback.test/broken.png';showProductDetail(PRODUCTS[0].id)});
  await page.locator('.detailImage .imgph').waitFor();assert.equal(await page.locator('.detailImage img').count(),0);assert((await page.locator('.detailImage').innerText()).includes('ยังไม่มีรูปที่ยืนยันได้สำหรับรุ่นนี้'));
  await page.evaluate(()=>{delete PRODUCT_IMAGES[PRODUCTS[0].id];finish()});
  const box=await page.locator('.wrap').boundingBox();assert(box.width<=460);assert(Math.abs(box.x-(width-box.width)/2)<2);
  assert.deepEqual(errors,[]);await page.screenshot({path:`work/${width}-product-result.png`,fullPage:true});
  console.log(`${width}px: all seed details, recommendation links, verified-price gating, broken-image fallback, centered mobile layout PASS`);await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
