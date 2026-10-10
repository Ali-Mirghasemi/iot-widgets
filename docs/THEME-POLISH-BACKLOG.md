# IoT Widgets — theme polish backlog

**Evidence:** the eight newest `*-qa.zip` archives uploaded on 2026-10-10, each containing six valid English and six valid Persian JPEG sheets (1920px width), a report for each locale, and no reported render/console errors.

Do not interpret `suspects` as confirmed visual failures. The DOM scan flags text-line metrics, SVG defs, overflow used intentionally by MUI switches, and genuine clipping indiscriminately. Inspect the rendered screenshots and reproduce visually before editing.

## Ownership and priority

| Theme-chat ownership | First targets from reports | Keep in mind |
| --- | --- | --- |
| `studio + horizon` together | Small pressure/air-quality/gas/speed/rpm/wind/gauge variants, switch/door-lock/siren overflow | Both themes share `StudioVisualRenderer`; no two parallel chats should edit it |
| `material` | Compact gauge variants, metric typography, map/route gallery comparisons | Preserve semantic palette colors |
| `flat` | Compact gauges, metric labels, table cell density | Maintain deliberate flat/rectangular styling |
| `minimal` | Compact gauges and clock overflow | Avoid adding decorative clutter |
| `gaming` | Compact gauges, slider/color/fan-control, location overflow | Maintain readability under HUD decoration |
| `glass` | Compact gauges, time-series/area panels, map/route panels | Check blur/translucency contrast and layering |
| `ios` | Compact gauges, sliders, color picker, tank level | Control hit targets >=44px where practical |

## QA required after each independent theme patch

1. `npm run test:qa` and `npm run test:responsive`.
2. `./scripts/widget-qa.sh <THEME> --locale both --profile review --jobs 2` (or the CMD/PowerShell equivalent).
3. For genuine failures, repeat in detailed mode and inspect all supported sizes.
4. `npm run qa:responsive -- --boards catalog --themes <THEME> --locale both --widths 375,768,1280`.
5. Check gallery graphics and interactive Nexus Catalog. Verify Persian labels, direction, no horizontal scroll, readability and tapping.
6. Report any shared renderer or `WidgetFrame` problems as a separate issue; **do not** modify shared files in theme-specific patches.

## Parallel theme session prompt

> You own the `{THEME}` visual renderer(s) in IoT Widgets. Use the same committed baseline as every other theme session and the supplied English/Persian QA ZIP(s). Audit every registered widget and supported size in this theme, plus the `Nexus Catalog` at 375px, 768px and 1280px. Fix confirmed overflow, clipped gauges, unreadable compact states, overlap and underused large cards while preserving the theme's visual identity, telemetry API and actions. Do not modify shared library code, registry, QA scripts, package.json or other theme renderer files. Studio and Horizon are owned by the SAME session. Include real screenshot comparisons (before/after), unit/build outcomes, and an incremental `iot-widgets-{THEME}-001.patch` based on the agreed shared baseline. If browser QA cannot run, state that clearly; do not claim visuals are verified.

## Integration strategy

- Begin all chats from the same committed base, or independent `git worktree` clones.
- Apply/merge one theme patch at a time to the integration branch, running tests between patches.
- Never allow two chats to modify `WidgetFrame`, `adaptive.ts`, or other shared components simultaneously; schedule a shared-core pass separately.
- When the theme roster changes, add the theme ID and renderer/token mapping first, and require automated theme discovery tests to pass. Do not add themes merely to duplicate Studio/Horizon colors; new themes should have a distinct information design.
