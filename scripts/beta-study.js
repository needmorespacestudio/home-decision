(function(){
'use strict';
const RELEASE='2026.10.08.1';
const comparisons=[['better','ช่วยตัดสินใจได้ดีกว่า'],['same','พอ ๆ กัน'],['worse','กรองสินค้าเองช่วยได้มากกว่า'],['not_tried','ยังไม่ได้ลองกรองสินค้าเอง']];
const outcomes=[['decided','รู้แล้วว่าจะเลือกอะไร'],['shortlist','เหลือตัวเลือกน้อยลง แต่ยังต้องถามเพิ่ม'],['survey','รู้ว่าต้องให้ช่างตรวจอะไรเพิ่ม'],['unclear','ยังไม่รู้ว่าจะเลือกอะไร']];
let study={comparison:null,outcome:null},exportId=null;
const originalFeedback=hdFeedbackHTML,originalBegin=hdBegin;
hdBegin=function(){study={comparison:null,outcome:null};return originalBegin()};
function question(key,title,options){return `<p><b>${title}</b></p><div class="opts">${options.map(([value,label])=>`<button class="opt ${study[key]===value?'selected':''}" aria-pressed="${study[key]===value}" onclick="hdStudyAnswer('${key}','${value}')">${label}</button>`).join('')}</div>`}
hdFeedbackHTML=function(){return originalFeedback().replace(/<\/section>$/,`<section class="card" id="hdStudy"><details class="disclosure"><summary>ร่วมทดสอบว่าช่วยตัดสินใจได้จริงไหม? (ไม่บังคับ)</summary><p class="muted">ตอบจากประสบการณ์ครั้งนี้ ไม่มีผลต่ออันดับสินค้า</p>${question('outcome','หลังอ่านคำแนะนำ ตอนนี้คุณ…',outcomes)}${question('comparison','เทียบกับเข้าเว็บร้านค้าแล้วกรองสินค้าเอง',comparisons)}<p class="muted">หากยังไม่ได้ลองเว็บร้านค้า เลือก “ยังไม่ได้ลอง” ผลจะไม่ถูกนับเป็นการเปรียบเทียบ</p><button class="outlinebtn" onclick="hdExportStudy()">บันทึกผลการทดลองไว้ในเครื่อง</button><button class="outlinebtn" onclick="hdShowStudy()">ดูข้อมูลเพื่อคัดลอกเก็บไว้</button><div id="hdStudyFallback" class="hidden"><label for="hdStudyData">ผลการทดลองที่บันทึกได้ (ไม่มีข้อมูลห้องหรือ Quote)</label><textarea id="hdStudyData" readonly rows="8" style="width:100%"></textarea></div><p class="disclaimer">บันทึกเฉพาะสถิติการใช้ คะแนนความคิดเห็น และคำตอบสองข้อนี้ ไม่รวมข้อมูลห้อง งบ ใบเสนอราคา ข้อความเพิ่มเติม หรือชื่อ/ข้อมูลติดต่อ ไม่มีการส่งอัตโนมัติ คุณเลือกเองว่าจะส่งไฟล์ให้ผู้ดูแลการทดลองหรือไม่ รีโหลดหน้าจะล้างผลที่ยังไม่ได้บันทึก</p><p id="hdStudyStatus" role="status"></p></details></section></section>`)};
window.hdStudyAnswer=function(key,value){
 const options=key==='comparison'?comparisons:key==='outcome'?outcomes:null;
 if(!options?.some(row=>row[0]===value))return;
 study[key]=value;
 const section=document.getElementById('hdStudy'),wasOpen=section?.querySelector('details')?.open;
 hdRefreshFeedback();
 if(wasOpen)document.querySelector('#hdStudy details').open=true;
};
function report(){
 if(!exportId)exportId=crypto.randomUUID();
 return {schema:'home-decision-supervised-beta-v1',release:RELEASE,export_id:exportId,exported_at:new Date().toISOString(),scope:'page_lifetime_aggregate; last_flow_questionnaire; supervised_test_only',metrics:hdAnalytics.report(),questionnaire:{...study},feedback_reason:hdFeedback.reason||null};
}
window.hdExportStudy=function(){
 const status=document.getElementById('hdStudyStatus');
 try{
  const data=report(),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Home-Decision-beta-'+data.export_id+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  if(status)status.textContent='เริ่มดาวน์โหลดแล้ว ตรวจว่าไฟล์บันทึกสำเร็จก่อนปิดหน้านี้';
 }catch(e){if(status)status.textContent='บันทึกไม่สำเร็จ ลองอีกครั้งก่อนปิดหน้านี้'}
};
window.hdShowStudy=function(){document.getElementById('hdStudyData').value=JSON.stringify(report(),null,2);document.getElementById('hdStudyFallback').classList.remove('hidden')};
window.hdBetaStudy={report,release:RELEASE};
})();
