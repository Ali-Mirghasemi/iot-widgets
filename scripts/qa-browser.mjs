/** Browser discovery shared by responsive QA. No Playwright dependency in this module. */
import { existsSync } from 'node:fs';
import path from 'node:path';

const unique = paths => [...new Set(paths.filter(Boolean).map(candidate => path.normalize(candidate)))];

export function browserCandidates({platform=process.platform,env=process.env,bundledPath='',override=''}={}) {
  const explicit=override || env.PLAYWRIGHT_CHROME_PATH || '';
  const p=platform==='win32'?path.win32:path;
  if(explicit) return [{source:'explicit',path:p.resolve(explicit)}];
  const candidates = [{source:'playwright',path:bundledPath}];
  if(platform==='win32') {
    const roots=unique([env.PROGRAMFILES,env['PROGRAMFILES(X86)'],env.LOCALAPPDATA]);
    for(const root of roots) {
      candidates.push({source:'system Chrome',path:p.join(root,'Google','Chrome','Application','chrome.exe')});
      candidates.push({source:'system Edge',path:p.join(root,'Microsoft','Edge','Application','msedge.exe')});
      candidates.push({source:'system Chromium',path:p.join(root,'Chromium','Application','chrome.exe')});
    }
  } else if(platform==='darwin') {
    for(const app of ['Google Chrome','Chromium','Microsoft Edge'])
      candidates.push({source:'system browser',path:`/Applications/${app}.app/Contents/MacOS/${app}`});
  } else {
    for(const binary of ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/microsoft-edge'])
      candidates.push({source:'system browser',path:binary});
  }
  return candidates.filter(c=>c.path);
}

export function resolveBrowserExecutable(options={},exists=existsSync) {
  const candidates=browserCandidates(options);
  const found=candidates.find(item=>exists(item.path));
  if(found)return found;
  if(candidates[0]?.source==='explicit') {
    throw new Error(`Browser executable not found: ${candidates[0].path}\nCheck --browser-path or PLAYWRIGHT_CHROME_PATH.`);
  }
  const expected=options.bundledPath||'(unknown)';
  throw new Error(`Playwright Chromium browser is missing: ${expected}\nRun: npx playwright install chromium\nOr specify --browser-path "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"\nThe responsive QA cannot pass without a real browser.`);
}

export function archiveStatus({expected,report,fatalError}) {
  return !fatalError && report.length===expected && report.every(entry=>entry.pass===true && entry.screenshot===true)
    ? 'PASS' : 'FAIL';
}
