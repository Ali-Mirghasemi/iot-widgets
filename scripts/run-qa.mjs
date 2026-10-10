#!/usr/bin/env node
/**
 * Cross-platform parallel screenshot QA coordinator.
 * Runs independent (theme, locale) Playwright processes with a shared Vite
 * server. Each worker writes to its own output path; each theme gets one ZIP.
 */
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { once } from 'node:events';
import { mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile, cp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { detectQaResources, planQaConcurrency, estimatedCaptureBytes, formatGiB, memoryAdmissionAllowed } from './qa-resources.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQaThemes } from './qa-config.mjs';
import { zipDirectory } from './qa-zip.mjs';
import { verifyCapture } from './qa-verify.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const knownThemes = getQaThemes();
const HELP = `IoT Widget Studio — parallel screenshot QA

Usage:
  ./scripts/widget-qa.sh all --jobs 2
  ./scripts/widget-qa.sh --themes studio,horizon --locale both --jobs 4
  scripts\\widget-qa.cmd -Themes all -Locale both -Jobs 2

Options:
  --themes, -Themes LIST       Comma-separated IDs or all (automatic discovery)
  --locale, -Locale LOCALE     en | fa | both (default both)
  --jobs, -Jobs N|auto         Concurrent captures (default auto; manual 1-64)
  --sequential                Equivalent to --jobs 1
  --plan, -Plan               Print detected resources and chosen workers; do not capture
  --profile, -Profile MODE     review (default) | detailed
  --format, -ImageFormat FMT   jpeg (default) | png
  --quality, -Quality N        JPEG quality 1-100 (default 85)
  --category, -Category NAME   Optional category filter
  --out-dir, -OutDir DIR       Default: out
  --browser-path, -BrowserPath PATH
  --widget-port, -WidgetPort PORT  Shared Vite port (default: automatic)
  --headful, -Headful          Show Chromium windows
  --keep-project-raw, -KeepProjectRaw
                               Retain independent worker folders in out/qa-raw
  --base-url URL              Use an existing Vite server (advanced)
  --help                       Display this help

One ZIP is created per theme, containing en/ and fa/ folders as requested.
Automatic mode considers logical CPU threads, available RAM, and theme cost.
A manual --jobs N overrides the CPU-based count; memory admission still applies.\n`;

function parseArgs(argv) {
  const options = { themes:[], locale:'both', jobs:'auto', outDir:'out', profile:'review', format:'jpeg',
    quality:85, category:'', browserPath:'', port:0, headful:false, keepRaw:false, planOnly:false,
    baseUrl:'', captureScript:'' };
  const take = (name, index) => {
    if (!argv[index + 1] || argv[index + 1].startsWith('--') || argv[index + 1].startsWith('-') && !/^\d+$/.test(argv[index + 1])) {
      throw new Error(`Missing value for ${name}`);
    }
    return argv[index + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const lower = flag.toLowerCase();
    if (['--help', '-h', '-help'].includes(lower)) { console.log(HELP); process.exit(0); }
    if (['--headful', '-headful'].includes(lower)) options.headful = true;
    else if (['--keep-project-raw', '-keepprojectraw'].includes(lower)) options.keepRaw = true;
    else if (lower === '--sequential') options.jobs = 1;
    else if (lower === '--plan' || lower === '-plan') options.planOnly = true;
    else if (['--themes', '--theme', '-themes', '-theme', '-t'].includes(lower)) { options.themes.push(take(flag,i)); i++; }
    else if (['--locale', '-locale'].includes(lower)) { options.locale = take(flag,i); i++; }
    else if (['--jobs', '-jobs', '--max-parallel', '-maxparallel'].includes(lower)) { const value = take(flag,i).toLowerCase(); options.jobs = value === 'auto' || value === '0' ? 'auto' : Number(value); i++; }
    else if (['--out-dir', '-outdir'].includes(lower)) { options.outDir = take(flag,i); i++; }
    else if (['--profile', '-profile'].includes(lower)) { options.profile = take(flag,i).toLowerCase(); i++; }
    else if (['--format', '--image-format', '-imageformat'].includes(lower)) { options.format = take(flag,i).toLowerCase(); i++; }
    else if (['--quality', '-quality'].includes(lower)) { options.quality = Number(take(flag,i)); i++; }
    else if (['--category', '-category'].includes(lower)) { options.category = take(flag,i).toLowerCase(); i++; }
    else if (['--browser-path', '-browserpath'].includes(lower)) { options.browserPath = take(flag,i); i++; }
    else if (['--widget-port', '-widgetport'].includes(lower)) { options.port = Number(take(flag,i)); i++; }
    else if (lower === '-fullport' || lower === '--full-port') { take(flag,i); console.warn('Note: full-page duplicate capture is disabled; FullPort is ignored.'); i++; }
    else if (lower === '--base-url') { options.baseUrl = take(flag,i); i++; }
    else if (lower === '--capture-script') { options.captureScript = take(flag,i); i++; }
    else if (flag === '--') options.themes.push(...argv.slice(i + 1));
    else if (flag.startsWith('-')) throw new Error(`Unknown option: ${flag}`);
    else options.themes.push(flag);
    if (flag === '--') break;
  }
  if (!options.themes.length) throw new Error('Specify a theme or all. Use --help for examples.');
  const requested = options.themes.flatMap(value => value.split(/[,;\s]+/)).filter(Boolean).map(t => t.toLowerCase());
  options.themes = requested.includes('all') ? [...knownThemes] : [...new Set(requested)];
  for (const theme of options.themes) if (!knownThemes.includes(theme)) throw new Error(`Unknown theme ${theme}; valid: ${knownThemes.join(', ')}`);
  if (!['both','en','fa'].includes(options.locale)) throw new Error('Locale must be en, fa or both');
  if (options.jobs !== 'auto' && (!Number.isInteger(options.jobs) || options.jobs < 1 || options.jobs > 64)) throw new Error('Jobs must be auto or an integer from 1 to 64');
  if (!['review','detailed'].includes(options.profile)) throw new Error('Profile must be review or detailed');
  if (!['jpeg','jpg','png'].includes(options.format)) throw new Error('Format must be jpeg or png');
  if (options.format === 'jpg') options.format = 'jpeg';
  if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) throw new Error('Quality must be from 1 to 100');
  if (!['','metrics','controls','charts','location','tables','display'].includes(options.category)) throw new Error('Unknown category');
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error('Invalid port');
  if (options.baseUrl) {
    const url = new URL(options.baseUrl);
    if (!['http:','https:'].includes(url.protocol)) throw new Error('base-url must be HTTP(S)');
    options.baseUrl = url.origin;
  }
  return options;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function findPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function isReady(url) {
  try { const response = await fetch(url, { signal: AbortSignal.timeout(1200) }); return response.ok; }
  catch { return false; }
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(projectRoot, opts.outDir);
  const locales = opts.locale === 'both' ? ['en','fa'] : [opts.locale];
  const tasks = opts.themes.flatMap(theme => locales.map(locale => ({ theme, locale })));
  const resources = detectQaResources();
  const plan = planQaConcurrency({ resources, tasks, profile:opts.profile, jobs:opts.jobs });
  const {workerCount} = plan;
  console.log(`Detected: ${resources.logicalThreads} usable CPU threads${resources.cpuLimited ? ` (${resources.systemThreads} host threads)` : ''}, ${formatGiB(resources.totalBytes)} RAM, ${formatGiB(resources.availableBytes)} available`);
  console.log(`Limits: CPU ${plan.cpuLimit} jobs | RAM ${plan.memoryLimit} jobs | reserve ${formatGiB(plan.reserveBytes)} | capture budget ${formatGiB(plan.memoryBudgetBytes)}`);
  console.log(`Captures: ${tasks.length} tasks, up to ${workerCount} workers (${plan.automatic ? 'AUTO' : 'MANUAL'}; weighted memory admission for heavy themes)`);
  if (plan.lowMemory) console.warn('WARNING: Low available RAM; even one Chromium capture may cause memory pressure.');
  if (opts.planOnly) return;
  const rootWorkers = path.join(outDir, 'qa-raw');
  if (outDir === projectRoot || outDir === path.parse(outDir).root ||
    outDir === path.join(projectRoot, '.git') || outDir.startsWith(path.join(projectRoot, '.git') + path.sep)) {
    throw new Error('Use a dedicated QA output directory, not the repository or .git directory');
  }
  await mkdir(outDir, { recursive:true });
  await rm(path.join(outDir,'QA-RUN-ERROR.txt'), { force:true });
  const stage = await mkdtemp(path.join(outDir, '.qa-parallel-'));
  const startedAt = new Date().toISOString();
  const children = new Set();
  let vite;
  let viteLog;
  let stopping = false;
  let next = 0;
  const results = new Map();
  const signalHandler = signal => {
    console.error(`\nReceived ${signal}; stopping workers...`);
    stopping = true;
    for (const child of children) if (!child.killed) child.kill();
    if (vite && !vite.killed) vite.kill();
    process.exitCode = 130;
  };
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, signalHandler);
  try {
    if (!opts.baseUrl) {
      const viteBin = path.join(projectRoot,'node_modules','vite','bin','vite.js');
      if (!existsSync(viteBin)) throw new Error('Vite is not installed. Run npm ci or supply --base-url.');
      const port = opts.port || await findPort();
      opts.baseUrl = `http://127.0.0.1:${port}`;
      const serverLogPath = path.join(stage,'vite.log');
      viteLog = createWriteStream(serverLogPath);
      vite = spawn(process.execPath, [viteBin,'--host','127.0.0.1','--port',String(port),'--strictPort'],
        { cwd:projectRoot, env:{...process.env, BROWSER:'none'}, stdio:['ignore','pipe','pipe'], windowsHide:true });
      children.add(vite);
      vite.stdout.pipe(viteLog, { end:false });
      vite.stderr.pipe(viteLog, { end:false });
      const deadline = Date.now() + 45000;
      while (!stopping && Date.now() < deadline && !await isReady(opts.baseUrl)) {
        if (vite.exitCode !== null) throw new Error(`Vite exited early with code ${vite.exitCode}`);
        await delay(250);
      }
      if (stopping) throw new Error('Interrupted');
      if (!await isReady(opts.baseUrl)) throw new Error(`Vite did not start: ${serverLogPath}`);
      console.log(`Shared Vite: ${opts.baseUrl}`);
    } else {
      console.log(`External Vite: ${opts.baseUrl}`);
    }

    const capturePath = opts.captureScript ? path.resolve(opts.captureScript) : path.join(projectRoot,'scripts','capture-widgets.mjs');
    if (!existsSync(capturePath)) throw new Error(`Screenshot capture script not found: ${capturePath}`);

    async function capture(task) {
      const key = `${task.theme}/${task.locale}`;
      const dest = path.join(stage,task.theme,task.locale);
      const screenshotDir = path.join(dest,'widget-screenshots');
      const logDir = path.join(dest,'logs');
      await mkdir(logDir, { recursive:true });
      const logFile = path.join(logDir,'npm-screenshots.log');
      const log = createWriteStream(logFile);
      const env = { ...process.env,
        WIDGET_QA_THEME:task.theme,
        WIDGET_QA_LOCALE:task.locale,
        WIDGET_QA_URL:opts.baseUrl,
        WIDGET_QA_OUTPUT_DIR:screenshotDir,
        WIDGET_QA_IMAGE_FORMAT:opts.format,
        WIDGET_QA_JPEG_QUALITY:String(opts.quality),
        WIDGET_QA_CATEGORY_SHEETS:'1',
        WIDGET_QA_WIDGET_SHEETS:opts.profile === 'review' ? '0' : '1',
        WIDGET_QA_HEADFUL:opts.headful ? '1' : '0',
      };
      if (opts.category) env.WIDGET_QA_CATEGORY = opts.category;
      else delete env.WIDGET_QA_CATEGORY;
      if (opts.browserPath) env.PLAYWRIGHT_CHROME_PATH = path.resolve(opts.browserPath);
      console.log(`[start] ${key}`);
      let status = 'FAIL';
      try {
        const child = spawn(process.execPath,[capturePath],
          { cwd:projectRoot, env, stdio:['ignore','pipe','pipe'], windowsHide:true });
        children.add(child);
        child.stdout.pipe(log, { end:false });
        child.stderr.pipe(log, { end:false });
        const code = await new Promise((resolve,reject) => {
          child.once('error', reject);
          child.once('close', (code,signal) => resolve(code ?? (signal ? 128 : 1)));
        });
        children.delete(child);
        if (code !== 0) throw new Error(`Capture exited with status ${code}`);
        const checked = await verifyCapture({ directory:screenshotDir, theme:task.theme, locale:task.locale, category:opts.category, format:opts.format });
        if (!checked.ok) throw new Error(`Screenshot verification failed: ${checked.failures.join(' | ')}`);
        console.log(`[images] ${key}: ${checked.screenshots} valid category screenshots`);
        status = 'PASS';
      } catch (error) {
        await writeFile(path.join(logDir,'ERROR.txt'), String(error.stack || error), 'utf8');
        console.error(`[fail] ${key}: ${error.message}`);
        // The failure reason should be visible in PowerShell without opening a ZIP.
        const workerLog = await readFile(logFile,'utf8').catch(() => '');
        if (workerLog.trim()) console.error(`[worker ${key} log tail]\n${workerLog.trim().split(/\r?\n/).slice(-18).join('\n')}`);
      } finally {
        log.end();
        await once(log, 'finish');
      }
      results.set(key,status);
      console.log(`[done] ${key} ${status}`);
    }

    // Heavy Glass / Gaming screenshots need more RAM than Studio. Avoid
    // dispatching expensive jobs together when they exceed the memory budget.
    // The budget is also rechecked against current free RAM before admission.
    let reservedBytes = 0;
    let activeCount = 0;
    const waiters = [];
    function canStart(cost) {
      if (stopping) return true;
      // Unrelated applications opening during a run can reduce admission.
      return memoryAdmissionAllowed({
        activeCount, reservedBytes, memoryBudgetBytes:plan.memoryBudgetBytes, costBytes:cost,
        currentFreeBytes:detectQaResources().availableBytes, reserveBytes:plan.reserveBytes,
      });
    }
    function awaken() {
      for (const notify of waiters.splice(0)) notify();
    }
    async function acquire(cost) {
      while (!canStart(cost)) await new Promise(resolve => waiters.push(resolve));
      if (stopping) return false;
      reservedBytes += cost;
      activeCount++;
      return true;
    }
    async function worker() {
      while (!stopping && next < tasks.length) {
        const task = tasks[next++];
        const cost = estimatedCaptureBytes(task.theme, opts.profile);
        if (!await acquire(cost)) return;
        try { await capture(task); }
        finally {
          activeCount--;
          reservedBytes -= cost;
          awaken();
        }
      }
    }
    await Promise.all(Array.from({length:workerCount}, worker));

    const gitCommit = await new Promise(resolve => {
      const git = spawn('git',['rev-parse','--short','HEAD'],{cwd:projectRoot,stdio:['ignore','pipe','ignore'],windowsHide:true});
      let output = '';
      git.stdout.on('data',part => output += part);
      git.once('error',() => resolve('unknown'));
      git.once('exit',code => resolve(code === 0 ? output.trim() : 'unknown'));
    });
    for (const theme of opts.themes) {
      const themeStage = path.join(stage,theme);
      await mkdir(themeStage, { recursive:true });
      const lines = [
        'IoT Widget Studio QA Bundle',
        `Generated: ${new Date().toISOString()}`,
        `Theme: ${theme}`,
        `Locales: ${locales.join(', ')}`,
        `Workers: ${workerCount} (${plan.automatic?'auto':'manual'})`,
        `Usable CPU threads: ${resources.logicalThreads}`,
        `Available RAM at start: ${formatGiB(resources.availableBytes)}`,
        `Memory capture budget: ${formatGiB(plan.memoryBudgetBytes)}`,
        `Profile: ${opts.profile}`,
        `Format: ${opts.format}`,
        `JPEG quality: ${opts.quality}`,
        `Git commit: ${gitCommit}`,
        '', 'Results:',
        ...locales.map(locale => `${locale}: widget=${results.get(`${theme}/${locale}`) || 'NOT RUN'}`),
        '', 'Contents: <locale>/widget-screenshots/ and <locale>/logs/',
      ];
      await writeFile(path.join(themeStage,'QA-MANIFEST.txt'), lines.join('\n') + '\n','utf8');
      const allPassed = locales.every(locale=>results.get(`${theme}/${locale}`)==='PASS');
      const tempZip = path.join(outDir, `.${theme}-qa-${process.pid}.zip.tmp`);
      const finalZip = path.join(outDir,`${theme}-qa.zip`);
      const failedZip = path.join(outDir,`${theme}-qa-FAILED.zip`);
      // Never leave an old successful archive beside a newly failed run.
      await rm(allPassed ? failedZip : finalZip,{force:true});
      try {
        const packed = await zipDirectory(themeStage,tempZip);
        // On Windows rename does not replace existing files consistently.
        const destination = allPassed ? finalZip : failedZip;
        await rm(destination, { force:true });
        await rename(tempZip,destination);
        console.log(`${allPassed?'ZIP':'FAILED DIAGNOSTICS ZIP'}: ${destination} (${packed.entries} files)`);
      } catch (error) {
        await rm(tempZip,{force:true});
        results.set(`${theme}/archive`,'FAIL');
        console.error(`Archive failed for ${theme}: ${error.message}`);
      }
    }
    if (opts.keepRaw) {
      // Preserve the whole run under a timestamped directory, never overwrite
      // the normal output or another concurrent run's raw files.
      const rawDest = path.join(rootWorkers,`run-${Date.now()}-${process.pid}`);
      await mkdir(path.dirname(rawDest),{recursive:true});
      await cp(stage,rawDest,{recursive:true});
      console.log(`Raw captures: ${rawDest}`);
    }
    const failures = [...results].filter(([,status]) => status !== 'PASS');
    console.log(`\nQA: ${failures.length ? 'FAIL' : 'PASS'} | ${tasks.length} jobs | ${workerCount} workers | started ${startedAt}`);
    if (failures.length) {
      console.error('Failed:',failures.map(([key])=>key).join(', '));
      process.exitCode = 1;
    }
  } catch (error) {
    const serverLog = await readFile(path.join(stage,'vite.log'),'utf8').catch(() => '');
    await writeFile(path.join(outDir,'QA-RUN-ERROR.txt'), `${error.stack || error}\n\nVITE LOG\n${serverLog}`, 'utf8').catch(() => {});
    throw error;
  } finally {
    if (vite && !vite.killed) vite.kill();
    for (const child of children) if (!child.killed) child.kill();
    if (vite && vite.exitCode === null) {
      await Promise.race([once(vite, 'close'), delay(3000)]);
    }
    if (viteLog) { viteLog.end(); await once(viteLog, 'finish'); }
    await rm(stage, { recursive:true, force:true, maxRetries:5, retryDelay:300 });
    for (const signal of ['SIGINT','SIGTERM']) process.off(signal,signalHandler);
  }
}

run().catch(error => { console.error(`QA runner error: ${error.stack || error}`); process.exitCode = 1; });
