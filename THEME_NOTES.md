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

## Screenshot QA status / blocker

Both requested commands were attempted with `WIDGET_QA_THEME=glass` and `/usr/bin/chromium`:

```powershell
$env:WIDGET_QA_THEME="glass"
npm run screenshots:full

$env:WIDGET_QA_THEME="glass"
npm run screenshots
```

They could not run in this sandbox because the uploaded ZIP does not contain an installed `playwright` package. An attempted `npm ci` could not complete because this sandbox has no DNS/network access to `registry.npmjs.org`.

The coordinator should therefore run the screenshot pass after applying `INTEGRATION.md` in the normal project environment. The new screenshots still need final visual inspection for any browser-specific overflow and Persian layout edge cases.

## Remaining review targets

1. Run full Glass-only screenshot QA after integration and inspect every generated widget sheet.
2. Run a Persian pass (`WIDGET_QA_LOCALE=fa`) after English visual QA.
3. Test the outer Glass frame over at least one lighter/complex application background as part of final integration; the showcase currently supplies the shared dark teal gradient.
4. If desired, update the shared display label from `Glass` to `Aurora Glass`; this is optional and intentionally not included as a shared-file edit.
