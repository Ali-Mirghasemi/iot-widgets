# FAQ

## Can different widgets on one dashboard use different themes?

Yes.

```tsx
<IoTWidget widgetId="battery" themeId="ios" />
<IoTWidget widgetId="temperature" themeId="material" />
```

Theme selection is per widget instance.

## Can I change only the Battery widget theme?

Yes. Change only that Battery instance's `themeId`. Other widgets are unaffected.

## Why does the showcase theme selector change every widget at once?

The showcase is a comparison/QA tool. Its global selector is intentionally designed to inspect an entire theme family. The reusable library component does not have this restriction.

## Can I customize only one Material Battery without changing all Material widgets?

Yes for token-level changes:

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  themeOverrides={{ accent: '#8b5cf6' }}
/>
```

This creates a per-instance theme object. Do not mutate the shared `widgetThemes.material` object.

For a radically different Battery composition, create a custom definition/renderer/theme extension instead of treating token overrides as a full theme engine.

## Do I need the showcase CSS in my other project?

No. `IoTWidget` uses MUI/SVG styling internally and fills its parent. The showcase grid CSS is only needed by the demo/QA app.

## Which component should I import?

Use `IoTWidget` in production applications.

Use `WidgetCard` only if you want the showcase-style info dialog and right-click resize menu.

## Can I feed live telemetry?

Yes. Pass live values through `data` and metadata through `metadata`. The component re-renders when those props change.

## Can I install directly from Git?

Yes, provided the selected Git revision contains a built `dist/` folder. See `installation.md`.

## Does this package include React/MUI inside the bundle?

No. They are peer dependencies so your application supplies them.
