#!/usr/bin/env bash
# Launch KCNA Prep on Linux (or any system with Python 3).
set -euo pipefail
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  exec python3 serve.py "$@"
elif command -v python >/dev/null 2>&1; then
  exec python serve.py "$@"
else
  echo "Python 3 is required but was not found." >&2
  echo "Install it from your package manager (e.g. 'sudo apt install python3')." >&2
  exit 1
fi
