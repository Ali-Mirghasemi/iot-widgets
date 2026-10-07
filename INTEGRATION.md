# Integration

The repository now exposes a package-oriented API. External React projects should use `IoTWidget` from the package root rather than copying `App.tsx` or showcase components.

Quick example:

```tsx
import { IoTWidget } from 'iot-widget-studio-react';

<div style={{ width: 320, height: 228 }}>
  <IoTWidget
    widgetId="battery"
    themeId="ios"
    size="1x1"
    data={{ value: 76 }}
  />
</div>
```

Build/package instructions:

- `docs/installation.md`
- `docs/usage.md`
- `docs/api-reference.md`
- `docs/architecture.md`

The old theme-specific patch integration notes are no longer applicable to this integrated all-theme source tree.
