# IoT Widget Studio v3

React + TypeScript + MUI showcase for a modular IoT widget library.

## Why v3 is different

The first versions treated a theme mostly as a color/token preset. v3 changes the architecture: each theme has its own **widget composition system**.

The six themes now differ in:

- card/frame geometry
- header placement and device metadata treatment
- icon treatment
- status indicator design
- value hierarchy
- gauge design
- battery design
- switch/control design
- RGB interaction styling
- small-vs-large widget composition
- shadows/materials/borders/padding

### Theme design directions

- **Material** — elevated M3-style cards, tonal icon containers, rounded KPI presentation.
- **Flat** — blocky geometry, solid side/header bands, rectangular gauges and controls.
- **Minimal** — typography-first, monochrome, hairlines, almost no decoration.
- **Gaming / HUD** — dark cyber interface, clipped corners, segmented meters, scan lines, neon telemetry.
- **iOS** — glanceable rounded tiles, soft materials, compact controls, ring visualizations.
- **Glass** — translucent surfaces, blurred layers, luminous gradients and floating telemetry.

## Adaptive widget sizes

Widgets don't just stretch. `1x1`, `2x1`, `2x2`, etc. change the amount and type of information shown.

Example for a temperature/metric widget:

- `1x1`: current value + state/trend
- `2x1`: current value + scale / short trend visualization
- `2x2`: current value + min/avg/max or richer trend chart

The same approach is used for battery, gauges, controls and other widgets.

## New safety / IoT examples

The registry now also includes examples such as:

- Fire Alarm
- Smoke Detector
- Water Leak
- Siren / Beacon
- Fan Speed Control

These demonstrate icon-led, state-first IoT widgets rather than forcing every device into a numeric KPI card.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Architecture

```text
src/widgets/
  core/
    WidgetCard.tsx       # state + info dialog
    WidgetFrame.tsx      # six completely different theme shells
    themeTokens.ts       # palette/material tokens
    types.ts
  renderers/
    WidgetVisuals.tsx    # adaptive visualizations and interactive controls
  registry.ts            # widget definitions + metadata
```

The renderer receives `theme`, `widget type`, and `size`, so you can later embed the same registry into another dashboard builder and select a theme per widget instance.

## Visual QA screenshots

The showcase includes a deterministic QA page and a Playwright capture script. It renders every widget in every supported size and captures all six themes by category.

First-time setup:

```bash
npm install
npm run screenshots:install
```

Generate the complete screenshot set:

```bash
npm run screenshots
```

Output is written to `widget-screenshots/`:

- `material/*.png`, `flat/*.png`, `minimal/*.png`, `gaming/*.png`, `ios/*.png`, `glass/*.png` — full category sheets
- `<theme>/widgets/<category>/<widget-id>.png` — one image per widget containing every supported size
- `report.json` with card/body overflow diagnostics
- `SUMMARY.txt` with capture counts and suspect counts

Optional targeted runs:

```bash
WIDGET_QA_THEME=ios WIDGET_QA_CATEGORY=metrics npm run screenshots
```

PowerShell equivalent:

```powershell
$env:WIDGET_QA_THEME="ios"; $env:WIDGET_QA_CATEGORY="metrics"; npm run screenshots
```

### Resizing widgets in the showcase

The resize-cycle icon was removed. Right-click a widget and choose one of its supported sizes from the context menu. The info button remains separate.
