const CACHE="home-decision-v11-private-beta";
const SHELL=["/","/config.js","/manifest.webmanifest","/icons/icon.svg","/scripts/cooling-load-v2.js","/scripts/residential-survey-v3.js","/scripts/beta-study.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 if(e.request.mode==="navigate"){
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const x=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put("/",x)))}return r}).catch(()=>caches.match("/")));
  return;
 }
 if(!SHELL.includes(u.pathname))return;
 // Executable assets use the current release online; cached copies are offline fallbacks.
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const x=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,x)))}return r}).catch(()=>caches.match(e.request)));
});
