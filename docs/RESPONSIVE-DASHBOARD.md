# Responsive dashboards and visual QA

## Reusable panel

`DashboardPanel` is a controlled component. It owns dashboard layout presentation,
responsive grid behavior, palette inheritance, built-in widget rendering and an
optional expanded widget dialog. The application supplies `items`, updates them
in `onChange`, and persists those items however it chooses.

```tsx
import {
  DashboardPanel,
  dashboardPalettePresets,
  type DashboardAppearance,
  type DashboardItem,
} from 'iot-widget-studio-react';
import { useState } from 'react';

const appearance: DashboardAppearance = {
  themeId: 'studio', mode: 'dark', colorMode: 'inherit',
  palette: dashboardPalettePresets[0].palette,
};

export function EquipmentDashboard() {
  const [items, setItems] = useState<DashboardItem[]>([{
    id: 'sensor-01', widgetId: 'temperature', x: 0, y: 0, w: 3, h: 2,
    data: { value: 24.8, unit: '°C', history: [24.0,24.4,24.8] },
  }]);
  return <DashboardPanel items={items} onChange={setItems}
    appearance={appearance} locale="fa" editable />;
}
```

Change `appearance.palette.primary` and `.secondary`, or use any custom CSS
colors. Use `locale="fa"` for Persian widget labels and RTL content. The demo
exposes its EN / FA selector in the header. Direct demo preview URLs:

- `/?board=factory&theme=studio&locale=en`
- `/?board=factory&theme=studio&locale=fa`

## Screen size behavior

- Large container: packed 12-column grid, user-defined widths/heights.
- Medium container (<850px): 2-column flow, charts/maps span both columns.
- Small container (<600px): single-column stack; no horizontal scrolling.
- Edit mode: desktop card dragging; touch/phone drag handle and move-up/down
  controls; resize handle changes height on narrow screens, not the desktop
  width stored in the dashboard configuration.
- Expanded view: nearly fullscreen on desktop, a fullscreen dialog on phones.
- Visual density: a logical `1x1` **always** remains compact, `2x1` never
  becomes detailed simply because it is wide, and measurements of the actual
  card body can downgrade any view to avoid clipping.

## QA

Tests that do not need Playwright:

```bash
npm run test:responsive
npm run test:adaptive
npm run test:layout
npm run test:qa
```

After `npm ci` and `npx playwright install chromium`, run desktop review QA
and phone/tablet/desktop demo QA with *both* languages:

```bash
./scripts/widget-qa.sh all --locale both --profile review --format jpeg --quality 80
node scripts/qa-responsive.mjs --themes all --locale both --boards factory,lab --widths 375,768,1280
```

The first command packages all widget variations as 8 ZIP archives under
`out/`. The second saves responsive JPEG screenshots and a JSON report in
`out/responsive-qa/` and packages them into **`out/responsive-qa.zip`**. For quicker feedback use `--themes studio,horizon`.

QA screenshots are actual rendered browser captures. Diagnostics are only
heuristics; tiny scroll-height differences and invisible SVG definitions must
not be treated as visible clipping without reviewing the image.

## Known limitations

- Demo telemetry and map drawings remain illustrative; no real device gateway
  or map tile provider is connected.
- The direction pad uses momentary press styling rather than latching a button
  as a toggle. Production motion/PTZ commands still require a dedicated,
  permission-checked press/release command API owned by the host.
- Browser screenshot QA and a complete TypeScript build must be executed on
  a machine with project dependencies and Playwright installed.
