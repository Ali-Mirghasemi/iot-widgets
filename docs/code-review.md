# Current Codebase Review

## What is already strong

### Theme composition is genuinely separated

All six built-in themes now have dedicated visual renderer modules. `WidgetVisualRenderer` is a small dispatcher rather than the old large generic renderer with many theme branches.

This is the correct direction for theme independence and parallel design work.

### Theme is already a widget-level input

`WidgetCard` and `WidgetFrame` receive a theme object as a prop. Therefore the rendering model never fundamentally required a single global theme.

The showcase application chooses one global theme only because its purpose is to compare a complete family at once.

The public `IoTWidget` wrapper now exposes this existing capability directly as `themeId` per instance.

### Registry/renderer separation is useful

The registry defines what a widget is; the theme renderer defines how that visual family looks. This lets many semantic sensor types reuse one visual family without duplicating six implementations per sensor label.

### Adaptive sizes are explicit

Every definition owns `supportedSizes`, and theme renderers receive the chosen size. This is significantly better than depending on CSS size alone.

### Showcase QA is unusually useful

The deterministic QA route and Playwright scripts make it practical to inspect all widget/theme/size combinations and detect regressions.

## Problems found in the integration architecture

### 1. There was no production-oriented public component

Previously, the exported `WidgetCard` mixed reusable rendering with showcase behavior:

- local size state;
- right-click size menu;
- info dialog.

This is useful in the showcase but awkward inside another dashboard.

**Resolution:** added `IoTWidget`, which renders only the reusable frame + visual and accepts runtime props.

### 2. Runtime data was stored under `mock`

Renderers read values from `WidgetDefinition.mock`. That is convenient for screenshots but not a good external API name.

**Resolution:** the public wrapper exposes `data` and `metadata`, clones the definition and merges them internally. Consumers no longer need to know about the historical `mock` implementation detail.

A later major refactor can replace the internal bridge entirely.

### 3. Shared renderer still contained obsolete generic theme code

All six themes already had dedicated renderer modules, but `WidgetVisuals.tsx` still contained the old generic implementations. This increased code size and made the architecture harder to understand.

**Resolution:** replaced it with an explicit six-theme renderer map.

### 4. MUI/React were normal dependencies

A reusable React package should normally let the host application own React and UI runtime packages to prevent duplicate framework copies and version conflicts.

**Resolution:** React/MUI/Emotion are package peer dependencies, with development copies retained for the showcase.

### 5. Package publishing metadata/build was missing

The original project was private and had no library entry point/declaration build.

**Resolution:** added an ESM package entry, `dist/` library build, TypeScript declarations, package exports and packaging scripts.

### 6. Info action was mandatory in frame contracts

That caused a production wrapper to display a useless info icon if the host did not need one.

**Resolution:** info callbacks are optional; frames hide the action when it is not supplied.

### 7. Build errors existed in the latest integrated source

The latest integrated Material source rendered `unknown` runtime values directly inside MUI Typography in two places, which failed strict TypeScript compilation. `tsconfig.node.json` also used `allowImportingTsExtensions` without `noEmit`/`emitDeclarationOnly`.

**Resolution:** normalized the values with `String(...)` and corrected the Node TS config. Strict TypeScript compilation now passes.

## Remaining architectural limitations

### Controls need a semantic command layer

The controls are interactive but still theme-local preview implementations. The reusable wrapper provides `onInteraction` as a low-level bridge, but there is not yet one semantic event contract like:

```ts
{ command: 'setRelay', value: true }
```

across all themes.

This should be a future production API rather than embedding backend/MQTT/RPC logic inside visuals.

### Custom themes are not yet plugins

Per-widget selection among the six themes works perfectly. Adding a seventh built-in theme still requires updating the central type/tokens/dispatcher/frame contracts.

If third-party themes become a requirement, introduce a registered `WidgetThemePlugin` API in a future version.

### Theme token overrides are intentionally partial

Some themes use fixed theme-specific colors/geometry inside their renderer. This is necessary for strong visual identity, but means token overrides are tuning rather than complete runtime theme authoring.
