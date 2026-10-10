import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import ts from 'typescript';
const source=readFileSync(new URL('../src/library/catalogDashboard.ts',import.meta.url),'utf8');
const layout=readFileSync(new URL('../src/library/layout.ts',import.meta.url),'utf8');
const registry=readFileSync(new URL('../src/widgets/registry.ts',import.meta.url),'utf8');
const transpile=(text)=>ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {settleDashboard}=await import('data:text/javascript,'+encodeURIComponent(transpile(layout)));
const catalogCode=transpile(source).replace(/^import .*;\s*$/gm,'').replace('export function createWidgetCatalogDashboard','function createWidgetCatalogDashboard');
const realIds=[...registry.matchAll(/\bw\(\{id:'([^']+)'/g)].map(m=>m[1]);
assert.equal(new Set(realIds).size,realIds.length,'registry must not repeat IDs');
const canvas=new Set(['time-series','area-chart','bar-chart','histogram','heatmap','map','route','device-table','scada']);
const definitions=realIds.map((id,i)=>({id,category:canvas.has(id)?'charts':'metrics',visual:canvas.has(id)?(id==='map'?'map':id==='route'?'route':'line'):'metric'}));
const isCanvasWidget=(def)=>def.visual==='map'||def.visual==='route'||def.category==='charts';
const getWidgetGridMinimum=(def,columns)=>isCanvasWidget(def)?{w:Math.min(columns,Math.ceil(columns/3)),h:2}:{w:1,h:1};
const createWidgetCatalogDashboard=new Function('widgetRegistry','getWidgetGridMinimum','isCanvasWidget','settleDashboard',catalogCode+'\nreturn createWidgetCatalogDashboard;')(definitions,getWidgetGridMinimum,isCanvasWidget,settleDashboard);
const check=(items,defs,cols)=>{
 assert.equal(items.length,defs.length,'catalog must include all registry widgets');
 assert.deepEqual(new Set(items.map(x=>x.widgetId)),new Set(defs.map(x=>x.id)));
 assert.equal(new Set(items.map(x=>x.id)).size,items.length,'dashboard IDs must be unique');
 for(const a of items){
  assert.ok(a.x>=0&&a.y>=0&&a.w>=1&&a.h>=1&&a.x+a.w<=cols,`invalid bounds ${a.id}`);
  for(const b of items){if(a.id===b.id)continue;
   assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`overlap ${a.id}/${b.id}`);
  }
 }
 const height=Math.max(0,...items.map(x=>x.y+x.h));
 for(let row=0;row<height;row++)assert.ok(items.some(item=>item.y<=row&&item.y+item.h>row),`unused row ${row}`);
};
check(createWidgetCatalogDashboard(12),definitions,12);
check(createWidgetCatalogDashboard(6,definitions),definitions,6);
const extended=[...definitions,{id:'new-widget',category:'metrics',visual:'metric'}];
check(createWidgetCatalogDashboard(12,extended),extended,12);
console.log(`Nexus Catalog OK: all ${realIds.length} registry widgets, no overlap, no unused rows, future widgets automatically included.`);
