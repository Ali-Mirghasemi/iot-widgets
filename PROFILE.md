# IoT Widgets — Active Library Profile

**Updated:** 2026-10-18
**Repository:** `Ali-Mirghasemi/iot-widgets`
**Consumer:** Nira Platform, plus future independent React/TypeScript hosts.

Reusable, Git-versioned React/MUI widget library. Its core package name is `iot-widget-studio-react` (verify `package.json` for the current version, currently 0.4.0 in the reviewed source). The library offers semantic widget definitions, purpose-built visuals, theme-specific renderers, adaptable sizes, Persian/English metadata, and dashboard/grid components.

## Separation of responsibilities

- **Library:** `IoTWidget`, `DashboardPanel`, `DashboardGrid`, `DeviceContainer`, registry/catalog, visual styles/tokens, composable frames, mock/test showcase, keyboard/pointer/touch UX.
- **Nira Platform:** API integration, backend schema, permissions, device bindings, command execution/confirmation, per-user dashboard persistence, customer-specific application experiences, navigation, build-profile/OCI image rules.
- **Other customers:** reuse core library without importing Nira-specific code. New generic widgets should be added here; private application shell themes/pages stay in the consuming host unless an explicitly reusable widget style is proposed.

## Current direction

1. Improve visual quality and efficient use of widget space: battery, signal, electrical measurements, alarms, maps and controls should not be identical cards with different labels.
2. Preserve independently selected visual themes per widget, inherited from the host dashboard unless overridden; keep widget semantics and bindings stable when themes change.
3. Add excellent **grid drag/reorder** behavior with animated position transitions, handle-only initiation, keyboard and touch accessibility, cancel/rollback, clear drop target, responsive layout and reduced-motion support.
4. Expose explicit production-safe data/status states; never use mock data as fallback for absent real telemetry in production.
5. Design **side-effect-free semantic interaction intents**, leaving Nira/host APIs, audit and authorization responsible for actual commands.
6. Enable selective exports / *tree-shakeable* theme and widget registration for customers who need different compiled asset sets; test on generated production bundles, not just source imports.

## Current integration evidence and limitations

- The Nira frontend successfully installed and compiled against `iot-widget-studio-react` in a user-reported October 2026 test. This is not evidence that dashboard visual parity, every theme, browser behavior or commands are complete.
- `iot-widgets` remains independently versioned. Consumers should update via a reviewed Git commit/tag and lockfile, then rebuild and test before deployment.
- The project's gallery/showcase screenshots are aesthetic references. Production layout and host permissions must be independently tested.

See `README.md` and `docs/` for public APIs and specifics; `TODO.md` for incomplete tasks.

## Increment INC-001 — theme-neutral renderer composition

`createWidgetVisualRenderer()` in `src/widgets/renderers/WidgetVisualCore.tsx` accepts a
static, partial map of theme-specific React components and refuses an unavailable
theme ID. `package.json` exposes `./visual-core` and per-theme `./renderers/*`
subpaths, while the root library entry preserves the all-themes API.
**Renderer-only:** selective *complete widget* and build artifact guarantees are
not implemented; see `docs/SELECTIVE_RENDERERS.md` and `TODO.md`.

## Increment INC-003 — Scoped IoTWidget

`iot-widget-studio-react/scoped` provides `createScopedIoTWidget()` and its own
appearance provider. The host passes the compiled, allowed widget definitions,
theme tokens, renderers and frames. It rejects unregistered IDs and defaults to
no demo data fallback. Root library API remains backwards compatible and still
imports all themes. See `docs/SELECTIVE_RENDERERS.md` for usage and limitations.
