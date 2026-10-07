# Architecture

## High-level pipeline

```text
Widget instance config
        │
        ▼
     IoTWidget
        │
        ├── resolve WidgetDefinition from registry
        ├── resolve per-instance theme
        ├── merge runtime data + metadata
        │
        ▼
   WidgetFrame
        │
        ▼
WidgetVisualRenderer
        │
        ▼
Theme-specific renderer
```

## Definition vs instance

A `WidgetDefinition` describes the reusable widget type:

```text
id
type
category
visual
titles/descriptions
icon
defaultSize
supportedSizes
direction
fields
capabilities
demo/mock values
```

A widget instance chooses runtime properties:

```text
widgetId
themeId
size
locale
data
metadata
```

This separation is why the same Battery definition can be rendered as Material 3, Cupertino, HUD / Cyber, etc.

## Public library layer

```text
src/library/
├── IoTWidget.tsx   production-facing wrapper
├── catalog.ts      registry/theme lookup helpers
├── types.ts        runtime/public integration types
└── index.ts        package exports
```

This layer prevents host projects from depending on the showcase application.

## Widget core

```text
src/widgets/core/
├── types.ts
├── themeTokens.ts
├── WidgetFrame.tsx
└── WidgetCard.tsx
```

`WidgetCard` is showcase-oriented. It adds the right-click size chooser and built-in info dialog.

`WidgetFrame` is the reusable visual shell used by both the showcase and `IoTWidget`.

## Theme renderers

Every built-in theme has its own renderer module:

```text
src/widgets/themes/
├── MaterialVisuals.tsx
├── FlatVisuals.tsx
├── MinimalVisuals.tsx
├── GamingVisuals.tsx
├── IOSVisuals.tsx
├── GlassVisuals.tsx
├── IOSFrame.tsx
└── GlassFrame.tsx
```

`WidgetVisualRenderer` is intentionally a thin dispatch table. Theme structure therefore lives with the theme rather than in the showcase page.

## Why themes are more than tokens

Theme tokens provide common metadata such as accent/surface/border/radius. They do not define the whole theme.

Theme-specific renderers own:

- composition;
- gauge geometry;
- chart language;
- control geometry;
- density;
- typography treatment;
- state representation;
- size-specific behavior.

This avoids six themes becoming one layout with six color palettes.

## Per-widget theming

The theme is passed directly to each widget. There is no architectural requirement that siblings share a theme.

The showcase's global selector is only a comparison tool.

## Data merging

Internally the original renderer code reads from `WidgetDefinition.mock`. To preserve compatibility while providing a production-friendly API, `IoTWidget` creates a runtime definition with:

```ts
runtimeDefinition.mock = {
  ...definition.mock,
  ...metadata,
  ...data,
};
```

The original registry object is not mutated.

This is a compatibility bridge. A future major version may replace the internal `mock` name with an explicit runtime data context.

## Dependencies

The library uses MUI and Emotion. React/MUI/Emotion are peer dependencies in the distributable package so the host project owns their versions and only one React instance is used.

## Showcase isolation

These files are showcase/QA-only and should not be required in a host application:

```text
src/App.tsx
src/components/ShowcaseToolbar.tsx
src/styles.css
scripts/* screenshot helpers
```
