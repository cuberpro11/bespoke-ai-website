#!/usr/bin/env python3
"""Optional: verify solution-cluster internal links.

Not used to serve or deploy the site. Run after adding a page.

    python3 tools/audit-clusters.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUBS = ["/legal", "/finance", "/edtech", "/general-services"]
CROSS_PAIRS = [
    ("/legal/documentation-automation", "/general-services/document-automation"),
    ("/legal/client-relations-management", "/general-services/automated-email-response"),
    ("/finance/compliance", "/legal/workflow-automation"),
]


def path_for(url):
    if url == "/":
        return os.path.join(ROOT, "index.html")
    local = os.path.join(ROOT, url.lstrip("/"))
    return os.path.join(local, "index.html") if os.path.isdir(local) else local + ".html"


def links(url):
    """Links in the page's own <main>, excluding the shared nav and footer."""
    with open(path_for(url), encoding="utf-8") as fh:
        s = fh.read()
    if '<main id="main">' in s:
        s = s.split('<main id="main">')[1].split("</main>")[0]
    return {m.split("#")[0] for m in re.findall(r'href="(/[^"]*)"', s)}


def main():
    problems = []
    children = {}
    for hub in HUBS:
        d = os.path.join(ROOT, hub.lstrip("/"))
        children[hub] = sorted(
            hub + "/" + f[:-5] for f in os.listdir(d)
            if f.endswith(".html") and f != "index.html")

    print("HUB -> CHILDREN")
    for hub, kids in children.items():
        have = links(hub)
        missing = [k for k in kids if k not in have]
        print(f"  {hub:20} {len(kids) - len(missing)}/{len(kids)} linked"
              + (f"   MISSING {missing}" if missing else ""))
        if missing:
            problems.append(f"{hub} does not link to {missing}")

    print("\nCHILD -> HUB + RELATED")
    for hub, kids in children.items():
        for k in kids:
            have = links(k)
            sibs = [x for x in kids if x != k and x in have]
            # a lone child has no siblings to link to, so it leans on
            # cross-cluster links to the other hubs instead
            others = [h for h in HUBS if h != hub and h in have]
            reach = len(sibs) + len(others)
            ok = hub in have and reach >= 2
            print(f"  {k:46} hub={'y' if hub in have else 'N'} "
                  f"siblings={len(sibs)} other-hubs={len(others)}"
                  + ("" if ok else "   <-- WEAK"))
            if hub not in have:
                problems.append(f"{k} does not link back to {hub}")
            elif reach < 2:
                problems.append(f"{k} reaches only {reach} related pages")

    all_pages = HUBS + [k for v in children.values() for k in v]
    home = links("/")
    miss = [p for p in all_pages if p not in home]
    print(f"\nHOMEPAGE -> {len(all_pages) - len(miss)}/{len(all_pages)} solution pages"
          + (f"   MISSING {miss}" if miss else ""))
    if miss:
        problems.append(f"homepage missing {miss}")

    with open(os.path.join(ROOT, "partials/footer.html"), encoding="utf-8") as fh:
        foot = {m.split("#")[0] for m in re.findall(r'href="(/[^"]*)"', fh.read())}
    fmiss = [h for h in HUBS if h not in foot]
    print(f"FOOTER   -> {len(HUBS) - len(fmiss)}/{len(HUBS)} hubs"
          + (f"   MISSING {fmiss}" if fmiss else ""))
    if fmiss:
        problems.append(f"footer missing {fmiss}")

    print("\nCROSS-CLUSTER PAIRS")
    for a, b in CROSS_PAIRS:
        both = b in links(a) and a in links(b)
        print(f"  {'both ways' if both else 'INCOMPLETE'}  {a} <-> {b}")
        if not both:
            problems.append(f"cross-link {a} <-> {b} incomplete")

    if problems:
        print(f"\n{len(problems)} problems:")
        for p in problems:
            print("  !", p)
        sys.exit(1)
    print("\ncluster structure complete — no problems")


if __name__ == "__main__":
    main()
