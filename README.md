## New: editable dashboard demo (prototype)

Run `npm ci && npm run dev` and open `/` for an editable multi-panel dashboard with simulated device data, Studio theme, palette inspector, drag/resize, and large widget view. Open `/?gallery=1` for the original 63-widget gallery and `/?qa=1` for screenshot testing. Read [the redesign notes](docs/DASHBOARD-REDESIGN.md) for API usage, validation status, and limitations.

# IoT Widget Studio React

Reusable **React + TypeScript + MUI** IoT widget library plus a visual showcase/QA application.

The library currently contains **63 widget definitions**, **6 visual themes**, adaptive grid sizes, English/Persian support, and screenshot-based visual QA.

## What this repository contains

There are two layers in the same repository:

1. **Reusable library** — import widgets into another React application.
2. **Showcase / QA app** — browse every widget/theme/size and generate regression screenshots.

The reusable entry point is:

```ts
import { IoTWidget } from 'iot-widget-studio-react';
```

The showcase application (`src/App.tsx`) is not required by consuming projects.

## Themes

Stable theme IDs are intentionally separate from display names:

| Stable ID | Display name |
|---|---|
| `material` | Material 3 |
| `flat` | Industrial Flat |
| `minimal` | Minimal Mono |
| `gaming` | HUD / Cyber |
| `ios` | Cupertino |
| `glass` | Aurora Glass |

The stable IDs are suitable for saved dashboard JSON and should not be renamed casually.

## Quick start in another React project

Install the library package plus its peer dependencies:

```bash
npm install ./iot-widget-studio-react-0.4.0.tgz
npm install react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled
```

Then render a widget inside a container with a real width and height:

```tsx
import { IoTWidget } from 'iot-widget-studio-react';

export function BatteryTile() {
  return (
    <div style={{ width: 320, height: 228 }}>
      <IoTWidget
        widgetId="battery"
        themeId="material"
        size="1x1"
        locale="en"
        data={{
          value: 76,
          voltage: '3.94 V',
          remaining: '8h 42m',
        }}
        metadata={{
          deviceName: 'Tracker · TR-18',
          locationLabel: 'Fleet',
          status: 'Live',
          lastSeen: '12 sec ago',
        }}
      />
    </div>
  );
}
```

## Per-widget themes

**Yes — theme selection is per widget instance.** You can render one Battery widget as Cupertino and another widget as Material 3 on the same dashboard:

```tsx
<IoTWidget widgetId="battery" themeId="ios" size="1x1" />
<IoTWidget widgetId="temperature" themeId="material" size="2x1" />
<IoTWidget widgetId="map" themeId="glass" size="3x2" />
```

Changing only the battery theme is just changing that instance's `themeId`:

```tsx
<IoTWidget
  widgetId="battery"
  themeId={batteryTheme}
  size="1x1"
/>
```

The showcase page currently has a global theme selector because it is designed for comparing a complete theme family, but the underlying widget architecture and the new `IoTWidget` public API do **not** require one global theme.

You can also apply per-instance token overrides:

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  themeOverrides={{ accent: '#7c3aed', radius: 10 }}
/>
```

Token overrides are intentionally limited: each theme renderer owns its structural design and some theme-specific fixed colors. Use a different `themeId` when you want a genuinely different composition system.

## Adaptive size behavior

Sizes are `width × height` grid units:

```text
1x1  1x2  2x1  2x2  1x3  3x1  2x3  3x2  3x3
```

A resize is not just CSS scaling. Renderers may add/remove charts, secondary values, history, controls, or metadata depending on size.

Always use a size listed in the widget definition's `supportedSizes`.

## Runtime data

`IoTWidget` merges runtime `data` over the registry's demo values:

```tsx
<IoTWidget
  widgetId="temperature"
  themeId="flat"
  size="2x1"
  data={{
    value: 23.7,
    unit: '°C',
    trend: -1.2,
    values: [23.1, 23.4, 23.8, 23.6, 23.7],
  }}
