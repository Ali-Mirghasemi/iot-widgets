import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'widget-screenshots');
const port = Number(process.env.WIDGET_QA_PORT || 4173);
const host = '127.0.0.1';
const baseUrl = `http://${host}:${port}`;
const themes = ['material','flat','minimal','gaming','ios','glass'];
const categories = ['metrics','controls','charts','location','tables','display'];
const locale = process.env.WIDGET_QA_LOCALE === 'fa' ? 'fa' : 'en';
const onlyTheme = process.env.WIDGET_QA_THEME;
const onlyCategory = process.env.WIDGET_QA_CATEGORY;
const selectedThemes = onlyTheme ? themes.filter(t => t === onlyTheme) : themes;
const selectedCategories = onlyCategory ? categories.filter(c => c === onlyCategory) : categories;

if (!selectedThemes.length) throw new Error(`Unknown WIDGET_QA_THEME=${onlyTheme}`);
if (!selectedCategories.length) throw new Error(`Unknown WIDGET_QA_CATEGORY=${onlyCategory}`);

await rm(outDir, { recursive:true, force:true });
await mkdir(outDir, { recursive:true });

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(npmCommand, ['run','dev','--','--host',host,'--port',String(port)], {
  cwd:root,
  env:{...process.env, BROWSER:'none'},
  stdio:['ignore','pipe','pipe'],
});

let serverLog = '';
server.stdout.on('data', d => { serverLog += d.toString(); });
server.stderr.on('data', d => { serverLog += d.toString(); });

const waitForServer = async () => {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Vite server did not become ready.\n${serverLog}`);
};

const clean = value => String(value).replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').toLowerCase();

let browser;
const report = {
  generatedAt:new Date().toISOString(),
  viewport:{ width:1920, height:1080 },
  locale,
  captures:[],
  consoleErrors:[],
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({
    viewport:{ width:1920, height:1080 },
    deviceScaleFactor:1,
    reducedMotion:'reduce',
  });
  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push({ url:page.url(), text:msg.text() });
  });
  page.on('pageerror', error => report.consoleErrors.push({ url:page.url(), text:error.message }));

  for (const theme of selectedThemes) {
    const themeDir = path.join(outDir, theme);
    await mkdir(themeDir, { recursive:true });

    for (const category of selectedCategories) {
      const url = `${baseUrl}/?qa=1&theme=${encodeURIComponent(theme)}&category=${encodeURIComponent(category)}&locale=${locale}`;
      process.stdout.write(`Capturing ${theme} / ${category} ... `);
      await page.goto(url, { waitUntil:'networkidle' });
      await page.waitForSelector('[data-qa-page="true"]');
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        window.scrollTo(0,0);
      });
      await page.waitForTimeout(120);

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
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const r = el.getBoundingClientRect();
            const outside = r.right > cardRect.right + 1 || r.bottom > cardRect.bottom + 1 || r.left < cardRect.left - 1 || r.top < cardRect.top - 1;
            const scrollOverflow = el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
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

      const file = path.join(themeDir, `${clean(category)}.png`);
      await page.screenshot({ path:file, fullPage:true, animations:'disabled' });

      // Also save one image per widget. Each image contains every supported size
      // for that widget, making it much easier to review or send a subset.
      const widgetDir = path.join(themeDir, 'widgets', clean(category));
      await mkdir(widgetDir, { recursive:true });
      const sections = page.locator('[data-qa-widget-section]');
      const sectionCount = await sections.count();
      const widgetFiles = [];
      for (let i = 0; i < sectionCount; i++) {
        const section = sections.nth(i);
        const widgetId = await section.getAttribute('data-qa-widget-section');
        if (!widgetId) continue;
        const widgetFile = path.join(widgetDir, `${clean(widgetId)}.png`);
        await section.screenshot({ path:widgetFile, animations:'disabled' });
        widgetFiles.push(path.relative(root, widgetFile));
      }

      const suspects = diagnostics.filter(item => item.cardScrollOverflow || item.bodyScrollOverflow || item.suspects.length);
      report.captures.push({ theme, category, file:path.relative(root,file), widgetFiles, widgetVariants:diagnostics.length, suspectCount:suspects.length, diagnostics });
      console.log(`${diagnostics.length} variants, ${suspects.length} suspects, ${widgetFiles.length} widget sheets`);
    }
  }

  await writeFile(path.join(outDir,'report.json'), JSON.stringify(report,null,2), 'utf8');
  const summary = report.captures.map(c => `${c.theme.padEnd(9)} ${c.category.padEnd(10)} ${String(c.widgetVariants).padStart(3)} variants | ${String(c.suspectCount).padStart(3)} suspects | ${c.file}`).join('\n');
  await writeFile(path.join(outDir,'SUMMARY.txt'), `IoT Widget Visual QA\nGenerated: ${report.generatedAt}\n\n${summary}\n\nConsole/page errors: ${report.consoleErrors.length}\n`, 'utf8');
  console.log(`\nDone. Screenshots and diagnostics: ${outDir}`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
