# Changelog

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
