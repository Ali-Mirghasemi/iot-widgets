# QA repair / reliable screenshot upload guide

The missing `scripts/qa-zip.mjs` module and the old Linux/Playwright capture
conflicts are fixed. Both `scripts/widget-qa.cmd` and `scripts/widget-qa.sh`
now invoke one Node scheduler: `scripts/run-qa.mjs`. The scheduler runs one
shared Vite server, isolates each theme/locale capture, and creates valid ZIP
files using a dependency-free ZIP writer.

## First-time setup

From the repository root, install packages and Playwright's Chromium:

```powershell
npm ci
npx playwright install chromium
npm run test:qa
.\scripts\widget-qa.cmd -Themes all -Locale both -Plan
```

If Playwright cannot locate a browser on Windows, supply:

```powershell
.\scripts\widget-qa.cmd -Themes all -Locale both -BrowserPath 'C:\path\to\chrome.exe'
```

Linux:

```bash
npm ci
npx playwright install chromium
npm run test:qa
./scripts/widget-qa.sh all --locale both --plan
```

## Recommended archive for sending to ChatGPT

Run **all themes and both languages in review mode**. This takes six category
screenshots per theme/language (12 images per theme), plus detailed JSON
reports, status manifests and logs. Quality 80 is usually sufficient to
spot typography, spacing, clipping and hierarchy problems while keeping the
archives small.

**Windows**:

```powershell
.\scripts\widget-qa.cmd -Themes all -Locale both -Profile review -ImageFormat jpeg -Quality 80
```

**Linux/macOS**:

```bash
./scripts/widget-qa.sh all --locale both --profile review --format jpeg --quality 80
```

Share the resulting `out/<theme>-qa.zip` archives. All 8 theme ZIPs provide
complete theme comparisons; for a focused change, upload only the affected
2–3 themes. Do **not** upload the entire Git repository or `out/qa-raw`.

If a specific widget clips or overlaps, collect close-up **detailed** images:

```powershell
.\scripts\widget-qa.cmd -Themes studio,horizon -Locale both -Profile detailed -ImageFormat jpeg -Quality 85
```

To diagnose a particular category, append `-Category metrics` (or `charts`,
`controls`, `location`, `tables`, `display`). Use `-ImageFormat png` only for
pixel-accurate investigations. Use `-Jobs 1` when investigating flaky captures.

`-Plan` is a dry run and does not generate archives. `-Jobs auto` is the
default: it considers usable CPU threads, available RAM, and different memory
costs for Glass and Gaming.

## Verify the result

The command should print `QA: PASS`. There should be one archive per theme,
for example `out/studio-qa.zip`, `out/horizon-qa.zip`. Each contains:

```text
QA-MANIFEST.txt
  en/widget-screenshots/studio/metrics.jpg
  en/widget-screenshots/studio/charts.jpg
  en/widget-screenshots/report.json
  en/widget-screenshots/SUMMARY.txt
  en/logs/npm-screenshots.log
  fa/widget-screenshots/... (same layout)
```

`QA: PASS` indicates the capture processes and archive writing completed; it
**does not** mean that widgets are visually perfect. Examine `report.json` for
`renderErrors`, clipping/overflow suspects, or browser console errors.

Avoid running two QA coordinators simultaneously with the same `-OutDir`, as
they publish the same `<theme>-qa.zip` names.

## Git size audit

The supplied `.git` is approximately 65 MB; more than 60 MB comes from a
historically committed `iot-widgets.zip` binary in commits `7760249` and
`ef1de16`. That ZIP is not in the latest tree but remains reachable through
Git history. `.gitignore` cannot remove existing history. Do **not** delete
files inside `.git/objects` manually.

To confirm:

```powershell
git count-objects -vH
git log --all --oneline -- iot-widgets.zip
git ls-files | Select-String '(^dist/|\.zip$|^vite\.config\.(js|d\.ts)$)'
```

**Recommended (no rewritten history):** Keep `.gitignore` ignoring `.zip`,
`out/`, `dist/`, `node_modules/`; stop committing archives. Your history stays
unchanged, but the 60 MB object remains. `git gc` may pack it, but cannot
remove a reachable historical object.

**Optional (destructive history rewrite):** Back up the full repository and
coordinate with collaborators. Install `git-filter-repo`, then work in a
fresh clone/mirror and filter `iot-widgets.zip` out of *all history*:

```bash
git filter-repo --path iot-widgets.zip --invert-paths
```

This changes commit hashes and may require force-pushing and everybody to
reclone; do NOT run it in an actively shared repository without coordination.
A shallow clone (`git clone --depth 1`) is another way to keep a small checkout
without rewriting the remote history, but omits older commits locally.

The generated `vite.config.js` and `vite.config.d.ts` were also tracked in the
uploaded commit. They have no meaningful impact on Git size, but are build
outputs; new `.gitignore` rules exclude them once they have been untracked.
To stop tracking them **without deleting your local copies**:

```powershell
git rm --cached -- vite.config.js vite.config.d.ts
```

Then commit that change with the `.gitignore` update. Do not apply it before
reviewing local edits to those files.
