/* Seed data for the law demo. Everything here is fictional sample
   content — no data leaves the page and nothing is persisted. */

window.DEMO = (function () {
  "use strict";

  var DOC_TYPES = [
    "ISDA Master Agreement",
    "Credit Support Annex",
    "REPO",
    "Amendment",
    "Confirmation Letter",
    "Other"
  ];

  var DOC_COLORS = {
    "ISDA Master Agreement": "#17348f",
    "Credit Support Annex": "#2454d8",
    "REPO": "#4a72f0",
    "Amendment": "#7a96f5",
    "Confirmation Letter": "#a8bbf8",
    "Other": "#d6ddf8"
  };

  /* Dashboard: contracts by client and document type (stacked, horizontal). */
  var byClient = [
    { client: "Client A", v: [4, 3, 2, 2, 1, 1] },
    { client: "Client B", v: [3, 3, 2, 2, 1, 1] },
    { client: "Client C", v: [3, 2, 2, 1, 1, 1] },
    { client: "Client D", v: [2, 2, 2, 1, 1, 0] },
    { client: "Client E", v: [2, 2, 1, 1, 1, 0] },
    { client: "Client F", v: [2, 1, 1, 1, 0, 0] },
    { client: "Client G", v: [1, 1, 1, 1, 0, 0] },
    { client: "Client H", v: [1, 1, 0, 0, 0, 0] }
  ];

  /* Stat-card modal: average turnaround time in days, grouped columns. */
  var turnaround = [
    { client: "Client A", v: [4.2, 3.1, 2.4, 1.8, 1.5, 2.8] },
    { client: "Client B", v: [5.0, 3.6, 2.9, 2.2, 1.7, 3.1] },
    { client: "Client C", v: [3.8, 3.0, 2.2, 1.9, 1.4, 2.6] },
    { client: "Client D", v: [4.6, 3.4, 2.7, 2.0, 1.6, 2.9] },
    { client: "Client E", v: [3.5, 2.8, 2.1, 1.6, 1.3, 2.4] },
    { client: "Client F", v: [4.1, 3.2, 2.5, 1.9, 1.5, 2.7] },
    { client: "Client G", v: [5.4, 3.9, 3.0, 2.3, 1.8, 3.3] },
    { client: "Client H", v: [3.9, 3.1, 2.3, 1.7, 1.4, 2.5] },
    { client: "Client I", v: [4.4, 3.3, 2.6, 2.1, 1.6, 2.8] },
    { client: "Client J", v: [4.8, 3.5, 2.8, 2.0, 1.5, 3.0] }
  ];

  /* Stat-card modal: completed contracts, grouped columns. */
  var completedByClient = [
    { client: "Client A", v: [3, 5, 2, 6, 8, 3] },
    { client: "Client B", v: [2, 4, 3, 5, 7, 2] },
    { client: "Client C", v: [3, 4, 2, 5, 6, 2] },
    { client: "Client D", v: [4, 6, 3, 7, 9, 3] },
    { client: "Client E", v: [2, 4, 2, 5, 7, 2] },
    { client: "Client F", v: [3, 5, 2, 6, 8, 2] },
    { client: "Client G", v: [2, 3, 1, 4, 5, 1] },
    { client: "Client H", v: [1, 3, 1, 3, 4, 1] },
    { client: "Client I", v: [3, 5, 2, 6, 7, 2] },
    { client: "Client J", v: [2, 4, 2, 5, 6, 2] }
  ];

  /* Stat-card modal: contracts in progress, grouped columns. */
  var inProgressByClient = [
    { client: "Client A", v: [1, 2, 1, 2, 2, 1] },
    { client: "Client B", v: [1, 1, 1, 2, 2, 0] },
    { client: "Client C", v: [1, 1, 0, 1, 2, 1] },
    { client: "Client D", v: [1, 2, 1, 2, 2, 1] },
    { client: "Client E", v: [0, 1, 1, 1, 2, 0] },
    { client: "Client F", v: [1, 1, 0, 1, 2, 1] },
    { client: "Client G", v: [0, 1, 0, 1, 1, 0] },
    { client: "Client H", v: [1, 0, 0, 1, 1, 0] },
    { client: "Client I", v: [1, 1, 1, 2, 1, 0] },
    { client: "Client J", v: [0, 1, 0, 1, 2, 1] }
  ];

  var contractsInProgress = [
    {
      id: "M-2026-014",
      clientName: "Northwind Capital",
      documentType: "ISDA Master Agreement",
      assignee: "Jordan Hale",
      status: "In Review",
      startedDate: "Mar 4, 2026",
      startedTime: "2:30 PM",
      timeline: [
        { type: "approval", action: "Term Summary approved", version: "v1", date: "Mar 8, 2026", time: "11:15 AM", assignee: "Jordan Hale" },
        { type: "version", action: "Term Summary generated", version: "v1", date: "Mar 8, 2026", time: "10:45 AM", assignee: "Jordan Hale" },
        { type: "approval", action: "Issues List approved", version: "v2", date: "Mar 7, 2026", time: "3:45 PM", assignee: "Jordan Hale" },
        { type: "version", action: "Issues List generated", version: "v2", date: "Mar 7, 2026", time: "3:30 PM", assignee: "Jordan Hale" },
        { type: "approval", action: "Issues List approved", version: "v1", date: "Mar 4, 2026", time: "5:00 PM", assignee: "Jordan Hale" },
        { type: "version", action: "Issues List generated", version: "v1", date: "Mar 4, 2026", time: "3:15 PM", assignee: "Jordan Hale" },
        { type: "started", action: "Contract started", date: "Mar 4, 2026", time: "2:30 PM", assignee: "Jordan Hale" }
      ]
    },
    {
      id: "M-2026-013",
      clientName: "Harborview Partners",
      documentType: "Credit Support Annex",
      assignee: "Priya Shah",
      status: "Drafting",
      startedDate: "Mar 4, 2026",
      startedTime: "9:15 AM",
      timeline: [
        { type: "approval", action: "Term Summary approved", version: "v1", date: "Mar 4, 2026", time: "1:30 PM", assignee: "Priya Shah" },
        { type: "version", action: "Term Summary generated", version: "v1", date: "Mar 4, 2026", time: "11:45 AM", assignee: "Priya Shah" },
        { type: "started", action: "Contract started", date: "Mar 4, 2026", time: "9:15 AM", assignee: "Priya Shah" }
      ]
    },
    {
      id: "M-2026-012",
      clientName: "Pinecrest Holdings",
      documentType: "Amendment",
      assignee: "Marcus Webb",
      status: "Pending Signature",
      startedDate: "Mar 3, 2026",
      startedTime: "3:45 PM",
      timeline: [
        { type: "approval", action: "Credit Agreement Analysis approved", version: "v4", date: "Mar 4, 2026", time: "10:30 AM", assignee: "Marcus Webb" },
        { type: "version", action: "Credit Agreement Analysis generated", version: "v4", date: "Mar 4, 2026", time: "10:00 AM", assignee: "Marcus Webb" },
        { type: "version", action: "Credit Agreement Analysis generated", version: "v3", date: "Mar 3, 2026", time: "5:30 PM", assignee: "Marcus Webb" },
        { type: "version", action: "Credit Agreement Analysis generated", version: "v2", date: "Mar 3, 2026", time: "4:45 PM", assignee: "Marcus Webb" },
        { type: "version", action: "Credit Agreement Analysis generated", version: "v1", date: "Mar 3, 2026", time: "4:00 PM", assignee: "Marcus Webb" },
        { type: "started", action: "Contract started", date: "Mar 3, 2026", time: "3:45 PM", assignee: "Marcus Webb" }
      ]
    },
    {
      id: "M-2026-011",
      clientName: "Atlas Credit Fund",
      documentType: "Confirmation Letter",
      assignee: "Jordan Hale",
      status: "In Review",
      startedDate: "Mar 2, 2026",
      startedTime: "11:00 AM",
      timeline: [
        { type: "version", action: "Issues List generated", version: "v2", date: "Mar 3, 2026", time: "2:00 PM", assignee: "Jordan Hale" },
        { type: "version", action: "Issues List generated", version: "v1", date: "Mar 2, 2026", time: "11:30 AM", assignee: "Jordan Hale" },
        { type: "started", action: "Contract started", date: "Mar 2, 2026", time: "11:00 AM", assignee: "Jordan Hale" }
      ]
    }
  ];

  var completedContracts = [
    {
      id: "M-2026-008",
      clientName: "Redwood Advisors",
      documentType: "ISDA Master Agreement",
      assignee: "Jordan Hale",
      completedDate: "Feb 18, 2026",
      status: "Completed",
      startedDate: "Feb 11, 2026",
      startedTime: "10:00 AM",
      timeline: [
        { type: "export", action: "Issues List signed off and exported", version: "v5 (Final)", date: "Feb 18, 2026", time: "4:45 PM", assignee: "Jordan Hale" },
        { type: "version", action: "Issues List revised", version: "v4", date: "Feb 17, 2026", time: "2:15 PM", assignee: "Jordan Hale" },
        { type: "version", action: "Issues List revised", version: "v3", date: "Feb 15, 2026", time: "11:30 AM", assignee: "Jordan Hale" },
        { type: "version", action: "Issues List revised", version: "v2", date: "Feb 13, 2026", time: "9:00 AM", assignee: "Jordan Hale" },
        { type: "started", action: "Contract started", date: "Feb 11, 2026", time: "10:00 AM", assignee: "Jordan Hale" }
      ]
    },
    {
      id: "M-2026-007",
      clientName: "Summit Ridge LP",
      documentType: "Credit Support Annex",
      assignee: "Priya Shah",
      completedDate: "Feb 15, 2026",
      status: "Completed",
      startedDate: "Feb 8, 2026",
      startedTime: "1:30 PM",
      timeline: [
        { type: "export", action: "Issues List signed off and exported", version: "v3 (Final)", date: "Feb 15, 2026", time: "3:00 PM", assignee: "Priya Shah" },
        { type: "version", action: "Issues List revised", version: "v2", date: "Feb 12, 2026", time: "10:15 AM", assignee: "Priya Shah" },
        { type: "started", action: "Contract started", date: "Feb 8, 2026", time: "1:30 PM", assignee: "Priya Shah" }
      ]
    },
    {
      id: "M-2026-006",
      clientName: "Oakmont Securities",
      documentType: "Master Agreement",
      assignee: "Marcus Webb",
      completedDate: "Feb 12, 2026",
      status: "Completed",
      startedDate: "Feb 5, 2026",
      startedTime: "9:00 AM",
      timeline: [
        { type: "export", action: "Issues List signed off and exported", version: "v4 (Final)", date: "Feb 12, 2026", time: "5:30 PM", assignee: "Marcus Webb" },
        { type: "version", action: "Issues List revised", version: "v3", date: "Feb 11, 2026", time: "2:45 PM", assignee: "Marcus Webb" },
        { type: "version", action: "Issues List revised", version: "v2", date: "Feb 8, 2026", time: "11:00 AM", assignee: "Marcus Webb" },
        { type: "started", action: "Contract started", date: "Feb 5, 2026", time: "9:00 AM", assignee: "Marcus Webb" }
      ]
    }
  ];

  /* "Location" column on the dashboard table is keyed off the contract id. */
  var LOCATIONS = {
    "M-2026-014": "New York",
    "M-2026-013": "London",
    "M-2026-012": "Chicago",
    "M-2026-011": "Singapore",
    "M-2026-008": "New York"
  };

  var conversations = [
    {
      id: "1",
      title: "Threshold Amounts",
      ageMs: 0,
      messages: [
        { role: "user", content: "What is a threshold amount in a master agreement?", ageMs: 300000 },
        { role: "assistant", content: "A threshold amount is the exposure level that must be exceeded before collateral is required to be posted. It's essentially a credit limit set for each party.", ageMs: 280000 },
        { role: "user", content: "How is it typically determined?", ageMs: 240000 },
        { role: "assistant", content: "Threshold amounts are negotiated based on each party's creditworthiness. Higher-rated entities typically negotiate higher thresholds, while lower-rated parties may have zero or minimal thresholds.", ageMs: 220000 },
        { role: "user", content: "Can threshold amounts change over time?", ageMs: 180000 },
        { role: "assistant", content: "Yes, they can. Threshold amounts are often tied to credit ratings and may be reduced if a party's credit rating is downgraded below specified levels.", ageMs: 160000 },
        { role: "user", content: "What's a typical threshold for investment-grade counterparties?", ageMs: 120000 },
        { role: "assistant", content: "For investment-grade counterparties, thresholds typically range from $5 million to $25 million, though this varies significantly based on the relationship and creditworthiness of the parties.", ageMs: 100000 }
      ]
    },
    {
      id: "2",
      title: "Credit Support Annex Review",
      ageMs: 86400000,
      messages: [
        { role: "user", content: "Can you explain the difference between IM and VM in a CSA?", ageMs: 86400000 },
        { role: "assistant", content: "IM (Initial Margin) is posted at the beginning of a transaction to cover potential future exposure. VM (Variation Margin) is exchanged daily based on mark-to-market changes in the value of outstanding derivatives.", ageMs: 86390000 }
      ]
    },
    {
      id: "3",
      title: "Termination Events Overview",
      ageMs: 172800000,
      messages: [
        { role: "user", content: "What are the main termination events in a master agreement?", ageMs: 172800000 },
        { role: "assistant", content: "Key termination events include: Illegality, Tax Event, Tax Event Upon Merger, Credit Event Upon Merger, and Additional Termination Events as agreed by the parties. Each allows one or both parties to terminate affected transactions.", ageMs: 172790000 }
      ]
    },
    {
      id: "4",
      title: "Netting Provisions Question",
      ageMs: 259200000,
      messages: [
        { role: "user", content: "How does close-out netting work?", ageMs: 259200000 },
        { role: "assistant", content: "Close-out netting allows parties to net all transactions upon default or termination, resulting in a single payment obligation. This significantly reduces credit exposure and is crucial for risk management.", ageMs: 259190000 }
      ]
    }
  ];

  /* Issues List rows shown in the contract detail view. <s> marks struck
     (superseded) text, <g> marks the replacement. */
  var issuesList = [
    {
      id: "1-v1",
      rowNumber: 1,
      version: "V1",
      provision: "Part 1 (g) Termination Provisions: (iii) Decline in Net Asset Value, and\n\n(b) Minimum Net Asset Value Event",
      description:
        'Two of the additional termination events in the agreement are:\n(A) Decline in Net Asset Value ("NAV"): Triggers if Party B\'s NAV drops by <s>20%</s> <g>15%</g> in one\nmonth, <s>30%</s> <g>25%</g> over three months, or <s>40%</s> <g>35%</g> year-over-year.\n(B) Minimum NAV Event: Triggers if Party B\'s month-end NAV drops below the greater of\nUSD <s>15</s> <g>25</g> million, or 40% of the highest month-end NAV during the term of the Agreement.',
      issue:
        "Northwind asked that we originally propose including only the Decline in Net NAV, consistent with its preference to limit NAV-based triggers.",
      clComments:
        "The counterparty wants to keep both additional termination events for consistency across funds.\n\nThey have agreed to drop the Liquidity Buffer event if the Minimum Net Asset Value trigger is accepted.\n\nIf that is acceptable, does USD 15 million work for both funds, with the lookback limited to the previous 12 months?",
      clientInput: ""
    },
    {
      id: "1-v2",
      rowNumber: 1,
      version: "V2",
      provision: "Part 1 (g) Termination Provisions: (iii) Decline in Net Asset Value, and\n\n(b) Minimum Net Asset Value Event",
      description:
        'Two of the additional termination events in the agreement are:\n(A) Decline in Net Asset Value ("NAV"): Triggers if Party B\'s NAV drops by <s>20%</s> <s>15%</s> <g>12%</g> in\none month, <s>30%</s> <s>25%</s> <g>22%</g> over three months, or <s>40%</s> <s>35%</s> <g>30%</g> year-over-year.\n(B) Minimum NAV Event: Triggers if Party B\'s month-end NAV drops below the greater of\nUSD <s>15</s> <s>25</s> <g>30</g> million, or 40% of the highest month-end NAV during the term of the\nAgreement.',
      issue:
        "Northwind asked that we originally propose including only the Decline in Net NAV, consistent with its preference to limit NAV-based triggers.",
      clComments:
        "The client asked for a reduced decline in NAV for one month, three months, and year over year.\n\n(B) The client also asked for a reduced minimum month-end NAV of the greater of USD 25 million.",
      clientInput: ""
    },
    {
      id: "2-v1",
      rowNumber: 2,
      version: "V1",
      provision: "Part 1 (g) Termination Provisions: (vi) Decline in Liquidity Buffer",
      description:
        'The "Decline in Liquidity Buffer" event is triggered if Party B\'s Liquidity Buffer drops below the greater of:\n\n(A) all Independent Amounts for outstanding trades; or\n\n(B) the Liquidity Buffer Minimum Amount specified in Annex I.',
      issue:
        "The counterparty is willing to drop this event if the Minimum NAV event (see item 1 above) is retained instead.\n\nThis event was removed in the last version of the document.",
      clComments:
        "As noted above, the counterparty agreed to remove this Liquidity Buffer event if the Minimum Net Asset Value trigger is accepted.\n\nThe Liquidity Buffer Amount concept would still appear in the Financial Status representation (see item 4 below).",
      clientInput: ""
    },
    {
      id: "2-v2",
      rowNumber: 2,
      version: "V2",
      provision: "Part 1 (g) Termination Provisions: (vi) Decline in Liquidity Buffer",
      description:
        'The "Decline in Liquidity Buffer" event is triggered if Party B\'s Liquidity Buffer drops below the greater of:\n\n(A) all Independent Amounts for outstanding trades; or\n\n(B) the Liquidity Buffer Minimum Amount specified in Annex I.',
      issue:
        "The counterparty is willing to drop this event if the Minimum NAV event (see item 1 above) is retained instead.\n\nThis event was removed in the last version of the document.",
      clComments:
        "The client asked for a reduced decline in NAV for one month, three months, and year over year.\n\n(B) The client asked for a minimum amount to be the greater of USD 30 million.",
      clientInput: ""
    }
  ];

  var TEMPLATE_KINDS = [
    "ISDA Master",
    "ISDA Schedule",
    "Credit Support Annex",
    "Credit Agreements",
    "PB",
    "Futures",
    "ACA",
    "GMRA"
  ];

  var TEMPLATE_DOCS = {
    "ISDA Schedule": "ISDA_Schedule_Template_v3.2.docx",
    "MSFTA": "MSFTA_Standard_Template_2024.pdf",
    "GMRA": "GMRA_Template_v2.1.docx"
  };

  var CLIENTS = ["Northwind Capital", "Harborview Partners", "Pinecrest Holdings", "Atlas Credit Fund",
    "Redwood Advisors", "Summit Ridge LP", "Oakmont Securities", "Blue Harbor LLC",
    "Linden Gate LLC", "Fairway Asset Mgmt", "Crestline Partners"];
  var MATTERS = ["Derivatives Trading", "Prime Brokerage Services", "Credit Facility",
    "Securities Lending", "Repo Agreement", "Futures Trading"];
  var AGREEMENTS = ["ISDA Master Agreement", "Credit Support Annex", "GMRA",
    "Prime Brokerage Agreement", "Credit Agreement", "Account Control Agreement"];
  var CLIENT_TYPES = ["Hedge Fund", "Private Equity", "Insurance", "Pension Fund", "Corporation", "Other"];
  var TEMPLATE_TYPES = ["ISDA Schedule", "MSFTA", "GMRA"];
  var AGREEMENT_TYPES = ["Future", "Prime Brokerage", "Account Control Agreement"];

  var ANALYSIS_GENERAL = ["Template Creation", "Issues List", "Term Summary"];
  var ANALYSIS_OTHER = ["Amendment Consolidation", "Bespoke Document", "Credit Agreement Analysis"];

  var PDFS = {
    consolidated: "assets/sample-isda-schedule.pdf",
    redline: "assets/sample-redline.pdf",
    amendmentReview: "assets/sample-amendment-review.pdf",
    amendment1: "assets/sample-amendment-1.pdf",
    amendment2: "assets/sample-amendment-2.pdf",
    amendment3: "assets/sample-amendment-3.pdf"
  };

  return {
    user: {
      name: "Jordan Hale",
      email: "jordan.hale@meridianlegal.example",
      initial: "J",
      domain: "@meridianlegal.example",
      firm: "Meridian Legal"
    },
    DOC_TYPES: DOC_TYPES,
    DOC_COLORS: DOC_COLORS,
    byClient: byClient,
    turnaround: turnaround,
    completedByClient: completedByClient,
    inProgressByClient: inProgressByClient,
    contractsInProgress: contractsInProgress,
    completedContracts: completedContracts,
    LOCATIONS: LOCATIONS,
    conversations: conversations,
    issuesList: issuesList,
    TEMPLATE_KINDS: TEMPLATE_KINDS,
    TEMPLATE_DOCS: TEMPLATE_DOCS,
    CLIENTS: CLIENTS,
    MATTERS: MATTERS,
    AGREEMENTS: AGREEMENTS,
    CLIENT_TYPES: CLIENT_TYPES,
    TEMPLATE_TYPES: TEMPLATE_TYPES,
    AGREEMENT_TYPES: AGREEMENT_TYPES,
    ANALYSIS_GENERAL: ANALYSIS_GENERAL,
    ANALYSIS_OTHER: ANALYSIS_OTHER,
    PDFS: PDFS
  };
})();
