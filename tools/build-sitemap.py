#!/usr/bin/env python3
"""Generate sitemap.xml from the pages on disk.

Netlify runs this on deploy. You can also run it locally after adding a page.

    python3 tools/build-sitemap.py
"""
import os
import subprocess
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://getbespoke.ai"
SKIP_DIRS = {".git", "assets", "partials", "tools", "new-icons", "node_modules"}
SKIP_FILES = {"404.html"}
TODAY = datetime.date.today().isoformat()

# Hubs first, then their children, then the rest — crawl order mirrors the IA.
ORDER = ["/", "/legal", "/finance", "/edtech", "/general-services",
         "/about", "/demos", "/insights", "/contact"]


def url_for(rel):
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("/index.html")]
    return "/" + rel[: -len(".html")]


def lastmod(path):
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", path],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
        return out or TODAY
    except Exception:
        return TODAY


def sort_key(entry):
    url = entry[0]
    parent = "/" + url.strip("/").split("/")[0] if url != "/" else "/"
    rank = ORDER.index(parent) if parent in ORDER else len(ORDER)
    return (rank, url.count("/"), url)


def main():
    entries = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for name in filenames:
            if not name.endswith(".html") or name in SKIP_FILES:
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, ROOT)
            with open(path, encoding="utf-8") as fh:
                head = fh.read(4096)
            if 'name="robots" content="noindex' in head:
                continue
            entries.append((url_for(rel), lastmod(rel)))

    entries.sort(key=sort_key)
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, mod in entries:
        lines += ["  <url>", f"    <loc>{BASE}{url}</loc>",
                  f"    <lastmod>{mod}</lastmod>", "  </url>"]
    lines.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"sitemap.xml: {len(entries)} urls")


if __name__ == "__main__":
    main()
