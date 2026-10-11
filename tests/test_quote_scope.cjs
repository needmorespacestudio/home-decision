const assert=require('node:assert/strict');
const {reset,run,ctx}=require('./configuration-harness.cjs');

let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name)}
reset();

check('quote input and textarea escape untrusted text',()=>{
 const card=run("quickQuoteCard({...newQuickQuote('A'),name:'<img src=x onerror=alert(1)>',notes:'</textarea><script>alert(1)</script>'},0)");
 assert(!card.includes('<img src=x onerror='));
 assert(!card.includes('</textarea><script>'));
 assert(card.includes('&lt;img'));
 assert(card.includes('&lt;/textarea&gt;'));
});
check('quotes never claim the lowest offered total is the lowest installed cost',()=>{
 run("quickQuoteState=[{...newQuickQuote('<b>Store A</b>'),total:22000},{...newQuickQuote('Store B'),total:24000}];analyzeQuickQuotes()");
 const out=ctx.document.getElementById('finalDecision').innerHTML;
 assert.match(out,/ราคารวมที่แจ้งต่ำสุด/);
 assert.match(out,/ยังสรุปไม่ได้/);
 assert.match(out,/VAT/);
 assert.match(out,/ค่าติดตั้ง/);
 assert.match(out,/ไม่ใช่ต้นทุนติดตั้งสุทธิ/);
 assert(out.includes('&lt;b&gt;Store A&lt;/b&gt;'));
 assert(!out.includes('<b>Store A</b>'));
});
check('explicitly excluded installation and VAT remain unresolved',()=>{
 const questions=Array.from(run("quoteMissing({...newQuickQuote('X'),total:25000,installIncluded:'no',vat:'no'})"));
 assert(questions.some(x=>x.includes('ค่าติดตั้งเพิ่มเติม')));
 assert(questions.some(x=>x.includes('VAT เพิ่ม')));
});
check('unknown installation and VAT prompt clarification',()=>{
 const questions=Array.from(run("quoteMissing({...newQuickQuote('X'),total:25000})"));
 assert(questions.some(x=>x.includes('รวมค่าติดตั้ง')));
 assert(questions.some(x=>x.includes('รวม VAT')));
});
check('invalid negative and nonfinite totals cannot be compared',()=>{
 run("quickQuoteState=[newQuickQuote('X')];syncQuickQuote(0,'total','-25')");
 assert.equal(run('quickQuoteState[0].total'),0);
 run("syncQuickQuote(0,'total','Infinity')");
 assert.equal(run('quickQuoteState[0].total'),0);
 run("syncQuickQuote(0,'total','25000')");
 assert.equal(run('quickQuoteState[0].total'),25000);
});
check('zero or invalid totals do not become free offers',()=>{
 run("quickQuoteState=[{...newQuickQuote('A'),total:0},{...newQuickQuote('B'),total:NaN}];analyzeQuickQuotes()");
 assert.match(ctx.document.getElementById('finalDecision').innerHTML,/ใส่ราคารวม/);
});
check('quote information label is qualitative, not an accuracy percentage',()=>{
 const q=run("newQuickQuote('X')");
 const label=run("quoteConfidenceLabel(newQuickQuote('X'))");
 assert.equal(typeof label,'string');
 assert(!label.includes('%'));
 run("quickQuoteState=[{...newQuickQuote('A'),total:20000}];analyzeQuickQuotes()");
 const summary=ctx.document.getElementById('qqsum0').innerHTML;
 assert(!summary.includes('%'));
});
console.log(count+' quote scope/trust checks passed');
