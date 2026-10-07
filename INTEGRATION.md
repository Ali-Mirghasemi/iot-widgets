# Aurora Glass integration

This patch intentionally does **not** package coordinator-owned shared files.

Two small shared dispatcher changes are required so the isolated Aurora Glass renderer/frame are used.

## 1. `src/widgets/renderers/WidgetVisuals.tsx`

Add this import next to the existing Material renderer import:

```tsx
import { GlassVisualRenderer } from '../themes/GlassVisuals';
```

Then in `WidgetVisualRenderer`, immediately after the Material dispatch, add:

```tsx
if (props.theme.id === 'glass') return <GlassVisualRenderer {...props} />;
```

Resulting opening should be:

```tsx
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'glass') return <GlassVisualRenderer {...props} />;

  const v = props.def.visual;
  // existing generic theme dispatcher continues here...
}
```

Do not remove the existing generic Glass branches in the same merge unless the coordinator is already cleaning up the shared renderer. They simply become unreachable for theme ID `glass` after the early dispatch, which keeps this integration patch minimal and parallel-safe.

## 2. `src/widgets/core/WidgetFrame.tsx`

Add this import:

```tsx
import { GlassFrame as AuroraGlassFrame } from '../themes/GlassFrame';
```

Then change only the `glass` switch case in `WidgetFrame`:

```tsx
case 'glass': return <AuroraGlassFrame {...props}/>;
```

The existing local `GlassFrame` function can remain temporarily to minimize merge conflicts. It can be removed later during the coordinator's shared cleanup.

## Optional display-name change

If the coordinator wants the showcase label to match the working theme name, change only the `glass` label in `src/widgets/core/themeTokens.ts`:

```tsx
label: 'Aurora Glass',
```

This label change is optional. The stable theme ID remains exactly `glass`.

## QA commands after integration

PowerShell:

```powershell
$env:WIDGET_QA_THEME="glass"
npm run screenshots:full

$env:WIDGET_QA_THEME="glass"
npm run screenshots
```

Persian follow-up:

```powershell
$env:WIDGET_QA_THEME="glass"
$env:WIDGET_QA_LOCALE="fa"
npm run screenshots
```
