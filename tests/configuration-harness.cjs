const fs=require('node:fs'),vm=require('node:vm');
const elements=new Map();
function element(){return {innerHTML:'',value:'',style:{},classList:{add(){},remove(){},contains(){return false}},addEventListener(){},scrollIntoView(){},querySelectorAll(){return[]},querySelector(){return element()}}}
const events=[];
const ctx=vm.createContext({console,Intl,URL,Date,CustomEvent:class{constructor(type,data){this.type=type;this.detail=data.detail}},window:{addEventListener(){},dispatchEvent(e){events.push(e)}},navigator:{userAgent:''},document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelectorAll(){return[]}},scrollTo(){},alert(){},setTimeout(){}});
const html=fs.readFileSync('index.html','utf8');
vm.runInContext([...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const PRODUCTS=')),ctx);
for(const id of ['home','wiz','result','quote','advanced'])ctx[id]=ctx.document.getElementById(id);
const base={room:'bed',area:18,height:2.7,sun:'shade',glass:'low',roof:'no',open:'closed',people:2,usage:'night',install:'any',phase:'1',specialNeeds:[],needsAnswered:true,budgetMode:'unset',budgetAmount:null,priorities:['quiet','saving','smart'],ceiling:'no',shape:'compact',zoneUsage:'together',zoneControl:'no'};
function reset(changes={}){vm.runInContext('s='+JSON.stringify({...base,...changes})+';selectedSetupId=null;setupProductsOpen=false;activeZoneIndex=0;lastSetup=null;resultView="requirements";',ctx);events.length=0}
function run(code){return vm.runInContext(code,ctx)}
module.exports={ctx,events,base,reset,run};
