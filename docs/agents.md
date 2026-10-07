# IoT Widget Studio — Agent / Parallel-Chat Rules

This document defines how multiple ChatGPT chats/agents should work on different widget themes without turning the codebase into conflicting copies.

## 1. One chat = one theme

Assign only one stable theme ID to each parallel chat:

- `flat`
- `minimal`
- `gaming`
- `ios`
- `glass`

Material (`material`) is currently coordinated in the main chat and should not be changed by parallel theme chats unless explicitly assigned.

## 2. Read these docs first

Before changing code, read:

1. `docs/profile.md`
2. `docs/agents.md`
3. `docs/todo.md`

Then inspect the current source and screenshots for the assigned theme.

## 3. Research before designing

For the assigned theme, search the web for current dashboard/widget references before editing.

Research the design language, not just colors. Look for:

- IoT dashboards;
- industrial control dashboards;
- observability/telemetry panels;
- smart-home tiles;
- dashboard gauge/control patterns;
- relevant platform HIG/design guidance;
- relevant real products.

Do not clone a proprietary UI pixel-for-pixel. Use references to understand hierarchy, density, control patterns, shapes, and information composition, then create an original implementation.

## 4. Theme must be structurally different

The assigned theme must not be the Material renderer with changed tokens.

Change the actual composition when appropriate:

- header structure;
- value position;
- status placement;
- chart/gauge language;
- icon treatment;
- control treatment;
- metadata density;
- card geometry;
- size-specific information hierarchy.

A screenshot should make the assigned theme recognizable even in grayscale.

## 5. Parallel-safe file ownership

### Theme agent may own/create

Prefer files dedicated to the assigned theme, for example:

```text
src/widgets/themes/FlatVisuals.tsx
src/widgets/themes/MinimalVisuals.tsx
src/widgets/themes/GamingVisuals.tsx
src/widgets/themes/IOSVisuals.tsx
src/widgets/themes/GlassVisuals.tsx
```

If a theme-specific frame is extracted, prefer similarly isolated files:

```text
src/widgets/themes/FlatFrame.tsx
...
```

### Shared files are coordinator-owned

Avoid changing these in a parallel-theme patch unless absolutely required:

```text
src/widgets/core/types.ts
src/widgets/core/WidgetCard.tsx
src/widgets/core/WidgetFrame.tsx
src/widgets/core/themeTokens.ts
src/widgets/renderers/WidgetVisuals.tsx
src/widgets/registry.ts
src/widgets/index.ts
src/App.tsx
src/styles.css
```

Why: several chats editing the same shared file will produce merge conflicts.

If integration requires a shared-file change, do one of the following:

1. preferably create the theme-specific module and write the exact integration change in `INTEGRATION.md` without packaging the shared file; or
2. if testing truly requires the shared edit, include it in a clearly separated `integration/` part of the patch and explain every shared hunk.

The main/coordinator chat will merge shared changes.

## 6. Do not change stable contracts casually

Do not rename:

- theme IDs;
- widget IDs;
- widget categories;
- existing public type names;
- expected registry fields.

Display labels may be proposed, but stable identifiers are coordinator-controlled.

Do not add a new dependency without a strong reason. If one is necessary, explain why and keep it optional/local if possible.

## 7. Size behavior is mandatory

Inspect **all supported sizes** of every widget in the assigned theme.

Do not solve only the default size.

For each widget ask:

- What is essential at `1x1`?
- What useful information appears at `2x1`?
- How should `1x2` use vertical space?
- What new capability/context appears at `2x2` or larger?
- Is the visualization still readable in Persian?

Never treat resize as CSS scale-only behavior.

## 8. Controls must actually respond

For controls such as:

- button;
- switch/relay;
- slider;
- set value;
- thermostat;
- RGB/light color;
- directional/PTZ;
- siren/beacon;
- lock;

mock interactions must visibly respond in the showcase.

Examples:

- button shows queued/success feedback;
- switch changes state;
- RGB changes preview color/brightness;
- thermostat changes target;
- direction highlights the last command;
- alarm/siren distinguishes armed, active, acknowledged, off, etc. when applicable.

## 9. QA workflow

Use the project's screenshot tooling after changes.

Recommended targeted PowerShell run:

```powershell
$env:WIDGET_QA_THEME="<theme-id>"
npm run screenshots:full
```

If the project uses the variant/diagnostics capture script as well:

```powershell
$env:WIDGET_QA_THEME="<theme-id>"
npm run screenshots
```

Review every category:

- metrics
- controls
- charts
- location
- tables
- display

Check all sizes, not only the first viewport.

## 10. Visual QA checklist

Before returning a patch, verify:

- [ ] no overlap;
- [ ] no content outside widget bounds;
- [ ] no unexpected scrollbar;
- [ ] no half/cut gauges;
- [ ] no hidden critical label/value;
- [ ] no giant dead area in larger widgets;
- [ ] no tiny centered 1x1 composition inside 2x2;
- [ ] no excessive pill/rounded-shape usage unless the theme intentionally calls for it;
- [ ] controls respond;
- [ ] states are visually distinct;
- [ ] semantic icons/visuals are useful rather than decorative noise;
- [ ] English layout works;
- [ ] Persian/RTL does not break the layout;
- [ ] the theme is recognizably different from Material 3;
- [ ] code remains reusable outside the showcase page.

## 11. Patch-only delivery

Parallel theme chats should return a **small patch ZIP**, not the complete project.

Patch contents should preferably be:

```text
src/widgets/themes/<Theme>Visuals.tsx
INTEGRATION.md       # only if shared dispatcher/frame/token integration is needed
THEME_NOTES.md       # brief design decisions + QA status
```

Do not package `node_modules`, screenshots, build output, or unrelated files.

The final response should say exactly:

- which files to replace/add;
- whether shared integration is required;
- how to run the theme-only screenshot command;
- known remaining issues, if any.

## 12. Stop conditions

Do not endlessly polish subjective details.

A theme is ready for coordinator review when:

1. structural problems are fixed;
2. all supported sizes are intentional;
3. it is visually distinct;
4. controls work;
5. screenshot QA is clean enough for a final design review.

The coordinator may then request one final polish pass.

