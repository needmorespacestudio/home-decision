(function(){
'use strict';

const V='6.0-aircon-mvp';
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
 ['bed','ห้องนอน / ห้องนอนเด็ก'],
 ['living','ห้องนั่งเล่น / ห้องดูทีวี'],
 ['ld','ห้องนั่งเล่นรวมกับโต๊ะกินข้าว'],
 ['other','ห้องทำงาน ห้องแต่งตัว ห้องพระ หรือพื้นที่อื่น (ต้องตรวจเพิ่ม)']
];
const SUN_OPTS=[
 ['shade','แทบไม่โดนแดดโดยตรง หรือมีอาคารบัง'],
 ['morning','แดดช่วงเช้าเป็นหลัก'],
 ['afternoon','แดดช่วงบ่ายถึงเย็นเป็นหลัก'],
 ['all','โดนแดดทั้งเช้าและบ่าย'],
 ['unknown','ไม่แน่ใจ']
];
const GLASS_OPTS=[
 ['low','มีหน้าต่างเล็กน้อย (น้อยกว่า 1/4 ของผนัง)'],
 ['medium','กระจกรวมประมาณ 1/4–1/2 ของผนัง'],
 ['high','กระจกรวมเกินครึ่งผนัง แต่ยังไม่เต็มผนัง'],
 ['full','เป็นกระจกเกือบเต็มผนังหรือผนังกระจก'],
 ['unknown','ไม่แน่ใจ']
];
const OVERHEAD_OPTS=[
 ['room_above','มีห้องของชั้นบนอยู่เหนือห้องนี้'],
 ['roof','เป็นชั้นบนสุด มีหลังคาอยู่เหนือฝ้า'],
 ['deck','เหนือห้องเป็นดาดฟ้าคอนกรีต'],
 ['unknown','ไม่แน่ใจ']
];
const OPEN_OPTS=[
 ['closed','มีผนังและประตูปิดแยกได้ตลอดเวลาที่เปิดแอร์'],
 ['partial','มีประตูกั้น แต่จะเปิดค้างเชื่อมกับห้องอื่นบ่อย'],
 ['open','ไม่มีประตูกั้น อากาศไหลถึงห้องอื่นตลอด'],
 ['stair','เปิดโล่งถึงบันไดหรือโถงที่สูงถึงอีกชั้น'],
 ['outdoor','มีประตูออกภายนอกที่เปิดค้างหรือเปิดบ่อย'],
 ['unknown','ไม่แน่ใจ']
];
const HEIGHT_OPTS=[
 ['normal','เพดานทั่วไป สูงไม่เกิน 3 เมตร'],
 ['high','เพดานสูงกว่า 3 เมตร แต่ไม่เปิดโล่งถึงชั้นบน'],
 ['double','โถงเปิดสูงถึงชั้นบน เช่น โถงบ้านสองชั้น'],
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
  ceilingClass:null,glazingExtent:null,roofInsulation:null,roofType:null,shading:null,connectedArea:null,
  kitchenUse:null,shapeDetail:null,adaptiveOverflow:false,phase:s.phase||'unknown',
  install:s.install||'any',ceiling:s.ceiling||'unknown',zoneUsage:s.zoneUsage||null,
  specialNeeds:s.specialNeeds||[],needsAnswered:Boolean(s.needsAnswered),priorities:s.priorities||[]
 };
 for(const [k,v] of Object.entries(defaults))if(s[k]===undefined)s[k]=v;
}

