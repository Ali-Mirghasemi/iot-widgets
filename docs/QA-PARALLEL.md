# Parallel screenshot QA (Windows, Linux, macOS)

The screenshot runner now shares **one Vite server** across independent theme/locale Chromium captures. English and Persian can run at the same time, or different themes can run simultaneously. Each worker writes its own folder so it cannot delete another worker's screenshots.

## Commands (automatic resource detection is the default)

```powershell
# Windows: preview hardware-based plan (no browser started)
.\scripts\widget-qa.cmd -Themes all -Locale both -Plan

# Automatically detect available CPU threads and available RAM
.\scripts\widget-qa.cmd -Themes all -Locale both

# Show resource detection and use the requested maximum, subject to memory guard
.\scripts\widget-qa.ps1 -Themes studio,horizon -Locale both -Jobs auto

# Manual cap for troubleshooting and repeatable benchmarks
.\scripts\widget-qa.cmd -Themes all -Locale both -Jobs 4
```

```bash
# Linux / macOS: check the plan first
./scripts/widget-qa.sh all --locale both --plan

# Automatic concurrency (also accounts for cgroup limits on Linux)
./scripts/widget-qa.sh all --locale both
./scripts/widget-qa.sh all --jobs auto

# Manual and serial modes
./scripts/widget-qa.sh all --jobs 4
./scripts/widget-qa.sh all --sequential
```

### How the default selects the worker count

1. Reads **usable logical CPU threads**, respecting affinity and Linux CPU quotas where available.
2. Reads **available** RAM, not just total installed RAM. On Linux it checks `MemAvailable` and container memory limits.
3. Reserves 2–4 GiB for the operating system, Vite, and other processes.
4. Allows about one browser worker per two logical CPU threads, then limits this further by RAM and the total number of tasks.
5. Uses estimated per-capture RAM costs: Glass needs more than Gaming; Gaming needs more than Studio. The scheduler only admits jobs within the memory budget. If free RAM decreases during capture, admission slows down.

A 16-core/24-thread computer with 32 GiB installed and 26 GiB *available* initially selects around **11 workers** (heavy themes may run at lower simultaneous concurrency). A 4-core/8-thread computer with 64 GiB installed and 55 GiB available selects **3 workers** because CPU is the bottleneck. These are estimates, not guarantees of fastest execution on every machine. Free RAM, task mix, image format, GPU, and browser behavior affect the actual result.

`--jobs N` / `-Jobs N` accepts 1–64 and **overrides the CPU-based count**, but the memory admission guard remains active to reduce out-of-memory failures. `--sequential` forces a single worker. The log and each theme manifest show the detected resources and selected concurrency.

The maximum safe worker count is **not** equal to the number of CPU threads; launching 24 Chromium processes on a 24-thread machine is often slower than running fewer processes.

## Output

The result stays compatible with previous uploads: `out/<theme>-qa.zip`, containing `en/widget-screenshots/`, `fa/widget-screenshots/`, and logs. No duplicate category captures are created. Review mode uses JPEG and excludes individual widget sheets; detailed mode includes them.

When `--keep-project-raw` / `-KeepProjectRaw` is selected, raw worker directories are retained inside `out/qa-raw/run-.../` so all locale/theme images remain available. Normally temporary images are removed after ZIP creation.

Use `--jobs 1` to debug flaky screenshots. Do not start two separate QA runners concurrently with the same `--out-dir` because both would publish the same `<theme>-qa.zip` filenames.

## Implementation

- `scripts/run-qa.mjs` — common cross-platform job scheduler, Vite server, progress, exit codes, ZIPs
- `scripts/qa-zip.mjs` — dependency-free streaming ZIP writer; stored screenshot entries avoid recompressing JPEG/PNG
- `scripts/capture-widgets.mjs` — supports `WIDGET_QA_OUTPUT_DIR` and a shared `WIDGET_QA_URL`
- `scripts/widget-qa.sh` — Linux/macOS wrapper
- `scripts/widget-qa.ps1` / `scripts/widget-qa.cmd` — Windows wrapper
- `scripts/test-qa-parallel.mjs` — simulated capture tests for true concurrency, isolated outputs, archives, and failures

New themes are discovered from `WidgetThemeId` through `qa-config.mjs`, just as in the previous QA release. The wrappers do **not** contain a hard-coded list of themes.

## Verification

```bash
npm run test:qa
```

This verifies theme discovery and the worker scheduler without opening Chromium. Full screenshot and platform/browser verification still requires running the QA command on your own installed project.
