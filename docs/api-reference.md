# API Reference

## `IoTWidget`

Primary reusable component.

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  size="1x1"
  locale="en"
  data={{ value: 76 }}
/>
```

Important props:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `widgetId` | `string` | — | resolve a built-in registry definition |
| `definition` | `WidgetDefinition` | — | advanced alternative to `widgetId` |
| `themeId` | `WidgetThemeId` | `material` | theme for this widget instance |
| `theme` | `WidgetThemeTokens` | — | advanced complete token object |
| `themeOverrides` | partial theme tokens | — | per-instance token tuning |
| `size` | `WidgetSize` | definition default | adaptive composition size |
| `locale` | `en \| fa` | `en` | locale/direction selection |
| `data` | `Record<string, unknown>` | demo data | live runtime values |
| `metadata` | `WidgetMetadata` | demo metadata | device/site/status labels |
| `onInfo` | callback | hidden | enables frame info action |
| `onInteraction` | callback | — | low-level click/change hook |
| `sx` | MUI `SxProps` | — | wrapper styling |
| `className` | `string` | — | wrapper class |
| `style` | `CSSProperties` | — | wrapper inline style |

Exactly one of `widgetId` or `definition` should normally be provided. If both are present, `definition` wins.

An unsupported `size` causes an explicit runtime error rather than silently rendering a broken layout.

## Catalog helpers

### `getWidgetDefinition(widgetId)`

Returns a definition or `undefined`.

### `requireWidgetDefinition(widgetId)`

Returns a definition or throws an error listing known IDs.

### `getWidgetTheme(themeId)`

Returns built-in theme tokens.

### `widgetsById`

Readonly ID → definition map.

### `widgetRegistry`

Ordered array of all built-in widget definitions.

### `widgetThemes`

Built-in theme token record.

### `widgetThemeList`

Array form of built-in theme tokens.

## Advanced components

### `WidgetFrame`

Theme-aware frame/chrome only. Use when a host application wants to supply its own body renderer.

### `WidgetVisualRenderer`

Theme-aware body only. Use when the host application owns its own frame/card shell.

### `WidgetCard`

Showcase/admin-builder component containing:

- right-click size selector;
- info dialog;
- `WidgetFrame`;
- `WidgetVisualRenderer`.

It is not the recommended production rendering primitive.

## Public types

The root package exports:

```text
Locale
WidgetCategory
WidgetDefinition
WidgetDirection
WidgetField
WidgetSize
WidgetThemeId
WidgetThemeTokens
WidgetVisual
WidgetData
WidgetMetadata
WidgetInstanceConfig
WidgetInteraction
IoTWidgetProps
IoTWidgetInfoContext
WidgetFrameProps
WidgetRendererProps
```
