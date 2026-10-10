#!/usr/bin/env bash
# IoT Widget Studio - Linux/macOS screenshot QA runner.
# Bash equivalent of scripts/widget-qa.ps1 and scripts/widget-qa.cmd.
set -Eeuo pipefail

KNOWN_THEMES=()
THEME_INPUTS=()
SELECTED_THEMES=()
LOCALE="both"
OUT_DIR="out"
BROWSER_PATH=""
WIDGET_PORT=0
HEADFUL=0
KEEP_PROJECT_RAW=0
PROFILE="review"
IMAGE_FORMAT=""
JPEG_QUALITY=85
CATEGORY=""
ACTIVE_STAGE=""
FAILURES=()

usage() {
  cat <<'HELP'
IoT Widget Studio - Linux / macOS automated screenshot QA

Usage:
  ./scripts/widget-qa.sh ios
  ./scripts/widget-qa.sh --themes ios,flat --locale en
  ./scripts/widget-qa.sh --themes all --locale both
  ./scripts/widget-qa.sh all --profile detailed --format png

Options:
  --themes, -Themes LIST       Themes are detected from WidgetThemeId; use all
                               (comma-separated, or multiple positional names)
  --locale, -Locale LOCALE     en | fa | both (default: both)
  --out-dir, -OutDir DIR       Output folder (default: project-root/out)
  --browser-path, -BrowserPath PATH
                               Chrome/Chromium/Edge executable
  --widget-port, -WidgetPort N
                               Port for widget capture (default: free port)
  --profile MODE              review (default) | detailed
  --format FORMAT             jpeg (default) | png
  --quality N                 JPEG quality 1-100 (default: 85)
  --category CATEGORY         Optional: metrics,controls,charts,location,tables,display
  --headful, -Headful         Show the browser (default: headless)
  --keep-project-raw, -KeepProjectRaw
                               Retain raw screenshot folders at project root
  -h, --help                  Show this help

Examples:
  ./scripts/widget-qa.sh ios
  ./scripts/widget-qa.sh ios --locale fa
  ./scripts/widget-qa.sh --themes ios,flat,gaming --locale en
  ./scripts/widget-qa.sh all --browser-path /usr/bin/chromium

Result:
  out/ios-qa.zip, out/flat-qa.zip, ... (one ZIP per selected theme)
  Review ZIPs contain one full-page category screenshot and diagnostics,
  not duplicated full-page captures or individual widget screenshot sheets.
  Detailed ZIPs additionally include each individual widget sheet.

Prerequisites:
  Node.js, npm, npm dependencies (npm ci / npm install), Chrome/Chromium/Edge,
  plus 'zip' or Python 3. Run from anywhere: project root is auto-detected.
HELP
}

die() { printf 'ERROR: %s\n' "$*" >&2; exit 2; }
section() {
  printf '\n%s\n%s\n%s\n' '==============================================================================' "$1" '=============================================================================='
}

require_value() {
  [[ $# -ge 2 && -n "$2" ]] || die "Missing value for $1"
}

while (($#)); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --themes|--theme|-Themes|-Theme|-t)
      require_value "$@"; THEME_INPUTS+=("$2"); shift 2 ;;
    --locale|-Locale)
      require_value "$@"; LOCALE="$2"; shift 2 ;;
    --out-dir|-OutDir)
      require_value "$@"; OUT_DIR="$2"; shift 2 ;;
    --browser-path|-BrowserPath)
      require_value "$@"; BROWSER_PATH="$2"; shift 2 ;;
    --widget-port|-WidgetPort)
      require_value "$@"; WIDGET_PORT="$2"; shift 2 ;;
    --profile|-Profile)
      require_value "$@"; PROFILE="${2,,}"; shift 2 ;;
    --format|--image-format|-ImageFormat)
      require_value "$@"; IMAGE_FORMAT="${2,,}"; shift 2 ;;
    --quality|-Quality)
      require_value "$@"; JPEG_QUALITY="$2"; shift 2 ;;
    --category|-Category)
      require_value "$@"; CATEGORY="${2,,}"; shift 2 ;;
    --headful|-Headful) HEADFUL=1; shift ;;
    --keep-project-raw|-KeepProjectRaw) KEEP_PROJECT_RAW=1; shift ;;
    --) shift; THEME_INPUTS+=("$@"); break ;;
    -*) die "Unknown option: $1 (use --help)" ;;
    *) THEME_INPUTS+=("$1"); shift ;;
  esac
