# Minimal Mono — Integration

Shared integration is required only to route theme ID `minimal` to the new isolated renderer.

Do **not** rename the stable theme ID.

## Required change

Edit:

`src/widgets/renderers/WidgetVisuals.tsx`

### 1. Add this import next to the Material renderer import

```ts
import { MinimalVisualRenderer } from '../themes/MinimalVisuals';
```

### 2. Add this dispatcher branch immediately after the Material branch

Current:

```ts
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  const v = props.def.visual;
```

Replace that opening with:

```ts
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'minimal') return <MinimalVisualRenderer {...props} />;
  const v = props.def.visual;
```

No other shared renderer edits are required. The older scattered `theme.id === 'minimal'` branches may remain temporarily because this early return bypasses them. They can be removed later during shared-renderer cleanup by the coordinator.

## Optional display-name cleanup

The shared token currently labels the theme as `Minimal`. If the coordinator wants the UI to match the working name used for this pass, change only the display label in `src/widgets/core/themeTokens.ts`:

```ts
minimal: {
  id: 'minimal',
  label: 'Minimal Mono',
```

This is optional and does not affect persistence/API compatibility.

## QA commands

PowerShell:

```powershell
$env:WIDGET_QA_THEME="minimal"
npm run screenshots:full

$env:WIDGET_QA_THEME="minimal"
npm run screenshots
```

Then inspect all generated Minimal screenshots for metrics, controls, charts, location, tables, and display.
