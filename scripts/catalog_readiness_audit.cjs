'use strict';
// Source-of-truth catalog health audit. No live-price assumptions or external writes.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const match=html.match(/const PRODUCTS=(\[.*?\]);/s);
assert(match,'Production catalog not found');
const products=JSON.parse(match[1]);
const counts={},issues=[];
for(const p of products){
 const ready=p.recommendation_ready===true;
 counts[p.brand]=(counts[p.brand]||0)+1;
 if(ready){
  for(const k of ['id','model','brand','official_source','checked_at','type','nominal_btu'])if(!p[k])issues.push(p.id+': missing '+k);
  if(!['active','current'].includes(p.lifecycle))issues.push(p.id+': cannot recommend unconfirmed lifecycle');
  if(p.source_tier==='C')issues.push(p.id+': tier C must not be purchase-ready');
  for(const k of ['model','type','nominal_btu'])if(!(p.verified_fields||[]).includes(k))issues.push(p.id+': unverified core field '+k);
 }
}
const ready=products.filter(p=>p.recommendation_ready===true);
const unsupported=products.filter(p=>p.recommendation_ready!==true);
const prices=ready.filter(p=>p.price_status==='live'&&p.price_scope==='unit_only'&&p.price_source_type&&p.price_url&&p.price_checked_at);
const fieldKnown=k=>ready.filter(p=>(p.verified_fields||[]).includes(k)&&p[k]!=null).length;
const summary={
 total:products.length,ready:ready.length,withheld:unsupported.length,brands:Object.keys(counts).length,
 brands_in_catalog:counts,currently_price_sample_candidates:prices.length,
 ready_field_evidence:{nominal_btu:fieldKnown('nominal_btu'),phase:fieldKnown('phase'),seer:fieldKnown('seer'),noise_low_dba:fieldKnown('noise_low_dba'),wifi:fieldKnown('wifi')},
 cautions:['Runtime rows are a curated subset, not Thailand market-wide coverage','Checked dates do not establish current stock','Prices require a separately scoped freshness check at display time']
};
console.log(JSON.stringify(summary,null,2));
assert.equal(issues.length,0,'Catalog readiness contract: '+issues.join('; '));
assert(ready.length>0,'No eligible products');
