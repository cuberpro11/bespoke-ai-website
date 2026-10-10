#!/usr/bin/env python3
"""Stamp the Insights hub and articles from insights/articles.json.

articles.json is the source of truth for every article's title, SEO title,
description, labels and closing call to action. Each page marks the regions
this script owns with sentinel comments (same idea as sync-shared.py):

    insights/<slug>/index.html   @insights:head    title, meta, canonical, social tags, BlogPosting JSON-LD
                                 @insights:header  label chips, H1 and dek
                                 @insights:toc     "In this article" list, built from the body's <h2 id>
                                 @insights:end     call to action and related articles
    insights/index.html          @insights:head    title, meta, Blog JSON-LD
                                 @insights:filters label filter chips
                                 @insights:cards   one card per article

Write the article body by hand between the header and the end block; edit
everything else in articles.json.

Related articles: other articles sharing a topic label come first, then ones
in the same family (Trading and Risk Management sit under Finance), then ones
that only share a generic label such as AI Usage Best Practices. Ties go to
the articles that follow this one on the hub, wrapping around.

Articles carry no dates, visible or in JSON-LD, so they stay evergreen.

    python3 tools/build-insights.py            # write
    python3 tools/build-insights.py --check    # exit 1 if anything is stale
    python3 tools/build-insights.py --quiet    # silent unless something changed
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "insights")
BASE = "https://getbespoke.ai"
HUB = BASE + "/insights/"
ORG = BASE + "/#organization"
OG_IMAGE = BASE + "/assets/img/bespoke-ai-og.jpg"
RELATED_MAX = 3
HUB_TITLE = "Insights on AI"
HUB_DESC = ("Bespoke AI shares insights on how law firms, financial institutions, "
            "and educational institutions can best utilize AI.")

ARROW = ('<svg class="arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<path d="M5 12h14M13 6l6 6-6 6"/></svg>')


def esc(s):
    return html.escape(s, quote=True)


def load():
    with open(os.path.join(DIR, "articles.json"), encoding="utf-8") as fh:
        data = json.load(fh)
    labels, articles = data["labels"], data["articles"]
    for a in articles:
        for lid in a["labels"]:
            if lid not in labels:
                sys.exit(f"articles.json: {a['slug']} uses unknown label {lid!r}")
    return labels, articles


def url_of(a):
    return f"{HUB}{a['slug']}/"


# ------------------------------------------------------------------ related --

def related(a, articles, labels):
    def family(lid):
        return labels[lid].get("parent") or lid

    mine = [l for l in a["labels"] if not labels[l].get("generic")]
    mine_generic = [l for l in a["labels"] if labels[l].get("generic")]
    fams = {family(l) for l in mine}
    me = articles.index(a)
    scored = []
    for i, b in enumerate(articles):
        if b is a:
            continue
        theirs = [l for l in b["labels"] if not labels[l].get("generic")]
        score = 0
        score += 100 * len(set(mine) & set(theirs))
        score += 10 * len(fams & {family(l) for l in theirs})
        score += 1 * len(set(mine_generic) & set(b["labels"]))
        if score:
            # ties rotate from this article's own position, so a broad label
            # like AI Usage Best Practices spreads links across every article
            scored.append((-score, (i - me) % len(articles), b))
    scored.sort(key=lambda t: (t[0], t[1]))
    return [b for _, _, b in scored[:RELATED_MAX]]


# ----------------------------------------------------------------- snippets --

def chips(a, labels, cls="ins-chip", link=True):
    out = []
    for lid in a["labels"]:
        name = esc(labels[lid]["name"])
        if link:
            out.append(f'<a class="{cls}" href="/insights/#{lid}">{name}</a>')
        else:
            out.append(f'<span class="{cls}">{name}</span>')
    return out


def org_node():
    return {
        "@type": "Organization",
        "@id": ORG,
        "name": "Bespoke AI",
        "url": BASE + "/",
        "email": "contact@getbespoke.ai",
        "logo": BASE + "/assets/img/bespoke-ai-logo.png",
    }


def meta_block(title, desc, url, og_type, graph):
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=2, ensure_ascii=False)
    return "\n".join([
        f"<title>{esc(title)}</title>",
        f'<meta name="description" content="{esc(desc)}">',
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(desc)}">',
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:url" content="{url}">',
        '<meta property="og:site_name" content="Bespoke AI">',
        '<meta property="og:locale" content="en_US">',
        f'<meta property="og:image" content="{OG_IMAGE}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="Bespoke AI">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<script type="application/ld+json">',
        ld,
        "</script>",
    ])


def article_head(a, labels):
    url = url_of(a)
    names = [labels[l]["name"] for l in a["labels"]]
    graph = [
        org_node(),
        {
            "@type": "BlogPosting",
            "@id": url + "#article",
            "headline": a["title"],
            "description": a["description"],
            "url": url,
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "image": OG_IMAGE,
            "author": {"@id": ORG},
            "publisher": {"@id": ORG},
            "articleSection": names[0],
            "keywords": names,
            "inLanguage": "en-US",
            "isPartOf": {"@type": "Blog", "@id": HUB + "#blog", "name": "Insights", "url": HUB},
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Insights", "item": HUB},
                {"@type": "ListItem", "position": 3, "name": a["title"], "item": url},
            ],
        },
    ]
    return meta_block(a["seo_title"], a["description"], url, "article", graph)


def nowrap_hyphens(text):
    """Keep hyphenated words ("AI-Generated") whole so a huge title never breaks at the hyphen."""
    return re.sub(r"(\S+-\S+)", r'<span class="ins-nowrap">\1</span>', text)


def article_header(a, labels):
    # "Main title: subtitle" renders the subtitle as a smaller second line
    main, colon, sub = a["title"].partition(": ")
    # the colon stays in the text (hidden visually) so the heading still reads as one title
    title = nowrap_hyphens(esc(main)) + (f'<span class="ins-title__colon">: </span><span class="ins-title__sub">{esc(sub)}</span>' if colon else "")
    lines = [
        '<nav class="ins-crumbs" aria-label="Breadcrumb"><a href="/insights/">Insights</a></nav>',
        f'<p class="ins-chips">{"".join(chips(a, labels))}</p>',
        f'<h1 class="ins-title">{title}</h1>',
    ]
    if a.get("dek"):
        lines.append(f'<p class="ins-dek">{esc(a["dek"])}</p>')
    return "\n".join(lines)


H2 = re.compile(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', re.S)


def article_toc(src):
    body = src.split("<!-- /@insights:header -->", 1)[-1].split("<!-- @insights:end -->", 1)[0]
    items = [(i, re.sub(r"<[^>]+>", "", t).strip()) for i, t in H2.findall(body)]
    lines = ['<p class="ins-toc__title">In this article</p>', '<ol class="ins-toc__list">']
    lines += [f'  <li><a href="#{i}">{t}</a></li>' for i, t in items]
    lines.append("</ol>")
    return "\n".join(lines)


def article_end(a, articles, labels):
    c = a["cta"]
    rel = related(a, articles, labels)
    lines = [
        '<section class="ins-end" aria-labelledby="ins-end-title">',
        '  <div class="ins-end__cta">',
        '    <p class="ins-end__kicker">Work with Bespoke AI</p>',
        f'    <h2 class="ins-end__title" id="ins-end-title">{esc(c["heading"])}</h2>',
        *[f'    <p class="ins-end__body">{para}</p>' for para in c["body"].split("\n\n")],
        '    <div class="ins-end__actions">',
        f'      <a class="btn btn--primary" href="{c["primary"]["href"]}">{esc(c["primary"]["text"])} {ARROW}</a>',
        f'      <a class="btn btn--ghost" href="{c["secondary"].get("href", "/contact")}">{esc(c["secondary"]["text"])}</a>',
        "    </div>",
        "  </div>",
    ]
    if rel:
        lines += [
            '  <div class="ins-end__related">',
            '    <h2 class="ins-end__rel-title">Related insights</h2>',
            '    <ul class="ins-rel">',
        ]
        for b in rel:
            lines += [
                '      <li class="ins-rel__item">',
                f'        <a class="ins-rel__link" href="{url_of(b).replace(BASE, "")}">',
                f'          <span class="ins-rel__chips">{"".join(chips(b, labels, "ins-chip ins-chip--sm", False))}</span>',
                f'          <span class="ins-rel__title">{nowrap_hyphens(esc(b["title"]))}</span>',
                f'          <span class="ins-rel__more">Read the article {ARROW}</span>',
                "        </a>",
                "      </li>",
            ]
        lines += ["    </ul>", "  </div>"]
    lines.append("</section>")
    return "\n".join(lines)


def hub_head(articles):
    graph = [
        org_node(),
        {
            "@type": "Blog",
            "@id": HUB + "#blog",
            "name": "Insights",
            "headline": HUB_TITLE,
            "description": HUB_DESC,
            "url": HUB,
            "publisher": {"@id": ORG},
            "inLanguage": "en-US",
            "blogPost": [
                {"@type": "BlogPosting", "headline": a["title"], "url": url_of(a), "@id": url_of(a) + "#article"}
                for a in articles
            ],
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Insights", "item": HUB},
            ],
        },
    ]
    return meta_block(HUB_TITLE, HUB_DESC, HUB, "website", graph)


def hub_filters(articles, labels):
    counts = {}
    for a in articles:
        for l in a["labels"]:
            counts[l] = counts.get(l, 0) + 1
    used = [l for l in labels if l in counts]
    out = [f'<button class="ins-filter" type="button" data-filter="all" aria-pressed="true">All <span>{len(articles)}</span></button>']
    for l in used:
        out.append(f'<button class="ins-filter" type="button" data-filter="{l}" aria-pressed="false">'
                   f'{esc(labels[l]["name"])} <span>{counts[l]}</span></button>')
    return "\n".join(out)


def hub_cards(articles, labels):
    out = []
    for n, a in enumerate(articles, 1):
        out += [
            f'<li class="ins-card" data-labels="{" ".join(a["labels"])}">',
            f'  <a class="ins-card__link" href="/insights/{a["slug"]}/">',
            f'    <span class="ins-card__n">{n:02d}</span>',
            f'    <span class="ins-card__chips">{"".join(chips(a, labels, "ins-chip ins-chip--sm", False))}</span>',
            f'    <h2 class="ins-card__title">{nowrap_hyphens(esc(a["title"]))}</h2>',
            f'    <p class="ins-card__blurb">{esc(a["blurb"])}</p>',
            f'    <span class="ins-card__more">Read the article {ARROW}</span>',
            "  </a>",
            "</li>",
        ]
    return "\n".join(out)


# ------------------------------------------------------------------ stamping --

def stamp(text, name, body):
    pattern = re.compile(
        r"([ \t]*)(<!-- @insights:%s -->)\n(?:.*?\n)??[ \t]*(<!-- /@insights:%s -->)" % (name, name),
        re.DOTALL,
    )

    def repl(m):
        pad = m.group(1)
        block = "\n".join(pad + l if l.strip() else l for l in body.split("\n"))
        return "%s%s\n%s\n%s%s" % (pad, m.group(2), block, pad, m.group(3))

    out, n = pattern.subn(repl, text)
    if n != 1:
        raise SystemExit(f"missing or duplicate @insights:{name} sentinels")
    return out


def main():
    check = "--check" in sys.argv
    quiet = "--quiet" in sys.argv
    labels, articles = load()
    changed = []

    slugs = {a["slug"] for a in articles}
    on_disk = {d for d in os.listdir(DIR) if os.path.isdir(os.path.join(DIR, d))}
    for d in sorted(on_disk - slugs):
        sys.exit(f"insights/{d}/ has no entry in articles.json")

    jobs = [(os.path.join(DIR, "index.html"), None)]
    jobs += [(os.path.join(DIR, a["slug"], "index.html"), a) for a in articles]
    for path, a in jobs:
        rel = os.path.relpath(path, ROOT)
        if not os.path.isfile(path):
            sys.exit(f"{rel} is listed in articles.json but does not exist")
        with open(path, encoding="utf-8") as fh:
            original = fh.read()
        try:
            if a is None:
                text = stamp(original, "head", hub_head(articles))
                text = stamp(text, "filters", hub_filters(articles, labels))
                text = stamp(text, "cards", hub_cards(articles, labels))
            else:
                text = stamp(original, "head", article_head(a, labels))
                text = stamp(text, "header", article_header(a, labels))
                text = stamp(text, "toc", article_toc(text))
                text = stamp(text, "end", article_end(a, articles, labels))
        except SystemExit as e:
            sys.exit(f"{rel}: {e}")
        if text != original:
            changed.append(rel)
            if not check:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(text)

    if not quiet or changed:
        for rel in changed:
            print(f"  {'stale' if check else 'stamped'}: {rel}")
        print(f"insights: {len(articles)} articles, {len(changed)} {'stale' if check else 'updated'}")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
