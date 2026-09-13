/* ==========================================================================
   BESPOKE — Client Relations Portal demo
   Self-contained runtime. No build step, no network, no chart library.
   Mirrors the Figma "CRM Demo" prototype (Version 84).
   ========================================================================== */

(function () {
  "use strict";

  var D = window.CRM_DATA;
  if (!D) { return; }

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function money(n) { return "$" + n.toLocaleString("en-US"); }

  var state = {
    view: "dashboard",
    period: "30",
    openClient: null,
    selected: {},   // clientId -> { actionId: true }
    done: {},       // clientId -> { actionId: true }
    emails: {},     // clientId:actionId -> body
    status: {},     // clientId -> status override
    responded: {},  // clientId -> bool override
    notifications: { newIntake: true, digest: true, highValue: true, declined: false },
    agentChat: []
  };

  D.clients.forEach(function (c) {
    state.selected[c.id] = {};
    state.done[c.id] = {};
    state.status[c.id] = c.status;
    state.responded[c.id] = !!c.responded;
  });

  function clientById(id) {
    return D.clients.filter(function (c) { return c.id === id; })[0];
  }

  function isHigh(c) { return c.value > 75000 && state.status[c.id] !== "signed" && state.status[c.id] !== "declined"; }

  function bucket(c) {
    var st = state.status[c.id];
    if (st === "signed") { return "signed"; }
    if (st === "declined") { return "declined"; }
    return state.responded[c.id] ? "potential" : "needs";
  }

  function needsCount() {
    return D.clients.filter(function (c) { return bucket(c) === "needs"; }).length;
  }

  /* ---------------------------------------------------------------- nav -- */

  function setView(view) {
    state.view = view;
    $$(".sidenav__item").forEach(function (b) {
      var on = b.getAttribute("data-view") === view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach(function (s) { s.classList.toggle("u-hide", s.id !== "view-" + view); });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  $$(".sidenav__item").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.getAttribute("data-view") === "clients") { state.openClient = null; renderClients(); }
      setView(b.getAttribute("data-view"));
    });
  });

  /* -------------------------------------------------------------- toast -- */

  var toastTimer = null;
  function toast(message, kind) {
    var root = $("#toastRoot");
    root.innerHTML = '<div class="toast' + (kind === "red" ? " toast--red" : "") + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (kind === "red" ? '<path d="M18 6 6 18M6 6l12 12"/>' : '<path d="m20 6-11 11-5-5"/>') +
      "</svg><span>" + esc(message) + "</span></div>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ""; }, 2200);
  }

  /* ---------------------------------------------------------- dashboard -- */

  var KPI_ICONS = {
    intakes:  ['<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z"/>', "#eff6ff", "#2563eb"],
    conv:     ['<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>', "#ecfdf5", "#16a34a"],
    pipeline: ['<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', "#eef2ff", "#4f46e5"],
    response: ['<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', "#fffbeb", "#d97706"]
  };

  function kpiCard(label, value, note, noteUp, iconKey) {
    var ic = KPI_ICONS[iconKey];
    return '<article class="kpi">' +
      '<p class="kpi__label">' + esc(label) + "</p>" +
      '<span class="kpi__icon" style="background:' + ic[1] + ';color:' + ic[2] + '" aria-hidden="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ic[0] + "</svg></span>" +
      '<p class="kpi__value">' + esc(value) + "</p>" +
      '<p class="kpi__note">' + (noteUp
        ? '<span class="kpi__note--up"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>' + esc(note) + "</span>"
        : esc(note)) + "</p>" +
      "</article>";
  }

  function renderDashboard() {
    var m = D.metrics[state.period];

    $("#kpis").innerHTML =
      kpiCard("Total Intakes", String(m.intakes), m.intakeDelta, true, "intakes") +
      kpiCard("Conversion Rate", m.conversion, m.conversionNote, false, "conv") +
      kpiCard("Pipeline Value", m.pipeline, "Signed clients (est.)", false, "pipeline") +
      kpiCard("Avg. Response Time", m.responseTime, "Time to first response", false, "response");

    renderChart(m);
    renderNeeds();
    renderChannelBars(m);
    renderFunnel(m);

    $("#feed").innerHTML = D.activity.map(function (a) {
      return '<div class="feedrow"><i style="background:' + a.dot + '"></i>' +
             '<div><div class="feedrow__text">' + esc(a.text) + "</div>" +
             '<div class="feedrow__time">' + esc(a.time) + "</div></div></div>";
    }).join("");
  }

  function renderChart(m) {
    var W = 640, H = 230, padL = 30, padR = 8, padT = 12, padB = 30;
    var weeks = m.weeks;
    var series = ["Phone", "Email", "Website"];

    var max = 0;
    weeks.forEach(function (w) { series.forEach(function (s) { max = Math.max(max, w[s]); }); });
    max = Math.max(4, Math.ceil(max));

    var plotW = W - padL - padR, plotH = H - padT - padB;
    var groupW = plotW / weeks.length;
    var barW = Math.min(28, (groupW - 12) / series.length);

    var svg = ['<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Intake by channel, grouped by week">'];

    svg.push('<g class="chart__grid">');
    for (var i = 0; i <= max; i++) {
      var y = padT + plotH - (i / max) * plotH;
      svg.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '"/>');
      svg.push('<text class="chart__axis" x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + i + "</text>");
    }
    svg.push("</g>");

    weeks.forEach(function (w, wi) {
      var gx = padL + wi * groupW;
      var inner = groupW - series.length * barW;
      var startX = gx + inner / 2;

      series.forEach(function (s, si) {
        var v = w[s];
        var h = (v / max) * plotH;
        var x = startX + si * barW;
        var y = padT + plotH - h;
        if (h > 0) {
          svg.push('<rect class="chart__bar" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
                   '" width="' + (barW - 2).toFixed(1) + '" height="' + h.toFixed(1) +
                   '" rx="2" fill="' + D.channelColor[s] + '"><title>' + esc(w.label + " · " + s + ": " + v) + "</title></rect>");
        }
      });

      svg.push('<text class="chart__axis" x="' + (gx + groupW / 2).toFixed(1) + '" y="' + (H - 10) +
               '" text-anchor="middle">' + esc(w.label) + "</text>");
    });

    svg.push("</svg>");
    $("#chart").innerHTML = svg.join("");

    $("#chartLegend").innerHTML = series.map(function (s) {
      return '<span><i style="background:' + D.channelColor[s] + '"></i>' + s + "</span>";
    }).join("");
  }

  function renderNeeds() {
    var rows = D.clients.filter(function (c) { return bucket(c) === "needs"; });

    $("#needsList").innerHTML = rows.length ? rows.map(function (c) {
      return '<div class="needsrow"><div class="needsrow__top">' +
             '<span class="needsrow__name">' + esc(c.name) + "</span>" +
             '<span class="needsrow__time">' + esc(c.contacted) + "</span></div>" +
             '<div class="needsrow__case">' + esc(c.caseType) + "</div></div>";
    }).join("") : '<p class="needsrow__case" style="padding:10px 0">Everyone has been contacted.</p>';

    $("#needsCount").textContent = rows.length;
    $("#clientsBadge").textContent = rows.length;
    $("#clientsBadge").classList.toggle("u-hide", rows.length === 0);
  }

  function renderChannelBars(m) {
    // Percentages are taken against total intakes, matching the prototype.
    var total = m.intakes;
    var order = ["Email", "Phone", "Website"];
    $("#channelBars").innerHTML = order.map(function (k) {
      var v = m.channels[k];
      var pct = total ? Math.round((v / total) * 100) : 0;
      return '<div class="bar"><div class="bar__top">' +
             '<span class="bar__label"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + D.channelColor[k] + '"></i>' + k + "</span>" +
             '<span class="bar__num"><b>' + v + "</b> (" + pct + "%)</span></div>" +
             '<div class="bar__track"><div class="bar__fill" style="width:' + pct + "%;background:" + D.channelColor[k] + '"></div></div></div>';
    }).join("");
  }

  function renderFunnel(m) {
    $("#funnel").innerHTML = m.pipelineRows.map(function (r) {
      var cls = "";
      if (r[0] === "Awaiting Response") { cls = " funnelrow__pill--amber"; }
      if (r[0] === "Signed This Period") { cls = " funnelrow__pill--green"; }
      return '<div class="funnelrow"><span>' + esc(r[0]) + "</span>" +
             '<span class="funnelrow__pill' + cls + '">' + r[1] + "</span></div>";
    }).join("");
  }

  $("#periodSelect").addEventListener("change", function (e) {
    state.period = e.target.value;
    renderDashboard();
  });

  $("#needsLink").addEventListener("click", function () {
    state.openClient = null;
    renderClients();
    setView("clients");
  });

  /* ------------------------------------------------------------ clients -- */

  var CHAN_ICON = {
    email:   '<path d="M22 6 12 13 2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
    phone:   '<path d="M21.5 16.9v2.6a2 2 0 0 1-2.2 2 19.4 19.4 0 0 1-8.5-3 19 19 0 0 1-5.9-5.9 19.4 19.4 0 0 1-3-8.6A2 2 0 0 1 3.9 2h2.6a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.8a15.5 15.5 0 0 0 5.9 5.9l1.2-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>'
  };

  function chanIcon(ch) {
    return '<span class="clientcard__chan clientcard__chan--' + ch + '" aria-hidden="true">' +
           '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
           CHAN_ICON[ch] + "</svg></span>";
  }

  function statusPill(c) {
    var st = state.status[c.id];
    if (st === "signed")   { return '<span class="pill pill--signed">Signed</span>'; }
    if (st === "declined") { return '<span class="pill pill--dec">Declined</span>'; }
    if (!state.responded[c.id]) { return '<span class="pill pill--await"><i></i>Awaiting Response</span>'; }
    return "";
  }

  function highPill(c) {
    return isHigh(c) ? '<span class="pill pill--high">★ High Value</span>' : "";
  }

  function renderClients() {
    $("#clientsList").classList.toggle("u-hide", !!state.openClient);
    $("#clientDetail").classList.toggle("u-hide", !state.openClient);

    if (state.openClient) { renderDetail(); return; }

    $("#clientSections").innerHTML = D.sections.map(function (sec) {
      var rows = D.clients.filter(function (c) { return bucket(c) === sec.key; });
      if (!rows.length) { return ""; }

      var cards = rows.map(function (c) {
        var hot = sec.key === "needs" && isHigh(c);
        return '<button class="clientcard' + (hot ? " is-hot" : "") + '" type="button" data-client="' + c.id + '">' +
          chanIcon(c.channel) +
          '<span class="clientcard__body">' +
            '<span class="clientcard__top"><span class="clientcard__name">' + esc(c.name) + "</span>" +
              statusPill(c) + highPill(c) + "</span>" +
            '<span class="clientcard__case">' + esc(c.caseType) + "</span>" +
            '<span class="clientcard__meta">' + esc(c.source) + " · " + esc(c.contacted) +
              " · " + esc(c.caseNumber) + " · " + esc(c.attorney) + "</span>" +
          "</span>" +
          '<span class="clientcard__value"><b>' + (c.value ? money(c.value) : "—") + "</b>" +
            "<span>" + esc(c.valueRange) + "</span></span>" +
          "</button>";
      }).join("");

      return '<section class="clientsec">' +
        '<div class="clientsec__head"><h2 class="clientsec__title">' + esc(sec.title) + "</h2>" +
        '<span class="clientsec__count">' + rows.length + " · " + esc(sec.note) + "</span></div>" +
        '<div class="clientlist">' + cards + "</div></section>";
    }).join("");

    $$("#clientSections .clientcard").forEach(function (card) {
      card.addEventListener("click", function () {
        state.openClient = card.getAttribute("data-client");
        renderClients();
      });
    });

    renderNeeds();
  }

  function sourcePane(c) {
    var out = [];

    out.push('<p class="panelabel">Source material</p>');

    if (c.email) {
      out.push('<dl class="srcmeta">' +
        "<div><dt>From</dt><dd>" + esc(c.email.from) + "</dd></div>" +
        "<div><dt>To</dt><dd>" + esc(c.email.to) + "</dd></div>" +
        "<div><dt>Subject</dt><dd>" + esc(c.email.subject) + "</dd></div>" +
        "<div><dt>Date</dt><dd>" + esc(c.email.date) + "</dd></div></dl>");
    } else if (c.call) {
      out.push('<dl class="srcmeta">' +
        "<div><dt>Channel</dt><dd>Inbound call</dd></div>" +
        "<div><dt>Duration</dt><dd>" + esc(c.call.duration) + "</dd></div>" +
        "<div><dt>Notes</dt><dd>" + esc(c.call.notes) + "</dd></div></dl>");
    } else if (c.form) {
      out.push('<dl class="srcmeta">' + c.form.map(function (f) {
        return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>";
      }).join("") + "</dl>");
    }

    out.push('<div class="srcbody">' + esc(c.message) + "</div>");

    return '<section class="card">' + out.join("") + "</section>";
  }

  function contactPane(c) {
    return '<section class="card" style="margin-top:12px">' +
      '<h3 class="card__title">Contact Information</h3>' +
      '<dl class="kv"><div><dt>Email</dt><dd>' + esc(c.contact.email) + "</dd></div>" +
      "<div><dt>Phone</dt><dd>" + esc(c.contact.phone) + "</dd></div></dl></section>";
  }

  function valuePane(c) {
    return '<section class="card valuecard' + (isHigh(c) ? " is-high" : "") + '" style="margin-top:12px">' +
      '<div class="valuecard__top"><span class="valuecard__label">Estimated value</span>' +
      '<span class="valuecard__num">' + (c.value ? esc(c.valueRange) : "—") + "</span></div>" +
      '<p class="valuecard__why">' + esc(c.valueReason) + "</p></section>";
  }

  function attachPane(c) {
    if (!c.attachments || !c.attachments.length) { return ""; }
    var icons = {
      pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'
    };
    return '<section class="card" style="margin-top:12px"><h3 class="card__title">Attachments</h3>' +
      c.attachments.map(function (a) {
        return '<div class="attach"><span class="attach__icon" aria-hidden="true">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          icons[a.kind] + "</svg></span>" +
          "<span><span>" + esc(a.name) + '</span><br><span class="attach__size">' + esc(a.size) + "</span></span>" +
          '<button class="attach__dl" type="button" data-noop="1">Download</button></div>';
      }).join("") + "</section>";
  }

  function actionsPane(c) {
    if (!c.actions.length) {
      return '<section class="card"><p class="ai__text" style="color:var(--muted)">No proposed actions — this client is already ' +
             esc(state.status[c.id]) + ".</p></section>";
    }

    var sel = state.selected[c.id], done = state.done[c.id];

    var list = c.actions.map(function (a) {
      var isDone = !!done[a.id];
      var isSel = !isDone && !!sel[a.id];
      var key = c.id + ":" + a.id;
      var body = state.emails[key] != null ? state.emails[key] : a.emailBody;

      var params = a.params.map(function (p) {
        return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>";
      }).join("");

      if (a.emailBody) {
        params += "<div><dt>Email body</dt><dd>" + esc(body.split("\n")[0]).slice(0, 58) + "…" +
                  (state.emails[key] != null ? ' <span style="color:var(--green)">✓ Reviewed</span>' : "") + "</dd></div>";
      }

      return '<div class="action' + (isSel ? " is-sel" : "") + (isDone ? " is-done" : "") +
        '" data-action="' + a.id + '" role="button" tabindex="0">' +
        '<span class="action__circle"></span>' +
        '<span class="action__body">' +
          '<span class="action__top"><span class="action__title">' + esc(a.title) + "</span>" +
            (isDone ? '<span class="pill pill--done">Completed</span>' : "") + "</span>" +
          '<dl class="action__params">' + params + "</dl>" +
          (a.emailBody && !isDone ? '<button class="action__edit" type="button" data-edit="' + a.id + '">Edit Email</button>' : "") +
        "</span></div>";
    }).join("");

    return '<div class="actions">' + list + "</div>";
  }

  function bottomBar(c) {
    var st = state.status[c.id];
    var out = [];

    if (st === "signed") {
      out.push('<button class="btn btn--ghost" type="button" data-noop="1">Open in MyCase</button>');
    } else if (st === "declined") {
      out.push('<button class="btn btn--ghost" type="button" data-act="reconsider">Reconsider Client</button>');
    } else {
      var n = Object.keys(state.selected[c.id]).filter(function (k) {
        return state.selected[c.id][k] && !state.done[c.id][k];
      }).length;

      if (c.actions.length) {
        out.push('<button class="btn btn--primary" type="button" data-act="complete"' + (n ? "" : " disabled") + ">" +
                 "Complete Selected Actions (" + n + ")</button>");
      }
      out.push('<button class="btn btn--green" type="button" data-act="convert">Convert to Signed Client</button>');
      out.push('<button class="btn btn--danger" type="button" data-act="decline">Decline Client</button>');
    }

    return '<div class="actionbar">' + out.join("") + "</div>";
  }

  function renderDetail() {
    var c = clientById(state.openClient);
    if (!c) { return; }

    $("#clientDetail").innerHTML =
      '<div class="detail__bar"><button class="backbtn" type="button" id="detailBack">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
        "All clients</button></div>" +
      '<div class="detail__head"><div class="detail__name"><h1>' + esc(c.name) + "</h1>" +
        statusPill(c) + highPill(c) + "</div>" +
        '<p class="detail__sub">' + esc(c.caseType) + " · " + esc(c.source) + " · " + esc(c.contacted) + "</p></div>" +
      '<div class="panes"><div>' +
        sourcePane(c) + contactPane(c) + valuePane(c) + attachPane(c) +
      "</div><div>" +
        '<section class="card ai" style="margin-bottom:12px">' +
          '<div class="ai__head"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/></svg>' +
          "<span>AI analysis</span></div>" +
          '<p class="ai__text">' + esc(c.analysis) + "</p></section>" +
        actionsPane(c) +
        bottomBar(c) +
      "</div></div>";

    $("#detailBack").addEventListener("click", function () {
      state.openClient = null;
      renderClients();
    });

    $$("#clientDetail [data-action]").forEach(function (el) {
      var id = el.getAttribute("data-action");
      function pick(e) {
        if (e.target.closest("[data-edit]")) { return; }
        if (state.done[c.id][id]) { return; }
        state.selected[c.id][id] = !state.selected[c.id][id];
        renderDetail();
      }
      el.addEventListener("click", pick);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e); }
      });
    });

    $$("#clientDetail [data-edit]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        openEmailModal(c, b.getAttribute("data-edit"));
      });
    });

    $$("#clientDetail [data-act]").forEach(function (b) {
      b.addEventListener("click", function () { runAction(c, b.getAttribute("data-act")); });
    });
  }

  function runAction(c, act) {
    if (act === "complete") {
      var picked = Object.keys(state.selected[c.id]).filter(function (k) {
        return state.selected[c.id][k] && !state.done[c.id][k];
      });
      if (!picked.length) { return; }
      picked.forEach(function (k) { state.done[c.id][k] = true; state.selected[c.id][k] = false; });
      state.responded[c.id] = true;
      toast("Action completed! All selected items will be executed.");
      renderDetail();
      renderNeeds();
      return;
    }

    if (act === "convert")    { state.status[c.id] = "signed";   state.responded[c.id] = true; toast(c.name + " converted to a signed client."); }
    if (act === "decline")    { state.status[c.id] = "declined"; state.responded[c.id] = true; toast("Client declined", "red"); }
    if (act === "reconsider") { state.status[c.id] = "potential"; toast(c.name + " moved back to potential."); }

    state.openClient = null;
    renderClients();
  }

  /* --------------------------------------------------------- email modal -- */

  function openEmailModal(c, actionId) {
    var action = c.actions.filter(function (a) { return a.id === actionId; })[0];
    var key = c.id + ":" + actionId;
    var body = state.emails[key] != null ? state.emails[key] : action.emailBody;
    var to = (action.params.filter(function (p) { return p[0] === "To"; })[0] || ["To", ""])[1];
    var subject = (action.params.filter(function (p) { return p[0] === "Subject"; })[0] || ["Subject", ""])[1];

    $("#modalRoot").innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Edit email"><div class="modal__box">' +
        '<div class="modal__head"><h2>Edit email — ' + esc(c.name) + "</h2>" +
          '<button class="modal__close" type="button" data-close="1" aria-label="Close">×</button></div>' +
        '<div class="modal__panes"><div class="modal__left">' +
          '<div class="field"><label for="mTo">To</label><input id="mTo" value="' + esc(to) + '"></div>' +
          '<div class="field"><label for="mSubject">Subject</label><input id="mSubject" value="' + esc(subject) + '"></div>' +
          '<div class="field"><label for="mBody">Email body</label><textarea id="mBody">' + esc(body) + "</textarea></div>" +
        '</div><div class="modal__right">' +
          '<p class="panelabel">AI assistant</p>' +
          '<div class="field"><label for="mPrompt">What should this email do?</label>' +
            '<input id="mPrompt" placeholder="e.g. make it warmer and shorter"></div>' +
          '<button class="btn btn--primary" type="button" id="mGen">Generate Email</button>' +
          '<p class="valuecard__why">The draft is regenerated in place. Nothing is sent until a human saves and completes the action.</p>' +
        "</div></div>" +
        '<div class="modal__foot">' +
          '<button class="btn btn--ghost" type="button" data-close="1">Discard</button>' +
          '<button class="btn btn--primary" type="button" id="mSave">Save</button>' +
        "</div></div></div>";

    function close() { $("#modalRoot").innerHTML = ""; }

    $$("#modalRoot [data-close]").forEach(function (b) { b.addEventListener("click", close); });

    $("#mGen").addEventListener("click", function () {
      var prompt = $("#mPrompt").value.trim();
      var ta = $("#mBody");
      ta.value = "Dear " + c.name.split(" ").slice(-1)[0] + ",\n\n" +
        "Thank you for contacting Your Law Firm about your " + c.caseType.toLowerCase() + " matter." +
        (prompt ? "\n\n[Redrafted for: " + prompt + "]" : "") +
        "\n\nWe have reviewed the information you sent and would like to arrange a short call to talk through your options. " +
        "In the meantime, please keep any documents, photographs, or correspondence relating to the incident.\n\n" +
        "Sincerely,\nClient Intake Team\nYour Law Firm";
      toast("Draft regenerated.");
    });

    $("#mSave").addEventListener("click", function () {
      state.emails[key] = $("#mBody").value;
      close();
      renderDetail();
      toast("Email saved for review.");
    });
  }

  /* ------------------------------------------------------------- agent -- */

  var AGENT_ICONS = {
    pen:      '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    chart:    '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    value:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    scale:    '<path d="M12 3v18M7 21h10"/><path d="m5 7 3 6H2Zm14 0 3 6h-6Z"/><path d="M5 7h14"/>',
    fileedit: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6"/><path d="M14 2v6h6"/><path d="M18.4 13.6a1.8 1.8 0 0 1 2.5 2.5L17 20l-3 .7.7-3Z"/>'
  };

  function renderAgentActions() {
    $("#agentActions").innerHTML = D.agentActions.map(function (a) {
      return '<button class="agent__action" type="button" data-agent="' + esc(a.label) + '">' +
        '<i aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        AGENT_ICONS[a.icon] + "</svg></i><span>" + esc(a.label) + "</span></button>";
    }).join("");

    $$("#agentActions [data-agent]").forEach(function (b) {
      b.addEventListener("click", function () { agentSend(b.getAttribute("data-agent")); });
    });
  }

  var AGENT_REPLIES = {
    "Draft Response to New Lead":
      "Here is a first response for John Smith (Motor Vehicle Accident, received today 10:30 AM):\n\n" +
      "Dear Mr. Smith,\n\nThank you for reaching out about the collision on February 10th. We have your police report and medical documentation.\n\n" +
      "Please do not give a recorded statement to the other driver's carrier — you are not obliged to, and it can be used to reduce your claim. " +
      "An attorney will call you within one business day.\n\nSincerely,\nClient Intake Team\n\n" +
      "Open the client record to edit and queue this for sending.",
    "Client Pipeline Summary":
      "Last 30 days: 27 intakes, 4 signed (15% conversion), $415K in estimated signed value, 2.4h average time to first response.\n\n" +
      "Three leads are still awaiting a first response — John Smith, Amanda Torres and Marcus Chen. Marcus Chen is the most time-sensitive: " +
      "his C-3 filing has not gone in and the employer is already disputing the claim.\n\n" +
      "Email remains the strongest channel at 12 intakes (44%), followed by phone at 10 (37%).",
    "Analyze Potential Case Value":
      "Highest estimated value in the current pipeline is Sarah Johnson's delayed-diagnosis matter at $180,000–$300,000, though that figure " +
      "is contingent on an expert affirmation supporting a breach at the second presentation.\n\n" +
      "John Smith's motor vehicle claim is the strongest risk-adjusted opportunity: $75,000–$150,000 against a commercial policy, clear " +
      "liability, and continuous treatment from the date of loss."
  };

  function agentSend(text) {
    if (!text.trim()) { return; }

    $("#agentHello").classList.add("u-hide");
    $("#agentChat").classList.remove("u-hide");

    state.agentChat.push({ me: true, text: text });

    var reply = AGENT_REPLIES[text] ||
      "I can work across the intake pipeline, client records and the connected tools. Try one of the suggested actions, " +
      "or ask about a specific client — for example, \"what is outstanding on Marcus Chen?\"";

    state.agentChat.push({ me: false, text: reply });

    $("#agentChat").innerHTML = state.agentChat.map(function (m) {
      return '<div class="bubble bubble--' + (m.me ? "me" : "ai") + '">' + esc(m.text) + "</div>";
    }).join("");

    $("#agentInput").value = "";
  }

  $("#agentForm").addEventListener("submit", function (e) {
    e.preventDefault();
    agentSend($("#agentInput").value);
  });

  /* ------------------------------------------------------ integrations -- */

  function renderIntegrations() {
    $("#connectedCount").textContent = D.connected.length + " services";
    $("#availableCount").textContent = D.available.length + " services";

    $("#connectedList").innerHTML = D.connected.map(function (i) {
      return '<div class="introw"><span class="introw__logo" style="background:' + i.color + '" aria-hidden="true">' + i.letter + "</span>" +
        '<span><span class="introw__name">' + esc(i.name) + '</span><br><span class="introw__meta">' + esc(i.account) + "</span></span>" +
        '<span class="introw__right"><span class="pill pill--signed">Connected</span>' +
        '<button class="introw__btn" type="button" data-noop="1">Manage</button></span></div>';
    }).join("");

    $("#availableList").innerHTML = D.available.map(function (i) {
      return '<div class="introw"><span class="introw__logo" style="background:' + i.color + '" aria-hidden="true">' + i.letter + "</span>" +
        '<span><span class="introw__name">' + esc(i.name) + '</span><br><span class="introw__meta">' + esc(i.blurb) + "</span></span>" +
        '<span class="introw__right"><button class="introw__btn introw__btn--connect" type="button" data-noop="1">Connect</button></span></div>';
    }).join("");
  }

  /* ---------------------------------------------------------- settings -- */

  var NOTIFS = [
    { key: "newIntake", label: "New intake received",       meta: "Email and in-app, immediately" },
    { key: "digest",    label: "Daily pipeline digest",      meta: "Every weekday at 8:00 AM" },
    { key: "highValue", label: "High-value lead detected",   meta: "Estimated value above $75,000" },
    { key: "declined",  label: "Client declined",            meta: "Notify the originating attorney" }
  ];

  function renderNotifs() {
    $("#notifRows").innerHTML = NOTIFS.map(function (n) {
      return '<div class="switchrow"><div><div>' + esc(n.label) + "</div>" +
        '<div class="switchrow__meta">' + esc(n.meta) + "</div></div>" +
        '<button class="toggle" type="button" data-notif="' + n.key + '" aria-pressed="' +
        (state.notifications[n.key] ? "true" : "false") + '" aria-label="' + esc(n.label) + '"></button></div>';
    }).join("");

    $$("#notifRows [data-notif]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-notif");
        state.notifications[k] = !state.notifications[k];
        renderNotifs();
      });
    });
  }

  document.addEventListener("click", function (e) {
    var noop = e.target.closest ? e.target.closest("[data-noop]") : null;
    if (noop) { toast("Demo environment — this action is not wired to a live system."); }
  });

  /* ----------------------------------------------------------------- go -- */

  renderDashboard();
  renderClients();
  renderAgentActions();
  renderIntegrations();
  renderNotifs();
  setView("dashboard");
})();
