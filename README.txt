Fix for runtime error:
  @mui/material does not provide an export named 'Check'

Replace this file in your project:
  src/widgets/core/WidgetCard.tsx

The fix imports Check from:
  @mui/icons-material/Check

Then stop any running Vite server and run:
  Remove-Item -Recurse -Force .\node_modules\.vite -ErrorAction SilentlyContinue
  npm run dev

For QA screenshots:
  $env:PLAYWRIGHT_CHROME_PATH="G:\Tools\PlaywrightChrome\chrome-win64\chrome.exe"
  $env:WIDGET_QA_THEME="material"
  $env:WIDGET_QA_CATEGORY="metrics"
  npm run screenshots
