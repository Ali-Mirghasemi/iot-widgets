import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const file=new URL('../src/widgets/renderers/gaugeSizing.ts',import.meta.url);
const source=readFileSync(file,'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {measureGaugeLayout}=await import('data:text/javascript,'+encodeURIComponent(js));
for(const width of [120,240,320,375,768,1280])for(const height of [70,105,130,145,210,320,500]){
  for(const view of ['compact','standard','detailed'])for(const history of [0,18]){
    const layout=measureGaugeLayout({width,height},view,history);
    const mainHeight=height-layout.traceHeight-(layout.showTrace?10:0);
    const allowedWidth=layout.horizontal?(width-12)/2:width;
    assert(layout.diameter<=Math.floor(allowedWidth),`width overflow at ${width}x${height}`);
    assert(layout.diameter<=mainHeight,`height overflow at ${width}x${height}`);
    assert(layout.diameter>=1);
    assert(!layout.showTrace || (layout.detailed&&history>=2));
  }
}
assert.equal(measureGaugeLayout({width:330,height:135},'standard').diameter,135);
assert.equal(measureGaugeLayout({width:375,height:115},'compact').diameter,115);
assert.equal(measureGaugeLayout({width:700,height:410},'detailed',18).showTrace,true);
assert.equal(measureGaugeLayout({width:700,height:410},'detailed',0).showTrace,false);
console.log('Gauge sizing OK across 6 widths, 7 heights, 3 densities, and history modes.');
