# HUD / Cyber (`gaming`) theme notes

## Scope

This patch redesigns the complete `gaming` theme only. Stable theme ID and widget IDs are unchanged. Material 3 and all other themes are untouched.

The theme implementation is isolated in:

- `src/widgets/themes/GamingVisuals.tsx`

It exports both the gaming visual renderer and the gaming frame so the theme can move to another React + MUI project without depending on showcase-only state.

## Design direction

The previous gaming theme behaved mostly like a dark recolor. This version is built as an operational telemetry/HUD system instead:

- angular instrument-frame geometry rather than rounded cards/pills;
- restrained cyan for live telemetry, green for healthy/confirmed state, amber for caution, red for critical state;
- machine-readable IDs, channel/state labels, compact status rails, segmented meters, scan/grid structure, and tabular numeric readouts;
- composition changes by widget size rather than simple scaling;
- semantic visual language for tank level, battery reserve, cellular signal, alarm loops, map/route, compass, SCADA, state history, etc.;
- richer 2x2+ cards use history, metadata, state context, or secondary measurements instead of leaving dead space.

## Size behavior

- **1x1:** primary value/state only, strongly glanceable.
- **2x1 / 3x1:** compact secondary context, segmented scale, trend, or operational metadata.
- **1x2:** deliberately vertical composition where supported, especially tank-level use.
- **2x2+ / 3x2 / 3x3:** history traces, multiple metadata fields, state lanes, process context, richer maps/tables.

Wide one-row controls/gauges use reduced circular/control geometry so nothing is cut by the shorter content region.

## Semantic widgets

Notable non-generic treatments include:

- Fire / smoke / leak alarms: dedicated alarm-loop indicator with zone/test context.
- Tank / water level: actual vessel fill geometry plus volume/inlet context.
- Battery: segmented reserve pack plus voltage/remaining runtime and discharge trace at larger sizes.
- Cellular signal: RF bars, dBm readout, RSRQ/SINR context and history.
- State timeline / status history: discrete state rails rather than a generic line chart.
- Map / route: HUD grid, path/track, location markers, lock/accuracy metadata.
- SCADA: process-loop mimic with tank, pump, valve, flow and pressure/temperature context.

## Mock interactions

Controls keep local mock state and visibly respond without showcase-only state coupling:

- command button: Ready → Queued → Acknowledged → Ready;
- relay/switch and boolean state: toggle locally;
- slider/fan level: updates target value and segmented output;
- manual setpoint: editable local value;
- thermostat: local setpoint slider;
- RGB control: on/off preview, hue presets, hue slider, brightness slider on larger cards;
- directional control: last-command highlight.

## English / Persian

- Widget titles and appropriate UI labels support Persian.
- Frame titles use RTL in Persian.
- Numeric telemetry, units, coordinates, machine IDs, chart axes, and SCADA notation remain LTR where technically appropriate.
- Persian QA was visually checked with representative metrics and table widgets.

## Reference direction

The redesign used current telemetry/operations patterns rather than generic RGB gaming-card references, especially:

- NASA Open MCT — telemetry hierarchy and operational information density: https://github.com/nasa/openmct
- Grafana State timeline — discrete state periods: https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/state-timeline/
- Grafana Status history — multi-series state inspection: https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/status-history/

The implementation is original and does not copy any proprietary UI pixel-for-pixel.

## QA performed

The requested project commands were attempted with `WIDGET_QA_THEME=gaming`:

- `npm run screenshots:full`
- `npm run screenshots`

Both stop before rendering because the uploaded project archive does not contain installed Node packages and `playwright` is unavailable in `node_modules`. The sandbox package registry was also unreachable, so the project dependency set could not be restored here.

Additional checks completed:

- TypeScript JSX syntax transpile: **0 diagnostics**.
- All **35 registered visual types** are explicitly handled by `GamingVisualRenderer`.
- Offline visual smoke sheets were rendered for all six categories at the project's deterministic QA base dimensions (280×228, including all supported size shapes) and inspected manually.
- Representative Persian sheets were rendered and inspected.
- A wide-row pass reduced circular/control geometry where the short row could otherwise clip.

Exact MUI/Playwright screenshot verification should still be rerun after applying the small integration described in `INTEGRATION.md` on a machine with dependencies installed.
