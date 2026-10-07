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

## Screenshot-review pass

A second pass was made against the user-generated `full-screenshots` set for Minimal Mono. The review found and corrected several concrete issues:

- MUI numeric sizing ambiguity on hairlines/rulers: intended 1 px dimensions now use explicit `"1px"` / `"2px"` strings so they do not expand into oversized gray bars.
- signal quality now maps dBm into a useful quality range instead of treating a negative dBm value as a direct percentage; e.g. `-72 dBm` no longer collapses to `0%`.
- large metric/chart/alarm/timeline/location compositions use more of the available canvas and expose extra operational context rather than simply enlarging the compact layout.
- large tables now distribute rows through the available height and add a compact dataset/status footer instead of leaving most of a 2x2 panel empty.
- the large clock now adds seconds, NTP/sync/drift context, and stronger scale hierarchy.
- the large text/markdown panel now uses a deliberate note layout with review/source/status metadata instead of an empty lower half.

## QA status

The later `minimal-qa.zip` bundle was reviewed in both locales. Its manifest reports:

- English widget QA: PASS
- English full-page QA: PASS
- Persian widget QA: PASS
- Persian full-page QA: PASS
- console/page errors: 0
- renderer errors: 0

The raw overflow detector still reported many suspects even when the screenshots were visually correct. Inspection of the diagnostic rectangles showed that most were browser scroll-metric artifacts caused by sub-1 numeric line heights or inline SVG baselines rather than card/body overflow. There were also a few real/structural cases: the 2x1 directional control's lower arrow touched the body boundary, and decorative details such as the battery terminal, compass arrow tip, and RGB marker intentionally extended beyond their own element boxes.

This v3 follow-up addresses those causes directly:

- numeric/state typography now keeps its glyph metrics inside the line box;
- reusable sparkline/map/camera/SCADA SVGs are block-level so they do not add the HTML inline-SVG baseline;
- bordered 100%-height visuals use border-box sizing;
- battery terminal stays inside the battery visual's declared bounds and the 2x2 battery uses more available width;
- the compass needle is an in-bounds SVG rather than nested rotated boxes;
- the RGB position marker remains inside its preview strip;
- the non-large directional pad is slightly more compact so the 2x1 down arrow/footer cannot clip.

A strict isolated TypeScript check passes for the v3 renderer using temporary React/MUI type stubs. Local screenshot re-generation in this sandbox is still blocked because `playwright` is not installed in the project copy.

Run the theme-scoped screenshot commands after applying this patch in the normal checkout with dependencies installed.

## v4 QA follow-up (`minimal-qa(1).zip`)

The next user-supplied QA bundle was inspected in detail.

Two genuine issues remained in the Minimal renderer and are fixed in v4:

- **Alarm compact/wide regression:** the non-large Fire/Smoke/Leak headline accidentally used `lineHeight: 12` instead of `1.12`. Because numeric MUI line-height values are unitless multipliers, the 28–37 px headline became roughly 336–444 px tall and caused real body overflow in all six `1x1` / `2x1` alarm variants. v4 restores `1.12`.
- **Directional Control `2x1`:** the shallow card still produced real body scroll overflow even after the v3 size reduction. v4 gives `2x1` its own composition: a smaller semantic cross-pad at left and compact last-command metadata at right, with no bottom footer competing for vertical space.

The remaining reported suspects in charts, location, display, and ordinary numeric controls were inspected individually. They do **not** produce card/body scroll overflow and no element is outside its widget. They are font glyph/line-box scroll-metric differences (typically 3–6 px) and are intentionally left unchanged rather than weakening the visual hierarchy solely to satisfy the detector.

The bundle itself also shows evidence of parallel QA output collision: the English `npm-screenshots.log` records a complete Minimal run with the same Minimal counts, but `en/widget-screenshots/report.json` contains an iOS report; the manifest marks Persian full-page QA failed while its logs include reloads for Gaming error artifacts. This does not affect the Minimal fixes above, but future verification should run each theme/locale into an isolated or freshly cleared output directory so parallel theme chats cannot overwrite one another's report/full-page files.

The v4 renderer passes an isolated strict TypeScript check using temporary React/MUI declarations.
