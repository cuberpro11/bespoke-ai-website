#!/usr/bin/env python3
"""Local preview server that matches how Netlify serves the site.

Pretty URLs (`/about` → about.html, `/legal` → legal/index.html), the
custom 404 page, and no browser caching. On start — and whenever you edit
partials or CSS/JS — it restamps shared nav/footer and asset hashes so a
refresh shows your changes.

    python3 tools/serve.py          # http://127.0.0.1:8737
    python3 tools/serve.py 8000
"""
import os
import subprocess
import sys
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYNC = os.path.join(ROOT, "tools", "sync-shared.py")
WATCH = (
    "partials/nav.html",
    "partials/footer.html",
    "assets/css/styles.css",
    "assets/js/site.js",
    "assets/js/demo.js",
    "assets/css/solutions.css",
    "assets/js/solutions.js",
)

_lock = threading.Lock()
_last_sources = 0.0


def sources_mtime():
    latest = 0.0
    for rel in WATCH:
        path = os.path.join(ROOT, rel)
        if os.path.isfile(path):
            latest = max(latest, os.path.getmtime(path))
    return latest


def refresh_shared():
    """Restamp pages if partials or hashed assets changed on disk."""
    global _last_sources
    with _lock:
        current = sources_mtime()
        if current <= _last_sources:
            return
        subprocess.check_call([sys.executable, SYNC, "--quiet"])
        _last_sources = sources_mtime()


class NetlifyLikeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _strip_conditional_headers(self):
        # Always read files from disk. 304s would keep a stale browser copy.
        for key in ("If-Modified-Since", "If-None-Match"):
            if self.headers.get(key):
                del self.headers[key]

    def do_GET(self):
        refresh_shared()
        self._strip_conditional_headers()
        super().do_GET()

    def do_HEAD(self):
        refresh_shared()
        self._strip_conditional_headers()
        super().do_HEAD()

    def do_POST(self):
        # Local stand-in for Netlify Forms AJAX posts from the contact forms.
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            self.rfile.read(length)
        body = b"ok"
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def translate_path(self, path):
        local = super().translate_path(path)
        if os.path.isdir(local):
            if os.path.isfile(os.path.join(local, "index.html")):
                return os.path.join(local, "index.html")
        elif not os.path.exists(local) and not os.path.splitext(local)[1]:
            if os.path.isfile(local + ".html"):
                return local + ".html"
            if os.path.isfile(os.path.join(local, "index.html")):
                return os.path.join(local, "index.html")
        return local

    def send_error(self, code, message=None, explain=None):
        # Mirror the Netlify `/* -> /404.html 404` catch-all.
        if code == 404:
            page = os.path.join(ROOT, "404.html")
            if os.path.isfile(page):
                body = open(page, "rb").read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        super().send_error(code, message, explain)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8737
    refresh_shared()
    print(f"Preview: http://127.0.0.1:{port}/", flush=True)
    print("Edit HTML, CSS, JS, or partials/ and refresh. Ctrl+C to stop.", flush=True)
    HTTPServer(("127.0.0.1", port), NetlifyLikeHandler).serve_forever()
