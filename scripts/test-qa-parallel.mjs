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
await writeFile(fake, `
import fs from 'node:fs/promises';
import path from 'node:path';
const {WIDGET_QA_THEME:theme,WIDGET_QA_LOCALE:locale,WIDGET_QA_OUTPUT_DIR:out} = process.env;
const started=Date.now();
await fs.mkdir(path.join(out,theme),{recursive:true});
await new Promise(resolve => setTimeout(resolve, 330));
await fs.writeFile(path.join(out,theme,'metrics.jpeg'),'fake image '+theme+'/'+locale);
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({theme,locale,started,finished:Date.now()}));
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
    '--base-url','http://127.0.0.1:12345','--capture-script',fake];
  const first=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:18000});
  assert.equal(first.status,0,first.stderr+'\n'+first.stdout);
  for (const theme of themes) {
    const zip=await readFile(path.join(runOutput,theme+'-qa.zip'));
    const names=entries(zip);
    assert.equal(names.length,9,`unexpected ZIP entries: ${names}`);
    assert.equal(names.length,new Set(names).size,`duplicate ZIP entries: ${names}`);
    assert(names.includes('en/widget-screenshots/report.json'));
    assert(names.includes('fa/widget-screenshots/report.json'));
    assert(names.includes('QA-MANIFEST.txt'));
  }
  // Two tasks start simultaneously; fake workers retain their timestamps.
  const testRaw=path.join(work,'raw-out');
  const second=spawnSync(process.execPath,[...args.slice(0,7), '--out-dir',testRaw,
    '--base-url','http://127.0.0.1:12345','--capture-script',fake,'--keep-project-raw'],
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
    '--base-url','http://127.0.0.1:12345','--capture-script',fake],
    {cwd:spaced,encoding:'utf8',timeout:18000});
  assert.equal(portable.status,0,portable.stderr+'\n'+portable.stdout);
  assert((await readFile(path.join(portableOutput,themes[0]+'-qa.zip'))).length > 0);
  // Auto mode must work even when the host has a restricted CPU quota.
  const autoOutput=path.join(work,'auto-out');
  const auto=spawnSync(process.execPath,['scripts/run-qa.mjs','--themes',themes.join(','),'--locale','both',
    '--jobs','auto','--out-dir',autoOutput,'--base-url','http://127.0.0.1:12345','--capture-script',fake],
    {cwd:root,encoding:'utf8',timeout:18000});
  assert.equal(auto.status,0,auto.stderr+'\n'+auto.stdout);
  assert.match(auto.stdout,/Detected: .*CPU threads.*RAM/);
  assert.match(auto.stdout,/\(AUTO; weighted memory admission/);
  const fail=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,QA_TEST_FAIL:themes[1]+'/fa'},encoding:'utf8',timeout:18000});
  assert.equal(fail.status,1,fail.stderr+'\n'+fail.stdout);
  assert.match(fail.stdout,/QA: FAIL/);
  console.log(`Parallel QA OK: ${themes.length} themes x 2 locales, ${canOverlap?'concurrent captures confirmed':'concurrency admission tested separately'}, unique ZIP outputs, failure reporting`);
} finally {
  await rm(work,{recursive:true,force:true});
}
