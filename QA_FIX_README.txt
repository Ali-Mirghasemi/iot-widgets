IoT Widget Studio - QA screenshot fix
====================================

Files changed:
- scripts/capture-widgets.mjs
- src/App.tsx
- src/widgets/core/WidgetCard.tsx (included so forcedSize / qaMode / right-click resize are guaranteed)

What this fixes
---------------
1. Windows spawn EINVAL:
   Vite is started directly with Node instead of npm.cmd.
2. Manual Chrome:
   Uses PLAYWRIGHT_CHROME_PATH when set.
3. QA timeout debugging:
   If the QA page fails, ERROR-<theme>-<category>.png/.html/.txt are created.
4. A single broken widget no longer crashes the complete QA page:
   Each widget/size is wrapped in a QA error boundary.
5. Resize-cycle icon remains removed; normal widgets resize with right click.

PowerShell test
---------------
$env:PLAYWRIGHT_CHROME_PATH="G:\Tools\PlaywrightChrome\chrome-win64\chrome.exe"

# Optional: verify Chrome
node -e "const {chromium}=require('playwright'); chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROME_PATH}).then(async b=>{console.log('CHROME OK');await b.close()}).catch(console.error)"

# Verify the QA page manually
npm run dev -- --host 127.0.0.1 --port 4173
# Open in browser:
# http://127.0.0.1:4173/?qa=1&theme=material&category=metrics&locale=en
# Stop Vite with Ctrl+C before running the automated capture.

# Capture all themes/categories
npm run screenshots

# Visible Chrome for debugging
$env:WIDGET_QA_HEADFUL="1"
npm run screenshots
Remove-Item Env:WIDGET_QA_HEADFUL

# One theme/category for a fast test
$env:WIDGET_QA_THEME="material"
$env:WIDGET_QA_CATEGORY="metrics"
npm run screenshots
Remove-Item Env:WIDGET_QA_THEME
Remove-Item Env:WIDGET_QA_CATEGORY

Output
------
widget-screenshots/
  SUMMARY.txt
  report.json
  <theme>/<category>.png
  <theme>/widgets/<category>/<widget>.png

If QA rendering fails, also look for:
  ERROR-material-metrics.png
  ERROR-material-metrics.html
  ERROR-material-metrics.txt
