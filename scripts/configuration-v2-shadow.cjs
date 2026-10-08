'use strict';
// Standalone, non-production HVAC concept screening. No SKU or pricing dependency.
// Deliberately does not derive BTU per zone without surveyed geometry.
const TYPES={wall_1:{count:1,types:['wall']},wall_2:{count:2,types:['wall','wall']},cassette_1:{count:1,types:['cassette']},cassette_2:{count:2,types:['cassette','cassette']},mixed_2:{count:2,types:['wall','cassette']}};
function screening(input={}){
 const area=Number(input.area);
 const unknown=v=>v===undefined||v===null||v===''||v==='unknown';
 const layout=input.shape||'unknown',open=input.open||'unknown';
 const connected=input.room==='ld'||['open','partial'].includes(open)||['connected','long','lshape'].includes(layout)||area>=80;
 const needsZoning=connected&&(input.zoneUsage==='partial'||input.zoneControl==='yes'||['connected','long','lshape'].includes(layout));
 const ceiling=input.ceiling||'unknown',outdoorSpace=input.outdoorSpace||'unknown';
 const preference=input.install||'any';
 const haveLoad=input.load&&Number.isFinite(input.load.low)&&Number.isFinite(input.load.high)&&input.load.low>0&&input.load.high>=input.load.low;
 const siteChecks=[];
 if(!Number.isFinite(area)||area<=0)siteChecks.push('ยังไม่มีพื้นที่รวมที่ถูกต้อง');
 if(connected)siteChecks.push('ต้องตรวจแปลนจริง ทางเดินลม และพื้นที่ที่เปิดเชื่อม');
 if(unknown(layout))siteChecks.push('ยังไม่ทราบรูปทรงพื้นที่และจุดอับลม');
 if(unknown(ceiling))siteChecks.push('ยังไม่ยืนยันพื้นที่เหนือฝ้าสำหรับแอร์ฝังฝ้า');
 if(unknown(outdoorSpace))siteChecks.push('ยังไม่ยืนยันจำนวนตำแหน่งเครื่องภายนอก');
 if(!haveLoad)siteChecks.push('ยังไม่มีช่วงภาระความเย็นรวมที่ตรวจสอบได้');
 const candidates=Object.entries(TYPES).map(([id,concept])=>{
  const two=concept.count===2;
  const cassette=concept.types.includes('cassette');
  const constraints=[];
  if(two&&outdoorSpace==='one')constraints.push('มีจุดวางเครื่องภายนอกเพียงจุดเดียว ไม่รองรับสองชุดอิสระโดยไม่ออกแบบเพิ่ม');
  if(cassette&&ceiling==='no')constraints.push('ไม่มีพื้นที่ฝ้าสำหรับติดตั้งเครื่องฝังฝ้า');
  if(preference==='wall'&&cassette)constraints.push('ผู้ใช้ระบุให้พิจารณาเฉพาะติดผนัง');
  if(preference==='cassette'&&concept.types.some(t=>t!=='cassette'))constraints.push('ผู้ใช้ระบุให้พิจารณาเฉพาะฝังฝ้า');
  if(preference==='hidden')constraints.push('งานซ่อนเครื่องต้องใช้กระบวนการออกแบบเฉพาะ');
  if(!connected&&two)constraints.push('พื้นที่ปิดเล็ก/กระชับ ยังไม่มีเหตุผลรองรับการแบ่งสองเครื่อง');
  const blockers=[...constraints];
  const uncertainties=[...siteChecks];
  if(two)uncertainties.push('ยังไม่มีภาระความเย็นและขนาดพื้นที่แยกรายโซน จึงไม่ระบุ BTU ต่อเครื่อง');
  if(cassette&&ceiling==='unknown')uncertainties.push('แอร์ฝังฝ้ารอช่างตรวจฝ้า จุดซ่อมบำรุง และระบบระบายน้ำ');
  if(concept.count===1&&connected)uncertainties.push('หนึ่งเครื่องต้องตรวจระยะส่งลมและสิ่งกีดขวางจริง');
  const distribution=two?(needsZoning?'อาจช่วยแบ่งจุดจ่ายลม/เปิดใช้งานแยกโซนได้ แต่ต้องยืนยันตำแหน่ง':'สองตำแหน่งอาจช่วยกระจายลม แต่ยังไม่มีหลักฐานว่าจำเป็น'):'หนึ่งตำแหน่งจ่ายลม ต้องตรวจว่าครอบคลุมทุกส่วนหรือไม่';
  const status=blockers.length?'excluded':uncertainties.length?'survey_required':'concept_only';
  return {id,unit_count:concept.count,unit_types:concept.types,status,blockers,site_checks:uncertainties,distribution_note:distribution,load_range_btu:null,per_zone_load_btu:null,catalog_availability:'not_evaluated'};
 });
 return {version:'configuration-v2-shadow-1',method:'concept_screening_not_engineered',total_area_m2:Number.isFinite(area)&&area>0?area:null,total_load_range_btu:haveLoad?{low:input.load.low,high:input.load.high}:null,zone_load_method:'unavailable_without_zone_geometry',recommended_configuration_id:null,reason_no_winner:'ไม่มีแปลน/การตรวจจ่ายลมจริง จึงไม่ฟันธงจำนวนและชนิดเครื่องจากพื้นที่หรือสินค้า',candidates,site_checks:siteChecks};
}
if(typeof module!=='undefined'&&module.exports)module.exports={screening,TYPES};
