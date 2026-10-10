import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getQaThemes, screenshotOptions } from './qa-config.mjs';

// Resolve from the script location, not from a shell's current directory.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.env.WIDGET_QA_OUTPUT_DIR || path.join(root, 'widget-screenshots'));
const port = Number(process.env.WIDGET_QA_PORT || 4173);
const host = '127.0.0.1';
const externalUrl = process.env.WIDGET_QA_URL?.trim();
const baseUrl = externalUrl ? new URL(externalUrl).origin : `http://${host}:${port}`;
if (outDir === root || outDir === path.parse(outDir).root || outDir === path.join(root, '.git') || outDir.startsWith(path.join(root, '.git') + path.sep)) {
  throw new Error(`Unsafe QA screenshot output directory: ${outDir}`);
}

const themes = getQaThemes();
const imageOptions = screenshotOptions();
const categories = ['metrics','controls','charts','location','tables','display'];
const locale = process.env.WIDGET_QA_LOCALE === 'fa' ? 'fa' : 'en';
const onlyTheme = process.env.WIDGET_QA_THEME;
const onlyCategory = process.env.WIDGET_QA_CATEGORY;
const selectedThemes = onlyTheme ? themes.filter(t => t === onlyTheme) : themes;
const selectedCategories = onlyCategory ? categories.filter(c => c === onlyCategory) : categories;
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH?.trim();
const headless = process.env.WIDGET_QA_HEADFUL === '1' ? false : true;

if (!selectedThemes.length) throw new Error(`Unknown WIDGET_QA_THEME=${onlyTheme}`);
if (!selectedCategories.length) throw new Error(`Unknown WIDGET_QA_CATEGORY=${onlyCategory}`);

// The parallel runner assigns a UNIQUE WIDGET_QA_OUTPUT_DIR to each worker.
// Never use the shared legacy directory when the coordinator provides one.
await rm(outDir, { recursive:true, force:true, maxRetries:6, retryDelay:250 });
await mkdir(outDir, { recursive:true });

// The coordinator owns Vite. Direct `npm run screenshots` still starts its own.
let server;
let serverLog = '';
let serverExit = null;
if (!externalUrl) {
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  server = spawn(process.execPath,
    [viteBin, '--host', host, '--port', String(port), '--strictPort'], {
      cwd:root, env:{...process.env, BROWSER:'none'},
      stdio:['ignore','pipe','pipe'], windowsHide:true,
    });
  server.stdout.on('data', d => { const line=d.toString(); serverLog += line; process.stdout.write(`[vite] ${line}`); });
  server.stderr.on('data', d => { const line=d.toString(); serverLog += line; process.stderr.write(`[vite] ${line}`); });
  server.on('exit', (code, signal) => { serverExit = { code, signal }; });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const waitForServer = async () => {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (serverExit) throw new Error(`Vite exited before becoming ready: ${JSON.stringify(serverExit)}\n${serverLog}`);
    try {
      const response = await fetch(baseUrl, { cache:'no-store' });
      if (response.ok) return;
    } catch {}
    await sleep(300);
  }
  throw new Error(`Vite server did not become ready.\n${serverLog}`);
};

const clean = value => String(value).replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').toLowerCase();

let browser;
const report = {
  generatedAt:new Date().toISOString(),
  viewport:{ width:1920, height:1080 },
  locale,
  chromePath:chromePath || '(Playwright default)',
  headless,
  imageFormat:imageOptions.type,
  categorySheets:imageOptions.categorySheets,
  widgetSheets:imageOptions.widgetSheets,
  captures:[],
  consoleErrors:[],
};

async function saveFailure(page, theme, category, reason) {
  const prefix = `ERROR-${clean(theme)}-${clean(category)}`;
  const png = path.join(outDir, `${prefix}.png`);
  const htmlFile = path.join(outDir, `${prefix}.html`);
  const textFile = path.join(outDir, `${prefix}.txt`);

  let bodyText = '';
  let html = '';
  try { bodyText = await page.locator('body').innerText({ timeout:2000 }); } catch {}
  try { html = await page.content(); } catch {}
  try { await page.screenshot({ path:png, fullPage:true, animations:'disabled' }); } catch {}

  await writeFile(htmlFile, html, 'utf8');
  await writeFile(textFile,
    `Reason: ${reason}\nURL: ${page.url()}\n\nBODY TEXT\n---------\n${bodyText}\n\nVITE LOG\n--------\n${serverLog}\n`,
    'utf8',
  );

  console.error(`\nQA page failed for ${theme}/${category}`);
  console.error(`URL: ${page.url()}`);
  console.error(`Saved: ${path.relative(root, png)}`);
  console.error(`Saved: ${path.relative(root, htmlFile)}`);
  console.error(`Saved: ${path.relative(root, textFile)}`);
  if (bodyText) console.error(`\nPage text preview:\n${bodyText.slice(0,2000)}\n`);
}

