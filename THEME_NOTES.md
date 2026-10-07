# Aurora Glass — Theme Notes

Stable theme ID: `glass`

## Design direction

Aurora Glass is redesigned as a **luminous instrumentation layer**, not Material 3 with transparency.

Key principles used in this pass:

- readable telemetry remains the highest-contrast layer;
- blur/translucency is concentrated at the outer widget frame rather than repeatedly stacking glass-on-glass;
- interior surfaces use light translucent fills, hairline highlights, and selective glow instead of heavy nested blur;
- cyan/violet light is reserved for live data, focus, and active controls;
- warning/critical states use amber/coral and remain visually distinct from decorative aurora light;
- larger sizes add history, metadata, operational state, or control context instead of simply scaling a small widget;
- semantic IoT widgets use shapes appropriate to the data: liquid tanks, battery shells, cellular bars, alarm beacons, process mimic, compass/map, etc.

## Research references

The design pass used these references for hierarchy and interaction ideas, without copying any one interface:

- Microsoft Fluent 2 Material / Acrylic guidance: https://fluent2.microsoft.design/material
- Apple Liquid Glass overview and hierarchy guidance: https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
- Apple WWDC25 “Meet Liquid Glass” (especially restraint / avoiding glass-on-glass): https://developer.apple.com/videos/play/wwdc2025/219/
- Grafana dashboard design best practices: https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/
- General contemporary glass-dashboard / IoT telemetry references were also reviewed for density, map, chart, and smart-control composition.

## Files in this patch

- `src/widgets/themes/GlassVisuals.tsx`
- `src/widgets/themes/GlassFrame.tsx`
- `THEME_NOTES.md`
- `INTEGRATION.md`

No Material 3 files or other theme files are included in the patch.

## Widget coverage

All currently registered visual types used by `glass` are handled in `GlassVisualRenderer`:

- metrics: metric, battery, cellular signal, tank, boolean status, gauge, fire/smoke/leak indicators;
- controls: command/downlink button, switch/relay/lock/siren, slider/fan, manual set value, thermostat, RGB color, directional control;
- charts: time-series/area, bar, histogram, donut, heatmap, state/status timeline, gauge;
- location: map, coordinates, route/track, compass;
- tables/events: device table, measurement list, alarms, event history, logs;
- display/custom: clock, text/markdown, camera/image, iframe mock, SCADA/mimic.

## Size behavior

The renderer uses width/height-aware compositions rather than scaling one card:

- `1x1`: core value/state, compact semantic visual, minimal status context;
- `2x1`: split compositions with trace/control context beside the primary value;
- `1x2`: deliberately vertical layouts for metrics/tanks and stacked context;
- `2x2+`: history charts, min/avg/max, recent-state strips, command metadata, richer map/SCADA context;
- `3x1` / `3x2` chart widgets use the extra horizontal canvas for a real trace/history view.

## Mock interaction behavior

Interactive widgets now visibly update local mock state:

- command/downlink button: queued/ACK-pending feedback;
- relay / door lock / siren: state toggles;
- slider / fan: live numeric value;
- manual set value: editable field plus apply state on large layout;
- thermostat: `−` / `+` controls update target;
- RGB color: selectable swatches plus brightness slider;
- directional control: last selected command remains highlighted.

State is local to the reusable theme renderer; it is not coupled to `App.tsx` or showcase-global state.

## Validation performed

- Read `docs/profile.md`, `docs/agents.md`, and `docs/todo.md` completely before editing.
- Reviewed the existing Glass screenshots for all six categories and the current Glass-specific branches in the shared renderer/frame.
- Performed current web reference research before implementation.
- `GlassFrame.tsx`: TypeScript JSX transpile check passed.
- `GlassVisuals.tsx`: TypeScript JSX transpile check passed.
- Both files passed an additional TypeScript check using temporary local module stubs to validate internal expressions/types without project dependencies.
- Confirmed no Material 3 or other theme-specific source file is included in the patch.

## Screenshot QA follow-up — pass 3

The latest user-provided QA set was inspected in all three archives:

- `full-screenshots.rar` — full Glass category pages;
- `widget-screenshots.rar` — per-widget English captures;
- `widget-screenshots(1).rar` — per-widget Persian captures.

### Root-cause fix: broad white wash / long status bar

The remaining glare was not merely an opacity-tuning problem. Three intended one-pixel rules in `GlassFrame.tsx` used numeric MUI `sx` sizing:

```tsx
height: 1
width: 1
```

For MUI sizing transforms, values in the `0..1` range are percentage-like sizing values. As a result, the intended top hairline and left edge highlight expanded across the card, producing the broad white wash seen in almost every screenshot. The status-row divider had the same issue and expanded into the long pale horizontal bar.

