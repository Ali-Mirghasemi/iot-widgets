# Nexus Catalog dashboard

Nexus now includes a **Catalog** panel backed by `createWidgetCatalogDashboard()` and the reusable `DashboardPanel`.

- Open `/?board=catalog&theme=studio&locale=en` or `/?board=catalog&theme=horizon&locale=fa`.
- Contains every registered widget (currently 63), automatically including future registry additions.
- Filter by category or search title/ID in EN or FA. Filtering does **not** overwrite or discard the saved full layout.
- Edit mode is available with the unfiltered catalog: drag, resize and save per-widget theme/layout overrides; filters are reset when editing begins.
- Works with light/dark palettes and mobile/tablet container responsiveness.
- `?gallery=1` remains a separate exhaustive QA gallery showing every supported size; do not remove it.

## QA

After the normal category-screen captures pass, run:

```bash
npm run qa:responsive -- --boards catalog --themes studio,horizon --locale both --widths 375,768,1280
```

This now fails if the catalog has missing cards, horizontal overflow, offscreen widgets or browser errors.

## Third-party integration

```tsx
import { DashboardPanel, createWidgetCatalogDashboard } from 'iot-widget-studio-react';

const catalog = createWidgetCatalogDashboard();
```

`createWidgetCatalogDashboard()` is a demo/preview layout generator, **not** a persistence layer or an actual device binding system. The hosting application still owns layout storage and telemetry.
