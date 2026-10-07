# IoT Widget Studio — TODO / Theme Work Board

## Status legend

- `[ ]` not started
- `[~]` in progress
- `[x]` implementation pass complete
- `[R]` waiting for screenshot/review

## A. Theme work

### Material 3 — ID `material`

- [x] separate Material visual renderer from generic renderer
- [x] reduce clipping/overlap problems
- [x] improve adaptive `1x1`, `2x1`, `1x2`, `2x2` behavior
- [x] improve gauges, battery, signal, tank, status widgets
- [x] improve controls and large-size context
- [x] improve map/coordinates/compass/SCADA composition
- [x] improve tables/display widgets
- [R] review latest screenshot set after Material patch v4
- [ ] final Material polish pass
- [ ] freeze Material theme as reference-quality baseline

### Industrial Flat — ID `flat`

- [ ] web/design research
- [ ] make visual language genuinely flat/industrial, not Material with teal colors
- [ ] establish rectangular/block hierarchy and restrained rounding
- [ ] redesign metric/gauge/tank/battery/signal visuals
- [ ] redesign controls
- [ ] redesign charts/history
- [ ] redesign location
- [ ] redesign tables/events
- [ ] redesign display/custom/SCADA
- [ ] all-size screenshot QA
- [ ] Persian/English QA
- [ ] coordinator review

### Minimal Mono — ID `minimal`

- [ ] web/design research
- [ ] typography/data-first composition
- [ ] remove unnecessary boxes/chips/decorations
- [ ] use lines/scales/spacing intentionally
- [ ] ensure minimal does not mean empty
- [ ] redesign controls without sacrificing affordance
- [ ] all-size screenshot QA
- [ ] Persian/English QA
- [ ] coordinator review

### HUD / Cyber — ID `gaming`

- [ ] web/design research focused on telemetry/HUD, not generic gaming RGB
- [ ] refine geometry, segmented meters, status codes, scan/grid details
- [ ] avoid unreadable neon overload
- [ ] redesign gauges/charts/state history to fit HUD language
- [ ] redesign controls to feel operational
- [ ] all-size screenshot QA
- [ ] Persian/English QA
- [ ] coordinator review

### Cupertino — ID `ios`

- [ ] web/design research using modern Apple widget/smart-home principles
- [ ] glanceable small-size tiles
- [ ] large sizes add context, not scaled-up content
- [ ] use restrained soft materials and system-like controls
- [ ] avoid excessive giant corner radii
- [ ] do not copy Apple proprietary UI pixel-for-pixel
- [ ] all-size screenshot QA
- [ ] Persian/English QA
- [ ] coordinator review

### Aurora Glass — ID `glass`

- [ ] web/design research for modern glass/translucent dashboard UI
- [ ] make hierarchy survive transparent surfaces
- [ ] control glow/blur so values stay readable
- [ ] distinct gauges/charts/controls, not Material under transparency
- [ ] test light/dark/complex backgrounds
- [ ] all-size screenshot QA
- [ ] Persian/English QA
- [ ] coordinator review

## B. Architecture / portability

- [ ] move every theme toward dedicated renderer modules under `src/widgets/themes/`
- [ ] consider extracting theme-specific frames to dedicated modules
- [ ] make shared dispatcher thin and stable
- [ ] keep theme IDs stable
- [ ] review public exports from `src/widgets/index.ts`
- [ ] define a clean external `WidgetRenderer` API for another dashboard project
- [ ] remove showcase-only assumptions from widget modules
- [ ] document widget instance JSON shape
- [ ] document datasource/binding interface for real telemetry
- [ ] document control callbacks / RPC abstraction
- [ ] verify no theme requires application-global state

## C. Widget coverage

- [ ] review registry for missing common IoT widgets after theme work stabilizes
- [ ] consider dedicated thermometer variant
- [ ] consider ring gauge / radial progress variants
- [ ] consider occupancy / people count
- [ ] consider door/window contact state
- [ ] consider motion/PIR
- [ ] consider GPS speed/fleet summary
- [ ] consider solar/inverter/power-flow
- [ ] consider pump/valve/motor industrial controls
- [ ] consider PTZ camera control
- [ ] consider connectivity quality (Wi-Fi/LTE/Ethernet) composite
- [ ] consider alarm acknowledgement widget
- [ ] avoid adding widgets that are only duplicates with different labels

## D. Visual QA

- [x] Playwright screenshot generation exists
- [x] custom Chrome executable path supported for restricted download environments
- [x] full-page theme/category screenshots available
- [ ] keep per-widget/all-size screenshot workflow reliable
- [ ] keep overflow diagnostics reliable
- [ ] add an easy command for Persian screenshot pass
- [ ] optionally add viewport presets for laptop/desktop/mobile QA
- [ ] eventually add image-diff regression snapshots once designs stabilize

## E. Final integration

When all themes have passed their individual review:

- [ ] merge parallel theme patches through coordinator
- [ ] resolve shared dispatcher/frame/token integration once
- [ ] run TypeScript build
- [ ] run all six themes screenshot QA
- [ ] run English + Persian smoke test
- [ ] verify right-click size selector
- [ ] verify info dialog
- [ ] verify all interactive controls
- [ ] package reusable widget library portion separately from showcase application
- [ ] update main README with final theme names and embedding instructions

