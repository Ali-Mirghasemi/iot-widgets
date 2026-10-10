/** Dependency-free integration tests: simulated Playwright workers, real ZIPs. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQaThemes } from './qa-config.mjs';
import { detectQaResources, estimatedCaptureBytes, planQaConcurrency } from './qa-resources.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = await mkdtemp(path.join(tmpdir(),'iot-qa-parallel-test-'));
const fake = path.join(work,'fake-capture.mjs');
await writeFile(fake, String.raw`
import fs from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
const {WIDGET_QA_THEME:theme,WIDGET_QA_LOCALE:locale,WIDGET_QA_OUTPUT_DIR:out} = process.env;
const categories=['metrics','controls','charts','location','tables','display'];
const started=Date.now();
await fs.mkdir(path.join(out,theme),{recursive:true});
await new Promise(resolve => setTimeout(resolve, 330));
function png(width,height) {
  const raw=Buffer.alloc(height*(1+width*3));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const at=y*(1+width*3)+1+x*3;
    raw[at]=(x+y)%255;raw[at+1]=(x*2)%255;raw[at+2]=(y*3)%255;
  }
  let crc=0xffffffff;
  const chunk=(type,data)=>{
    const name=Buffer.from(type);const contents=Buffer.concat([name,data]);crc=0xffffffff;
    for(const byte of contents){crc^=byte;for(let i=0;i<8;i++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;}
    const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
    const check=Buffer.alloc(4);check.writeUInt32BE((crc^0xffffffff)>>>0);
    return Buffer.concat([len,contents,check]);
  };
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const image=png(800,240);
const captures=[];
for(const category of categories){
  const filename=category+'.png';
  await fs.writeFile(path.join(out,theme,filename),process.env.QA_TEST_BAD_IMAGE===theme+'/'+locale ? 'not an image' : image);
  captures.push({theme,category,file:theme+'/'+filename,widgetVariants:10,renderErrorCount:0,renderErrors:[],diagnostics:[]});
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({locale,captures,consoleErrors:[],started,finished:Date.now()}));
await fs.writeFile(path.join(out,'SUMMARY.txt'),'Simulated screenshot capture');
if (process.env.QA_TEST_FAIL === theme+'/'+locale) process.exit(7);
`, 'utf8');

function entries(buffer) {
  const found=[];
  for (let offset=0; offset<buffer.length-46; offset++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) continue;
    const n=buffer.readUInt16LE(offset+28), extra=buffer.readUInt16LE(offset+30), comment=buffer.readUInt16LE(offset+32);
    const str=buffer.subarray(offset+46,offset+46+n).toString();
    if (str.startsWith('en/') || str.startsWith('fa/') || str === 'QA-MANIFEST.txt') {
      found.push(str);
      offset+=45+n+extra+comment;
    }
  }
  return found;
}

try {
  const themes=getQaThemes().slice(-2);
  assert.equal(themes.length,2);
  const runOutput=path.join(work,'parallel-out');
  const args=['scripts/run-qa.mjs','--themes',themes.join(','),'--locale','both','--jobs','2','--out-dir',runOutput,
    '--base-url','http://127.0.0.1:12345','--capture-script',fake,'--format','png'];
  const first=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:18000});
  assert.equal(first.status,0,first.stderr+'\n'+first.stdout);
  for (const theme of themes) {
    const zip=await readFile(path.join(runOutput,theme+'-qa.zip'));
    const names=entries(zip);
    assert.equal(names.length,19,`unexpected ZIP entries: ${names}`);
    assert.equal(names.length,new Set(names).size,`duplicate ZIP entries: ${names}`);
    assert(names.includes('en/widget-screenshots/report.json'));
    assert(names.includes('fa/widget-screenshots/report.json'));
    assert(names.includes('QA-MANIFEST.txt'));
    assert(names.includes('en/widget-screenshots/'+theme+'/metrics.png'));
  }
  // Two tasks start simultaneously; fake workers retain their timestamps.
  const testRaw=path.join(work,'raw-out');
  const second=spawnSync(process.execPath,[...args.slice(0,7), '--out-dir',testRaw,
    '--base-url','http://127.0.0.1:12345','--capture-script',fake,'--format','png','--keep-project-raw'],
    {cwd:root,encoding:'utf8',timeout:18000});
  assert.equal(second.status,0,second.stderr+'\n'+second.stdout);
  const rawFolder=path.join(testRaw,'qa-raw');
  const dirs=await readdir(rawFolder);
  assert.equal(dirs.length,1);
  const raw=path.join(rawFolder,dirs[0]);
  const a=JSON.parse(await readFile(path.join(raw,themes[0],'en','widget-screenshots','report.json')));
  const b=JSON.parse(await readFile(path.join(raw,themes[0],'fa','widget-screenshots','report.json')));
  const available=detectQaResources();
  const actualPlan=planQaConcurrency({resources:available,tasks:[{theme:themes[0]},{theme:themes[0]}],jobs:2});
  const canOverlap=actualPlan.memoryBudgetBytes >= 2*estimatedCaptureBytes(themes[0]) &&
    available.availableBytes >= actualPlan.reserveBytes + estimatedCaptureBytes(themes[0])*1.65;
  if (canOverlap) {
    assert(a.started<b.finished && b.started<a.finished,`Workers did not overlap: ${JSON.stringify({a,b})}`);
  } else {
    console.log('Actual worker overlap test skipped: host has insufficient available RAM; admission guard correctly serializes captures.');
  }
  // Run from outside the checkout using a path containing spaces. This
  // protects Windows/Linux callers against accidental process.cwd() usage.
  const spaced=path.join(work,'outside working dir');
  await mkdir(spaced,{recursive:true});
  const portableOutput=path.join(work,'portable output');
  const portable=spawnSync(process.execPath,[path.join(root,'scripts','run-qa.mjs'),
    '--themes',themes[0],'--locale','fa','--jobs','1','--out-dir',portableOutput,
    '--base-url','http://127.0.0.1:12345','--capture-script',fake,'--format','png'],
    {cwd:spaced,encoding:'utf8',timeout:18000});
  assert.equal(portable.status,0,portable.stderr+'\n'+portable.stdout);
  assert((await readFile(path.join(portableOutput,themes[0]+'-qa.zip'))).length > 0);
  // Auto mode must work even when the host has a restricted CPU quota.
  const autoOutput=path.join(work,'auto-out');
  const auto=spawnSync(process.execPath,['scripts/run-qa.mjs','--themes',themes.join(','),'--locale','both',
    '--jobs','auto','--out-dir',autoOutput,'--base-url','http://127.0.0.1:12345','--capture-script',fake,'--format','png'],
    {cwd:root,encoding:'utf8',timeout:18000});
  assert.equal(auto.status,0,auto.stderr+'\n'+auto.stdout);
  assert.match(auto.stdout,/Detected: .*CPU threads.*RAM/);
  assert.match(auto.stdout,/\(AUTO; weighted memory admission/);
  const fail=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,QA_TEST_FAIL:themes[1]+'/fa'},encoding:'utf8',timeout:18000});
  assert.equal(fail.status,1,fail.stderr+'\n'+fail.stdout);
  assert.match(fail.stdout,/QA: FAIL/);
  const failureEntries=await readdir(runOutput);
  assert(failureEntries.includes(themes[1]+'-qa-FAILED.zip'), 'failed captures must produce a clearly labelled diagnostics archive');
  assert(!failureEntries.includes(themes[1]+'-qa.zip'), 'failed captures must not leave a normal archive');
  // The worker may exit 0 but write fake/invalid screenshots: treat this as a hard failure.
  const invalid=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,QA_TEST_BAD_IMAGE:themes[0]+'/en'},encoding:'utf8',timeout:18000});
  assert.equal(invalid.status,1,invalid.stderr+'\n'+invalid.stdout);
  assert.match(invalid.stderr,/Screenshot verification failed:/);
  const afterBad=await readdir(runOutput);
  assert(afterBad.includes(themes[0]+'-qa-FAILED.zip'));
  assert(!afterBad.includes(themes[0]+'-qa.zip'));
  console.log(`Parallel QA OK: ${themes.length} themes x 2 locales, ${canOverlap?'concurrent captures confirmed':'concurrency admission tested separately'}, unique ZIP outputs, failure reporting`);
} finally {
  await rm(work,{recursive:true,force:true});
}

// Regression: the real capture script must respect coordinator-provided URLs and paths.
await import('./test-qa-worker.mjs');
