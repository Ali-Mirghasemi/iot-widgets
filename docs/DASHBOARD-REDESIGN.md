# Dashboard redesign preview — October 2026

This branch is an **incremental prototype** of a more cohesive visual system for `iot-widget-studio-react`. All existing widget IDs, the original six visual themes, and the legacy `?qa=1` capture path remain available. The redesigned showcase is the default `/` route; the original catalog is available at `/?gallery=1`.

For subsequent adaptive-views and minimum-size work, see [ADAPTIVE-WIDGETS.md](ADAPTIVE-WIDGETS.md).

## What changed

- Added a seventh theme, **Studio / Premium**, with less frame chrome, more pronounced numeric hierarchy, larger chart areas, quieter labels, and consistent semantic accent/surface tokens. It has bespoke implementations for metrics, gauges, tanks, battery, signal, charts, switch, state, demo map, alarms, and events. Other widget types currently fall back to the Material renderer.
- Added `WidgetThemeProvider` with `DashboardAppearance`: `themeId`, light/dark `mode`, `palette` including editable primary and secondary colors, and `colorMode` ('inherit' or 'original'). `IoTWidget` follows the nearest provider by default and accepts a per-instance override.
- Added reusable `DashboardGrid` with grid-position JSON (`x/y/w/h`), desktop pointer drag/reorder from a handle, pointer drag-to-resize from an exposed corner, non-overlap resolution, `editable`, `onChange`, `renderWidget`, expansion and right-click callback hooks. Mobile display falls back to stacked card grid. Keyboard drag and sophisticated responsive-breakpoint persistence are not yet implemented.
- Added `DeviceContainer` for widgets belonging to a single device, with shared device metadata, per-child telemetry, and nesting on `DashboardGrid`.
- Added **Factory overview**, **Energy monitoring**, and **Fleet tracking** demo panels; fake sample telemetry; theme selector, two editable hex-color inputs with presets, light/dark toggle, panel palette inheritance switch, layout export, reset, add widget, edit toggle, per-widget right-click style overrides, large modal expansion and browser-local layout persistence.
- Added pure grid-collision tests via `npm run test:layout`.

## Run

```bash
npm ci
npm run dev
# open http://localhost:5173
npm run test:layout
npm run build
```

The screenshots captured before these changes remain available from the user-provided QA archives. Because the dependency registry was not accessible during this edit session, the new rendered UI, build, and visual regressions have **not** been verified in-browser. Source syntax validation and four grid-collision assertions did pass.

## Core reusability example

```tsx
import {
  DashboardGrid, IoTWidget, WidgetThemeProvider,
  type DashboardItem, type DashboardAppearance,
} from 'iot-widget-studio-react';
import { useState } from 'react';

const appearance: DashboardAppearance = {
  themeId: 'studio',
  mode: 'dark',
  colorMode: 'inherit',
  palette: { primary: '#8197ff', secondary: '#4bd6bd' },
};

export function DeviceDashboard() {
  const [widgets, setWidgets] = useState<DashboardItem[]>([
    { id: 'temp-1', widgetId: 'temperature', x: 0, y: 0, w: 3, h: 2, data: { value: 24.8 } },
    { id: 'power-1', widgetId: 'power', x: 3, y: 0, w: 3, h: 2, data: { value: 284 } },
  ]);
  const [editable, setEditable] = useState(false);
  return <WidgetThemeProvider appearance={appearance}>
    <button onClick={() => setEditable(v => !v)}>Edit dashboard</button>
    <DashboardGrid
      items={widgets} editable={editable} onChange={setWidgets}
      renderWidget={item => <IoTWidget widgetId={item.widgetId} data={item.data} size="2x2" />}
    />
  </WidgetThemeProvider>;
}
```

**Important:** `IoTWidget.size` remains a widget-definition-supported size (`1x1`, `2x1`, `2x2`, etc.), independent of the outer dashboard grid's arbitrary `w/h` spans. In production, use each widget definition's supported sizes to select an appropriate density profile. Responsive packing, live telemetry adapters, and API-backed persistence belong in the host application.

## Intentional boundaries and remaining work

1. The **Studio** renderer has genuine primary/secondary palette behavior for its new components. Legacy six-theme renderers still contain fixed authored colors in some charts and frames; the panel palette overrides their token-aware paths but not every pixel. A comprehensive legacy token migration is still needed for total inheritance.
2. Controls in the demo are **simulated**. For production, connect interaction callbacks to your application's authorized command system; local switch state is not a device command or a synchronized state.
3. The maps are **illustrative**. This is not MapLibre/Leaflet/Google Maps integration, and the demo does not perform geographical projection, tile loading, historical track alignment, or live tracking. The map includes a visible 'No map tiles' label.
4. Drag/resize is currently desktop pointer-first; native drag-and-drop, touch/mobile interaction, accessible keyboard operations, collision compaction, and resize-aware widget density need further validation and refinement.
5. Expand uses a large MUI `Dialog` in the demo; the reusable `IoTWidget` exposes optional `onExpand` and the host remains responsible for the dialog.
6. Local persistence and JSON export are demo implementations, not an authentication or multi-user layout API.
7. Use semantic states for safety: alarm, warning, normal, disconnected must not be encoded only with the user's freely customizable primary color.

## Design research used

- ThingsBoard widgets & edit mode: https://thingsboard.io/docs/paas/user-guide/widgets/
- Home Assistant sections and card layout: https://www.home-assistant.io/dashboards/sections/
- Grafana dashboard visual hierarchy: https://grafana.com/blog/getting-started-with-grafana-best-practices-to-design-your-first-dashboard/
- Ubidots widget configuration: https://help.ubidots.com/en/articles/2400308-create-dashboards-and-widgets

The supplied application code is original. Other companies' screenshot assets and widget source code have not been copied into the repository.
