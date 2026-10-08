'use strict';
// Developer-only, repeatable comparison. No production runtime dependency.
const fs=require('node:fs');
const {reset,run}=require('../tests/configuration-harness.cjs');
const {screening}=require('./configuration-v2-shadow.cjs');
const fixtures=JSON.parse(fs.readFileSync('data/engineering_validation_cases.json','utf8'));
function compareCase(c){
 reset(c.inputs);
 const legacy=run('coolingConfigurations()');
 const legacySetup=legacy.recommended;
 const main={area:c.inputs.area,room:c.inputs.room,open:c.inputs.open,shape:c.inputs.shape,zoneUsage:c.inputs.zoneUsage,zoneControl:c.inputs.zoneControl,ceiling:c.inputs.ceiling,install:c.inputs.install,outdoorSpace:c.inputs.outdoorSpace,load:{low:legacy.load.low,high:legacy.load.high}};
 const shadow=screening(main);
 const normalizeId=x=>!x?null:x.configuration_id==='wall_1'?'wall_1':x.configuration_id==='wall_wall_2'?'wall_2':x.configuration_id==='cassette_1'?'cassette_1':x.configuration_id==='cassette_cassette_2'?'cassette_2':x.configuration_id==='wall_cassette_2'?'mixed_2':x.configuration_id;
 const selected=shadow.candidates.find(x=>x.id===normalizeId(legacySetup));
 const reasonCodes=[];
 if(shadow.recommended_configuration_id===null)reasonCodes.push('v2_no_unverified_winner');
 if(legacySetup?.unit_count===2)reasonCodes.push('legacy_uses_unverified_zone_split');
 if(selected?.status==='excluded')reasonCodes.push('legacy_selected_shadow_excluded_concept');
 if(!selected)reasonCodes.push('legacy_setup_outside_shadow_candidates');
 if(shadow.site_checks.some(x=>x.includes('แปลนจริง')))reasonCodes.push('layout_review_required');
 if(!c.inputs.ceiling||c.inputs.ceiling==='unknown')reasonCodes.push('ceiling_unverified');
 if(c.inputs.open==='open'||c.inputs.room==='ld')reasonCodes.push('open_area_requires_expert');
 const s={case_id:c.id,user_reported_reference:c.id==='ld_50_total_open',legacy:{configuration_id:legacySetup?.configuration_id||null,unit_count:legacySetup?.unit_count||null,fit_status:legacySetup?.fit_status||null,load_btu_range:{low:Math.round(legacy.load.low),high:Math.round(legacy.load.high)}},shadow:{recommended_configuration_id:shadow.recommended_configuration_id,legacy_concept_status:selected?.status||'not_applicable',concepts:shadow.candidates.map(x=>({id:x.id,status:x.status})),zone_load_method:shadow.zone_load_method},review:{required:reasonCodes.length>0,reason_codes:reasonCodes,expert_signoff:'pending'}};
 return s;
}
function build(){
 const cases=fixtures.cases.map(compareCase);
 return {generated_from:'repository_fixtures',source_status:fixtures.status,validation_status:'not_expert_validated',production_engine_unchanged:true,case_count:cases.length,cases};
}
if(require.main===module){
 const report=build();
 const raw=JSON.stringify(report,null,2)+'\n';
 if(process.argv.includes('--json'))process.stdout.write(raw);
 else {
  console.log('Configuration V2 comparison (not expert-validated) — '+report.case_count+' cases');
  for(const c of report.cases)console.log(c.case_id+' | production '+(c.legacy.configuration_id||'none')+' / '+c.legacy.fit_status+' | shadow '+c.shadow.legacy_concept_status+' | '+c.review.reason_codes.join(', '));
 }
}
module.exports={build,compareCase};
