# Adaptive widgets and minimum sizes — October 2026

This iteration builds on the Studio dashboard prototype. It introduces an eighth theme, **Horizon / Editorial**, and adaptive content density. All device data shown in the demonstration pages is simulated.

## What changed

- Studio and Horizon now share a compact/standard/detailed rendering system. The *frame* is styled per theme; the content tier is selected by measured card space (via `ResizeObserver`) and/or an explicit `view` preference.
- A numeric metric (temperature, power, humidity, etc.) behaves as follows: **compact** = reading and unit; **standard** = reading, trend (when present), and range bar; **detailed** = historical chart **only if valid historical samples were passed by the caller**, otherwise the standard range bar. Expanded dialogs request the detailed tier.
- Battery, signal, gauge, tank, and switch renderers have smaller-space layouts. Other themes receive simpler numeric readings at compact size to reduce frame/content conflicts. Oversize content is clipped rather than drawn across neighboring widgets.
- `getWidgetMinimumSize`, `getWidgetGridMinimum`, `widgetSizeForGrid`, `resolveWidgetView`, and `historyValues` are exported from the package root. The built-in map, route, and non-gauge chart types require **at least logical 2×2**. In the 12-column dashboard grid, large canvases require **at least 4 columns × 2 rows** for legibility. A 6-column `DeviceContainer` uses **2 columns × 2 rows**.
- The dashboard grid enforces these minima when resizing, when loading saved layouts, and when adding widgets; collision resolution still pushes overlapping cards downward. Small-screen fallback now stacks canvases across both responsive columns.
- The default demo now has a fourth board, **Adaptive widget lab**, with multiple densities of the same temperature metric, plus a chart and illustrative map. The right-click menu also offers a content-density preference (`auto`, `compact`, `standard`, `detailed`), bounded by actual space.
- Linux `scripts/widget-qa.sh` is included and supports all eight themes.

## React API example

```tsx
import { IoTWidget, WidgetThemeProvider } from 'iot-widget-studio-react';

// Assumes a WidgetThemeProvider above, with themeId='studio' or 'horizon'.
const history = [
  { timestamp: 1, value: 21.4 },
  { timestamp: 2, value: 22.8 },
  { timestamp: 3, value: 24.8 },
];

// The layout sets the physical size of each item.
<IoTWidget widgetId="temperature" size="1x1" data={{ value: 24.8, unit: '°C' }} />
<IoTWidget widgetId="temperature" size="2x2" data={{ value: 24.8, unit: '°C', min: 0, max: 50 }} />
<IoTWidget widgetId="temperature" size="3x3" expanded data={{ value: 24.8, unit: '°C', history }} />
```

The historical input accepts `history`, `values`, or `series` arrays of at least two finite numbers, or objects with numeric `value` properties. There is intentionally **no fake history** in the reusable `IoTWidget` metric if only a current reading is supplied. The showcase/gallery explicitly injects fabricated history for screenshot demonstrations.

`view="auto"` is the default. `view="compact"|"standard"|"detailed"` is a presentation preference, not permission to overflow: a view requested for a card that's too small is reduced to a tier that fits. `expanded` selects detailed mode. The dashboard host can persist `view` along with other `DashboardItem` settings.

**Important:** The logical `size` (`1x1`, `2x2`, etc.) and the dashboard's `x/y/w/h` spans are intentionally different coordinate systems. In the default 12-column dashboard, a `map` or full historical chart cannot shrink below four outer grid columns. Consumers with their own grid should use `getWidgetGridMinimum(definition, columns)`.

## Themes

The established theme IDs (`studio`, `material`, `flat`, `minimal`, `gaming`, `ios`, `glass`) are preserved. New theme ID **`horizon`** has an editorial cream/clay/teal baseline palette and a restrained frame with a thin color accent. Its rendering components intentionally reuse Studio's responsive information system instead of duplicating 63 renderers. Changing the dashboard palette still overrides Horizon's token-driven colors when inherited.

## Visual QA and known limits

Run `npm ci`, `npm test`, `npm run build`, and `./scripts/widget-qa.sh --themes studio,horizon,glass,gaming --locale both` on a machine with Playwright Chromium available. Inspect all generated `*-qa.zip` archives for clipped titles, tiny controls, charts, and small-screen layouts.

- The existing legacy renderers still have some fixed colors and theme-specific visual complexity; this change concentrates on their *compact numeric* layouts, not a complete rewrite of every theme.
- SVG maps remain **illustrations** without live tiles or GPS projection.
- Drag/resize in the demo is desktop pointer-oriented; keyboard and touch interaction require further work.
- Device control behavior remains simulated; the demo doesn't send commands.
- The code passed TypeScript **syntax parsing** and the pure JavaScript layout/adaptive unit tests in the authoring environment. A complete React/MUI TypeScript build and browser visual QA could not be run there because dependency installation was unavailable. Do not treat these changes as a visually verified production release.

## QA archive size analysis

All seven user-provided theme QA archives have **150 PNG files** with matching screenshot dimensions for equivalent filenames. The large difference in compressed size is graphical complexity, not more widgets. Glass and Gaming use noisy glows, gradients, grid textures, and transparency that reduce PNG compression efficiency.

| Theme | ZIP size, approximately |
|---|---:|
| Glass | 207 MB |
| Gaming | 126 MB |
| iOS | 31 MB |
| Studio | 23 MB |
| Material | 23 MB |
| Flat | 19 MB |
| Minimal | 15 MB |

The QA archives also include both per-widget and full-page screenshot passes, with some duplicate images. Deduplicating the capture/ZIP contents would reduce distribution size. This does not affect widget runtime performance directly.
