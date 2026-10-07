const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
const source=fs.readFileSync('scripts/analytics-layer.js','utf8').trim();
const replacement='// BEGIN ANALYTICS LAYER\n'+source+'\n// END ANALYTICS LAYER';
const pattern=/\/\/ BEGIN ANALYTICS LAYER[\s\S]*?\/\/ END ANALYTICS LAYER/;
const updated=pattern.test(html)?html.replace(pattern,replacement):html.replace('const quickQs=[',replacement+'\nconst quickQs=[');
if(process.argv.includes('--check')){if(updated!==html)throw Error('Analytics runtime mirror diverged');console.log('Analytics runtime mirror matches')}else fs.writeFileSync('index.html',updated);
