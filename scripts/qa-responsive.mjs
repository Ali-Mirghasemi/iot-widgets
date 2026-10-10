#!/usr/bin/env node
/** Responsive dashboard browser QA. Requires npm ci and Playwright Chromium. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQaThemes } from './qa-config.mjs';
import { zipDirectory } from './qa-zip.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const value=(flag, fallback)=>{const index=args.indexOf(flag);return index>=0?args[index+1]:fallback;};
const themesArg=value('--themes','studio,horizon');
const themes=themesArg==='all'?getQaThemes():themesArg.split(',');
const languages=value('--locale','both')==='both'?['en','fa']:[value('--locale','both')];
const boards=value('--boards','factory,lab').split(',');
const widths=value('--widths','375,768,1280').split(',').map(Number);
const out=path.resolve(root,value('--out-dir','out/responsive-qa'));
const external=value('--base-url',null);
const port=Number(value('--port','4387'));
const baseUrl=external||`http://127.0.0.1:${port}`;
for(const theme of themes)if(!getQaThemes().includes(theme))throw new Error('Unknown theme '+theme);
for(const locale of languages)if(!['en','fa'].includes(locale))throw new Error('Unknown locale '+locale);
for(const board of boards)if(!['factory','energy','fleet','lab','catalog'].includes(board))throw new Error('Unknown board '+board);
if(widths.some(w=>w<300||w>2560||!Number.isInteger(w)))throw new Error('Invalid width');
await mkdir(out,{recursive:true});
let server,browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const report=[];
try{
  if(!external){
    const vite=path.join(root,'node_modules/vite/bin/vite.js');
    if(!existsSync(vite))throw new Error('Dependencies missing. Run npm ci first.');
    server=spawn(process.execPath,[vite,'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});
    let ready=false;
    for(let n=0;n<160;n++){try{const r=await fetch(baseUrl);if(r.ok){ready=true;break;}}catch{}await sleep(250);}
    if(!ready)throw new Error('Vite did not become ready');
  }
  browser=await chromium.launch({headless:true});
  for(const theme of themes)for(const locale of languages)for(const board of boards)for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:780},deviceScaleFactor:1,reducedMotion:'reduce',isMobile:width<600,hasTouch:width<600});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=`${baseUrl}/?theme=${theme}&locale=${locale}&board=${board}`;
    await page.goto(url,{waitUntil:'networkidle',timeout:45000});
    await page.locator('[data-iot-dashboard-panel]').waitFor();
    await page.evaluate(async()=>{await document.fonts?.ready;});
    await page.waitForTimeout(250);
    const result=await page.evaluate(()=>{
      const viewport=document.documentElement.clientWidth;
      const cards=Array.from(document.querySelectorAll('[data-iot-widget]'));
      const offscreen=cards.flatMap(card=>{
        const r=card.getBoundingClientRect();
        return r.left < -1||r.right>viewport+1 ? [{id:card.getAttribute('data-widget-id'),left:r.left,right:r.right}]:[];
      });
      return {viewport,scrollWidth:document.documentElement.scrollWidth,offscreen,
        mode:document.querySelector('[data-dashboard-grid]')?.getAttribute('data-responsive-mode'),widgets:cards.length,
        catalogExpected:Number(document.querySelector('[data-nexus-catalog]')?.getAttribute('data-total-widgets')||0)};
    });
    const name=`${theme}-${locale}-${board}-${width}`;
    await page.screenshot({path:path.join(out,`${name}.jpg`),type:'jpeg',quality:78,fullPage:true,animations:'disabled'});
    const pass=result.scrollWidth<=result.viewport+2&&!result.offscreen.length&&!errors.length&&
      (board!=='catalog'||(result.catalogExpected>0&&result.widgets===result.catalogExpected));
    report.push({theme,locale,board,width,pass,...result,errors});
    console.log(`${pass?'PASS':'FAIL'} ${name}: ${result.widgets} widgets; width ${result.scrollWidth}/${result.viewport}; ${result.mode}`);
    await context.close();
  }
}finally{
  if(browser)await browser.close();
  if(server)server.kill();
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await zipDirectory(out,out+'.zip');
  console.log(`Responsive QA archive: ${out}.zip`);
}
if(report.some(entry=>!entry.pass))process.exitCode=1;
