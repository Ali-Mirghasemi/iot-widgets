import { strict as assert } from 'node:assert';
import { inspectGaugeGeometry } from './qa-gauge-inspection.mjs';

function fakeRect(left,top,width,height){return {left,top,width,height,right:left+width,bottom:top+height};}
function run(dialRect,svgRect,hasFace=true){
  const svg={getBoundingClientRect:()=>svgRect};
  const face={getBoundingClientRect:()=>dialRect,querySelector:()=>svg};
  const gauge={closest:()=>({getAttribute:()=> 'pressure'}),
    getBoundingClientRect:()=>fakeRect(0,0,320,140),
    querySelector:()=>hasFace?face:null};
  globalThis.document={querySelectorAll:()=>[gauge]};
  return inspectGaugeGeometry();
}
try {
  assert.equal(run(fakeRect(95,5,130,130),fakeRect(95,5,130,130)).gaugeIssues.length,0);
  assert.match(run(fakeRect(50,5,220,220),fakeRect(50,5,220,220)).gaugeIssues[0].issue,/clipped/);
  assert.equal(run(fakeRect(95,5,130,130),fakeRect(95,5,130,130),false).gaugeIssues.length,1);
  console.log('Responsive gauge inspection OK: correctly fitted, clipped and missing dials.');
} finally {delete globalThis.document;}
