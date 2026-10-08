const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

function state(overrides={}){
 return Object.assign({
  room:'bed',area:12,height:2.7,sun:'morning',glass:'low',roof:'no',open:'closed',people:2,usage:'night',
  install:'any',phase:'unknown',specialNeeds:[],needsAnswered:true,budgetMode:'unset',budgetAmount:null,priorities:['energy','quiet','price'],
  width:3,length:4,dimensionMode:'dimensions',openDetail:'closed',overhead:'room_above',ceilingClass:'normal',
  roofInsulation:null,roofType:null,shading:null,connectedArea:null,kitchenUse:null,shapeDetail:'compact',shape:'compact'
 },overrides);
}
function harness(overrides={},social={}){
 const ctx={
  console,HD_SOCIAL_PROOF:social,window:{},document:{querySelector(){return null}},
  CustomEvent:function(name,o){this.name=name;this.detail=o.detail},
  s:state(overrides),i:0,flowMode:'quick',selectedSetupId:null,setupProductsOpen:false,lastTop:[],lastSetup:null,
  getQs(){return[]},render(){},pick(){},next(){},restartToWizard(){},siteFlags(){return[]},
  configurationResult(){},recommendationCard(){return '<article><div class="recommendationHeader"></div><details class="disclosure"></details></article>'},
  renderProductDetail(){},trackHD(){return true},configurationQuestions(){return[]},
  load(){return {low:7000,mid:8000,high:9000}},
  selectedConfiguration(){return {unit_type:'wall'}},
  decisionBriefHTML(){return '<div>brief</div>'},
  hdDebug:{counts:{}},result:{querySelector(){return null}},
  home:{classList:{add(){},remove(){}}},advanced:{classList:{add(){},remove(){}}},quote:{classList:{add(){},remove(){}}},
  wiz:{classList:{add(){},remove(){}}},box:{innerHTML:''},bar:{style:{}},stepmeta:{innerHTML:''},
  needsForm(){return''},budgetForm(){return''},prioritiesForm(){return''},hdAnswer(){},hdComplete(){},
  finish(){},prev(){},openAdvanced(){},goHome(){},alert(){},scrollTo(){},
  PRODUCTS:[],Number,Math,Date,Intl,JSON,Object,Array,String,Boolean,Set,Map
 };
 ctx.window=ctx;
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('scripts/residential-survey-v3.js','utf8'),ctx);
 return ctx;
}
let n=0;function test(name,fn){fn();n++;console.log('ok',n,'-',name)}

