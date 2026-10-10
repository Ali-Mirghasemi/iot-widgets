#!/usr/bin/env bash
# Linux/macOS wrapper around the same Node coordinator as Windows.
# Theme discovery, CPU/RAM auto-sizing, browser capture, packaging and logs
# are implemented once in run-qa.mjs, avoiding platform-specific drift.
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js is required. Install Node.js and run npm ci.' >&2
  exit 1
fi
exec node "$SCRIPT_DIR/run-qa.mjs" "$@"
