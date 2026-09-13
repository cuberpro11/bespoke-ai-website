/* ==========================================================================
   BESPOKE — Client Relations Portal demo
   Mirrors the Figma "CRM Demo" prototype (Version 84).
   ========================================================================== */

window.CRM_DATA = (function () {
  "use strict";

  var METRICS = {
    7: {
      intakes: 7, intakeDelta: "+9% vs prior period",
      conversion: "12%", conversionNote: "1 signed this period",
      pipeline: "$120K", responseTime: "1.9h",
      channels: { Email: 3, Phone: 3, Website: 1 },
      pipelineRows: [["Total Intakes", 7], ["Awaiting Response", 3], ["Consultations Booked", 3], ["Signed This Period", 1], ["Declined / Closed", 1]],
      weeks: [
        { label: "Feb 10–16", Phone: 2, Email: 3, Website: 1 }
      ]
    },
    30: {
      intakes: 27, intakeDelta: "+18% vs prior period",
      conversion: "15%", conversionNote: "4 signed this period",
      pipeline: "$415K", responseTime: "2.4h",
      channels: { Email: 12, Phone: 10, Website: 6 },
      pipelineRows: [["Total Intakes", 27], ["Awaiting Response", 3], ["Consultations Booked", 11], ["Signed This Period", 4], ["Declined / Closed", 3]],
      weeks: [
        { label: "Jan 13–19",   Phone: 2, Email: 1, Website: 1 },
        { label: "Jan 20–26",   Phone: 1, Email: 2, Website: 1 },
        { label: "Jan 27–Feb 2",Phone: 3, Email: 2, Website: 1 },
        { label: "Feb 3–9",     Phone: 1, Email: 3, Website: 1 },
        { label: "Feb 10–16",   Phone: 3, Email: 4, Website: 2 }
      ]
    },
    90: {
      intakes: 71, intakeDelta: "+24% vs prior period",
      conversion: "17%", conversionNote: "12 signed this period",
      pipeline: "$1.1M", responseTime: "2.8h",
      channels: { Email: 31, Phone: 26, Website: 14 },
      pipelineRows: [["Total Intakes", 71], ["Awaiting Response", 3], ["Consultations Booked", 29], ["Signed This Period", 12], ["Declined / Closed", 9]],
      weeks: [
        { label: "Dec 16–22",   Phone: 2, Email: 2, Website: 1 },
        { label: "Dec 23–29",   Phone: 1, Email: 1, Website: 1 },
        { label: "Dec 30–Jan 5",Phone: 2, Email: 3, Website: 2 },
        { label: "Jan 6–12",    Phone: 3, Email: 2, Website: 1 },
        { label: "Jan 13–19",   Phone: 2, Email: 1, Website: 1 },
        { label: "Jan 20–26",   Phone: 1, Email: 2, Website: 1 },
        { label: "Jan 27–Feb 2",Phone: 3, Email: 2, Website: 1 },
        { label: "Feb 3–9",     Phone: 1, Email: 3, Website: 1 },
        { label: "Feb 10–16",   Phone: 3, Email: 4, Website: 2 }
      ]
    }
  };

  var CHANNEL_COLOR = { Phone: "#4f46e5", Email: "#8b5cf6", Website: "#22d3ee" };

  var ACTIVITY = [
    { dot: "#4f46e5", text: "New intake: John Smith via email",            time: "10:30 AM" },
    { dot: "#22d3ee", text: "New intake: Amanda Torres via website",       time: "9:15 AM" },
    { dot: "#8b5cf6", text: "Medical records received — Sarah Johnson",    time: "8:15 AM" },
    { dot: "#22c55e", text: "Michael Davis — consultation booked",         time: "8:45 AM" },
    { dot: "#22c55e", text: "Jennifer Martinez — response sent",           time: "Yesterday" },
    { dot: "#f59e0b", text: "Lisa Anderson — counter-offer prepared",      time: "Yesterday" }
  ];

  /* ------------------------------------------------------------- clients -- */

  var CLIENTS = [
    {
      id: "c1", name: "John Smith", caseType: "Motor Vehicle Accident",
      channel: "email", source: "Email", contacted: "Today 10:30 AM",
      caseNumber: "INT-2026-0141", attorney: "Unassigned",
      value: 112500, valueRange: "$75,000–$150,000", status: "potential", responded: false,
      valueReason: "Rear-end collision with a commercial vehicle, documented ER visit and ongoing physical therapy. Clear liability and a commercial policy behind it.",
      email: { from: "j.smith.nyc@gmail.com", to: "intake@yourlawfirm.com", subject: "Car accident on the BQE — need representation", date: "Feb 16, 2026, 10:30 AM" },
      message: "I was rear-ended on the BQE last Tuesday by a delivery truck that was following far too closely. I went to the ER at Methodist that evening with neck and lower back pain and I have been in physical therapy twice a week since. The other driver's company has already called me twice asking me to give a recorded statement and I have not agreed to anything.\n\nI have the police report, photos of both vehicles, and all of my medical paperwork. Can someone call me to talk about representation?",
      contact: { email: "j.smith.nyc@gmail.com", phone: "+1 (917) 555-0148" },
      attachments: [
        { name: "police-report-BQE-021026.pdf", kind: "pdf", size: "412 KB" },
        { name: "vehicle-damage-rear.jpg", kind: "image", size: "2.1 MB" },
        { name: "methodist-er-summary.pdf", kind: "pdf", size: "180 KB" }
      ],
      analysis: "Strong liability posture: commercial defendant, police report on file, and continuous treatment from the date of loss. Recorded-statement requests are already in play, so a representation letter should go out before the carrier reaches him again. Estimated value is driven by the commercial policy limits and documented soft-tissue treatment.",
      actions: [
        { id: "a1", title: "Send confirmation email to client", integration: "Email",
          params: [["To", "j.smith.nyc@gmail.com"], ["Subject", "We have received your inquiry — next steps"]],
          emailBody: "Dear Mr. Smith,\n\nThank you for reaching out to Your Law Firm regarding the collision on February 10th. We have received your message along with the police report and medical documentation.\n\nImportant: please do not provide a recorded statement to the other driver's insurance carrier. You are under no obligation to do so, and anything you say can be used to reduce your claim.\n\nOne of our attorneys will call you within one business day to discuss representation. If anything urgent comes up before then, reply to this email or call our intake line.\n\nSincerely,\nClient Intake Team\nYour Law Firm" },
        { id: "a2", title: "Create matter in MyCase", integration: "MyCase",
          params: [["Matter type", "Motor Vehicle Accident"], ["Case number", "INT-2026-0141"], ["Statute of limitations", "Feb 10, 2029"]] },
        { id: "a3", title: "Book consultation", integration: "Calendar",
          params: [["Attorney", "R. Alvarez"], ["Slot", "Feb 17, 2026 · 2:00 PM"], ["Duration", "45 minutes"]] },
        { id: "a4", title: "File intake documents", integration: "Dropbox",
          params: [["Folder", "/Clients/2026/Smith, John"], ["Files", "3 attachments"]] }
      ]
    },
    {
      id: "c2", name: "Amanda Torres", caseType: "Slip & Fall",
      channel: "website", source: "Website form", contacted: "Today 9:15 AM",
      caseNumber: "INT-2026-0140", attorney: "Unassigned",
      value: 48000, valueRange: "$30,000–$65,000", status: "potential", responded: false,
      valueReason: "Grocery-store fall with a reported wet-floor hazard and no warning signage. Fractured wrist with surgical repair, but comparative-fault exposure is likely.",
      form: [
        ["Full name", "Amanda Torres"],
        ["Incident date", "Feb 12, 2026"],
        ["Incident type", "Slip and fall"],
        ["Location", "Fresh Grove Market, Jackson Heights"],
        ["Injured?", "Yes — fractured left wrist, surgery Feb 13"],
        ["Represented?", "No"]
      ],
      message: "I slipped on a wet patch in the produce aisle. There was no wet floor sign anywhere. I fell on my left wrist and it was fractured — I had surgery the next morning. The store manager took an incident report but has not followed up with me since.",
      contact: { email: "amanda.torres88@outlook.com", phone: "+1 (347) 555-0192" },
      attachments: [],
      analysis: "Premises case with a documented incident report and immediate surgical treatment, which supports causation. The key evidentiary question is notice — how long the hazard was present. Preservation letter for store CCTV should go out immediately, as most retail systems overwrite within 30 days.",
      actions: [
        { id: "a1", title: "Send confirmation email to client", integration: "Email",
          params: [["To", "amanda.torres88@outlook.com"], ["Subject", "Your inquiry about the February 12 incident"]],
          emailBody: "Dear Ms. Torres,\n\nThank you for contacting Your Law Firm about your fall at Fresh Grove Market on February 12th. We are sorry to hear about your injury and the surgery that followed.\n\nSo that we can evaluate your claim properly, please keep copies of any discharge paperwork, surgical records, and receipts for out-of-pocket costs. If the store contacts you directly, you are not required to discuss the incident with them.\n\nAn attorney will follow up with you shortly to schedule a consultation.\n\nSincerely,\nClient Intake Team\nYour Law Firm" },
        { id: "a2", title: "Send evidence preservation letter", integration: "Email",
          params: [["To", "records@freshgrovemarket.com"], ["Subject", "Litigation hold — incident of Feb 12, 2026"]],
          emailBody: "To whom it may concern,\n\nThis firm represents Amanda Torres in connection with an incident that occurred at your Jackson Heights location on February 12, 2026.\n\nYou are hereby directed to preserve all evidence relating to this incident, including but not limited to: CCTV footage for the four hours preceding and following the incident, floor inspection and maintenance logs for that date, the incident report prepared by store staff, and the names of all employees on duty.\n\nFailure to preserve this evidence may result in claims of spoliation.\n\nRegards,\nYour Law Firm" },
        { id: "a3", title: "Create matter in MyCase", integration: "MyCase",
          params: [["Matter type", "Premises Liability"], ["Case number", "INT-2026-0140"], ["Statute of limitations", "Feb 12, 2029"]] }
      ]
    },
    {
      id: "c3", name: "Marcus Chen", caseType: "Workers' Compensation",
      channel: "phone", source: "Phone call", contacted: "Yesterday 4:30 PM",
      caseNumber: "INT-2026-0138", attorney: "Unassigned",
      value: 62000, valueRange: "$40,000–$85,000", status: "potential", responded: false,
      valueReason: "Repetitive-strain shoulder injury with an employer disputing that the injury is work-related. Value depends on the independent medical examination.",
      call: { duration: "6m 41s", notes: "Inbound call routed from the main line at 4:30 PM. Caller was calm and well organised; had dates and names ready." },
      message: "Caller reports a right shoulder injury developed over roughly eight months of overhead warehouse work at a distribution centre in Maspeth. Reported the pain to his supervisor in November; was told to \"work through it\". Saw an orthopaedist in January who diagnosed a partial rotator cuff tear and recommended surgery.\n\nEmployer has now disputed the claim as non-work-related. Caller has not filed a C-3 form and was not aware he needed to. He is still working modified duty and is worried about retaliation.",
      contact: { email: "m.chen.qns@gmail.com", phone: "+1 (718) 555-0233" },
      attachments: [],
      analysis: "Time-sensitive: the C-3 filing deadline is the immediate risk and the claim is already being disputed. Contemporaneous report to the supervisor in November helps establish notice, but the absence of a written report will be contested. Retaliation exposure should be flagged separately from the compensation claim.",
      actions: [
        { id: "a1", title: "Send confirmation email to client", integration: "Email",
          params: [["To", "m.chen.qns@gmail.com"], ["Subject", "Following up on your call — workers' compensation claim"]],
          emailBody: "Dear Mr. Chen,\n\nThank you for calling Your Law Firm yesterday about your shoulder injury.\n\nThe most urgent item is the C-3 employee claim form, which has not yet been filed. We can prepare and file this on your behalf. Please also keep a written note of the date you first reported the pain to your supervisor and the name of anyone who witnessed that conversation.\n\nIf your employer changes your duties or hours after this filing, tell us immediately — that may be a separate claim.\n\nSincerely,\nClient Intake Team\nYour Law Firm" },
        { id: "a2", title: "Prepare and file Form C-3", integration: "MyCase",
          params: [["Form", "C-3 Employee Claim"], ["Board", "NY WCB"], ["Deadline", "Within 2 years of injury"]] },
        { id: "a3", title: "Book consultation", integration: "Calendar",
          params: [["Attorney", "D. Okafor"], ["Slot", "Feb 17, 2026 · 11:00 AM"], ["Duration", "30 minutes"]] }
      ]
    },
    {
      id: "c4", name: "Sarah Johnson", caseType: "Medical Malpractice",
      channel: "email", source: "Email", contacted: "Feb 14, 2026",
      caseNumber: "INT-2026-0131", attorney: "R. Alvarez",
      value: 240000, valueRange: "$180,000–$300,000", status: "potential", responded: true,
      valueReason: "Delayed diagnosis with a documented change in prognosis. High value, but requires a supporting expert affirmation before filing.",
      email: { from: "sjohnson.home@gmail.com", to: "intake@yourlawfirm.com", subject: "Delayed diagnosis — requesting a case review", date: "Feb 14, 2026, 2:05 PM" },
      message: "I was seen three times over five months for abdominal pain and was told each time it was likely gastritis. No imaging was ordered until my fourth visit, when a mass was found. I have since been told that an earlier diagnosis would have changed my treatment options considerably.\n\nI have requested my complete records from the practice and the hospital. I would like someone to review whether this is worth pursuing.",
      contact: { email: "sjohnson.home@gmail.com", phone: "+1 (212) 555-0117" },
      attachments: [],
      analysis: "Medical records arrived February 16 and are being chronologised. The central question is whether the standard of care required imaging at the second presentation. Do not file before an expert affirmation is secured — the certificate of merit requirement makes a premature filing costly.",
      actions: [
        { id: "a1", title: "Order expert chart review", integration: "MyCase",
          params: [["Specialty", "Internal medicine"], ["Turnaround", "10 business days"]] },
        { id: "a2", title: "Build medical chronology", integration: "MyCase",
          params: [["Records", "Four visits, Sep 2025 – Feb 2026"], ["Assigned to", "Paralegal — T. Whitfield"]] }
      ]
    },
    {
      id: "c5", name: "Michael Davis", caseType: "Premises Liability",
      channel: "website", source: "Website form", contacted: "Feb 13, 2026",
      caseNumber: "INT-2026-0128", attorney: "D. Okafor",
      value: 54000, valueRange: "$35,000–$70,000", status: "potential", responded: true,
      valueReason: "Stairwell fall in a residential building with prior complaints about the handrail on record with the managing agent.",
      form: [
        ["Full name", "Michael Davis"],
        ["Incident date", "Feb 8, 2026"],
        ["Incident type", "Stairwell fall"],
        ["Location", "1140 Ocean Ave, Brooklyn"],
        ["Injured?", "Yes — fractured ankle"],
        ["Represented?", "No"]
      ],
      message: "The handrail on the third-floor stairwell has been loose for months. Several of us have complained to the managing agent. I grabbed it on my way down, it gave way, and I fell most of a flight. My ankle is fractured in two places.",
      contact: { email: "mdavis.bk@gmail.com", phone: "+1 (347) 555-0166" },
      attachments: [
        { name: "handrail-loose-detail.jpg", kind: "image", size: "1.6 MB" },
        { name: "managing-agent-complaints.pdf", kind: "pdf", size: "96 KB" }
      ],
      analysis: "Prior written complaints to the managing agent are the strongest element here — they establish actual notice of the defect. Consultation is booked. Next step is a records demand for the building's repair log and any HPD violations on the stairwell.",
      actions: [
        { id: "a1", title: "Request building repair log", integration: "Email",
          params: [["To", "records@oceanavemgmt.com"], ["Subject", "Records request — 1140 Ocean Ave stairwell"]],
          emailBody: "To whom it may concern,\n\nThis firm represents Michael Davis regarding an incident in the stairwell at 1140 Ocean Avenue on February 8, 2026.\n\nPlease provide the maintenance and repair log for the third-floor stairwell for the preceding twenty-four months, together with any tenant complaints concerning the handrail and any related violation notices.\n\nRegards,\nYour Law Firm" },
        { id: "a2", title: "Book consultation", integration: "Calendar",
          params: [["Attorney", "D. Okafor"], ["Slot", "Feb 18, 2026 · 9:30 AM"], ["Duration", "45 minutes"]] }
      ]
    },
    {
      id: "c6", name: "Jennifer Martinez", caseType: "Dog Bite",
      channel: "phone", source: "Phone call", contacted: "Feb 11, 2026",
      caseNumber: "INT-2026-0119", attorney: "R. Alvarez",
      value: 28000, valueRange: "$18,000–$40,000", status: "signed",
      valueReason: "Documented bite with prior complaints about the same animal, which supports a vicious-propensity argument.",
      call: { duration: "4m 12s", notes: "Caller had already filed an animal-bite report with the city health department." },
      message: "Caller was bitten on the forearm by a neighbour's dog in the shared courtyard. Required eleven stitches and a course of antibiotics. Reports that the same dog lunged at another resident in December and that a complaint was filed with the building at that time.",
      contact: { email: "jmartinez.nyc@gmail.com", phone: "+1 (917) 555-0175" },
      attachments: [],
      analysis: "Signed February 12. Health department bite report and the prior December complaint together support vicious propensity. Homeowner's policy confirmed; demand package in preparation.",
      actions: []
    },
    {
      id: "c7", name: "Lisa Anderson", caseType: "Product Liability",
      channel: "email", source: "Email", contacted: "Feb 9, 2026",
      caseNumber: "INT-2026-0112", attorney: "D. Okafor",
      value: 185000, valueRange: "$140,000–$230,000", status: "signed",
      valueReason: "Defective pressure cooker with second-degree burns and an existing recall on the same model, which materially strengthens the claim.",
      email: { from: "l.anderson.home@yahoo.com", to: "intake@yourlawfirm.com", subject: "Pressure cooker burns — recall model", date: "Feb 9, 2026, 6:40 PM" },
      message: "The lid released while the cooker was still pressurised and I was burned across my forearm and stomach. I found out afterwards that this exact model was recalled last year. I never received any recall notice.",
      contact: { email: "l.anderson.home@yahoo.com", phone: "+1 (718) 555-0129" },
      attachments: [],
      analysis: "Signed February 10. Counter-offer prepared February 15. The existing recall shifts the analysis strongly toward the manufacturer; preserve the unit itself and its packaging as the central piece of physical evidence.",
      actions: []
    },
    {
      id: "c8", name: "Robert Kim", caseType: "Wrongful Termination",
      channel: "website", source: "Website form", contacted: "Feb 6, 2026",
      caseNumber: "INT-2026-0104", attorney: "—",
      value: 0, valueRange: "—", status: "declined",
      valueReason: "Outside the firm's practice areas.",
      form: [
        ["Full name", "Robert Kim"],
        ["Incident date", "Jan 30, 2026"],
        ["Incident type", "Employment dispute"],
        ["Represented?", "No"]
      ],
      message: "I was let go two weeks after raising a concern about overtime records with HR. I think the timing speaks for itself and I would like to know what my options are.",
      contact: { email: "rkim.work@gmail.com", phone: "+1 (646) 555-0188" },
      attachments: [],
      analysis: "Declined February 7 — employment matters fall outside the firm's practice areas. Referred out to an employment boutique; referral acknowledgement sent.",
      actions: []
    },
    {
      id: "c9", name: "Priya Raman", caseType: "Motor Vehicle Accident",
      channel: "phone", source: "Phone call", contacted: "Feb 4, 2026",
      caseNumber: "INT-2026-0098", attorney: "—",
      value: 0, valueRange: "—", status: "declined",
      valueReason: "Statute of limitations expired before intake.",
      call: { duration: "3m 05s", notes: "Caller was courteous; explained the limitation issue on the call." },
      message: "Caller describes a collision that occurred in 2018 for which she never pursued a claim. Asked whether it is too late to do anything now.",
      contact: { email: "priya.raman@gmail.com", phone: "+1 (212) 555-0144" },
      attachments: [],
      analysis: "Declined February 4 — the three-year limitation period expired in 2021. No tolling basis identified. Written confirmation sent so the file is closed cleanly.",
      actions: []
    }
  ];

  var SECTIONS = [
    { key: "needs",     title: "Needs Response", note: "Uncontacted leads, newest first" },
    { key: "potential", title: "Potential",      note: "Contacted and in evaluation" },
    { key: "signed",    title: "Signed",         note: "Converted to matters" },
    { key: "declined",  title: "Declined",       note: "Closed at intake" }
  ];

  var AGENT_ACTIONS = [
    { label: "Draft Response to New Lead",                    icon: "pen",      group: "crm" },
    { label: "Client Pipeline Summary",                       icon: "chart",    group: "crm" },
    { label: "Analyze Potential Case Value",                  icon: "value",    group: "crm" },
    { label: "Analyze Deposition Testimony",                  icon: "file",     group: "legal" },
    { label: "Analysis and Chronology of Medical Records",    icon: "activity", group: "legal" },
    { label: "Trial Prep Assistance",                         icon: "scale",    group: "legal" },
    { label: "Draft & Respond to Discovery",                  icon: "fileedit", group: "legal" }
  ];

  var INTEGRATIONS_CONNECTED = [
    { name: "MyCase",          account: "yourlawfirm.mycase.com",     color: "#1a7f5a", letter: "M" },
    { name: "Gmail",           account: "intake@yourlawfirm.com",     color: "#ea4335", letter: "G" },
    { name: "Dropbox",         account: "Your Law Firm (Team)",       color: "#0061ff", letter: "D" },
    { name: "Google Calendar", account: "intake@yourlawfirm.com",     color: "#1a73e8", letter: "C" }
  ];

  var INTEGRATIONS_AVAILABLE = [
    { name: "Clio",                  blurb: "Practice management",   color: "#1eb35a", letter: "C" },
    { name: "Google Drive",          blurb: "Document storage",      color: "#fbbc04", letter: "D" },
    { name: "Microsoft SharePoint",  blurb: "Document storage",      color: "#0078d4", letter: "S" },
    { name: "Salesforce",            blurb: "CRM sync",              color: "#00a1e0", letter: "S" },
    { name: "DocuSign",              blurb: "E-signature",           color: "#f7b32b", letter: "D" },
    { name: "Slack",                 blurb: "Team notifications",    color: "#611f69", letter: "S" }
  ];

  return {
    metrics: METRICS,
    channelColor: CHANNEL_COLOR,
    activity: ACTIVITY,
    clients: CLIENTS,
    sections: SECTIONS,
    agentActions: AGENT_ACTIONS,
    connected: INTEGRATIONS_CONNECTED,
    available: INTEGRATIONS_AVAILABLE
  };
})();
