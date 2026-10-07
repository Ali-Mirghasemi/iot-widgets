# Industrial Flat — v4 QA Fix

Stable theme ID: `flat`

This patch keeps the Industrial Flat redesign and applies two focused fixes found from the bilingual `flat-qa.zip` validation run.

## v4 fixes

- Fixed the SCADA/setpoint marker in `ScaleBar`: MUI System interprets numeric `width: 1` as `100%`, which produced a large dark block and triggered real outside/overflow diagnostics. The marker is now explicitly `1px` wide.
  - Affects metric 2x1 layouts using the process scale.
  - Fixes the visible dark block in Soil Moisture / Water Level style tank views.
  - Fixes the same dark block in Thermostat and Manual Set Value.
- Fixed Heatmap value bucketing. Shared mock heat values are normalized `0.0–1.0`; v3 accidentally compared them with percentage thresholds `38/62/84`, making every cell appear low. Thresholds are now `.38/.62/.84`, restoring four clearly distinct load bands.

## QA evidence reviewed

The supplied QA bundle reports both locales as passing:

- English: widget PASS, full PASS
- Persian: widget PASS, full PASS
- Render errors: 0
- Console/page errors: 0

The v3 donut ring and 2x2 fire/smoke/leak alarm-trace compositions were visually verified in both English and Persian and are intentionally unchanged in v4.

The QA script's remaining generic `overflow suspects` include several internal/text/SVG measurement cases that are visually contained. The concrete MUI sizing defect responsible for the obvious dark setpoint overflow has been corrected in this patch.
