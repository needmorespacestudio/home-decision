(function(){
'use strict';

const V='3.0-residential';
const baseGetQs=getQs;
const baseRender=render;
const basePick=pick;
const baseNext=next;
const baseRestart=restartToWizard;
const baseSiteFlags=siteFlags;
const baseConfigurationResult=configurationResult;
const baseRecommendationCard=recommendationCard;
const baseRenderProductDetail=renderProductDetail;
const baseTrackHD=trackHD;
const baseConfigurationQuestions=configurationQuestions;

const ROOM_OPTS=[
 ['bed','ห้องนอน'],
 ['living','ห้องนั่งเล่น'],
 ['ld','ห้องนั่งเล่น + กินข้าว / Open plan ในบ้าน'],
 ['other','ห้องอื่นในบ้าน — ระบบจะบอกว่าต้องตรวจอะไรเพิ่ม']
];
const SUN_OPTS=[
 ['shade','แทบไม่โดนแดด / มีตึกหรือต้นไม้บัง'],
 ['morning','โดนแดดช่วงเช้า'],
 ['afternoon','โดนแดดแรงช่วงบ่าย–เย็น'],
 ['all','โดนแดดแรงหลายช่วง'],
 ['unknown','ไม่แน่ใจ']
];
const GLASS_OPTS=[
 ['low','หน้าต่างเล็ก 1–2 บาน / กระจกน้อย'],
 ['medium','กระจกประมาณ 1/4–1/2 ของผนัง'],
 ['high','กระจกบานใหญ่ เกินครึ่งผนัง'],
 ['full','เกือบเต็มผนัง / ประตูกระจกบานใหญ่'],
 ['unknown','ไม่แน่ใจ']
];
const OVERHEAD_OPTS=[
 ['room_above','มีห้องหรือชั้นอื่นอยู่ด้านบน'],
 ['roof','ชั้นบนสุด มีหลังคาบ้านอยู่ด้านบน'],
 ['deck','ชั้นบนสุด / ดาดฟ้าปูนอยู่ด้านบน'],
 ['unknown','ไม่แน่ใจ']
];
const OPEN_OPTS=[
 ['closed','ปิดประตูได้ เป็นห้องเดี่ยว'],
 ['partial','มีประตู แต่บางครั้งเปิดเชื่อมพื้นที่อื่น'],
 ['open','เปิดโล่งต่อกับ Living / Dining / ทางเดิน'],
 ['stair','เปิดโล่งถึงบันไดหรือโถงสูง'],
 ['outdoor','มีประตูออกนอกบ้านที่เปิดบ่อย'],
 ['unknown','ไม่แน่ใจ']
];
const HEIGHT_OPTS=[
 ['normal','ปกติ ประมาณ 2.4–3.0 ม.'],
 ['high','สูงกว่าปกติ ประมาณ 3.0–4.0 ม.'],
 ['double','สูงมาก / Double volume / มองเห็นชั้นสอง'],
 ['unknown','ไม่แน่ใจ']
];
const STAGE2=[
 ['specialNeeds','มีเรื่องอะไรให้คำนึงเป็นพิเศษ?',null],
 ['budget','งบประมาณของคุณ',null],
 ['priorities','สำหรับคุณ อะไรสำคัญที่สุด?',null]
];

function ensure(){
 if(!s||typeof s!=='object')return;
 const defaults={
  width:null,length:null,dimensionMode:'dimensions',openDetail:null,overhead:null,
  ceilingClass:null,roofInsulation:null,roofType:null,shading:null,connectedArea:null,
  kitchenUse:null,shapeDetail:null,adaptiveOverflow:false,phase:s.phase||'unknown',
  install:s.install||'any',ceiling:s.ceiling||'unknown',zoneUsage:s.zoneUsage||null,
  specialNeeds:s.specialNeeds||[],needsAnswered:Boolean(s.needsAnswered),priorities:s.priorities||[]
 };
 for(const [k,v] of Object.entries(defaults))if(s[k]===undefined)s[k]=v;
}

function derive(){
 ensure();
 if(Number(s.width)>0&&Number(s.length)>0){
  s.area=Math.round(Number(s.width)*Number(s.length)*10)/10;
  const a=Math.max(Number(s.width),Number(s.length)),b=Math.min(Number(s.width),Number(s.length));
  if(b>0&&a>=7&&a/b>=2){s.shape='long';s.shapeDetail='long'}
  else if(!s.shapeDetail){s.shape='compact';s.shapeDetail='compact'}
 }
 const o=s.openDetail;
 s.open=o==='closed'?'closed':o==='partial'?'partial':['open','stair','outdoor'].includes(o)?'open':o==='unknown'?'unknown':(s.open||'unknown');
 const oh=s.overhead;
 s.roof=oh==='room_above'?'no':['roof','deck'].includes(oh)?'yes':oh==='unknown'?'unknown':(s.roof||'unknown');
 const h=s.ceilingClass;
 if(h==='normal')s.height=2.7;
 else if(h==='high')s.height=3.4;
 else if(h==='double')s.height=4.2;
 else if(h==='unknown'&&!Number.isFinite(Number(s.height)))s.height=2.7;
 if(s.glass==='full')s.glass='high';
}

function coreQuestions(){
 return [
  ['room','ห้องนี้ใช้ทำอะไรเป็นหลัก?',ROOM_OPTS],
  ['dimensions','ห้องกว้าง × ยาวประมาณเท่าไร?',null],
  ['openDetail','เวลาเปิดแอร์ ปิดห้องได้มิดไหม?',OPEN_OPTS],
  ['sun','ช่วงบ่าย แดดส่องโดนห้องนี้ไหม?',SUN_OPTS],
  ['glass','ผนังฝั่งที่โดนแดด มีกระจกมากแค่ไหน?',GLASS_OPTS],
  ['overhead','เหนือเพดานห้องนี้เป็นอะไร?',OVERHEAD_OPTS],
  ['ceilingClass','เพดานห้องนี้สูงแค่ไหน?',HEIGHT_OPTS],
  ['people','ปกติมีกี่คน และเปิดแอร์ช่วงไหน?',null]
 ];
}

function adaptiveQuestions(){
 derive();
 const all=[];
 if(['roof','deck'].includes(s.overhead)){
  all.push(['roofInsulation','เหนือฝ้าหรือใต้หลังคามีฉนวนกันความร้อนไหม?',[
   ['yes','มี'],['no','ไม่มี'],['unknown','ไม่แน่ใจ']
  ]]);
  if(s.overhead==='roof'&&['no','unknown'].includes(s.roofInsulation))all.push(['roofType','หลังคาบ้านเป็นแบบไหน?',[
   ['tile','กระเบื้อง'],['metal','แผ่นเหล็ก / เมทัลชีท'],['unknown','ไม่แน่ใจ']
  ]]);
 }
 if(['afternoon','all'].includes(s.sun)&&s.glass==='high')all.push(['shading','กระจกด้านที่โดนแดด มีอะไรช่วยบังแดดไหม?',[
  ['good','มีม่านทึบ / ฟิล์ม / กันสาด / ตึกหรือต้นไม้ช่วยบัง'],
  ['none','ไม่มี'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 if(['partial','open','stair','outdoor'].includes(s.openDetail))all.push(['connectedArea','พื้นที่ที่เปิดเชื่อมเพิ่มอีกประมาณกี่ ตร.ม.?',null]);
 if(s.room==='ld')all.push(['kitchenUse','พื้นที่นี้เชื่อมกับครัวที่ทำอาหารแบบไหน?',[
  ['none','ไม่มีครัว / มีแค่แพนทรี'],
  ['light','อุ่นอาหาร ต้ม หรือผัดเบา ๆ บางครั้ง'],
  ['heavy','ผัด–ทอด / ทำอาหารไทยเป็นประจำ'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 const ratio=(Number(s.width)>0&&Number(s.length)>0)?Math.max(s.width,s.length)/Math.min(s.width,s.length):0;
 if((Number(s.area)>=30||ratio>=1.7)&&!s.shapeDetail)all.push(['shapeDetail','รูปทรงห้องเป็นแบบไหน?',[
  ['compact','สี่เหลี่ยมทั่วไป มองเห็นทั่วถึง'],
  ['long','ยาวและลึกมาก'],
  ['lshape','รูปตัว L / มีซอกมุม'],
  ['connected','หลายส่วนเชื่อมกัน'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 // Keep the user-facing branch short. More than four risk questions means the room itself is complex.
 s.adaptiveOverflow=all.length>4;
 return all.slice(0,4);
}

function safeLoadHigh(){
 try{return Number(load()?.high)||0}catch(e){return 0}
}

function configQs(){
 derive();
 const q=[];
 const large=Number(s.area)>=35||s.room==='ld'||s.open==='open'||['long','lshape','connected'].includes(s.shapeDetail);
 if(large)q.push(['zoneUsage','ปกติใช้พื้นที่ทั้งหมดพร้อมกันไหม?',[
  ['together','ใช้พร้อมกันเกือบตลอด'],
  ['partial','บางครั้งใช้แค่บางโซน'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 if(Number(s.area)>=35&&s.ceilingClass!=='double')q.push(['ceiling','มีฝ้าเรียบที่เปิดตรวจพื้นที่เหนือฝ้าได้ไหม?',[
  ['yes','มี ให้ช่างตรวจระยะเหนือฝ้าได้'],
  ['no','ไม่มี / เจาะฝ้าไม่ได้'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 if(safeLoadHigh()>=24000||Number(s.area)>=35)q.push(['phase','ทราบระบบไฟของบ้านไหม?',[
  ['unknown','ไม่แน่ใจ — ให้ช่างตรวจ'],
  ['1','1 เฟส 220V'],
  ['3','3 เฟส']
 ]]);
 return q;
}

function quickQuestions(){return [...coreQuestions(),...adaptiveQuestions(),...configQs(),...STAGE2]}

getQs=function(){
 ensure();
 if(flowMode==='quick')return quickQuestions();
 // Detailed mode stays available, but v1 scope remains residential by removing office.
 const base=baseGetQs().map(q=>q[0]==='room'?['room',q[1],ROOM_OPTS]:q).filter(q=>q[0]!=='install');
 return base;
};

function hdSetDimensionMode(mode){ensure();s.dimensionMode=mode==='area'?'area':'dimensions';render()}
function hdSetDim(k,v){ensure();s[k]=Number(v)||null;derive()}
window.hdSetDimensionMode=hdSetDimensionMode;
window.hdSetDim=hdSetDim;

function dimensionsHTML(){
 ensure();
 return `<p class="muted">กว้าง × ยาวช่วยให้ระบบรู้ทั้งพื้นที่และรูปทรงห้อง ถ้ารู้แค่ ตร.ม. ก็ใช้ได้</p>
 <div class="modeSwitch"><button class="${s.dimensionMode==='dimensions'?'on':''}" onclick="hdSetDimensionMode('dimensions')">กรอกกว้าง × ยาว</button><button class="${s.dimensionMode==='area'?'on':''}" onclick="hdSetDimensionMode('area')">รู้พื้นที่ ตร.ม.</button></div>
 ${s.dimensionMode==='area'?`<label>พื้นที่ (ตร.ม.)</label><input type="number" min="5" max="250" step=".5" value="${s.area||''}" oninput="s.area=Number(this.value)||null">`:
 `<div class="grid2"><div><label>กว้าง (เมตร)</label><input type="number" min="1" max="30" step=".1" value="${s.width||''}" oninput="hdSetDim('width',this.value)"></div><div><label>ยาว (เมตร)</label><input type="number" min="1" max="40" step=".1" value="${s.length||''}" oninput="hdSetDim('length',this.value)"></div></div>${s.area?'<p class="assumption">พื้นที่ประมาณ <b>'+Number(s.area).toLocaleString('th-TH')+' ตร.ม.</b></p>':''}`}`;
}
function peopleUsageHTML(){
 ensure();
 const peopleOpts=[[2,'1–2 คน'],[4,'3–4 คน'],[6,'5–6 คน'],[8,'มากกว่า 6 คน']];
 const usageOpts=[['night','กลางคืน / ตอนนอน'],['day','กลางวัน–บ่าย'],['afternoon','เย็น–ค่ำ'],['long','เกือบทั้งวัน']];
 return `<p class="muted">เลือกจำนวนคนช่วงที่คนเยอะตามปกติ และเวลาที่เปิดแอร์บ่อยที่สุด</p><label>จำนวนคน</label><div class="opts grid2">${peopleOpts.map(([v,t])=>`<button class="opt ${Number(s.people)===v?'selected':''}" onclick="s.people=${v};render()">${t}</button>`).join('')}</div><label>ช่วงใช้งาน</label><div class="opts">${usageOpts.map(([v,t])=>`<button class="opt ${s.usage===v?'selected':''}" onclick="s.usage='${v}';render()">${t}</button>`).join('')}</div>`;
}
function connectedAreaHTML(){
 return `<p class="muted">ไม่ต้องวัดเป๊ะ ใส่พื้นที่คร่าว ๆ ของส่วนที่เปิดถึงกันนอกห้องหลัก</p><label>พื้นที่เปิดเชื่อมเพิ่ม (ตร.ม.)</label><input type="number" min="0" max="200" step="1" value="${s.connectedArea||''}" oninput="s.connectedArea=Number(this.value)||null">`;
}

render=function(){
 if(flowMode!=='quick')return baseRender();
 ensure();derive();
 const qs=getQs();
 stepmeta.innerHTML=`<button class="navbtn backhome" onclick="goHome()">← หน้าแรก</button><div class="quickmeta"><span>สำหรับบ้านพักอาศัย • ถามหลัก 8 ข้อ • ถามเพิ่มเฉพาะที่มีผล</span><button class="advancedBtn" onclick="openAdvanced()">ปรับละเอียดเพิ่มเติม</button></div>ขั้นตอน ${i+1}/${qs.length}`;
 bar.style.width=((i+1)/qs.length*100)+'%';
 const [key,title,opts]=qs[i];trackHD('step_viewed',{flow_mode:flowMode,step_key:key},key);
 let h=`<div class="kicker">${STAGE2.some(x=>x[0]===key)?'STAGE 2 · ความชอบของคุณ':'STAGE 1 · ความเหมาะสมของห้อง'}</div><h2>${title}</h2>`;
 if(key==='dimensions')h+=dimensionsHTML();
 else if(key==='people')h+=peopleUsageHTML();
 else if(key==='connectedArea')h+=connectedAreaHTML();
 else if(key==='specialNeeds')h+=needsForm();
 else if(key==='budget')h+=budgetForm();
 else if(key==='priorities')h+=prioritiesForm();
 else h+=`<div class="opts">${opts.map(o=>`<button class="opt ${String(s[key])===String(o[0])?'selected':''}" onclick='pick(${JSON.stringify(key)},${JSON.stringify(o[0])})'><b>${o[1]}</b></button>`).join('')}</div>`;
 h+=`<div class="actions"><button class="btn back" onclick="prev()">ย้อนกลับ</button><button class="btn" onclick="next()">${i===qs.length-1?'ดูผลลัพธ์':'ต่อไป'}</button></div>`;
 box.innerHTML=h;
};

function applyPick(k,v){
 ensure();
 if(k==='openDetail')s.openDetail=v;
 else if(k==='overhead')s.overhead=v;
 else if(k==='ceilingClass')s.ceilingClass=v;
 else if(k==='shapeDetail'){
  s.shapeDetail=v;s.shape=v==='compact'?'compact':v==='connected'?'connected':'long';
 }else if(k==='glass')s.glass=v==='full'?'high':v;
 else if(k==='height')s.height=Number(v);
 else s[k]=v;
 derive();selectedSetupId=null;setupProductsOpen=false;
}
pick=function(k,v){
 if(flowMode!=='quick')return basePick(k,v);
 hdAnswer(k);applyPick(k,v);
 const qs=getQs();if(i<qs.length-1){i++;render()}
};

next=function(){
 if(flowMode!=='quick')return baseNext();
 const qs=getQs(),k=qs[i][0];
 if(k==='dimensions'){
  derive();
  if(s.dimensionMode==='dimensions'&&(!(Number(s.width)>0)||!(Number(s.length)>0)))return alert('กรุณาระบุกว้างและยาวโดยประมาณ หรือเลือกกรอกพื้นที่ ตร.ม.');
  if(!(Number(s.area)>=5&&Number(s.area)<=250))return alert('กรุณาระบุพื้นที่ประมาณ 5–250 ตร.ม.');
 }
 if(k==='people'&&(!(Number(s.people)>0)||!s.usage))return alert('กรุณาเลือกจำนวนคนและช่วงเวลาที่เปิดแอร์');
 if(k==='connectedArea'&&!(Number(s.connectedArea)>=0))return alert('กรุณาระบุพื้นที่เปิดเชื่อมโดยประมาณ');
 if(k==='specialNeeds'&&!s.needsAnswered)return alert('เลือกความต้องการพิเศษ หรือไม่มีเป็นพิเศษ');
 if(k==='budget'&&['target','ceiling'].includes(s.budgetMode)&&(!Number.isFinite(s.budgetAmount)||s.budgetAmount<=0))return alert('กรุณาระบุงบมากกว่า 0 บาท');
 if(k==='priorities'&&s.priorities.length!==3)return alert('กรุณาจัดอันดับให้ครบ Top 3');
 hdAnswer(k);if(k==='people')trackHD('step_answered',{flow_mode:flowMode,step_key:'usage'},'usage');
 if(i===qs.length-1){hdComplete();selectedSetupId=null;setupProductsOpen=false;return finish()}
 i++;render();
};

configurationQuestions=function(){return flowMode==='quick'?configQs():baseConfigurationQuestions()};

function hardGateReasons(){
 ensure();derive();const r=[];
 if(s.room==='other')r.push('Aircon v1 รองรับห้องนอน ห้องนั่งเล่น และ Living + Dining ในบ้านก่อน');
 if(s.ceilingClass==='double')r.push('เพดานสูงมาก / Double volume ต้องดูตำแหน่งติดตั้งและการหมุนเวียนอากาศหน้างาน');
 if(['stair','outdoor'].includes(s.openDetail))r.push('พื้นที่เปิดถึงบันได โถงสูง หรือภายนอก ทำให้ขอบเขตภาระความเย็นไม่ชัด');
 if(s.kitchenUse==='heavy'&&s.open!=='closed')r.push('ครัวผัด–ทอดที่เปิดเชื่อมกับพื้นที่แอร์ต้องประเมิน Hood และอากาศทดแทน');
 if(Number(s.area)+Number(s.connectedArea||0)>60&&s.open==='open')r.push('พื้นที่เปิดเชื่อมรวมเกินประมาณ 60 ตร.ม. ควรเห็นแปลนและทางเดินลมจริง');
 if(s.glass==='high'&&['afternoon','all'].includes(s.sun)&&s.shading==='none'&&Number(s.area)>30)r.push('กระจกมาก + แดดบ่าย + ไม่มีสิ่งบังแดด ทำให้ความไม่แน่นอนของ Solar gain สูง');
 const unknown=[s.sun,s.glass,s.overhead,s.ceilingClass,s.openDetail].filter(v=>!v||v==='unknown').length;
 if(unknown>=3)r.push('ข้อมูลตัวแปรหลักยังไม่แน่ใจหลายข้อ จึงไม่ควรฟันธงรุ่นพร้อมซื้อ');
 if(s.adaptiveOverflow)r.push('ห้องมีเงื่อนไขเสี่ยงหลายด้านเกินกว่าที่ Quick Flow ควรถามต่อ');
 if(safeLoadHigh()>=48000&&s.phase==='unknown')r.push('ภาระความเย็นระดับใหญ่ แต่ระบบไฟบ้านยังไม่ยืนยัน');
 return [...new Set(r)];
}
function softGateReasons(){
 ensure();derive();const r=[];
 if(['roof','deck'].includes(s.overhead)&&['unknown',null].includes(s.roofInsulation))r.push('ชั้นบนสุดแต่ยังไม่ทราบฉนวนเหนือฝ้า/หลังคา');
 if(s.ceilingClass==='high')r.push('ฝ้าสูงกว่าปกติ ต้องตรวจตำแหน่งติดตั้งและทางเดินลม');
 if(['long','lshape','connected'].includes(s.shapeDetail))r.push('รูปทรงห้องอาจต้องแบ่งจุดจ่ายลมหรือ 2 เครื่อง');
 if((safeLoadHigh()>=24000||Number(s.area)>=35)&&s.phase==='unknown')r.push('ระบบไฟยังไม่ยืนยัน ควรให้ช่างตรวจมิเตอร์ เบรกเกอร์ และโหลดรวม');
 const unknown=[s.sun,s.glass,s.overhead,s.ceilingClass,s.openDetail].filter(v=>!v||v==='unknown').length;
 if(unknown===2)r.push('มีข้อมูลหลักไม่แน่ใจ 2 ข้อ ช่วง BTU ควรถูกมองเป็นช่วงกว้าง');
 return [...new Set(r)];
}

siteFlags=function(){
 // Avoid making every ordinary room a site-check only because phase is unknown.
 const base=baseSiteFlags().filter(x=>!String(x).startsWith('ระบบไฟยังไม่ยืนยัน')&&!String(x).startsWith('สมมติ pantry'));
 return [...new Set([...base,...softGateReasons(),...hardGateReasons()])];
};

function gateHTML(reasons){
 let L=null;try{L=load()}catch(e){}
 return `<button class="navbtn backhome" onclick="openAdvancedFromResult()">← ปรับข้อมูลห้อง</button><header class="answerHero"><span class="kicker">RESIDENTIAL SAFETY GATE</span><h1>ควรสำรวจหน้างานก่อนเลือกเครื่องจริง</h1><p>เรายังช่วยสรุปช่วงความต้องการได้ แต่จะไม่แสดงรุ่นพร้อมซื้อเมื่อข้อมูลหรือพื้นที่ซับซ้อนเกินเกณฑ์</p>${L?`<p><b>ช่วงประเมินเบื้องต้น:</b> ${Math.round(L.low).toLocaleString('th-TH')}–${Math.round(L.high).toLocaleString('th-TH')} BTU/h</p>`:''}<ul class="keyReasons">${reasons.map(x=>'<li>'+x+'</li>').join('')}</ul><p class="warning">นี่ไม่ใช่ความล้มเหลวของแบบสอบถาม แต่เป็นการหยุดฟันธงเมื่อความไม่แน่นอนสูง</p></header>${decisionBriefHTML('unresolved')}`;
}

configurationResult=function(){
 const hard=hardGateReasons();
 if(hard.length){lastTop=[];lastSetup=null;result.innerHTML=gateHTML(hard);trackHD('site_check_flagged',{flag_count:hard.length},'residential-hard-gate');return}
 baseConfigurationResult();
 const hero=result.querySelector('.answerHero');
 if(hero&&!hero.querySelector('.resScope')){
  hero.insertAdjacentHTML('afterbegin','<div class="resScope badge high">สำหรับบ้านพักอาศัย</div>');
 }
};

const HD_SOCIAL_PROOF=window.HD_SOCIAL_PROOF||{};
const choiceState={selected:null,purchased:null};
function cohortKey(){
 let L=null;try{L=load()}catch(e){}
 const b=!L?'unknown':L.mid<18000?'under18':L.mid<=30000?'18to30':L.mid<=48000?'30to48':'over48';
 const setup=selectedConfiguration()?.unit_type||'unknown';
 return [s.room||'unknown',b,setup].join(':');
}
function proofFor(id){const row=HD_SOCIAL_PROOF[id];return row&&Number.isFinite(row.sample_size)?row:null}
function socialProofLabel(id){
 const p=proofFor(id);
 if(!p||p.sample_size<30)return {level:'insufficient',text:'ข้อมูลผู้ใช้ยังไม่มากพอสำหรับแสดง Popular Choice'};
 if(p.sample_size<100)return {level:'qualitative',text:'Popular Choice · เป็นหนึ่งในตัวเลือกที่ผู้ใช้โจทย์ใกล้เคียงกันเลือกบ่อย'};
 const selected=Math.max(0,Number(p.selected_count)||0),pct=Math.round(selected/p.sample_size*100);
 const days=Number(p.window_days)||90;
 return {level:'percent',text:`Popular Choice · ${pct}% จาก ${p.sample_size.toLocaleString('th-TH')} การตัดสินใจใน ${days} วัน`};
}
function socialProofHTML(p){
 const label=socialProofLabel(p.id),selected=choiceState.selected===p.id;
 const row=proofFor(p.id);
 let installed='';
 if(row&&row.sample_size>=100&&Number(row.purchased_count)>=0){
  const pct=Math.round((Number(row.purchased_count)||0)/row.sample_size*100);
  installed=`<small class="muted">ยืนยันติดตั้งแล้ว ${pct}% จากฐานเดียวกัน</small>`;
 }
 return `<div class="socialProof"><p><b>${label.text}</b></p>${installed}<div class="actionrow"><button class="${selected?'outlinebtn':'btn'}" onclick="hdSelectChoice('${p.id}')">${selected?'✓ เลือกรุ่นนี้แล้ว':'ฉันเลือกรุ่นนี้'}</button>${selected?`<button class="outlinebtn" onclick="hdPurchasedChoice('${p.id}')">${choiceState.purchased===p.id?'✓ ยืนยันติดตั้งแล้ว':'ติดตั้งรุ่นนี้แล้ว'}</button>`:''}</div><p class="disclaimer">Popularity ไม่เปลี่ยนอันดับ Best Choice และจะแสดง % เฉพาะเมื่อมีข้อมูลจริงอย่างน้อย 100 การตัดสินใจ</p></div>`;
}
function choiceEvent(name,id){
 try{hdDebug.counts[name]=(hdDebug.counts[name]||0)+1}catch(e){}
 const detail={event:name,product_id:id,cohort:cohortKey()};
 try{window.dispatchEvent(new CustomEvent('home-decision',{detail}))}catch(e){}
}
function hdSelectChoice(id){choiceState.selected=id;choiceEvent('decision_selected',id);finish()}
function hdPurchasedChoice(id){choiceState.selected=id;choiceState.purchased=id;choiceEvent('decision_purchased',id);finish()}
window.hdSelectChoice=hdSelectChoice;window.hdPurchasedChoice=hdPurchasedChoice;

recommendationCard=function(p,primary=false){
 let html=baseRecommendationCard(p,primary);
 if(primary){
  html=html.replace('<div class="recommendationHeader">','<div class="choiceRole"><span class="badge high">BEST CHOICE สำหรับคุณ</span><p class="muted">อันดับนี้มาจากความเข้ากันได้ทางเทคนิค + ความต้องการ + Top 3 + งบ ไม่ใช้ความนิยมดันอันดับ</p></div><div class="recommendationHeader">');
 }
 return html.replace('<details class="disclosure">',socialProofHTML(p)+'<details class="disclosure">');
};

renderProductDetail=function(id){
 const out=baseRenderProductDetail(id);
 const p=PRODUCTS.find(x=>x.id===id),article=result.querySelector('.productDetail');
 if(p&&article&&!article.querySelector('.socialProof')){
  const quoteBtn=article.querySelector('.btn');
  if(quoteBtn)quoteBtn.insertAdjacentHTML('beforebegin',socialProofHTML(p));
 }
 return out;
};

restartToWizard=function(){
 baseRestart();ensure();
 s.install='any';s.phase='unknown';s.dimensionMode='dimensions';s.width=null;s.length=null;
 s.openDetail=null;s.overhead=null;s.ceilingClass=null;s.roofInsulation=null;s.roofType=null;s.shading=null;s.connectedArea=null;s.kitchenUse=null;s.shapeDetail=null;
};

// Replace the old marketing promise with the current residential contract.
try{
 const homeTitle=document.querySelector('#home h1');if(homeTitle)homeTitle.innerHTML='เลือกแอร์สำหรับบ้าน<br>โดยไม่ต้องรู้ศัพท์แอร์';
 const homeLead=document.querySelector('#home p.muted');if(homeLead)homeLead.textContent='ตอบเรื่องที่คุณมองเห็นและใช้งานจริง → ระบบคัดขนาด จำนวนเครื่อง และประเภทก่อน → ค่อยเลือกรุ่นตามความต้องการ';
 const quickSmall=document.querySelector('#home .modecard.recommended small');if(quickSmall)quickSmall.textContent='8 คำถามหลัก • ถามเพิ่มเฉพาะห้องที่จำเป็น • ประมาณ 2–3 นาที';
}catch(e){}

window.hdResidentialV3={version:V,coreQuestions,adaptiveQuestions,hardGateReasons,softGateReasons,socialProofLabel,cohortKey,derive};
ensure();derive();
})();