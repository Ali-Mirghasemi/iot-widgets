import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = (p) => fs.readFileSync(path.join(root,p),'utf8');
const pkg = JSON.parse(source('package.json'));

const scoped = source('src/library/ScopedIoTWidget.tsx');

test('scoped widget and individually importable frames are exported as package subpaths', () => {
  for (const [name,file] of [
    ['./scoped','library/ScopedIoTWidget'],
    ['./frames/industrial','widgets/themes/ProcessFrame'],
    ['./frames/minimal','widgets/frames/MinimalFrame'],
  ]) {
    assert.equal(pkg.exports[name]?.import,`./dist/${file}.js`);
    assert.equal(pkg.exports[name]?.types,`./dist/${file}.d.ts`);
  }
  assert.match(scoped,/export function createScopedIoTWidget/);
  assert.match(scoped,/export function ScopedWidgetAppearanceProvider/);
  assert.match(source('src/widgets/frames/MinimalFrame.tsx'),/export function MinimalFrame/);
});

test('scoped widget never imports default all-theme registries or demo catalog', () => {
  const runtimeImports = [...scoped.matchAll(/^import (?!type )[^\n]+/gm)].map(x=>x[0]).join('\n');
  for (const excluded of ['WidgetVisuals','WidgetThemeProvider','themeTokens','catalog','WidgetFrame\'','../widgets/registry','library/index']) {
    assert.ok(!runtimeImports.includes(excluded),`unexpected eager import ${excluded}`);
  }
  assert.match(scoped,/createWidgetVisualRenderer\(options\.visualRenderers\)/);
  assert.match(scoped,/options\.frames\[selectedThemeId\]/);
  assert.match(scoped,/options\.definitions\[requestedId\]/);
  assert.match(scoped,/options\.themes\[selectedThemeId\]/);
});

test('unknown widget/theme IDs fail closed instead of using default registry fallback', () => {
  assert.match(scoped,/Widget \"\$\{requestedId\}\" is not included in this build/);
  assert.match(scoped,/Widget theme \"\$\{selectedThemeId\}\" is not included in this build/);
  assert.match(scoped,/visualRenderers\[selectedThemeId\]/);
  assert.match(scoped,/matching tokens, visual renderer and frame/);
});

test('production scoped widget defaults to no demo fallback, no false live, no invented readings', () => {
  assert.match(scoped,/demoFallback = false/);
  assert.match(scoped,/demoFallback \? baseDefinition\.mock : \{\}/);
  assert.match(scoped,/data-widget-unavailable="true"/);
  assert.match(scoped,/needsTelemetry && noValues/);
  assert.match(scoped,/isControl && !onInteraction/);
  assert.doesNotMatch(scoped,/status: 'Live'/);
});

test('full registry remains the opt-in root library API', () => {
  const code=source('src/library/index.ts');
  assert.match(code,/export \{ IoTWidget \} from '\.\/IoTWidget'/);
  assert.match(source('src/widgets/renderers/WidgetVisuals.tsx'),/createWidgetVisualRenderer\(visualRenderers\)/);
});
