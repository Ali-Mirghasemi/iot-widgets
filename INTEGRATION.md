# Gaming theme integration

Shared integration is required only if your project has not already applied the gaming dispatch hooks.

This patch intentionally does **not** modify shared files because theme work is happening in parallel.

The dedicated theme file exports both named components:

```tsx
export function GamingVisualRenderer(...) { ... }
export function GamingFrame(...) { ... }
```

If you already fixed the gaming export/dispatch locally, no new shared integration change is required for pass 4.

## 1. `src/widgets/renderers/WidgetVisuals.tsx`

Import the dedicated renderer:

```tsx
import { GamingVisualRenderer } from '../themes/GamingVisuals';
```

At the start of `WidgetVisualRenderer`, dispatch only the stable `gaming` theme ID:

```tsx
if (props.theme.id === 'gaming') return <GamingVisualRenderer {...props} />;
```

Example:

```tsx
export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'gaming') return <GamingVisualRenderer {...props} />;

  const v = props.def.visual;
  // existing shared renderer...
}
```

## 2. `src/widgets/core/WidgetFrame.tsx`

Import the gaming frame:

```tsx
import { GamingFrame as GamingThemeFrame } from '../themes/GamingVisuals';
```

Route only the stable gaming ID:

```tsx
case 'gaming':
  return <GamingThemeFrame {...props} />;
```

No changes are required in:

- `registry.ts`
- `types.ts`
- `themeTokens.ts`
- `App.tsx`
- `styles.css`

Pass 4 changes only internal gaming-theme layouts; the integration contract is unchanged.
