# Gaming theme integration

Shared integration **is required**, but this patch intentionally does not modify shared files because theme work is happening in parallel.

The new theme file exports:

- `GamingVisualRenderer`
- `GamingFrame`

Apply only the following small dispatcher changes.

## 1. `src/widgets/renderers/WidgetVisuals.tsx`

Add this import next to the Material theme renderer import:

```tsx
import { GamingVisualRenderer } from '../themes/GamingVisuals';
```

Then, at the start of `WidgetVisualRenderer`, immediately after the existing Material branch, add:

```tsx
if (props.theme.id === 'gaming') return <GamingVisualRenderer {...props} />;
```

Resulting dispatcher start:

```tsx
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'gaming') return <GamingVisualRenderer {...props} />;
  const v = props.def.visual;
  // existing shared renderer continues unchanged...
}
```

## 2. `src/widgets/core/WidgetFrame.tsx`

Add this import:

```tsx
import { GamingFrame as GamingThemeFrame } from '../themes/GamingVisuals';
```

In the existing theme switch, replace only the `gaming` case:

```tsx
case 'gaming': return <GamingThemeFrame {...props}/>;
```

So that section becomes:

```tsx
switch (props.theme.id) {
  case 'flat': return <FlatFrame {...props}/>;
  case 'minimal': return <MinimalFrame {...props}/>;
  case 'gaming': return <GamingThemeFrame {...props}/>;
  case 'ios': return <IOSFrame {...props}/>;
  case 'glass': return <GlassFrame {...props}/>;
  default: return <MaterialFrame {...props}/>;
}
```

The old shared-file `GamingFrame` implementation can remain temporarily unused to keep this merge minimal. A coordinator may remove it later after all parallel theme branches are merged.

No changes are needed in `registry.ts`, `types.ts`, `themeTokens.ts`, `App.tsx`, or `styles.css`.
