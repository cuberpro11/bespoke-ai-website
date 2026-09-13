/* ==========================================================================
   BESPOKE — NYC Real Estate AI Portal demo
   Portfolio data. Mirrors the Figma "Real Estate Demo" prototype (Version 8).
   ========================================================================== */

window.RE_DATA = (function () {
  "use strict";

  // [unit, tenant, phone, address, borough, status]
  var TENANTS = [
    ["BK-101","Carlos Rodriguez","+1 (917) 555-0101","420 Bergen St, Apt 1A, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-102","Sarah Jenkins","+1 (917) 555-0102","420 Bergen St, Apt 1B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-201","Amir Al-Mansoor","+1 (917) 555-0103","420 Bergen St, Apt 2A, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-202","Emily Zhao","+1 (917) 555-0104","420 Bergen St, Apt 2B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-301","Marcus Washington","+1 (917) 555-0105","420 Bergen St, Apt 3A, Brooklyn, NY 11217","Brooklyn","quote_review"],
    ["BK-302","Chloe Dupont","+1 (917) 555-0106","420 Bergen St, Apt 3B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-401","Vikram Mehta","+1 (917) 555-0107","420 Bergen St, Apt 4A, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-402","Olivia Smith","+1 (917) 555-0108","420 Bergen St, Apt 4B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-501","Daniel Kofman","+1 (917) 555-0109","420 Bergen St, Apt 5A, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-502","Elena Rostova","+1 (917) 555-0110","420 Bergen St, Apt 5B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-601","Raj Patel","+1 (917) 555-0111","115 Decatur St, Apt 1, Brooklyn, NY 11216","Brooklyn","clean"],
    ["BK-602","Samantha Green","+1 (917) 555-0112","115 Decatur St, Apt 2, Brooklyn, NY 11216","Brooklyn","clean"],
    ["BK-603","Jordan Vance","+1 (917) 555-0113","115 Decatur St, Apt 3, Brooklyn, NY 11216","Brooklyn","clean"],
    ["BK-701","Liam O'Connor","+1 (917) 555-0114","88 Wythe Ave, Apt 4C, Brooklyn, NY 11249","Brooklyn","clean"],
    ["BK-702","Yuki Tanaka","+1 (917) 555-0115","88 Wythe Ave, Apt 5E, Brooklyn, NY 11249","Brooklyn","clean"],
    ["MN-101","David Stein","+1 (212) 555-0201","245 E 82nd St, Apt 1A, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-102","Sophia Loren","+1 (212) 555-0202","245 E 82nd St, Apt 1B, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-201","Jameson Blake","+1 (212) 555-0203","245 E 82nd St, Apt 2A, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-202","Mia Thompson","+1 (212) 555-0204","245 E 82nd St, Apt 2B, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-301","Arthur Pendelton","+1 (212) 555-0205","245 E 82nd St, Apt 3A, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-302","Isabella Garcia","+1 (212) 555-0206","245 E 82nd St, Apt 3B, Manhattan, NY 10028","Manhattan","triage"],
    ["MN-401","Ethan Hunt","+1 (212) 555-0207","245 E 82nd St, Apt 4A, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-402","Charlotte Bronte","+1 (212) 555-0208","245 E 82nd St, Apt 4B, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-501","Lucas Sinclair","+1 (212) 555-0209","245 E 82nd St, Apt 5A, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-502","Rachel Green","+1 (212) 555-0210","245 E 82nd St, Apt 5B, Manhattan, NY 10028","Manhattan","clean"],
    ["MN-601","William Sterling","+1 (212) 555-0211","14 Greenwich Ave, Apt 2E, Manhattan, NY 10011","Manhattan","clean"],
    ["MN-602","Zoe Kravitz","+1 (212) 555-0212","14 Greenwich Ave, Apt 3A, Manhattan, NY 10011","Manhattan","clean"],
    ["MN-701","Alexander Hamilton","+1 (212) 555-0213","182 Pine St, Apt 11B, Manhattan, NY 10005","Manhattan","clean"],
    ["MN-702","Eliza Schuyler","+1 (212) 555-0214","182 Pine St, Apt 11C, Manhattan, NY 10005","Manhattan","clean"],
    ["MN-703","Peggy Carter","+1 (212) 555-0215","182 Pine St, Apt 12A, Manhattan, NY 10005","Manhattan","clean"],
    ["MN-801","Peter Parker","+1 (212) 555-0216","187 Chrystie St, Apt 4B, Manhattan, NY 10002","Manhattan","clean"],
    ["MN-802","Mary Jane Watson","+1 (212) 555-0217","187 Chrystie St, Apt 4C, Manhattan, NY 10002","Manhattan","clean"],
    ["MN-803","Harry Osborn","+1 (212) 555-0218","187 Chrystie St, Apt 5A, Manhattan, NY 10002","Manhattan","clean"],
    ["QN-101","Maria Santos","+1 (347) 555-0301","41-15 34th Ave, Apt 1F, Astoria, NY 11106","Queens","clean"],
    ["QN-102","John Pappas","+1 (347) 555-0302","41-15 34th Ave, Apt 2R, Astoria, NY 11106","Queens","clean"],
    ["QN-103","Chloe Bennett","+1 (347) 555-0303","41-15 34th Ave, Apt 3A, Astoria, NY 11106","Queens","sourced"],
    ["QN-201","Fatima Rahman","+1 (347) 555-0304","48-50 43rd St, Apt 4E, Sunnyside, NY 11104","Queens","clean"],
    ["QN-202","Kevin Malone","+1 (347) 555-0305","48-50 43rd St, Apt 4F, Sunnyside, NY 11104","Queens","clean"],
    ["QN-203","Pam Beesly","+1 (347) 555-0306","48-50 43rd St, Apt 5B, Sunnyside, NY 11104","Queens","clean"],
    ["QN-301","Aris Thorne","+1 (347) 555-0307","102-10 66th Rd, Apt 6C, Forest Hills, NY 11375","Queens","clean"],
    ["QN-302","Helen Mirren","+1 (347) 555-0308","102-10 66th Rd, Apt 6D, Forest Hills, NY 11375","Queens","clean"],
    ["QN-303","Ray Romano","+1 (347) 555-0309","102-10 66th Rd, Apt 7A, Forest Hills, NY 11375","Queens","clean"],
    ["QN-401","Tenzin Gyatso","+1 (347) 555-0310","72-12 Roosevelt Ave, Apt 3, Jackson Heights, NY 11372","Queens","clean"],
    ["QN-402","Siddharth Gautam","+1 (347) 555-0311","72-12 Roosevelt Ave, Apt 4, Jackson Heights, NY 11372","Queens","clean"],
    ["QN-403","Nisha Patel","+1 (347) 555-0312","72-12 Roosevelt Ave, Apt 5, Jackson Heights, NY 11372","Queens","clean"],
    ["BX-101","Desiree Coleman","+1 (718) 555-0401","1280 Grand Concourse, Apt 3B, Bronx, NY 10456","Bronx","clean"],
    ["BX-102","Jose Martinez","+1 (718) 555-0402","1280 Grand Concourse, Apt 3C, Bronx, NY 10456","Bronx","clean"],
    ["BX-201","Aaliyah Jackson","+1 (718) 555-0403","1280 Grand Concourse, Apt 4F, Bronx, NY 10456","Bronx","clean"],
    ["BX-202","Tyler Durden","+1 (718) 555-0404","2354 Arthur Ave, Apt 2A, Bronx, NY 10458","Bronx","clean"],
    ["BX-203","Sofia Vergara","+1 (718) 555-0405","2354 Arthur Ave, Apt 2B, Bronx, NY 10458","Bronx","clean"]
  ];

  var STATUS = {
    clean:        { label: "Active clean",   dot: "#22c55e" },
    triage:       { label: "1. Triage",      dot: "#60a5fa" },
    sourced:      { label: "2. Sourced",     dot: "#3b82f6" },
    quote_review: { label: "3. Quote review", dot: "#f59e0b" },
    signoff:      { label: "4. Sign-off",    dot: "#2563eb" },
    pay:          { label: "5. Pay pro",     dot: "#a855f7" }
  };

  var STATUS_ORDER = ["clean", "triage", "sourced", "quote_review", "signoff", "pay"];

  var EMERGENCIES = [
    {
      ticket: "TKT-101", unit: "BK-301", tenant: "Marcus Washington",
      category: "Plumbing", stage: "quote_review",
      issue: "Heavy kitchen faucet leak causing active water logging and risk of cabinetry rot.",
      vendor: "Brooklyn Pipe Pro", quote: 185
    },
    {
      ticket: "TKT-102", unit: "MN-302", tenant: "Isabella Garcia",
      category: "Electrical", stage: "triage",
      issue: "Sparking wall outlet accompanied by burnt plastic odor, posing an immediate electrical fire hazard.",
      vendor: "Gotham Electric LLC", quote: 320
    },
    {
      ticket: "TKT-103", unit: "QN-103", tenant: "Chloe Bennett",
      category: "Locksmith", stage: "sourced",
      issue: "Tenant lockout with key broken or jammed inside primary lock cylinder.",
      vendor: "Central Locksmiths NYC", quote: 120
    }
  ];

  var ATTENTION = [
    { unit: "BK-101", tenant: "Carlos Rodriguez", note: "Lease ends 31 Aug 2026 — renewal packet not yet returned." },
    { unit: "BK-102", tenant: "Sarah Jenkins",    note: "Lease ends 14 Sep 2026 — renewal offer sent, awaiting reply." }
  ];

  // 15 historical entries across the five job categories. Totals $3,295.00.
  var LEDGER = [
    { id: "EXP-1005", date: "06/03/2026", unit: "MN-102 (Apt 1B)", category: "Electrical", vendor: "Gotham Electric LLC",             description: "Replaced tripping breaker in main panel",              amount: 295 },
    { id: "EXP-1006", date: "06/05/2026", unit: "BX-201 (Apt 4F)", category: "Plumbing",   vendor: "Borough Plumbing & Drain",        description: "Snaked bathroom stack and reseated toilet flange",  amount: 210 },
    { id: "EXP-1007", date: "06/08/2026", unit: "MN-701 (Apt 11B)",category: "HVAC",       vendor: "Empire Mechanical & HVAC",        description: "Annual boiler service and pressure-relief valve swap", amount: 380 },
    { id: "EXP-1008", date: "06/11/2026", unit: "QN-301 (Apt 6C)", category: "Handyman",   vendor: "Dave's Multi-Service Handyman",   description: "Patched and repainted ceiling after minor leak",    amount: 165 },
    { id: "EXP-1009", date: "06/13/2026", unit: "BK-601 (Apt 1)",  category: "Locksmith",  vendor: "Central Locksmiths NYC",          description: "Rekeyed unit after tenant turnover",                amount: 95 },
    { id: "EXP-1001", date: "06/15/2026", unit: "BK-101 (Apt 1A)", category: "Plumbing",   vendor: "Brooklyn Pipe Pro",               description: "Cleared clogged toilet and main drain line",        amount: 140 },
    { id: "EXP-1010", date: "06/18/2026", unit: "BK-401 (Apt 4A)", category: "Electrical", vendor: "Gotham Electric LLC",             description: "Installed GFCI outlets in kitchen and bath",        amount: 240 },
    { id: "EXP-1011", date: "06/20/2026", unit: "BK-702 (Apt 5E)", category: "Plumbing",   vendor: "Brooklyn Pipe Pro",               description: "Replaced corroded shower mixing valve",             amount: 265 },
    { id: "EXP-1002", date: "06/22/2026", unit: "MN-201 (Apt 2A)", category: "HVAC",       vendor: "Metro HVAC & Heating Services",   description: "Replaced faulty AC compressor capacitor and recharged coolant", amount: 450 },
    { id: "EXP-1012", date: "06/25/2026", unit: "QN-402 (Apt 4)",  category: "HVAC",       vendor: "Metro HVAC & Heating Services",   description: "Cleaned condenser coils and replaced filters",      amount: 175 },
    { id: "EXP-1013", date: "06/27/2026", unit: "BX-102 (Apt 3C)", category: "Handyman",   vendor: "Staten Fast Handyman & Locksmith",description: "Rehung entry door and adjusted strike plate",       amount: 130 },
    { id: "EXP-1003", date: "06/28/2026", unit: "QN-202 (Apt 4F)", category: "Handyman",   vendor: "Dave's Multi-Service Handyman",   description: "Reattached fallen kitchen cabinet door and repaired hinges", amount: 85 },
    { id: "EXP-1014", date: "06/30/2026", unit: "MN-803 (Apt 5A)", category: "Electrical", vendor: "Gotham Electric LLC",             description: "Replaced hallway fixture and dimmer switch",        amount: 185 },
    { id: "EXP-1015", date: "07/01/2026", unit: "QN-203 (Apt 5B)", category: "Plumbing",   vendor: "Borough Plumbing & Drain",        description: "Repaired leaking radiator valve",                   amount: 370 },
    { id: "EXP-1004", date: "07/02/2026", unit: "BX-101 (Apt 3B)", category: "Locksmith",  vendor: "Central Locksmiths NYC",          description: "Replaced front entrance deadbolt and cut 3 new keys", amount: 110 }
  ];

  var VENDORS = [
    { id: "V-001", name: "Brooklyn Pipe Pro",                specialty: "Plumber",     rate: "$140/hr",      rating: 4.9 },
    { id: "V-002", name: "Gotham Electric LLC",              specialty: "Electrician", rate: "$165/hr",      rating: 4.8 },
    { id: "V-003", name: "Central Locksmiths NYC",           specialty: "Locksmith",   rate: "$95 / callout", rating: 4.7 },
    { id: "V-004", name: "Metro HVAC & Heating Services",    specialty: "HVAC",        rate: "$180/hr",      rating: 4.9 },
    { id: "V-005", name: "Dave's Multi-Service Handyman",    specialty: "Handyman",    rate: "$80/hr",       rating: 4.6 },
    { id: "V-006", name: "Empire Mechanical & HVAC",         specialty: "HVAC",        rate: "$190/hr",      rating: 4.8 },
    { id: "V-007", name: "Borough Plumbing & Drain",         specialty: "Plumber",     rate: "$150/hr",      rating: 4.7 },
    { id: "V-008", name: "Staten Fast Handyman & Locksmith", specialty: "Handyman",    rate: "$85/hr",       rating: 4.5 }
  ];

  var CATEGORIES = ["Plumbing", "HVAC", "Electrical", "Handyman", "Locksmith"];
  var BOROUGHS = ["All", "Brooklyn", "Manhattan", "Queens", "Bronx"];

  return {
    tenants: TENANTS.map(function (r) {
      return {
        unit: r[0], name: r[1], phone: r[2], address: r[3],
        borough: r[4], status: r[5], first: r[1].split(" ")[0]
      };
    }),
    status: STATUS,
    statusOrder: STATUS_ORDER,
    emergencies: EMERGENCIES,
    attention: ATTENTION,
    ledger: LEDGER,
    vendors: VENDORS,
    categories: CATEGORIES,
    boroughs: BOROUGHS
  };
})();
