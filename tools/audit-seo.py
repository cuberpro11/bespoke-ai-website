#!/usr/bin/env python3
"""Optional: per-page SEO audit (H1, unique title/description, canonical, JSON-LD).

Also enforces the brand rules on every page, noindex pages included:
titles end in "| Bespoke AI", meta descriptions start with "Bespoke AI",
both stay short enough that Google shows them whole (so the brand is never
cut off), and the company is never called plain "Bespoke" ("bespoke" the adjective,
e.g. "Bespoke build" or "Bespoke CRM solutions", is fine).

Not used to serve or deploy the site.

    python3 tools/audit-seo.py
"""
import html
import os
import re
import sys
from collections import defaultdict

BRAND = "Bespoke AI"
TITLE_SUFFIX = " | " + BRAND
# Google truncates longer titles and snippets, which would cut the brand off.
TITLE_MAX, DESC_MAX = 60, 160
# "Bespoke" used as the company: before a verb, a possessive, or on its own
# (end of a tag, sentence, or label). Adjective uses are followed by a noun.
BARE_BRAND = re.compile(
    r"\bBespoke\b(?! AI)(?='s\b|\s+(?:is|was|builds|has|helps|takes|will|engineers|"
    r"costs|team|demos?)\b|[<.,;:!?\"]|\s+[\u2014\u2013])"
    r"|About Bespoke\b(?! AI)"
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "assets", "partials", "tools", "new-icons", "node_modules"}


def pages():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for name in sorted(filenames):
            if name.endswith(".html"):
                yield os.path.join(dirpath, name)


def text(tag_html):
    return re.sub(r"<[^>]+>", "", tag_html).strip()


def main():
    problems = []
    titles, descs = defaultdict(list), defaultdict(list)
    rows = []

    for path in pages():
        rel = os.path.relpath(path, ROOT)
        src = open(path, encoding="utf-8").read()

        brand_title = re.search(r"<title>(.*?)</title>", src, re.S)
        brand_title = text(brand_title.group(1)) if brand_title else ""
        if not brand_title.endswith(TITLE_SUFFIX) or brand_title.count(BRAND) > 1:
            problems.append(f"{rel}: title {brand_title!r} must end in {TITLE_SUFFIX!r} (once)")
        if len(html.unescape(brand_title)) > TITLE_MAX:
            problems.append(f"{rel}: title {len(html.unescape(brand_title))} chars (max {TITLE_MAX})")
        brand_desc = re.search(r'<meta name="description" content="(.*?)">', src, re.S)
        if brand_desc and not brand_desc.group(1).startswith(BRAND):
            problems.append(f"{rel}: meta description must start with {BRAND!r}")
        if brand_desc and len(html.unescape(brand_desc.group(1))) > DESC_MAX:
            problems.append(f"{rel}: meta description {len(html.unescape(brand_desc.group(1)))} chars (max {DESC_MAX})")
        for m in BARE_BRAND.finditer(src):
            line = src.count("\n", 0, m.start()) + 1
            problems.append(f"{rel}:{line}: company called plain 'Bespoke' -> {BRAND!r}")

        if 'content="noindex' in src:
            continue

        h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", src, re.S)
        title = re.search(r"<title>(.*?)</title>", src, re.S)
        desc = re.search(r'<meta name="description" content="(.*?)">', src, re.S)
        canon = re.search(r'<link rel="canonical" href="(.*?)">', src)
        ld = re.findall(r'"@type":\s*"([A-Za-z]+)"', src)

        title = text(title.group(1)) if title else None
        desc = desc.group(1).strip() if desc else None

        if len(h1s) != 1:
            problems.append(f"{rel}: {len(h1s)} <h1> tags (want exactly 1)")
        if not title:
            problems.append(f"{rel}: no <title>")
        if not desc:
            problems.append(f"{rel}: no meta description")
        elif not (70 <= len(desc) <= 320):
            problems.append(f"{rel}: meta description {len(desc)} chars (want 70-320)")
        if not canon:
            problems.append(f"{rel}: no canonical")
        if "BreadcrumbList" not in ld and rel.count(os.sep) >= 1 and not rel.startswith("articles"):
            problems.append(f"{rel}: no BreadcrumbList JSON-LD")

        if title:
            titles[title].append(rel)
        if desc:
            descs[desc].append(rel)
        rows.append((rel, text(h1s[0]) if h1s else "-", title))

    for t, files in titles.items():
        if len(files) > 1:
            problems.append(f"duplicate <title> {t!r}: {', '.join(files)}")
    for d, files in descs.items():
        if len(files) > 1:
            problems.append(f"duplicate description: {', '.join(files)}")

    for rel, h1, title in rows:
        print(f"  {rel:52} H1={h1[:44]!r}")
    print(f"\n{len(rows)} indexable pages")
    if problems:
        print(f"\n{len(problems)} problems:")
        for p in problems:
            print(f"  ! {p}")
        sys.exit(1)
    print("no problems")


if __name__ == "__main__":
    main()
