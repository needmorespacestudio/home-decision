const assert=require('node:assert/strict'),fs=require('node:fs');
const {reset,run}=require('./configuration-harness.cjs');
const cases=require('./beta-scenarios.cjs'),packet=[];
for(const scenario of cases){
 reset(scenario.inputs);
 const engine=run('coolingConfigurations()'),c=engine.recommended;
 for(const setup of engine.candidates){
  assert(setup.product_matches.flat().every(p=>p.recommendation_ready&&p.lifecycle==='current'&&p.source_tier!=='C'),scenario.name+' lifecycle');
  assert(run(`coolingConfigurations().candidates.every(c=>c.product_matches.flat().every(p=>phaseCompatible(p)))`),scenario.name+' phase');
  assert(setup.zone_plan.every((z,i)=>setup.product_matches[i].filter(p=>p.match_type==='exact').every(p=>p.nominal_btu>=z.load.high)),scenario.name+' coverage');
 }
 assert(engine.alternatives.length<=2);
 if(scenario.expected)assert.equal(c.configuration_id,scenario.expected);
 if(scenario.count)assert.equal(c.unit_count,scenario.count);
 if(scenario.candidate)assert(engine.candidates.some(x=>x.configuration_id===scenario.candidate));
 if(scenario.excludeType)assert(engine.candidates.every(x=>x.zone_plan.every(z=>z.unit_type!==scenario.excludeType)));
 if(scenario.advanced)assert(c.advanced&&c.product_matches.length===0);
 if(scenario.flag)assert(run('siteFlags()').some(x=>x.includes(scenario.flag)));
 if(scenario.tradeoff)assert(c.tradeoffs.some(x=>x.includes(scenario.tradeoff)));
 if(scenario.unknown)assert.equal(run(`featureEvidence({wifi:true,warranty_summary:'5 years',noise_low_dba:18,feature_tags:['PM2.5'],verified_fields:[]},'${scenario.unknown}').value`),null);
 if(scenario.loadHigherThan){const high=engine.load.high;reset({...scenario.inputs,...scenario.loadHigherThan});assert(high>run('load().high'));reset(scenario.inputs)}
 if(scenario.gap)assert(engine.candidates.every(x=>x.fit_status==='catalog_gap'));
 if(scenario.infeasible)assert.equal(c,null);
 if(scenario.forceZoneGap)assert(run(`(()=>{const c=coolingConfigurations().candidates.find(c=>c.unit_count===2);c.zone_plan[1].load={low:150000,mid:160000,high:170000};return zoneCandidates(c.zone_plan[1],2).length===0})()`));
 run('hdBegin();hdComplete();finish()');
 assert(run('result.innerHTML').includes('hdFeedback'));
 assert(run('briefText()').includes('Home Decision'));
 if(scenario.quote){run('openQuoteCompare(lastTop[0].id)');assert(run('quote.innerHTML').includes('manualCompare'));assert(run('quoteRequestText()').includes('ติดตั้ง'))}
 packet.push({name:scenario.name,inputs:scenario.inputs,expected_review:scenario,actual:{setup:c?.configuration_id||'survey_only',fit:c?.fit_status||'infeasible',reasons:c?.key_reasons||[],tradeoffs:c?.tradeoffs||[],flags:c?.site_check_flags||run('siteFlags()'),zones:c?.zone_plan.map(z=>({type:z.unit_type,low:z.load.low,high:z.load.high}))||[]},automated:'PASS',hvac_review:'PENDING'});
 console.log('PASS '+scenario.name);
}
if(process.argv.includes('--report'))fs.writeFileSync('reports/validation/HVAC_SCENARIOS.json',JSON.stringify(packet,null,2)+'\n');
console.log(cases.length+' private beta validation scenarios passed');
