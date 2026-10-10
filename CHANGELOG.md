# Changelog

## Batch 6 (October 2026)

### Phase 1: Ozzy's photo, the Insights section, and the first article
- **About:** Ozzy's photo was rebuilt from his original portrait. The previous version had stretched, smeared shoulders from an earlier resize. It is now scaled to match the rest of the team, with plain black edges and no AI-generator watermark.
- **Insights is back,** under its new name.
  - "Insights" appears in the header (desktop and mobile) after About, and in the footer's Company column.
  - The listing page is `/insights/`. Its title is "Insights on AI", with the client's description.
  - The six old Industry Analysis articles were already off the site and out of the sitemap (removed in September). Their old addresses (`/articles/…`) and `/insights.html` now 301-redirect to the new listing instead of the homepage.
- **Labels.** Every article carries one or more labels taken from the service pages (Finance, Trading, Risk Management, Legal, EdTech and so on), plus "AI Usage Best Practices".
  - The listing page shows each article's labels, and the topic buttons filter the list. Links like `/insights/#finance` open it already filtered.
  - Clicking a label on an article goes to that filtered list.
  - Each article ends with up to three related articles. Ones that share a topic label come first, then ones in the same family (e.g. Trading and Risk Management sit under Finance), then ones that share only "AI Usage Best Practices". The related list fills in automatically as the other articles go live.
- **Article layout.** Articles are meant to look different from the service pages. They have:
  - warm paper, with a solid nav bar instead of a dark hero;
  - a very large centered title with a subheader underneath;
  - serif body text in one reading column;
  - an "In this article" list on wide screens;
  - numbered sections;
  - "Did you know?", "Key term" and pull-quote callouts;
  - live product mockups as figures.
  - The figures loop like a GIF but stay sharp: questions type themselves out and numbers count up. They only play while on screen, and visitors with reduced motion turned on see the finished frame.
  - Articles have no dates, view counts, author names or photos, or share buttons.
- **Closing call to action.** Every article ends with the same block: the article's own header and subheader, a service button chosen for that article, a Contact button, and the related articles.
- **First article:** "How Artificial Intelligence Is Used in Finance", at `/insights/how-artificial-intelligence-is-used-in-finance/`. It is labelled Finance and AI Usage Best Practices.
  - It has three animated figures: finding a figure with its sources, a tax vs. FX earnings analysis, and a client allocation chart with a summary.
  - The vertical headings link to their service pages. Banking and Insurance have no service page, so they are not linked.
  - Its button is "Explore Fintech Services", which goes to the Finance page.
  - One copy fix: "when it encounters a gap in its context" is now "when they encounter a gap in their context", to agree with "AI models".
- **Technical SEO**
  - Each article carries BlogPosting JSON-LD: headline, description, url and mainEntityOfPage equal to the canonical, Bespoke AI as author and publisher, section and keywords taken from the labels, and part of the Insights blog. There are deliberately no dates, so Google doesn't show one.
  - The listing page carries Blog JSON-LD. Both page types have breadcrumbs.
  - Insights addresses end with a trailing slash.
  - The six category hubs and `/demos` now use their trailing-slash address everywhere: canonical, social tags, structured data, sitemap, internal links and redirects. Netlify already redirects the bare address to the slash version, so before this change every hub link and its canonical went through an extra redirect.
- **Tooling**
  - New `insights/articles.json` holds every article's titles, description, labels and call to action.
  - New `tools/build-insights.py` stamps the head tags, header, contents list, call to action and related list into each article, and the filters and cards into the listing page. Netlify runs it on deploy, and the local preview server reruns it when the JSON changes.
  - `tools/audit-seo.py` now also checks each article's BlogPosting fields, rejects any date, and requires a trailing slash on folder pages' canonicals.
  - The sitemap has 35 URLs.

### Phase 2: the Forex and Corporate Governance Risk articles
- **"Understanding the Forex Market: Everything You Need to Know About Foreign Exchange"** is at `/insights/understanding-the-forex-market/`, labelled Trading. Its button is "More on Trading", which goes to the Trading page.
  - **Trading screen (the requested looping design).** A watchlist of major, minor and exotic pairs with ticking bid/ask prices (in big-figure/pip style) next to an order blotter. New buy and sell orders arrive and change from Working to Filled.
  - **News tab with "AI Insights" (requested).** An unemployment report, a euro area inflation release and a Bank of Japan decision open one at a time. Each shows a short AI note on how it may move currencies, with up/down chips per pair.
  - **Extras:**
    - a "$9T+ traded per day" callout, sourced to the BIS Triennial Survey 2025;
    - a 24-hour session timeline (Sydney, Tokyo, London, New York) that highlights the London–New York overlap;
    - a "reading a currency pair" explainer;
    - Pip / Spread / Lot glossary tiles;
    - a "Margin" key term with a worked 20:1 example;
    - a "Did you know?" on the 1–2% per-position rule of thumb.
  - **Copy fix:** "if the EUR/USD pair trading at" is now "is trading at".
