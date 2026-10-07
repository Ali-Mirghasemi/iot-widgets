# Project Work Board

## Completed architecture

- [x] registry-driven widget definitions
- [x] stable six-theme ID contract
- [x] dedicated renderer module for every built-in theme
- [x] thin theme renderer dispatcher
- [x] adaptive supported-size rendering
- [x] English/Persian support
- [x] per-widget/all-size screenshot QA
- [x] full-page screenshot QA
- [x] public reusable `IoTWidget` wrapper
- [x] per-instance theme selection
- [x] per-instance runtime data/metadata merge
- [x] per-instance theme token overrides
- [x] package peer dependency model
- [x] ESM library build with TypeScript declarations
- [x] Git/tarball/npm distribution documentation

## Theme status

All six themes are present as dedicated renderers in the current integrated source.

Material 3 has undergone extensive EN/FA screenshot-driven QA and is the reference baseline.

Other theme implementations should retain their own QA evidence/review status; do not infer final design approval solely from successful compilation.

## Next production-oriented work

- [ ] define a semantic control command/RPC event model above the current low-level `onInteraction` hook
- [ ] replace the internal historical `WidgetDefinition.mock` runtime bridge in a future major version
- [ ] accessibility audit: keyboard, screen reader, contrast, focus, reduced motion
- [ ] add unit tests for catalog/public helpers
- [ ] add component tests for `IoTWidget` data/theme switching
- [ ] add image-diff regression snapshots after all theme designs are frozen
- [ ] decide package license/repository metadata before public npm publishing
- [ ] consider a formal external custom-theme plugin API if third parties need seventh/eighth themes without central type edits

## Potential widget expansion

Only add a new widget when it represents genuinely new IoT behavior rather than another label/unit variant.

Candidates:

- occupancy / people count
- door/window contact
- motion/PIR
- solar/inverter/power-flow
- pump/valve/motor controls
- PTZ camera control
- composite Wi-Fi/LTE/Ethernet connectivity
- alarm acknowledgement
