/* ==========================================================================
   BESPOKE — Document automation platform demo
   Corpus, clause library, intake records and scripted answers.
   ========================================================================== */

window.DOC_DATA = (function () {
  "use strict";

  /* --------------------------------------------------------------- corpus -- */

  var LIBRARY = [
    { id: "D-101", name: "Engagement Letter Policy (2026 revision)", kind: "Policy",   owner: "General Counsel",   pages: 14,  updated: "Feb 02, 2026", status: "indexed" },
    { id: "D-102", name: "Master Services Agreement — standard form",  kind: "Template", owner: "Commercial team",   pages: 31,  updated: "Jan 28, 2026", status: "indexed" },
    { id: "D-103", name: "Client Intake Handbook",                     kind: "Manual",   owner: "Operations",        pages: 62,  updated: "Jan 19, 2026", status: "indexed" },
    { id: "D-104", name: "Conflicts Check Procedure",                  kind: "Procedure",owner: "Risk & Compliance", pages: 9,   updated: "Dec 11, 2025", status: "indexed" },
    { id: "D-105", name: "Data Processing Addendum — EU/UK",           kind: "Template", owner: "Privacy",           pages: 18,  updated: "Feb 09, 2026", status: "indexed" },
    { id: "D-106", name: "Fee Arrangements & Billing Guidelines",      kind: "Policy",   owner: "Finance",           pages: 22,  updated: "Nov 30, 2025", status: "indexed" },
    { id: "D-107", name: "Retention & Disposal Schedule",              kind: "Policy",   owner: "Records",           pages: 11,  updated: "Oct 21, 2025", status: "indexed" },
    { id: "D-108", name: "Outside Counsel Guidelines — Northwind",     kind: "Client",   owner: "Commercial team",   pages: 27,  updated: "Feb 11, 2026", status: "indexed" },
    { id: "D-109", name: "Matter Opening Wiki",                        kind: "Wiki",     owner: "Operations",        pages: 48,  updated: "Feb 14, 2026", status: "indexing" },
    { id: "D-110", name: "Signature Authority Matrix",                 kind: "Policy",   owner: "General Counsel",   pages: 6,   updated: "Sep 08, 2025", status: "indexed" },
    { id: "D-111", name: "NDA — mutual, standard form",                kind: "Template", owner: "Commercial team",   pages: 7,   updated: "Jan 06, 2026", status: "indexed" },
    { id: "D-112", name: "Escalation Playbook — disputed invoices",    kind: "Manual",   owner: "Finance",           pages: 16,  updated: "Dec 02, 2025", status: "indexed" }
  ];

  var KINDS = ["All", "Policy", "Template", "Manual", "Procedure", "Wiki", "Client"];

  /* --------------------------------------------------------- scripted asks -- */

  var SUGGESTED = [
    "What is our standard payment term, and when can it be changed?",
    "Who can sign a master services agreement above $250,000?",
    "How long do we retain closed client files?",
    "What has to happen before a new matter can be opened?"
  ];

  var ANSWERS = {
    "What is our standard payment term, and when can it be changed?": {
      body: [
        { text: "The firm's standard payment term is net 30 days from the date of invoice.", cite: 1 },
        { text: "Terms may be extended to net 45 only with written approval from the Finance Director, and to net 60 only by the General Counsel.", cite: 2 },
        { text: "Where a client's own outside counsel guidelines specify a longer term, those guidelines govern for that client — Northwind, for example, is contracted at net 45.", cite: 3 }
      ],
      sources: [
        { n: 1, doc: "Fee Arrangements & Billing Guidelines", loc: "§4.1, p. 8",  quote: "Invoices are payable net thirty (30) days from the date of issue unless otherwise agreed in writing." },
        { n: 2, doc: "Fee Arrangements & Billing Guidelines", loc: "§4.3, p. 9",  quote: "Extensions to net forty-five (45) require the written approval of the Finance Director. Terms beyond net forty-five (45) require the approval of the General Counsel." },
        { n: 3, doc: "Outside Counsel Guidelines — Northwind", loc: "§7.2, p. 14", quote: "Northwind shall pay all undisputed invoices within forty-five (45) days of receipt." }
      ]
    },
    "Who can sign a master services agreement above $250,000?": {
      body: [
        { text: "Agreements with a total contract value above $250,000 require signature by a member of the Executive Committee.", cite: 1 },
        { text: "Between $50,000 and $250,000, a Practice Group Leader may sign.", cite: 1 },
        { text: "Regardless of value, any MSA that varies the standard limitation of liability must also be countersigned by the General Counsel before execution.", cite: 2 }
      ],
      sources: [
        { n: 1, doc: "Signature Authority Matrix", loc: "Table 2, p. 3", quote: "$50,000–$250,000: Practice Group Leader. Above $250,000: Executive Committee member." },
        { n: 2, doc: "Master Services Agreement — standard form", loc: "Drafting note to §11, p. 22", quote: "Any departure from the liability cap in §11.2 requires General Counsel countersignature prior to execution." }
      ]
    },
    "How long do we retain closed client files?": {
      body: [
        { text: "Closed client files are retained for seven years from the date of matter closure, after which they are destroyed under the standard disposal process.", cite: 1 },
        { text: "Files containing original wills, deeds or other instruments of title are retained indefinitely and are excluded from routine disposal.", cite: 2 },
        { text: "A litigation hold suspends disposal entirely until the hold is lifted in writing by Risk & Compliance.", cite: 3 }
      ],
      sources: [
        { n: 1, doc: "Retention & Disposal Schedule", loc: "§2.1, p. 3",  quote: "Closed matter files shall be retained for a period of seven (7) years from the date of closure." },
        { n: 2, doc: "Retention & Disposal Schedule", loc: "§2.4, p. 5",  quote: "Original testamentary instruments, deeds and instruments of title shall be retained indefinitely." },
        { n: 3, doc: "Retention & Disposal Schedule", loc: "§5.2, p. 9",  quote: "No file subject to a litigation hold may be destroyed until the hold is released in writing by Risk & Compliance." }
      ]
    },
    "What has to happen before a new matter can be opened?": {
      body: [
        { text: "A conflicts check must be run and cleared against both the client and all named adverse parties before any substantive work begins.", cite: 1 },
        { text: "The client must have a signed engagement letter on file that states the scope, the fee basis and the responsible partner.", cite: 2 },
        { text: "Where the client is an entity, beneficial ownership has to be verified and recorded in the matter record.", cite: 3 }
      ],
      sources: [
        { n: 1, doc: "Conflicts Check Procedure",  loc: "§1.2, p. 2",  quote: "No substantive work may be undertaken until a conflicts search has been run and cleared for the client and each adverse party." },
        { n: 2, doc: "Engagement Letter Policy (2026 revision)", loc: "§3, p. 5", quote: "Every matter shall be supported by a countersigned engagement letter identifying scope, fee basis and responsible partner." },
        { n: 3, doc: "Client Intake Handbook", loc: "§6.4, p. 31", quote: "For entity clients, beneficial ownership must be verified and recorded prior to matter opening." }
      ]
    }
  };

  var FALLBACK = {
    body: [
      { text: "I could not find a passage in the indexed corpus that answers that directly, so I am not going to guess.", cite: 0 },
      { text: "Try one of the suggested questions, or rephrase using the vocabulary the source documents use — the index covers engagement letters, conflicts, fees and billing, retention, signature authority, and the standard MSA, NDA and DPA forms.", cite: 0 }
    ],
    sources: []
  };

  /* -------------------------------------------------------------- assemble -- */

  var INTAKE = {
    matter: "M-2026-0412",
    client: "Northwind Logistics, Inc.",
    entity: "Delaware corporation",
    contact: "Dana Whitfield, VP Operations",
    email: "d.whitfield@northwind-logistics.com",
    requested: "Master Services Agreement",
    value: "$310,000 / 24 months",
    jurisdiction: "New York",
    notes: "Call notes, 14 Feb: client wants the services schedule to cover two named facilities, not the whole network. They flagged that their procurement team will not accept an uncapped indemnity. Renewal should be annual, not evergreen. They asked whether we can match the 45-day payment term in their outside counsel guidelines.",
    stages: [
      { key: "intake",   label: "Intake parsed",      note: "12 fields extracted from the call notes and the intake form" },
      { key: "conflict", label: "Conflicts cleared",  note: "No hits against Northwind or its named affiliates" },
      { key: "clauses",  label: "Clauses selected",   note: "6 clauses matched from the library, 2 flagged for review" },
      { key: "draft",    label: "Draft assembled",    note: "Variables populated from the matter record" },
      { key: "review",   label: "Review complete",    note: "2 issues raised, 0 blocking" }
    ]
  };

  var SELECTED_CLAUSES = [
    { id: "CL-014", title: "Term and renewal",            why: "Client asked for annual renewal rather than evergreen — matched the annual variant.", risk: "standard" },
    { id: "CL-021", title: "Fees and payment",            why: "Net 45 selected to match Northwind's outside counsel guidelines §7.2.", risk: "review" },
    { id: "CL-033", title: "Limitation of liability",     why: "Standard cap at 12 months' fees. Departure would need General Counsel countersignature.", risk: "standard" },
    { id: "CL-041", title: "Indemnity — capped",          why: "Client will not accept an uncapped indemnity; capped variant substituted.", risk: "review" },
    { id: "CL-052", title: "Services schedule — by site",  why: "Scope limited to the two named facilities from the call notes.", risk: "standard" },
    { id: "CL-067", title: "Governing law — New York",     why: "Matches the jurisdiction recorded on intake.", risk: "standard" }
  ];

  var ISSUES = [
    { level: "warn", title: "Payment term departs from the firm standard",
      detail: "Net 45 is outside the standard net 30. The Fee Arrangements policy §4.3 requires written approval from the Finance Director.",
      action: "Route to Finance Director" },
    { level: "warn", title: "Signature authority threshold exceeded",
      detail: "Total contract value of $310,000 is above the $250,000 threshold, so an Executive Committee member must sign rather than the Practice Group Leader.",
      action: "Reassign signatory" }
  ];

  var DRAFT = [
    { h: "Master Services Agreement" },
    { p: "This Master Services Agreement (the \"Agreement\") is entered into as of {{EffectiveDate}} by and between {{ClientName}}, a {{ClientEntity}} (\"Client\"), and the Firm." },
    { h2: "1. Term and renewal" },
    { p: "This Agreement shall commence on the Effective Date and continue for an initial term of {{InitialTerm}}. Thereafter it shall renew for successive periods of one (1) year unless either party gives written notice of non-renewal at least sixty (60) days prior to the end of the then-current term." },
    { h2: "2. Services" },
    { p: "The Firm shall provide the services described in the Services Schedule, which for the avoidance of doubt is limited to the facilities identified therein and does not extend to any other site operated by Client." },
    { h2: "3. Fees and payment" },
    { p: "Client shall pay all undisputed invoices within forty-five (45) days of receipt.", flag: "Departs from the standard net 30 term" },
    { h2: "4. Limitation of liability" },
    { p: "Each party's aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid by Client in the twelve (12) months preceding the event giving rise to the claim." },
    { h2: "5. Indemnity" },
    { p: "Each party shall indemnify the other against third-party claims arising from its own negligence or wilful misconduct, provided that such indemnity shall be subject to the limitation set out in Section 4.", flag: "Capped variant substituted at client request" },
    { h2: "6. Governing law" },
    { p: "This Agreement shall be governed by and construed in accordance with the laws of the State of New York." }
  ];

  var VARS = [
    ["{{ClientName}}",   "Northwind Logistics, Inc."],
    ["{{ClientEntity}}", "Delaware corporation"],
    ["{{EffectiveDate}}","March 1, 2026"],
    ["{{InitialTerm}}",  "twenty-four (24) months"]
  ];

  /* -------------------------------------------------------- clause library -- */

  var CLAUSES = [
    { id: "CL-014", title: "Term and renewal",          category: "Commercial", version: "v4",  risk: "standard", reviewed: "Jan 28, 2026", uses: 184 },
    { id: "CL-021", title: "Fees and payment",          category: "Commercial", version: "v7",  risk: "standard", reviewed: "Nov 30, 2025", uses: 212 },
    { id: "CL-033", title: "Limitation of liability",   category: "Risk",       version: "v6",  risk: "high",     reviewed: "Jan 28, 2026", uses: 198 },
    { id: "CL-041", title: "Indemnity — capped",        category: "Risk",       version: "v3",  risk: "high",     reviewed: "Feb 02, 2026", uses: 76 },
    { id: "CL-042", title: "Indemnity — uncapped",      category: "Risk",       version: "v2",  risk: "high",     reviewed: "Feb 02, 2026", uses: 21 },
    { id: "CL-052", title: "Services schedule — by site",category: "Commercial",version: "v2",  risk: "standard", reviewed: "Jan 12, 2026", uses: 44 },
    { id: "CL-058", title: "Confidentiality — mutual",  category: "Commercial", version: "v5",  risk: "standard", reviewed: "Jan 06, 2026", uses: 301 },
    { id: "CL-061", title: "Data processing — EU/UK",   category: "Privacy",    version: "v4",  risk: "high",     reviewed: "Feb 09, 2026", uses: 88 },
    { id: "CL-067", title: "Governing law — New York",  category: "Jurisdiction",version: "v3", risk: "standard", reviewed: "Sep 08, 2025", uses: 264 },
    { id: "CL-068", title: "Governing law — Delaware",  category: "Jurisdiction",version: "v3", risk: "standard", reviewed: "Sep 08, 2025", uses: 97 },
    { id: "CL-074", title: "Termination for convenience",category: "Commercial",version: "v4",  risk: "standard", reviewed: "Dec 11, 2025", uses: 156 },
    { id: "CL-081", title: "Assignment and change of control", category: "Risk", version: "v2", risk: "standard", reviewed: "Oct 21, 2025", uses: 63 }
  ];

  var CLAUSE_CATS = ["All", "Commercial", "Risk", "Privacy", "Jurisdiction"];

  return {
    library: LIBRARY,
    kinds: KINDS,
    suggested: SUGGESTED,
    answers: ANSWERS,
    fallback: FALLBACK,
    intake: INTAKE,
    selectedClauses: SELECTED_CLAUSES,
    issues: ISSUES,
    draft: DRAFT,
    vars: VARS,
    clauses: CLAUSES,
    clauseCats: CLAUSE_CATS
  };
})();