/>
```

This lets the showcase keep useful demo data while production projects inject live telemetry without rewriting the registry.

## Persian / RTL

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  locale="fa"
  metadata={{
    deviceNameFa: 'ردیاب · ۱۸',
    locationLabelFa: 'ناوگان',
    statusFa: 'زنده',
    lastSeenFa: '۱۲ ثانیه قبل',
  }}
/>
```

The widget definitions decide whether a body should be LTR, RTL, or automatic. Numeric telemetry, charts, coordinates and technical identifiers can remain LTR even inside a Persian dashboard.

## Interaction hook

Controls keep their local interactive preview behavior. The reusable wrapper also exposes a low-level interaction hook for integration/analytics:

```tsx
<IoTWidget
  widgetId="fan-control"
  themeId="material"
  onInteraction={event => {
    console.log(event);
    // Bridge this to your RPC/downlink layer if appropriate.
  }}
/>
```

The hook reports click/change events and best-effort control/value information. It is **not yet a semantic RPC protocol**; production command mapping should remain in your application/service layer.

## Public API

The package root exports:

```ts
IoTWidget
WidgetCard
WidgetFrame
WidgetVisualRenderer

widgetRegistry
widgetsById
widgetCategories
widgetThemes
widgetThemeList
visualRenderers

getWidgetDefinition()
requireWidgetDefinition()
getWidgetTheme()
```

and the public TypeScript types for widgets, themes, runtime data, metadata and instance configuration.

## Build the library

```bash
npm install
npm run build:lib
```

This creates an ESM package in `dist/` with JavaScript, source maps and TypeScript declarations.

Create an installable `.tgz`:

```bash
npm run pack:lib
```

Then install that tarball in another project:

```bash
npm install ../iot-widget-studio-react-0.4.0.tgz
```

## Run the showcase

```bash
npm install
npm run dev
```

Build the showcase and library:

```bash
npm run build
```

## Git installation

If `dist/` is committed in the Git repository, another project can install a tagged revision directly:

```bash
npm install git+https://github.com/YOUR_ORG/YOUR_REPO.git#v0.4.0
```

or:

```bash
npm install github:YOUR_ORG/YOUR_REPO#v0.4.0
```

See [docs/installation.md](docs/installation.md) before publishing or consuming from Git.

## Documentation

- [Documentation index](docs/README.md)
- [Installation and distribution](docs/installation.md)
- [Library usage](docs/usage.md)
- [Architecture](docs/architecture.md)
- [Current codebase review](docs/code-review.md)
- [Runtime data model](docs/data-model.md)
- [Widget catalog](docs/widget-catalog.md)
- [Themes](docs/themes.md)
- [Customization and extension](docs/customization.md)
- [English / Persian / RTL](docs/rtl-i18n.md)
- [Visual QA](docs/qa.md)
- [Publishing](docs/publishing.md)
- [Release checklist](docs/release-checklist.md)
- [Known limitations](docs/known-limitations.md)
- [FAQ](docs/faq.md)

## Screenshot QA

The repository contains deterministic Playwright screenshot tooling.

```bash
npm run screenshots
npm run screenshots:full
```

A Windows helper can run EN + FA QA for selected themes:

```powershell
.\scripts\widget-qa.ps1 material
```

See [docs/qa.md](docs/qa.md).

## Repository structure

```text
src/
├── library/                 # public package wrapper/API
│   ├── IoTWidget.tsx
│   ├── catalog.ts
│   ├── index.ts
│   └── types.ts
├── widgets/
│   ├── core/                # definitions, frame, tokens, showcase card
│   ├── data/                # demo telemetry
│   ├── renderers/           # thin built-in theme dispatcher
│   ├── themes/              # independent theme renderers/frames
│   ├── registry.ts          # widget catalog
│   └── index.ts
├── App.tsx                  # showcase / QA app only
└── ...
```

## Important distinction: package vs showcase

Use **`IoTWidget`** in a production/host application.

Use **`WidgetCard`** when you specifically want the showcase-style right-click size menu and built-in info dialog.

Do not import `App.tsx`, `ShowcaseToolbar`, screenshot scripts, or showcase CSS into another dashboard project unless you actually need the demo application.
