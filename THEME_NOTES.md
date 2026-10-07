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

## Screenshot QA follow-up

A complete post-integration Glass screenshot set (`full-screenshots(7).zip`) was reviewed across metrics, controls, charts, location, tables, and display.

The follow-up pass fixed the issues visible in that capture:

- removed the broad overexposed white glare band that was washing out nearly every card;
- darkened and localized the frosted surface treatment so telemetry remains the visual priority;
- increased secondary/axis contrast without turning the theme into a bright card UI;
- enlarged the `2x2` directional control instead of leaving a small `1x1` control island in the center;
- expanded large device-status cards with heartbeat, availability, RTT, and uptime context;
- expanded fire/smoke/leak large layouts with a larger semantic alarm badge plus loop/channel/event/ACK information;
- made large table widgets consume their available height and added a compact operational summary footer;
- strengthened heatmap cell contrast, which was too faint under the previous surface treatment.

The two theme files pass a TypeScript/TSX check with local dependency stubs after these changes.

This sandbox still cannot execute the project screenshot scripts because the extracted project does not contain the required npm dependencies and registry access is unavailable. Re-run the commands below in the normal project environment to verify the corrected visual treatment in-browser.

## Remaining review targets

1. Re-run the Glass-only English screenshot QA after replacing these files and confirm the glare band is gone in Chromium.
2. Run a Persian pass (`WIDGET_QA_LOCALE=fa`) after English QA.
3. Check the frame over a lighter/complex host-app background; the showcase uses a dark teal gradient.
4. If desired, update the shared display label from `Glass` to `Aurora Glass`; this remains optional and is intentionally not included as a shared-file edit.
