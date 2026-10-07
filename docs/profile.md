# IoT Widget Studio — Project Profile

## 1. Purpose

IoT Widget Studio is a reusable React/TypeScript widget library and visual showcase for production IoT dashboards.

The project is not intended to be only a demo page. The widget system must be modular enough that the same widgets can later be imported into another dashboard/builder project without copying application-specific code.

Primary goals:

- support a broad set of IoT widget types;
- support several genuinely different visual design systems/themes;
- adapt the information shown to the widget's grid size instead of merely stretching the same UI;
- support English and Persian;
- support real IoT controls as well as read-only telemetry;
- remain easy to extract and reuse in another React project;
- make visual QA reproducible through automated screenshots.

## 2. Technology

- React
- TypeScript
- MUI / Material UI
- Vite
- npm
- Playwright for screenshot QA

Do not introduce another UI framework for one theme. Theme-specific visuals may use MUI primitives, CSS/SVG, and lightweight local helpers.

## 3. Core widget model

A widget instance is conceptually composed of:

```text
Widget Definition
├── Widget Type
├── Category
├── Metadata / data fields
├── Supported Sizes
├── Direction (LTR / RTL / auto)
├── Capabilities
└── Mock/example data

Widget Instance
├── widgetType
├── theme
├── size
├── datasource / device
├── metadata binding
└── settings
```

Theme and widget type are independent. A Temperature widget may use Material 3 while another widget on the same dashboard may use a different theme.

## 4. Widget categories

Current high-level categories:

- Metrics & Sensors
- Controls
- Charts & History
- Location
- Tables & Events
- Display & Custom

Representative IoT widgets include temperature, humidity, pressure, voltage, current, power, energy, battery, light, air quality, CO2, PM2.5, gas, soil moisture, tank level, flow, speed, RPM, vibration, noise, distance, weight, wind, rain, cellular signal, device status, alarms, fire/smoke/leak states, buttons, switches, sliders, thermostat, RGB lighting, directional control, charts, maps, tables, camera/image, iframe, SCADA, and similar device-oriented widgets.

## 5. Stable theme IDs and display names

Theme IDs are persistence/API identifiers. **Do not rename IDs** because saved dashboard JSON may depend on them.

| Stable ID | Current / preferred display direction | Notes |
|---|---|---|
| `material` | Material 3 | production-friendly M3 interpretation |
| `flat` | Industrial Flat | stronger industrial/block UI direction is preferred over generic “Flat” |
| `minimal` | Minimal Mono | typography/data-first minimal design |
| `gaming` | HUD / Cyber | telemetry/HUD design; avoid generic gamer neon cards |
| `ios` | Cupertino | Apple-like glanceable smart-device tiles; avoid pretending to be an official Apple UI |
| `glass` | Aurora Glass | layered translucent/luminous interface |

Display labels may be refined centrally. Stable IDs must remain unchanged.

## 6. Theme principle: composition, not recoloring

A theme is **not** a palette preset.

Each theme should own a recognizably different:

- card/frame geometry;
- header placement;
- device metadata treatment;
- status treatment;
- icon language;
- value hierarchy;
- gauge language;
- chart styling;
- control styling;
- spacing/density;
- border/shadow/material behavior;
- small/medium/large widget composition.

If two themes can be made identical by changing only colors/radius/shadow, they are not different enough.

## 7. Adaptive sizing rules

Grid size means **width × height**.

Examples:

```text
1x1  -> glanceable core state/value only
2x1  -> value + compact secondary context/trend/control feedback
1x2  -> use vertical space intentionally; do not center a tiny 1x1 widget in a tall card
2x2  -> richer history, metadata, secondary values, events, or control context
3x1  -> wide comparison/trend layout
3x2+ -> richer dashboard/panel composition
```

A larger widget must normally add useful information or a better visualization. It must not simply scale up the same content and create dead space.

A smaller widget may deliberately hide secondary information to remain readable.

## 8. Language and direction

- The showcase supports English and Persian.
- Persian description/help text should be RTL.
- Numeric telemetry, units, coordinates, timestamps, gauges, charts, command payloads, and technical identifiers may remain LTR when that is clearer.
- Do not blindly flip chart axes or numeric controls just because the page locale is Persian.
- Widget layouts must not break when labels become longer in Persian.

## 9. Visual quality requirements

Every widget/theme/size should be checked for:

- overlap;
- clipping;
- elements outside card bounds;
- accidental scrolling;
- text truncation that hides critical state;
- excessive roundness / pill overload;
- inconsistent spacing;
- huge empty regions;
- tiny content inside large cards;
- controls that do not respond;
- unclear active/inactive/error states;
- gauges that are cut in half;
- charts that collapse to the bottom;
- poor contrast;
- theme sameness;
- decorative elements that reduce readability.

Semantic/creative visuals are encouraged when they improve comprehension. Examples: fire alarm with fire/state imagery, beacon/siren with light state, tank with level visualization, battery with charge shape, cellular signal with bars/history, SCADA with process state, etc.

## 10. Portability requirement

Widgets must remain easy to import into another project.

Prefer:

- theme-specific modules under `src/widgets/themes/`;
- reusable renderers that receive props rather than reading global application state;
- registry-driven metadata;
- local helpers with no dependency on showcase page layout;
- stable exports from `src/widgets/index.ts`;
- no hard dependency on the showcase toolbar/search/filter UI.

Avoid:

- importing `App.tsx` state into widget modules;
- DOM queries inside normal widget rendering;
- theme-specific behavior hard-coded in the showcase page;
- copying the same widget implementation six times when a small reusable primitive is truly shared.

## 11. Important source areas

```text
src/widgets/
├── core/
│   ├── WidgetCard.tsx
│   ├── WidgetFrame.tsx
│   ├── themeTokens.ts
│   └── types.ts
├── data/
│   └── mockData.ts
├── renderers/
│   └── WidgetVisuals.tsx
├── themes/
│   └── MaterialVisuals.tsx   # Material is already being separated
├── registry.ts
└── index.ts
```

Long-term target: each theme should have isolated theme-specific composition/rendering files so parallel work and reuse do not require modifying one huge shared renderer.

## 12. Current state

- Material has been renamed visually to **Material 3** while keeping ID `material`.
- Material has undergone several screenshot-driven layout/quality passes and already has a dedicated `MaterialVisuals.tsx`.
- Material still needs final review/polish before being considered complete.
- Flat, Minimal, Gaming/HUD, iOS/Cupertino, and Glass/Aurora should receive the same screenshot-driven treatment in parallel.
- Visual QA tooling can render every widget in every supported size and capture full-page/theme/category screenshots.

