#!/bin/zsh
set -eu
cd "$(dirname "$0")/../.."
PYTHON_BIN="${SEEKER_PYTHON:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3}"
if [[ ! -x "$PYTHON_BIN" ]]; then PYTHON_BIN=python3; fi
if curl -fsS http://127.0.0.1:8765/api/state >/dev/null 2>&1; then
  open http://127.0.0.1:8765
else
  open http://127.0.0.1:8765
  "$PYTHON_BIN" tools/seeker/app.py unnamed --state .seeker
fi
