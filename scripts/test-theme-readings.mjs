import assert from 'node:assert/strict';
import { inspectThemeReadings } from './qa-primary-reading.mjs';
const box=(x,y,w,h)=>({left:x,right:x+w,top:y,bottom:y+h,width:w,height:h});
function sample(height=100,color='visible',x=20){
  const reading={textContent:'24.8°C',getBoundingClientRect:()=>box(x,45,100,38)};
  const body={getBoundingClientRect:()=>box(10,30,300,height)};
  const card={getAttribute:key=>key==='data-widget-theme'?'tactile':key==='data-widget-id'?'temperature':'metric',querySelector:key=>key==='[data-iot-reading]'?reading:key==='[data-responsive-widget-body]'?body:null};
  globalThis.document={querySelectorAll:()=>[card]};
  globalThis.getComputedStyle=()=>({display:color,visibility:'visible',opacity:'1'});
  return inspectThemeReadings();
}
try {
  assert.equal(sample().themeReadingIssues.length,0);
  assert(sample(0).themeReadingIssues.some(i=>i.issue==='unrendered reading'));
  assert(sample(100,'none').themeReadingIssues.some(i=>i.issue==='hidden reading'));
  assert(sample(100,'visible',-20).themeReadingIssues.some(i=>i.issue==='reading clipped beyond body bounds'));
  console.log('Industrial/Tactile primary reading geometry OK: visible, collapsed, hidden, clipped');
} finally {delete globalThis.document; delete globalThis.getComputedStyle;}
