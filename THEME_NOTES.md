# HUD / Cyber (`gaming`) theme notes — screenshot review pass 2

## Scope

This patch changes only the `gaming` theme implementation. Stable theme ID and widget IDs are unchanged. Material 3 and all other themes are untouched.

Theme-owned implementation:

- `src/widgets/themes/GamingVisuals.tsx`

The file exports both `GamingVisualRenderer` and `GamingFrame`. Shared dispatcher/frame wiring remains intentionally outside the patch and is documented in `INTEGRATION.md` for parallel-safe merging.

## Design direction

The theme is an operational telemetry/HUD interface rather than a generic dark/neon card set:

- angular instrument-frame geometry;
- restrained cyan for live telemetry, green for healthy/confirmed state, amber for caution, red for critical state;
- machine IDs, state codes, segmented rails, scan/grid details and tabular numeric readouts;
- size-specific composition rather than scale-only resizing;
- semantic visuals for battery, RF signal, tank level, alarm loops, GPS, heading, state history and SCADA.

Reference direction included NASA Open MCT telemetry/mission-control patterns and Grafana state timeline/status-history conventions. The implementation is original and does not copy a proprietary interface pixel-for-pixel.

## Pass-2 changes from the uploaded real screenshots

The uploaded `full-screenshots(10).zip` was inspected across metrics, controls, charts, location, tables and display. It confirmed the base theme was clean, but exposed several large-size cards that still behaved too much like centered `1x1` widgets.

This pass specifically improves those cases:

- **Device Status 2x2:** larger semantic state target, readiness rail, uptime/fault/mode context and recent state trace.
- **Gauge 2x2:** larger instrument face plus a full-height operational side column and history trace.
- **Donut 2x2:** larger utilization ring, capacity stats, segmented utilization rail and trend history.
- **Fire / Smoke / Leak 2x2:** larger alarm annunciator, zone/loop/test context, severity rail and event trace instead of large unused space.
- **Command Button 2x2:** command-channel header, larger execution surface, target/timeout/ack metadata and mock response bus.
- **Switch / Relay / Door Lock / Siren 2x2:** explicit energized/isolated state, larger toggle surface, coil/feedback data and output history.
- **Manual Set Value 2x2:** larger editable setpoint register, range rail, validation, previous value/deadband/source context.
- **Directional Control 2x2:** larger PTZ/motion pad plus pan/tilt/slew telemetry and mode feedback.
- **Coordinates 2x2:** dedicated WGS84 latitude/longitude readouts plus GPS lock/HDOP reticle and satellite context.
- **Compass 2x2:** larger compass face with course/drift metadata and heading rail.
- **Clock 2x2:** large HH:MM:SS display with NTP lock, timezone, offset and drift data.
- **Text / Markdown 2x2:** larger readable summary plus source/age/priority context.
- **iFrame / External Content 2x2:** actual sandbox/container composition with connection/origin/latency/TLS state rather than a tiny centered label.

## Responsive behavior

- `1x1`: glanceable primary state/value.
- `2x1` / `3x1`: secondary state, trend, rail or compact metadata.
- `1x2`: intentional vertical composition where the registry supports it.
- `2x2+`: history, state traces, metadata, process context, richer control feedback or larger semantic geometry.

Large cards are not intended to be scaled-up small cards; they now expose additional operational information.

## Mock interactions

Local mock interaction remains theme-local and reusable:

- command button: Ready → Queued → Acknowledged → Ready;
- boolean/device state: local toggle;
- relay/lock/siren: local ON/OFF toggle;
- slider/fan level: editable target;
- manual setpoint: editable local field;
- thermostat: local setpoint slider;
- RGB control: preview/on-off, hue presets/slider and large-size brightness;
- directional control: selected command plus motion-vector feedback.

## English / Persian

Persian titles/help remain RTL while machine identifiers, numeric telemetry, coordinates, units, charts, timestamps and SCADA notation stay LTR where technically clearer. The new large-size layouts keep this same separation.

## QA status

Completed in this pass:

- inspected the user-generated **real full-page gaming screenshots** for all six categories;
- specifically reviewed all visible supported size variants and identified large-card dead-space issues;
- TypeScript/TSX syntax transpile check on the updated `GamingVisuals.tsx`: **0 parse diagnostics**;
- no shared source files are included in this patch.

The requested local screenshot commands were attempted again, but this sandbox copy has empty/stripped `node_modules` package directories and no `playwright/index.js`, so both runners stop before rendering:

```powershell
$env:WIDGET_QA_THEME="gaming"
npm run screenshots:full

$env:WIDGET_QA_THEME="gaming"
npm run screenshots
```

After applying this v2 patch, please rerun those commands in the normal project environment. The uploaded screenshot set was the basis for this second-pass correction, but the newly changed large compositions still need one final real MUI/Playwright screenshot review after merge.
