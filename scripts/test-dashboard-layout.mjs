import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import ts from 'typescript';

const source=readFileSync(new URL('../src/library/layout.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {settleDashboard}=await import('data:text/javascript,'+encodeURIComponent(code));
const item=(id,x,y,w,h)=>({id,widgetId:'temperature',x,y,w,h});
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const minFor=(i,cols)=>['map','time-series'].includes(i.widgetId)?{w:Math.ceil(cols/3),h:2}:{w:1,h:1};
function verify(items,columns=12) {
  for (const i of items) {
    assert.ok(i.x>=0&&i.y>=0&&i.w>=1&&i.h>=1&&i.x+i.w<=columns,`bounds: ${i.id}`);
  }
  for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
    assert.ok(!overlaps(items[a],items[b]),`overlap: ${items[a].id}/${items[b].id}`);
  }
  const rows=Math.max(0,...items.map(i=>i.y+i.h));
  for(let y=0;y<rows;y++)assert.ok(items.some(i=>i.y<=y&&i.y+i.h>y),`empty row ${y}`);
}
const base=[item('a',0,0,3,2),item('b',3,0,3,2),item('c',0,2,6,2)];
const compact=settleDashboard(base,undefined,12,minFor);
verify(compact);
assert.equal(compact.find(x=>x.id==='c').y,0,'later widgets fill the first available row');
assert.equal(compact.find(x=>x.id==='c').x,6,'the first row packs horizontally');

const reordered=settleDashboard([item('a',0,0,3,2),item('b',3,0,3,2),item('c',0,0,6,2)],'c',12,minFor);
verify(reordered);
assert.equal(reordered.find(x=>x.id==='c').x,0,'dragging onto the first slot moves that card ahead');
assert.equal(reordered.find(x=>x.id==='a').x,6);
assert.equal(reordered.find(x=>x.id==='b').x,9);

const resized=settleDashboard([item('a',0,0,9,5),item('b',3,0,3,2),item('c',0,2,6,2)],'a',12,minFor);
verify(resized);
assert.ok(resized.find(x=>x.id==='a').w===9,'resize keeps requested width');
assert.ok(resized.find(x=>x.id==='a').h===5,'resize keeps requested height');

const moved=settleDashboard([item('a',0,9,3,2),item('b',3,0,3,2),item('c',0,2,6,2)],'a',12,minFor);
verify(moved);
assert.ok(moved.find(x=>x.id==='a').y<9,'dragging down reorders; it cannot leave blank rows');

const single=settleDashboard([item('lonely',6,42,2,2)],undefined,12,minFor)[0];
assert.deepEqual([single.x,single.y],[0,0],'a single widget has no empty leading rows/columns');

const constrained=settleDashboard([item('a',99,-20,50,0)],'a',6,minFor)[0];
assert.deepEqual([constrained.x,constrained.y,constrained.w,constrained.h],[0,0,6,1]);
const map=settleDashboard([{...item('map-1',10,9,1,1),widgetId:'map'},item('b',0,0,4,2)],undefined,12,minFor);
verify(map);
assert.deepEqual([map[0].w,map[0].h],[4,2]);

const afterDeletion=settleDashboard([item('first',0,0,6,2),item('last',0,20,6,2)],undefined,12,minFor);
verify(afterDeletion);
assert.equal(afterDeletion[1].y,0,'deleting a card fills its hole');

// Repeatability, density and collision freedom for varied item sizes.
for(let seed=1;seed<=100;seed++){
  let value=seed;
  const rand=(n)=>{value=(value*1664525+1013904223)>>>0;return value%n;};
  const many=Array.from({length:15},(_,i)=>item('test-'+i,rand(12),rand(18),1+rand(6),1+rand(4)));
  const arranged=settleDashboard(many,undefined,12,minFor);
  verify(arranged);
  // The layout should never shift again when saved and reloaded.
  assert.deepEqual(settleDashboard(arranged,undefined,12,minFor),arranged,`stable re-pack at seed ${seed}`);
}
console.log('Dashboard layout: dense top packing, drag reorder, resize, map minimum, deletion, repeatability (100 cases) OK');