- **"Types of Risk in Corporate Governance: Building an Enterprise Risk Framework"** is at `/insights/types-of-risk-in-corporate-governance/`, labelled Risk Management. Its button is "Risk Management Services", which goes to the Risk Management page.
  - **Enterprise-wide risk diagram.** Remade from the client's reference graphic, with the same structure and labels: Enterprise-Wide Risk Governance branching into Operational Risk, Treasury & Financial Risk and Liquidity Management. The connectors draw in on scroll, and each branch links to its section. On phones it becomes a vertical rail.
  - **Refinery operational-risk dashboard (requested).** People on site vs. unavailable, processes, systems and security, and external events (an approaching storm, heat, a late delivery). It shows an overall risk level and ends with an AI summary of what to tackle first.
  - **Funding vs. asset liquidity diagram (requested "remake").** On one side, a six-week cash-in/cash-out chart where the running cash position dips below zero, with starting cash, lowest point and recovery week. On the other, a ladder from cash to real estate showing time to turn into cash and the discount if sold in a hurry. The original image never arrived, so this was designed from the article text.
  - **Extras:**
    - the three FX exposures as cards along a short-to-long horizon;
    - a "Forward contract" key term;
    - a "Did you know?" on the quick (acid-test) and cash ratios.
  - Its headings already carry their own numbers, so the automatic "§ 01" section labels are switched off for this article.
- **Shared improvements**
  - A title with a colon now shows the part after the colon as a smaller italic line under the main title. The heading still reads as one title to screen readers and search engines.
  - The figures now hold a steady height for their whole loop, so the article text below them never jumps.
  - Related articles now fill in: Finance, Trading and Risk Management point to one another.
- The sitemap has 37 URLs.

## Batch 5 (October 2026)

### Page titles and search snippets
- All 32 public pages now use the client's new titles and meta descriptions, word for word. The social (og) tags match, and so does each page's structured-data description where it mirrored the old one. Page content and H1s are unchanged.
- Titles no longer end in "| Bespoke AI". Eight of the new titles would go over 60 characters with it, and Google already shows the site name above each result. `tools/audit-seo.py` now checks that a title names the brand no more than once, is under 60 characters, and that descriptions still start with "Bespoke AI".
- Two copy slips in the brief were corrected:
  - The General Services hub title is "Custom AI-Integrated Automation Software" (the brief repeated the Real Estate title).
  - The General Services Document Automation description says "document automation systems" (the brief repeated the Supply Chain ERP text).

### Demos
- The "What you'll see" label and text are gone from every demo card: on the Demos page, Knowledge Base, Client Relations, Workflow Automation, the Real Estate hub, and Commercial Property. The unused styles were removed too.
- The Personal Injury Intake demo is now the **Legal Contact Management System**:
  - New address: `/demos/legal-contact-management-software/`. It was moved, not recreated, and `/demos/crm/` 301-redirects to it.
  - It can now be indexed. The `noindex` tag and the robots.txt block are gone, and it has a canonical link, social tags, breadcrumb structured data, a single H1, and a sitemap entry (now 33 URLs).
  - The cards on the Demos and Client Relations pages read "View an example of a custom legal contact management system that Bespoke AI builds for law firms."
  - Its title is now "Custom Legal Contact Management Software Example", matching the style of the client's other titles.
  - An "About this example" section below the app explains what the system does in plain language and links to Contact and the Legal CRM page. Without it the page had very little text for Google to read.
  - Its card shows `contacts.bespoke.ai` instead of `crm.bespoke.ai`, and its thumbnail files are now named `legal-contact-management.*`.
- Still open: rebuilding the Knowledge Base demo from Figma. The client's link still asks visitors to sign in to Figma, so the design couldn't be viewed.

### Residential Real Estate
- A new "Start from where you are" section sits below the hero. It covers three ways Bespoke AI can help, each with its own small illustration:
  - **Add:** build a new tool next to the current stack.
  - **Replace:** swap out a rented platform.
  - **Upgrade:** connect existing software to AI models through a secure API key.
- A closing line leads into the residential details further down the page and links to Contact.
- On laptop-width screens (about 1000–1200 px) the three cards' headings now line up, and the Replace illustration stacks old above new instead of squeezing side by side.

## Batch 4 (October 2026)

### Brand, titles and search snippets
- The company is called "Bespoke AI" everywhere: nav, footer, body copy, social tags, structured data, image alt text and the demo apps. "Bespoke" as an ordinary adjective is unchanged (e.g. "A bespoke software consultancy…").
- Every page title ends in "| Bespoke AI", and every meta description starts with "Bespoke AI".
- `tools/audit-seo.py` now fails if a title, description or brand mention breaks these rules.

### Solution pages
- Every solution page's hero now says there are no recurring subscription or per-seat fees.
- Every "Bespoke vs. Subscription" section has its own design that suits its page (`assets/css/bvs.css`). The copy is unchanged, and the homepage version is untouched.
- **Trading:**
  - title "Custom Trading Software Development | Bespoke AI" and a matching H1
  - new keyphrases: "Algorithmic trading platform for crypto" and "Custom algo trading software for options"
  - the Forex section is now a live FX desk panel
  - the Algo section is a strategy console with Crypto and Options tabs, plus a new options capability

