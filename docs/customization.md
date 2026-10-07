# Customization and Extension

## Add a widget definition

Add a definition to `src/widgets/registry.ts`.

Choose an existing `WidgetVisual` when the new widget can reuse an existing visual family.

Example concept:

```ts
w({
  id: 'room-occupancy',
  title: 'Occupancy',
  fa: 'تعداد افراد',
  desc: '...',
  category: 'metrics',
  visual: 'metric',
  icon: People,
  value: 12,
  unit: 'people',
})
```

This is preferable to adding a new renderer when the only difference is label/unit semantics.

## Add a new visual type

When the widget genuinely requires a new visualization:

1. extend `WidgetVisual` in `src/widgets/core/types.ts`;
2. implement that visual in each theme renderer or provide an intentional fallback;
3. add a registry definition;
4. run all-size EN/FA screenshot QA.

Adding a visual type is a cross-theme contract change and should be coordinated centrally.

## Add a new theme

A new built-in theme currently requires:

1. add its stable ID to `WidgetThemeId`;
2. add tokens in `themeTokens.ts`;
3. create a dedicated theme renderer under `src/widgets/themes/`;
4. add the renderer to `visualRenderers` in `WidgetVisuals.tsx`;
5. add/route a frame in `WidgetFrame.tsx` if its shell differs;
6. add screenshot QA coverage.

Do not implement a new theme as scattered `if (theme.id === ...)` branches across unrelated renderers.

## Override one widget instance

If you only need to tune one widget instance:

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  themeOverrides={{ accent: '#7c3aed' }}
/>
```

If you need to change the actual widget definition without changing the registry globally:

```tsx
const base = requireWidgetDefinition('battery');
const custom = {
  ...base,
  titleEn: 'Backup Battery',
  titleFa: 'باتری پشتیبان',
};

<IoTWidget definition={custom} themeId="material" />
```

## Host-owned frame/actions

Advanced consumers can use the lower-level exports:

```ts
WidgetFrame
WidgetVisualRenderer
```

This is useful when the host wants its own card menus, drag handles, edit buttons, alarm acknowledgement UI, etc.

`WidgetCard` should generally remain a showcase/admin-builder component rather than the production rendering primitive.