This pass changes those dimensions to explicit CSS pixels (`'1px'`) and fixes the same mistake in two internal semantic highlights in the battery/tank visuals. This keeps the Aurora glass edge treatment while removing the unintended full-surface overlays.

### Additional composition fixes from the new captures

- **State / status timeline:** large `3x2` layouts now use the available height deliberately, with framed channel rows plus Normal / Warning / Alarm summary context instead of leaving a large empty center.
- **Command / downlink:** large layouts now show a three-row command/transport history and ACK state instead of one status line floating in a large empty plate.
- **Heatmap:** cell intensity differentiation and high-intensity borders were strengthened so the matrix remains readable after the frame washout is removed.
- **SCADA / mimic:** tall large layouts now add a flow-stability trace under the process mimic so `3x3` does not look like a small horizontal diagram floating in a tall card.
- **Persian QA:** the supplied RTL run was checked for ordering/clipping; the new rich command text keeps Persian labels RTL while timestamps, RPC results, chart axes, and other technical data remain LTR where appropriate.

## Validation performed after pass 3

- Both theme files pass TypeScript JSX transpilation with TypeScript 5.8.3.
- A sizing audit found no remaining positive numeric `width` / `height` values `<= 1` in the two Aurora theme files; intended hairlines are explicit pixel strings.
- No Material 3 or other theme source is included in the patch.
- Shared integration requirements are unchanged from the previous patch.

The sandbox still does not have the project npm dependencies / Playwright installation, so the corrected code cannot be recaptured here. Re-run the Glass-only commands below in the normal project checkout and inspect the new Chromium output.

## Screenshot QA follow-up — pass 4

The supplied `glass-qa.zip` was reviewed in both English and Persian, including the full category pages and individual widget captures.

### Confirmed fixed from pass 3

- The accidental full-card white wash is gone.
- The oversized pale status divider is gone.
- Fire/smoke/leak alarm compositions, large timeline/history layouts, command history, heatmap contrast, and the richer SCADA layouts all render without the previous frame-sizing failure.
- The Persian run keeps technical/numeric content LTR where appropriate and does not show a new frame-level RTL clipping problem.

### Additional pass-4 fixes from the new captures

- **Directional Control (`2x1`)**: the D-pad was slightly too tall for the available body after the frame metadata row, so the bottom key could clip. Wide compact layouts now use a smaller key matrix/padding while `2x2` keeps the larger control surface.
- **Text / Markdown (`2x1`)**: replaced the vertically stacked rich layout with a deliberate split composition. Summary/metadata live on one side and the three live sensor rows on the other, avoiding the clipped third row seen in the QA capture.
- **Text / Markdown (`2x2`)**: the sensor plate now distributes its rows through the available height instead of leaving a large dead lower area.
- **RGB / Light Color (`2x2`)**: replaced the oversized empty metadata plate with a live RGB/PWM channel mixer showing effective R/G/B channel levels, plus compact HEX/mode context. Swatch and brightness interactions continue to update it.
- **iFrame / External Content (`2x1`)**: now previews an embedded operational surface with live stats and a compact trace instead of showing a generic centered placeholder across a wide card. `1x1` stays intentionally minimal and `2x2+` keeps the richer embedded-app shell.
- **SCADA / Mimic (`3x3`)**: added a dedicated process-status toolbar and a tighter tall-layout SVG viewport so the process train occupies more of the available mimic canvas instead of floating in excess vertical whitespace.

## Validation performed after pass 4

- `GlassFrame.tsx` and `GlassVisuals.tsx` both pass TypeScript JSX transpilation with TypeScript 5.8.3.
- Both files pass the stricter isolated TypeScript check using the existing local React/MUI stubs plus the real project `types.ts` and `mockData.ts` definitions used for theme QA.
- A sizing audit again found no positive numeric MUI `width` / `height` values `<= 1`; intended one-pixel rules remain explicit CSS pixel strings.
- No Material 3 or other theme source is included in the patch.
- Shared integration requirements are unchanged.

The sandbox still does not contain the project Playwright/npm dependency installation, so pass-4 Chromium captures must be regenerated in the normal project checkout.

## Remaining review targets

1. Re-check `direction` at `2x1` and confirm the bottom key no longer clips.
2. Re-check `text` at `2x1` / `2x2`, `color` at `2x2`, and `iframe` at `2x1` because those compositions changed materially in this pass.
3. Re-check the `3x3` SCADA capture to confirm the tighter process viewport has the desired density on the real host font/rendering stack.
4. Repeat the Persian widget screenshot command once after integration; no RTL-specific code issue is currently known.
