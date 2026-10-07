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

### Still open
- Google Voice click-to-call for the Contact page, the footer and the structured data: waiting on the number.
- Sam's About photo: waiting on a new image.
- Douglas's About photo is also tightly cropped; it could be resized the same way as Ozzy's.
- The General Services category page still uses the older "How We Deliver" timeline.
