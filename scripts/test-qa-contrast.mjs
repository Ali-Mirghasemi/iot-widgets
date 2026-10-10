import { strict as assert } from 'node:assert';
import { inspectIOSReadingContrast } from './qa-contrast.mjs';
function simulate(bg, fg, dark = false) {
  const reading = {};
  const frame = {
    getAttribute: name => name === 'data-ios-surface-color' ? bg : dark ? 'dark' : 'light',
    querySelector: selector => selector === '[data-iot-reading]' ? reading : null,
  };
  const card = {
    getAttribute: () => 'temperature',
    querySelector: () => frame,
  };
  globalThis.document = { querySelectorAll: () => [card] };
  globalThis.getComputedStyle = () => ({ color: fg });
  return inspectIOSReadingContrast();
}
try {
  assert.equal(simulate('#f8f9fb', 'rgb(241,245,255)').contrastIssues.length, 1, 'white-on-white must fail');
  assert.equal(simulate('#f8f9fb', 'rgb(28,28,30)').contrastIssues.length, 0, 'dark-on-light must pass');
  assert.equal(simulate('#161e2e', 'rgb(241,245,255)', true).contrastIssues.length, 0, 'light-on-dark must pass');
  assert.equal(simulate('#161e2e', 'rgb(28,28,30)', true).contrastIssues.length, 1, 'dark-on-dark must fail');
  assert.equal(simulate('#161e2e', 'rgb(241,245,255)', true).contrastReadings, 1);
  console.log('Cupertino reading contrast QA: 4 polarity cases passed.');
} finally {
  delete globalThis.document;
  delete globalThis.getComputedStyle;
}

// A missing iOS metric reading must fail QA even when there are no low-contrast nodes.
const missingCard = {
  getAttribute: key => key === 'data-widget-visual' ? 'metric' : 'temperature',
  querySelector: () => ({ getAttribute: () => '#161e2e', querySelector: () => null }),
};
globalThis.document = { querySelectorAll: () => [missingCard] };
const missing = inspectIOSReadingContrast();
assert.equal(missing.expectedReadings, 1);
assert.equal(missing.contrastReadings, 0);
assert.equal(missing.contrastIssues[0].issue, 'missing primary reading');

// Regression: a visible reading inside a 0px-high body is NOT a valid widget.
function geometryCase(bodyHeight) {
  const rect=(x,y,width,height)=>({left:x,top:y,width,height,right:x+width,bottom:y+height});
  const reading={textContent:'24.8 °C',getBoundingClientRect:()=>rect(20,60,130,46)};
  const body={getBoundingClientRect:()=>rect(10,52,333,bodyHeight)};
  const slot={getBoundingClientRect:()=>rect(10,52,333,bodyHeight)};
  const frame={
    getAttribute:key=>key==='data-ios-surface-color'?'#161f2f':'dark',
    querySelector:key=>key==='[data-iot-reading]'?reading:key==='[data-responsive-widget-body]'?body:key==='[data-ios-content-slot]'?slot:null,
    getBoundingClientRect:()=>rect(10,10,353,190),
  };
  const card={getAttribute:key=>key==='data-widget-visual'?'metric':'temperature',querySelector:()=>frame};
  globalThis.document={querySelectorAll:()=>[card]};
  globalThis.getComputedStyle=el=>({color:'rgb(241,245,255)',display:'flex',visibility:'visible',opacity:'1',getPropertyValue:()=>el===frame?'#f1f5ff':''});
  return inspectIOSReadingContrast();
}
try {
  const collapsed=geometryCase(0);
  assert(collapsed.contrastIssues.some(issue=>issue.issue==='reading not visible in widget body'));
  const clipped=collapsed.contrastIssues.find(issue=>issue.issue==='reading not visible in widget body');
  assert.equal(clipped.body.height,0);
  assert.equal(clipped.frame.height,190);
  assert.equal(clipped.slot.height,0);
  assert.equal(geometryCase(145).contrastIssues.length,0,'a visible reading inside a sized body passes');
  console.log('Cupertino geometry QA: zero-height body and visible reading cases passed.');
} finally {
  delete globalThis.document;
  delete globalThis.getComputedStyle;
}
