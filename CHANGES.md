# IoT Widgets — Change Record

Log actual project changes in reverse chronological order, including verified test results and known limitations. Do not treat proposed work as completed.

## INC-003 — Scoped widget runtime composition (2026-10-18)

- Introduced `src/library/ScopedIoTWidget.tsx` with `createScopedIoTWidget()`:
  client-provided allowlists of definitions, theme tokens, visual renderer modules
  and frame modules. No default theme registry, demo catalog, or all-theme frame
  import is pulled by the scoped entry.
- Added independent minimal frame subpath and existing industrial frame subpath.
  Existing `IoTWidget` and full registry remain unchanged for compatibility.
- Production-scoped widgets default to no mock fallback and show explicit
  unavailable state when required live telemetry or control handlers are absent.
- Added static guard tests (`npm run test:scoped`) and scoped API documentation.
- **Verification in patch authoring environment:** static Node checks passed;
  full `tsc -p tsconfig.lib.json` and browser/bundle audits require the user's
  installed React/MUI dependencies. **No Nira build-profile integration yet.**
- Next: consume scoped entry from Nira's generated frontend and audit its emitted
  code; do not claim private renderer exclusion until that test passes.

## INC-001 — Selective renderer entry foundation (2026-10-18)

- Extracted shared visual-body composition into `WidgetVisualCore.tsx` without eager
  imports of any built-in theme implementation. The default `WidgetVisuals.tsx`
  still registers all visual themes and exports the same names.
- Added explicit package exports for a renderer-independent factory and individual
  theme modules; unsupported theme selections throw instead of silently falling back.
- Added a static contract test and `docs/SELECTIVE_RENDERERS.md`.
- Validation evidence: `node --test scripts/test-selective-renderer-imports.mjs`
  passed 3 static checks in the reconstructed source fixture. Full TypeScript
  build, browser rendering and emitted-bundle exclusion are **not yet verified**.
- Next: deliver an import-clean IoTWidget/Panel composition API, then integrate
  the customer build profiles and compile/audit the final Nira bundles.

## 2026-10-18 — Project tracking contract

**Added:** root `AGENTS.md`, `PROFILE.md`, `TODO.md`, `CHANGES.md` as an explicit handoff, library/host responsibility contract, and roadmap for Nira's exhibition demo plus future customer-selective builds.

**Impact:** documentation only; no public API, TypeScript, CSS, generated bundle or widget behavior changed by this patch.

**Verification:** patch format/application to current root tracked files should be checked before use. No widget build/test claims are made for this documentation patch.

**Next:** validate the earlier dashboard drag UX patch in browsers; close the production-state/control-event gaps; implement selective registration and artifact-level exclusion tests.

## Earlier integration history — reported, not reverified here

Nira previously installed the library from Git (package v0.4.0 was shown in installation output). A Git package preparation patch and a dashboard drag/reorder UX patch were prepared. Their full compatibility against the user's latest local worktree and actual browser behavior is **not established by this change record**. See Git commits, tests and the Nira repository's own `CHANGES.md` for exact evidence.
