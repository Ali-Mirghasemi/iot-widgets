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
