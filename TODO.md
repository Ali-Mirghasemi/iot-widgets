# IoT Widgets — Development TODO

**Updated:** 2026-10-18
**Priority:** make the reusable library visually strong, stable and safe enough for Nira's simulator-backed transformer demo.

## P0 — Quality and correctness

- [ ] Verify integration/Git-install prerequisites and lockfile compatibility on a fresh package install; record exact commit/tag and build outcome.
- [ ] Verify the dashboard drag/reorder UX patch in real Chromium/Firefox browsers, mobile touch, mouse and keyboard; test drag-handle-only behavior, pointer cancel, reduced motion, responsive and RTL placement, layout persistence and widget interactivity outside edit mode.
- [ ] Test visual composition and readability of representative metric, chart, alarm, control, map and table widgets at compact/standard/expanded sizes and in each selected theme. Remove large decorative unused space.
- [ ] Implement and test production data states: loading, missing, offline, stale, error, forbidden, valid live. Do not let demo mocks appear as measured values.
- [ ] Add semantic control intent events, pending/confirmed/failed states and cancellation where appropriate. Host must remain the sole executor of real device commands.
- [ ] Accessibility QA: buttons/handles/focus, keyboard ordering, screen readers, adequate contrast, RTL and reduced-motion preference.

## P1 — Reusable library enhancements

- [ ] Make built-in widget/style exports selectively registrable for different customer bundles; artifact audit proves excluded themes do not appear in emitted JavaScript/CSS/assets.
- [ ] Add catalog/search/preview picker as reusable composition **without** embedding any Nira permissions or domain API.
- [ ] Add optional transformer-oriented electrical/lock/alarm visuals only where semantics are validated; do not invent physical sensors or commands.
- [ ] Establish compatibility/deprecation/migration policy for saved widget and theme identifiers.
- [ ] Add reproducible Git-tag/pack release CI with React/MUI/Emotion peer dependency matrix and deterministic screenshot baselines.

## Per-change maintenance

- [ ] Update `PROFILE.md` when public contracts, constraints or target consumers change.
- [ ] Check off TODO items only when tests/screenshots/evidence justify completion.
- [ ] Add `CHANGES.md` entry with actual files, test commands/results, compatibility and next action.
- [ ] Update `AGENTS.md` for evolving execution safeguards.
- [ ] Deliver source changes as **focused `.patch` files**; do not copy this library into Nira's frontend.
