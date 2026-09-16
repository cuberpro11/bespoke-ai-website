#!/usr/bin/env python3
"""Stamp shared nav/footer and CSS/JS cache-bust hashes into every page.

Netlify and the local preview server both run this, so `partials/` and the
files in `assets/` are the source of truth. The HTML in git is generated
output — edit nav/footer in partials/, not inside a page.

Each page marks where a partial goes with sentinel comments:

    <!-- @shared:nav -->
    ...generated, do not edit...
    <!-- /@shared:nav -->

    python3 tools/sync-shared.py            # write
    python3 tools/sync-shared.py --check    # exit 1 if anything is stale
    python3 tools/sync-shared.py --quiet    # silent unless something changed
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTIALS = os.path.join(ROOT, "partials")
# demos/ holds the demos hub as well as the self-contained demo apps;
# the apps have no sentinels and no site-wide CSS, so walking them is harmless.
SKIP_DIRS = {".git", "assets", "partials", "tools", "new-icons", "node_modules"}
PARTIAL_NAMES = ("nav", "footer")
ASSET_PATHS = (
    "assets/css/styles.css",
    "assets/js/site.js",
    "assets/js/demo.js",
    "assets/css/solutions.css",
    "assets/js/solutions.js",
)


def pages():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for name in sorted(filenames):
            if name.endswith(".html"):
                yield os.path.join(dirpath, name)


def load_partial(name):
    with open(os.path.join(PARTIALS, f"{name}.html"), encoding="utf-8") as fh:
        return fh.read().strip("\n")


def indent(block, pad):
    if not pad:
        return block
    return "\n".join(pad + line if line.strip() else line for line in block.split("\n"))


def sync_partial(text, name, body):
    """Replace the region between the sentinels for `name`. No-op if absent."""
    pattern = re.compile(
        r"([ \t]*)(<!-- @shared:%s -->)\n(?:.*?\n)??[ \t]*(<!-- /@shared:%s -->)" % (name, name),
        re.DOTALL,
    )

    def repl(m):
        pad = m.group(1)
        return "%s%s\n%s\n%s%s" % (pad, m.group(2), indent(body, pad), pad, m.group(3))

    return pattern.subn(repl, text)


def asset_versions():
    versions = {}
    for rel in ASSET_PATHS:
        path = os.path.join(ROOT, rel)
        digest = hashlib.md5(open(path, "rb").read()).hexdigest()[:8]
        versions["/" + rel] = digest
    return versions


def stamp_assets(text, versions):
    for url, digest in versions.items():
        text = re.sub(re.escape(url) + r"\?v=[^\"']+", "%s?v=%s" % (url, digest), text)
    return text


def main():
    check = "--check" in sys.argv
    quiet = "--quiet" in sys.argv
    bodies = {name: load_partial(name) for name in PARTIAL_NAMES}
    versions = asset_versions()
    changed, missing = [], []

    for path in pages():
        rel = os.path.relpath(path, ROOT)
        with open(path, encoding="utf-8") as fh:
            original = fh.read()
        text = original
        hits = 0
        for name, body in bodies.items():
            text, n = sync_partial(text, name, body)
            hits += n
        if hits == 0:
            missing.append(rel)
            continue
        text = stamp_assets(text, versions)
        if text != original:
            changed.append(rel)
            if not check:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(text)

    if not quiet or changed:
        for rel in missing:
            print(f"  no sentinels: {rel}")
        for rel in changed:
            print(f"  {'stale' if check else 'synced'}: {rel}")
        print(f"{len(changed)} {'stale' if check else 'updated'}, {len(missing)} without sentinels")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
