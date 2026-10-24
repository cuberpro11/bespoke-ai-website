/* ==========================================================================
   BESPOKE — NYC Real Estate AI Portal demo
   Self-contained runtime: no build step, no network. Mirrors the Figma
   "Real Estate Demo" prototype (Version 8).
   ========================================================================== */

(function () {
  "use strict";

  var D = window.RE_DATA;
  if (!D) { return; }

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var money = function (n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  var state = {
    view: "dashboard",
    unitQuery: "",
    unitBorough: "All",
    tenantQuery: "",
    tenantBorough: "All",
    ledgerCategory: "All",
    ledgerStatus: "All",
    autopilot: true,
    spend: 150,
    rating: 4.5,
    method: "SMS",
    language: "Auto-detect",
    categories: {},
    vendors: {},
    escalation: {}
  };

  D.categories.forEach(function (c) { state.categories[c] = true; });
  D.vendors.forEach(function (v) { state.vendors[v.id] = true; });

  var ESCALATIONS = [
    { key: "emergency", label: "Escalate emergencies immediately", meta: "Fire, flood, gas or lockout bypass the spend cap", on: true },
    { key: "overcap",   label: "Notify on quotes over the cap",     meta: "Manager gets an SMS with the quote attached",    on: true },
    { key: "digest",    label: "Daily activity digest",             meta: "Every morning at 8:00 AM ET",                    on: true },
    { key: "vendor",    label: "Alert when no vendor is available",  meta: "Falls back to manual sourcing after 20 minutes", on: false }
  ];
  ESCALATIONS.forEach(function (e) { state.escalation[e.key] = e.on; });

  /* ---------------------------------------------------------- navigation -- */

  function setView(view) {
    state.view = view;
    if (typeof hidePop === "function") { hidePop(); }
    // a tenant profile lives under the Tenants section
    var navView = view === "tenant" ? "tenants" : view;
    $$(".sidenav__item").forEach(function (btn) {
      var on = btn.getAttribute("data-view") === navView;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach(function (sec) {
      sec.classList.toggle("u-hide", sec.id !== "view-" + view);
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  $$(".sidenav__item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (location.hash) { history.replaceState(null, "", location.pathname + location.search); }
      setView(btn.getAttribute("data-view"));
    });
  });

  /* ----------------------------------------------------------- dashboard -- */

  function renderUnitTabs() {
    $("#unitTabs").innerHTML = D.boroughs.map(function (b) {
      return '<button class="chip' + (b === state.unitBorough ? " is-active" : "") +
             '" type="button" data-borough="' + b + '">' + b + "</button>";
    }).join("");
    $$("#unitTabs .chip").forEach(function (t) {
      t.addEventListener("click", function () {
        state.unitBorough = t.getAttribute("data-borough");
        renderUnitTabs();
        renderUnits();
      });
    });
  }

  function matchesUnit(t) {
    if (state.unitBorough !== "All" && t.borough !== state.unitBorough) { return false; }
    var q = state.unitQuery.trim().toLowerCase();
    if (!q) { return true; }
    return t.unit.toLowerCase().indexOf(q) > -1 || t.name.toLowerCase().indexOf(q) > -1;
  }

  function renderUnits() {
    var rows = D.tenants.filter(matchesUnit);
    var grid = $("#unitGrid");

    if (!rows.length) {
      grid.innerHTML = '<p class="units__empty">No units match that filter.</p>';
      return;
    }

    grid.innerHTML = rows.map(function (t) {
      var st = D.status[t.status] || D.status.clean;
      var cls = emergencyFor(t.unit) ? " is-emergency" : t.status !== "clean" ? " is-active" : "";
      return '<a class="unit' + cls + '" href="#tenant/' + esc(t.unit) + '" data-unit="' + esc(t.unit) + '"' +
               ' style="--st:' + st.dot + '" aria-describedby="unitPop"' +
               ' aria-label="' + esc(t.unit + ", " + t.name + ", " + st.label + (cls === " is-emergency" ? ", active emergency" : "")) + '">' +
               '<span class="unit__dot" style="background:' + st.dot + '"></span>' +
               '<span class="unit__id">' + esc(t.unit) + "</span>" +
               '<span class="unit__name">' + esc(t.first) + "</span>" +
             "</a>";
    }).join("");
  }

  /* One shared popover follows the cursor over a tile (or sits under it on
     keyboard focus) with the tenant's details. Touch skips it: a tap opens
     the profile straight away. */

  var pop = document.createElement("div");
  pop.className = "unit-pop";
  pop.id = "unitPop";
  pop.setAttribute("role", "tooltip");
  pop.hidden = true;
  document.body.appendChild(pop);
  var popUnit = null;

  function popRow(label, value) {
    return '<div class="unit-pop__row"><dt>' + label + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function fillPop(t) {
    var st = D.status[t.status] || D.status.clean;
    var e = emergencyFor(t.unit);
    var a = attentionFor(t.unit);
    var critical = "";
    if (e) {
      critical = '<div class="unit-pop__alert unit-pop__alert--urgent"><b>Emergency · ' + esc(e.category) + " · " + esc(e.ticket) + "</b>" + esc(e.issue) + "</div>";
    } else if (a) {
      critical = '<div class="unit-pop__alert unit-pop__alert--warn"><b>Lease</b>' + esc(a.note) + "</div>";
    } else if (pastDueFor(t.unit).length) {
      var pd = pastDueFor(t.unit)[0];
      critical = '<div class="unit-pop__alert unit-pop__alert--warn"><b>Past due · ' + esc(pd.id) + "</b>" +
                 money(pd.amount) + " to " + esc(pd.vendor) + ", " + dueNote(pd).sub + "</div>";
    } else if (t.notes) {
      critical = '<div class="unit-pop__alert"><b>Note</b>' + esc(t.notes) + "</div>";
    }
    pop.innerHTML =
      '<div class="unit-pop__head"><span class="unit-pop__unit">' + esc(t.unit) + "</span>" +
        '<span class="tstatus"><i style="background:' + st.dot + '"></i>' + esc(st.label) + "</span></div>" +
      '<p class="unit-pop__name">' + esc(t.name) + "</p>" +
      '<dl class="unit-pop__rows">' +
        popRow("Address", t.address) +
        popRow("Phone", t.phone) +
        popRow("Email", t.email) +
        popRow("Move-in", fmtDate(t.moveIn)) +
        popRow("Lease ends", fmtDate(t.leaseEnd)) +
      "</dl>" + critical +
      '<p class="unit-pop__hint">Click to open the full profile</p>';
    pop.classList.toggle("is-emergency", !!e);
  }

  function showPop(tile) {
    var unit = tile.getAttribute("data-unit");
    if (unit !== popUnit) { fillPop(byUnit(unit)); popUnit = unit; }
    pop.hidden = false;
    requestAnimationFrame(function () { pop.classList.add("is-shown"); });
  }

  function hidePop() {
    pop.classList.remove("is-shown");
    pop.hidden = true;
    popUnit = null;
  }

  // place the box near (x, y), flipping to stay inside the viewport
  function placePop(x, y, below) {
    var gap = 14;
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var left = x + gap, top = below ? y : y + gap;
    if (left + w > vw - 8) { left = Math.max(8, x - gap - w); }
    if (top + h > vh - 8) { top = Math.max(8, (below ? below : y) - gap - h); }
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var grid = $("#unitGrid");

  if (canHover) {
    grid.addEventListener("mousemove", function (e) {
      var tile = e.target.closest(".unit");
      if (!tile) { hidePop(); return; }
      showPop(tile);
      placePop(e.clientX, e.clientY);
    });
    grid.addEventListener("mouseleave", hidePop);
  }

  grid.addEventListener("focusin", function (e) {
    var tile = e.target.closest(".unit");
    if (!tile || !tile.matches(":focus-visible")) { return; }
    showPop(tile);
    var rect = tile.getBoundingClientRect();
    placePop(rect.left - 14, rect.bottom + 8, rect.top);
  });
  grid.addEventListener("focusout", hidePop);
  window.addEventListener("scroll", hidePop, { passive: true });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { hidePop(); } });

  function renderStatusKey() {
    var key = $("#statusKey");
    var items = D.statusOrder.map(function (k) {
      var st = D.status[k];
      return '<span class="statuskey__item"><i style="background:' + st.dot + '"></i>' + esc(st.label) + "</span>";
    }).join("");
    key.innerHTML = '<span class="statuskey__label">Status key</span>' + items +
      '<span class="statuskey__item statuskey__item--emergency"><i></i>Active emergency</span>';
  }

  $("#unitSearch").addEventListener("input", function (e) {
    state.unitQuery = e.target.value;
    renderUnits();
  });

  /* ------------------------------------------------------------- tenants -- */

  function renderTenantTabs() {
    $("#tenantTabs").innerHTML = D.boroughs.map(function (b) {
      return '<button class="chip' + (b === state.tenantBorough ? " is-active" : "") +
             '" type="button" data-borough="' + b + '">' + b + "</button>";
    }).join("");
    $$("#tenantTabs .chip").forEach(function (t) {
      t.addEventListener("click", function () {
        state.tenantBorough = t.getAttribute("data-borough");
        renderTenantTabs();
        renderTenants();
      });
    });
  }

  function matchesTenant(t) {
    if (state.tenantBorough !== "All" && t.borough !== state.tenantBorough) { return false; }
    var q = state.tenantQuery.trim().toLowerCase();
    if (!q) { return true; }
    return t.unit.toLowerCase().indexOf(q) > -1 ||
           t.name.toLowerCase().indexOf(q) > -1 ||
           t.address.toLowerCase().indexOf(q) > -1;
  }

  function byUnit(unit) {
    return D.tenants.filter(function (t) { return t.unit === unit; })[0];
  }

  /* Open items lead as cards (same visual language as the dashboard's unit
     tiles); the full roster follows as one fixed-layout table so every
     column lines up no matter which filter is active. */

  function phoneIcon() {
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>';
  }

  function tenantCard(t, tone, badge, title, detail) {
    return '<a class="tcard tcard--' + tone + '" href="#tenant/' + esc(t.unit) + '">' +
             '<header class="tcard__top">' +
               '<span class="tcard__unit">' + esc(t.unit) + "</span>" +
               '<span class="tcard__boro">' + esc(t.borough) + "</span>" +
               '<span class="badge badge--' + tone + '">' + esc(badge) + "</span>" +
             "</header>" +
             '<h3 class="tcard__name">' + esc(t.name) + "</h3>" +
             (title ? '<p class="tcard__ticket">' + esc(title) + "</p>" : "") +
             '<p class="tcard__detail">' + esc(detail) + "</p>" +
             '<footer class="tcard__foot">' +
               '<span class="tcard__phone">' + phoneIcon() + esc(t.phone) + "</span>" +
               '<span class="tcard__addr">' + esc(t.address) + "</span>" +
             "</footer>" +
           "</a>";
  }

  function sectionHead(title, count, id) {
    return '<div class="tsec__head"' + (id ? ' id="' + id + '"' : "") + '>' +
             '<h2 class="section__title">' + title + "</h2>" +
             '<span class="section__count">' + count + "</span></div>";
  }

  function renderTenants() {
    var out = [];

    var emergencies = D.emergencies.filter(function (e) {
      var t = byUnit(e.unit);
      return t && matchesTenant(t);
    });

    if (emergencies.length) {
      out.push('<section class="tsec" aria-label="Active emergencies">' +
               sectionHead("Active Emergencies", emergencies.length, "active-emergencies") +
               '<div class="tcards">' + emergencies.map(function (e) {
                 return tenantCard(byUnit(e.unit), "urgent", e.category, e.ticket, e.issue);
               }).join("") + "</div></section>");
    }

    var attention = D.attention.filter(function (a) {
      var t = byUnit(a.unit);
      return t && matchesTenant(t);
    });

    if (attention.length) {
      out.push('<section class="tsec" aria-label="Needs attention">' +
               sectionHead("Needs Attention", attention.length) +
               '<div class="tcards">' + attention.map(function (a) {
                 return tenantCard(byUnit(a.unit), "warn", "Lease", "", a.note);
               }).join("") + "</div></section>");
    }

    var all = D.tenants.filter(matchesTenant);
    if (all.length) {
      var rows = all.map(function (t) {
        var st = D.status[t.status] || D.status.clean;
        return '<tr class="is-link" data-unit="' + esc(t.unit) + '">' +
                 '<td class="mono">' + esc(t.unit) + "</td>" +
                 '<td class="strong"><a class="tlink" href="#tenant/' + esc(t.unit) + '">' + esc(t.name) + "</a></td>" +
                 '<td class="dim nowrap">' + esc(t.phone) + "</td>" +
                 '<td class="dim">' + esc(t.address) + "</td>" +
                 "<td>" + esc(t.borough) + "</td>" +
                 '<td><span class="tstatus"><i style="background:' + st.dot + '"></i>' + esc(st.label) + "</span></td>" +
                 '<td aria-hidden="true"></td>' +
               "</tr>";
      }).join("");

      out.push('<section class="tsec" aria-label="All tenants">' +
               sectionHead("All Tenants", all.length + " of " + D.tenants.length) +
               '<div class="panel tpanel"><div class="tablewrap"><table class="table table--roster">' +
                 '<colgroup><col class="c-unit"><col class="c-name"><col class="c-phone"><col class="c-addr"><col class="c-boro"><col class="c-status"><col class="c-spacer"></colgroup>' +
                 "<thead><tr><th>Unit</th><th>Tenant</th><th>Contact</th><th>Address</th><th>Borough</th><th>Status</th><th aria-hidden=\"true\"></th></tr></thead>" +
                 "<tbody>" + rows + "</tbody></table></div></div></section>");
    }

    if (!out.length) {
      out.push('<div class="panel tpanel"><p class="units__empty">No tenants match that search.</p></div>');
    }

    $("#tenantSections").innerHTML = out.join("");
  }

  $("#viewEmergencies").addEventListener("click", function () {
    state.tenantBorough = "All";
    state.tenantQuery = "";
    $("#tenantSearch").value = "";
    renderTenantTabs();
    renderTenants();
    setView("tenants");
    var target = $("#active-emergencies");
    if (target) { target.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });

  // whole roster row opens the profile; the name link carries keyboard access
  $("#tenantSections").addEventListener("click", function (e) {
    var row = e.target.closest("tr[data-unit]");
    if (row && !e.target.closest("a")) { location.hash = "tenant/" + row.getAttribute("data-unit"); }
  });

  $("#tenantSearch").addEventListener("input", function (e) {
    state.tenantQuery = e.target.value;
    renderTenants();
  });

  /* ------------------------------------------------------ tenant profile -- */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var OFFICE_PHONE = "+1 (212) 555-0100";
  var CHANNELS = {
    Phone: { verb: "Start AI call", label: "AI call" },
    Text:  { verb: "Send text",     label: "AI text" },
    Email: { verb: "Send email",    label: "AI email" }
  };

  // yyyy-mm-dd → "Mar 1, 2023" without timezone drift
  function fmtDate(iso) {
    var p = iso.split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }

  function monthsBetween(a, b) {
    var x = a.split("-").map(Number), y = b.split("-").map(Number);
    return (y[0] - x[0]) * 12 + (y[1] - x[1]) - (y[2] < x[2] ? 1 : 0);
  }

  function tenure(t) {
    var m = monthsBetween(t.moveIn, D.asOf);
    var yrs = Math.floor(m / 12), mos = m % 12;
    var out = [];
    if (yrs) { out.push(yrs + (yrs === 1 ? " yr" : " yrs")); }
    if (mos || !yrs) { out.push(mos + (mos === 1 ? " mo" : " mos")); }
    return out.join(" ");
  }

  function emergencyFor(unit) { return D.emergencies.filter(function (e) { return e.unit === unit; })[0]; }
  function attentionFor(unit) { return D.attention.filter(function (a) { return a.unit === unit; })[0]; }
  function ledgerFor(unit) { return sortedLedger().filter(function (r) { return r.unit.indexOf(unit + " ") === 0; }); }
  function pastDueFor(unit) { return ledgerFor(unit).filter(function (r) { return r.status === "past_due"; }); }

  function building(t) { return t.address.split(",")[0]; }

  // Seed history so a profile with an open ticket already shows the AI at work.
  state.activity = {};
  D.emergencies.forEach(function (e) {
    var t = byUnit(e.unit);
    state.activity[e.unit] = [{
      channel: "Text", when: "Jul 5, 9:14 PM",
      body: "Hi " + t.first + ", we got your report about the " + e.category.toLowerCase() +
            " issue (" + e.ticket + "). " + e.vendor + " has been contacted and we'll confirm a visit window shortly."
    }];
  });

  /* Turn a manager's instruction ("let them know the boiler is off Thursday")
     into tenant-facing words ("Just letting you know the boiler is off Thursday"). */
  function phrase(guide) {
    var g = guide.trim().replace(/[.!\s]+$/, "");
    if (!g) { return ""; }
    var rules = [
      [/^(?:please\s+)?(?:let|tell) (?:them|the tenant|him|her) know (?:that )?/i, "Just letting you know "],
      [/^(?:please\s+)?remind (?:them|the tenant|him|her) (?:that )?/i, "A quick reminder: "],
      [/^(?:please\s+)?ask (?:them|the tenant|him|her) (?:if|whether) /i, "Could you let us know if "],
      [/^(?:please\s+)?ask (?:them|the tenant|him|her) to /i, "Could you please "],
      [/^(?:please\s+)?ask (?:them|the tenant|him|her) (?:for )?/i, "Could you share "],
      [/^(?:please\s+)?tell (?:them|the tenant|him|her) to /i, "Please "],
      [/^(?:please\s+)?tell (?:them|the tenant|him|her) (?:that )?/i, ""],
      [/^(?:please\s+)?confirm /i, "We'd like to confirm "],
      [/^(?:please\s+)?apologi[sz]e (?:for )?/i, "We're sorry about "],
      [/^(?:please\s+)?thank (?:them|the tenant|him|her) (?:for )?/i, "Thank you for "]
    ];
    var asked = false;
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][0].test(g)) {
        asked = /^Could you/.test(rules[i][1]);
        g = g.replace(rules[i][0], rules[i][1]);
        break;
      }
    }
    g = g.replace(/\bthey're\b/gi, "you're").replace(/\bthey are\b/gi, "you are")
         .replace(/\bthem\b/gi, "you").replace(/\btheir\b/gi, "your").replace(/\bthey\b/gi, "you");
    g = g.charAt(0).toUpperCase() + g.slice(1);
    return g + (asked ? "?" : ".");
  }

  var SAFETY = {
    Plumbing: "Tell them to close the shut-off valve under the sink until the plumber arrives",
    Electrical: "Tell them to switch off that circuit at the breaker and keep clear of the outlet",
    Locksmith: "Tell them the locksmith will call 10 minutes before arriving"
  };

  function suggestions(t) {
    var e = emergencyFor(t.unit);
    if (e) {
      return [
        "Let them know " + e.vendor + " is booked for today between 2 and 4 PM",
        "Ask them to send a photo of the " + e.category.toLowerCase() + " issue",
        SAFETY[e.category] || "Tell them a technician has been booked and we'll confirm the time"
      ];
    }
    if (attentionFor(t.unit)) {
      return [
        "Remind them the renewal packet is due by the end of the month",
        "Ask them if they'd like a call to talk through renewal terms",
        "Thank them for being a tenant since " + fmtDate(t.moveIn).split(" ").pop()
      ];
    }
    return [
      "Let them know the boiler will be serviced Thursday from 9 AM to noon",
      "Ask them if anything in the apartment needs attention",
      "Confirm their rent receipt for July was emailed"
    ];
  }

  function draftFor(t, channel, guide) {
    var e = emergencyFor(t.unit);
    var msg = phrase(guide) || phrase(suggestions(t)[0]);
    var ticket = !e ? "" : msg.indexOf(e.vendor) > -1
      ? "This is about your " + e.category.toLowerCase() + " ticket " + e.ticket + "."
      : "Your " + e.category.toLowerCase() + " ticket " + e.ticket + " is open and " + e.vendor + " is assigned.";

    if (channel === "Text") {
      return "Hi " + t.first + ", this is the AI assistant for " + building(t) + " management. " +
             msg + (ticket ? " " + ticket : "") + " Reply here or call " + OFFICE_PHONE + " with any questions.";
    }
    if (channel === "Email") {
      return "Subject: " + (e ? e.ticket + " update for " : "A note for ") + t.unit + "\n\n" +
             "Hi " + t.first + ",\n\n" + msg + (ticket ? "\n\n" + ticket : "") +
             "\n\nIf anything changes, just reply to this email or call us at " + OFFICE_PHONE + ".\n\n" +
             "Best,\n" + building(t) + " management\n(sent by our AI assistant)";
    }
    return "Opening: Hi " + t.first + ", this is the AI assistant calling for " + building(t) + " management. Is now a good time?\n" +
           "Message: " + msg + "\n" +
           (ticket ? "If asked about the repair: " + ticket + "\n" : "") +
           "Close: Confirm the best callback number, thank them, and log the outcome.";
  }

  function nowLabel() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    return "Today, " + ((h % 12) || 12) + ":" + (m < 10 ? "0" : "") + m + (h < 12 ? " AM" : " PM");
  }

  function callTranscript(t, draft) {
    var msg = (draft.match(/^Message: (.*)$/m) || [])[1] || "";
    return [
      ["AI", "Hi " + t.first + ", this is the AI assistant calling for " + building(t) + " management. Is now a good time?"],
      [t.first, "Sure, go ahead."],
      ["AI", msg],
      [t.first, "Okay, that works. Thanks for letting me know."],
      ["AI", "Great, I've noted that on your file. Have a good day!"]
    ];
  }

  function activityItem(a) {
    var body = a.transcript
      ? '<ol class="transcript">' + a.transcript.map(function (l) {
          return '<li><b>' + esc(l[0]) + ":</b> " + esc(l[1]) + "</li>";
        }).join("") + "</ol>"
      : '<p class="activity__body">' + esc(a.body).replace(/\n/g, "<br>") + "</p>";
    return '<li class="activity__item activity__item--' + a.channel.toLowerCase() + '">' +
             '<div class="activity__head"><span class="activity__chan">' + esc(CHANNELS[a.channel].label) + "</span>" +
             '<span class="activity__when">' + esc(a.when) + "</span>" +
             (a.outcome ? '<span class="activity__outcome">' + esc(a.outcome) + "</span>" : "") + "</div>" +
             body + "</li>";
  }

  function renderActivity(unit) {
    var list = state.activity[unit] || [];
    $("#activityList").innerHTML = list.length
      ? list.map(activityItem).join("")
      : '<li class="activity__empty">No outreach yet. Drafts you send appear here.</li>';
  }

  function infoRow(label, value) {
    return '<div class="kv"><dt>' + label + "</dt><dd>" + value + "</dd></div>";
  }

  function renderProfile(t) {
    var st = D.status[t.status] || D.status.clean;
    var e = emergencyFor(t.unit);
    var a = attentionFor(t.unit);
    var history = ledgerFor(t.unit);
    var initials = t.name.split(" ").map(function (w) { return w.charAt(0); }).slice(0, 2).join("");

    var critical = [];
    if (e) {
      critical.push('<div class="alert alert--urgent"><div class="alert__top"><span class="badge badge--urgent">Emergency</span>' +
        '<span class="alert__ticket">' + esc(e.ticket) + " · " + esc(e.category) + "</span></div>" +
        '<p class="alert__text">' + esc(e.issue) + "</p>" +
        '<p class="alert__meta">Stage: ' + esc(D.status[e.stage].label) + " · Vendor: " + esc(e.vendor) +
        " · Quote: " + money(e.quote) + "</p></div>");
    }
    if (a) {
      critical.push('<div class="alert alert--warn"><div class="alert__top"><span class="badge badge--warn">Lease</span></div>' +
        '<p class="alert__text">' + esc(a.note) + "</p></div>");
    }
    pastDueFor(t.unit).forEach(function (r) {
      critical.push('<div class="alert alert--warn"><div class="alert__top"><span class="badge badge--pastdue">Past due</span>' +
        '<span class="alert__ticket">' + esc(r.id) + " · " + money(r.amount) + "</span></div>" +
        '<p class="alert__text">' + esc(r.vendor) + ": " + esc(r.description) + ". The invoice is " + dueNote(r).sub + ".</p></div>");
    });
    if (t.notes) {
      critical.push('<div class="alert"><div class="alert__top"><span class="badge badge--note">Note</span></div>' +
        '<p class="alert__text">' + esc(t.notes) + "</p></div>");
    }
    if (!critical.length) {
      critical.push('<p class="profile__clear">No open issues for this unit.</p>');
    }

    var historyHtml = history.length
      ? '<table class="table table--mini"><tbody>' + history.map(function (r) {
          var due = dueNote(r);
          return '<tr class="lrow lrow--' + LEDGER_STATUS[r.status].badge + '"><td class="nowrap"><div class="rowstack ldue"><span>' + due.main + "</span>" +
                   (due.sub ? "<small>" + due.sub + "</small>" : "") + "</div></td>" +
                 '<td><div class="rowstack"><span>' + esc(r.vendor) + "</span><small>" + esc(r.description) + "</small></div></td>" +
                 '<td class="num">' + money(r.amount) + "</td>" +
                 "<td>" + statusBadge(r) + "</td></tr>";
        }).join("") + "</tbody></table>"
      : '<p class="profile__clear">No expenses logged for this unit.</p>';

    var chips = suggestions(t).map(function (sug) {
      return '<button type="button" class="chip chip--prompt" data-prompt="' + esc(sug) + '">' + esc(sug) + "</button>";
    }).join("");

    $("#profile").innerHTML =
      '<header class="profile__head' + (e ? " is-emergency" : "") + '">' +
        '<span class="profile__avatar" aria-hidden="true">' + esc(initials) + "</span>" +
        '<div class="profile__id">' +
          '<h1 class="page__title profile__name">' + esc(t.name) + "</h1>" +
          '<p class="profile__sub"><span class="mono">' + esc(t.unit) + "</span> · " + esc(t.borough) +
          ' · <span class="tstatus"><i style="background:' + st.dot + '"></i>' + esc(st.label) + "</span></p>" +
        "</div>" +
        (e ? '<span class="profile__flag">Active emergency</span>' : "") +
      "</header>" +

      '<div class="profile__grid">' +
        '<div class="profile__col">' +
          '<section class="panel"><h2 class="panel__title">Contact</h2><dl class="kvs">' +
            infoRow("Phone", esc(t.phone)) +
            infoRow("Email", esc(t.email)) +
            infoRow("Address", esc(t.address)) +
          "</dl></section>" +
          '<section class="panel"><h2 class="panel__title">Lease</h2><dl class="kvs kvs--3">' +
            infoRow("Move-in", fmtDate(t.moveIn)) +
            infoRow("Lease ends", fmtDate(t.leaseEnd)) +
            infoRow("Rent", money(t.rent).replace(".00", "") + "<small>/mo</small>") +
          "</dl><p class=\"panel__sub\">Tenant for " + tenure(t) + "</p></section>" +
          '<section class="panel"><h2 class="panel__title">Critical details</h2><div class="alerts">' + critical.join("") + "</div></section>" +
          '<section class="panel"><h2 class="panel__title">Expense history</h2>' + historyHtml + "</section>" +
        "</div>" +

        '<div class="profile__col">' +
          '<section class="panel outreach" aria-label="AI outreach">' +
            '<h2 class="panel__title">Reach out with AI</h2>' +
            '<p class="panel__sub">Tell the AI what to say. It drafts the message for you to review before anything goes out.</p>' +
            '<div class="segmented" id="outreachSeg" role="group" aria-label="Channel">' +
              '<button type="button" class="is-active" data-val="Text">Text</button>' +
              '<button type="button" data-val="Email">Email</button>' +
              '<button type="button" data-val="Phone">Phone</button>' +
            "</div>" +
            '<p class="outreach__to" id="outreachTo"></p>' +
            '<label class="field__label" for="outreachGuide">What should the AI say?</label>' +
            '<textarea class="textarea" id="outreachGuide" rows="3" placeholder="e.g. Let them know the plumber arrives tomorrow between 9 and 11 AM"></textarea>' +
            '<div class="chips outreach__chips">' + chips + "</div>" +
            '<button type="button" class="btn btn--primary" id="outreachDraft">Draft with AI</button>' +
            '<div class="outreach__draft u-hide" id="outreachDraftBox">' +
              '<label class="field__label" for="outreachText">AI draft <span class="field__hint">Edit before sending</span></label>' +
              '<textarea class="textarea textarea--draft" id="outreachText" rows="7"></textarea>' +
              '<div class="outreach__actions">' +
                '<button type="button" class="btn btn--primary" id="outreachSend">Send text</button>' +
                '<button type="button" class="btn" id="outreachDiscard">Discard</button>' +
              "</div>" +
            "</div>" +
            '<p class="outreach__status" id="outreachStatus" role="status" aria-live="polite"></p>' +
          "</section>" +
          '<section class="panel"><h2 class="panel__title">Outreach activity</h2><ol class="activity" id="activityList"></ol></section>' +
        "</div>" +
      "</div>";

    wireOutreach(t);
    renderActivity(t.unit);
  }

  function wireOutreach(t) {
    var channel = "Text";
    var guide = $("#outreachGuide");
    var box = $("#outreachDraftBox");
    var text = $("#outreachText");
    var status = $("#outreachStatus");

    function syncChannel() {
      $("#outreachTo").textContent = "To " + (channel === "Email" ? t.email : t.phone);
      $("#outreachSend").textContent = CHANNELS[channel].verb;
      $("#outreachDraft").textContent = channel === "Phone" ? "Draft call script" : "Draft with AI";
    }

    wireSegmented("outreachSeg", function (v) {
      channel = v;
      syncChannel();
      if (!box.classList.contains("u-hide")) { text.value = draftFor(t, channel, guide.value); }
    });

    $$(".chip--prompt", $("#profile")).forEach(function (c) {
      c.addEventListener("click", function () { guide.value = c.getAttribute("data-prompt"); guide.focus(); });
    });

    $("#outreachDraft").addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = "Drafting…";
      status.textContent = "";
      var quick = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(function () {
        text.value = draftFor(t, channel, guide.value);
        box.classList.remove("u-hide");
        btn.disabled = false;
        syncChannel();
        text.focus();
      }, quick ? 0 : 650);
    });

    $("#outreachDiscard").addEventListener("click", function () {
      box.classList.add("u-hide");
      status.textContent = "Draft discarded.";
    });

    $("#outreachSend").addEventListener("click", function () {
      var draft = text.value.trim();
      if (!draft) { return; }
      var entry = { channel: channel, when: nowLabel() };
      if (channel === "Phone") {
        entry.transcript = callTranscript(t, draft);
        entry.outcome = "Completed · 1:08";
      } else {
        entry.body = draft;
        entry.outcome = channel === "Text" ? "Delivered" : "Sent";
      }
      (state.activity[t.unit] = state.activity[t.unit] || []).unshift(entry);
      renderActivity(t.unit);
      box.classList.add("u-hide");
      guide.value = "";
      status.textContent = channel === "Phone"
        ? "Call completed. The transcript is in the activity log."
        : CHANNELS[channel].label + " sent to " + t.first + ".";
    });

    syncChannel();
  }

  /* ------------------------------------------------------------- routing -- */

  state.returnView = "tenants";
  state.inAppProfile = false;

  function route() {
    var m = location.hash.match(/^#tenant\/([A-Z]{2}-\d{3})$/);
    var t = m && byUnit(m[1]);
    if (t) {
      if (state.view !== "tenant") { state.returnView = state.inAppProfile ? state.view : "tenants"; }
      $("#profileBackLabel").textContent = state.returnView === "dashboard" ? "Back to Dashboard" : "Back to Tenants";
      renderProfile(t);
      setView("tenant");
      return true;
    }
    if (state.view === "tenant") { setView(state.returnView); }
    return false;
  }

  window.addEventListener("hashchange", function () {
    state.inAppProfile = true;
    route();
  });

  $("#profileBack").addEventListener("click", function (e) {
    e.preventDefault();
    if (state.inAppProfile) { history.back(); return; }
    history.replaceState(null, "", location.pathname + location.search);
    setView(state.returnView);
  });

  /* -------------------------------------------------------------- ledger -- */

  var LEDGER_STATUS = {
    past_due: { label: "Past due", badge: "pastdue" },
    upcoming: { label: "Upcoming", badge: "upcoming" },
    paid:     { label: "Paid",     badge: "paid" }
  };
  var STATUS_RANK = { past_due: 0, upcoming: 1, paid: 2 };

  // mm/dd/yyyy → whole days since the epoch, so date maths never drifts
  function dayNum(mdy) {
    var p = mdy.split("/").map(Number);
    return Date.UTC(p[2], p[0] - 1, p[1]) / 864e5;
  }
  var TODAY = dayNum(D.asOf.split("-").slice(1).concat(D.asOf.split("-")[0]).join("/"));

  function shortDate(mdy) {
    var p = mdy.split("/").map(Number);
    return MONTHS[p[0] - 1] + " " + p[1];
  }

  function statusBadge(r) {
    var ls = LEDGER_STATUS[r.status];
    return '<span class="badge badge--' + ls.badge + '">' + ls.label + "</span>";
  }

  // "9 days overdue" / "in 4 days" / "Paid Jun 15"
  function dueNote(r) {
    if (r.status === "paid") { return { main: "Paid " + shortDate(r.date), sub: "" }; }
    var d = dayNum(r.due) - TODAY;
    if (r.status === "past_due") {
      var late = -d;
      return { main: "Due " + shortDate(r.due), sub: late + (late === 1 ? " day" : " days") + " overdue" };
    }
    return { main: "Due " + shortDate(r.due), sub: d === 0 ? "today" : d === 1 ? "tomorrow" : "in " + d + " days" };
  }

  function sortedLedger() {
    return D.ledger.slice().sort(function (a, b) {
      if (a.status !== b.status) { return STATUS_RANK[a.status] - STATUS_RANK[b.status]; }
      if (a.status === "paid") { return dayNum(b.date) - dayNum(a.date); }
      return dayNum(a.due) - dayNum(b.due);
    });
  }

  function sum(rows) { return rows.reduce(function (n, r) { return n + r.amount; }, 0); }
  function byStatus(st) { return D.ledger.filter(function (r) { return r.status === st; }); }

  function renderLedgerSummary() {
    var past = byStatus("past_due"), up = sortedLedger().filter(function (r) { return r.status === "upcoming"; });
    var paid = byStatus("paid");
    var oldest = past.reduce(function (m, r) { return Math.max(m, TODAY - dayNum(r.due)); }, 0);
    var tiles = [
      { key: "past_due", label: "Past due", rows: past, note: past.length ? "Oldest " + oldest + " days overdue" : "Nothing overdue" },
      { key: "upcoming", label: "Upcoming", rows: up, note: up.length ? "Next due " + shortDate(up[0].due) : "Nothing scheduled" },
      { key: "paid", label: "Paid", rows: paid, note: "Since " + shortDate(paid.map(function (r) { return r.date; }).sort(function (a, b) { return dayNum(a) - dayNum(b); })[0]) }
    ];
    $("#ledgerSummary").innerHTML = tiles.map(function (t) {
      return '<button type="button" class="lsum lsum--' + LEDGER_STATUS[t.key].badge + (state.ledgerStatus === t.key ? " is-active" : "") +
             '" data-status="' + t.key + '" aria-pressed="' + (state.ledgerStatus === t.key ? "true" : "false") + '">' +
               '<span class="lsum__label">' + t.label + ' <span class="lsum__count">' + t.rows.length + "</span></span>" +
               '<span class="lsum__value">' + money(sum(t.rows)).replace(".00", "") + "</span>" +
               '<span class="lsum__note">' + t.note + "</span>" +
             "</button>";
    }).join("");
    $$("#ledgerSummary .lsum").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-status");
        state.ledgerStatus = state.ledgerStatus === k ? "All" : k;
        renderLedgerSummary();
        renderLedger();
      });
    });
  }

  function renderLedgerChips() {
    var cats = ["All"].concat(D.categories);
    $("#ledgerChips").innerHTML = cats.map(function (c) {
      var n = c === "All" ? D.ledger.length : D.ledger.filter(function (r) { return r.category === c; }).length;
      return '<button class="chip' + (c === state.ledgerCategory ? " is-active" : "") +
             '" type="button" data-cat="' + c + '">' + c + " <span>" + n + "</span></button>";
    }).join("");
    $$("#ledgerChips .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.ledgerCategory = chip.getAttribute("data-cat");
        renderLedgerChips();
        renderLedger();
      });
    });
  }

  function renderLedger() {
    var rows = sortedLedger().filter(function (r) {
      return (state.ledgerCategory === "All" || r.category === state.ledgerCategory) &&
             (state.ledgerStatus === "All" || r.status === state.ledgerStatus);
    });

    if (!rows.length) {
      $("#ledgerBody").innerHTML = '<tr><td colspan="7" class="dim">No entries match those filters.</td></tr>';
      return;
    }

    $("#ledgerBody").innerHTML = rows.map(function (r) {
      var code = r.unit.split(" ")[0];
      var apt = (r.unit.match(/\((.*)\)/) || [])[1] || "";
      var due = dueNote(r);
      return '<tr class="lrow lrow--' + LEDGER_STATUS[r.status].badge + '">' +
               '<td><div class="rowstack"><span class="lid">' + esc(r.id) + "</span><small>" + esc(r.date) + "</small></div></td>" +
               '<td><div class="rowstack"><a class="tlink lunit" href="#tenant/' + esc(code) + '">' + esc(code) + "</a><small>" + esc(apt) + "</small></div></td>" +
               '<td><span class="cat cat--' + r.category.toLowerCase() + '">' + esc(r.category) + "</span></td>" +
               '<td><div class="rowstack"><span class="lvendor">' + esc(r.vendor) + "</span><small>" + esc(r.description) + "</small></div></td>" +
               '<td><div class="rowstack ldue"><span>' + due.main + "</span>" + (due.sub ? "<small>" + due.sub + "</small>" : "") + "</div></td>" +
               '<td class="num lamount">' + money(r.amount) + "</td>" +
               "<td>" + statusBadge(r) + "</td>" +
             "</tr>";
    }).join("");
  }

  function renderPaidTotal() {
    $("#paidTotal").textContent = "$" + sum(byStatus("paid")).toLocaleString("en-US");
  }

  /* ----------------------------------------------------------- autopilot -- */

  function switchRow(id, label, meta, on) {
    return '<div class="switchrow"><div><div>' + esc(label) + "</div>" +
           (meta ? '<div class="switchrow__meta">' + esc(meta) + "</div>" : "") +
           '</div><button class="toggle" type="button" data-switch="' + id +
           '" aria-pressed="' + (on ? "true" : "false") + '" aria-label="' + esc(label) + '"></button></div>';
  }

  function renderCategories() {
    $("#categoryRows").innerHTML = D.categories.map(function (c) {
      return switchRow("cat:" + c, c, "", state.categories[c]);
    }).join("");
  }

  function renderEscalations() {
    $("#escalationRows").innerHTML = ESCALATIONS.map(function (e) {
      return switchRow("esc:" + e.key, e.label, e.meta, state.escalation[e.key]);
    }).join("");
  }

  function renderVendors() {
    $("#vendorList").innerHTML = D.vendors.map(function (v) {
      var below = v.rating < state.rating;
      var on = state.vendors[v.id] && !below;
      return '<div class="vendor' + (on ? "" : " is-off") + '">' +
               "<div><div class=\"vendor__name\">" + esc(v.name) + "</div>" +
               '<div class="vendor__meta">' + esc(v.specialty) + " · " + esc(v.rate) +
               (below ? " · below minimum rating" : "") + "</div></div>" +
               '<div class="vendor__rating">★ ' + v.rating.toFixed(1) + "</div>" +
               '<button class="toggle" type="button" data-switch="ven:' + v.id +
               '" aria-pressed="' + (state.vendors[v.id] ? "true" : "false") +
               '" aria-label="' + esc(v.name) + '"></button>' +
             "</div>";
    }).join("");
  }

  function syncAutopilot() {
    var on = state.autopilot;

    $("#autopilotToggleTop").setAttribute("aria-pressed", on ? "true" : "false");
    $("#autopilotToggleMain").setAttribute("aria-pressed", on ? "true" : "false");
    $("#autoRoot").classList.toggle("is-off", !on);
    $("#navAutopilotBadge").classList.toggle("u-hide", !on);

    var stateEl = $("#autopilotState");
    stateEl.firstChild.nodeValue = on ? "Enabled " : "Paused ";
    stateEl.style.color = on ? "" : "var(--muted)";
    $("#autopilotCap").textContent = on ? "(quotes < $" + state.spend + ")" : "(manual approval)";

    $("#autoMasterNote").textContent = on
      ? "Routine repairs under the spend cap are dispatched without manager sign-off."
      : "Every ticket waits for manager sign-off while autopilot is paused.";
  }

  function toggleAutopilot() {
    state.autopilot = !state.autopilot;
    syncAutopilot();
  }

  $("#autopilotToggleTop").addEventListener("click", toggleAutopilot);
  $("#autopilotToggleMain").addEventListener("click", toggleAutopilot);

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-switch]") : null;
    if (!btn) { return; }

    var ref = btn.getAttribute("data-switch");
    var kind = ref.slice(0, 3);
    var key = ref.slice(4);

    if (kind === "cat") { state.categories[key] = !state.categories[key]; renderCategories(); }
    if (kind === "esc") { state.escalation[key] = !state.escalation[key]; renderEscalations(); }
    if (kind === "ven") { state.vendors[key] = !state.vendors[key]; renderVendors(); }
  });

  $("#spendRange").addEventListener("input", function (e) {
    state.spend = Number(e.target.value);
    $("#spendValue").textContent = "$" + state.spend;
    syncAutopilot();
  });

  $("#ratingRange").addEventListener("input", function (e) {
    state.rating = Number(e.target.value);
    $("#ratingValue").textContent = state.rating.toFixed(1);
    renderVendors();
  });

  function wireSegmented(id, onPick) {
    $$("#" + id + " button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#" + id + " button").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        onPick(b.getAttribute("data-val"));
      });
    });
  }

  wireSegmented("methodSeg", function (v) { state.method = v; });
  wireSegmented("langSeg", function (v) { state.language = v; });

  /* ----------------------------------------------------------------- go -- */

  renderUnitTabs();
  renderUnits();
  renderStatusKey();
  renderTenantTabs();
  renderTenants();
  renderLedgerSummary();
  renderLedgerChips();
  renderLedger();
  renderPaidTotal();
  renderCategories();
  renderEscalations();
  renderVendors();
  syncAutopilot();
  setView("dashboard");
  route();
})();
