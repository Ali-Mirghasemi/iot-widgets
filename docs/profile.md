# IoT Widget Studio — Project Profile

## Purpose

IoT Widget Studio is both:

1. a reusable React/TypeScript/MUI widget package for IoT dashboards; and
2. a visual showcase + screenshot QA application used to design and validate the package.

The reusable package is the product. The showcase is tooling around it.

## Current inventory

- 63 built-in widget definitions
- 6 stable theme IDs
- 6 dedicated theme renderer modules
- 9 logical grid sizes
- English and Persian
- read-only telemetry, charts, maps, tables, display widgets and interactive control previews
- Playwright per-widget and full-page screenshot QA

## Stable themes

| ID | Display name |
|---|---|
| `material` | Material 3 |
| `flat` | Industrial Flat |
| `minimal` | Minimal Mono |
| `gaming` | HUD / Cyber |
| `ios` | Cupertino |
| `glass` | Aurora Glass |

Stable IDs are persistence/API contracts. Do not rename them casually.

## Public integration component

External React projects should use:

```tsx
<IoTWidget ... />
```

from the package root.

`IoTWidget` supports per-instance:

- widget type;
- theme;
- size;
- locale;
- runtime telemetry;
- device/site metadata;
- token overrides;
- info callback;
- low-level interaction callback.

## Important design model

```text
WidgetDefinition
  stable type/capabilities/fields/supported sizes

WidgetInstanceConfig
  widgetId/themeId/size/locale/data/metadata
```

Theme is not global. A dashboard can mix different themes between widgets.

## Theme principle

A theme is a composition system, not a color preset.

Each theme may own different:

- frame geometry;
- header hierarchy;
- icon treatment;
- gauge style;
- charts;
- controls;
- density;
- state presentation;
- size adaptation.

## Adaptive sizing

Grid size is width × height.

- `1x1`: essential glanceable value/state
- `2x1`: compact secondary context/trend
- `1x2`: intentional vertical composition
- `2x2`: richer history/context
- `3x1`: wide comparison/trend
- `3x2+`: panel-level composition

A larger widget should normally add useful information rather than just scale up.

## Language/direction

Frame/user-facing text follows locale. Body direction is definition-controlled (`ltr`, `rtl`, `auto`) so technical content such as charts/coordinates can remain LTR in Persian.

## Portability

Reusable code must not depend on:

- `App.tsx`;
- showcase filters/toolbars;
- screenshot scripts;
- application-global state.

React, MUI, MUI Icons and Emotion are package peer dependencies.

## Public/private source boundary

Reusable:

```text
src/library/
src/widgets/
```

Showcase/QA only:

```text
src/App.tsx
src/components/
src/styles.css
scripts/
```

## Internal compatibility bridge

Theme renderers historically read runtime examples from `WidgetDefinition.mock`. The public `IoTWidget` API hides that implementation detail by cloning the definition and merging `data`/`metadata` at render time.

The registry is never mutated.
