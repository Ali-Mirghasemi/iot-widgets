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
- `2x2+`: adds statistics, metadata, history, event/context rows, or richer control feedback.

Semantic IoT treatments were added for battery, radio signal, tanks, fire/smoke/leak alarms, thermostat, map/route, compass, and SCADA instead of rendering every device as a generic KPI tile.

Interactive mock controls keep local theme-renderer state: button feedback, switches, sliders, numeric stepper/input, thermostat setpoint, color controls, and direction pad all respond without requiring showcase-only state in `App.tsx`.

Persian remains supported through localized labels and RTL layout where appropriate. Numeric, chart, coordinates, telemetry, and other technical content intentionally stays LTR where that improves readability.

## Reference direction

The redesign was informed by current Apple Human Interface Guidelines for Widgets, Controls, Toggles, Sliders, Gauges, Charts, Layout, and right-to-left interfaces, plus Apple Home interaction patterns. The implementation uses those principles for glanceability, hierarchy, adaptive composition, familiar control behavior, and restrained status color without copying an Apple product interface pixel-for-pixel.

The separate Aurora Glass theme exists in this project, so Cupertino intentionally avoids making translucent/liquid-glass material the dominant visual device.

## QA performed

- Read `docs/profile.md`, `docs/agents.md`, and `docs/todo.md` completely before editing.
- Inspected the existing `ios` source paths and all six existing iOS full-screenshot category sheets before redesigning.
- Verified dispatch coverage for all 35 `WidgetVisual` values.
- Ran an isolated strict TypeScript check for the two new theme files using local type stubs because the uploaded workspace dependency tree is incomplete.
- Attempted `npm run build`; the workspace currently fails before theme compilation because multiple installed type packages are missing/incomplete and the existing Node tsconfig build also reports its `allowImportingTsExtensions`/emit configuration issue.
- Attempted both required theme-scoped screenshot commands. Both stop immediately because `node_modules/playwright/index.js` is missing from the uploaded/incomplete dependency tree.
- A clean dependency reinstall could not be completed in this sandbox because npm registry/DNS access is unavailable.

Because Playwright could not launch, post-redesign screenshot inspection could not be completed in this environment. Run the commands in the project after restoring/installing dependencies and review all generated `ios` category sheets before merging.

## Files in this patch

- `src/widgets/themes/IOSVisuals.tsx`
- `src/widgets/themes/IOSFrame.tsx`
- `THEME_NOTES.md`
- `INTEGRATION.md`
