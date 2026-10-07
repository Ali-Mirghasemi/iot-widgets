# Visual QA

## Per-widget/all-size screenshots

```bash
npm run screenshots
```

This renders every supported size for every widget and produces overflow diagnostics.

Useful environment variables:

```text
WIDGET_QA_THEME
WIDGET_QA_CATEGORY
WIDGET_QA_LOCALE
PLAYWRIGHT_CHROME_PATH
WIDGET_QA_HEADFUL
```

PowerShell example:

```powershell
$env:WIDGET_QA_THEME="material"
$env:WIDGET_QA_LOCALE="fa"
npm run screenshots
```

## Full-page screenshots

Start Vite, then:

```bash
npm run screenshots:full
```

## Windows automation

The repository includes:

```text
scripts/widget-qa.ps1
scripts/widget-qa.cmd
```

Example:

```powershell
.\scripts\widget-qa.ps1 material
```

The helper can run English and Persian and produce a compact archive.

## Review checklist

Check:

- clipping;
- overflow;
- accidental scrolling;
- dead space;
- tiny content inside large cards;
- cut gauges;
- chart collapse;
- Persian truncation/direction;
- state legibility;
- interactive control feedback;
- theme distinction.

Automated DOM overflow suspects are useful but not authoritative. SVG paths, browser font metrics and slider hit areas can produce false positives. Always inspect screenshots too.
