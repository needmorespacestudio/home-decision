const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const events={},deleted=[],cached=[],put=[];let fail=false,skipped=false,claimed=false;
const ctx=vm.createContext({URL,location:{origin:'http://localhost'},self:{addEventListener(k,f){events[k]=f},skipWaiting(){skipped=true},clients:{claim(){claimed=true}}},caches:{open:async()=>({addAll:async x=>cached.push(...x),put:async(...x)=>put.push(x)}),keys:async()=>['old-release','home-decision-v7-catalog-evidence'],delete:async k=>deleted.push(k),match:async()=>({offline:true})},fetch:async()=>{if(fail)throw Error('offline');return {network:true,clone(){return{}}}}});
vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
(async()=>{
 let wait;events.install({waitUntil(p){wait=p}});await wait;assert(skipped);assert.deepEqual(cached,['/','/manifest.webmanifest','/icons/icon.svg']);
 events.activate({waitUntil(p){wait=p}});await wait;assert(claimed);assert.deepEqual(deleted,['old-release']);
 let response;const request={method:'GET',mode:'navigate',url:'http://localhost/'};events.fetch({request,respondWith(p){response=p}});assert((await response).network);
 fail=true;events.fetch({request,respondWith(p){response=p}});assert((await response).offline);
 let intercepted=false;events.fetch({request:{...request,method:'POST'},respondWith(){intercepted=true}});assert(!intercepted);
 events.fetch({request:{...request,url:'https://manufacturer.test'},respondWith(){intercepted=true}});assert(!intercepted);
 const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));assert(manifest.icons.length&&manifest.start_url);
 console.log('7 PWA cases passed: install shell, old cache removal, network-first, offline fallback, POST bypass, external bypass, manifest');
})().catch(e=>{console.error(e);process.exitCode=1});
