# Themes

## Built-in themes

| ID | Display name | Design direction |
|---|---|---|
| `material` | Material 3 | structured M3-inspired operational cards |
| `flat` | Industrial Flat | rectangular/blocky industrial hierarchy |
| `minimal` | Minimal Mono | typography/data-first monochrome UI |
| `gaming` | HUD / Cyber | telemetry HUD, segmented meters, cyber geometry |
| `ios` | Cupertino | glanceable soft smart-device tiles |
| `glass` | Aurora Glass | layered dark translucent/luminous UI |

Stable IDs should be stored in dashboard JSON. Display names may change without migrations.

## Per-widget selection

Themes are selected per component instance:

```tsx
<IoTWidget widgetId="battery" themeId="ios" />
<IoTWidget widgetId="pressure" themeId="flat" />
```

## Token override

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  themeOverrides={{ accent: '#8b5cf6' }}
/>
```

This creates a new token object for that instance only.

Do not mutate a shared object like this:

```ts
// Avoid this:
widgetThemes.material.accent = '#8b5cf6';
```

because it changes every consumer of that shared object and breaks the readonly-by-convention theme model.

## Structural design is theme-owned

Theme-specific renderers deliberately contain fixed geometry and some fixed colors. That is what allows Flat, Minimal, HUD, Cupertino and Glass to be structurally different instead of token recolors.

Consequently, `themeOverrides` is best for modest per-instance customization. A substantially new design language should be implemented as a new theme renderer.

## Adding a new theme

See [customization.md](customization.md).
