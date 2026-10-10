/** Dependency-free test of the REAL capture worker's shared-Vite/output-dir contract. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { verifyCapture } from './qa-verify.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=await mkdtemp(path.join(tmpdir(),'iot-qa-worker-contract-'));
const fakeProject=path.join(temp,'source');
const scriptDir=path.join(fakeProject,'scripts');
const out=path.join(temp,'worker-a');
const sentDir=path.join(fakeProject,'widget-screenshots');
const server=createServer((_req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<html>Fake QA preview</html>');});
try {
  await mkdir(path.join(fakeProject,'node_modules','playwright'),{recursive:true});
  await mkdir(path.join(fakeProject,'src','widgets','core'),{recursive:true});
  await mkdir(scriptDir,{recursive:true});
  await mkdir(sentDir,{recursive:true});
  await writeFile(path.join(sentDir,'KEEP.txt'),'must stay untouched');
  await cp(path.join(root,'scripts','capture-widgets.mjs'),path.join(scriptDir,'capture-widgets.mjs'));
  await cp(path.join(root,'scripts','qa-config.mjs'),path.join(scriptDir,'qa-config.mjs'));
  await cp(path.join(root,'src','widgets','core','types.ts'),path.join(fakeProject,'src','widgets','core','types.ts'));
  await writeFile(path.join(fakeProject,'package.json'),'{"type":"module"}\n');
  await writeFile(path.join(fakeProject,'node_modules','playwright','package.json'),'{"name":"playwright","version":"0.0.0","type":"module","exports":"./index.js"}\n');
  // This fake only drives the worker contract. It does not substitute for real browser validation.
  await writeFile(path.join(fakeProject,'node_modules','playwright','index.js'),String.raw`
import fs from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
function crc(bytes) { let c=0xffffffff;for(const x of bytes){c^=x;for(let n=0;n<8;n++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;}return (c^0xffffffff)>>>0; }
function chunk(name,data){const n=Buffer.from(name),sz=Buffer.alloc(4),check=Buffer.alloc(4);sz.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([n,data])));return Buffer.concat([sz,n,data,check]);}
function png(){const w=1000,h=300,raw=Buffer.alloc(h*(1+w*3));const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
let current='';
const page={on(){},goto:async u=>{current=u;return {ok:()=>true};},url:()=>current,
 waitForSelector:async()=>{},waitForTimeout:async()=>{},
 evaluate:async fn => fn.toString().includes('document.querySelectorAll')?[{id:'test',size:'1x1',theme:'studio',category:'metrics',suspects:[],cardScrollOverflow:false,bodyScrollOverflow:false}]:undefined,
 locator:selector=>({evaluateAll:async()=>[],count:async()=>0,getAttribute:async()=>selector.includes('data-qa-page')?'rtl':null}),
 screenshot:async opts=>fs.writeFile(opts.path,png()),
};
export const chromium={launch:async()=>({newContext:async()=>({newPage:async()=>page}),close:async()=>{}})};
`);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const result=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(scriptDir,'capture-widgets.mjs')],{cwd:temp,env:{...process.env,
      WIDGET_QA_URL:url,WIDGET_QA_OUTPUT_DIR:out,WIDGET_QA_THEME:'studio',WIDGET_QA_LOCALE:'fa',
      WIDGET_QA_CATEGORY:'metrics',WIDGET_QA_IMAGE_FORMAT:'png',WIDGET_QA_WIDGET_SHEETS:'0'},
      stdio:['ignore','pipe','pipe']});
    let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
    child.once('error',reject);child.once('close',code=>resolve({code,log}));
  });
  assert.equal(result.code,0,result.log);
  assert.equal(await readFile(path.join(sentDir,'KEEP.txt'),'utf8'),'must stay untouched', 'worker deleted shared screenshot directory');
  const checked=await verifyCapture({directory:out,theme:'studio',locale:'fa',category:'metrics',format:'png'});
  assert.equal(checked.ok,true,JSON.stringify(checked));
  const report=JSON.parse(await readFile(path.join(out,'report.json'),'utf8'));
  assert.equal(report.captures.length,1);
  assert.match(result.log,/Capturing studio \/ metrics/);
  assert.doesNotMatch(result.log,/\[vite\]/,'worker spawned a private Vite server');
  console.log('QA worker contract OK: external shared server, isolated screenshots, preserved shared directory, valid PNG');
} finally {
  await new Promise(resolve=>server.close(resolve));
  await rm(temp,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
