# Industrial Flat — Theme Notes

- Stable theme ID: `flat`
- Working/display name: **Industrial Flat**
- Scope: theme-local visual renderer only. Material 3 and every other theme are untouched.

## Design direction

Industrial Flat is intentionally closer to a compact operator/HMI surface than a consumer dashboard. The renderer uses hard rectangular zones, thin borders, neutral process surfaces, dense numeric hierarchy, square segmented indicators, setpoint/deviation scales, orthogonal schematics, and restrained rounding. Saturated color is reserved for state and exception meaning rather than decoration.

Current references reviewed before implementation included ISA-101 / high-performance HMI guidance and current industrial/SCADA dashboard examples such as Siemens WinCC OA-style monitoring surfaces. The useful patterns were: grayscale/neutral normal-state UI, report-by-exception color, compact trends beside live values, explicit setpoint/feedback context, dense status tables, and process-specific schematics instead of generic KPI cards.

## What changed

### Metrics

- Metric values now change composition by size: glanceable value/state at 1x1, scale/trend context at 2x1, and history + secondary readouts at 2x2+.
- Gauges use industrial segmented bargraphs rather than Material-style radial gauges.
- Battery and signal are equipment/status displays with operational metadata.
- Tank is a semantic vessel/level visualization and deliberately uses vertical space for 1x2.
- Boolean/state widgets read like digital I/O feedback instead of generic badges.
- Fire/alarm widgets use bounded alarm fields and severity/state treatment.

### Controls

- Command buttons provide local sent feedback in mock mode.
- Switches use explicit two-position operator controls with local feedback state.
- Sliders expose setpoint, feedback and (large sizes) output history.
- Numeric inputs are editable and expose apply state, range and current value.
- Thermostat +/- controls change target locally; large layouts add deviation and temperature history.
- Color controls change swatch/brightness locally.
- Direction controls respond to directional/stop commands and show the last command.

### Charts

- Line/area charts use industrial grid plots with compact summary bands.
- Bar/histogram views use hard rectangular marks rather than rounded decorative bars.
- Donut/capacity content is rendered as a block-capacity display to keep this theme structurally distinct.
- Heatmap and timeline views use square status cells/blocks.

### Location

- Map/route visuals are schematic/orthogonal rather than consumer-map styled.
- Coordinates expose fix/accuracy metadata in larger sizes.
- Compass uses a square instrument plate and axis-based pointer.

### Tables

- Tables, measurement lists, alarms, events and logs use compact industrial headers, alternating rows, semantic state color and live status footers.
- Large fleet tables use spare vertical space for a 24-hour fleet-health trend instead of leaving a large blank region.

### Display

- Clock uses a monospaced operations readout with sync/drift metadata at large sizes.
- Text/status widgets add sensor/update/alarm metadata.
- Image is a semantic CCTV/live-monitor surface.
- Iframe is shown as an embedded operations panel rather than an empty placeholder.
- SCADA is a process schematic with tank, pump, valve, flow, pressure and state readouts.

## Responsiveness and locale

The renderer derives layout from the supported `WidgetSize` and changes composition when area/aspect ratio changes. User-facing Persian text uses RTL where useful, while numeric, chart, process and technical instrument content intentionally remains LTR.

## QA performed

- Read `docs/profile.md`, `docs/agents.md`, and `docs/todo.md` completely before editing.
- Inspected the existing `flat` screenshots for metrics, controls, charts, location, tables and display.
- Verified renderer coverage against the visual IDs used by the registry.
- Ran an isolated strict TypeScript check for `FlatVisuals.tsx`; it passes.
- Temporarily wired the renderer into the `flat` dispatcher only for QA, then restored the shared files before packaging.
- Attempted both requested screenshot scripts with `WIDGET_QA_THEME=flat` and Chromium configured. Both stop before capture because the supplied project has an incomplete `node_modules/playwright` installation (`playwright/index.js` is missing). Outbound DNS is disabled in the execution sandbox, so dependencies could not be repaired with `npm ci`.

Because of that environment limitation, **new post-redesign screenshots could not be generated or visually inspected here**. The pre-change flat screenshot set was inspected and preserved. Run the commands in `INTEGRATION.md` after installing the project dependencies to complete pixel/overflow QA.

## Known follow-up

The implementation is type-checked and size-aware, but the coordinator should still run the project's Playwright screenshot/overflow diagnostics after applying the small shared integration. Any pixel-level issue that only appears with the project's actual browser/font environment should be fixed in `FlatVisuals.tsx`, not by changing Material 3 or another theme.
