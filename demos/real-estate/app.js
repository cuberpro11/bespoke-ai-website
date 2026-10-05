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
    $$(".sidenav__item").forEach(function (btn) {
      var on = btn.getAttribute("data-view") === view;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach(function (sec) {
      sec.classList.toggle("u-hide", sec.id !== "view-" + view);
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  $$(".sidenav__item").forEach(function (btn) {
    btn.addEventListener("click", function () { setView(btn.getAttribute("data-view")); });
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
      var active = t.status !== "clean";
      return '<div class="unit' + (active ? " is-active" : "") + '" title="' + esc(t.name + " — " + st.label) + '">' +
               '<span class="unit__dot" style="background:' + st.dot + '"></span>' +
               '<span class="unit__id">' + esc(t.unit) + "</span>" +
               '<span class="unit__name">' + esc(t.first) + "</span>" +
             "</div>";
    }).join("");
  }

  function renderStatusKey() {
    var key = $("#statusKey");
    var items = D.statusOrder.map(function (k) {
      var st = D.status[k];
      return '<span class="statuskey__item"><i style="background:' + st.dot + '"></i>' + esc(st.label) + "</span>";
    }).join("");
    key.innerHTML = '<span class="statuskey__label">Status key</span>' + items;
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
    return '<article class="tcard tcard--' + tone + '">' +
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
           "</article>";
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
        return "<tr>" +
                 '<td class="mono">' + esc(t.unit) + "</td>" +
                 '<td class="strong">' + esc(t.name) + "</td>" +
                 '<td class="dim nowrap">' + esc(t.phone) + "</td>" +
                 '<td class="dim">' + esc(t.address) + "</td>" +
                 "<td>" + esc(t.borough) + "</td>" +
                 '<td><span class="tstatus"><i style="background:' + st.dot + '"></i>' + esc(st.label) + "</span></td>" +
               "</tr>";
      }).join("");

      out.push('<section class="tsec" aria-label="All tenants">' +
               sectionHead("All Tenants", all.length + " of " + D.tenants.length) +
               '<div class="panel tpanel"><div class="tablewrap"><table class="table table--roster">' +
                 '<colgroup><col class="c-unit"><col class="c-name"><col class="c-phone"><col><col class="c-boro"><col class="c-status"></colgroup>' +
                 "<thead><tr><th>Unit</th><th>Tenant</th><th>Contact</th><th>Address</th><th>Borough</th><th>Status</th></tr></thead>" +
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

  $("#tenantSearch").addEventListener("input", function (e) {
    state.tenantQuery = e.target.value;
    renderTenants();
  });

  /* -------------------------------------------------------------- ledger -- */

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
    var rows = D.ledger.filter(function (r) {
      return state.ledgerCategory === "All" || r.category === state.ledgerCategory;
    });

    $("#ledgerBody").innerHTML = rows.map(function (r) {
      return "<tr>" +
               '<td class="mono">' + esc(r.id) + "</td>" +
               '<td class="dim">' + esc(r.date) + "</td>" +
               '<td class="dim">' + esc(r.unit) + "</td>" +
               "<td>" + esc(r.category) + "</td>" +
               '<td><div class="rowstack"><span>' + esc(r.vendor) + "</span><small>" + esc(r.description) + "</small></div></td>" +
               '<td class="num">' + money(r.amount) + "</td>" +
               '<td><span class="badge badge--paid">Paid</span></td>' +
             "</tr>";
    }).join("");
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
  renderLedgerChips();
  renderLedger();
  renderCategories();
  renderEscalations();
  renderVendors();
  syncAutopilot();
  setView("dashboard");
})();