done

case "$PROFILE" in review|detailed) ;; *) die "Invalid profile '$PROFILE' (expected review or detailed)" ;; esac
IMAGE_FORMAT="${IMAGE_FORMAT:-jpeg}"
case "$IMAGE_FORMAT" in jpg|jpeg) IMAGE_FORMAT=jpeg ;; png) ;; *) die "Invalid image format '$IMAGE_FORMAT' (expected jpeg or png)" ;; esac
[[ "$JPEG_QUALITY" =~ ^[0-9]+$ ]] && ((10#$JPEG_QUALITY >= 1 && 10#$JPEG_QUALITY <= 100)) || die "Quality must be from 1 to 100"
case "$CATEGORY" in ''|metrics|controls|charts|location|tables|display) ;; *) die "Unknown category '$CATEGORY'" ;; esac
case "$LOCALE" in en|fa|both) ;; *) die "Invalid locale '$LOCALE' (expected en, fa, or both)" ;; esac
for port in "$WIDGET_PORT"; do
  [[ "$port" =~ ^[0-9]+$ ]] && ((10#$port <= 65535)) || die "Invalid port '$port'"
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
if [[ -f "$SCRIPT_DIR/package.json" ]]; then
  PROJECT_ROOT="$SCRIPT_DIR"
elif [[ -f "$SCRIPT_DIR/../package.json" ]]; then
  PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
else
  die "Cannot find package.json above the script. Put this file in <repo>/scripts/."
fi
command -v node >/dev/null 2>&1 || die "Node.js is not installed"
mapfile -t KNOWN_THEMES < <(node "$PROJECT_ROOT/scripts/qa-themes.mjs" --lines)
((${#KNOWN_THEMES[@]})) || die "Could not discover registered theme IDs"

if ((${#THEME_INPUTS[@]} == 0)); then
  [[ -t 0 ]] || die "Specify at least one theme (for example: ./scripts/widget-qa.sh ios)"
  read -r -p "Theme(s) [${KNOWN_THEMES[*]} or all]: " answer
  [[ -n "${answer//[[:space:]]/}" ]] || die "No theme provided"
  THEME_INPUTS=("$answer")
fi

# Normalize comma, semicolon, and whitespace separated themes; remove duplicates.
for raw in "${THEME_INPUTS[@]}"; do
  raw="${raw//,/ }"
  raw="${raw//;/ }"
  for candidate in $raw; do
    theme="${candidate,,}"
    if [[ "$theme" == all ]]; then
      SELECTED_THEMES=("${KNOWN_THEMES[@]}")
      break 2
    fi
    found=0
    for known in "${KNOWN_THEMES[@]}"; do
      [[ "$theme" == "$known" ]] && found=1 && break
    done
    (( found )) || die "Unknown theme '$theme'. Valid: ${KNOWN_THEMES[*]}, all"
    duplicate=0
    for known in "${SELECTED_THEMES[@]}"; do
      [[ "$theme" == "$known" ]] && duplicate=1 && break
    done
    (( duplicate )) || SELECTED_THEMES+=("$theme")
  done
done
((${#SELECTED_THEMES[@]})) || die "No valid theme provided"

command -v node >/dev/null 2>&1 || die "Node.js is not installed or not in PATH"
command -v npm >/dev/null 2>&1 || die "npm is not installed or not in PATH"
[[ -f "$PROJECT_ROOT/node_modules/vite/bin/vite.js" ]] || die "Missing Vite dependency. Run 'npm ci' (or 'npm install') in $PROJECT_ROOT"
[[ -d "$PROJECT_ROOT/node_modules/playwright" ]] || die "Missing Playwright dependency. Run 'npm ci' (or 'npm install') in $PROJECT_ROOT"

if [[ "$OUT_DIR" = /* ]]; then
  OUTPUT_ROOT="$OUT_DIR"
else
  OUTPUT_ROOT="$PROJECT_ROOT/$OUT_DIR"
fi
mkdir -p -- "$OUTPUT_ROOT"
OUTPUT_ROOT="$(cd -- "$OUTPUT_ROOT" && pwd -P)"
[[ "$OUTPUT_ROOT" != "$PROJECT_ROOT/widget-screenshots" && "$OUTPUT_ROOT" != "$PROJECT_ROOT/full-screenshots" ]] || die "Output folder must not be a raw screenshots directory"

resolve_browser() {
  local explicit="$1" candidate command_name
  if [[ -n "$explicit" ]]; then
    [[ -f "$explicit" && -x "$explicit" ]] || die "Browser executable not found or not executable: $explicit"
    printf '%s\n' "$(cd -- "$(dirname -- "$explicit")" && pwd -P)/$(basename -- "$explicit")"
    return 0
  fi
  if [[ -n "${PLAYWRIGHT_CHROME_PATH:-}" && -x "$PLAYWRIGHT_CHROME_PATH" ]]; then
    printf '%s\n' "$PLAYWRIGHT_CHROME_PATH"
    return 0
  fi
  for command_name in chromium chromium-browser google-chrome google-chrome-stable microsoft-edge microsoft-edge-stable; do
    if candidate="$(command -v "$command_name" 2>/dev/null)" && [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  # Playwright downloads a Chromium binary here on Linux.
  local -a browsers=()
  shopt -s nullglob
  browsers=("${HOME:-/nonexistent}"/.cache/ms-playwright/chromium-*/chrome-linux/chrome
            "${HOME:-/nonexistent}"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome)
  shopt -u nullglob
  for candidate in "${browsers[@]}"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  die "No Chrome/Chromium/Edge found. Install Chromium or supply --browser-path /path/to/browser"
}
BROWSER_EXECUTABLE="$(resolve_browser "$BROWSER_PATH")"

free_tcp_port() {
  node - <<'NODE'
const net = require('node:net');
const server = net.createServer();
server.on('error', err => { console.error(err.message); process.exitCode = 1; });
server.listen(0, '127.0.0.1', () => {
  console.log(server.address().port);
  server.close();
});
NODE
}

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "$ACTIVE_STAGE" && -d "$ACTIVE_STAGE" ]]; then
    rm -rf -- "$ACTIVE_STAGE"
  fi
  if (( ! KEEP_PROJECT_RAW )); then
    rm -rf -- "$PROJECT_ROOT/widget-screenshots" "$PROJECT_ROOT/full-screenshots"
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

run_npm_capture() {
  local npm_script="$1" log_file="$2"
  printf 'Running: npm run %s\n' "$npm_script"
  if npm run "$npm_script" 2>&1 | tee "$log_file"; then
    return 0
  fi
  printf 'npm run %s failed. See: %s\n' "$npm_script" "$log_file" >&2
  return 1
}

archive_stage() {
  local stage="$1" archive="$2"
  rm -f -- "$archive"
  if command -v zip >/dev/null 2>&1; then
    (cd -- "$stage" && zip -q -r "$archive" .)
  elif command -v python3 >/dev/null 2>&1; then
    (cd -- "$stage" && python3 - "$archive" <<'PY'
from pathlib import Path
import sys
from zipfile import ZipFile, ZIP_DEFLATED
root = Path.cwd()
with ZipFile(sys.argv[1], 'w', compression=ZIP_DEFLATED) as zf:
    for file in sorted(root.rglob('*')):
        if file.is_file():
            zf.write(file, file.relative_to(root))
PY
    )
  else
    printf 'Neither zip nor python3 is available; cannot create %s\n' "$archive" >&2
    return 1
  fi
}

if [[ "$LOCALE" == both ]]; then
  LOCALES=(en fa)
else
  LOCALES=("$LOCALE")
fi

cd -- "$PROJECT_ROOT"
RUN_START="$(date '+%Y-%m-%d %H:%M:%S %z')"
for theme in "${SELECTED_THEMES[@]}"; do
  # One fresh ZIP for each theme, with no duplicate full-page captures.
  rm -rf -- "$OUTPUT_ROOT/$theme" "$OUTPUT_ROOT/.$theme-qa-staging"
  archive="$OUTPUT_ROOT/$theme-qa.zip"
  rm -f -- "$archive"
  ACTIVE_STAGE="$OUTPUT_ROOT/.$theme-qa-staging"
  mkdir -p -- "$ACTIVE_STAGE"
  theme_results=()

  for locale_name in "${LOCALES[@]}"; do
    section "QA: theme=$theme  locale=$locale_name"
    locale_out="$ACTIVE_STAGE/$locale_name"
    log_dir="$locale_out/logs"
    mkdir -p -- "$log_dir"
    export WIDGET_QA_THEME="$theme" WIDGET_QA_LOCALE="$locale_name"
    export PLAYWRIGHT_CHROME_PATH="$BROWSER_EXECUTABLE" WIDGET_QA_HEADFUL="$HEADFUL"
    export WIDGET_QA_IMAGE_FORMAT="$IMAGE_FORMAT" WIDGET_QA_JPEG_QUALITY="$JPEG_QUALITY"
    export WIDGET_QA_CATEGORY_SHEETS=1
    if [[ "$PROFILE" == review ]]; then export WIDGET_QA_WIDGET_SHEETS=0; else export WIDGET_QA_WIDGET_SHEETS=1; fi
    if [[ -n "$CATEGORY" ]]; then export WIDGET_QA_CATEGORY="$CATEGORY"; else unset WIDGET_QA_CATEGORY || true; fi
    unset WIDGET_QA_PORT WIDGET_QA_URL || true
    widget_status="NOT RUN"

    # 1. Single-widget category sheets and diagnostics (script starts its own Vite).
    export WIDGET_QA_PORT="${WIDGET_PORT:-0}"
    if [[ "$WIDGET_QA_PORT" == 0 ]]; then WIDGET_QA_PORT="$(free_tcp_port)"; fi
    rm -rf -- "$PROJECT_ROOT/widget-screenshots"
    if run_npm_capture screenshots "$log_dir/npm-screenshots.log" && \
       [[ -d "$PROJECT_ROOT/widget-screenshots/$theme" ]]; then
      mkdir -p -- "$locale_out/widget-screenshots"
      cp -R -- "$PROJECT_ROOT/widget-screenshots/$theme" "$locale_out/widget-screenshots/"
      for report in report.json SUMMARY.txt; do
        [[ ! -f "$PROJECT_ROOT/widget-screenshots/$report" ]] || \
          cp -- "$PROJECT_ROOT/widget-screenshots/$report" "$locale_out/widget-screenshots/"
      done
      widget_status="PASS"
    else
      widget_status="FAIL"
      FAILURES+=("$theme/$locale_name widget screenshots failed (see logs)")
      printf 'Failed: %s/%s widget screenshots\n' "$theme" "$locale_name" >&2
    fi
    unset WIDGET_QA_PORT

    # The screenshot above already uses fullPage:true, therefore a second
    # screenshots:full pass would generate the same category images again.
    theme_results+=("$locale_name: widget=$widget_status ($PROFILE; $IMAGE_FORMAT)")
  done

  git_commit="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || true)"
  {
    printf 'IoT Widget Studio QA Bundle\n'
    printf 'Generated: %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')"
    printf 'Theme: %s\n' "$theme"
    printf 'Locales: %s\n' "${LOCALES[*]}"
    printf 'Browser: %s\n' "$BROWSER_EXECUTABLE"
    printf 'Profile: %s\nFormat: %s\nJPEG quality: %s\n' "$PROFILE" "$IMAGE_FORMAT" "$JPEG_QUALITY"
    printf 'Git commit: %s\n\nResults:\n' "$git_commit"
    printf '%s\n' "${theme_results[@]}"
    printf '\nArchive layout:\n'
    printf '%s\n' '  <locale>/widget-screenshots/ category screenshots, diagnostics, optional widget images' \
                    '  <locale>/logs/               capture logs' \
                    '  QA-MANIFEST.txt              this file'
    printf '\nOnly requested locales are included.\n'
  } >"$ACTIVE_STAGE/QA-MANIFEST.txt"

  if archive_stage "$ACTIVE_STAGE" "$archive"; then
    printf 'Final archive: %s\n' "$archive"
  else
    FAILURES+=("$theme archive creation failed")
  fi
  rm -rf -- "$ACTIVE_STAGE"
  ACTIVE_STAGE=""
done

printf '\nIoT Widget Studio automated QA\n'
printf 'Started:  %s\n' "$RUN_START"
printf 'Finished: %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')"
printf 'Themes:   %s\n' "${SELECTED_THEMES[*]}"
printf 'Locales:  %s\n' "${LOCALES[*]}"
printf 'Profile:  %s (%s)\n' "$PROFILE" "$IMAGE_FORMAT"
printf 'Output:   %s\n' "$OUTPUT_ROOT"
if ((${#FAILURES[@]} == 0)); then
  printf '\nRESULT: PASS\n'
else
  printf '\nRESULT: FAIL (%s phase(s))\n' "${#FAILURES[@]}"
  printf '  - %s\n' "${FAILURES[@]}"
  exit 1
fi
