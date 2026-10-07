// Vendor-free, memory-only beta measurement. Never forward room/quote/contact data.
const HD_EVENTS=new Set(['flow_started','flow_mode_selected','step_viewed','step_answered','flow_abandoned','flow_completed','result_shown','recommended_setup_type','alternative_setup_opened','setup_selected','product_card_viewed','product_detail_opened','official_link_clicked','price_link_clicked','quote_started','quote_message_copied','decision_brief_copied','decision_brief_downloaded','site_check_flagged','catalog_gap_shown','feedback_submitted','feedback_reason_selected','configuration_result_shown','product_clicked']);
const HD_STEPS=new Set(['room','area','sun','usage','specialNeeds','install','budget','priorities','height','glass','roof','open','people','phase','zoneUsage','shape','zoneControl','ceiling','outdoorSpace']);
const HD_REASONS=[['overload','ข้อมูลเยอะไป'],['fit','ยังไม่มั่นใจว่ารุ่นนี้เหมาะจริง'],['catalog','ไม่มีรุ่น/แบรนด์ที่อยากดู'],['budget','ราคา/งบยังไม่ชัด'],['quote','อยากให้เทียบร้าน/ช่างมากกว่านี้'],['readability','ผลลัพธ์อ่านยาก'],['other','อื่น ๆ']];
const hdDebug={counts:{},steps:{},setups:{},feedback:{},fits:{},times:[],started:0,completed:0,results:0,successful:0,siteChecks:0,detailFlows:0,officialFlows:0,quoteFlows:0};
let hdFlow=null,hdSeen=new Set(),hdFeedback={rating:null,reason:null},hdCardsObserver=null;
function trackHD(name,payload={},onceKey){
 if(!HD_EVENTS.has(name))return false;
 if(hdFlow&&onceKey&&hdSeen.has(name+':'+onceKey))return false;
 const detail={event:name};
 const enums={flow_mode:['quick','detailed'],setup_type:['wall','cassette','mixed','ducted'],fit_status:['exact','near','catalog_gap','site_check','infeasible'],budget_status:['suitable','tight','below-market','unknown'],rating:['positive','neutral','negative'],reason:HD_REASONS.map(x=>x[0]),btu_bucket:['under_18k','18k_30k','30k_48k','over_48k','unknown']};
 for(const [key,values] of Object.entries(enums))if(values.includes(payload[key]))detail[key]=payload[key];
 if(HD_STEPS.has(payload.step_key))detail.step_key=payload.step_key;
 for(const key of ['unit_count','flag_count','alternative_count'])if(Number.isInteger(payload[key])&&payload[key]>=0&&payload[key]<=20)detail[key]=payload[key];
 if(typeof payload.has_site_check==='boolean')detail.has_site_check=payload.has_site_check;
 if(hdFlow&&onceKey)hdSeen.add(name+':'+onceKey);
 hdDebug.counts[name]=(hdDebug.counts[name]||0)+1;
 if(name==='step_viewed'||name==='step_answered'){
  const row=hdDebug.steps[detail.step_key]||(hdDebug.steps[detail.step_key]={viewed:0,answered:0,abandoned:0});row[name==='step_viewed'?'viewed':'answered']++;
 }
 if(name==='flow_abandoned'&&detail.step_key){const row=hdDebug.steps[detail.step_key]||(hdDebug.steps[detail.step_key]={viewed:0,answered:0,abandoned:0});row.abandoned++}
 if(name==='recommended_setup_type'){const key=detail.unit_count+' '+detail.setup_type;hdDebug.setups[key]=(hdDebug.setups[key]||0)+1}
 if(name==='result_shown'){hdDebug.results++;hdDebug.fits[detail.fit_status]=(hdDebug.fits[detail.fit_status]||0)+1;if(detail.has_site_check)hdDebug.siteChecks++}
 if(name==='feedback_submitted'){if(hdFeedback.rating)hdDebug.feedback[hdFeedback.rating]--;hdDebug.feedback[detail.rating]=(hdDebug.feedback[detail.rating]||0)+1}
 const meaningful=['product_detail_opened','official_link_clicked','quote_message_copied','decision_brief_copied','decision_brief_downloaded','alternative_setup_opened'];
 if(hdFlow){
  for(const [event,field] of [['product_detail_opened','detailFlows'],['official_link_clicked','officialFlows'],['quote_message_copied','quoteFlows']])if(name===event&&!hdFlow[field]){hdFlow[field]=true;hdDebug[field]++}
  if(meaningful.includes(name)||(name==='feedback_submitted'&&detail.rating==='positive'))hdFlow.meaningful=true;
  if(hdFlow.completed&&hdFlow.result&&hdFlow.meaningful&&!hdFlow.success){hdFlow.success=true;hdDebug.successful++}
 }
 // Listener/vendor errors must never break decisions. No storage or network in this module.
 try{if(typeof CustomEvent==='function'&&typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('home-decision',{detail}))}catch(e){}
 return true;
}
function hdBegin(){
 hdAbandon();hdSeen=new Set();hdFeedback={rating:null,reason:null};
 hdFlow={start:Date.now(),completed:false,result:false,meaningful:false,success:false,abandoned:false};hdDebug.started++;
 trackHD('flow_started',{flow_mode:flowMode});trackHD('flow_mode_selected',{flow_mode:flowMode});
}
function hdAbandon(){if(hdFlow&&!hdFlow.completed&&!hdFlow.abandoned){hdFlow.abandoned=true;trackHD('flow_abandoned',{flow_mode:flowMode,step_key:getQs()[i]?.[0]})}}
function hdAnswer(key){trackHD('step_answered',{flow_mode:flowMode,step_key:key},key)}
function hdComplete(){if(hdFlow&&!hdFlow.completed){hdFlow.completed=true;hdDebug.completed++;trackHD('flow_completed',{flow_mode:flowMode},'flow')}}
function hdResult(){
 const c=selectedConfiguration(),e=coolingConfigurations();
 const fit=!c?'infeasible':c.fit_status==='catalog_gap'?'catalog_gap':c.product_matches.some(l=>!l.some(p=>p.match_type==='exact')&&l.some(p=>p.match_type==='near'))?'near':c.fit_status==='fit'?'exact':'site_check';
 const target=c?.zone_plan[0]?.capacity_per_unit_target;
 const meta={flow_mode:flowMode,setup_type:c?.unit_type,unit_count:c?.unit_count,fit_status:fit,has_site_check:!c||Boolean(c.site_check_flags.length),alternative_count:e.alternatives.length,budget_status:c?.estimated_cost_scope.min_sample_thb==null?'unknown':s.budgetAmount==null?'suitable':s.budgetAmount<c.estimated_cost_scope.min_sample_thb*.8?'below-market':s.budgetAmount<c.estimated_cost_scope.min_sample_thb?'tight':'suitable',btu_bucket:!target?'unknown':target<18000?'under_18k':target<=30000?'18k_30k':target<=48000?'30k_48k':'over_48k'};
 if(hdFlow&&!hdFlow.result){hdFlow.result=true;hdDebug.times.push(Date.now()-hdFlow.start);if(hdDebug.times.length>500)hdDebug.times.shift()}
 trackHD('result_shown',meta,'flow');
 if(!c||fit==='catalog_gap')trackHD('catalog_gap_shown',meta,'flow');
 if(!c)trackHD('site_check_flagged',{flag_count:1},'flow');
 result.innerHTML+=hdFeedbackHTML();
 hdObserveCards();
}
function hdObserveCards(){
 hdCardsObserver?.disconnect();
 if(typeof IntersectionObserver!=='function')return;
 hdCardsObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const id=entry.target.dataset.hdProduct;trackHD('product_card_viewed',{},id);hdCardsObserver.unobserve(entry.target)}},{threshold:.5});
 document.querySelectorAll('#setupProducts [data-hd-product]').forEach(el=>hdCardsObserver.observe(el));
}
function hdFeedbackHTML(){return `<section id="hdFeedback" class="card" aria-label="ความคิดเห็นต่อคำแนะนำ"><h3>คำแนะนำนี้ช่วยให้ตัดสินใจง่ายขึ้นไหม?</h3><div class="opts">${[['positive','👍 ช่วยมาก'],['neutral','😐 พอใช้'],['negative','👎 ยังไม่ช่วย']].map(([key,label])=>`<button class="opt ${hdFeedback.rating===key?'selected':''}" aria-pressed="${hdFeedback.rating===key}" onclick="hdRate('${key}')">${label}</button>`).join('')}</div>${hdFeedback.rating&&hdFeedback.rating!=='positive'?`<p>เพราะอะไร? <span class="muted">(ไม่บังคับ)</span></p><div class="opts">${HD_REASONS.map(([key,label])=>`<button class="opt ${hdFeedback.reason===key?'selected':''}" aria-pressed="${hdFeedback.reason===key}" onclick="hdReason('${key}')">${label}</button>`).join('')}</div>${hdFeedback.reason==='other'?'<p class="muted">คำอธิบายเพิ่มเติมเป็นทางเลือก เก็บไว้เฉพาะหน้านี้และไม่ส่งเป็น analytics กรุณาไม่ใส่ข้อมูลส่วนตัว</p><textarea aria-label="คำอธิบายเพิ่มเติม" maxlength="500" placeholder="อยากให้ปรับอะไรเพิ่มเติม?"></textarea>':''}`:''}${hdFeedback.rating?'<p role="status">ขอบคุณสำหรับความคิดเห็น</p>':''}<p class="muted">การวัดผลครั้งนี้อยู่ในหน่วยความจำของหน้านี้เท่านั้น ไม่เก็บคำตอบห้องหรือข้อมูล Quote</p><details class="disclosure"><summary>ข้อจำกัดก่อนใช้คำแนะนำ</summary><p>เป็นการประเมินเบื้องต้น ยังรอผู้เชี่ยวชาญ HVAC ตรวจ ระบบและรุ่นยังไม่ครอบคลุมตลาด ราคาและข้อมูลเสียง / PM2.5 / Wi-Fi / รับประกันบางรายการยังไม่มีข้อมูลยืนยัน ใบเสนอราคายังอ่านอัตโนมัติไม่ได้ งานซับซ้อนต้องสำรวจหน้างานก่อนซื้อ</p></details></section>`}
function hdRefreshFeedback(){const el=document.getElementById('hdFeedback');if(el)el.outerHTML=hdFeedbackHTML()}
function hdRate(rating){if(!['positive','neutral','negative'].includes(rating)||hdFeedback.rating===rating)return;trackHD('feedback_submitted',{rating});hdFeedback={rating,reason:null};hdRefreshFeedback()}
function hdReason(reason){if(!HD_REASONS.some(x=>x[0]===reason)||hdFeedback.reason===reason)return;hdFeedback.reason=reason;trackHD('feedback_reason_selected',{reason});hdRefreshFeedback()}
function hdReport(){
 const sorted=[...hdDebug.times].sort((a,b)=>a-b),n=sorted.length;
 const rate=v=>hdDebug.results?Math.round(v/hdDebug.results*1000)/10:null;
 return JSON.parse(JSON.stringify({...hdDebug,fit_pct:Object.fromEntries(Object.entries(hdDebug.fits).map(([k,v])=>[k,rate(v)])),step_dropoff:Object.fromEntries(Object.entries(hdDebug.steps).map(([k,v])=>[k,Math.max(0,v.viewed-v.answered)])),scope:'memory-only page lifetime; not monthly or cross-device evidence',completion_rate:hdDebug.started?hdDebug.completed/hdDebug.started:null,median_time_to_result_ms:n?(sorted[Math.floor((n-1)/2)]+sorted[Math.floor(n/2)])/2:null,site_check_pct:rate(hdDebug.siteChecks),product_detail_click_pct:rate(hdDebug.detailFlows),official_link_click_pct:rate(hdDebug.officialFlows),quote_action_pct:rate(hdDebug.quoteFlows)}));
}
window.hdAnalytics={report:hdReport};
window.addEventListener('pagehide',()=>hdAbandon());
