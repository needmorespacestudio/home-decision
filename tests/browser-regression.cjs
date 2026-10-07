const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 fs.mkdirSync('work',{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const base=process.argv[2]||'http://127.0.0.1:4173';const results=[];
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.goto(base);
  for(const mode of ['quick','detailed']){
   await page.getByRole('button',{name:mode==='quick'?'แบบง่าย':'แบบละเอียด',exact:false}).first().click();
   const n=mode==='quick'?8:14;
   for(let step=0;step<n;step++){
    const key=await page.evaluate(()=>getQs()[i][0]);
    if(key==='area')await page.locator('#box input').fill('15');
    else if(key==='people')await page.locator('#box input').fill('2');
    else if(key==='specialNeeds'){
     await page.locator('#box .opt').first().click();await page.getByRole('button',{name:'ไม่มีเป็นพิเศษ',exact:true}).click();
     assert.equal(await page.evaluate(()=>s.specialNeeds.length),0);
    }else if(key==='budget'){
     const context=await page.evaluate(()=>({min:marketContext().min,ceiling:marketContext().ceiling}));
     assert(context.min>0);assert(context.ceiling>=context.min);
     await page.getByRole('button',{name:'ไม่ล็อกงบ',exact:false}).click();assert.equal(await page.evaluate(()=>s.budgetMode),'unset');
     await page.getByRole('button',{name:'เน้นคุ้มที่สุด',exact:false}).click();assert.equal(await page.evaluate(()=>s.budgetMode),'value');
     await page.getByRole('button',{name:'อยากไม่เกิน',exact:false}).click();assert.equal(await page.locator('#budgetAmount').inputValue(),String(context.ceiling));
     await page.getByRole('button',{name:'กำหนดเพดานเอง',exact:true}).click();await page.locator('#budgetAmount').fill('10000');
    }else if(key==='priorities'){
     await page.getByRole('button',{name:'เงียบ',exact:true}).click();await page.getByRole('button',{name:'ประหยัดไฟ',exact:true}).click();await page.getByRole('button',{name:'ดีไซน์',exact:true}).click();
     await page.getByRole('button',{name:'เลื่อน ประหยัดไฟ ขึ้น',exact:true}).click();
     assert.equal(await page.evaluate(()=>s.priorities[0]),'saving');
    }else {
     const value={room:'bed',height:'2.7',sun:'shade',glass:'low',roof:'no',open:'closed',phase:'1',usage:'night',install:'wall'}[key];
     await page.locator('#box .opt').filter({hasText:({room:'ห้องนอน',height:'ประมาณ 2.7',sun:'แทบไม่โดน',glass:'น้อย',roof:'ไม่',open:'ห้องปิด',phase:'1 เฟส',usage:'กลางคืน',install:'ติดผนัง'})[key]}).first().click();
     continue;
    }
    await page.locator('#box .actions .btn').last().click();
   }
   await page.locator('#result').waitFor({state:'visible'});
   assert.equal(await page.locator('.mainRecommendation').count(),1);
   assert(await page.locator('.mainRecommendation .keyReasons li').count()<=4);
   assert.equal(await page.locator('.mainRecommendation .warning').count(),1);
   assert.equal(await page.locator('#result details[open]').count(),0);
   await page.locator('.mainRecommendation details summary').click();assert((await page.locator('.mainRecommendation details').innerText()).includes('Data Confidence'));await page.locator('.mainRecommendation details summary').click();
   assert.equal(await page.locator('input[type=range]').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(mode==='quick')await page.screenshot({path:`work/${viewport.width}-result.png`,fullPage:true});
   await page.locator('#budgetReality button').first().click();assert(await page.locator('.mainRecommendation .price').innerText());
   await page.locator('#budgetReality button').last().click();
   await page.getByRole('button',{name:'← ปรับข้อมูลห้อง',exact:true}).click();await page.getByRole('button',{name:'บันทึกและกลับ',exact:true}).click();
   await page.locator('.mainRecommendation>.btn').click();
   assert.equal(await page.locator('#manualCompare').getAttribute('open'),null);
   assert.equal(await page.locator('#quote input[type=file]').count(),2);
   await page.locator('#quoteFile').setInputFiles({name:'quote.txt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF test')});
   assert.equal(await page.locator('#manualCompare').getAttribute('open'),'');
   await page.locator('#quickQuotes input[type=number]').first().fill('20000');
   await page.getByRole('button',{name:'เช็ก Quote นี้',exact:true}).click();
   assert((await page.locator('#finalDecision').innerText()).includes('20,000'));
   const before=await page.locator('.quickQuote').count();await page.getByRole('button',{name:'+ เพิ่มร้าน',exact:true}).click();assert.equal(await page.locator('.quickQuote').count(),before+1);
   if(mode==='quick')await page.screenshot({path:`work/${viewport.width}-quote.png`,fullPage:true});
   await page.getByRole('button',{name:'กลับหน้าแรก',exact:true}).click();
   await page.evaluate(()=>{s.priorities=[];s.specialNeeds=[]});
   results.push(`${viewport.width}px ${mode}: Quick/Detailed Budget Top3 Result Quote passed`);
  }
  const checks=await page.evaluate(()=>{
   const old={...s};s={...s,area:15,room:'bed',usage:'night',sun:'shade',install:'wall',phase:'1',budgetMode:'ceiling',budgetAmount:1};
   const a=rankCandidates(load()).every(p=>p.type==='wall'&&(!p.phase||p.phase==='1')&&eligible(p,load()));
   s={...s,area:250,install:'cassette',phase:'3'};const c=marketContext();
   const b=c.min===null&&c.ceiling===null;
   const good=PRODUCTS.find(verifiedPrice),priceEvidence=verifiedPrice(good)&&!verifiedPrice({...good,price_url:null})&&!verifiedPrice({...good,price_checked_at:null})&&!verifiedPrice({...good,verified_fields:[]});
   finish();const fallback=document.querySelector('#result').textContent.includes('ตรวจหน้างาน');
   s=old;return {a,b,fallback,priceEvidence};
  });assert(checks.a&&checks.b&&checks.fallback&&checks.priceEvidence);assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log(results.join('\n'));fs.writeFileSync('work/regression-results.txt',results.join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
