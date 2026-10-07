# Industrial Flat — Integration

This patch intentionally does **not** modify coordinator-owned shared files. Two small shared integration edits are required.

## 1. Route `flat` to the dedicated renderer

File: `src/widgets/renderers/WidgetVisuals.tsx`

Add this import next to the Material renderer import:

```tsx
import { FlatVisualRenderer } from '../themes/FlatVisuals';
```

Then add the `flat` early return in `WidgetVisualRenderer` immediately after the Material early return:

```tsx
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'flat') return <FlatVisualRenderer {...props} />;

  const v = props.def.visual;
  // existing fallback/theme rendering continues unchanged...
}
```

The early return is important: it isolates Industrial Flat from the older scattered `theme.id === 'flat'` branches in the generic renderer without requiring a risky shared-file cleanup during parallel theme work.

## 2. Update only the visible theme label

File: `src/widgets/core/themeTokens.ts`

Keep the stable ID exactly as `flat`, but change the display label:

```diff
 flat: {
   id: 'flat',
-  label: 'Flat',
+  label: 'Industrial Flat',
```

No token rewrite is required for this patch; the existing flat frame/token plumbing remains compatible.

## Screenshot QA

PowerShell commands requested by the project:

```powershell
$env:WIDGET_QA_THEME="flat"
npm run screenshots:full

$env:WIDGET_QA_THEME="flat"
npm run screenshots
```

If your local scripts require an explicit Chromium executable, set `PLAYWRIGHT_CHROME_PATH` according to your existing project setup before running them.

Inspect every generated `flat` category and the QA overflow diagnostics before merging.
