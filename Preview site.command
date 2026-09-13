#!/bin/zsh
# Double-click this to preview the site locally.
# Same as: python3 tools/serve.py
#
# Do not open HTML files directly in the browser (file://). The site uses
# extensionless URLs and root-relative assets, which only work over http.
cd "$(dirname "$0")" || exit 1

PORT=8737
if ! curl -s -o /dev/null "http://127.0.0.1:$PORT/"; then
  python3 tools/serve.py "$PORT" >/tmp/bespoke-preview.log 2>&1 &
  for _ in {1..40}; do
    curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
    sleep 0.25
  done
fi

open "http://localhost:$PORT/"
echo "Serving at http://localhost:$PORT/  — close this window to stop."
wait
