import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import ts from 'typescript';

// The layout algorithm is deliberately pure so it can be verified without React or a browser.
const source = readFileSync(new URL('../src/library/layout.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const {settleDashboard} = await import('data:text/javascript,'+encodeURIComponent(code));
const item=(id,x,y,w,h)=>({id,widgetId:'temperature',x,y,w,h});
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const base=[item('a',0,0,3,2),item('b',3,0,3,2),item('c',0,2,6,2)];
let placed=settleDashboard(base,'a',12);
assert.deepEqual(placed,base,'a valid layout must remain stable');
let changed=settleDashboard([item('a',3,0,3,2),...base.slice(1)],'a',12);
for(let i=0;i<changed.length;i++)for(let j=i+1;j<changed.length;j++)assert.ok(!overlaps(changed[i],changed[j]),'collision after moving '+changed[i].id);
changed=settleDashboard([item('a',0,0,8,5),...base.slice(1)],'a',12);
for(let i=0;i<changed.length;i++)for(let j=i+1;j<changed.length;j++)assert.ok(!overlaps(changed[i],changed[j]),'collision after resizing');
const constrained=settleDashboard([item('a',99,-20,50,0)],'a',6)[0];
assert.equal(constrained.x,0);assert.equal(constrained.y,0);assert.equal(constrained.w,6);assert.equal(constrained.h,1);
console.log('Dashboard layout tests passed: stable positions, drag collisions, resize collisions, bounds.');