### New categories
- **Real Estate** (`/custom-real-estate-software/`): a category page, plus Residential Real Estate, Commercial Property Management, Property Feasibility & Development ERP, and Property CRM & Investor Relations.
- **Supply Chains & Logistics** (`/custom-supply-chain-logistics-software/`): a category page, plus 3PL, Freight & Warehouse Management; Supplier & Risk Management; and Supply Chain ERP & Retail.
- The old General Services "Real Estate" page was moved (not deleted) to `/custom-real-estate-software/residential-real-estate`. A permanent (301) redirect from the old URL, and its `.html` form, is in `netlify.toml`.
- All new pages are in the sitemap (32 URLs), the footer and the menu.

### Navigation and footer
- The Solutions menu is now a 3×2 grid centred under its tab: Finance, Legal, Real Estate / EdTech, Supply Chains & Logistics, General Services. There are new icons for Real Estate and Supply Chains. The mobile menu uses the same order.
- The footer shows "Bespoke AI", lists all six categories, and no longer has the "Our Model" link.

### Homepage
- **Hero:** new paragraph text, and an "Our verticals ↓" button.
- **Client scroller:** MDR Law added.
- **What We Build (new):** an interactive orbit of bubbles. The five services ride an inner ring around the core, with one capability each on the outer ring.
  - Hovering, tapping or focusing a bubble pauses everything and opens its explanation.
  - Bubbles can be dragged and flung.
  - Visitors with reduced motion turned on see a still version.
- **Our Verticals:** redesigned and reordered (Legal, Finance, Real Estate, EdTech, Supply Chains & Logistics, General Services), with a "Reach out" line underneath.
- **Bespoke vs. Subscription:** moved above Security, unchanged. The Security section's small text is brighter.
- **How We Deliver:** redesigned as a six-step path, from "Say hi" to "Continually support and patch".
- **Removed:** "Move from AI Access to AI Impact", "Custom Built AI Solutions, by Industry Experts", "What Your Team Walks Away With", and the stats band.
- **Moved:** "A Custom Build in Action" now lives on the Demos page.
- **Closing call to action:** "Interested in learning more?"

### Demos and About
- **Demos:**
  - The Knowledge Base thumbnail was retaken so it fills its frame.
  - The page has a blue hero illustration.
  - It now hosts the featured "A Custom Build in Action" demo.
- **About:**
  - Ozzy's photo is resized to match the rest of the team.
  - Every section shares the same wide layout and left edge.

### Fixes from the final check
- Every page was crawled at 1440, 820, 390, 360 and 320 px wide. There is no horizontal scrolling, and no console errors, failed requests or broken images.
- The intake demo's header no longer overflows on 360 px phones.
- Two 320 px-only overflows were fixed on the Documentation Automation and Accounting pages.

### Follow-up polish (after the batch 4 review)
- **Titles and snippets fit in Google's results.** Eight titles were long enough that Google would cut off the "| Bespoke AI" ending. They are now 60 characters or fewer. Nineteen snippets were trimmed to 160 characters or fewer. `tools/audit-seo.py` now enforces both limits.
- **Homepage title and snippet** now reflect all six verticals and the new hero message: "Custom AI & Software Development Consultancy | Bespoke AI".
- **Brand images say "Bespoke AI".**
  - New share image (`assets/img/bespoke-ai-og.jpg`, 1200×630) and Google logo (`assets/img/bespoke-ai-logo.png`), built from the site's brain mark and header wordmark. The old image read "bespoke".
  - Pages now also tell X/Twitter to show the large share card.
  - The real estate, injury intake, AI call intake and hotel demo thumbnails were retaken. They were captured before the rename and showed "Bespoke" and "Bespoke demos".
- **Site name:** removed "getbespoke.ai" as an alternate site name, so Google is steered toward "Bespoke AI".
- **Redirect:** the original `/general-services/real-estate` address now goes straight to Residential Real Estate in one step instead of two.
- **Solutions menu:** slightly wider, so "Supply Chains & Logistics" and "3PL, Freight & Warehouse Management" no longer wrap.
- **Supplier & Risk Management:** the five Bespoke vs. Subscription cards are now laid out three, then two, instead of five narrow columns.
- **Real Estate category page:** now features the interactive real estate demo.
- **Homepage Security:** the encryption line under the grid is brighter and easier to read.
- **About:**
  - Douglas's photo is resized to match the rest of the team.
  - Every portrait has alt text with the person's name.
  - TJ's photo file is about half its old size.
- `tools/audit-clusters.py` now checks the Real Estate and Supply Chains & Logistics categories too.

### Still open
- Google Voice click-to-call for the Contact page, the footer and the structured data: waiting on the number.
- Sam's About photo: waiting on a new image.
- If there is an official "Bespoke AI" logo file, it should replace the generated share image and logo.
