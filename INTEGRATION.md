# Gaming theme integration

Shared integration **is required**, but this patch intentionally does not modify shared files because theme work is happening in parallel.

The theme file now correctly exports both named components:

```tsx
export function GamingVisualRenderer(...) { ... }
export function GamingFrame(...) { ... }
```

> Note: the previous v2 patch accidentally declared `GamingVisualRenderer` without the `export` keyword even though its integration notes said otherwise. This v3 patch fixes that mismatch.

## 1. `src/widgets/renderers/WidgetVisuals.tsx`

Add this import next to the other dedicated theme renderer imports:

```tsx
import { GamingVisualRenderer } from '../themes/GamingVisuals';
```

Then, at the start of `WidgetVisualRenderer`, add the gaming dispatch branch:

```tsx
if (props.theme.id === 'gaming') return <GamingVisualRenderer {...props} />;
```

Example:

```tsx
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'gaming') return <GamingVisualRenderer {...props} />;

  const v = props.def.visual;
  // existing shared renderer continues unchanged...
}
```

## 2. `src/widgets/core/WidgetFrame.tsx`

Add:

```tsx
import { GamingFrame as GamingThemeFrame } from '../themes/GamingVisuals';
```

In the existing theme switch, route only the stable `gaming` ID to the dedicated frame:

```tsx
case 'gaming': return <GamingThemeFrame {...props} />;
```

For example:

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

The old shared-file gaming frame implementation can remain temporarily unused for a parallel-safe merge.

No changes are required in:

- `registry.ts`
- `types.ts`
- `themeTokens.ts`
- `App.tsx`
- `styles.css`
