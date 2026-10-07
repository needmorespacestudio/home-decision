const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

function makeState(overrides={}){
  return Object.assign({
    area:15,height:2.7,room:'bed',usage:'night',sun:'morning',glass:'unknown',roof:'unknown',open:'unknown',
    people:2,shape:'compact',install:'any',phase:'unknown',zoneUsage:'unknown',zoneControl:'unknown'
  },overrides);
}
function harness(state,mode='quick'){
  const ctx={
    console,window:{},document:{querySelector(){return null}},
    s:state,flowMode:mode,
    load(){return {low:state.area*650,mid:state.area*700,high:state.area*750}},
    getQs(){return [['room','r',[]],['area','a',[]],['sun','s',[]],['usage','u',[]],['budget','b',[]]]},
    siteFlags(){return []},
    configurationResult(){},
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('scripts/cooling-load-v2.js','utf8'),ctx);
  return ctx;
}
let n=0;
function test(name,fn){fn();n++;console.log('ok',n,'-',name)}

test('exports v2 engine',()=>{const c=harness(makeState());assert.equal(typeof c.homeDecisionCoolingLoadV2,'function')});
test('keeps production primary method',()=>{const c=harness(makeState());assert.equal(c.load().method,'validated_legacy_primary_with_v2_shadow')});
test('attaches engineering payload',()=>{const c=harness(makeState());assert.equal(c.load().engineering_v2.method,'component_shadow')});
test('component loads are positive',()=>{const e=harness(makeState()).homeDecisionCoolingLoadV2();assert(e.sensible_btu>0&&e.latent_btu>0)});
test('range is ordered',()=>{const e=harness(makeState()).homeDecisionCoolingLoadV2();assert(e.low<e.mid&&e.mid<e.high)});
test('unknown inputs reduce confidence',()=>{const e=harness(makeState()).homeDecisionCoolingLoadV2();assert.notEqual(e.confidence,'high')});
test('known simple room can reach high confidence',()=>{const e=harness(makeState({glass:'low',roof:'no',open:'closed'})).homeDecisionCoolingLoadV2();assert.equal(e.confidence,'high')});
test('large area is risky',()=>{const e=harness(makeState({area:90,glass:'medium',roof:'no',open:'closed'})).homeDecisionCoolingLoadV2();assert(e.risky.includes('large_area'))});
test('high ceiling is risky',()=>{const e=harness(makeState({height:4,glass:'medium',roof:'no',open:'closed'})).homeDecisionCoolingLoadV2();assert(e.risky.includes('high_ceiling'))});
test('high west glazing is risky',()=>{const e=harness(makeState({sun:'afternoon',glass:'high',roof:'no',open:'closed'})).homeDecisionCoolingLoadV2();assert(e.risky.includes('high_solar_glazing'))});
test('open plan is risky',()=>{const e=harness(makeState({glass:'medium',roof:'no',open:'open'})).homeDecisionCoolingLoadV2();assert(e.risky.includes('open_plan'))});
test('connected rooms are risky',()=>{const e=harness(makeState({shape:'connected',glass:'medium',roof:'no',open:'partial'})).homeDecisionCoolingLoadV2();assert(e.risky.includes('connected_rooms'))});
test('living dining records pantry uncertainty',()=>{const e=harness(makeState({room:'ld',glass:'medium',roof:'no',open:'partial'})).homeDecisionCoolingLoadV2();assert(e.risky.includes('pantry_heat_source_unknown'))});
test('more occupants increase load',()=>{const a=harness(makeState({people:2})).homeDecisionCoolingLoadV2();const b=harness(makeState({people:6})).homeDecisionCoolingLoadV2();assert(b.mid>a.mid)});
test('more glazing increases glazing load',()=>{const a=harness(makeState({glass:'low'})).homeDecisionCoolingLoadV2();const b=harness(makeState({glass:'high'})).homeDecisionCoolingLoadV2();assert(b.components.glazing>a.components.glazing)});
test('afternoon sun raises glazing load over shade',()=>{const a=harness(makeState({sun:'shade',glass:'medium'})).homeDecisionCoolingLoadV2();const b=harness(makeState({sun:'afternoon',glass:'medium'})).homeDecisionCoolingLoadV2();assert(b.components.glazing>a.components.glazing)});
test('top floor raises roof load',()=>{const a=harness(makeState({roof:'no'})).homeDecisionCoolingLoadV2();const b=harness(makeState({roof:'yes'})).homeDecisionCoolingLoadV2();assert(b.components.roof>a.components.roof)});
test('open plan raises infiltration latent',()=>{const a=harness(makeState({open:'closed'})).homeDecisionCoolingLoadV2();const b=harness(makeState({open:'open'})).homeDecisionCoolingLoadV2();assert(b.components.infiltration_latent>a.components.infiltration_latent)});
test('office internal gains exceed bedroom',()=>{const a=harness(makeState({room:'bed'})).homeDecisionCoolingLoadV2();const b=harness(makeState({room:'office'})).homeDecisionCoolingLoadV2();assert(b.components.internal>a.components.internal)});
test('strong sun quick flow asks glazing',()=>{const c=harness(makeState({sun:'afternoon',glass:'unknown',roof:'no',open:'closed'}));assert(c.getQs().some(q=>q[0]==='glass'))});
test('large quick flow asks roof',()=>{const c=harness(makeState({area:30,glass:'medium',roof:'unknown',open:'closed'}));assert(c.getQs().some(q=>q[0]==='roof'))});
test('large quick flow asks openness',()=>{const c=harness(makeState({area:35,glass:'medium',roof:'no',open:'unknown'}));assert(c.getQs().some(q=>q[0]==='open'))});
test('simple quick flow avoids extra glazing when known',()=>{const c=harness(makeState({area:15,sun:'morning',glass:'low',roof:'no',open:'closed'}));assert(!c.getQs().some(q=>q[0]==='glass'))});
test('detailed flow not mutated with duplicate adaptive questions',()=>{const c=harness(makeState(),'detailed');assert.equal(c.getQs().filter(q=>q[0]==='glass').length,0)});
test('low confidence widens legacy range',()=>{const c=harness(makeState({area:90,height:4,sun:'afternoon',glass:'high',roof:'unknown',open:'open'}));const L=c.load();assert(L.low<90*650&&L.high>90*750)});
test('high confidence leaves legacy range unchanged',()=>{const s=makeState({glass:'low',roof:'no',open:'closed'});const c=harness(s);const L=c.load();assert.equal(L.low,s.area*650);assert.equal(L.high,s.area*750)});
test('low confidence creates site flag',()=>{const c=harness(makeState({area:90,height:4,sun:'afternoon',glass:'high',roof:'unknown',open:'open'}));assert(c.siteFlags().some(x=>x.includes('Cooling Load')))});
test('large model disagreement creates review flag when present',()=>{const c=harness(makeState({area:15,glass:'low',roof:'no',open:'closed'}));const e=c.homeDecisionCoolingLoadV2();if(e.crosscheck!=='aligned')assert(c.siteFlags().some(x=>x.includes('โมเดลคำนวณสองวิธี')))});
test('shadow assumptions explicitly deny standards compliance',()=>{const e=harness(makeState()).homeDecisionCoolingLoadV2();assert.match(e.assumptions.note,/not Manual J\/ASHRAE-compliant/)});
test('component object exposes seven decision components',()=>{const e=harness(makeState()).homeDecisionCoolingLoadV2();assert.equal(Object.keys(e.components).length,7)});
test('latent load is separate from sensible',()=>{const e=harness(makeState());assert(e.latent_btu>0&&e.sensible_btu>0&&Math.abs(e.mid-(e.latent_btu+e.sensible_btu))<10)});
test('unknown glass is listed unresolved',()=>{const e=harness(makeState({glass:'unknown'})).homeDecisionCoolingLoadV2();assert(e.unresolved.includes('พื้นที่กระจก'))});
test('unknown roof is listed unresolved',()=>{const e=harness(makeState({roof:'unknown'})).homeDecisionCoolingLoadV2();assert(e.unresolved.includes('สภาพชั้นบน/หลังคา'))});
test('unknown openness is listed unresolved',()=>{const e=harness(makeState({open:'unknown'})).homeDecisionCoolingLoadV2();assert(e.unresolved.includes('การเปิดเชื่อมพื้นที่'))});
test('hot humid infiltration has latent component',()=>{const e=harness(makeState({open:'partial'})).homeDecisionCoolingLoadV2();assert(e.components.infiltration_latent>0)});
test('night solar factor reduces afternoon solar versus afternoon use',()=>{const a=harness(makeState({sun:'afternoon',usage:'night',glass:'high'})).homeDecisionCoolingLoadV2();const b=harness(makeState({sun:'afternoon',usage:'afternoon',glass:'high'})).homeDecisionCoolingLoadV2();assert(b.components.glazing>a.components.glazing)});
test('result method never claims exact engineering',()=>{const L=harness(makeState()).load();assert.notEqual(L.method,'manual_j')});

console.log(n+' cooling load v2 cases passed');
