# Cupertino (`ios`) Integration

Shared integration is required, but the shared files are intentionally **not** included in this patch because theme work is happening in parallel.

## 1. Route iOS visuals to the dedicated renderer

File: `src/widgets/renderers/WidgetVisuals.tsx`

Add this import with the other theme renderer imports:

```tsx
import { IOSVisualRenderer } from '../themes/IOSVisuals';
```

Then, at the start of `WidgetVisualRenderer`, before the Material/default or generic-theme rendering path, add:

```tsx
if (props.theme.id === 'ios') return <IOSVisualRenderer {...props} />;
```

For example:

```tsx
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'ios') return <IOSVisualRenderer {...props} />;
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  // existing renderer logic continues unchanged...
}
```

Do not rename the `ios` theme ID or any widget ID. No registry/type/token change is required for this patch.

## 2. Route iOS widgets to the dedicated frame

File: `src/widgets/core/WidgetFrame.tsx`

Add:

```tsx
import { IOSFrame as IOSThemeFrame } from '../themes/IOSFrame';
```

Then change only the existing `ios` switch branch to:

```tsx
case 'ios': return <IOSThemeFrame {...props}/>;
```

The existing in-file legacy `IOSFrame` can remain temporarily; once all parallel work is merged and verified, the coordinator may remove that dead implementation as a cleanup-only change. Its removal is not required for this patch to work.

## QA after integration

PowerShell:

```powershell
$env:WIDGET_QA_THEME="ios"
npm run screenshots:full

$env:WIDGET_QA_THEME="ios"
npm run screenshots
```

Inspect every generated Cupertino sheet for metrics, controls, charts, location, tables, and display, at every supported size, in both English and Persian where the QA route supports locale switching.

## Preferred one-command bilingual QA

If the simplified QA runner from this conversation is installed, the easiest final verification is:

```cmd
scripts\widget-qa.cmd ios
```

It generates one `out\ios-qa.zip` containing both English and Persian widget/full-page QA outputs.
