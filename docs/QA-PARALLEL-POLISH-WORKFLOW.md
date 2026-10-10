# QA-first parallel IoT widget development

## Current source / patch sequencing

The baseline for the numbered patch set is the `iot-widgets.zip` Git archive uploaded on 2026-10-10, **not** the older V6 patch file. Keep unrelated local edits; do not force-patch over conflicts.

1. Apply `iot-widgets-qa-001.patch` (Playwright worker contract and real page checks).
2. Apply `iot-widgets-qa-002.patch` (archive verification and regression tests).
3. Optionally apply `iot-widgets-workflow-001.patch` (this documentation only).

Do not use the old V6 patch on top of files you already copied manually. The new QA patches intentionally leave `package.json`, the dashboard, the registry, and all themes untouched.

## Run QA on Windows

```powershell
cd G:\Works\Repos\iot-widgets
npm ci
npx playwright install chromium
npm run test:qa

# Preflight: ONE theme, ONE language, ONE category, ONE worker
.\scripts\widget-qa.cmd -Themes studio -Locale en -Category metrics -Jobs 1 -Profile review -ImageFormat jpeg -Quality 80 -KeepProjectRaw

# The preflight must print `[images] studio/en: 1 valid category screenshots` and `QA: PASS`.
# Check: out/studio-qa.zip. A failure produces out/studio-qa-FAILED.zip instead.

# Then run the full set; automatic workers remain enabled:
.\scripts\widget-qa.cmd -Themes all -Locale both -Profile review -ImageFormat jpeg -Quality 80

# Responsive dashboard/RTL check:
npm run qa:responsive -- --themes studio,horizon --locale both --boards factory,lab --widths 375,768,1280
```

Each passing per-theme ZIP includes `en/` and `fa/` (as requested), six category JPEGs per locale, `report.json`, `SUMMARY.txt`, logs, and a manifest. If ANY worker fails, the archive is labelled `-qa-FAILED.zip`, and the runner exits nonzero. Never upload FAILED archives as screenshots; upload them for troubleshooting only.

Review mode is optimal for sending visual evidence. Detailed mode provides cropped individual widget screenshots for one theme/category:

```powershell
.\scripts\widget-qa.cmd -Themes studio -Locale both -Profile detailed -ImageFormat jpeg -Quality 85 -Jobs 2
```

## Two verification levels

- `npm run test:qa` is dependency-light logic/contract testing. It simulates a browser for tests but does NOT prove real Chromium rendering.
- Actual `widget-qa.cmd` captures use Playwright/Chromium and verify image format, image dimensions, report completeness, render errors, selected theme and language direction. Review the images; byte checks cannot detect every visual overlap.

## Why Nexus/DemoDashboard does not show all widgets

`src/demo/DemoDashboard.tsx` defines curated factory, energy, fleet, and adaptive-lab layouts. It is intentionally a *dashboard composition demo*, not a complete widget catalog. `/?gallery=1` uses the complete `widgetRegistry` instead. After QA is reliable, add a separate **Nexus Catalog** dashboard that builds responsive, editable cards from the full registry and supports filtering by category and theme. Keep both curated panels and catalog for different use cases.

## Theme workflow — choose the set before polishing

Current themes: material, flat, minimal, gaming, ios, glass, studio, horizon. Avoid indiscriminately adding themes. Two possible complementary themes are `industrial` (dense, high-contrast plant/HMI panels) and `calm` (warm, accessible home/ambient panels). Agree on new theme IDs and register/validate them **before** freezing the baseline for parallel work. New themes automatically appear in QA when added to `WidgetThemeId`, but must also have tokens, frames, renderers and demo support.

**Important sharing rule:** Horizon currently shares Studio's widget renderer. Do NOT assign Studio and Horizon to different workers editing the same renderer. Either give both to one owner, or split Horizon into its own renderer in a separate preparatory patch.

After QA fixes and theme registration are committed, create one worktree per theme from the same base commit:

```powershell
git tag qa-polish-base

git worktree add ..\iot-widgets-material -b polish/material qa-polish-base
git worktree add ..\iot-widgets-flat -b polish/flat qa-polish-base
# Continue for other independent themes, but group Studio/Horizon.
```

Each worker/chat must edit ONLY theme-owned files, not package.json, registry, shared adaptive logic, DashboardPanel, global QA scripts, or shared tokens. Shared bugs go into a separate integration patch.

Generate review patches with names such as `iot-widgets-material-001.patch`, `iot-widgets-flat-001.patch`, `iot-widgets-studio-horizon-001.patch`. Record base commit hash and test results. Apply each once to the integration branch with `git apply --check` before `git apply`, or cherry-pick theme commits. Do not apply the same change twice.

## Reusable per-theme parallel chat prompt

> You are polishing the **{THEME}** theme of `iot-widgets`. Use the attached `qa-polish-base` source commit and the {THEME} EN/FA Review and Detailed QA ZIPs as your only repository baseline. Do not overwrite newer files or edit any other theme. Fix clipping, overlap, fixed-size SVGs, compact/detailed variants, alignment, typography, color contrast, RTL/LTR and phone/tablet/desktop behavior in the {THEME}-owned renderer/frame only. Preserve public APIs and widget definitions. Every supported widget and allowed size must render. Pay particular attention to map/chart minimums and controls' transient vs latched states. Do not change `package.json`, `src/library`, `src/widgets/registry.ts`, or `scripts/`. If a shared change is essential, document it as a separate integration request instead of editing that shared file. Produce `iot-widgets-{THEME}-001.patch`, a short list of modified files, and before/after screenshots or explicitly note if browser capture was unavailable. Verify `git apply --check` against the named base and run EN/FA theme QA, plus the mobile responsive QA where available. Never claim all visual defects are resolved without real browser screenshots.

Replace `{THEME}` with material, flat, minimal, gaming, ios, glass, or the combined studio-horizon assignment. Attach full source or Git worktree snapshot and the relevant theme QA ZIP to each parallel chat.
