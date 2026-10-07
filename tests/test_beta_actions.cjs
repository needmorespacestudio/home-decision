const assert=require('node:assert/strict');
const {reset,run,events,ctx}=require('./configuration-harness.cjs');
let copied='';ctx.navigator.clipboard={writeText:async text=>{copied=text}};
ctx.prompt=()=>{};ctx.Blob=class{};ctx.URL={...ctx.URL,createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
ctx.document.createElement=()=>({click(){}});
(async()=>{
 reset();run('hdBegin();hdComplete();finish();openQuoteCompare(lastTop[0].id);copyQuoteRequest()');await Promise.resolve();
 assert(copied.includes('ติดตั้ง'));assert(events.some(e=>e.detail.event==='quote_started'));assert(events.some(e=>e.detail.event==='quote_message_copied'));
 assert.equal(run('hdFlow.success'),true);
 await run('copyBrief()');assert(copied.includes('Home Decision'));assert(events.some(e=>e.detail.event==='decision_brief_copied'));
 run('downloadBrief()');assert(events.some(e=>e.detail.event==='decision_brief_downloaded'));
 const n=events.length;ctx.navigator.clipboard.writeText=async()=>{throw Error('denied')};await run('copyBrief()');assert.equal(events.length,n);
 run('copyQuoteRequest()');await Promise.resolve();await Promise.resolve();assert.equal(events.length,n);
 assert(events.every(e=>!JSON.stringify(e.detail).includes(copied)));
 console.log('6 clipboard/download action checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
