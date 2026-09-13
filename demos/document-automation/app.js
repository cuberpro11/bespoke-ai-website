/* ==========================================================================
   BESPOKE — Document automation platform demo
   Self-contained runtime. No build step, no network: answers are scripted so
   the demo behaves identically every time it is shown.
   ========================================================================== */

(function () {
  "use strict";

  var D = window.DOC_DATA;
  if (!D) { return; }

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var state = {
    view: "ask",
    thread: [],
    sources: [],
    activeCite: null,
    libraryQuery: "",
    libraryKind: "All",
    clauseCat: "All",
    fillVars: true
  };

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
    b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
  });

  /* -------------------------------------------------------------- toast -- */

  var toastTimer = null;
  function toast(msg) {
    var root = $("#toastRoot");
    root.innerHTML = '<div class="toast">' + esc(msg) + "</div>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ""; }, 2200);
  }

  document.addEventListener("click", function (e) {
    var n = e.target.closest ? e.target.closest("[data-noop]") : null;
    if (n) { toast("Demo environment — this action is not wired to a live system."); }
  });

  /* ----------------------------------------------------------------- ask -- */

  function renderSuggested() {
    $("#suggested").innerHTML = D.suggested.map(function (q) {
      return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + "</button>";
    }).join("");

    $$("#suggested button").forEach(function (b) {
      b.addEventListener("click", function () { ask(b.getAttribute("data-q")); });
    });
  }

  function renderThread() {
    var thread = $("#thread");
    thread.classList.toggle("u-hide", !state.thread.length);

    thread.innerHTML = state.thread.map(function (m) {
      if (m.me) {
        return '<div class="bubble bubble--me">' + esc(m.text) + "</div>";
      }
      var paras = m.body.map(function (line) {
        var cite = line.cite
          ? '<button class="cite' + (state.activeCite === line.cite ? " is-on" : "") +
            '" type="button" data-cite="' + line.cite + '" aria-label="Source ' + line.cite + '">' + line.cite + "</button>"
          : "";
        return "<p>" + esc(line.text) + cite + "</p>";
      }).join("");
      return '<div class="bubble bubble--ai">' + paras + "</div>";
    }).join("");

    $$("#thread .cite").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = Number(b.getAttribute("data-cite"));
        state.activeCite = state.activeCite === n ? null : n;
        renderThread();
        renderSources();
        var el = $('.src[data-n="' + n + '"]');
        if (el && el.scrollIntoView) { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      });
    });
  }

  function renderSources() {
    var box = $("#sources");

    if (!state.sources.length) {
      box.innerHTML = '<p class="src__empty">' +
        (state.thread.length
          ? "No passage in the corpus supports that question, so no source is shown."
          : "Ask a question and every sentence in the answer will point at the passage it came from.") +
        "</p>";
      return;
    }

    box.innerHTML = state.sources.map(function (s) {
      return '<div class="src' + (state.activeCite === s.n ? " is-on" : "") + '" data-n="' + s.n + '">' +
        '<div class="src__top"><span class="src__n">' + s.n + "</span>" +
        '<span><span class="src__doc">' + esc(s.doc) + "</span><br>" +
        '<span class="src__loc">' + esc(s.loc) + "</span></span></div>" +
        '<p class="src__quote">' + esc(s.quote) + "</p></div>";
    }).join("");
  }

  function ask(question) {
    var q = String(question || "").trim();
    if (!q) { return; }

    var found = D.answers[q] || null;

    if (!found) {
      var lower = q.toLowerCase();
      Object.keys(D.answers).forEach(function (k) {
        if (found) { return; }
        var words = k.toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter(function (w) { return w.length > 4; });
        var hits = words.filter(function (w) { return lower.indexOf(w) > -1; }).length;
        if (hits >= 2) { found = D.answers[k]; }
      });
    }

    var answer = found || D.fallback;

    state.thread.push({ me: true, text: q });
    state.thread.push({ me: false, body: answer.body });
    state.sources = answer.sources;
    state.activeCite = null;

    $("#askInput").value = "";
    renderThread();
    renderSources();
  }

  $("#askForm").addEventListener("submit", function (e) {
    e.preventDefault();
    ask($("#askInput").value);
  });

  /* ------------------------------------------------------------- library -- */

  function renderLibraryChips() {
    $("#libraryChips").innerHTML = D.kinds.map(function (k) {
      var n = k === "All" ? D.library.length : D.library.filter(function (d) { return d.kind === k; }).length;
      return '<button class="chip' + (k === state.libraryKind ? " is-active" : "") +
             '" type="button" data-kind="' + k + '">' + k + " <span>" + n + "</span></button>";
    }).join("");

    $$("#libraryChips .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        state.libraryKind = c.getAttribute("data-kind");
        renderLibraryChips();
        renderLibrary();
      });
    });
  }

  function renderLibrary() {
    var q = state.libraryQuery.trim().toLowerCase();

    var rows = D.library.filter(function (d) {
      if (state.libraryKind !== "All" && d.kind !== state.libraryKind) { return false; }
      if (!q) { return true; }
      return d.name.toLowerCase().indexOf(q) > -1 || d.owner.toLowerCase().indexOf(q) > -1 || d.id.toLowerCase().indexOf(q) > -1;
    });

    $("#libraryBody").innerHTML = rows.length ? rows.map(function (d) {
      return "<tr>" +
        '<td class="mono">' + esc(d.id) + "</td>" +
        "<td>" + esc(d.name) + "</td>" +
        "<td>" + esc(d.kind) + "</td>" +
        '<td class="dim">' + esc(d.owner) + "</td>" +
        '<td class="num dim">' + d.pages + "</td>" +
        '<td class="dim">' + esc(d.updated) + "</td>" +
        '<td><span class="badge badge--' + (d.status === "indexed" ? "ok" : "work") + '">' +
          (d.status === "indexed" ? "Indexed" : "Indexing") + "</span></td>" +
        "</tr>";
    }).join("") : '<tr><td colspan="7" class="dim">No documents match that filter.</td></tr>';

    $("#libraryCount").textContent = D.library.length;
  }

  $("#librarySearch").addEventListener("input", function (e) {
    state.libraryQuery = e.target.value;
    renderLibrary();
  });

  /* ------------------------------------------------------------ assemble -- */

  function renderSteps() {
    $("#steps").innerHTML = D.intake.stages.map(function (s) {
      return '<div class="step"><div class="step__top">' +
        '<span class="step__tick" aria-hidden="true">' +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>' +
        "</span>" + esc(s.label) + "</div>" +
        '<div class="step__note">' + esc(s.note) + "</div></div>";
    }).join("");
  }

  function renderIntake() {
    var i = D.intake;
    var rows = [
      ["Matter", i.matter], ["Client", i.client], ["Entity", i.entity],
      ["Contact", i.contact], ["Email", i.email], ["Instrument", i.requested],
      ["Value", i.value], ["Jurisdiction", i.jurisdiction]
    ];

    $("#intakeKv").innerHTML = rows.map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");

    $("#intakeNotes").textContent = i.notes;
  }

  function renderSelectedClauses() {
    $("#selectedClauses").innerHTML = D.selectedClauses.map(function (c) {
      return '<div class="clauserow"><span class="clauserow__id">' + esc(c.id) + "</span>" +
        '<span><span class="clauserow__title">' + esc(c.title) + "</span> " +
        (c.risk === "review" ? '<span class="badge badge--work">Flagged</span>' : "") +
        '<div class="clauserow__why">' + esc(c.why) + "</div></span></div>";
    }).join("");
  }

  function renderIssues() {
    $("#issueCount").textContent = D.issues.length + " issues, 0 blocking";

    $("#issues").innerHTML = D.issues.map(function (i) {
      return '<div class="issue"><span class="issue__icon" aria-hidden="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>' +
        "</span><div><div class=\"issue__title\">" + esc(i.title) + "</div>" +
        '<div class="issue__detail">' + esc(i.detail) + "</div>" +
        '<button class="issue__btn" type="button" data-noop="1">' + esc(i.action) + "</button></div></div>";
    }).join("");
  }

  function renderDoc() {
    function fill(text) {
      var out = esc(text);
      D.vars.forEach(function (v) {
        var token = esc(v[0]);
        var replacement = state.fillVars
          ? '<span class="var var--filled">' + esc(v[1]) + "</span>"
          : '<span class="var">' + token + "</span>";
        out = out.split(token).join(replacement);
      });
      return out;
    }

    $("#doc").innerHTML = D.draft.map(function (b) {
      if (b.h)  { return "<h1>" + esc(b.h) + "</h1>"; }
      if (b.h2) { return "<h2>" + esc(b.h2) + "</h2>"; }
      var flag = b.flag ? '<span class="doc__flag">⚑ ' + esc(b.flag) + "</span>" : "";
      return '<p' + (b.flag ? ' class="flagged"' : "") + ">" + fill(b.p) + flag + "</p>";
    }).join("");
  }

  $("#varToggle").addEventListener("click", function () {
    state.fillVars = !state.fillVars;
    $("#varToggle").setAttribute("aria-pressed", state.fillVars ? "true" : "false");
    renderDoc();
  });

  /* ------------------------------------------------------------- clauses -- */

  function renderClauseChips() {
    $("#clauseChips").innerHTML = D.clauseCats.map(function (c) {
      var n = c === "All" ? D.clauses.length : D.clauses.filter(function (x) { return x.category === c; }).length;
      return '<button class="chip' + (c === state.clauseCat ? " is-active" : "") +
             '" type="button" data-cat="' + c + '">' + c + " <span>" + n + "</span></button>";
    }).join("");

    $$("#clauseChips .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        state.clauseCat = c.getAttribute("data-cat");
        renderClauseChips();
        renderClauses();
      });
    });
  }

  function renderClauses() {
    var rows = D.clauses.filter(function (c) {
      return state.clauseCat === "All" || c.category === state.clauseCat;
    });

    $("#clauseBody").innerHTML = rows.map(function (c) {
      return "<tr>" +
        '<td class="mono">' + esc(c.id) + "</td>" +
        "<td>" + esc(c.title) + "</td>" +
        "<td>" + esc(c.category) + "</td>" +
        '<td class="dim">' + esc(c.version) + "</td>" +
        '<td><span class="badge badge--' + (c.risk === "high" ? "risk" : "std") + '">' +
          (c.risk === "high" ? "High review" : "Standard") + "</span></td>" +
        '<td class="dim">' + esc(c.reviewed) + "</td>" +
        '<td class="num dim">' + c.uses + "</td>" +
        "</tr>";
    }).join("");

    $("#clauseCount").textContent = D.clauses.length;
  }

  /* ----------------------------------------------------------------- go -- */

  renderSuggested();
  renderThread();
  renderSources();
  renderLibraryChips();
  renderLibrary();
  renderSteps();
  renderIntake();
  renderSelectedClauses();
  renderIssues();
  renderDoc();
  renderClauseChips();
  renderClauses();
  setView("ask");
})();
