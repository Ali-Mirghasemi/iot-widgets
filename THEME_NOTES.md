# Cupertino (`ios`) Theme Notes

## Scope

This patch redesigns the complete `ios` widget family as a dedicated, reusable Cupertino renderer instead of continuing to layer iOS conditions into the generic renderer. It covers all 35 supported visual types across metrics, controls, charts, location, tables, and display widgets.

The stable theme ID remains `ios`. No Material 3 or other theme implementation is included in this patch.

## Design direction

Cupertino uses restrained system-like surfaces rather than a recolored Material card or a glass-heavy treatment. The visual language uses compact 18–20 px containers, subtle separators, quiet elevation, square-rounded semantic icon tiles, strong numeric hierarchy, restrained system colors, and clear active/inactive state treatment.

The layout deliberately changes with widget size:

- `1x1`: glanceable value/state and only the most important indicator.
- `2x1`: secondary context, trend/history, or a more useful compact control layout.
- `1x2`: vertical space is used for semantic tank/control/history compositions rather than simply centering a small component.
- `2x2+`: adds statistics, metadata, history, event/context rows, richer visualizations, or richer control feedback.

Semantic IoT treatments are used for battery, radio signal, tanks, fire/smoke/leak alarms, thermostat, map/route, compass, and SCADA instead of rendering every device as a generic KPI tile.

Interactive mock controls keep local theme-renderer state: button feedback, switches, sliders, numeric stepper/input, thermostat setpoint, color controls, and direction pad all respond without requiring showcase-only state in `App.tsx`.

Persian remains supported through localized labels and RTL layout where appropriate. Numeric, chart, coordinates, telemetry, and other technical content intentionally stays LTR where that improves readability.

## Post-screenshot QA revision

The first Cupertino patch was rendered by the user with the full QA screenshot pass and all six `ios` category sheets were inspected visually. The second revision in this ZIP addresses the issues that were visible in those sheets:

- Large metric and line/area chart cards now let the chart consume the available flexible height instead of leaving a large blank middle region.
- Large state/status widgets now use a centered semantic hero treatment plus metadata instead of stretching a small `1x1` composition across a `2x2` card.
- `2x2` command, switch/lock/siren, slider, manual set-value, and directional controls now expose richer context and use the available vertical space intentionally.
- Large state timeline/history cards now include availability/warning/fault summary context and distribute timeline rows through the available height.
- Large coordinate widgets now include a GPS-lock/fix visualization instead of leaving the upper half unused.
- Large tables now use otherwise-empty `3x2` / `3x3` space for trend/activity context plus refresh/window metadata.
- Large fire/smoke/leak widgets now use semantic safety-zone hero treatments and richer event metadata.
- The compass center label now masks the needle so the heading number remains readable.
- Gauge needle geometry was corrected so the needle uses the same left-to-right semicircle as the visible gauge arc.

## Reference direction

The redesign was informed by current Apple Human Interface Guidelines for Widgets, Controls, Toggles, Sliders, Gauges, Charts, Layout, and right-to-left interfaces, plus Apple Home interaction patterns. The implementation uses those principles for glanceability, hierarchy, adaptive composition, familiar control behavior, and restrained status color without copying an Apple product interface pixel-for-pixel.

The separate Aurora Glass theme exists in this project, so Cupertino intentionally avoids making translucent/liquid-glass material the dominant visual device.

## QA performed

- Read `docs/profile.md`, `docs/agents.md`, and `docs/todo.md` completely before the initial edit.
- Inspected the original `ios` source paths and original iOS full-screenshot category sheets before redesigning.
- Verified dispatch coverage for all 35 `WidgetVisual` values.
- Inspected the user's generated post-patch `metrics`, `controls`, `charts`, `location`, `tables`, and `display` full QA sheets at supported sizes.
- Performed a TypeScript/JSX transpile syntax check on the revised `IOSVisuals.tsx` and `IOSFrame.tsx`; both pass.
- Full project `tsc` remains blocked in the supplied sandbox by the incomplete `node_modules` tree (missing React/Babel/etc. type packages), as in the first pass.
- Playwright screenshot generation also remains unavailable in this sandbox because the supplied dependency tree is incomplete.

A fresh screenshot pass should be run after applying this revision because the second-pass layout changes cannot be rendered locally in this sandbox.

## Files in this patch

- `src/widgets/themes/IOSVisuals.tsx`
- `src/widgets/themes/IOSFrame.tsx`
- `THEME_NOTES.md`
- `INTEGRATION.md`
