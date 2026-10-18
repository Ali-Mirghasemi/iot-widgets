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

## Increment INC-003: complete scoped widget without eager all-theme imports

`iot-widget-studio-react/scoped` provides a **separate, complete widget component**
created by `createScopedIoTWidget()`. It includes frame, adaptive sizing,
telemetry/metadata, RTL, theme inheritance, interaction intents, info and expand
callbacks. The selected definitions, token objects, visual renderer modules and
frame modules are supplied **statically by the host**. Only imported modules can
enter its JS dependency graph.

For Industrial and Minimal styles:

```tsx
import { createScopedIoTWidget, ScopedWidgetAppearanceProvider }
  from 'iot-widget-studio-react/scoped';
import { ProcessVisualRenderer } from 'iot-widget-studio-react/renderers/industrial';
import { MinimalVisualRenderer } from 'iot-widget-studio-react/renderers/minimal';
import { ProcessFrame } from 'iot-widget-studio-react/frames/industrial';
import { MinimalFrame } from 'iot-widget-studio-react/frames/minimal';

// Provide registered WidgetDefinition and WidgetThemeTokens values from the
// CUSTOMER-SCOPED application modules, NOT the library's full catalog.
const CustomerWidget = createScopedIoTWidget({
  defaultThemeId: 'industrial',
  definitions: approvedWidgetDefinitions,
  themes: { industrial: industrialTokens, minimal: minimalTokens },
  visualRenderers: {
    industrial: ProcessVisualRenderer,
    minimal: MinimalVisualRenderer,
  },
  frames: { industrial: ProcessFrame, minimal: MinimalFrame },
});

// A production call should provide real data; otherwise it displays an
// explicit unavailable state and does not silently substitute sample values.
<CustomerWidget widgetId="transformer-temperature" themeId="industrial"
  locale="fa" size="2x2" data={authorizedTelemetry} />;
```

`approvedWidgetDefinitions`, `industrialTokens`, and `minimalTokens` are
application-defined, pre-reviewed inputs; they are **not** built into this code
example. Never import `widgetRegistry` or `widgetThemes` from the root package
inside a restricted build. `ScopedWidgetAppearanceProvider` is a standalone
appearance context; do not wrap it with the root all-themes provider.

A missing definition, theme renderer, frame, or token configuration throws; a
production-scoped widget defaults to `demoFallback={false}` and displays an
unavailable status if required telemetry is absent. Control previews are
unavailable unless an interaction callback is explicitly provided; hosts must
still validate permissions, interlocks and confirmation before sending commands.

**Still outstanding:** wire this factory and selected definitions/tokens into
Nira's generated customer frontend entry, then compile and scan the actual
customer outputs for excluded modules/assets. The root `DashboardPanel` and
`DashboardGrid` still import the full catalog, so they must not be used in a
build claiming restricted widget/catalog inclusion. A scoped grid/panel factory
remains a follow-up. Screenshot parity and browser behavior require testing.
