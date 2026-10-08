// Engineering regression fixtures do not constitute expert HVAC validation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {reset,run}=require('./configuration-harness.cjs');
const pack=JSON.parse(fs.readFileSync('data/engineering_validation_cases.json','utf8'));
assert.equal(pack.status,'synthetic_for_regression_not_hvac_validated');
const byId=new Map(pack.cases.map(c=>[c.id,c]));
assert.equal(byId.size,pack.cases.length,'duplicate case identifiers');
for(const c of pack.cases){
 assert.equal(c.expert_review,'pending',c.id+' cannot be presented as independently validated');
 reset(c.inputs);
 const result=run('coolingConfigurations()');
 assert(result.load.low>0&&result.load.mid>0&&result.load.high>0,c.id+' produces valid positive load');
 assert(result.load.low<result.load.mid&&result.load.mid<result.load.high,c.id+' load is ordered');
 if(c.expect.single_wall_candidate){
  assert(result.candidates.some(x=>x.configuration_id==='wall_1'),c.id+' retains single wall option');
 }
 if(c.expect.must_site_check){
  assert(result.candidates.length>0,c.id+' has at least one conceptual candidate');
  assert(result.candidates.every(x=>x.fit_status!=='fit'),c.id+' must not silently claim install-ready');
  assert(result.candidates.some(x=>x.unit_count===2),c.id+' maintains conceptual multi-zone comparison');
 }
 if(c.expect.never_claim_independent_zone_calculation){
  for(const config of result.candidates.filter(x=>x.unit_count===2)){
   assert(config.site_check_flags.some(f=>f.includes('สัดส่วนเบื้องต้น')),c.id+' must disclose preliminary split');
   assert(config.confidence==='low',c.id+' cannot label preliminary zonal targets high confidence');
  }
 }
 if(c.expect.full_area_used_once){
  const L=result.load;
  for(const config of result.candidates.filter(x=>x.unit_count===2)){
   const sum=config.zone_plan.reduce((n,z)=>n+z.load.mid,0);
   assert(Math.abs(sum-L.mid)<0.0001,c.id+' total estimated load must be divided, not duplicated');
  }
 }
 console.log('PASS engineering fixture:',c.id);
}
const reference=byId.get('ld_50_total_open');
assert.equal(reference.inputs.area,50);
assert.equal(reference.user_observation.brief_load_low_btu,37730);
assert.equal(reference.user_observation.brief_load_high_btu,53183);
assert(reference.unknown_fields.includes('roof'),'unreported roof conditions must remain unknown');
const settings=byId.get('ld_50_total_open').inputs;
reset({...settings,sun:'shade'});
const shade=run('coolingConfigurations().load.mid');
reset({...settings,sun:'afternoon'});
const afternoon=run('coolingConfigurations().load.mid');
assert(afternoon>shade,'afternoon sun must not lower load');
console.log('PASS engineering fixtures: '+pack.cases.length+' cases; validation still pending');
