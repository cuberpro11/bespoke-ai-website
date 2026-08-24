/* ==========================================================================
   BESPOKE — real estate demo
   Self-contained demo runtime. No build step, no network: the triage,
   sourcing, and OCR responses are scripted so the demo behaves identically
   every time it is shown.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- data -- */

  // [id, tenant, phone, address, borough, status]
  var TENANT_ROWS = [
    ["BK-101","Carlos Rodriguez","+1 (917) 555-0101","420 Bergen St, Apt 1A, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-102","Sarah Jenkins","+1 (917) 555-0102","420 Bergen St, Apt 1B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-201","Amir Al-Mansoor","+1 (917) 555-0103","420 Bergen St, Apt 2A, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-202","Emily Zhao","+1 (917) 555-0104","420 Bergen St, Apt 2B, Brooklyn, NY 11217","Brooklyn","clean"],
    ["BK-301","Marcus Washington","+1 (917) 555-0105","420 Bergen St, Apt 3A, Brooklyn, NY 11217","Brooklyn","quote_approval"],
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
    ["QN-103","Chloe Bennett","+1 (347) 555-0303","41-15 34th Ave, Apt 3A, Astoria, NY 11106","Queens","hiring"],
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

  var UNITS = TENANT_ROWS.map(function (r) {
    return { id: r[0], tenant: r[1], phone: r[2], address: r[3], borough: r[4], stage: r[5] };
  });

  var VENDORS = [
    { id: "V-001", name: "Brooklyn Pipe Pro", specialty: "Plumber", phone: "+1 (718) 420-5692", rate: "$140/hr", rating: 4.9, boroughs: ["Brooklyn", "Queens", "Manhattan"] },
    { id: "V-002", name: "Gotham Electric LLC", specialty: "Electrician", phone: "+1 (212) 880-9011", rate: "$165/hr", rating: 4.8, boroughs: ["Manhattan", "Bronx", "Queens"] },
    { id: "V-003", name: "Central Locksmiths NYC", specialty: "Locksmith", phone: "+1 (212) 555-0909", rate: "$95 / callout", rating: 4.7, boroughs: ["Manhattan", "Brooklyn", "Queens", "Bronx"] },
    { id: "V-004", name: "Metro HVAC & Heating Services", specialty: "HVAC", phone: "+1 (347) 600-1122", rate: "$180/hr", rating: 4.9, boroughs: ["Queens", "Brooklyn", "Manhattan", "Bronx"] },
    { id: "V-005", name: "Dave's Multi-Service Handyman", specialty: "Handyman", phone: "+1 (917) 771-3329", rate: "$80/hr", rating: 4.6, boroughs: ["Brooklyn", "Queens"] },
    { id: "V-006", name: "Empire Mechanical & HVAC", specialty: "HVAC", phone: "+1 (212) 991-8833", rate: "$190/hr", rating: 4.8, boroughs: ["Manhattan", "Brooklyn"] },
    { id: "V-007", name: "Borough Plumbing & Drain", specialty: "Plumber", phone: "+1 (718) 332-9099", rate: "$150/hr", rating: 4.7, boroughs: ["Bronx", "Manhattan", "Queens"] },
    { id: "V-008", name: "Staten Fast Handyman & Locksmith", specialty: "Handyman", phone: "+1 (718) 555-8822", rate: "$85/hr", rating: 4.5, boroughs: ["Bronx", "Brooklyn"] }
  ];

  var SPECIALTY_BY_CATEGORY = {
    Plumbing: "Plumber",
    Electrical: "Electrician",
    HVAC: "HVAC",
    Locksmith: "Locksmith",
    General: "Handyman"
  };

  var STAGES = [
    { key: "triage",          n: 1, label: "Triage" },
    { key: "hiring",          n: 2, label: "Sourcing" },
    { key: "quote_approval",  n: 3, label: "Quote review" },
    { key: "confirming_fix",  n: 4, label: "Sign-off" },
    { key: "payment",         n: 5, label: "Settle pay" }
  ];
  var STAGE_INDEX = {};
  STAGES.forEach(function (s, i) { STAGE_INDEX[s.key] = i; });

  var tickets = [
    {
      id: "TKT-101",
      unitId: "BK-301",
      unitNumber: "BK-301 (Apt 3A)",
      rawMessage: "El grifo de la cocina está goteando mucho y mojando el gabinete. ¿Pueden ayudar?",
      translation: "The kitchen faucet is leaking a lot and wetting the cabinet. Can you help?",
      category: "Plumbing",
      severity: "Emergency",
      summary: "Heavy kitchen faucet leak causing active water logging and risk of cabinetry rot.",
      tenantReply: "Hola Marcus. Lamento escuchar sobre el grifo de la cocina en el Apt 3A. Un plomero de emergencia ha sido contactado. ¿Podría cerrar la llave de paso de agua debajo de su fregadero si es posible?",
      vendorId: "V-001",
      vendorName: "Brooklyn Pipe Pro",
      quoteAmount: 185,
      stage: "quote_approval",
      description: "Emergency callout, under-sink flex hose replacement and faucet seal"
    },
    {
      id: "TKT-102",
      unitId: "MN-302",
      unitNumber: "MN-302 (Apt 3B)",
      rawMessage: "My living room electrical outlet is sparking when I plug in the TV! There's a burnt smell.",
      translation: "",
      category: "Electrical",
      severity: "Emergency",
      summary: "Sparking wall outlet accompanied by burnt plastic odor, posing an immediate electrical fire hazard.",
      tenantReply: "Hi Isabella. Emergency action: please do not plug anything into that outlet and keep clear. We are dispatching Gotham Electric immediately to Apt 3B.",
      vendorId: "V-002",
      vendorName: "Gotham Electric LLC",
      quoteAmount: 320,
      stage: "triage",
      description: "Carbonized backsplash wiring re-spliced, new GFCI 15-amp outlet installed"
    },
    {
      id: "TKT-103",
      unitId: "QN-103",
      unitNumber: "QN-103 (Apt 3A)",
      rawMessage: "I can't get into my apartment, the key is stuck in the lock and won't turn. Help me, I'm stuck outside!",
      translation: "",
      category: "Locksmith",
      severity: "Emergency",
      summary: "Tenant lockout with key broken or jammed inside primary lock cylinder.",
      tenantReply: "Hi Chloe. We have received your emergency lockout alert. A local locksmith from Central Locksmiths has been dispatched to Astoria to bypass your lock and let you in. Estimated arrival: 25 mins.",
      vendorId: "V-003",
      vendorName: "Central Locksmiths NYC",
      quoteAmount: 120,
      stage: "hiring",
      description: "Emergency lockout response and key extraction from lock cylinder"
    }
  ];

  var ledger = [
    { id: "EXP-1001", unit: "BK-101 (Apt 1A)", vendor: "Brooklyn Pipe Pro", description: "Cleared clogged toilet and main drain line", date: "06/15/2026", amount: 140 },
    { id: "EXP-1002", unit: "MN-201 (Apt 2A)", vendor: "Metro HVAC & Heating Services", description: "Replaced faulty AC compressor capacitor and recharged coolant", date: "06/22/2026", amount: 450 },
    { id: "EXP-1003", unit: "QN-202 (Apt 4F)", vendor: "Dave's Multi-Service Handyman", description: "Reattached fallen kitchen cabinet door and repaired hinges", date: "06/28/2026", amount: 85 },
    { id: "EXP-1004", unit: "BX-101 (Apt 3B)", vendor: "Central Locksmiths NYC", description: "Replaced front entrance deadbolt and cut 3 new keys", date: "07/02/2026", amount: 110 }
  ];

  var INVOICES = [
    {
      label: "Plumbing leak · $185",
      text: "BROOKLYN PIPE PRO\nLicensed & Insured Plumbing Services\nPH: +1 (718) 420-5692\nEmail: billing@brooklynpipepro.com\n\nINVOICE #: BPP-990812\nDATE: 07/06/2026\nCLIENT: NYC Property Managers LLC\nPROPERTY WORK SITE: 420 Bergen St, Apt 3A, Brooklyn, NY (Unit BK-301)\n\nLINE ITEMS:\n1. Emergency diagnostic callout fee ------------------------ $85.00\n2. Replacement of leaky under-sink hot water flex hose ----- $45.00\n3. Labor: installation of faucet seal and pressure testing -- $55.00\n\nTOTAL DUE: $185.00\nPayment Status: pending",
      parsed: [
        ["Vendor", "Brooklyn Pipe Pro"],
        ["Invoice #", "BPP-990812"],
        ["Unit", "BK-301 (Apt 3A)"],
        ["Category", "Plumbing"],
        ["Line items", "3 detected"],
        ["Contact", "+1 (718) 420-5692"],
        ["Total due", "$185.00"]
      ]
    },
    {
      label: "Electrical repair · $320",
      text: "GOTHAM ELECTRIC LLC\nHigh-Voltage Commercial & Residential Specialists\n140 W 26th St, New York, NY 10001\nPh: +1 (212) 880-9011\n\nSTATEMENT OF ACCOUNT / INVOICE\nInvoice Date: July 05, 2026\nBilled To: NYC AI Property Portfolios\n\nService Location: 245 E 82nd St, Apt 3B, Manhattan, NY (Unit MN-302)\nTechnician: James Miller (Lic #88931)\n\nDescription of Work:\nResponded to emergency tenant ticket reporting sparks and burnt odor.\nIsolated breaker. Found carbonized wiring inside kitchen backsplash outlet.\nPigtail spliced scorched wiring with copper extensions and installed new\nSpecification Grade GFCI 15-Amp socket outlet. Safety tested load. OK.\n\nFEE BREAKDOWN:\n- Dispatch and emergency diagnostics: $120.00\n- 1x GFCI outlet and heavy copper wire materials: $40.00\n- 1 hour electrical diagnostic/repair labor: $160.00\n\nTOTAL AMOUNT DUE: $320.00",
      parsed: [
        ["Vendor", "Gotham Electric LLC"],
        ["Invoice date", "07/05/2026"],
        ["Unit", "MN-302 (Apt 3B)"],
        ["Category", "Electrical"],
        ["Technician", "James Miller (Lic #88931)"],
        ["Contact", "+1 (212) 880-9011"],
        ["Total due", "$320.00"]
      ]
    },
    {
      label: "Locksmith callout · $120",
      text: "CENTRAL LOCKSMITHS NYC\nEmergency Lockout Specialists\nPh: +1 (212) 555-0909\n\nINVOICE FOR COMPLETED SERVICE\nReceipt ID: CL-22091\nService Date: 07/07/2026\n\nBorough Service Site: Astoria, Queens - 41-15 34th Ave, Apt 3A (Unit QN-103)\nTenant: Chloe Bennett\n\nSERVICES RENDERED:\n- Prompt emergency lockout response ---------------------- $95.00\n- Key extraction from lock cylinder ---------------------- $25.00\n\nTOTAL CHARGES: $120.00\nCustomer signature on file.",
      parsed: [
        ["Vendor", "Central Locksmiths NYC"],
        ["Receipt ID", "CL-22091"],
        ["Unit", "QN-103 (Apt 3A)"],
        ["Category", "Locksmith"],
        ["Service date", "07/07/2026"],
        ["Contact", "+1 (212) 555-0909"],
        ["Total due", "$120.00"]
      ]
    }
  ];

  // Keyword routing so free-text tenant messages still get a sensible triage.
  // Order matters: the most specific trades are tested first, so a heater that
  // is "leaking" lands on HVAC rather than Plumbing, and a tenant "stuck out in
  // the cold" behind a jammed deadbolt lands on Locksmith rather than HVAC.
  var ROUTES = [
    {
      category: "Locksmith",
      test: /lock|key|deadbolt|jam/i,
      quote: 120,
      summary: "Tenant lockout with key jammed or broken inside the primary lock cylinder.",
      reply: "We have your lockout alert. A local locksmith has been dispatched to bypass the lock and let you in. Estimated arrival: 25 mins.",
      description: "Emergency lockout response and cylinder service"
    },
    {
      category: "Electrical",
      test: /outlet|spark|smok|electric|breaker|wiring|burnt|shock|circuit/i,
      quote: 320,
      summary: "Electrical fault with visible sparking or burning odor, treated as an immediate fire hazard.",
      reply: "Emergency action: please stop using that outlet and keep the area clear. A licensed electrician is being dispatched to you now.",
      description: "Emergency electrical diagnostics and outlet replacement"
    },
    {
      category: "HVAC",
      test: /heat|heater|radiator|boiler|furnace|freez|thermostat|air condition|hvac|whistl|\bac\b|a\/c/i,
      quote: 140,
      summary: "Heating or cooling plant failure leaving the unit outside habitable temperature range.",
      reply: "Sorry about the temperature in your unit. An HVAC technician has been dispatched. Please keep interior doors open to help circulate what heat remains.",
      description: "HVAC diagnostic callout and component service"
    },
    {
      category: "Plumbing",
      test: /leak|leaking|faucet|water|pipe|drain|toilet|sink|flood|tuber|agua|goteando|grifo/i,
      quote: 185,
      summary: "Active water escape reported in unit. Risk of cabinetry and floor damage if left unattended.",
      reply: "Thanks for flagging this. An emergency plumber has been contacted. If you can safely reach the shut-off valve under the fixture, please close it while you wait.",
      description: "Emergency plumbing callout, leak isolation and seal replacement"
    },
    {
      category: "General",
      test: /.*/,
      quote: 95,
      summary: "General maintenance request logged from tenant intake and routed to a borough handyman.",
      reply: "Thanks for the message — we have logged this and a handyman from your borough is being scheduled. We will confirm a window shortly.",
      description: "General maintenance callout and repair"
    }
  ];

  var STATUS_STEPS = [
    "Connecting to SMS gateway…",
    "Routing text through the Bespoke triage model…",
    "Querying the NYC vendor specialty matrix…"
  ];

  /* --------------------------------------------------------------- state -- */

  var state = {
    selectedTicket: "TKT-101",
    borough: "All",
    search: "",
    autopilot: true,
    invoiceIndex: 0,
    ledgerSeq: 1004,
    ticketSeq: 103,
    busy: false,
    booted: false
  };

  var motion = {
    ticketsEntered: false,
    ledgerEntered: false,
    unitsEntered: false,
    summaryEntered: false
  };

  /* ------------------------------------------------------------- helpers -- */

  function $(sel) { return doc.querySelector(sel); }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function wait(ms) {
    return new Promise(function (res) { setTimeout(res, REDUCED ? Math.min(ms, 60) : ms); });
  }
  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function unitById(id) {
    for (var i = 0; i < UNITS.length; i++) { if (UNITS[i].id === id) return UNITS[i]; }
    return null;
  }
  function ticketById(id) {
    for (var i = 0; i < tickets.length; i++) { if (tickets[i].id === id) return tickets[i]; }
    return null;
  }
  function aptOf(unit) {
    var m = unit.address.split(", Apt ")[1];
    return m ? m.split(",")[0] : "1A";
  }
  function pickVendor(category, borough) {
    var specialty = SPECIALTY_BY_CATEGORY[category] || "Handyman";
    var pool = VENDORS.filter(function (v) {
      return v.specialty === specialty && v.boroughs.indexOf(borough) !== -1;
    });
    if (pool.length) {
      return pool.sort(function (a, b) { return b.rating - a.rating; })[0];
    }
    return VENDORS.filter(function (v) { return v.specialty === "Handyman"; })[0] || VENDORS[0];
  }
  function routeFor(message) {
    for (var i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].test.test(message)) return ROUTES[i];
    }
    return ROUTES[ROUTES.length - 1];
  }
  function todayStamp() {
    var d = new Date();
    var p = function (v) { return String(v).padStart(2, "0"); };
    return p(d.getMonth() + 1) + "/" + p(d.getDate()) + "/" + d.getFullYear();
  }

  /* ------------------------------------------------------------- reveals -- */

  doc.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--i", i);
    });
  });

  var revealEls = doc.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (REDUCED || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (n) { n.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
      revealEls.forEach(function (n) { io.observe(n); });
      // safety net: never leave content stuck invisible
      setTimeout(function () {
        revealEls.forEach(function (n) { n.classList.add("is-visible"); });
      }, 2600);
    }
  }

  /* ------------------------------------------------------------ count-up -- */

  function countUp(node) {
    var target = Number(node.dataset.count || 0);
    var prefix = node.dataset.prefix || "";
    var suffix = node.dataset.suffix || "";
    var from = Number(node.dataset.from || 0);
    node.dataset.counted = "1";
    // No animation when motion is reduced, or when the tab is backgrounded and
    // rAF is paused — otherwise the number would sit at its start value.
    if (REDUCED || doc.hidden) {
      node.textContent = prefix + target.toLocaleString("en-US") + suffix;
      return;
    }
    var dur = 900;
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(from + (target - from) * eased);
      node.textContent = prefix + val.toLocaleString("en-US") + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function retarget(node, value) {
    node.dataset.from = node.dataset.count || 0;
    node.dataset.count = value;
    countUp(node);
    var card = node.closest(".kpi");
    if (card && !REDUCED) {
      card.classList.remove("kpi--flash");
      void card.offsetWidth;
      card.classList.add("kpi--flash");
    }
  }

  var countEls = doc.querySelectorAll("[data-count]");
  if (!("IntersectionObserver" in window) || REDUCED || doc.hidden) {
    countEls.forEach(countUp);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    countEls.forEach(function (n) { cio.observe(n); });
    // Safety net: observer callbacks never run in a tab the browser is not
    // rendering, which would leave the KPIs stuck on their placeholder zeros.
    setTimeout(function () {
      countEls.forEach(function (n) {
        if (!n.dataset.counted) countUp(n);
      });
    }, 2600);
  }

  /* --------------------------------------------------------------- toast -- */

  var toastWrap = $("#toasts");

  function toast(message, kind) {
    var t = el("div", "toast" + (kind ? " toast--" + kind : ""), message);
    toastWrap.appendChild(t);
    setTimeout(function () {
      t.classList.add("is-out");
      setTimeout(function () { t.remove(); }, REDUCED ? 10 : 280);
    }, 4200);
  }

  /* ----------------------------------------------------------- autopilot -- */

  var autopilotToggle = $("#autopilotToggle");
  var autopilotLabel = $("#autopilotLabel");
  autopilotToggle.addEventListener("click", function () {
    state.autopilot = !state.autopilot;
    autopilotToggle.classList.toggle("is-on", state.autopilot);
    autopilotToggle.setAttribute("aria-checked", String(state.autopilot));
    autopilotLabel.innerHTML = state.autopilot
      ? 'Enabled <span>(quotes &lt; $150)</span>'
      : 'Disabled <span>(all quotes reviewed)</span>';
    toast(
      state.autopilot
        ? "Autopilot on — quotes under $150 dispatch without review."
        : "Autopilot off — every quote now waits for manual approval.",
      state.autopilot ? "ok" : "warn"
    );
  });

  /* ------------------------------------------------------ ticket rendering -- */

  var ticketList = $("#ticketList");
  var pipelineEmpty = $("#pipelineEmpty");
  var kpiTickets = $("#kpiTickets");

  var STEP_COPY = {
    triage: function (t) {
      return {
        head: "Step 1: AI triage completed",
        body: 'Tenant texted: <em>“' + escapeHtml(truncate(t.rawMessage, 58)) + '”</em>. Matched to ' + t.category + '.',
        btn: "Hire service professional",
        btnClass: "btn--primary",
        arrow: true
      };
    },
    hiring: function (t) {
      return {
        head: "Step 2: Hiring sourced specialist",
        body: "Sourced local borough vendor: <strong>" + escapeHtml(t.vendorName) + "</strong>. Ready to draft quote.",
        btn: "Review quote estimate",
        btnClass: "btn--primary",
        arrow: true
      };
    },
    quote_approval: function (t) {
      return {
        head: "Step 3: Awaiting quote approval",
        body: "Vendor quote received: <b>" + money(t.quoteAmount) + "</b>. Approve to notify tenant.",
        btn: "Approve quote: " + money(t.quoteAmount),
        btnClass: "btn--approve",
        arrow: false
      };
    },
    confirming_fix: function (t) {
      return {
        head: "Step 4: Verify fix with tenant",
        body: escapeHtml(t.vendorName) + " finished the work. Ask the tenant to confirm the issue is resolved.",
        btn: "Verify fix with tenant",
        btnClass: "btn--primary",
        arrow: true
      };
    },
    payment: function (t) {
      return {
        head: "Step 5: Handover & settle invoice",
        body: "Tenant confirmed the work is complete. Settle the contractor fee of <b>" + money(t.quoteAmount) + "</b>.",
        btn: "Pay contractor: " + money(t.quoteAmount),
        btnClass: "btn--settle",
        arrow: false
      };
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

  function stageMarkup(stage) {
    var current = STAGE_INDEX[stage];
    return STAGES.map(function (s, i) {
      var cls = "stage" + (i < current ? " is-done" : i === current ? " is-current" : "");
      var inner = i < current
        ? '<svg class="stage__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        : s.n;
      return '<span class="' + cls + '">' +
             '<span class="stage__num">' + inner + "</span>" +
             '<span class="stage__label">' + s.label + "</span>" +
             "</span>";
    }).join("");
  }

  function ticketMarkup(t) {
    var copy = STEP_COPY[t.stage](t);
    var pct = ((STAGE_INDEX[t.stage] + 1) / STAGES.length) * 100;
    var badge = t.dispatched
      ? '<span class="badge badge--dispatched">Dispatched</span>'
      : t.severity === "Emergency"
        ? '<span class="badge">Emergency</span>'
        : '<span class="badge badge--routine">Routine</span>';

    return '' +
      '<div class="ticket__top">' +
        '<span class="ticket__unit mono">' + escapeHtml(t.unitId) + "</span>" +
        '<span class="ticket__cat">(' + escapeHtml(t.category) + ")</span>" +
        badge +
        '<span class="ticket__id">ID: ' + escapeHtml(t.id) + "</span>" +
      "</div>" +
      '<div class="stages">' + stageMarkup(t.stage) + "</div>" +
      '<div class="progress"><span class="progress__fill" style="width:' + pct + '%"></span></div>' +
      '<div class="ticket__foot">' +
        '<div class="ticket__status">' +
          '<span class="ticket__step">' + copy.head + "</span>" +
          '<p class="ticket__desc">' + copy.body + "</p>" +
        "</div>" +
        '<button class="btn ' + copy.btnClass + '" type="button" data-advance="' + t.id + '">' +
          escapeHtml(copy.btn) +
          (copy.arrow ? ' <span class="arr" aria-hidden="true">→</span>' : "") +
        "</button>" +
      "</div>";
  }

  function renderTickets() {
    var boot = !motion.ticketsEntered;
    ticketList.innerHTML = "";
    tickets.forEach(function (t, i) {
      var extra = (boot && !REDUCED) ? " ticket--boot" : "";
      var card = el("div", "ticket" + (t.id === state.selectedTicket ? " is-selected" : "") + extra);
      card.dataset.ticket = t.id;
      card.style.setProperty("--i", i);
      card.innerHTML = ticketMarkup(t);
      ticketList.appendChild(card);
      if (boot && !REDUCED) {
        var fill = card.querySelector(".progress__fill");
        if (fill) {
          var target = fill.style.width;
          fill.style.width = "0%";
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { fill.style.width = target; });
          });
        }
      }
    });
    motion.ticketsEntered = true;
    if (boot && !REDUCED) {
      setTimeout(function () {
        ticketList.querySelectorAll(".ticket--boot").forEach(function (n) {
          n.classList.remove("ticket--boot");
        });
      }, 1200);
    }
    pipelineEmpty.hidden = tickets.length > 0;
    renderUnits();
  }

  // Re-render a single card in place so the progress bar can animate its width.
  function refreshTicket(t, opts) {
    var card = ticketList.querySelector('[data-ticket="' + t.id + '"]');
    if (!card) return;
    var fill = card.querySelector(".progress__fill");
    var oldPct = fill ? fill.style.width : "0%";
    card.innerHTML = ticketMarkup(t);
    var newFill = card.querySelector(".progress__fill");
    if (newFill && !REDUCED) {
      var target = newFill.style.width;
      newFill.style.width = oldPct;
      requestAnimationFrame(function () { newFill.style.width = target; });
    }
    if (opts && opts.advanced && !REDUCED) {
      card.classList.remove("ticket--advanced");
      void card.offsetWidth;
      card.classList.add("ticket--advanced");
    }
  }

  ticketList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-advance]");
    if (btn) {
      e.stopPropagation();
      advance(btn.dataset.advance);
      return;
    }
    var card = e.target.closest("[data-ticket]");
    if (card) selectTicket(card.dataset.ticket);
  });

  function selectTicket(id) {
    if (state.selectedTicket === id) return;
    state.selectedTicket = id;
    ticketList.querySelectorAll("[data-ticket]").forEach(function (n) {
      n.classList.toggle("is-selected", n.dataset.ticket === id);
    });
    renderSummary(true);
    renderUnits();
  }

  function advance(id) {
    var t = ticketById(id);
    if (!t) return;
    var idx = STAGE_INDEX[t.stage];

    if (idx === STAGES.length - 1) {
      settle(t);
      return;
    }

    t.stage = STAGES[idx + 1].key;
    t.dispatched = false;
    var unit = unitById(t.unitId);
    if (unit) unit.stage = t.stage;

    refreshTicket(t, { advanced: true });
    if (t.id === state.selectedTicket) renderSummary(false);
    renderUnits();

    if (t.stage === "confirming_fix") {
      toast("Quote approved — " + t.vendorName + " notified and tenant updated by SMS.", "ok");
    } else if (t.stage === "payment") {
      toast("Tenant confirmed the fix at " + t.unitNumber + ".", "ok");
    }
  }

  function settle(t) {
    state.ledgerSeq += 1;
    var row = {
      id: "EXP-" + state.ledgerSeq,
      unit: t.unitNumber,
      vendor: t.vendorName,
      description: t.description,
      date: todayStamp(),
      amount: t.quoteAmount,
      isNew: true
    };
    ledger.push(row);

    var unit = unitById(t.unitId);
    if (unit) unit.stage = "clean";

    var card = ticketList.querySelector('[data-ticket="' + t.id + '"]');
    var remove = function () {
      tickets = tickets.filter(function (x) { return x.id !== t.id; });
      renderTickets();
      renderSummary(true);
      updateTicketCount();
    };

    if (card && !REDUCED) {
      card.classList.add("ticket--settling");
      setTimeout(remove, 400);
    } else {
      remove();
    }

    if (state.selectedTicket === t.id) {
      var next = tickets.filter(function (x) { return x.id !== t.id; })[0];
      state.selectedTicket = next ? next.id : null;
    }

    renderLedger();
    toast(t.vendorName + " paid " + money(t.quoteAmount) + " — logged as " + row.id + ".", "ok");
  }

  function updateTicketCount() {
    retarget(kpiTickets, tickets.length);
  }

  /* ------------------------------------------------------------- summary -- */

  var summaryPanel = $("#summaryPanel");
  var summaryBody = $("#summaryBody");
  var typingTimers = [];

  function clearTyping() {
    typingTimers.forEach(clearTimeout);
    typingTimers = [];
    doc.querySelectorAll(".is-typing").forEach(function (n) { n.classList.remove("is-typing"); });
  }

  function typeInto(node, text, speed) {
    // Same rationale as countUp: timers are clamped hard in a tab the browser
    // is not rendering, which would leave half-typed text on screen.
    if (REDUCED || doc.hidden) { node.textContent = text; return; }
    node.textContent = "";
    node.classList.add("is-typing");
    var i = 0;
    var step = Math.max(1, Math.round(text.length / 90));
    function tick() {
      i = Math.min(text.length, i + step);
      node.textContent = text.slice(0, i);
      if (i < text.length) {
        typingTimers.push(setTimeout(tick, speed));
      } else {
        node.classList.remove("is-typing");
      }
    }
    typingTimers.push(setTimeout(tick, speed));
  }

  function renderSummary(animate) {
    var t = ticketById(state.selectedTicket);
    if (!t) {
      summaryPanel.hidden = true;
      return;
    }
    summaryPanel.hidden = false;
    clearTyping();

    var paint = function () {
      $("#summaryTicket").textContent = t.id;
      $("#summaryUnit").textContent = t.unitNumber;
      $("#summaryStep").textContent = t.stage.toUpperCase();

      $("#sumRaw").textContent = "“" + t.rawMessage + "”";

      var transWrap = $("#sumTransWrap");
      if (t.translation) {
        transWrap.hidden = false;
        typeInto($("#sumTranslation"), t.translation, 16);
      } else {
        transWrap.hidden = true;
      }

      $("#sumReply").textContent = "“" + t.tenantReply + "”";
      typeInto($("#sumSummary"), t.summary, 14);

      var vendor = VENDORS.filter(function (v) { return v.id === t.vendorId; })[0] || {};
      $("#sumVendorName").textContent = t.vendorName;
      $("#sumVendorPhone").textContent = vendor.phone || "";
      $("#sumVendorCoverage").textContent = "Borough coverage: " + (unitById(t.unitId) || {}).borough;
      $("#sumQuote").textContent = money(t.quoteAmount) + " quote";

      if (animate && !REDUCED) {
        summaryBody.classList.remove("is-swapping");
        summaryBody.classList.add("is-enter");
        setTimeout(function () { summaryBody.classList.remove("is-enter"); }, 700);
      } else if (!motion.summaryEntered && !REDUCED) {
        summaryBody.classList.add("is-enter");
        setTimeout(function () { summaryBody.classList.remove("is-enter"); }, 700);
      }
      motion.summaryEntered = true;
    };

    if (animate && !REDUCED) {
      summaryBody.classList.add("is-swapping");
      setTimeout(paint, 180);
    } else {
      paint();
    }
  }

  /* -------------------------------------------------------------- ledger -- */

  var ledgerBody = $("#ledgerBody");
  var ledgerTotal = $("#ledgerTotal");
  var kpiLedger = $("#kpiLedger");

  function renderLedger() {
    ledgerBody.innerHTML = "";
    ledger.forEach(function (row, i) {
      var cls = row.isNew ? "row--new" : (!motion.ledgerEntered ? "row--boot" : "");
      var tr = el("tr", cls);
      tr.style.setProperty("--i", i);
      tr.innerHTML =
        '<td class="c-id">' + escapeHtml(row.id) + "</td>" +
        '<td class="c-unit">' + escapeHtml(row.unit) + "</td>" +
        '<td class="c-vendor">' + escapeHtml(row.vendor) + "</td>" +
        "<td>" + escapeHtml(row.description) + "</td>" +
        '<td class="c-date">' + escapeHtml(row.date) + "</td>" +
        '<td class="c-cost">' + money(row.amount) + "</td>" +
        '<td><span class="tag-paid">Paid</span></td>';
      ledgerBody.appendChild(tr);
      row.isNew = false;
    });
    motion.ledgerEntered = true;
    if (!REDUCED) {
      setTimeout(function () {
        ledgerBody.querySelectorAll(".row--boot").forEach(function (n) {
          n.classList.remove("row--boot");
        });
      }, 1000);
    }

    var total = ledger.reduce(function (sum, r) { return sum + r.amount; }, 0);
    ledgerTotal.textContent = money(total);
    // On boot the KPI is animated by the intersection observer instead, so the
    // number still counts up from zero when the card scrolls into view.
    if (state.booted) retarget(kpiLedger, total);
  }

  /* ---------------------------------------------------------- unit monitor -- */

  var unitGrid = $("#unitGrid");
  var unitEmpty = $("#unitEmpty");
  var unitSearch = $("#unitSearch");

  function renderUnits() {
    var q = state.search.trim().toLowerCase();
    var list = UNITS.filter(function (u) {
      if (state.borough !== "All" && u.borough !== state.borough) return false;
      if (!q) return true;
      return u.id.toLowerCase().indexOf(q) !== -1 || u.tenant.toLowerCase().indexOf(q) !== -1;
    });

    unitGrid.innerHTML = "";
    var boot = !motion.unitsEntered && !REDUCED;
    list.forEach(function (u, i) {
      var active = tickets.some(function (t) { return t.unitId === u.id; });
      var node = el("button", "unit" + (active ? " is-active" : "") + (boot ? " unit--boot" : ""));
      node.type = "button";
      node.dataset.unit = u.id;
      node.dataset.stage = active ? u.stage : "clean";
      node.style.setProperty("--i", Math.min(i, 40));
      node.title = "Apt " + u.id + " - " + u.tenant + " (" + u.borough + "). Click to simulate issue or inspect active workflow.";
      node.setAttribute(
        "aria-label",
        "Apt " + u.id + ", " + u.tenant + (active ? ", open ticket" : ", no open ticket")
      );
      node.innerHTML =
        '<span class="unit__dot" aria-hidden="true"></span>' +
        '<span class="unit__id">' + escapeHtml(u.id) + "</span>" +
        '<span class="unit__name">' + escapeHtml(u.tenant.split(" ")[0]) + "</span>";
      unitGrid.appendChild(node);
    });
    if (boot) {
      motion.unitsEntered = true;
      setTimeout(function () {
        unitGrid.querySelectorAll(".unit--boot").forEach(function (n) {
          n.classList.remove("unit--boot");
        });
      }, 1400);
    } else {
      motion.unitsEntered = true;
    }

    unitEmpty.hidden = list.length > 0;
  }

  function openUnit(id) {
    var unit = unitById(id);
    if (!unit) return;

    var ticket = null;
    for (var i = 0; i < tickets.length; i++) {
      if (tickets[i].unitId === id) { ticket = tickets[i]; break; }
    }

    if (ticket) {
      selectTicket(ticket.id);
      var card = ticketList.querySelector('[data-ticket="' + ticket.id + '"]');
      if (card) {
        card.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
      }
      toast("Switched workspace to Apt " + id);
      return;
    }

    simUnit.value = id;
    simMessage.value = "Hi, this is " + unit.tenant + " in Apt " + id.slice(-3) +
      ". There is a maintenance issue in my apartment.";
    toast("Apt " + id + " selected in simulator!");
    var sandbox = simMessage.closest(".panel");
    if (sandbox) {
      sandbox.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
    }
  }

  unitGrid.addEventListener("click", function (e) {
    var tile = e.target.closest("[data-unit]");
    if (tile) openUnit(tile.dataset.unit);
  });

  $("#boroughTabs").addEventListener("click", function (e) {
    var tab = e.target.closest("[data-borough]");
    if (!tab) return;
    state.borough = tab.dataset.borough;
    this.querySelectorAll(".tab").forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderUnits();
  });

  var searchTimer;
  unitSearch.addEventListener("input", function () {
    clearTimeout(searchTimer);
    var value = this.value;
    searchTimer = setTimeout(function () {
      state.search = value;
      renderUnits();
    }, 120);
  });

  /* ------------------------------------------------------------- sandbox -- */

  var simUnit = $("#simUnit");
  var simMessage = $("#simMessage");
  var sendSms = $("#sendSms");
  var simCall = $("#simCall");
  var aiStatus = $("#aiStatus");
  var aiStatusText = $("#aiStatusText");

  UNITS.forEach(function (u) {
    var opt = el("option", null, u.id + " — " + u.tenant + " (" + u.borough + ")");
    opt.value = u.id;
    simUnit.appendChild(opt);
  });
  simUnit.value = "BK-301";

  doc.querySelectorAll(".preset").forEach(function (btn) {
    btn.addEventListener("click", function () {
      simUnit.value = btn.dataset.unit;
      simMessage.value = btn.dataset.message;
      simMessage.focus();
    });
  });

  sendSms.addEventListener("click", function () {
    var msg = simMessage.value.trim();
    if (!msg) {
      toast("Write a tenant message or pick a scenario preset first.", "warn");
      simMessage.focus();
      return;
    }
    intake(msg, simUnit.value);
  });

  simCall.addEventListener("click", function () {
    intake(
      "Emergency! The main heater in the bedroom is whistling loudly and leaking yellow liquid. It's totally cold!",
      "MN-101"
    );
  });

  async function setStatus(text) {
    if (REDUCED) { aiStatusText.textContent = text; return; }
    aiStatusText.classList.add("is-fading");
    await wait(110);
    aiStatusText.textContent = text;
    aiStatusText.classList.remove("is-fading");
  }

  async function intake(message, unitId) {
    if (state.busy) return;
    var unit = unitById(unitId);
    if (!unit) return;

    state.busy = true;
    sendSms.disabled = true;
    simCall.disabled = true;
    aiStatus.hidden = false;
    if (!REDUCED) {
      aiStatus.style.animation = "none";
      void aiStatus.offsetWidth;
      aiStatus.style.animation = "";
    }

    aiStatusText.textContent = STATUS_STEPS[0];
    await wait(620);
    await setStatus(STATUS_STEPS[1]);
    await wait(820);
    await setStatus(STATUS_STEPS[2]);
    await wait(520);

    var route = routeFor(message);
    var vendor = pickVendor(route.category, unit.borough);
    state.ticketSeq += 1;
    var id = "TKT-" + state.ticketSeq;
    var auto = state.autopilot && route.quote <= 150;

    var ticket = {
      id: id,
      unitId: unit.id,
      unitNumber: unit.id + " (Apt " + aptOf(unit) + ")",
      rawMessage: message,
      translation: /[áéíóúñ¿¡]/i.test(message) ? translateStub(route.category) : "",
      category: route.category,
      severity: "Emergency",
      summary: route.summary,
      tenantReply: route.reply,
      vendorId: vendor.id,
      vendorName: vendor.name,
      quoteAmount: route.quote,
      stage: auto ? "confirming_fix" : "triage",
      description: route.description,
      dispatched: auto
    };

    tickets.unshift(ticket);
    unit.stage = ticket.stage;
    state.selectedTicket = id;

    aiStatus.hidden = true;
    state.busy = false;
    sendSms.disabled = false;
    simCall.disabled = false;
    simMessage.value = "";

    renderTickets();
    renderSummary(false);
    updateTicketCount();

    var card = ticketList.querySelector('[data-ticket="' + id + '"]');
    if (card && !REDUCED) {
      card.classList.add("ticket--new", "ticket--ring");
      card.addEventListener("animationend", function () {
        card.classList.remove("ticket--new", "ticket--ring");
      }, { once: true });
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    toast(
      auto
        ? "Autopilot dispatched " + vendor.name + " to " + unit.id + " — quote " + money(route.quote) + " is under the threshold."
        : "New " + route.category.toLowerCase() + " ticket " + id + " raised for " + unit.id + ".",
      auto ? "ok" : null
    );
  }

  // Spanish-language intake gets a translation line, mirroring the live app.
  function translateStub(category) {
    return {
      Plumbing: "The hot water pipe has started leaking all over the carpet. There is a lot of water.",
      Electrical: "The wall outlet is smoking and sparking. There is no power in the kitchen wall.",
      Locksmith: "I am locked out. The key is jammed in the deadbolt and will not turn.",
      HVAC: "The heater is not working and the apartment is completely cold.",
      General: "There is a maintenance problem in the apartment that needs attention."
    }[category];
  }

  /* ------------------------------------------------------------- invoices -- */

  var invoiceText = $("#invoiceText");
  var invoiceTabs = $("#invoiceTabs");
  var parseBtn = $("#parseInvoice");
  var parsedOut = $("#parsedOut");

  INVOICES.forEach(function (inv, i) {
    var btn = el("button", "invoice-tab" + (i === 0 ? " is-active" : ""), inv.label);
    btn.type = "button";
    btn.dataset.invoice = String(i);
    invoiceTabs.appendChild(btn);
  });

  invoiceTabs.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-invoice]");
    if (!tab) return;
    state.invoiceIndex = Number(tab.dataset.invoice);
    this.querySelectorAll(".invoice-tab").forEach(function (t) {
      t.classList.toggle("is-active", t === tab);
    });
    invoiceText.textContent = INVOICES[state.invoiceIndex].text;
    parsedOut.hidden = true;
  });

  invoiceText.textContent = INVOICES[0].text;

  parseBtn.addEventListener("click", async function () {
    var inv = INVOICES[state.invoiceIndex];
    parseBtn.disabled = true;
    parsedOut.hidden = true;
    invoiceText.classList.add("is-scanning");

    await wait(1100);

    invoiceText.classList.remove("is-scanning");
    parsedOut.innerHTML =
      '<p class="parsed__title">Extracted metadata</p>' +
      '<dl class="parsed__list">' +
      inv.parsed.map(function (pair, i) {
        return '<div class="parsed__row" style="--i:' + i + '">' +
               "<dt>" + escapeHtml(pair[0]) + "</dt>" +
               "<dd>" + escapeHtml(pair[1]) + "</dd>" +
               "</div>";
      }).join("") +
      "</dl>";
    parsedOut.hidden = false;
    parseBtn.disabled = false;

    toast("Invoice parsed — " + inv.parsed[0][1] + " metadata extracted with no manual entry.", "ok");
  });

  /* ----------------------------------------------------------------- boot -- */

  if (!REDUCED) {
    $(".topbar").classList.add("is-boot");
    setTimeout(function () { $(".topbar").classList.remove("is-boot"); }, 900);
  }
  doc.querySelectorAll(".legend__item").forEach(function (n, i) {
    n.style.setProperty("--i", i);
  });
  summaryBody.querySelectorAll(".quote, .ai-line, .triage, .vendor").forEach(function (n, i) {
    n.style.setProperty("--i", i);
  });

  renderTickets();
  renderSummary(false);
  renderLedger();
  state.booted = true;
})();