test('new preview presents one result summary and keeps underlying detail actions accessible',()=>{const src=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(src,/function hdResultV6\(\)/);assert.match(src,/hdResultV4\(\);\s*hdResultV6\(\)/);assert.match(src,/hdV6Details/);assert.match(src,/hdV6Product/);assert.match(src,/outer\.open=true/);assert.match(src,/oldNodes/);});
test('Preview Top3 cards open corresponding product detail only for verified setups',()=>{const src=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(src,/showProductDetail\('\+esc\(JSON\.stringify\(p\.id\)\)/);assert.match(src,/const top=\(supported\?unique:\[\]\)\.slice\(0,3\)/);assert.match(src,/top\.length\+' รุ่นที่ควรดูต่อ/);assert.match(src,/const outer=document\.getElementById\('hdV6Details'\)/)});
test('Result V4 keeps only a concise primary answer and three expandable sections',()=>{const src=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(src,/function hdResultV4\(\)/);assert.match(src,/hdV4Choices/);assert.match(src,/hdV4Products/);assert.match(src,/hdV4Details/);assert.match(src,/hdResultRedesign\(\);\s*hdResultV4\(\)/);assert.match(src,/complex\?'ควรเปรียบเทียบรูปแบบติดตั้งก่อน'/);assert.match(src,/กลุ่ม|ข้อมูลวิศวกรรมและข้อจำกัดทั้งหมด/)});
test('Detailed Flow maps understandable zone and layout language',()=>{const src=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(src,/shape:\['ถ้ามองจากด้านบน/);assert.match(src,/zoneUsage:\['ตอนเปิดแอร์ อยากให้เย็นทั่ว/);assert.match(src,/details\[q\[0\]\]/);assert.match(src,/zoneDetails\[q\[0\]\]/)});
test('Quick MVP keeps simple rooms within six pages and routes complex rooms to survey',()=>{const simple=harness({room:'bed',area:16,openDetail:'closed',shapeDetail:'compact',ceilingClass:'normal'});assert.deepEqual(Array.from(simple.hdResidentialV3.quickQuestions().map(q=>q[0])),['homePage1','homePage2','homePage3','homePage4','budget','priorities']);const complex=harness({area:50,room:'ld',openDetail:'open'});assert.deepEqual(Array.from(complex.hdResidentialV3.quickQuestions().map(q=>q[0])),['homePage1','homePage2','homePage3','homePage4']);const source=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(source,/function hdMvpSurveyHTML/);assert.match(source,/hdMvpTop3/);assert.match(source,/hdV5More/)});
test('non-overlapping ceiling options and broader residential examples',()=>{const c=harness();const qs=c.hdResidentialV3.coreQuestions();const height=qs.find(x=>x[0]==='ceilingClass');const room=qs.find(x=>x[0]==='room');assert.match(height[2][0][1],/ไม่เกิน 3 เมตร/);assert.match(height[2][1][1],/สูงกว่า 3 เมตร/);assert.match(room[2].find(x=>x[0]==='other')[1],/ห้องทำงาน/);});
test('no detailed ask to pre-decide separate aircon unit controls',()=>{const source=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(source,/!\['install','zoneControl'\]\.includes\(q\[0\]\)/);assert.match(source,/สามรุ่นแรกที่ผ่านการคัดกรอง/);assert.match(source,/ไม่ใช่เปอร์เซ็นต์ความเหมาะสมที่รับรองแล้ว/);});
test('MVP keeps all nine core inputs grouped without duplicate questions',()=>{const c=harness();const pages=c.hdResidentialV3.corePages;assert.deepEqual(Array.from(pages.map(p=>p[2].length)),[2,2,3,2]);assert.equal(new Set(pages.flatMap(p=>p[2])).size,9)});
test('core survey has nine residential questions',()=>{const c=harness();assert.equal(c.hdResidentialV3.coreQuestions().length,9)});
test('occupancy and usage are distinct simple decisions',()=>{const c=harness();const keys=c.hdResidentialV3.coreQuestions().map(x=>x[0]);assert(keys.includes('people')&&keys.includes('usage'));assert(keys.indexOf('usage')===keys.indexOf('people')+1)});
test('full glazing is retained as separate visual detail after derivation',()=>{const c=harness({glass:'full',glazingExtent:'full'});c.hdResidentialV3.derive();assert.equal(c.s.glass,'high');assert.equal(c.s.glazingExtent,'full')});
test('quick survey displays four grouped pages before adaptives and preferences',()=>{const c=harness();const keys=c.hdResidentialV3.quickQuestions().map(x=>x[0]);assert.deepEqual(Array.from(keys.slice(0,4)),['homePage1','homePage2','homePage3','homePage4']);assert.equal(c.hdResidentialV3.corePages.length,4)});
test('every one of the nine core inputs is represented in exactly one page',()=>{const c=harness();const keys=c.hdResidentialV3.corePages.flatMap(x=>x[2]);assert.equal(keys.length,9);assert.equal(new Set(keys).size,9);assert.equal(c.hdResidentialV3.coreQuestions().length,9)});
test('plain-language core labels avoid HVAC jargon',()=>{const c=harness();const questions=c.hdResidentialV3.coreQuestions();assert(!/Open plan|Double volume|SHGC|HVAC|Zone/.test(questions.map(x=>[x[1],...(x[2]||[]).map(y=>y[1])].join(' ')).join(' ')))});
test('homeowner options preserve engineering enum values',()=>{const c=harness();const q=c.hdResidentialV3.coreQuestions();const values=k=>Array.from(q.find(x=>x[0]===k)[2],x=>x[0]);assert.deepEqual(values('openDetail'),['closed','partial','open','stair','outdoor','unknown']);assert.deepEqual(values('sun'),['shade','morning','afternoon','all','unknown']);assert.deepEqual(values('glass'),['low','medium','high','full','unknown']);assert.deepEqual(values('overhead'),['room_above','roof','deck','unknown']);});
test('answer wording is Thai and conveys observable room conditions',()=>{const c=harness();const q=c.hdResidentialV3.coreQuestions();const text=q.map(x=>x[1]+' '+(x[2]||[]).map(o=>o[1]).join(' ')).join(' ');assert(text.includes('ประตู'));assert(text.includes('แดด'));assert(text.includes('กระจก'));assert(!/Double volume|Open plan|Living \/ Dining/.test(text))});
test('open-area flags require zoning and airflow site confirmation',()=>{const c=harness({room:'ld',openDetail:'open',open:'open',area:35});const flags=c.siteFlags().join(' ');assert.match(flags,/จำนวนเครื่อง ชนิดเครื่อง และระยะส่งลม/)});
test('closed-room flags do not inherit connected-area disclaimer',()=>{const c=harness({room:'bed',openDetail:'closed',open:'closed',area:12});const flags=c.siteFlags().join(' ');assert.doesNotMatch(flags,/จำนวนเครื่อง ชนิดเครื่อง และระยะส่งลม/)});
test('complex setup hero displays total cooling-load range instead of asserted per-zone target',()=>{const source=fs.readFileSync('scripts/residential-survey-v3.js','utf8');assert.match(source,/ช่วงภาระความเย็นรวมของพื้นที่/);assert.match(source,/complex\?'<div class="hdrMetric">/);assert.match(source,/const ready=c\.fit_status==='fit'&&complete&&!/)});
test('core survey excludes office and commercial categories',()=>{const c=harness();const room=c.hdResidentialV3.coreQuestions()[0][2].flat().join(' ');assert(!/office|ร้าน|คลินิก/i.test(room))});
test('dimensions derive area',()=>{const c=harness({width:4,length:5,area:null});c.hdResidentialV3.derive();assert.equal(c.s.area,20)});
test('long room derives airflow shape',()=>{const c=harness({width:3,length:8,area:null,shapeDetail:null});c.hdResidentialV3.derive();assert.equal(c.s.shape,'long')});
test('open stair is a hard gate',()=>{const c=harness({openDetail:'stair'});assert(c.hdResidentialV3.hardGateReasons().some(x=>x.includes('บันได')))});
test('double volume is a hard gate',()=>{const c=harness({ceilingClass:'double'});assert(c.hdResidentialV3.hardGateReasons().some(x=>x.includes('Double volume')))});
test('unsupported other room is a hard gate',()=>{const c=harness({room:'other'});assert(c.hdResidentialV3.hardGateReasons().length>0)});
test('heavy connected kitchen is a hard gate',()=>{const c=harness({room:'ld',openDetail:'open',kitchenUse:'heavy'});assert(c.hdResidentialV3.hardGateReasons().some(x=>x.includes('ครัว')))});
test('large open residential area is a hard gate',()=>{const c=harness({area:55,width:null,length:null,dimensionMode:'area',connectedArea:10,openDetail:'open'});assert(c.hdResidentialV3.hardGateReasons().some(x=>x.includes('60')))});
test('west full glass without shade is a hard gate for larger room',()=>{const c=harness({area:35,width:null,length:null,dimensionMode:'area',sun:'afternoon',glass:'high',shading:'none'});assert(c.hdResidentialV3.hardGateReasons().some(x=>x.includes('กระจก')))});
test('two unknown core variables are soft rather than forced fake certainty',()=>{const c=harness({sun:'unknown',overhead:'unknown'});assert(c.hdResidentialV3.softGateReasons().some(x=>x.includes('2 ข้อ')))});
test('adaptive survey is capped at four questions',()=>{const c=harness({room:'ld',overhead:'roof',roofInsulation:'unknown',sun:'afternoon',glass:'high',openDetail:'open',area:40,shapeDetail:null});assert(c.hdResidentialV3.adaptiveQuestions().length<=4)});
test('roof creates insulation follow-up',()=>{const c=harness({overhead:'roof'});assert(c.hdResidentialV3.adaptiveQuestions().some(q=>q[0]==='roofInsulation'))});
test('sun plus glass creates shading follow-up',()=>{const c=harness({sun:'afternoon',glass:'high'});assert(c.hdResidentialV3.adaptiveQuestions().some(q=>q[0]==='shading'))});
test('open boundary asks connected area',()=>{const c=harness({openDetail:'open'});assert(c.hdResidentialV3.adaptiveQuestions().some(q=>q[0]==='connectedArea'))});
test('popular proof under 30 never shows percentage',()=>{const c=harness({},{"p1":{sample_size:20,selected_count:15}});const x=c.hdResidentialV3.socialProofLabel('p1');assert.equal(x.level,'insufficient');assert(!/%/.test(x.text))});
test('popular proof 30-99 is qualitative',()=>{const c=harness({},{"p1":{sample_size:60,selected_count:40}});const x=c.hdResidentialV3.socialProofLabel('p1');assert.equal(x.level,'qualitative');assert(!/%/.test(x.text))});
test('popular proof 100+ may show percentage with denominator',()=>{const c=harness({},{"p1":{sample_size:125,selected_count:50,window_days:90}});const x=c.hdResidentialV3.socialProofLabel('p1');assert.equal(x.level,'percent');assert.match(x.text,/40%/);assert.match(x.text,/125/)});
test('Best Choice card explicitly says popularity cannot move rank',()=>{const c=harness();const html=c.recommendationCard({id:'p1'},true);assert.match(html,/BEST CHOICE/);assert.match(html,/ไม่ใช้ความนิยมดันอันดับ/)});
test('cohort key uses broad non-identifying buckets only',()=>{const c=harness();const k=c.hdResidentialV3.cohortKey();assert.match(k,/bed:under18:wall/);assert(!k.includes('12'))});

console.log(n+' residential survey v3 checks passed');
