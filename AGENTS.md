# IoT Widgets — Contributor / Coding Agent Instructions

**Updated:** 2026-10-18

Read **`PROFILE.md`**, **`TODO.md`**, **`CHANGES.md`**, then **`AGENTS.md`** before editing. Inspect the actual source, Git diff, package manifest and tests before claiming current behavior. This is the **independent** `iot-widgets` library repository; do not import Nira Platform domain models, APIs, tenant/permission logic or customer-only assets here.

## Product boundaries

- The library owns reusable **widget definitions/registry**, renderers, per-widget visual compositions, dashboard panels/grids, device-widget containers, theme inheritance, adaptation to card size, interaction events, accessibility, and bilingual `en`/`fa` content.
- The host application (such as Nira) owns authentication, scoped telemetry, device profiles, commands, data persistence, customer routing, authorization and audit. A visual switch may emit an intent; it must not claim success or send a device command independently.
- Never fill absent **production** values from showcase mocks, disguise an offline device as live, convert missing measurements to valid zero, or invent hardware capabilities. Sample/demo data must remain explicitly opt-in/isolated.
- Themes must be distinct **composition systems** suited to widget semantics, not just recolors. Preserve separate parameters for widget semantic ID, visual family, dashboard/app palette, size/view, and bindings.
- Provide accessible keyboard/touch/pointer layout editing, visible drag handles and destination feedback, reduced-motion behavior, RTL, screen reader labels, focus rings and scroll safety.
- Treat persisted widget IDs and theme IDs as compatibility contracts. Deprecate/alias before removal; add migration tests where necessary.
- Support **selective build-time exports/imports** for customer bundles. A generic root import that eagerly registers everything must not be used by the selective-builder contract. Test that excluded private themes are absent from output, including JS/CSS/public assets and source maps; do not promise this until implemented.
- Keep React/MUI/Emotion as compatible host-managed peer dependencies. Validate the Git install/pack path; do not silently require a consumer to execute unapproved install scripts.
- The project is Linux-first for development; verify on Chromium/Firefox and inspect mobile/desktop layout. Browser screenshots supplement but do not replace tests.

## Execution and delivery

- Keep changes focused by file/block. No broad rewrites just to fix one widget or style.
- **Deliver `.patch` files** for code changes; use a separate patch for this repository versus Nira Platform. Run `git apply --check` against an appropriate base and report the tested baseline and any limitations.
- Maintain the four root tracking files after meaningful increments: product changes in `PROFILE.md`, actionable remaining work in `TODO.md`, *actual* verification and patch history in `CHANGES.md`, revised working rules in `AGENTS.md`.
- Never claim a demo screenshot is a real device integration or that Nira's backend is integrated inside the library. Record known gaps and the next testable step.

## Local verification reference

Check scripts in the current `package.json` rather than assuming they still exist. Typical checks: `npm run build:lib`, `npm test`, `npm run test:layout`, `npm run test:adaptive`, and focused screenshot QA. Log test commands that actually ran, not anticipated results. Check RTL, responsive and per-widget appearance inheritance manually and with automated coverage.

## INC-001 selective renderer safety

`WidgetVisualCore.tsx` must not import `WidgetVisuals.tsx` or theme implementation
modules. The full registry stays in `WidgetVisuals.tsx` for backward compatibility.
A customer build using the root `IoTWidget`/`DashboardPanel` **cannot** claim theme
exclusion. Use the explicit renderer subpaths only when constructing a restricted
entry; verify its **compiled** output and keep future source changes aligned with
`docs/SELECTIVE_RENDERERS.md`. Keep this module free of backend/customer logic.


## INC-003 scoped composition guardrails

Use `iot-widget-studio-react/scoped` with static imports from selected renderer
and frame subpaths for customer builds. Pass only explicitly allowed theme tokens
and widget definitions. Never import the root registry/all-theme `IoTWidget` or
`DashboardPanel` in a restricted build. Register each selected ID explicitly,
fail closed for unknown widget/theme IDs, and keep demo fallback disabled for
real telemetry. Do not treat a client-side interaction event as authorization.
All output-bundle exclusion/security claims require artifact verification, not
just import-graph assertions. Use `INC-NNN-repository-purpose.patch` naming.