try {
  await waitForServer();

  browser = await chromium.launch({
    headless,
    ...(chromePath ? { executablePath:chromePath } : {}),
  });

  const context = await browser.newContext({
    viewport:{ width:1920, height:1080 },
    deviceScaleFactor:1,
    reducedMotion:'reduce',
  });

  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const item = { url:page.url(), text:msg.text() };
      report.consoleErrors.push(item);
      console.error('[browser console]', item.text);
    }
  });
  page.on('pageerror', error => {
    report.consoleErrors.push({ url:page.url(), text:error.message });
    console.error('[page error]', error.message);
  });

  for (const theme of selectedThemes) {
    const themeDir = path.join(outDir, theme);
    await mkdir(themeDir, { recursive:true });

    for (const category of selectedCategories) {
      const url = `${baseUrl}/?qa=1&theme=${encodeURIComponent(theme)}&category=${encodeURIComponent(category)}&locale=${locale}&_=${Date.now()}`;
      process.stdout.write(`Capturing ${theme} / ${category} ... `);

      const response = await page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 });
      if (!response?.ok()) {
        await saveFailure(page, theme, category, `HTTP ${response?.status() ?? 'no response'}`);
        throw new Error(`Failed to load ${url}: HTTP ${response?.status() ?? 'unknown'}`);
      }

      try {
        await page.waitForSelector('[data-qa-page="true"]', { state:'attached', timeout:15000 });
      } catch (error) {
        await saveFailure(page, theme, category, error.message);
        throw error;
      }

      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        window.scrollTo(0,0);
      });
      await page.waitForTimeout(150);
      const renderedDirection = await page.locator('[data-qa-page="true"]').getAttribute('dir');
      const expectedDirection = locale === 'fa' ? 'rtl' : 'ltr';
      if (renderedDirection !== expectedDirection) {
        await saveFailure(page, theme, category, `Wrong page direction: ${renderedDirection}, expected ${expectedDirection}`);
        throw new Error(`Incorrect ${locale} page direction for ${theme}/${category}`);
      }

      const qaErrors = await page.locator('[data-qa-error="true"]').evaluateAll(nodes => nodes.map(node => ({
        id:node.getAttribute('data-widget-id'),
        size:node.getAttribute('data-widget-size'),
        text:node.textContent?.trim() || '',
      })));

      const diagnostics = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('[data-widget-card="true"]')];
        const rounded = n => Math.round(n * 10) / 10;
        const selectorHint = el => {
          const tag = el.tagName.toLowerCase();
          const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0,2).join('.') : '';
          return cls ? `${tag}.${cls}` : tag;
        };

        return cards.map(card => {
          const cardRect = card.getBoundingClientRect();
          const body = card.querySelector('[data-widget-body="true"]');
          const bodyRect = body?.getBoundingClientRect();
          const overflowNodes = [];
          const descendants = [...card.querySelectorAll('*')];

          for (const el of descendants) {
            // SVG definitions and shape paths have geometry beyond the drawing
            // viewport by design; only their outer SVG can visibly overflow.
            if (el.closest('defs') || (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg')) continue;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const r = el.getBoundingClientRect();
            const outside = r.right > cardRect.right + 1 || r.bottom > cardRect.bottom + 1 || r.left < cardRect.left - 1 || r.top < cardRect.top - 1;
            const scrollOverflow = el.scrollWidth > el.clientWidth + 6 || el.scrollHeight > el.clientHeight + 7;
            if (outside || scrollOverflow) {
              overflowNodes.push({
                element:selectorHint(el),
                outside,
                scrollOverflow,
                rect:{ x:rounded(r.x), y:rounded(r.y), width:rounded(r.width), height:rounded(r.height) },
                client:{ width:el.clientWidth, height:el.clientHeight },
                scroll:{ width:el.scrollWidth, height:el.scrollHeight },
              });
              if (overflowNodes.length >= 12) break;
            }
          }

          return {
            id:card.getAttribute('data-widget-id'),
            size:card.getAttribute('data-widget-size'),
            theme:card.getAttribute('data-widget-theme'),
            category:card.getAttribute('data-widget-category'),
            cardRect:{ width:rounded(cardRect.width), height:rounded(cardRect.height) },
            bodyRect:bodyRect ? { width:rounded(bodyRect.width), height:rounded(bodyRect.height) } : null,
            cardScrollOverflow:card.scrollWidth > card.clientWidth + 2 || card.scrollHeight > card.clientHeight + 2,
            bodyScrollOverflow:body ? body.scrollWidth > body.clientWidth + 2 || body.scrollHeight > body.clientHeight + 2 : false,
            suspects:overflowNodes,
          };
        });
      });

      if (!diagnostics.length || diagnostics.some(item => item.theme !== theme || item.category !== category)) {
        await saveFailure(page, theme, category, 'Missing widgets or rendered theme/category mismatch');
        throw new Error(`Wrong widget content for ${theme}/${category}: ${diagnostics.length} variants`);
      }

      // One category screenshot already captures the full page; no second pass needed.
      const file = imageOptions.categorySheets
        ? path.join(themeDir, `${clean(category)}.${imageOptions.extension}`)
        : null;
      if (file) {
        await page.screenshot({ path:file, fullPage:true, animations:'disabled',
          type:imageOptions.type, ...(imageOptions.quality ? { quality:imageOptions.quality } : {}) });
      }

      const widgetDir = path.join(themeDir, 'widgets', clean(category));
      if (imageOptions.widgetSheets) await mkdir(widgetDir, { recursive:true });
      const sections = page.locator('[data-qa-widget-section]');
      const sectionCount = await sections.count();
      const widgetFiles = [];

      for (let i = 0; imageOptions.widgetSheets && i < sectionCount; i++) {
        const section = sections.nth(i);
        const widgetId = await section.getAttribute('data-qa-widget-section');
        if (!widgetId) continue;
        const widgetFile = path.join(widgetDir, `${clean(widgetId)}.${imageOptions.extension}`);
        await section.screenshot({ path:widgetFile, animations:'disabled',
          type:imageOptions.type, ...(imageOptions.quality ? { quality:imageOptions.quality } : {}) });
        widgetFiles.push(path.relative(outDir, widgetFile).replaceAll(path.sep,'/'));
      }

      const suspects = diagnostics.filter(item => item.cardScrollOverflow || item.bodyScrollOverflow || item.suspects.length);
      report.captures.push({
        theme,
        category,
        renderedDirection,
        file:file ? path.relative(outDir,file).replaceAll(path.sep,'/') : null,
        widgetFiles,
        widgetVariants:diagnostics.length,
        suspectCount:suspects.length,
        renderErrorCount:qaErrors.length,
        renderErrors:qaErrors,
        diagnostics,
      });

      console.log(`${diagnostics.length} variants, ${suspects.length} overflow suspects, ${qaErrors.length} render errors, ${widgetFiles.length} widget sheets`);
    }
  }

  // A real browser page can load but contain no widgets; never call that PASS.
  const empty = report.captures.filter(c => c.widgetVariants === 0 || !c.file && imageOptions.categorySheets);
  const errors = report.captures.flatMap(c => c.renderErrors);
  if (empty.length || errors.length || report.consoleErrors.length) {
    throw new Error(`Invalid QA capture: ${empty.length} empty categories, ${errors.length} widget render errors, ${report.consoleErrors.length} browser errors`);
  }
  await writeFile(path.join(outDir,'report.json'), JSON.stringify(report,null,2), 'utf8');
  const summary = report.captures.map(c => `${c.theme.padEnd(9)} ${c.category.padEnd(10)} ${String(c.widgetVariants).padStart(3)} variants | ${String(c.suspectCount).padStart(3)} overflow | ${String(c.renderErrorCount).padStart(3)} render errors | ${c.file}`).join('\n');
  await writeFile(path.join(outDir,'SUMMARY.txt'), `IoT Widget Visual QA\nGenerated: ${report.generatedAt}\nBrowser: ${report.chromePath}\nHeadless: ${report.headless}\n\n${summary}\n\nConsole/page errors: ${report.consoleErrors.length}\n`, 'utf8');
  console.log(`\nDone. Screenshots and diagnostics: ${outDir}`);
} catch (error) {
  await writeFile(path.join(outDir, 'QA-CAPTURE-ERROR.txt'), `${error.stack || error}\n\nVITE LOG\n${serverLog}`, 'utf8').catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill('SIGTERM');
}
