const assert=require('node:assert/strict');
const fs=require('node:fs');
const {screening}=require('../scripts/configuration-v2-shadow.cjs');
const cases=JSON.parse(fs.readFileSync('data/engineering_validation_cases.json','utf8')).cases;
let count=0;
for(const scenario of cases){
 const x=screening({...scenario.inputs,load:{low:12000,high:34000}});
 assert.equal(x.method,'concept_screening_not_engineered');
 assert.equal(x.recommended_configuration_id,null,'no unsupported winner for '+scenario.id);
 assert.equal(x.total_area_m2,scenario.inputs.area);
 assert.deepEqual(x.total_load_range_btu,{low:12000,high:34000});
 assert.equal(x.candidates.length,5);
 assert(x.candidates.every(c=>c.per_zone_load_btu===null&&c.catalog_availability==='not_evaluated'));
 assert(x.candidates.every(c=>c.status!=='purchase_ready'));
 if(scenario.expect.must_site_check){
  assert(x.site_checks.some(s=>s.includes('แปลนจริง')),'open layout must require survey');
  assert(x.candidates.filter(c=>c.unit_count===2).every(c=>c.site_checks.some(s=>s.includes('BTU ต่อเครื่อง'))),'no fabricated zone BTU');
 }
 if(scenario.expect.single_wall_candidate)assert.notEqual(x.candidates.find(c=>c.id==='wall_1').status,'excluded');
 console.log('PASS shadow case '+scenario.id);count++;
}
let x=screening({area:50,room:'ld',shape:'connected',open:'open',ceiling:'unknown',outdoorSpace:'unknown',install:'any',load:{low:37730,high:53183}});
assert.equal(x.candidates.find(c=>c.id==='cassette_1').status,'survey_required','unknown ceiling is not proof cassette impossible');
assert.equal(x.candidates.find(c=>c.id==='wall_2').status,'survey_required');
assert(x.candidates.filter(c=>c.status!=='excluded').some(c=>c.id==='cassette_1'));
assert(x.candidates.filter(c=>c.status!=='excluded').some(c=>c.id==='wall_2'));
assert.equal(x.total_load_range_btu.high,53183);
x=screening({area:50,room:'ld',shape:'connected',ceiling:'no',outdoorSpace:'one',load:{low:37000,high:53000}});
assert.equal(x.candidates.find(c=>c.id==='cassette_1').status,'excluded');
assert.equal(x.candidates.find(c=>c.id==='wall_2').status,'excluded');
assert.notEqual(x.candidates.find(c=>c.id==='wall_1').status,'excluded');
x=screening({area:16,room:'bed',shape:'compact',open:'closed',ceiling:'no',outdoorSpace:'one',load:{low:8500,high:13000}});
assert.equal(x.candidates.find(c=>c.id==='wall_1').status,'concept_only');
assert.equal(x.candidates.find(c=>c.id==='wall_2').status,'excluded');
console.log('PASS configuration V2 shadow invariants, '+count+' fixture cases');
