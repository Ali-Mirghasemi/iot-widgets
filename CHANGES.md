# IoT Widgets — Change Record

Log actual project changes in reverse chronological order, including verified test results and known limitations. Do not treat proposed work as completed.

## 2026-10-18 — Project tracking contract

**Added:** root `AGENTS.md`, `PROFILE.md`, `TODO.md`, `CHANGES.md` as an explicit handoff, library/host responsibility contract, and roadmap for Nira's exhibition demo plus future customer-selective builds.

**Impact:** documentation only; no public API, TypeScript, CSS, generated bundle or widget behavior changed by this patch.

**Verification:** patch format/application to current root tracked files should be checked before use. No widget build/test claims are made for this documentation patch.

**Next:** validate the earlier dashboard drag UX patch in browsers; close the production-state/control-event gaps; implement selective registration and artifact-level exclusion tests.

## Earlier integration history — reported, not reverified here

Nira previously installed the library from Git (package v0.4.0 was shown in installation output). A Git package preparation patch and a dashboard drag/reorder UX patch were prepared. Their full compatibility against the user's latest local worktree and actual browser behavior is **not established by this change record**. See Git commits, tests and the Nira repository's own `CHANGES.md` for exact evidence.
