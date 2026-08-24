/* ==========================================================================
   BESPOKE — AI intake console demo · fixture data
   Six illustrative intakes from a personal injury firm's after-hours line.
   Every record feeds all three views: the console detail pane, the case-sheet
   row, and the SMS the intake coordinator receives. No live client records.
   ========================================================================== */

var CASES = [
  {
    name: "Maria Gonzalez",
    time: "7/8/26 8:14 AM",
    value: "$45,000–$65,000",
    caseType: "Auto Accident",
    status: "New Lead",
    callback: "(512) 555-0162",
    incidentDate: "7/6/26",
    location: "I-35 & Riverside Dr, Austin TX",
    injuries: "Whiplash, lower back pain",
    treatment: "ER visit, St. David's Medical Center",
    atFault: "Other driver (insured)",
    insurance: "State Farm",
    policeReport: "AR-2026-11482",
    witnesses: "None reported",
    statute: "7/6/2028",
    notes: "Client reports ongoing pain, missed 3 days of work. Recommend follow-up with treating physician for records."
  },
  {
    name: "Robert Chen",
    time: "7/8/26 11:02 AM",
    value: "$80,000–$120,000",
    caseType: "Slip & Fall",
    status: "Under Review",
    callback: "(512) 555-0189",
    incidentDate: "7/5/26",
    location: "Randalls grocery, 2100 Guadalupe St",
    injuries: "Fractured wrist, surgery consult pending",
    sheet: { injuries: "Fractured wrist, surgery pending" },
    treatment: "ER visit, ortho consult scheduled",
    atFault: "Randalls Food Markets Inc.",
    insurance: "Commercial (TBD)",
    policeReport: "—",
    witnesses: "Yes, 1 store employee",
    statute: "7/5/2028",
    notes: "Wet floor, no warning sign posted per client. Store surveillance footage should be requested before it's overwritten."
  },
  {
    name: "Denise Fowler",
    time: "7/8/26 3:47 PM",
    value: "$150,000–$220,000",
    caseType: "Workplace Injury",
    status: "Under Review",
    callback: "(512) 555-0204",
    incidentDate: "7/3/26",
    location: "Lonestar Logistics warehouse",
    injuries: "Crushed left foot, ongoing physical therapy",
    sheet: { injuries: "Crushed left foot, ongoing PT" },
    treatment: "Surgery, continuing physical therapy",
    atFault: "Lonestar Logistics Inc.",
    insurance: "Workers' comp (Texas Mutual)",
    policeReport: "—",
    witnesses: "None reported",
    statute: "7/3/2028",
    notes: "Workers' comp claim already filed separately. Client wants to know if a third-party liability claim is also possible against equipment manufacturer."
  },
  {
    name: "Marcus Webb",
    time: "7/8/26 7:20 PM",
    value: "$30,000–$50,000",
    caseType: "Dog Bite",
    status: "New Lead",
    callback: "(512) 555-0247",
    incidentDate: "6/29/26",
    location: "88 Cedar Ln (neighbor's property)",
    injuries: "Deep lacerations, forearm, 12 stitches",
    treatment: "ER visit, plastic surgery consult for scarring",
    atFault: "Neighbor (homeowner)",
    insurance: "Allstate",
    policeReport: "AC-3391",
    witnesses: "None reported",
    statute: "6/29/2028",
    notes: "Dog had a prior bite complaint on record with animal control — strengthens negligence argument."
  },
  {
    name: "Linda Ferreira",
    time: "7/7/26 10:15 AM",
    value: "$250,000–$400,000",
    caseType: "Medical Malpractice",
    status: "Under Review",
    callback: "(512) 555-0271",
    incidentDate: "6/20/26",
    location: "Seton Medical Center, Austin TX",
    injuries: "Surgical error, nerve damage to right hand",
    treatment: "Follow-up surgery required, ongoing PT",
    sheet: { treatment: "Follow-up surgery, ongoing PT" },
    atFault: "Dr. Alan Kim / Seton Medical Center",
    insurance: "Self-insured (institutional)",
    policeReport: "—",
    witnesses: "None reported",
    statute: "6/20/2028",
    notes: "Requires expert medical review before acceptance. Client has requested full surgical records from hospital."
  },
  {
    name: "Carlos Mendez",
    time: "7/6/26 4:32 PM",
    value: "$60,000–$95,000",
    caseType: "Product Liability",
    status: "Case Accepted",
    callback: "(512) 555-0293",
    incidentDate: "6/15/26",
    location: "Home use — defective space heater, 501 Maple Ct",
    injuries: "2nd-degree burns, hands and forearm",
    treatment: "ER treatment, burn unit follow-up",
    atFault: "HeatWell Manufacturing Co.",
    insurance: "Manufacturer (TBD)",
    policeReport: "—",
    witnesses: "Yes, spouse present",
    statute: "6/15/2028",
    notes: "Product recall history for this model found — supports design defect claim. Retained device as evidence."
  }
];

/* The SMS wording differs slightly from the sheet columns on purpose: the text
   is written for a coordinator skimming a phone, so it leads with case value
   and folds location and treatment into single lines. */
var SMS_THREAD = [
  {
    stamp: "Today 8:14 AM",
    tag: "Auto accident",
    name: "Maria Gonzalez",
    lines: [
      "Est. Case Value: $45,000–$65,000",
      "Incident: 7/6/26, I-35 & Riverside Dr, Austin TX",
      "Injuries: Whiplash, lower back pain, treated at St. David's ER",
      "At-Fault Party: Other driver, insured (State Farm)",
      "Police Report: Yes, #AR-2026-11482",
      "Statute Deadline: 7/6/2028",
      "Callback: (512) 555-0162"
    ]
  },
  {
    stamp: "Today 11:02 AM",
    tag: "Slip & fall",
    name: "Robert Chen",
    lines: [
      "Est. Case Value: $80,000–$120,000",
      "Incident: 7/5/26, Randalls grocery, 2100 Guadalupe St",
      "Injuries: Fractured wrist, surgery consult pending",
      "Property Owner: Randalls Food Markets Inc.",
      "Witnesses: Yes, 1 store employee",
      "Statute Deadline: 7/5/2028",
      "Callback: (512) 555-0189"
    ]
  },
  {
    stamp: "Today 3:47 PM",
    tag: "Workplace injury",
    name: "Denise Fowler",
    lines: [
      "Est. Case Value: $150,000–$220,000",
      "Incident: 7/3/26, forklift accident, Lonestar Logistics warehouse",
      "Injuries: Crushed left foot, ongoing physical therapy",
      "Employer: Lonestar Logistics Inc. (workers' comp also filed)",
      "Statute Deadline: 7/3/2028",
      "Callback: (512) 555-0204"
    ]
  },
  {
    stamp: "Today 7:20 PM",
    tag: "Dog bite",
    name: "Marcus Webb",
    lines: [
      "Est. Case Value: $30,000–$50,000",
      "Incident: 6/29/26, neighbor's front yard, 88 Cedar Ln",
      "Injuries: Deep lacerations to forearm, 12 stitches, likely scarring",
      "At-Fault Party: Neighbor, homeowner's insurance (Allstate)",
      "Police Report: Animal control report #AC-3391",
      "Statute Deadline: 6/29/2028",
      "Callback: (512) 555-0247"
    ]
  }
];
