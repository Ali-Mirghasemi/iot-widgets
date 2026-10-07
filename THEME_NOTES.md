# Industrial Flat — Theme Notes

- Stable theme ID: `flat`
- Working/display name: **Industrial Flat**
- Scope: theme-local visual renderer only. Material 3 and every other theme are untouched.

## Design direction

Industrial Flat is intentionally closer to a compact operator/HMI surface than a consumer dashboard. The renderer uses hard rectangular zones, thin borders, neutral process surfaces, dense numeric hierarchy, square segmented indicators, setpoint/deviation scales, orthogonal schematics, and restrained rounding. Saturated color is reserved for state and exception meaning rather than decoration.

References reviewed include ISA-101 / high-performance HMI guidance, current Ignition Perspective material, and Siemens HMI Template Suite patterns. The useful principles are responsive composition, neutral normal-state surfaces, report-by-exception color, compact trend/context beside live values, explicit setpoint/feedback treatment, and semantic process graphics instead of generic KPI cards.

## Screenshot-driven QA pass 2

The supplied `full-screenshots(9).zip` was reviewed category by category: metrics, controls, charts, location, tables, and display.

The first Industrial Flat pass was already structurally clean: no obvious content escaped widget bounds, maps/tables/SCADA scaled well, compact metrics were readable, charts maintained their plotting area, and controls had clear active/inactive states.

The second pass focuses on the remaining large-card dead-space issues visible in the real screenshots:

- **Battery 2x2** now uses a dedicated equipment panel with a large pack diagram, 10-segment charge strip, state flag, and four operational readouts.
- **Cellular Signal 2x2** now uses the full card with a large signal instrument field, quality strip, serving-cell context, and RSRQ/SINR/cell/RAT metadata.
- **Fire / Smoke / Water Leak 2x2** now use a two-column alarm instrument layout with icon field, full alarm message, supervision/status strip, and four bottom readouts instead of a tall empty middle region.
- **Coordinates 2x2** now fills the lower section with GNSS fix quality, satellite segments, and motion/navigation metadata.
- **Compass 2x2** now uses a larger square instrument plate, bearing/status context, sector indication, and accuracy metadata.
- **Directional Control 2x2** now uses a larger control pad beside explicit command feedback, jog state, pulse timing, and interlock information.
- **Clock 2x2** now adds minute progress, UTC/sync instrument fields, stratum, and drift instead of leaving the center mostly empty.
- **Text / Markdown 2x2** now adds a small operations-status matrix for environment, cooling, and access plus the original sensor/update/alarm summary.

Layouts that already looked strong in the supplied screenshots were intentionally left alone: metric/gauge trends, tank/soil level compositions, maps/routes, chart families, fleet tables, camera view, iframe mock, and SCADA process schematic.

## Interactive behavior

Mock controls remain local and reusable:

- command button shows temporary sent feedback;
- switches/lock/siren change state;
- sliders and fan speed update values/history;
- manual set value can be edited and applied;
- thermostat changes target;
- RGB/light color changes swatch and brightness;
- directional control highlights and reports the last command.

## Locale / portability

Persian remains supported for user-facing labels while numeric, chart, coordinate, process, and control instrumentation stays LTR where that improves readability. The renderer receives all required state through its props and local mock state; it does not import showcase/App state.

## Validation

- Read `docs/profile.md`, `docs/agents.md`, and `docs/todo.md` completely before this QA edit.
- Reviewed the user-supplied post-patch full screenshots for all six categories.
- Ran an isolated strict TypeScript check for the updated `FlatVisuals.tsx`; it passes.
- No shared file was edited for this patch.

## Remaining QA

Run a fresh `flat` screenshot pass after replacing `FlatVisuals.tsx` so the second-pass 2x2 compositions can be checked in the project's actual browser/font environment. This sandbox still cannot repair the incomplete local Playwright/npm installation, so the updated screenshots cannot be regenerated here.
