#!/usr/bin/env python3
"""Optional: resolve every internal href/src against the file tree.

Not used to serve or deploy the site.

    python3 tools/check-links.py      # exit 1 if anything is broken
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "assets", "partials", "tools", "new-icons", "node_modules"}


def resolves(url):
    path = url.split("#")[0].split("?")[0]
    if path in ("", "/"):
        return os.path.isfile(os.path.join(ROOT, "index.html"))
    local = os.path.join(ROOT, path.lstrip("/"))
    return (
        os.path.isfile(local)
        or os.path.isfile(local + ".html")
        or os.path.isfile(os.path.join(local, "index.html"))
    )


def main():
    broken = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for name in sorted(filenames):
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, ROOT)
            with open(path, encoding="utf-8") as fh:
                text = fh.read()
            for m in re.finditer(r'(?:href|src)="(/[^"]*)"', text):
                if not resolves(m.group(1)):
                    broken.append((rel, m.group(1)))

    for rel, url in broken:
        print(f"  BROKEN  {rel} -> {url}")
    print(f"{len(broken)} broken internal links")
    if broken:
        sys.exit(1)


if __name__ == "__main__":
    main()
