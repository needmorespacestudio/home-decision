'use strict';
const fs=require('node:fs');
const fixtures=JSON.parse(fs.readFileSync('data/engineering_validation_cases.json','utf8'));
const source=JSON.parse(fs.readFileSync('data/hvac_expert_reviews.json','utf8'));
const ids=new Set(fixtures.cases.map(x=>x.id));
const validNumber=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const assessed=source.reviews.map(r=>{
 const identity=typeof r.reviewer==='string'&&r.reviewer.trim()&&typeof r.reviewed_at==='string'&&r.reviewed_at.trim();
 const method=typeof r.reference_method==='string'&&r.reference_method.trim()&&typeof r.evidence_url==='string'&&/^https:\/\//.test(r.evidence_url);
 const thermal=validNumber(r.reference_total_btu_per_hour)&&validNumber(r.reference_sensible_btu_per_hour)&&validNumber(r.reference_latent_btu_per_hour)&&Math.abs(r.reference_sensible_btu_per_hour+r.reference_latent_btu_per_hour-r.reference_total_btu_per_hour)<=Math.max(300,r.reference_total_btu_per_hour*.03);
 const layout=r.floorplan_verified===true&&r.installation_concepts_verified===true;
 const approved=Boolean(identity&&method&&thermal&&layout);
 return {case_id:r.case_id,approved,missing:[!identity&&'reviewer_and_date',!method&&'method_and_reference_url',!thermal&&'independent_sensible_latent_total',!layout&&'verified_plan_and_configuration'].filter(Boolean)};
});
if(source.reviews.length!==ids.size||new Set(source.reviews.map(r=>r.case_id)).size!==ids.size||source.reviews.some(r=>!ids.has(r.case_id)))throw Error('Reviewer cases must match unique engineering fixtures');
const approved=assessed.filter(x=>x.approved);
const releaseAllowed=approved.length===ids.size;
const result={schema_version:'1.0',review_status:releaseAllowed?'independent_review_complete':'pending_external_evidence',case_count:ids.size,approved_count:approved.length,can_promote_v2:false,expert_evidence_complete:releaseAllowed,cases:assessed,note:'Evidence completion is not an automatic deployment approval; V2 remains gated behind documented decision, tests and phased rollout.'};
if(require.main===module){
 if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
 else {console.log('Expert calibration evidence: '+approved.length+'/'+ids.size+' complete; V2 promotion blocked');for(const c of assessed)console.log(c.case_id+': '+(c.approved?'complete':'pending '+c.missing.join(',')))}
}
module.exports={result,validNumber};
