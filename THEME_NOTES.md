# HUD / Cyber (`gaming`) theme notes — QA screenshot pass 4

## Scope

This patch changes only the dedicated `gaming` theme implementation. Stable theme ID and widget IDs are unchanged. Material 3 and every other theme remain untouched.

Theme-owned implementation:

- `src/widgets/themes/GamingVisuals.tsx`

Both named exports are present:

```tsx
export function GamingVisualRenderer(...) { ... }
export function GamingFrame(...) { ... }
```

## QA bundle reviewed

Reviewed the user-generated `gaming-qa.zip` bundle in both locales:

- English (`en`)
- Persian / RTL (`fa`)

The bundle reports:

- widget screenshots: PASS
- full screenshots: PASS
- console/page errors: 0
- render errors: 0

All six categories were visually inspected:

- metrics
- controls
- charts
- location
- tables
- display

The individual widget sheets were also checked, especially variants flagged by the automated overflow heuristic.

## Pass-4 fixes

### 1. Generic metric `2x1` clipping

The real screenshots exposed a repeated problem in the generic metric renderer:

- the `2x1` history composition was slightly taller than the available frame body;
- bottom history-axis labels (`00 / 12 / NOW`) were clipped;
- the QA diagnostic therefore marked the same `2x1` pattern as outside/body-overflow for multiple metric widgets.

Affected widgets included temperature, humidity, voltage, current, power, energy, light, CO₂, PM2.5, flow, vibration, noise, distance, weight, rain, and other widgets sharing the generic metric visual.

The `2x1` composition now has its own compact-wide layout:

- smaller primary readout;
- tighter status/delta row;
- explicitly constrained chart region;
- dedicated 8 px history-axis row;
- internal overflow containment rather than relying on clipping at the frame boundary.

`1x1` and `2x2` metric compositions are unchanged.

### 2. Directional Control `2x1` clipping

The real `2x1` Directional Control screenshot showed the bottom D-pad button extending into the frame boundary and being clipped.

The `2x1` composition is now structurally different:

- 108 px D-pad on the left;
- motion speed, last command, and mode on the right;
- no bottom control extends beyond the body;
- all mock directional buttons remain interactive.

`1x1` remains the glanceable D-pad and `2x2` remains the richer PTZ/motion-vector view.

## About the QA overflow counts

The automated QA report still identifies many `scrollOverflow` suspects even where the screenshot is visually correct. Most of these come from:

- fractional CSS/MUI line-height rounding by 1–6 px;
- SVG internals intentionally using visible overflow;
- intentionally oversized radar/crosshair decoration that is clipped by its own parent;
- MUI range/input internals.

These are different from real widget/card overflow. The QA report shows `cardScrollOverflow: false` throughout the reviewed gaming captures.

The two visible issues that corresponded to actual outside/clipped content were the generic metric `2x1` layout and Directional Control `2x1`; both are addressed in this pass.

## RTL / Persian

The Persian screenshots remain compatible:

- titles and prose use RTL where appropriate;
- coordinates, telemetry values, units, axes, gauges, and technical labels remain LTR where this improves readability;
- the pass-4 layout changes use the same locale-safe behavior.

## Validation

- TypeScript/TSX transpile syntax check for `GamingVisuals.tsx`: **0 diagnostics**.
- No shared files are included in this patch.
- No Material 3 or other theme file was modified.

After applying the patch, rerun:

```powershell
$env:WIDGET_QA_THEME="gaming"
npm run screenshots:full

$env:WIDGET_QA_THEME="gaming"
npm run screenshots
```

For the next screenshot review, the important regression checks are:

- generic metric `2x1`: bottom history labels fully visible;
- Directional Control `2x1`: complete D-pad visible;
- English and Persian remain aligned identically.

## v5 QA follow-up
- Reviewed `gaming-qa(1).zip` in EN and FA.
- Confirmed the v4 generic metric `2x1` history-label fix is visually correct.
- Fixed the remaining Directional Control `2x1` vertical overflow: MUI button intrinsic sizing was expanding the 3x3 D-pad beyond its square grid. Grid tracks now use `minmax(0,1fr)` and D-pad buttons explicitly allow zero minimum height with no padding, so the pad stays inside the available 108x108 footprint.
- No other visible clipping/regression found in the supplied EN/FA full sheets. Existing QA suspect counts are primarily fractional typography/SVG/slider internals and deliberate HUD decoration; card-level overflow remains zero.
