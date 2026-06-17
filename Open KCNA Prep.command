#!/bin/bash
# Double-click this file to launch KCNA Prep in your browser.
cd "$(dirname "$0")" || exit 1

# Prefer the cross-platform launcher (adds security headers + finds a free port).
if command -v python3 >/dev/null 2>&1; then
  exec python3 serve.py
fi

# Fallback: plain static server on the first free port from 4178.
PORT=4178
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done
echo "Starting KCNA Prep on http://localhost:$PORT ..."
python -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
sleep 1
open "http://localhost:$PORT"
echo ""
echo "  KCNA Prep is running at  http://localhost:$PORT"
echo "  Leave this window open while studying. Close it (or Ctrl+C) to stop."
echo ""
trap 'kill $SERVER_PID 2>/dev/null' EXIT
wait $SERVER_PID
