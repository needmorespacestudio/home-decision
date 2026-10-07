// Keep the synchronous offline/PWA runtime in lockstep with the maintainable source.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
const source=fs.readFileSync('scripts/cooling-layer.js','utf8').replace(/\r\n/g,'\n').trim();
const replacement='// BEGIN COOLING LAYER\n'+source+'\n// END COOLING LAYER';
const pattern=/\/\/ BEGIN COOLING LAYER[\s\S]*?\/\/ END COOLING LAYER/;
if(!pattern.test(html))throw Error('Missing cooling layer marker');
const updated=html.replace(pattern,replacement);
if(process.argv.includes('--check')){if(updated!==html)throw Error('Cooling layer source/runtime diverged');console.log('Cooling layer runtime mirror matches')}
else fs.writeFileSync('index.html',updated);
