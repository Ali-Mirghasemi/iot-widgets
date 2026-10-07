# Minimal Mono — Theme Notes

Stable theme ID: `minimal`

## Design direction

This pass turns Minimal Mono into a typography/data-first instrumentation language rather than a lightly recolored Material card set.

Core rules used in the renderer:

- primary value/state gets the strongest contrast and largest type;
- context is carried by hairlines, tick marks, small labels, and tabular numerals instead of chips/pills;
- nested cards are avoided;
- large widgets disclose more history/metadata instead of scaling up the 1x1 layout;
- charts use restrained monochrome geometry and consistent baselines;
- table/event widgets use actual compact table structure instead of rounded row cards;
- battery, signal, tank, compass, alarms, maps, and SCADA use semantic visual forms;
- semantic warning/error color is used sparingly; the RGB control keeps real color because color itself is the controlled value.

## Research references used

The design pass was informed by current dashboard/data-visualization guidance, especially:

- Carbon Design System dashboard guidance: strong hierarchy, limit non-essential metrics, use white space intentionally, and keep chart layout consistent.
  https://www.carbondesignsystem.com/building-blocks/data-visualization/dashboards
- Carbon data-table guidance: compact aligned rows, clear column structure, and reduced decorative treatment.
  https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines
- Carbon axes/labels guidance: keep comparisons honest and make scales/labels provide context rather than decoration.
  https://www.carbondesignsystem.com/building-blocks/data-visualization/axes-and-labels
- Grafana dashboard guidance: design around the operator's question and surface actionable telemetry first.
  https://grafana.com/blog/getting-started-with-grafana-best-practices-to-design-your-first-dashboard/

These were used as principles only; the implementation is original and does not copy a proprietary dashboard pixel-for-pixel.

## Coverage

`MinimalVisuals.tsx` provides Minimal-specific rendering for every current visual used by the registry:

- metrics / sensors: metric, gauge, battery, signal, tank, boolean state, fire/smoke/leak alarm indicators;
- controls: button/downlink, switch/relay/lock/siren, slider/fan, manual input, thermostat, RGB, directional control;
- charts: line, area, bar, histogram, donut, heatmap, state/status timeline;
- location: map, route/track, coordinates, compass;
- tables/events: device table, measurement list, alarms, events, logs;
- display/custom: clock, text, image/camera, iframe placeholder, SCADA/mimic.

## Responsive composition

- `1x1`: core value/state with a compact semantic indicator or control.
- `2x1` / wide: split value and trend/context when useful.
- `1x2`: vertical gauge/tank composition intentionally uses height.
- `2x2+`: adds metadata, history, ranges, min/mean/max, operational context, or richer visualization.
- `3x1` chart/timeline variants prioritize horizontal history instead of enlarged labels.

## Mock interaction behavior

The Minimal renderer maintains local mock state for:

- command/downlink acknowledgement;
- switches, relay, lock, siren;
- sliders and fan speed;
- manual set value;
- thermostat +/- setpoint;
- RGB color and brightness;
- directional command;
- boolean/device state.

The renderer remains reusable: it receives only `def`, `theme`, `locale`, and `size`, and does not import `App.tsx` or showcase state.

## QA status

Source-level checks completed:

- TypeScript/JSX syntax transpile: PASS.
- Strict isolated type-check of `MinimalVisuals.tsx` with temporary module stubs: PASS.
- Existing Minimal full screenshots were inspected before the redesign for all six categories.

Screenshot generation could not be completed in this sandbox because the uploaded project does not contain `node_modules` and both screenshot scripts fail on missing `playwright`. An attempted `npm ci` could not fetch dependencies because the sandbox has no npm registry DNS access (`EAI_AGAIN`).

Run the theme-scoped screenshot commands after applying the integration change in a normal project checkout with dependencies installed.
