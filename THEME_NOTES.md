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

## Third QA revision (individual widget captures)

The user supplied a second full-sheet archive plus per-widget captures and the generated `report.json`. This pass focused on edge defects rather than another visual redesign. The v3 patch adds:

- Sparkline/chart endpoints are inset so the final marker is no longer clipped at the card edge.
- Sparkline normalization now preserves small telemetry changes (for example 24.4–24.8 °C) instead of flattening sub-unit ranges.
- Sparkline and SCADA SVGs render as block elements, removing the inline-SVG baseline that produced spurious vertical scroll/overflow in large table and SCADA cards.
- Value/unit typography now uses an explicit baseline flex row and normal line box, addressing the QA detector's repeated text scroll-overflow hits across metric, gauge, slider, and related numeric widgets.
- Cupertino switches constrain the hidden MUI input hit target to the visible switch bounds, reducing false outside-widget detections while preserving interaction.
- Horizontal slider roots now use border-box containment so their rails do not extend beyond `1x1` card bounds.
- `2x1` directional control uses the compact pad geometry and tighter caption spacing so the last-command row remains inside the available body height.
- Decorative map roads were redrawn with endpoints inside the viewBox instead of relying on clipping beyond the map bounds.
- Clock line-height was normalized to prevent a false text scroll-height overflow.

## QA performed

- Read `docs/profile.md`, `docs/agents.md`, and `docs/todo.md` completely before the initial edit.
- Inspected the original `ios` source paths and original iOS full-screenshot category sheets before redesigning.
- Verified dispatch coverage for all 35 `WidgetVisual` values.
- Inspected the user's generated post-patch `metrics`, `controls`, `charts`, `location`, `tables`, and `display` full QA sheets at supported sizes.
- Inspected the follow-up per-widget captures and `report.json` diagnostics from the second QA archive, including every category and the reported outside/scroll-overflow suspects.
- Performed a TypeScript/JSX transpile syntax check on the v3 `IOSVisuals.tsx` and `IOSFrame.tsx`; both pass.
- Full project `tsc` remains blocked in the supplied sandbox by the incomplete `node_modules` tree (missing React/Babel/etc. type packages), as in the first pass.
- Playwright screenshot generation also remains unavailable in this sandbox because the supplied dependency tree is incomplete.

A fresh screenshot pass should be run after applying v3. Both requested screenshot commands were attempted again in the sandbox, but the supplied dependency tree still lacks `node_modules/playwright/index.js`, so post-v3 rendering cannot be generated locally here.

## Files in this patch

- `src/widgets/themes/IOSVisuals.tsx`
- `src/widgets/themes/IOSFrame.tsx`
- `THEME_NOTES.md`
- `INTEGRATION.md`

## Fourth QA revision — bilingual English / Persian bundle

The user supplied a single `ios-qa.zip` generated by the automated QA runner. Both English (`en`) and Persian (`fa`) outputs were inspected across all six categories, including full sheets, individual widget captures, and both `report.json` files.

Observed QA status before this revision:

- English: widget QA PASS, full-page QA PASS, 0 console errors, 0 render errors.
- Persian: widget QA PASS, full-page QA PASS, 0 console errors, 0 render errors.
- RTL card/header/content alignment is behaving correctly; telemetry, coordinates, charts, SCADA labels, and other technical numeric content intentionally remain LTR where appropriate.

The remaining findings were mostly detector-visible geometry rather than obvious visual breakage. This v4 cleanup therefore targets containment and compact-size composition only:

- Numeric `ValueText` and clock line boxes now have enough line-height for the rendered glyph metrics, reducing false scroll-height overflow diagnostics without shrinking the text.
- Battery terminal geometry is contained inside its own wrapper instead of extending outside the battery element's scroll bounds.
- MUI switch hidden inputs are explicitly constrained to the visible switch bounds and unnecessary switch scaling was removed.
- MUI slider thumb hit-area pseudo-elements are constrained to the thumb bounds, preventing invisible hit-target geometry from increasing card/body scroll dimensions.
- Thermostat and color-control sliders use the same containment rules as the main slider/fan controls.
- `3x1` time-series, area, bar, and histogram widgets now use a dedicated slim-wide composition with reduced chart minimum height so their content fits the short body without clipping.
- `3x2` table widgets now cap their contextual trend panel to the actually available body height; `3x3` remains free to use the larger flexible context area.
- Sparkline SVGs now explicitly cap their rendered height to their containing flex/grid cell to prevent intrinsic SVG sizing from expanding table context rows.

The v4 `IOSVisuals.tsx` and unchanged `IOSFrame.tsx` pass a TypeScript/JSX transpile syntax check. A fresh Playwright render could not be generated in this sandbox because the supplied project dependency tree still lacks the runnable Playwright/Vite package files; the user's QA runner should be used for the final confirmation pass.
