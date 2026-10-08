const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const events={},deleted=[],cached=[],put=[];let fail=false,skipped=false,claimed=false,ok=true;
const current='home-decision-v11-private-beta';
const ctx=vm.createContext({URL,location:{origin:'http://localhost'},self:{addEventListener(k,f){events[k]=f},skipWaiting(){skipped=true},clients:{claim(){claimed=true}}},caches:{open:async()=>({addAll:async x=>cached.push(...x),put:async(...x)=>put.push(x)}),keys:async()=>['old-release',current],delete:async k=>deleted.push(k),match:async()=>({offline:true})},fetch:async()=>{if(fail)throw Error('offline');return {network:true,ok,clone(){return{}}}}});
vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
(async()=>{
 let wait;events.install({waitUntil(p){wait=p}});await wait;assert(skipped);assert(cached.includes('/config.js')&&cached.includes('/scripts/beta-study.js'));assert(cached.includes('/scripts/residential-survey-v3.js'));
 events.activate({waitUntil(p){wait=p}});await wait;assert(claimed);assert.deepEqual(deleted,['old-release']);
 async function response(request){let value;const waits=[];events.fetch({request,respondWith(p){value=p},waitUntil(p){waits.push(p)}});const result=await value;await Promise.all(waits);return result}
 const request={method:'GET',mode:'navigate',url:'http://localhost/'};
 assert((await response(request)).network);
 assert((await response({...request,mode:'cors',url:'http://localhost/scripts/residential-survey-v3.js'})).network,'script must prefer fresh network');
 fail=true;assert((await response(request)).offline);assert((await response({...request,mode:'cors',url:'http://localhost/scripts/beta-study.js'})).offline);fail=false;
 const before=put.length;ok=false;await response(request);assert.equal(put.length,before,'errors must not overwrite shell');ok=true;
 for(const r of [{...request,method:'POST'},{...request,url:'https://manufacturer.test'},{...request,mode:'cors',url:'http://localhost/api/quotes'}])assert.equal(await response(r),undefined);
 const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));assert(manifest.icons.length&&manifest.start_url);
 console.log('10 PWA cases passed');
})().catch(e=>{console.error(e);process.exitCode=1});
