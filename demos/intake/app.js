/* ==========================================================================
   BESPOKE — AI intake console demo
   Renders all three views from the single CASES fixture in data.js, so the
   console, the case sheet, and the SMS thread can never drift apart. Nothing
   here calls a network; the demo is entirely self-contained.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Status drives the chip colour in both the console and the sheet.
  function statusClass(status) {
    if (status === "Case Accepted") return "chip--accepted";
    if (status === "Under Review") return "chip--review";
    return "chip--new";
  }

  function chip(status) {
    return '<span class="chip ' + statusClass(status) + '">' + escapeHtml(status) + "</span>";
  }

  // The sheet abbreviates a few cells; fall back to the full value otherwise.
  function sheetValue(c, key) {
    return (c.sheet && c.sheet[key]) || c[key];
  }

  function setIndex(nodes) {
    Array.prototype.forEach.call(nodes, function (n, i) {
      n.style.setProperty("--i", i);
    });
  }

  var motion = { enterTimer: null };

  function enterView(id) {
    var view = doc.getElementById("view-" + id);
    if (!view || REDUCED) return;
    doc.querySelectorAll(".view.is-enter").forEach(function (v) {
      v.classList.remove("is-enter");
    });
    if (motion.enterTimer) clearTimeout(motion.enterTimer);
    void view.offsetWidth;
    view.classList.add("is-enter");
    motion.enterTimer = setTimeout(function () {
      view.classList.remove("is-enter");
      motion.enterTimer = null;
    }, 1400);
  }

  /* ------------------------------------------------------------- console -- */

  var caseList = $("#caseList");
  var caseDetail = $("#caseDetail");
  var activeIndex = 0;

  function renderList() {
    caseList.innerHTML = CASES.map(function (c, i) {
      var on = i === activeIndex;
      return '<button class="case-item' + (on ? " is-active" : "") + '" type="button"' +
             ' data-case="' + i + '" aria-pressed="' + on + '">' +
               '<span class="case-item__row">' +
                 '<span class="case-item__name">' + escapeHtml(c.name) + "</span>" +
                 '<span class="case-item__value">' + escapeHtml(c.value) + "</span>" +
               "</span>" +
               '<span class="case-item__time">' + escapeHtml(c.time) + "</span>" +
               '<span class="case-item__preview">' + escapeHtml(c.caseType + " — " + c.injuries) + "</span>" +
             "</button>";
    }).join("");
    setIndex(caseList.querySelectorAll(".case-item"));
  }

  function field(label, value, mods) {
    return '<div class="case-grid__field' + (mods && mods.wide ? " case-grid__field--wide" : "") + '">' +
             '<span class="field__label">' + escapeHtml(label) + "</span>" +
             '<p class="case-grid__value' +
               (mods && mods.mono ? " mono" : "") +
               (mods && mods.deadline ? " case-grid__value--deadline" : "") +
             '">' + escapeHtml(value) + "</p>" +
           "</div>";
  }

  function renderDetail(switched) {
    var c = CASES[activeIndex];
    caseDetail.innerHTML =
      '<div class="case-detail__head">' +
        "<div>" +
          "<h3>" + escapeHtml(c.name) + "</h3>" +
          '<p class="case-detail__sub">' + escapeHtml(c.caseType) + " &middot; " + escapeHtml(c.time) + "</p>" +
        "</div>" +
        '<div class="case-detail__value">' +
          '<span class="field__label">Est. case value</span>' +
          "<b>" + escapeHtml(c.value) + "</b>" +
        "</div>" +
      "</div>" +
      '<div class="case-detail__chip">' + chip(c.status) + "</div>" +
      '<div class="case-grid">' +
        field("Callback #", c.callback, { mono: true }) +
        field("Incident date", c.incidentDate, { mono: true }) +
        field("Incident location", c.location) +
        field("Statute deadline", c.statute, { mono: true, deadline: true }) +
        field("Injuries sustained", c.injuries) +
        field("Medical treatment", c.treatment) +
        field("At-fault party", c.atFault) +
        field("Insurance carrier", c.insurance) +
        field("Police report #", c.policeReport, { mono: true }) +
        field("Witnesses", c.witnesses) +
        field("Special notes", c.notes, { wide: true }) +
      "</div>";
    setIndex(caseDetail.querySelectorAll(".case-grid__field"));
    var enter = !REDUCED && switched;
    caseDetail.classList.toggle("is-enter", enter);
    if (enter) {
      setTimeout(function () { caseDetail.classList.remove("is-enter"); }, 900);
    }
  }

  // Only the selected state is toggled here; re-rendering the whole list would
  // tear down the button the user just activated and lose their focus with it.
  function markActive() {
    caseList.querySelectorAll("[data-case]").forEach(function (btn) {
      var on = Number(btn.dataset.case) === activeIndex;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  caseList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-case]");
    if (!btn) return;
    activeIndex = Number(btn.dataset.case);
    markActive();
    renderDetail(true);
  });

  /* ---------------------------------------------------------- case sheet -- */

  function cell(value, mods) {
    var cls = [];
    if (mods && mods.mono) cls.push("mono");
    if (mods && mods.wrap) cls.push("is-wrap");
    return "<td" + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ">" + escapeHtml(value) + "</td>";
  }

  function renderSheet() {
    $("#sheetBody").innerHTML = CASES.map(function (c, i) {
      return "<tr>" +
        '<td class="rownum">' + (i + 1) + "</td>" +
        cell(c.time, { mono: true }) +
        cell(c.name) +
        cell(c.callback, { mono: true }) +
        cell(c.caseType) +
        cell(c.incidentDate, { mono: true }) +
        cell(sheetValue(c, "location"), { wrap: true }) +
        cell(sheetValue(c, "injuries"), { wrap: true }) +
        cell(sheetValue(c, "treatment"), { wrap: true }) +
        cell(sheetValue(c, "atFault"), { wrap: true }) +
        cell(c.insurance) +
        cell(c.policeReport, { mono: true }) +
        cell(c.witnesses, { wrap: true }) +
        cell(c.value, { mono: true }) +
        cell(c.statute, { mono: true }) +
        "<td>" + chip(c.status) + "</td>" +
      "</tr>";
    }).join("");
    setIndex($("#sheetBody").querySelectorAll("tr"));
  }

  /* -------------------------------------------------------- text message -- */

  function renderThread() {
    $("#thread").innerHTML = SMS_THREAD.map(function (m) {
      return '<p class="thread__stamp">' + escapeHtml(m.stamp) + "</p>" +
             '<div class="bubble">' +
               '<span class="bubble__tag">' + escapeHtml(m.tag) + "</span><br>" +
               "<b>" + escapeHtml(m.name) + "</b> — new potential case.<br>" +
               m.lines.map(escapeHtml).join("<br>") +
             "</div>";
    }).join("");
    setIndex(doc.querySelectorAll("#thread .bubble"));
    setIndex(doc.querySelectorAll("#thread .thread__stamp"));
  }

  /* --------------------------------------------------------------- views -- */

  var viewTabs = $("#viewTabs");

  viewTabs.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-view]");
    if (!tab || tab.getAttribute("aria-selected") === "true") return;
    showView(tab);
  });

  // arrow keys move between tabs, as a tablist is expected to
  viewTabs.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var tabs = Array.prototype.slice.call(viewTabs.querySelectorAll("[data-view]"));
    var i = tabs.indexOf(doc.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    showView(next);
    next.focus();
  });

  function showView(tab) {
    viewTabs.querySelectorAll("[data-view]").forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      doc.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    enterView(tab.dataset.view);
  }

  /* ---------------------------------------------------------------- boot -- */

  setIndex(doc.querySelectorAll(".tabs .tab"));

  if (!REDUCED) {
    $(".topbar").classList.add("is-boot");
    $(".tabs").classList.add("is-boot");
    setTimeout(function () {
      $(".topbar").classList.remove("is-boot");
      $(".tabs").classList.remove("is-boot");
    }, 900);
  }

  renderList();
  renderDetail(false);
  renderSheet();
  renderThread();
  enterView("console");
})();