function derive(){
 ensure();
 if(flowMode!=='quick')return; // Detailed answers use their original numeric/technical fields.
 if(s.dimensionMode==='dimensions'&&Number(s.width)>0&&Number(s.length)>0){
  s.area=Math.round(Number(s.width)*Number(s.length)*10)/10;
  const a=Math.max(Number(s.width),Number(s.length)),b=Math.min(Number(s.width),Number(s.length));
  if(b>0&&a>=7&&a/b>=2){s.shape='long';s.shapeDetail='long'}
  else if(!s.shapeDetail){s.shape='compact'}
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
 // Keep a separately observable full-glass answer; legacy thermal estimator uses 'high'.
 if(s.glass==='full'){s.glazingExtent='full';s.glass='high'}
}

function coreQuestions(){return [
['room','ปกติพื้นที่นี้ใช้ทำอะไรเป็นหลัก?',ROOM_OPTS],
['openDetail','ตอนเปิดแอร์ อากาศจากห้องนี้ไหลไปส่วนอื่นได้หรือไม่?',OPEN_OPTS],
['ceilingClass','เพดานห้องนี้สูงแบบไหน?',HEIGHT_OPTS],
['dimensions','ห้องกว้าง × ยาวประมาณเท่าไร?',null],
['sun','ช่วงไหนที่แดดส่องกระจกหรือผนังห้องนี้มากที่สุด?',SUN_OPTS],
['glass','เมื่อมองผนังห้องโดยรวม กระจกมีมากแค่ไหน?',GLASS_OPTS],
['overhead','เหนือห้องนี้เป็นชั้นอื่น หลังคา หรือดาดฟ้า?',OVERHEAD_OPTS],
['people','ปกติมีคนอยู่พร้อมกันกี่คน?',null],
['usage','ปกติเปิดแอร์ช่วงเวลาไหน?',null]
];}
const CORE_PAGES=[
 ['homePage1','พื้นที่นี้เป็นแบบไหน?',['room','openDetail']],
 ['homePage2','ขนาดห้องและเพดาน',['dimensions','ceilingClass']],
 ['homePage3','แดดและความร้อน',['sun','glass','overhead']],
 ['homePage4','ใช้ห้องนี้อย่างไร?',['people','usage']]
];
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
  ['good','มีม่านทึบ ฟิล์มกันแดด หรือกันสาดช่วยบัง'],
  ['none','แทบไม่มีอะไรช่วยบังแดด'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 if(['partial','open','stair','outdoor'].includes(s.openDetail))all.push(['connectedArea','พื้นที่ที่กรอกไว้ รวมส่วนที่เปิดเชื่อมทั้งหมดแล้วหรือยัง?',null]);
 if(s.room==='ld')all.push(['kitchenUse','พื้นที่นี้เชื่อมกับครัวที่ทำอาหารแบบไหน?',[
  ['none','ไม่มีครัว หรือมีแค่อ่างล้างจาน / เคาน์เตอร์'],
  ['light','อุ่นอาหารหรือต้มอาหารเล็กน้อย'],
  ['heavy','ผัดหรือทอดอาหารเป็นประจำ'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 const ratio=(s.dimensionMode==='dimensions'&&Number(s.width)>0&&Number(s.length)>0)?Math.max(s.width,s.length)/Math.min(s.width,s.length):0;
 if((Number(s.area)>=30||ratio>=1.7)&&!s.shapeDetail)all.push(['shapeDetail','ถ้ามองจากด้านบน พื้นที่นี้มีรูปทรงใกล้เคียงแบบไหน?',[
  ['compact','ทรงสี่เหลี่ยมทั่วไป ไม่มีส่วนเลี้ยวหรือยื่นลึก'],
  ['long','ทรงยาวลึก เช่น จากหน้าบ้านถึงหลังบ้าน'],
  ['lshape','รูปตัว L หรือมีส่วนเลี้ยวเป็นมุม'],
  ['connected','หลายพื้นที่เชื่อมกัน เช่น นั่งเล่นต่อกับกินข้าว'],
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
 if(large)q.push(['zoneUsage','ปกติอยากให้แอร์เย็นทั่วทุกส่วน หรือเฉพาะจุดที่ใช้งาน?',[
  ['together','เย็นทั่วทั้งหมด เช่น ห้องนั่งเล่นและกินข้าวพร้อมกัน'],
  ['partial','เย็นเฉพาะจุดที่ใช้งาน เช่น นั่งดูทีวีเป็นหลัก'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 if(Number(s.area)>=35&&s.ceilingClass!=='double')q.push(['ceiling','เหนือเพดานมีพื้นที่ให้ติดตั้งแอร์ฝังฝ้าหรือไม่?',[
  ['yes','มีฝ้าเพดาน ช่างสามารถตรวจพื้นที่เหนือฝ้าได้'],
  ['no','ไม่มีฝ้า หรือไม่สามารถติดตั้งเครื่องเหนือฝ้าได้'],
  ['unknown','ไม่แน่ใจ']
 ]]);
 if(safeLoadHigh()>=24000||Number(s.area)>=35)q.push(['phase','คุณทราบไหมว่าบ้านใช้ไฟฟ้าระบบไหน?',[
  ['unknown','ไม่ทราบ ให้ช่างตรวจ'],
  ['1','1 เฟส 220V'],
  ['3','3 เฟส']
 ]]);
 return q;
}

function quickRequiresSurvey(){
 ensure();derive();
 return s.room==='other'||s.room==='ld'||['partial','open','stair','outdoor','unknown'].includes(s.openDetail)||['high','double','unknown'].includes(s.ceilingClass)||Number(s.area)>=40||['long','lshape','connected'].includes(s.shapeDetail);
}
// Aircon 1.0: four short groups, then preferences only for straightforward enclosed rooms.
// Advanced engineering and installation questions remain available in Detailed mode.
function quickQuestions(){const pages=CORE_PAGES.map(p=>[p[0],p[1],null]);return quickRequiresSurvey()?pages:[...pages,STAGE2[1],STAGE2[2]]}

getQs=function(){
 ensure();
 if(flowMode==='quick')return quickQuestions();
 // Detailed mode stays available, but v1 scope remains residential by removing office.
 const details={
  area:['พื้นที่รวมที่ต้องการให้แอร์เย็นกี่ตารางเมตร?',null],
  height:['เพดานสูงจากพื้นประมาณเท่าไร?',null],
  sun:['แดดส่องกระจกหรือผนังห้องมากที่สุดช่วงไหน?',SUN_OPTS],
  glass:['ผนังห้องมีกระจกมากแค่ไหน?',GLASS_OPTS.filter(x=>x[0]!=='full')],
  roof:['เหนือเพดานห้องนี้เป็นอะไร?',[['no','มีห้องอีกชั้นอยู่ด้านบน'],['yes','เป็นชั้นบนสุด ใต้หลังคาหรือดาดฟ้า'],['unknown','ไม่แน่ใจ']]],
  open:['เวลาเปิดแอร์ ห้องนี้เชื่อมต่อกับพื้นที่อื่นแบบไหน?',[['closed','ปิดประตูแยกเป็นห้องได้'],['partial','มีประตูแต่เปิดค้างบ่อย'],['open','ไม่มีประตูกั้น เปิดโล่งถึงส่วนอื่น'],['unknown','ไม่แน่ใจ']]],
  people:['ปกติมีคนอยู่พร้อมกันกี่คน?',null],
  phase:['ทราบไหมว่าระบบไฟบ้านเป็นแบบใด?',[['unknown','ไม่แน่ใจ ให้ช่างตรวจ'],['1','ไฟบ้าน 1 เฟส'],['3','ไฟบ้าน 3 เฟส']]],
  usage:['ช่วงไหนที่คุณเปิดแอร์บ่อยที่สุด?',[['night','กลางคืน / ตอนนอน'],['day','ช่วงเช้าถึงบ่าย'],['afternoon','ช่วงบ่ายถึงค่ำ'],['long','เปิดหลายช่วง เกือบทั้งวัน']]],
  specialNeeds:['มีอะไรที่อยากให้แอร์ช่วยเป็นพิเศษ?',null],
  budget:['อยากใช้งบประมาณสำหรับตัวเครื่องเท่าไร?',null],
  priorities:['เวลาเลือกแอร์ อะไรสำคัญที่สุดสำหรับคุณ?',null]
 };
 const zoneDetails={
  zoneUsage:['ตอนเปิดแอร์ อยากให้เย็นทั่วทั้งหมด หรือเฉพาะจุดที่ใช้งาน?',[['together','เย็นทั่วทุกส่วน เช่น นั่งเล่นและกินข้าวพร้อมกัน'],['partial','เย็นเฉพาะจุดที่ใช้งานในบางเวลา'],['unknown','ไม่แน่ใจ ให้ระบบช่วยพิจารณา']]],
  shape:['ถ้ามองจากด้านบน พื้นที่นี้มีลักษณะแบบไหน?',[['compact','สี่เหลี่ยมทั่วไป ไม่มีส่วนเลี้ยว'],['long','ยาวลึก หรือมีส่วนเลี้ยวเป็นมุม'],['connected','หลายพื้นที่เปิดเชื่อมกัน ไม่มีประตูกั้น'],['unknown','ไม่แน่ใจ']]],
  zoneControl:['ต้องการเปิด–ปิดแอร์แต่ละส่วนแยกกันไหม?',[['yes','ต้องการ เช่น เปิดเฉพาะส่วนดูทีวี'],['no','ไม่จำเป็น เปิดพร้อมกันได้'],['unknown','ยังไม่แน่ใจ']]],
  ceiling:['เหนือฝ้ามีพื้นที่ติดตั้งแอร์ฝังฝ้าหรือไม่?',[['yes','มีฝ้า และให้ช่างเปิดตรวจได้'],['no','ไม่มีฝ้า หรือไม่สามารถติดตั้งเหนือฝ้าได้'],['unknown','ไม่แน่ใจ ต้องให้ช่างตรวจ']]],
  outdoorSpace:['มีพื้นที่ติดตั้งเครื่องแอร์ด้านนอกได้กี่จุด?',[['one','ได้เพียงจุดเดียว'],['two','ได้อย่างน้อยสองจุด'],['unknown','ไม่แน่ใจ ต้องตรวจหน้างาน']]]
 };
 const base=baseGetQs().map(q=>q[0]==='room'?['room','ปกติพื้นที่นี้ใช้ทำอะไรเป็นหลัก?',ROOM_OPTS]:details[q[0]]?[q[0],details[q[0]][0],details[q[0]][1]||q[2]]:zoneDetails[q[0]]?[q[0],...zoneDetails[q[0]]]:q).filter(q=>!['install','zoneControl'].includes(q[0]));
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
function peopleHTML(){
 ensure();
 const opts=[[1,'1 คน'],[2,'2 คน'],[4,'3–4 คน'],[6,'5–6 คน'],[8,'มากกว่า 6 คน']];
 return '<p class="muted">นับจำนวนคนที่อยู่พร้อมกันตามปกติ ไม่ต้องนับวันที่มีงานเลี้ยงพิเศษ</p><div class="opts grid2">'+opts.map(([v,t])=>'<button class="opt '+(Number(s.people)===v?'selected':'')+'" onclick="s.people='+v+';render()">'+t+'</button>').join('')+'</div>';
}
function usageHTML(){
 ensure();
 const opts=[['night','กลางคืน / ตอนนอน'],['day','ช่วงเช้าถึงบ่าย'],['afternoon','ช่วงบ่ายถึงค่ำ'],['long','เปิดหลายช่วง เกือบทั้งวัน'],['occasional','ไม่ค่อยเปิด ใช้เป็นครั้งคราว']];
 return '<p class="muted">เลือกช่วงที่เปิดแอร์บ่อยที่สุด หากบางวันเปิดช่วงอื่น ระบบยังต้องตรวจภาระสูงสุดด้วย</p><div class="opts">'+opts.map(([v,t])=>'<button class="opt '+(s.usage===v?'selected':'')+'" onclick="hdCorePick(\'usage\',\''+v+'\')">'+t+'</button>').join('')+'</div>';
}
function connectedAreaHTML(){
 return `<p class="muted">ถ้ารวมทั้งหมดไว้ในพื้นที่ก่อนหน้าแล้ว ให้ใส่ 0 ไม่ต้องนับพื้นที่ซ้ำ</p><button type="button" class="opt" onclick="s.connectedArea=0;render()">รวมทั้งหมดแล้ว (เพิ่ม 0 ตร.ม.)</button><label>หากยังมีพื้นที่ที่ไม่ได้รวม เพิ่มอีกกี่ ตร.ม.?</label><input type="number" min="0" max="200" step="1" value="${s.connectedArea??''}" oninput="s.connectedArea=this.value===''?null:Number(this.value)">`;
}

function hdCorePick(k,v){applyPick(k,v);render()}
window.hdCorePick=hdCorePick;
function corePageHTML(page){
 const group=CORE_PAGES.find(p=>p[0]===page), all=coreQuestions();
 return '<p class="muted">หน้า '+(CORE_PAGES.indexOf(group)+1)+' จาก 4 · เรื่องห้อง</p>'+group[2].map((key,j)=>{
  const q=all.find(x=>x[0]===key);
  const body=key==='dimensions'?dimensionsHTML():key==='people'?peopleHTML():key==='usage'?usageHTML():
  '<div class="opts">'+q[2].map(o=>'<button type="button" class="opt '+(String(s[key])===String(o[0])?'selected':'')+'" onclick=\'hdCorePick('+JSON.stringify(key)+','+JSON.stringify(o[0])+')\'><b>'+o[1]+'</b></button>').join('')+'</div>';
  return '<section class="coreField"><h3>'+(j+1)+'. '+q[1]+'</h3>'+body+'</section>';
 }).join('');
}
function validCorePage(page){
 if(page==='homePage1')return !!(s.room&&s.openDetail&&s.ceilingClass);
 if(page==='homePage2'){derive();return (s.dimensionMode==='dimensions'?Number(s.width)>0&&Number(s.length)>0:true)&&Number(s.area)>=5&&Number(s.area)<=250;}
 if(page==='homePage3')return !!(s.sun&&s.glass&&s.overhead);
 if(page==='homePage4')return Number(s.people)>0&&!!s.usage;
 return true;
}
render=function(){
 if(flowMode!=='quick')return baseRender();
 ensure();derive();
 const qs=getQs();
 stepmeta.innerHTML=`<button class="navbtn backhome" onclick="goHome()">← หน้าแรก</button><div class="quickmeta"><span>แบบง่าย · 4 หน้าสั้น ๆ · ห้องซับซ้อนมีขั้นตอนต่อให้</span><button class="advancedBtn" onclick="openAdvanced()">ปรับละเอียดเพิ่มเติม</button></div>ขั้นตอน ${i+1}/${qs.length}`;
 bar.style.width=((i+1)/qs.length*100)+'%';
 const [key,title,opts]=qs[i];const isCore=CORE_PAGES.some(p=>p[0]===key);trackHD('step_viewed',{flow_mode:flowMode,step_key:isCore?CORE_PAGES.find(p=>p[0]===key)[2][0]:key},key);
 let h=`<div class="kicker">${STAGE2.some(x=>x[0]===key)?'STAGE 2 · ความชอบของคุณ':'STAGE 1 · ความเหมาะสมของห้อง'}</div><h2>${title}</h2>`;
 if(isCore)h+=corePageHTML(key);
 else if(key==='dimensions')h+=dimensionsHTML();
 else if(key==='people')h+=peopleHTML();
  else if(key==='usage')h+=usageHTML();
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
 }else if(k==='glass'){s.glazingExtent=v;s.glass=v==='full'?'high':v;}
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
 if(CORE_PAGES.some(p=>p[0]===k)&&!validCorePage(k))return alert('กรุณาตอบคำถามหน้านี้ให้ครบก่อนดำเนินการต่อ');
 if(k==='dimensions'){
  derive();
  if(s.dimensionMode==='dimensions'&&(!(Number(s.width)>0)||!(Number(s.length)>0)))return alert('กรุณาระบุกว้างและยาวโดยประมาณ หรือเลือกกรอกพื้นที่ ตร.ม.');
  if(!(Number(s.area)>=5&&Number(s.area)<=250))return alert('กรุณาระบุพื้นที่ประมาณ 5–250 ตร.ม.');
 }
 if(k==='people'&&!(Number(s.people)>0))return alert('กรุณาเลือกจำนวนคน');
  if(k==='usage'&&!s.usage)return alert('กรุณาเลือกช่วงเวลาที่เปิดแอร์');
 if(k==='connectedArea'&&(s.connectedArea==null||!Number.isFinite(Number(s.connectedArea))||Number(s.connectedArea)<0||Number(s.connectedArea)>200))return alert('กรุณาระบุพื้นที่เปิดเชื่อมโดยประมาณ 0–200 ตร.ม.');
 if(k==='specialNeeds'&&!s.needsAnswered)return alert('เลือกความต้องการพิเศษ หรือไม่มีเป็นพิเศษ');
 if(k==='budget'&&['target','ceiling'].includes(s.budgetMode)&&(!Number.isFinite(s.budgetAmount)||s.budgetAmount<=0))return alert('กรุณาระบุงบมากกว่า 0 บาท');
 if(k==='priorities'&&s.priorities.length!==3)return alert('กรุณาจัดอันดับให้ครบ Top 3');
 hdAnswer(CORE_PAGES.some(p=>p[0]===k)?CORE_PAGES.find(p=>p[0]===k)[2][0]:k);
 if(i===qs.length-1){hdComplete();selectedSetupId=null;setupProductsOpen=false;return finish()}
 i++;render();
};

configurationQuestions=function(){return flowMode==='quick'?configQs():baseConfigurationQuestions()};

function hardGateReasons(){
 ensure();derive();const r=[];
 const detailed=flowMode==='detailed';
 const opening=detailed?s.open:s.openDetail;
 const heightClass=detailed?(Number(s.height)>4?'double':Number(s.height)>3?'high':s.height==null?'unknown':'normal'):s.ceilingClass;
 if(s.room==='other')r.push('พื้นที่ใช้งานรูปแบบอื่นต้องตรวจจำนวนคนและแหล่งความร้อนเพิ่มเติมก่อนยืนยันขนาดหรือชนิดแอร์');
 if(heightClass==='double')r.push('เพดานสูงมาก / Double volume ต้องดูตำแหน่งติดตั้งและการหมุนเวียนอากาศหน้างาน');
 if(['stair','outdoor'].includes(opening))r.push('พื้นที่เปิดถึงบันได โถงสูง หรือภายนอก ทำให้ขอบเขตภาระความเย็นไม่ชัด');
 if(s.kitchenUse==='heavy'&&s.open!=='closed')r.push('ครัวผัด–ทอดที่เปิดเชื่อมกับพื้นที่แอร์ต้องประเมิน Hood และอากาศทดแทน');
 if(Number(s.area)+Number(s.connectedArea||0)>60&&s.open==='open')r.push('พื้นที่เปิดเชื่อมรวมเกินประมาณ 60 ตร.ม. ควรเห็นแปลนและทางเดินลมจริง');
 if(s.glass==='high'&&['afternoon','all'].includes(s.sun)&&s.shading==='none'&&Number(s.area)>30)r.push('กระจกมาก + แดดบ่าย + ไม่มีสิ่งบังแดด ทำให้ความไม่แน่นอนของ Solar gain สูง');
 const unknown=[s.sun,s.glass,detailed?s.roof:s.overhead,heightClass,opening].filter(v=>!v||v==='unknown').length;
 if(unknown>=3)r.push('ข้อมูลตัวแปรหลักยังไม่แน่ใจหลายข้อ จึงไม่ควรฟันธงรุ่นพร้อมซื้อ');
 if(s.adaptiveOverflow)r.push('ห้องมีเงื่อนไขเสี่ยงหลายด้านเกินกว่าที่ Quick Flow ควรถามต่อ');
 if(safeLoadHigh()>=48000&&s.phase==='unknown')r.push('ภาระความเย็นระดับใหญ่ แต่ระบบไฟบ้านยังไม่ยืนยัน');
 return [...new Set(r)];
}
function softGateReasons(){
 ensure();derive();const r=[];
 const detailed=flowMode==='detailed';
 if(['roof','deck'].includes(s.overhead)&&['unknown',null].includes(s.roofInsulation))r.push('ชั้นบนสุดแต่ยังไม่ทราบฉนวนเหนือฝ้า/หลังคา');
 if(detailed?Number(s.height)>3:s.ceilingClass==='high')r.push('ฝ้าสูงกว่าปกติ ต้องตรวจตำแหน่งติดตั้งและทางเดินลม');
 if(['long','lshape','connected'].includes(s.shapeDetail))r.push('รูปทรงห้องอาจต้องแบ่งจุดจ่ายลมหรือ 2 เครื่อง');
 if((safeLoadHigh()>=24000||Number(s.area)>=35)&&s.phase==='unknown')r.push('ระบบไฟยังไม่ยืนยัน ควรให้ช่างตรวจมิเตอร์ เบรกเกอร์ และโหลดรวม');
 const unknown=(detailed?[s.sun,s.glass,s.roof,s.height,s.open]:[s.sun,s.glass,s.overhead,s.ceilingClass,s.openDetail]).filter(v=>!v||v==='unknown').length;
 if(unknown===2)r.push('มีข้อมูลหลักไม่แน่ใจ 2 ข้อ ช่วง BTU ควรถูกมองเป็นช่วงกว้าง');
 return [...new Set(r)];
}

siteFlags=function(){
 // Avoid making every ordinary room a site-check only because phase is unknown.
 const base=baseSiteFlags().filter(x=>!String(x).startsWith('ระบบไฟยังไม่ยืนยัน')&&!String(x).startsWith('สมมติ pantry'));
 const connected=['partial','open','stair','outdoor'].includes(s.openDetail)||s.room==='ld'||['long','lshape','connected'].includes(s.shapeDetail);
 if(connected)base.push('พื้นที่เปิดเชื่อม/รูปทรงซับซ้อน: จำนวนเครื่อง ชนิดเครื่อง และระยะส่งลมเป็นเพียงทางเลือกให้ตรวจแปลนจริงก่อนซื้อ');
 return [...new Set([...base,...softGateReasons(),...hardGateReasons()])];
};

function hdMvpSurveyHTML(){
 const n=Number(s.area)||0;
 const escaped=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const reason=s.room==='other'?'พื้นที่ลักษณะพิเศษต้องตรวจภาระจากการใช้งาน':s.ceilingClass==='double'?'โถงสูงต้องตรวจทางเดินลมจริง':s.openDetail==='open'||s.room==='ld'?'หลายพื้นที่เปิดเชื่อมกัน ต้องตรวจตำแหน่งจ่ายลมและขนาดรายส่วน':'ต้องดูรูปทรงและข้อจำกัดก่อนเลือกจำนวนเครื่อง';
 let l=null;try{l=load()}catch(e){}
 return '<button class="navbtn backhome" onclick="openAdvancedFromResult()">← ปรับข้อมูลห้อง</button>'+
 '<header class="answerHero hdMvpSurvey"><p class="kicker">HOME DECISION · ขั้นตอนต่อไป</p>'+
 '<h1>พื้นที่นี้ควรตรวจรูปแบบติดตั้งก่อน</h1><p>'+escaped(n.toLocaleString('th-TH'))+' ตร.ม. · '+escaped(reason)+'</p>'+
 '<div class="hdV4Answer"><strong>ยังไม่ควรฟันธงว่าใช้แอร์กี่เครื่อง</strong><span>เราจะไม่แบ่ง BTU เป็นรายโซนหรือเลือกชนิดเครื่องให้ทันทีโดยไม่มีแปลน</span></div>'+
 '<p><b>สิ่งที่ควรทำต่อ</b> ส่งขนาดพื้นที่และแปลนให้ร้านหรือช่างตรวจว่าจุดจ่ายลมครอบคลุมทุกส่วนหรือไม่</p>'+
 '<p class="muted">'+(l?'ช่วงประมาณการเบื้องต้น '+Math.round(l.low).toLocaleString('th-TH')+'–'+Math.round(l.high).toLocaleString('th-TH')+' BTU/h · ยังไม่ยืนยัน':'ยังไม่มีภาระความเย็นที่ยืนยันได้')+'</p></header>'+
 '<details class="disclosure"><summary>ดูสรุปโจทย์สำหรับส่งให้ช่าง / รายละเอียดเพิ่มเติม</summary>'+decisionBriefHTML('unresolved')+'</details>';
}
function gateHTML(reasons){
 let L=null;try{L=load()}catch(e){}
 return `<button class="navbtn backhome" onclick="openAdvancedFromResult()">← ปรับข้อมูลห้อง</button><header class="answerHero"><span class="kicker">RESIDENTIAL SAFETY GATE</span><h1>ควรสำรวจหน้างานก่อนเลือกเครื่องจริง</h1><p>เรายังช่วยสรุปช่วงความต้องการได้ แต่จะไม่แสดงรุ่นพร้อมซื้อเมื่อข้อมูลหรือพื้นที่ซับซ้อนเกินเกณฑ์</p>${L?`<p><b>ช่วงประเมินเบื้องต้น:</b> ${Math.round(L.low).toLocaleString('th-TH')}–${Math.round(L.high).toLocaleString('th-TH')} BTU/h</p>`:''}<ul class="keyReasons">${reasons.map(x=>'<li>'+x+'</li>').join('')}</ul><p class="warning">นี่ไม่ใช่ความล้มเหลวของแบบสอบถาม แต่เป็นการหยุดฟันธงเมื่อความไม่แน่นอนสูง</p></header>${decisionBriefHTML('unresolved')}`;
}

function hdResultRedesign(){
 if(!result||!result.querySelector||!lastSetup||typeof document==='undefined'||!document.createElement)return;
 const c=lastSetup,hero=result.querySelector('.answerHero'),products=result.querySelector('#setupProducts');
 if(!hero)return;
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const type={wall:'แอร์ติดผนัง',cassette:'แอร์ฝังฝ้า',mixed:'แอร์ติดผนัง + ฝังฝ้า'}[c.unit_type]||'ระบบแอร์';
 const allZones=Array.isArray(c.zone_plan)?c.zone_plan:[];
 const complete=Array.isArray(c.product_matches)&&c.product_matches.length===allZones.length&&c.product_matches.every(x=>Array.isArray(x)&&x.some(p=>p.match_type==='exact'));
 const ready=c.fit_status==='fit'&&complete&&!((c.unit_count>1)||s.room==='ld'||['partial','open','stair','outdoor'].includes(s.openDetail));
 const complex=c.unit_count>1||s.room==='ld'||['partial','open','stair','outdoor'].includes(s.openDetail);
 const metrics=complex?'<div class="hdrMetric"><span>ช่วงภาระความเย็นรวมของพื้นที่</span><strong>'+Math.round(load().low).toLocaleString('th-TH')+'–'+Math.round(load().high).toLocaleString('th-TH')+'</strong><small>BTU/h · ยังต้องยืนยันกับผู้เชี่ยวชาญ</small></div>':allZones.map(z=>'<div class="hdrMetric"><span>'+esc(z.name)+'</span><strong>'+Number(z.capacity_per_unit_target||0).toLocaleString('th-TH')+'</strong><small>BTU เป้าหมายเบื้องต้น</small></div>').join('');
 const why=(c.key_reasons||[]).slice(0,3).map(x=>'<li>'+esc(x)+'</li>').join('');
 hero.classList.add('hdDecisionHero');
 hero.innerHTML='<p class="hdEyebrow">HOME DECISION · ผลแนะนำสำหรับห้องของคุณ</p><p class="hdEyebrow">'+(ready?'รูปแบบที่เหมาะกับห้องนี้':'แนวทางเบื้องต้น — ต้องตรวจเพิ่ม')+'</p><h1>'+esc(c.unit_count)+' เครื่อง <span>· '+esc(type)+'</span></h1><div class="hdMetricGrid">'+metrics+'</div><div class="hdReason"><strong>ทำไมเราแนะนำแบบนี้</strong><ul>'+why+'</ul></div>'+(ready?'<button class="btn hdCTA" onclick="document.getElementById(\'setupProducts\')?.scrollIntoView({behavior:\'smooth\'})">ดูรุ่นแอร์ที่เหมาะกับคุณ ↓</button>':'<p class="hdWarning">ข้อมูลยังไม่พอจะยืนยันรุ่นพร้อมซื้อ ควรตรวจหน้างานก่อน</p>')+'<p class="hdFineprint">ประเมินเบื้องต้น · ต้องยืนยันจุดติดตั้งและระบบไฟก่อนซื้อ</p>';
 if(products){
  products.classList.remove('hidden');setupProductsOpen=true;
  hero.insertAdjacentElement('afterend',products);
  const h=products.querySelector('h2');if(h)h.textContent=ready?'รุ่นที่เหมาะกับห้องของคุณ':'รุ่นสำหรับประกอบการตรวจสอบ';
 }
 const check=document.createElement('section');check.className='card hdBeforeBuy';
 const flags=(c.site_check_flags||[]).slice(0,3);
 if(c.unit_count>1)flags.unshift('การแบ่ง BTU แต่ละโซนยังใช้สัดส่วนเบื้องต้น ไม่ใช่ผลคำนวณรายโซน ต้องตรวจขนาดและตำแหน่งจริง');
 check.innerHTML='<p class="hdEyebrow">ก่อนตัดสินใจ</p><h2>เรื่องที่ควรเช็กก่อนซื้อ</h2><ul>'+(flags.length?flags.map(x=>'<li>'+esc(x)+'</li>').join(''):'<li>ให้ช่างตรวจตำแหน่งติดตั้ง ทางเดินลม และระบบไฟ</li>')+'</ul><p class="muted">ผลนี้เป็นการคัดเลือกเบื้องต้น ไม่ใช่แบบคำนวณวิศวกรรม</p>';
 (products||hero).insertAdjacentElement('afterend',check);
 if(c.unit_count>1||['partial','open','stair','outdoor'].includes(s.openDetail)||s.room==='ld'){
  const variants=coolingConfigurations().candidates||[];
  const distinct=[];for(const v of variants){const key=v.unit_count+'-'+v.unit_type;if(!distinct.some(x=>x.key===key))distinct.push({key,v})}
  if(distinct.length>1){
   const types={wall:'ติดผนัง',cassette:'ฝังฝ้า 4 ทิศทาง',mixed:'ผสมติดผนังและฝังฝ้า'};
   const more=document.createElement('details');more.className='disclosure hdSetupVariants';
   more.innerHTML='<summary>เปรียบเทียบรูปแบบแอร์อื่นที่เป็นไปได้ ('+distinct.length+' แบบ)</summary><p>เป็นรูปแบบสำหรับเปรียบเทียบ ไม่ใช่การรับรองว่าติดตั้งได้ทุกแบบ ข้อมูลฝ้า ทางเดินลม และขนาดรายโซนต้องยืนยันก่อน</p>'+distinct.map(x=>'<article class="card"><strong>'+esc(x.v.unit_count)+' เครื่อง · '+esc(types[x.v.unit_type]||x.v.unit_type)+'</strong><p>'+esc((x.v.tradeoffs||[])[0]||'ต้องสำรวจหน้างาน')+'</p><button class="outlinebtn" onclick="compareSetup('+JSON.stringify(x.v.configuration_id).replace(/"/g,'&quot;')+')">ดูข้อดีข้อจำกัด</button></article>').join('');
   check.insertAdjacentElement('afterend',more);
  }
 }

 const oldDetail=result.querySelectorAll('details.disclosure');oldDetail.forEach(d=>{const t=d.querySelector('summary');if(t&&t.textContent.includes('ทำไมแนะนำแบบนี้'))t.textContent='ดูหลักการประเมินและข้อมูลทางเทคนิค'});
 if(!document.getElementById('hd-result-style')){
  const st=document.createElement('style');st.id='hd-result-style';
  st.textContent='.hdDecisionHero{border-radius:22px;background:#193730;color:#fff;padding:23px 19px;margin-bottom:14px;box-shadow:0 12px 25px #19373019}.hdDecisionHero h1{font-size:clamp(30px,8vw,42px);line-height:1.1;color:#fff;margin:12px 0}.hdDecisionHero h1 span{font-size:.58em;font-weight:600}.hdEyebrow{font-size:12px;font-weight:800;letter-spacing:.2px;opacity:.85}.hdMetricGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:8px;margin:17px 0}.hdrMetric{border:1px solid #ffffff3d;background:#ffffff15;padding:12px;border-radius:13px}.hdrMetric span,.hdrMetric small{display:block;font-size:11px}.hdrMetric strong{display:block;font-size:23px;font-variant-numeric:tabular-nums}.hdReason{border-radius:14px;background:#fff;color:#193730;padding:15px;margin:16px 0}.hdReason strong{font-size:14px}.hdReason ul,.hdBeforeBuy ul{padding-left:19px;margin:9px 0}.hdReason li,.hdBeforeBuy li{font-size:13px;line-height:1.6;margin:5px 0}.hdCTA{background:#f1daa4;color:#193730;min-height:49px}.hdFineprint{color:#d5e5e0;font-size:11px}.hdWarning{background:#fff2cf;color:#5a420e;padding:13px;border-radius:12px}.hdBeforeBuy{background:#fffdf7;border-color:#e9dfc2;margin-top:12px}.hdBeforeBuy h2{font-size:19px;margin-top:5px}#setupProducts{padding:18px;background:#fff;border:1px solid var(--line);border-radius:20px;margin:14px 0;scroll-margin-top:75px}#setupProducts>h2{font-size:21px}@media(max-width:390px){.hdDecisionHero{padding:18px 15px}#setupProducts{padding:13px}}';
  document.head.appendChild(st);
 }
}
// V4 progressive disclosure: keep the full result DOM and its existing actions,
// but place secondary reports behind three clearly named sections.
function hdResultV4(){
 if(!result||typeof document==='undefined'||!document.createElement)return;
 const hero=result.querySelector('.hdDecisionHero');if(!hero)return;
 const c=lastSetup;
 const complex=Boolean(c&&(c.unit_count>1||s.room==='ld'||['partial','open','stair','outdoor'].includes(s.openDetail)));
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const type={wall:'ติดผนัง',cassette:'ฝังฝ้า 4 ทิศทาง',mixed:'ติดผนังร่วมกับฝังฝ้า'}[c.unit_type]||'รูปแบบติดตั้ง';
 const alternatives=coolingConfigurations().candidates||[];
 const viable=alternatives.filter(x=>x.configuration_id!==c.configuration_id).slice(0,2);
 hero.classList.add('hdResultV4Hero');
 hero.innerHTML='<div class="hdV4Eyebrow">ผลประเมินแอร์สำหรับบ้าน</div>'+
  '<h1>'+(complex?'ควรเปรียบเทียบรูปแบบติดตั้งก่อน':'แนวทางแอร์สำหรับห้องนี้')+'</h1>'+
  '<p class="hdV4Room">'+esc((s.room==='ld'?'ห้องนั่งเล่น + กินข้าว':s.room==='bed'?'ห้องนอน':'พื้นที่ที่เลือก')+' · '+(Number(s.area)||0).toLocaleString('th-TH')+' ตร.ม.')+'</p>'+
  '<div class="hdV4Answer"><strong>'+(complex?'ยังต้องตรวจจำนวนและตำแหน่งเครื่อง':esc(c.unit_count+' เครื่อง · '+type))+'</strong><span>'+(complex?'ระบบยังไม่ยืนยันว่าหนึ่งหรือหลายเครื่องเหมาะที่สุด':'ผลคัดเลือกเบื้องต้น ต้องตรวจการติดตั้งและไฟฟ้าก่อนซื้อ')+'</span></div>'+
  '<div class="hdV4Actions"><button class="btn hdV4Primary" onclick="hdOpenResultSection(\'hdV4Choices\')">'+(complex?'เปรียบเทียบทางเลือก':'ดูรูปแบบที่แนะนำ')+' ↓</button><button class="outlinebtn hdV4Secondary" onclick="hdOpenResultSection(\'hdV4Products\')">ดูรุ่นแอร์</button></div>'+
  '<p class="hdV4Foot">ข้อมูลวิศวกรรมและข้อจำกัดทั้งหมดอยู่ในส่วน “รายละเอียดเพิ่มเติม”</p>';
 if(!complex){
  const shortlisted=(Array.isArray(c.product_matches)?c.product_matches.flatMap(x=>x||[]):[]).filter(p=>p&&p.match_type==='exact');
  const distinct=[];for(const p of shortlisted){if(!distinct.some(x=>x.id===p.id))distinct.push(p)}
  if(distinct.length){
   const spotlight=document.createElement('section');spotlight.className='hdMvpTop3 card';
   spotlight.innerHTML='<h2>3 รุ่นที่ควรเปรียบเทียบ</h2><p class="muted">คัดจากสเปกที่ยืนยันได้ตามข้อมูลห้อง ไม่ใช่เปอร์เซ็นต์ความแม่นยำ</p>'+
    distinct.slice(0,3).map((p,j)=>'<button type="button" class="hdMvpModel" onclick="hdOpenResultSection(\\'hdV4Products\\')"><b>'+(j+1)+'. '+esc(p.brand+' '+p.model)+'</b><span>'+Number(p.nominal_btu||0).toLocaleString('th-TH')+' BTU · ดูสเปกและรายละเอียด →</span></button>').join('');
   hero.insertAdjacentElement('afterend',spotlight);
  }
 }
 const ids=['hdV4Choices','hdV4Products','hdV4Details'];
 const labels=['รูปแบบติดตั้งและทางเลือก','รุ่นแอร์ที่ผ่านการคัดกรอง','รายละเอียดการประเมินและเอกสาร'];
 const groups=ids.map((id,i)=>{const d=document.createElement('details');d.id=id;d.className='hdV4Section';const summary=document.createElement('summary');summary.textContent=labels[i];d.appendChild(summary);return d});
 // Top 3 visible only as an evidence-gated candidate order, never as invented suitability percentages.
 const shortlisted=(Array.isArray(c.product_matches)?c.product_matches.flatMap(x=>x||[]):[]).filter(p=>p&&p.match_type==='exact');
 const unique=[];for(const p of shortlisted){if(!unique.some(x=>x.id===p.id))unique.push(p)}
 if(unique.length){
  const models=document.createElement('div');models.className='hdV5Shortlist';
  models.innerHTML='<strong>สามรุ่นแรกที่ผ่านการคัดกรอง</strong><p class="hdV4SectionIntro">ลำดับนี้ไม่ใช่เปอร์เซ็นต์ความเหมาะสมที่รับรองแล้ว '+(complex?'· ต้องยืนยันรูปแบบติดตั้งและ BTU จริงก่อนซื้อ':'')+'</p>'+unique.slice(0,3).map((p,j)=>'<div class="hdV4Choice"><span class="hdV4ChoiceNumber">'+(j+1)+'</span><div><strong>'+esc(p.brand+' '+p.model)+'</strong><small>'+Number(p.nominal_btu||0).toLocaleString('th-TH')+' BTU · ข้อมูลสำหรับตรวจสอบกับร้าน</small></div></div>').join('');
  groups[1].appendChild(models);
 }
 const choiceIntro=document.createElement('p');choiceIntro.className='hdV4SectionIntro';
 choiceIntro.textContent=complex?'รูปแบบต่อไปนี้เป็นทางเลือกเพื่อเปรียบเทียบ ยังไม่ใช่การรับรองว่าแอร์แต่ละแบบรองรับพื้นที่จริง':'ดูเหตุผลและทางเลือกอื่นที่ระบบประเมินไว้';
 groups[0].appendChild(choiceIntro);
 const overview=document.createElement('div');overview.className='hdV4CompactOptions';
 const picks=[c,...viable].slice(0,3);
 overview.innerHTML=picks.map((x,i)=>'<div class="hdV4Choice"><span class="hdV4ChoiceNumber">'+(i+1)+'</span><div><strong>'+esc(x.unit_count+' เครื่อง · '+({wall:'ติดผนัง',cassette:'ฝังฝ้า 4 ทิศทาง',mixed:'ผสมติดผนังและฝังฝ้า'}[x.unit_type]||x.unit_type))+'</strong><small>'+(i===0?(complex?'แบบที่ระบบเดิมคัดไว้ — ยังต้องตรวจ':'แบบที่ระบบคัดไว้'):'อีกทางเลือกเพื่อเปรียบเทียบ')+'</small></div></div>').join('');
 groups[0].appendChild(overview);
 const children=Array.from(result.children);
 for(const node of children){
  if(node===hero||node.classList?.contains('hdMvpTop3')||node.classList?.contains('backhome')||node.classList?.contains('navbtn'))continue;
  if(node.id==='setupProducts')groups[1].appendChild(node);
  else if(node.id==='setupCompare'||node.classList?.contains('hdSetupVariants')||(node.matches&&node.matches('article.card')))groups[0].appendChild(node);
  else groups[2].appendChild(node);
 }
 const products=groups[1].querySelector('#setupProducts');if(products){products.classList.remove('hidden');products.removeAttribute('hidden')}
 const master=document.createElement('details');master.id='hdV5More';master.className='hdV4Section hdV5More';
 const masterSummary=document.createElement('summary');masterSummary.textContent='ดูรายละเอียดเพิ่มเติม · รูปแบบแอร์ รุ่นสินค้า และข้อมูลทั้งหมด';
 master.appendChild(masterSummary);
 for(const group of groups)master.appendChild(group);
 result.appendChild(master);
 const st=document.getElementById('hd-v4-styles')||document.createElement('style');
 if(!st.id){st.id='hd-v4-styles';st.textContent='.hdResultV4Hero{background:#193730;color:white;border-radius:20px;padding:20px 18px}.hdResultV4Hero h1{font-size:clamp(24px,6vw,31px);line-height:1.2;margin:12px 0;color:#fff}.hdV4Eyebrow{font-size:12px;opacity:.85}.hdV4Room{font-size:13px;opacity:.88;margin:0 0 14px}.hdV4Answer{background:#fff;color:#17392d;border-radius:14px;padding:15px;display:grid;gap:5px}.hdV4Answer strong{font-size:17px;line-height:1.4}.hdV4Answer span{font-size:12px;color:#4f6259;line-height:1.6}.hdV4Actions{display:grid;grid-template-columns:1fr;gap:9px;margin-top:13px}.hdV4Actions button{width:100%;min-height:46px}.hdV4Primary{background:#f2dca9;color:#17392d}.hdV4Secondary{border:1px solid #c2d8cb;background:transparent;color:#fff}.hdV4Foot{font-size:11px;color:#dce9e3;margin:13px 0 0}.hdV4Section{border:1px solid #dbe4de;border-radius:15px;background:#fff;margin:12px 0;overflow:hidden}.hdV4Section>summary{cursor:pointer;padding:17px 18px;font-weight:750;list-style-position:inside}.hdV4Section[open]{padding-bottom:14px}.hdV4Section> :not(summary){margin-left:15px;margin-right:15px}.hdV4SectionIntro{font-size:13px;color:#5c675e;line-height:1.6}.hdV4CompactOptions{display:grid;gap:8px;margin:12px 0}.hdV4Choice{display:flex;gap:11px;align-items:start;padding:12px;background:#f5f8f6;border-radius:11px}.hdV4ChoiceNumber{font-weight:800;color:#2f6852}.hdV4Choice strong,.hdV4Choice small{display:block}.hdV4Choice strong{font-size:14px}.hdV4Choice small{font-size:12px;color:#647269;margin-top:3px}#hdV4Products #setupProducts{border:0;padding:0;box-shadow:none}#hdV4Details .card{margin-top:10px}';st.textContent+=' .hdMvpTop3{margin:12px 0;padding:15px}.hdMvpTop3 h2{font-size:19px;margin:0 0 6px}.hdMvpModel{width:100%;display:flex;flex-direction:column;align-items:start;gap:3px;text-align:left;padding:13px 10px;margin:5px 0;border:1px solid #dbe4de;border-radius:12px;background:#fff;color:#193730}.hdMvpModel b{font-size:14px}.hdMvpModel span{font-size:12px;color:#587063}.hdMvpSurvey{border-radius:20px}.hdMvpSurvey h1{font-size:clamp(24px,6vw,32px)} .hdV5More{background:#f8faf8;border:1px solid #d7e1db;margin-top:12px}.hdV5More>summary{font-size:14px;color:#1d4637}.hdV5More .hdV4Section{margin:7px 12px;background:#fff}.hdV4Section summary{font-size:14px}.hdResultV4Hero h1{font-size:clamp(23px,5vw,29px)}';document.head.appendChild(st)}
}
function hdOpenResultSection(id){const el=document.getElementById(id);if(!el)return;const parent=document.getElementById('hdV5More');if(parent)parent.open=true;el.open=true;el.scrollIntoView?.({behavior:'smooth',block:'start'})}
window.hdOpenResultSection=hdOpenResultSection;

configurationResult=function(){
 const hard=hardGateReasons();
 if(flowMode==='quick'&&quickRequiresSurvey()){lastTop=[];lastSetup=null;result.innerHTML=hdMvpSurveyHTML();trackHD('site_check_flagged',{flag_count:Math.max(hard.length,1)},'aircon-mvp-complex');return}
 if(hard.length){lastTop=[];lastSetup=null;result.innerHTML=gateHTML(hard);trackHD('site_check_flagged',{flag_count:hard.length},'residential-hard-gate');return}
 baseConfigurationResult();
 hdResultRedesign();
 hdResultV4();
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
 s.openDetail=null;s.overhead=null;s.ceilingClass=null;s.glazingExtent=null;s.roofInsulation=null;s.roofType=null;s.shading=null;s.connectedArea=null;s.kitchenUse=null;s.shapeDetail=null;
};

// Replace the old marketing promise with the current residential contract.
try{
 const quickSmall=document.querySelector('#home .modecard.recommended small');if(quickSmall)quickSmall.textContent='ตอบคำถามห้อง 9 ข้อ ใน 4 หน้า แล้วเลือกความต้องการและงบ • ถามเพิ่มเฉพาะที่จำเป็น';
}catch(e){}

window.hdResidentialV3={version:V,coreQuestions,corePages:CORE_PAGES,quickQuestions,adaptiveQuestions,hardGateReasons,softGateReasons,socialProofLabel,cohortKey,derive};
ensure();derive();
})();
