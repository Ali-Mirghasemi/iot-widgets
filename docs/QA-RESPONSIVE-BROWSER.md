# Responsive browser QA on Windows, Linux and macOS

`npm run qa:responsive` requires a real Chromium-family browser. It never uses a fake screenshot renderer.

## Install the supported Playwright Chromium revision

```powershell
npm ci
npx playwright install chromium
npm run qa:responsive -- --boards catalog --themes studio --locale en --widths 375
```

If Playwright was upgraded or `node_modules` was reinstalled, you may need to repeat `npx playwright install chromium`.

If the download is blocked but Chrome or Edge is already installed, the runner will try the system Chrome/Edge executable **after** checking the Playwright-managed Chromium revision. To select a browser explicitly:

```powershell
npm run qa:responsive -- --boards catalog --themes studio,horizon --locale both --widths 375,768,1280 --browser-path "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Alternatively set `PLAYWRIGHT_CHROME_PATH` in your environment. A supported Playwright-managed version is more reproducible than a system-browser fallback.

The runner validates actual screenshot jobs, checks LTR/RTL direction, verifies that the catalog includes registered widgets, rejects console/page errors and horizontal viewport overflow, and generates:

- `out/responsive-qa.zip` **only when every requested screenshot passes**
- `out/responsive-qa-FAILED.zip` when captures run but fail; this is diagnostic evidence, **not a successful visual QA result**
- No newly generated archive if browser preflight fails before a run starts

The console also prints the browser executable selected and a PASS/FAIL summary. When the browser is missing, install it before debugging widget layouts. Successful screenshot capture does not guarantee attractive visuals; review the actual images as well as `report.json`.

Run the pure Node smoke test without Playwright:

```powershell
node scripts/test-qa-browser.mjs
```
