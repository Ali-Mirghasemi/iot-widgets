# English, Persian and RTL

Supported locale IDs:

```ts
'ten' | 'fa'
```

## Frame direction

Headers/frame metadata follow the selected locale.

## Body direction

Each `WidgetDefinition` declares:

```ts
'ltr' | 'rtl' | 'auto'
```

This prevents technical/numeric visualizations from being incorrectly mirrored just because the application language is Persian.

For example, it is often correct for these to remain LTR:

- chart time axes;
- gauges;
- coordinates;
- timestamps;
- signal metrics;
- command payloads;
- numeric controls.

## Runtime metadata

Prefer localized metadata when user-visible:

```tsx
metadata={{
  deviceName: 'Boiler room · Node-04',
  deviceNameFa: 'اتاق بویلر · نود ۰۴',
  locationLabel: 'Factory A',
  locationLabelFa: 'کارخانه A',
}}
```

If a Persian-specific value is omitted, the reusable wrapper can fall back to the English value.

## QA requirement

Run screenshot QA in both locales for any new widget visual, size, or theme change. Persian text often exposes truncation and direction errors that English does not.
