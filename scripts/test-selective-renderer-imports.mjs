import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const read = (file)=>fs.readFileSync(path.join(root,file),'utf8');
const expected = {
  material:['MaterialVisuals','MaterialVisualRenderer'],
  flat:['FlatVisuals','FlatVisualRenderer'],
  minimal:['MinimalVisuals','MinimalVisualRenderer'],
  gaming:['GamingVisuals','GamingVisualRenderer'],
  ios:['IOSVisuals','IOSVisualRenderer'],
  glass:['GlassVisuals','GlassVisualRenderer'],
  studio:['StudioVisuals','StudioVisualRenderer'],
  horizon:['StudioVisuals','StudioVisualRenderer'],
  industrial:['ProcessVisuals','ProcessVisualRenderer'],
  tactile:['TactileVisuals','TactileVisualRenderer'],
};

test('selective rendering core has no eager theme imports or root-package imports',()=>{
  const code=read('src/widgets/renderers/WidgetVisualCore.tsx');
  assert.match(code,/export function createWidgetVisualRenderer/);
  assert.doesNotMatch(code,/from\s*['"][^'"]*(?:\/themes\/|WidgetVisuals|\/library\/index)/);
  assert.match(code,/if\(!Renderer\) throw new Error/);
  assert.match(code,/renderers\[props\.theme\.id\]/);
});

test('all themes use individual public entry points with matching files and exports',()=>{
  assert.ok(pkg.exports['./visual-core']);
  assert.ok(fs.existsSync(path.join(root,'src/widgets/renderers/WidgetVisualCore.tsx')));
  for(const [id,[file,symbol]] of Object.entries(expected)){
    const entry=pkg.exports[`./renderers/${id}`];
    assert.equal(entry?.import,`./dist/widgets/themes/${file}.js`);
    assert.equal(entry?.types,`./dist/widgets/themes/${file}.d.ts`);
    assert.match(read(`src/widgets/themes/${file}.tsx`),new RegExp(`export function ${symbol}\\b`));
  }
});

test('legacy full renderer registry still includes all themes',()=>{
  const code=read('src/widgets/renderers/WidgetVisuals.tsx');
  assert.match(code,/createWidgetVisualRenderer\(visualRenderers\)/);
  for(const name of Object.keys(expected)) assert.match(code,new RegExp(`\\b${name}: `));
});
