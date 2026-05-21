#!/usr/bin/env sh

set -eu

# Usage:
#   sh scripts/clear-port.sh            # defaults to 2720
#   sh scripts/clear-port.sh 3301       # clears port 3301
#   PORT=2720 sh scripts/clear-port.sh  # use env var

PORT="${1:-${PORT:-2720}}"

if ! printf '%s' "$PORT" | grep -Eq '^[0-9]+$'; then
  echo "Invalid port: $PORT"
  exit 1
fi

find_pids() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti TCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
    return
  fi

  if command -v fuser >/dev/null 2>&1; then
    # fuser prints space-separated PIDs.
    fuser -n tcp "$PORT" 2>/dev/null || true
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    # Parse pid=1234 from ss output.
    ss -ltnp "sport = :$PORT" 2>/dev/null \
      | awk -F 'pid=' 'NF > 1 { split($2, a, ","); print a[1] }' \
      | sort -u || true
    return
  fi

  return
}

PIDS="$(find_pids | tr '\n' ' ' | xargs 2>/dev/null || true)"

if [ -z "$PIDS" ]; then
  echo "No listening process found on port $PORT."
  exit 0
fi

echo "Stopping PID(s) on port $PORT: $PIDS"
kill -TERM $PIDS 2>/dev/null || true
sleep 1

REMAINING="$(find_pids | tr '\n' ' ' | xargs 2>/dev/null || true)"

if [ -n "$REMAINING" ]; then
  echo "Force killing remaining PID(s): $REMAINING"
  kill -KILL $REMAINING 2>/dev/null || true
fi

FINAL="$(find_pids | tr '\n' ' ' | xargs 2>/dev/null || true)"

if [ -z "$FINAL" ]; then
  echo "Port $PORT is clear."
  exit 0
fi

echo "Could not clear port $PORT. Still in use by: $FINAL"
exit 1