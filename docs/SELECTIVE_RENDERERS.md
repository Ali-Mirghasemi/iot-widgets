# Increment INC-001: individually importable renderer modules

The **default** `iot-widget-studio-react` entry retains all renderer themes for
backward compatibility. A restricted customer build **must not import** the root
`IoTWidget`, `DashboardPanel` or `WidgetVisualRenderer` while expecting renderer
exclusion: those currently reference the full built-in renderer registry.

This increment introduces the theme-neutral visual-body factory and individual
renderer subpaths. Explicit imports allow bundlers to omit unrelated renderer
modules if no other imports reference them:

```tsx
import { createWidgetVisualRenderer } from 'iot-widget-studio-react/visual-core';
import { ProcessVisualRenderer } from 'iot-widget-studio-react/renderers/industrial';
import { MinimalVisualRenderer } from 'iot-widget-studio-react/renderers/minimal';

export const CustomerVisualRenderer = createWidgetVisualRenderer({
  industrial: ProcessVisualRenderer,
  minimal: MinimalVisualRenderer,
});
```

This example creates a **widget body renderer** accepting `WidgetRendererProps`,
not a complete `IoTWidget` with frames, catalog, data binding and appearance.
A standalone selectable `IoTWidget`/panel and customer profile code generator
will be introduced in later increments. Callers must supply valid widget theme
tokens and definitions. Any theme not in the map throws an explicit error;
no fallback is substituted. A theme may import an implementation dependency
(e.g. the `studio` renderer also uses Material visuals).

## Verification

- `npm run test:selective`: static import/exports tests, not a bundle audit.
- `npm run build:lib`: package declaration/output compilation.
- Next: create a selective host entry using only these subpaths, compile a
  customer bundle, and scan the JS/CSS/assets and source maps for excluded code.

**Security boundary:** no claim of source-code secrecy is made until the *final
customer artifact* has been audited. No backend device module, control permission,
or customer identity is enforced by this UI mechanism.
