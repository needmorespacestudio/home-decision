// Cooling configuration layer. Synchronous, evidence-gated; no engineering design claim.
let selectedSetupId=null, setupProductsOpen=false, activeZoneIndex=0, lastSetup=null;
function decisionEvent(name, data={}){
 const allowed=['configuration_result_shown','recommended_setup_type','alternative_setup_opened','setup_selected','product_clicked','site_check_flagged'];
 if(!allowed.includes(name))return;
 // Only enumerated setup metadata; no room dimensions, quote, identity, or persistent log.
 const detail={event:name,setup_type:data.setup_type,unit_count:data.unit_count,flag_count:data.flag_count};
 if(typeof CustomEvent==='function'&&typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('home-decision', {detail}));
}
function configurationQuestions(){
 const multi=s.area>=40||(s.area>=30&&s.room!=='bed')||s.room==='ld'||s.open==='open';
 const qs=[];
 if(multi){
  qs.push(['zoneUsage','ปกติเปิดใช้งานพื้นที่ทั้งหมดพร้อมกันไหม?', [['together','เกือบตลอด'],['partial','บางโซนบ่อย'],['unknown','ไม่แน่ใจ']]]);
  qs.push(['shape','พื้นที่ยาวหรือมีหลายมุมจนลมจากจุดเดียวไปไม่ทั่วไหม?', [['compact','พื้นที่กระชับ ลมเดินทางได้สะดวก'],['long','ยาว / แคบ / มีหลายมุม'],['connected','หลายห้องเชื่อมกัน'],['unknown','ไม่แน่ใจ']]]);
  if(s.zoneUsage==='partial'||s.shape==='long'||s.shape==='connected')qs.push(['zoneControl','อยากปรับความเย็นแยกแต่ละโซนไหม?', [['yes','อยากแยก'],['no','ไม่จำเป็น'],['unknown','ให้ระบบแนะนำ']]]);
 }
 if(s.install!=='wall'&&(s.area>=30||['cassette','hidden'].includes(s.install)))qs.push(['ceiling','มีฝ้าและพื้นที่เหนือฝ้าสำหรับฝังหรือซ่อนเครื่องไหม?', [['yes','มีฝ้า ให้ช่างตรวจพื้นที่ได้'],['no','ไม่มี / ไม่สามารถทำฝ้าได้'],['unknown','ไม่แน่ใจ']]]);
 if(s.install==='constraints')qs.push(['outdoorSpace','วางเครื่องภายนอกได้กี่ตัว?', [['one','ได้เพียง 1 ตัว'],['two','ได้ 2 ตัว'],['unknown','ยังไม่แน่ใจ ต้องตรวจหน้างาน']]]);
 return qs;
}
function siteFlags(){
 const flags=[];
 if(s.area>=80)flags.push('พื้นที่ใหญ่ ต้องตรวจภาระความเย็นและตำแหน่งเครื่อง');
 if(s.height>3.5)flags.push('เพดานสูง / double volume ต้องประเมินหน้างาน');
 if(s.glass==='high'&&['afternoon','all'].includes(s.sun))flags.push('กระจกมากและแดดแรง ต้องประเมินความร้อนจริง');
 if(s.room==='ld')flags.push('สมมติ pantry ไม่มีการปรุงอาหารหนัก หากมีครัวหรือแหล่งความร้อนต้องตรวจเพิ่ม');
 if(s.shape==='connected')flags.push('หลายห้องเชื่อมกัน อาจต้องมากกว่า 2 โซน');
 if(s.open==='open'&&s.shape!=='compact')flags.push('Open plan ต้องตรวจทางเดินลมและขอบเขตพื้นที่');
 if(s.phase==='unknown')flags.push('ระบบไฟยังไม่ยืนยัน ต้องตรวจเฟส แรงดัน เบรกเกอร์ และโหลดรวม');
 if(s.install==='constraints'&&s.outdoorSpace==='unknown')flags.push('ข้อจำกัดติดตั้งยังไม่ชัด ต้องตรวจตำแหน่งภายนอก');
 return flags;
}
function withZone(zone, count, fn){
 const saved=s;
 s={...s,install:zone.unit_type,budgetAmount:s.budgetAmount==null?null:s.budgetAmount/count};
 try{return fn()}finally{s=saved}
}
function zoneCandidates(zone,count){
 return withZone(zone,count,()=>rankCandidates(zone.load).map(p=>{
  // Preliminary safe coverage requires nominal to cover the upper estimate.
  // Peak inverter output is not evidence of sustained capacity.
  const coverage=p.nominal_btu>=zone.load.high;
  const electrical=verified(p,'phase')&&verified(p,'voltage');
  const voltageOK=!electrical||(p.phase==='1'?/220|230|240/.test(String(p.voltage)):/380|400|415/.test(String(p.voltage)));
  return {...p,match_type:coverage&&voltageOK?'exact':'near',electrical_confirmed:electrical&&s.phase!=='unknown'&&voltageOK};
 }).filter(p=>!verified(p,'voltage')||(p.phase==='1'?/220|230|240/.test(String(p.voltage)):/380|400|415/.test(String(p.voltage))))
 .sort((a,b)=>(b.match_type==='exact')-(a.match_type==='exact')||Number(b.electrical_confirmed)-Number(a.electrical_confirmed)||needsRank(b)-needsRank(a)||priorityScore(b)-priorityScore(a)||(s.budgetMode==='ceiling'?Number(verifiedPrice(b)&&b.price_thb<=s.budgetAmount)-Number(verifiedPrice(a)&&a.price_thb<=s.budgetAmount):0)||(s.budgetMode==='value'&&verifiedPrice(a)&&verifiedPrice(b)?a.price_thb-b.price_thb:0)||capScore(b,zone.load)-capScore(a,zone.load)||a.id.localeCompare(b.id)));
}
function neutralShortlist(list){
 const picked=[],seen=new Set();
 for(const p of list){if(!seen.has(p.brand)){picked.push(p);seen.add(p.brand)}}
 return [...picked,...list.filter(p=>!picked.includes(p))];
}
function coolingConfigurations(){
 const L=load(),multi=s.area>=40||s.room==='ld'||s.open==='open'||s.shape==='long'||s.shape==='connected';
 const zoning=multi&&(s.zoneUsage==='partial'||s.zoneControl==='yes'||['long','connected'].includes(s.shape));
 const flags=siteFlags(),out=[];
 function candidate(types){
  const n=types.length;
  if(n===2&&(!multi||s.outdoorSpace==='one'))return;
  if(types.includes('cassette')&&(s.ceiling==='no'||s.install==='wall'))return;
  if(s.install==='cassette'&&types.some(t=>t!=='cassette'))return;
  if(s.install==='hidden')return;
  const zones=types.map((type,ix)=>{
   const share=n===1?1:ix===0?(s.zoneShare||.5):1-(s.zoneShare||.5);
   const zL={low:L.low*share,high:L.high*share,mid:L.mid*share};
   return {zone_id:'zone_'+(ix+1),name:n===1?'พื้นที่ทั้งหมด':s.room==='ld'?(ix===0?'Living':'Dining / Pantry'):'โซน '+(ix+1),unit_type:type,load:zL,capacity_per_unit_low:Math.ceil(zL.low),capacity_per_unit_high:Math.ceil(zL.high),capacity_per_unit_target:Math.ceil(zL.high/1000)*1000};
  });
  const sf=[...flags];
  if(n===2)sf.push('แบ่งภาระความเย็นตามสัดส่วนเบื้องต้น '+Math.round((s.zoneShare||.5)*100)+':'+Math.round((1-(s.zoneShare||.5))*100)+' ต้องให้ช่างยืนยันขนาดและภาระของแต่ละโซน');
  if(types.includes('cassette')){
   sf.push('ตรวจพื้นที่เหนือฝ้า โครงยึด ท่อน้ำทิ้ง และการเข้าถึงเพื่อบำรุงรักษา');
   if(s.ceiling!=='yes')sf.push('ยังไม่ยืนยันว่าฝ้ารองรับ cassette');
  }
  if(n===1&&multi&&s.shape!=='compact')sf.push('ตรวจทางเดินลม จุดติดตั้งเดียวอาจส่งลมไม่ทั่ว');
  const lists=zones.map(z=>zoneCandidates(z,n)),covered=lists.map(l=>l.filter(p=>p.match_type==='exact'));
  const electricalReady=covered.every(l=>l.some(p=>p.electrical_confirmed));
  if(!electricalReady&&s.phase!=='unknown')sf.push('ยังไม่มีรุ่นที่ยืนยันเฟสและแรงดันครบทุกโซน ต้องตรวจรุ่นย่อยกับช่าง');
  const hasCoverage=covered.every(l=>l.length);
  let status=!hasCoverage?'catalog_gap':sf.length||!electricalReady?'site_check':'fit';
  const samples=covered.map(l=>l.filter(verifiedPrice));
  const min=samples.every(l=>l.length)?samples.reduce((v,l)=>v+Math.min(...l.map(p=>p.price_thb)),0):null;
  const reasons=[n===2?'แบ่งความเย็นไปยัง 2 จุด ช่วยลดความเสี่ยงปลายพื้นที่ไม่เย็น':'ดูแลและติดตั้งเครื่องจำนวนน้อยกว่า',n===2?'ปรับและเปิดแต่ละโซนแยกกันได้':'เปิดพื้นที่ทั้งหมดด้วยการควบคุมจุดเดียว',types.includes('cassette')?'กระจายลม 4 ทิศทางเมื่อจุดฝ้าและทางเดินลมเหมาะ':'ไม่ต้องฝังตัวเครื่องในฝ้า'];
  if(n===2)reasons.push('หากเครื่องหนึ่งขัดข้อง อีกโซนยังใช้งานได้');
  const tradeoffs=[n===2?'มีจุดติดตั้งและเครื่องภายนอก 2 ตัว รวมถึงภาระดูแลเพิ่ม':'ควบคุมแยกโซนไม่ได้ และหากเสียพื้นที่ทั้งหมดหยุดเย็น'];
  if(n===2)tradeoffs.push('มีโอกาสประหยัดเมื่อเปิดเฉพาะโซนที่ใช้งาน สมมติว่าแต่ละโซนแยกความร้อนได้ ไม่รับรองตัวเลขประหยัด');
  if(s.specialNeeds.includes('noise')||s.priorities[0]==='quiet')tradeoffs.push('ความเงียบต้องดูระดับเสียงรุ่นจริงและตำแหน่งเครื่อง จำนวนเครื่องไม่ได้รับรองว่าเงียบกว่า');
  if(s.specialNeeds.length)tradeoffs.push('คุณสมบัติอากาศและความต้องการพิเศษต้องตรวจหลักฐานของแต่ละรุ่น');
  // Lexicographic suitability, then needs/priorities, then sampled equipment cost.
  const distribution=zoning?(n===2?0:2):s.shape==='compact'||!multi?(n===1?0:1):0;
  const feasibility=types.includes('cassette')&&s.ceiling!=='yes'?1:0;
  const needs=covered.reduce((sum,l)=>sum+(l[0]?withZone(zones[0],n,()=>needsRank(l[0])):0),0)/n;
  const priority=covered.reduce((sum,l)=>sum+(l[0]?withZone(zones[0],n,()=>priorityScore(l[0])):0),0)/n;
  const designTie=s.priorities[0]==='design'&&s.ceiling==='yes'?(types.every(t=>t==='cassette')?0:1):types.every(t=>t==='wall')?0:1;
  out.push({configuration_id:types.join('_')+'_'+n,unit_count:n,unit_type:n===1?types[0]:types.every(t=>t===types[0])?types[0]:'mixed',zone_plan:zones,capacity_per_unit_low:zones.map(z=>z.capacity_per_unit_low),capacity_per_unit_high:zones.map(z=>z.capacity_per_unit_high),capacity_per_unit_target:zones.map(z=>z.capacity_per_unit_target),total_capacity_target:zones.reduce((v,z)=>v+z.capacity_per_unit_target,0),fit_status:status,key_reasons:reasons.slice(0,4),tradeoffs,site_check_flags:sf,estimated_cost_scope:{scope:'verified_equipment_only_excluding_installation',min_sample_thb:min,priced_models_per_zone:samples.map(l=>l.length),note:'ในตัวเลือกที่เราตรวจสอบราคาแล้ว ไม่ใช่ราคาตลาดทั้งหมด'},confidence:status==='fit'?'moderate':'low',product_matches:lists,decision_order:[feasibility,hasCoverage?0:1,electricalReady?0:1,distribution,-needs,-priority,designTie,s.budgetMode==='value'&&min!=null?min:0],advanced:false});
 }
 candidate(['wall']);candidate(['wall','wall']);
 if(s.area>=30||s.install==='cassette')candidate(['cassette']);
 if(multi&&s.ceiling==='yes'&&(s.install==='cassette'||s.zoneControl==='yes'))candidate(['cassette','cassette']);
 if(zoning&&s.ceiling==='yes'&&s.install==='any')candidate(['wall','cassette']);
 out.sort((a,b)=>{for(let i=0;i<a.decision_order.length;i++){const d=a.decision_order[i]-b.decision_order[i];if(d)return d}return a.configuration_id.localeCompare(b.configuration_id)});
 const advanced=[];
 if(s.install==='hidden')advanced.push({configuration_id:'ducted_consideration',unit_count:null,unit_type:'ducted',zone_plan:[],capacity_per_unit_low:[],capacity_per_unit_high:[],capacity_per_unit_target:[],total_capacity_target:Math.ceil(L.high/1000)*1000,fit_status:s.ceiling==='no'?'infeasible':'advanced',key_reasons:['งานซ่อนเครื่องต้องออกแบบทางเดินลมและช่องซ่อมบำรุง'],tradeoffs:['ยังไม่มี catalog สำหรับยืนยันรุ่นและราคา จึงไม่ใช่แบบพร้อมซื้อ'],site_check_flags:[...flags,'ให้ช่าง/วิศวกรตรวจฝ้า ท่อลม แรงดันลม และระบบไฟก่อนซื้อ'],estimated_cost_scope:{min_sample_thb:null},confidence:'low',product_matches:[],advanced:true});
 if(s.outdoorSpace==='one'&&zoning)advanced.push({unit_type:'multi_split',fit_status:'advanced',key_reasons:['ข้อจำกัดเครื่องภายนอกหนึ่งตัวอาจต้องสำรวจ multi-split'],site_check_flags:['ต้องออกแบบระบบและยืนยันรุ่นที่เข้าคู่กัน ยังไม่รองรับ product matching'],advanced:true});
 if(s.area>=100||s.shape==='connected')advanced.push({unit_type:'VRF/VRV',fit_status:'advanced',key_reasons:['หลายพื้นที่อาจต้องใช้ระบบที่ออกแบบเฉพาะ'],site_check_flags:['ให้วิศวกรสำรวจ ไม่มี catalog รองรับในรอบนี้'],advanced:true});
 return {load:L,recommended:out[0]||advanced.find(c=>c.configuration_id)||null,alternatives:out.slice(1,3),candidates:out,advanced};
}
function setupTitle(c){return c.advanced?'งานซ่อนเครื่อง — ต้องสำรวจออกแบบ':c.unit_count+' เครื่อง'+(c.unit_count===2?' แบ่ง 2 โซน':' สำหรับพื้นที่ทั้งหมด')+' · '+typeName(c.unit_type)}
function setupCost(c){const v=c?.estimated_cost_scope?.min_sample_thb;return v==null?'ยังไม่มีราคายืนยันครบทั้งแบบนี้':'ในตัวเลือกที่เราตรวจสอบราคาแล้ว ค่าเครื่องเริ่มประมาณ '+baht(v)+' — ยังไม่รวมติดตั้ง'}
function selectedConfiguration(){const e=coolingConfigurations();return e.candidates.find(c=>c.configuration_id===selectedSetupId)||e.recommended}
function setupBudgetHTML(c){
 const v=c.estimated_cost_scope.min_sample_thb,ceiling=s.budgetMode==='ceiling'&&s.budgetAmount>0;
 return `<section class="budgetSummary" id="budgetReality"><h3>งบของทั้งแบบติดตั้ง</h3><p>${setupCost(c)}</p><p>งบค่าเครื่อง: ${budgetText()}</p>${ceiling&&v!=null?`<p>${v>s.budgetAmount?'งบต่ำกว่าตัวอย่างราคาที่ตรวจสอบ ต้องเพิ่มอย่างน้อย '+baht(v-s.budgetAmount):'มีตัวอย่างราคาครบทุกโซนภายในเพดาน ต้องขอราคารุ่นที่เลือกจริงอีกครั้ง'}</p>`:''}<small>ไม่มีข้อมูลค่าติดตั้งรวม ต้องขอแยกค่าท่อ เบรกเกอร์ ฝ้า VAT และงานติดตั้งกับร้าน ราคาและฟีเจอร์ที่ไม่ยืนยันยังไม่ถือว่ามี</small><div class="actionrow"><button onclick="setResultView('closest')">ดูตัวเลือกใกล้งบ</button><button onclick="setResultView('requirements')">ดูตัวเลือกตรงโจทย์</button></div></section>`;
}
function setupComparison(c){
 const two=c.unit_count===2;
 const rows=[['ค่าเครื่อง',setupCost(c)],['งานติดตั้ง',two?'ท่อ น้ำทิ้ง สายไฟ เบรกเกอร์ และจุดภายนอก 2 ชุด ต้องขอใบเสนอราคา':'1 ชุด; cassette ต้องตรวจฝ้าและน้ำทิ้ง'],['เปิดบางโซน',two?'เปิดแยกได้ หากพื้นที่แบ่งความร้อนได้ มีโอกาสประหยัด':'ควบคุมรวมทั้งพื้นที่'],['ความเย็น / ความสบาย',two?'ช่วยกระจายลม แต่ต้องกำหนดตำแหน่งและปรับสมดุล':'ขึ้นกับทางเดินลมจากจุดเดียว'],['เสียง',two?'มีแหล่งเสียง 2 จุด ต้องตรวจ dB และตำแหน่ง':'แหล่งเสียงจุดเดียว ต้องตรวจ dB รุ่นจริง'],['เมื่อเครื่องเสีย',two?'อีกโซนยังเย็นได้ ไม่แทนกำลังเต็มพื้นที่':'ทั้งพื้นที่หยุดเย็น'],['ดูแลรักษา',two?'ล้างและบำรุง 2 ชุด':'ดูแล 1 ชุด'],['ภายนอก / งานดีไซน์',two?'ต้องมีที่วางภายนอก 2 ตัวและจุดภายใน 2 จุด':'ภายนอก 1 ตัว; wall เห็นตัวเครื่อง cassette เห็นหน้ากาก'],['ระบบไฟ','ยืนยันเฟส แรงดัน สาย เบรกเกอร์ และโหลดรวมกับช่าง ไม่อนุมานจากจำนวนเครื่อง']];
 return rows.map(([k,v])=>`<p><b>${k}</b>: ${v}</p>`).join('');
}
function chooseSetup(id){selectedSetupId=id;setupProductsOpen=true;activeZoneIndex=0;const c=selectedConfiguration();decisionEvent('setup_selected',{setup_type:c.unit_type,unit_count:c.unit_count});finish()}
function openSetupProducts(){setupProductsOpen=true;const c=selectedConfiguration();decisionEvent('setup_selected',{setup_type:c.unit_type,unit_count:c.unit_count});finish();document.getElementById('setupProducts')?.scrollIntoView?.({behavior:'smooth'})}
function compareSetup(id){const c=coolingConfigurations().candidates.find(c=>c.configuration_id===id);if(!c)return;decisionEvent('alternative_setup_opened',{setup_type:c.unit_type,unit_count:c.unit_count});const el=document.getElementById('setupCompare');el.innerHTML=`<h3>${setupTitle(c)}</h3>${setupComparison(c)}<button class="btn" onclick="chooseSetup('${id}')">เลือกแบบนี้และดูรุ่น</button>`;el.classList.remove('hidden');el.scrollIntoView?.({behavior:'smooth'})}
function configurationResult(){
 const engine=coolingConfigurations(),c=selectedConfiguration();lastSetup=c;
 if(!c){lastTop=[];result.innerHTML='<h1>ต้องสำรวจหน้างานก่อน</h1><p>ข้อจำกัดที่กรอกยังไม่มีแบบติดตั้งที่ยืนยันได้ หากไม่มีฝ้าจะฝัง cassette ไม่ได้</p><button class="btn" onclick="restartToWizard()">ปรับความต้องการติดตั้ง</button>'+decisionBriefHTML('unresolved');return}
 const productHTML=c.product_matches.map((list,ix)=>{
  let shown=list.filter(p=>p.match_type==='exact');if(resultView==='closest')shown=shown.filter(verifiedPrice).sort((a,b)=>a.price_thb-b.price_thb);
  if(!shown.length)shown=list;
  shown=neutralShortlist(shown);
  return `<section><h3>${c.zone_plan[ix].name} · เป้าหมาย ${c.zone_plan[ix].capacity_per_unit_target.toLocaleString('th-TH')} BTU</h3>${shown.length?withZone(c.zone_plan[ix],c.unit_count,()=>shown.slice(0,3).map((p,j)=>recommendationCard(p,j===0).replaceAll('onclick="showProductDetail(',`onclick="activeZoneIndex=${ix};showProductDetail(`).replaceAll('onclick="openQuoteCompare(',`onclick="activeZoneIndex=${ix};openQuoteCompare(`)).join('')):'<p class="warning">Catalog Gap: ยังไม่มีรุ่นที่ผ่านเกณฑ์โซนนี้ ใช้ Brief ขอรุ่นที่ตรงโจทย์จากร้าน</p>'}</section>`;
 }).join('');
 lastTop=c.product_matches.flatMap(l=>l.slice(0,3));
 result.innerHTML=`<button class="navbtn backhome" onclick="openAdvancedFromResult()">← ปรับข้อมูลห้อง</button><header class="answerHero"><span class="kicker">สำหรับพื้นที่นี้ เรา${c.fit_status==='fit'?'แนะนำ':'เสนอให้ตรวจหน้างาน'}</span><h1>${setupTitle(c)}</h1>${c.zone_plan.map(z=>`<p><b>${z.name}</b> ~${z.capacity_per_unit_target.toLocaleString('th-TH')} BTU</p>`).join('')}<ul class="keyReasons">${c.key_reasons.map(r=>'<li>'+r+'</li>').join('')}</ul><p class="warning">${c.tradeoffs[0]}</p>${c.fit_status!=='fit'?'<p class="warning">ระบบช่วย shortlist configuration ได้ แต่ควรให้ช่าง/วิศวกรตรวจหน้างานก่อนซื้อ'+(c.fit_status==='catalog_gap'?' — ยังไม่มีรุ่นครอบคลุมช่วงโหลดครบทุกโซน':'')+'</p>':''}<button class="btn" onclick="openSetupProducts()">ดูรุ่นที่เหมาะกับแบบนี้ →</button></header>${engine.alternatives.filter(x=>x.configuration_id!==c.configuration_id).map(a=>`<article class="card"><span class="kicker">อีกทางเลือก</span><h3>${setupTitle(a)}</h3><p>${a.key_reasons[0]}</p><p class="warning">${a.tradeoffs[0]}</p><p>${setupCost(a)}</p><button class="outlinebtn" onclick="compareSetup('${a.configuration_id}')">เปรียบเทียบกับแบบที่เลือก</button></article>`).join('')}<section id="setupCompare" class="card hidden"></section><details class="disclosure"><summary>ทำไมแนะนำแบบนี้ และสิ่งที่ต้องตรวจ</summary>${setupComparison(c)}<p>ภาระรวม ${Math.round(engine.load.low)}–${Math.round(engine.load.high)} BTU/h · ${needsText()} · ${priorityText()}</p>${c.tradeoffs.map(t=>'<p>'+t+'</p>').join('')}${c.site_check_flags.map(t=>'<p>ต้องตรวจ: '+t+'</p>').join('')}<p>ความมั่นใจ: ${c.confidence==='moderate'?'ปานกลาง — เป็นการประเมินเบื้องต้น':'ยังต้องยืนยันข้อมูล / หน้างาน'} · สมมติเป็นพื้นที่ครอบคลุมตามที่กรอก ไม่ใช่งานออกแบบวิศวกรรม</p></details>${setupBudgetHTML(c)}<section id="setupProducts" ${setupProductsOpen?'':'class="hidden"'}><h2>รุ่นสำหรับแต่ละโซน</h2><p class="muted">ราคาที่แสดงเป็นต่อเครื่อง เพดานต่อโซนแบ่งเท่ากันเพื่อคัดเบื้องต้น ต้องตรวจยอดทั้งชุดกับร้าน</p>${productHTML||'<p>ยังไม่มีรุ่นรองรับงานซ่อนเครื่อง ใช้ Decision Brief ขอสำรวจออกแบบ</p>'}</section>${engine.advanced.filter(a=>a.configuration_id!==c.configuration_id).length?`<details class="disclosure"><summary>งานระบบที่อาจต้องพิจารณาเพิ่มเติม</summary>${engine.advanced.filter(a=>a.configuration_id!==c.configuration_id).map(a=>'<p><b>'+a.unit_type+'</b>: '+a.key_reasons.join(' · ')+'</p><p>'+a.site_check_flags.join(' · ')+'</p>').join('')}<p>เป็นข้อพิจารณาเท่านั้น ไม่มีการแนะนำรุ่นหรือราคาในรอบนี้</p></details>`:''}<details class="disclosure"><summary>ฐานข้อมูลและหลักการคัดเลือก</summary><p>${PRODUCTS.length} records · ${CATALOG_META.scope} · ยังไม่ครอบคลุมตลาดทั้งหมด</p><p>ความปลอดภัย → ติดตั้ง → ขนาด → ระบบไฟ → ทางเดินลม/โซน → ความต้องการพิเศษ → Top 3 → งบ ข้อมูลไม่ยืนยันไม่ได้คะแนนเพิ่ม</p></details><details class="disclosure"><summary>สรุปโจทย์เก็บไว้ / ส่งให้ร้าน (Decision Brief)</summary>${decisionBriefHTML(c.fit_status==='fit'?'available':'unresolved')}</details>`;
 decisionEvent('configuration_result_shown',{setup_type:c.unit_type,unit_count:c.unit_count});decisionEvent('recommended_setup_type',{setup_type:engine.recommended.unit_type,unit_count:engine.recommended.unit_count});
 if(c.site_check_flags.length)decisionEvent('site_check_flagged',{setup_type:c.unit_type,flag_count:c.site_check_flags.length});
}
