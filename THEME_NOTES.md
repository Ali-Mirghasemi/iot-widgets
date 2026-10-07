# Industrial Flat — Theme Notes

- Stable theme ID: `flat`
- Working/display name: **Industrial Flat**
- Scope: theme-local visual renderer only. Material 3 and every other theme are untouched.

## Design direction

Industrial Flat is intentionally closer to a compact operator/HMI surface than a consumer dashboard. The renderer uses hard rectangular zones, thin borders, neutral process surfaces, dense numeric hierarchy, square segmented indicators, setpoint/deviation scales, orthogonal schematics, and restrained rounding. Saturated color is reserved for state and exception meaning rather than decoration.

References reviewed for the original redesign include ISA-101 / high-performance HMI guidance, current Ignition Perspective material, and Siemens HMI Template Suite patterns. The useful principles are responsive composition, neutral normal-state surfaces, report-by-exception color, compact trend/context beside live values, explicit setpoint/feedback treatment, and semantic process graphics instead of generic KPI cards.

## Screenshot-driven QA pass 3

Reviewed both new user-supplied QA archives:

- `full-screenshots(3).rar`: all 6 Industrial Flat category sheets.
- `widget-screenshots(4).rar`: 63 individual widget captures across metrics, controls, charts, location, tables, and display, plus the 6 category overview captures.

The supplied renders show that the v2 layouts are broadly stable: no obvious content escapes widget bounds, large Battery/Signal/Coordinates/Compass/Clock/Text compositions now use their available space well, controls remain legible, maps/routes and tables scale cleanly, and Camera/SCADA/iframe display widgets do not need another structural rewrite.

This pass therefore makes only three targeted corrections that are clearly justified by the screenshots:

- **Donut / Pie** is now an actual industrial ring instrument instead of a rectangular fill bar. It uses a hard-edged circular arc, 12 outer tick marks, a centered percentage, responsive metadata, and a 10-segment capacity strip on 2x2+ cards. This fixes the semantic mismatch visible in every donut size.
- **Heatmap** now has substantially stronger low/mid/high cell separation and tighter gaps at small/wide sizes. The prior pale palette made the matrix appear almost blank in the real screenshots.
- **Fire / Smoke / Water Leak 2x2** replaces the small bottom-only supervision strip with a framed **15-minute alarm trace** that deliberately occupies the previously empty center region. Active alarms show a clear event rise while normal sensors remain quiet/steady.

No change was made to Directional Control in this pass: the individual capture shows the v2 pad, command feedback, pulse timing, and interlock block are already balanced enough, so enlarging it further would add churn without solving a real problem.

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

- Reviewed the new full-category and per-widget screenshots before editing.
- Ran the isolated strict TypeScript check for the v3 `FlatVisuals.tsx`; it passes.
- The patch changes only the dedicated Industrial Flat renderer plus documentation.
- No shared file, Material 3 file, or other theme file is included in this patch.

## Remaining QA

Run one fresh `flat` screenshot pass after replacing `FlatVisuals.tsx` to visually verify the three v3 changes in the project's actual browser/font environment. There are no known clipping/overflow issues in the user-supplied v2 screenshots; the remaining verification is specifically for the new donut ring, stronger heatmap cells, and alarm trace composition.
