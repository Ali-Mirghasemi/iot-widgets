# QA archive optimization audit — October 2026

## Observed duplication in previously generated archives

There are 150 PNG images per theme ZIP: 12 full-page screenshots from
`full-screenshots.mjs`, 12 category screenshots from `capture-widgets.mjs`,
and 126 individual widget screenshots (63 per locale). All twelve pairs of
full-page/category PNGs had matching CRC and uncompressed size (identical
byte streams in the supplied archives).

| Theme | Original ZIP | Identical duplicate PNG payload |
|---|---:|---:|
| Glass | 216.0 MB | 74.4 MB |
| Gaming | 131.3 MB | 44.6 MB |
| iOS | 31.9 MB | 11.5 MB |
| Studio | 23.7 MB | 8.6 MB |
| Material | 23.1 MB | 8.3 MB |
| Flat | 19.5 MB | 7.2 MB |
| Minimal | 15.4 MB | 5.8 MB |

Figures use decimal MB and represent uncompressed identical PNG files;
actual compressed-ZIP savings will differ somewhat. ZIP cannot be relied
upon to deduplicate equal files stored at different paths.

For example, an older Glass `metrics.png` was 14.08 MB. A test conversion
with Pillow to high-quality JPEG yielded about 1.83 MB. Actual Playwright
JPEG file sizes depend on its encoder, and fine-text quality should be
reviewed before choosing JPEG for pixel-accuracy tests.

## Changed behavior

- **Default `review` profile**: one category full-page screenshot per
  category and locale, structured diagnostics and logs, no individual
  widget crops, no duplicate full-page pass.
- **`detailed` profile**: same category screenshots plus individual
  per-widget screenshots, useful for detailed issue triage.
- **`jpeg` (quality 85)** by default in either profile for upload-friendly
  results; `png` is available for lossless visual regression.
- **`--locale en` / `-Locale en`** halves captures when only one language
  needs review.
- **`--category metrics` / `-Category metrics`** captures only a
  particular category when diagnosing a specific problem.
- `npm run screenshots` run by itself remains lossless/backwards-compatible,
  still creating PNG category and widget images (unless environment
  variables override it).
- The independent `npm run screenshots:full` command remains available;
  intentionally invoking *both* scripts manually will still produce
  duplicated full-page category screens. The automated runners no longer
  invoke both.

## Adding themes

Register the theme in the `WidgetThemeId` union in
`src/widgets/core/types.ts`, the token registry, and the visual renderer.
The Node screenshot commands and Linux/Windows QA runners obtain theme
names from this union through `scripts/qa-config.mjs`. Run
`npm run test:qa` to check that all three registries match.

## Commands

```bash
# Small upload; English only, all themes
./scripts/widget-qa.sh all --profile review --locale en

# Debug a specific visually dense theme, both languages
./scripts/widget-qa.sh glass --profile detailed --locale both

# Lossless, focused QA for chart overlaps
./scripts/widget-qa.sh studio --profile detailed --format png --category charts
```

```powershell
scripts\widget-qa.cmd -Themes all -Profile review -Locale en
scripts\widget-qa.cmd glass -Profile detailed -Locale both
scripts\widget-qa.cmd studio -Profile detailed -ImageFormat png -Category charts
```

Default output is one `<theme>-qa.zip` per selected theme in `out/`.

## Testing notes

- The source-linked theme list and profile parsing were unit-tested.
- Linux runner was smoke-tested with mocked capture commands for two
  themes, two locales, filtered category, and detailed PNG output.
- Full Playwright/Vite rendering and Windows PowerShell execution are not
  verified here because the installed project dependencies and `pwsh` were
  unavailable.
