const assert=require('node:assert/strict');
const {build}=require('../scripts/compare-configuration-v2.cjs');
const report=build();
assert.equal(report.validation_status,'not_expert_validated');
assert.equal(report.production_engine_unchanged,true);
assert.equal(report.case_count,5);
assert.equal(report.cases.length,report.case_count);
const ids=new Set(report.cases.map(c=>c.case_id));
assert.equal(ids.size,report.cases.length);
for(const c of report.cases){
 assert.equal(c.shadow.recommended_configuration_id,null,'shadow must not claim engineering winner');
 assert.equal(c.review.expert_signoff,'pending','fixtures have no external signoff');
 assert(c.legacy.load_btu_range.low>0&&c.legacy.load_btu_range.high>c.legacy.load_btu_range.low);
 assert.equal(c.shadow.concepts.length,5);
 assert(c.review.reason_codes.includes('v2_no_unverified_winner'));
 if(c.legacy.unit_count===2)assert(c.review.reason_codes.includes('legacy_uses_unverified_zone_split'));
 if(c.shadow.legacy_concept_status==='excluded')assert(c.review.reason_codes.includes('legacy_selected_shadow_excluded_concept'));
}
const c=report.cases.find(x=>x.case_id==='ld_50_total_open');
assert(c.user_reported_reference);
assert(c.review.reason_codes.includes('layout_review_required'));
assert(c.review.reason_codes.includes('ceiling_unverified'));
assert.equal(c.shadow.zone_load_method,'unavailable_without_zone_geometry');
assert.notEqual(c.legacy.fit_status,'fit','50sqm connected fixture cannot be install ready');
console.log('PASS production vs shadow comparison — '+report.case_count+' cases, validation pending');
