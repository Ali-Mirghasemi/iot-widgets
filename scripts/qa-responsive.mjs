#!/usr/bin/env node
/** Real-browser responsive QA: no successful ZIP without real screenshot captures. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQaThemes } from './qa-config.mjs';
import { zipDirectory } from './qa-zip.mjs';
import { resolveBrowserExecutable, archiveStatus } from './qa-browser.mjs';
import { inspectGaugeGeometry } from './qa-gauge-inspection.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const value=(flag,fallback)=>{const i=args.indexOf(flag);return i>=0?args[i+1]:fallback;};
const themesArg=value('--themes','studio,horizon');
const themes=themesArg==='all'?getQaThemes():themesArg.split(',').map(s=>s.trim()).filter(Boolean);
const localeArg=value('--locale','both');
const languages=localeArg==='both'?['en','fa']:[localeArg];
const boards=value('--boards','factory,lab').split(',').map(s=>s.trim()).filter(Boolean);
const widths=value('--widths','375,768,1280').split(',').map(Number);
const out=path.resolve(root,value('--out-dir','out/responsive-qa'));
const normalZip=`${out}.zip`;
const failedZip=`${out}-FAILED.zip`;
const external=value('--base-url',null);
const port=Number(value('--port','4387'));
const baseUrl=external||`http://127.0.0.1:${port}`;
const browserOverride=value('--browser-path','');
const themesKnown=getQaThemes();
for(const theme of themes)if(!themesKnown.includes(theme))throw new Error('Unknown theme: '+theme);
for(const locale of languages)if(!['en','fa'].includes(locale))throw new Error('Unknown locale: '+locale);
for(const board of boards)if(!['factory','energy','fleet','lab','catalog'].includes(board))throw new Error('Unknown board: '+board);
if(!widths.length || widths.some(w=>w<300||w>2560||!Number.isInteger(w)))throw new Error('Invalid width');
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
if(out===root||out===path.parse(out).root||out.startsWith(path.join(root,'.git')+path.sep)||out===path.join(root,'.git'))
  throw new Error(`Unsafe output directory: ${out}`);
if(external){const u=new URL(external);if(!['http:','https:'].includes(u.protocol))throw new Error('Invalid --base-url');}
const expected=themes.length*languages.length*boards.length*widths.length;
const report=[];
let server,browser,fatalError=null,outputPrepared=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const serverLogs=[];
async function waitForServer(){
  for(let n=0;n<100;n++){
    if(server?.exitCode!==null && server?.exitCode!==undefined)throw new Error(`Vite exited unexpectedly: ${server.exitCode}\n${serverLogs.join('').slice(-1500)}`);
    try{const r=await fetch(baseUrl,{signal:AbortSignal.timeout(1500)});if(r.ok)return;}catch{}
    await sleep(300);
  }
  throw new Error(`Vite did not become ready at ${baseUrl}.\n${serverLogs.join('').slice(-1500)}`);
}
try {
  // Invalidate older archives at the start; never leave a stale PASS ZIP after a failed new run.
  await rm(normalZip,{force:true});
  await rm(failedZip,{force:true});
  // Fail early for missing Chromium rather than producing a misleading archive.
  const selected=resolveBrowserExecutable({bundledPath:chromium.executablePath(),override:browserOverride});
  console.log(`Responsive QA browser: ${selected.source} (${selected.path})`);
  browser=await chromium.launch({headless:true,executablePath:selected.path});
  // Start from an empty capture folder only after the browser has launched.
  await rm(out,{recursive:true,force:true});
  await mkdir(out,{recursive:true});
  outputPrepared=true;
  if(!external){
    const vite=path.join(root,'node_modules/vite/bin/vite.js');
    if(!existsSync(vite))throw new Error('Vite missing. Run npm ci first.');
    server=spawn(process.execPath,[vite,'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
    server.stdout.on('data',chunk=>serverLogs.push(chunk.toString()));
    server.stderr.on('data',chunk=>serverLogs.push(chunk.toString()));
  }
  await waitForServer();
  for(const theme of themes)for(const locale of languages)for(const board of boards)for(const width of widths){
    const name=`${theme}-${locale}-${board}-${width}`;
    let context,page;
    const entry={theme,locale,board,width,pass:false,screenshot:false,errors:[]};
    try {
      context=await browser.newContext({viewport:{width,height:780},deviceScaleFactor:1,reducedMotion:'reduce',isMobile:width<600,hasTouch:width<600});
      page=await context.newPage();
      page.on('pageerror',error=>entry.errors.push(error.message));
      page.on('console',msg=>{if(msg.type()==='error')entry.errors.push(msg.text());});
      const url=`${baseUrl}/?theme=${encodeURIComponent(theme)}&locale=${locale}&board=${board}`;
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
      if(!response?.ok())throw new Error(`HTTP ${response?.status()??'no response'} for ${url}`);
      await page.locator('[data-iot-dashboard-panel]').waitFor({timeout:20000});
      // Catalog widgets may mount after the frame; wait for every registered card.
      if(board==='catalog') await page.waitForFunction(()=>{
        const expected=Number(document.querySelector('[data-nexus-catalog]')?.getAttribute('data-total-widgets')||0);
        return expected>0 && document.querySelectorAll('[data-iot-widget]').length>=expected;
      },undefined,{timeout:12000});
      await page.evaluate(async()=>{await document.fonts?.ready;});
      await page.waitForTimeout(300);
      const result=await page.evaluate(()=>{
        const viewport=document.documentElement.clientWidth;
        const cards=Array.from(document.querySelectorAll('[data-iot-widget]'));
        const offscreen=cards.flatMap(card=>{
          const r=card.getBoundingClientRect();
          return r.left < -1||r.right>viewport+1?[{id:card.getAttribute('data-widget-id'),left:r.left,right:r.right}]:[];
        });
        return {viewport,scrollWidth:document.documentElement.scrollWidth,offscreen,
          mode:document.querySelector('[data-dashboard-grid]')?.getAttribute('data-responsive-mode'),widgets:cards.length,
          catalogExpected:Number(document.querySelector('[data-nexus-catalog]')?.getAttribute('data-total-widgets')||0),
          locale:document.querySelector('[data-iot-dashboard-panel]')?.getAttribute('data-dashboard-locale'),
          direction:document.querySelector('[data-iot-dashboard-panel]')?.getAttribute('dir')};
      });
      Object.assign(entry,result);
      Object.assign(entry,await page.evaluate(inspectGaugeGeometry));
      const file=path.join(out,`${name}.jpg`);
      await page.screenshot({path:file,type:'jpeg',quality:78,fullPage:true,animations:'disabled'});
      entry.screenshot=true;
      entry.pass=result.widgets>0 && result.locale===locale && result.direction===(locale==='fa'?'rtl':'ltr') && result.scrollWidth<=result.viewport+2 &&
        result.offscreen.length===0 && entry.gaugeIssues.length===0 && entry.errors.length===0 &&
        (board!=='catalog'||(result.catalogExpected>0&&result.widgets===result.catalogExpected&&entry.gauges>0));
    }catch(error){entry.errors.push(String(error?.stack??error));}
    finally {report.push(entry);if(context)await context.close();}
    console.log(`${entry.pass?'PASS':'FAIL'} ${name}: ${entry.widgets??0} widgets, ${entry.gauges??0} gauges, ${entry.gaugeIssues?.length??0} gauge issues, image ${entry.screenshot?'captured':'missing'}`);
    if(entry.gaugeIssues?.length)console.error('Gauge clipping: '+JSON.stringify(entry.gaugeIssues.slice(0,10)));
  }
}catch(error){
  fatalError=String(error?.stack??error);
  console.error(`Responsive QA failed: ${fatalError}`);
}finally{
  if(browser)await browser.close().catch(()=>{});
  if(server){server.kill();}
  const status=archiveStatus({expected,report,fatalError});
  // If preflight fails, do not overwrite any old archive or create a new one.
  if(outputPrepared && existsSync(out)) {
    await writeFile(path.join(out,'report.json'),JSON.stringify({status,expected,captured:report.length,browserError:fatalError,results:report},null,2)+'\n');
    const target=status==='PASS'?normalZip:failedZip;
    await zipDirectory(out,target);
    console.log(`Responsive QA ${status} archive: ${target}`);
  } else console.error('No responsive QA archive: browser preflight failed before capture.');
  console.log(`Responsive QA: ${status} (${report.filter(r=>r.pass).length}/${expected} passed)`);
  if(status!=='PASS')process.exitCode=1;
}
