/* Law demo — contract drafting, review, and knowledge workspace.
   Plain browser JS: no framework, no build step. State lives in `state`,
   every screen is a render function returning DOM, and `render()` swaps the
   whole app node. Sample data lives in data.js. */

(function () {
  "use strict";

  var D = window.DEMO;

  /* ------------------------------------------------------------ helpers -- */

  /* el("div.card", {onclick: fn}, child, child) — tag supports .class shorthand. */
  function el(spec, props) {
    var parts = spec.split(".");
    var node = document.createElement(parts[0] || "div");
    if (parts.length > 1) node.className = parts.slice(1).join(" ");

    var start = 1;
    if (props && props.nodeType === undefined && !Array.isArray(props) && typeof props === "object") {
      start = 2;
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className += (node.className ? " " : "") + value;
        else if (key === "html") node.innerHTML = value;
        else if (key === "style") {
          Object.keys(value).forEach(function (prop) {
            if (prop.slice(0, 2) === "--") node.style.setProperty(prop, String(value[prop]));
            else node.style[prop] = value[prop];
          });
        }
        else if (key.slice(0, 2) === "on") node.addEventListener(key.slice(2), value);
        else if (key in node && key !== "list") node[key] = value;
        else node.setAttribute(key, value);
      });
    }

    for (var i = start; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  }

  function append(node, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) return child.forEach(function (c) { append(node, c); });
    node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16v-4M12 16V8M17 16v-6"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    trend: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronUp: '<path d="m18 15-6-6-6 6"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    save: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    pencil: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v6h6"/>',
    dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'
  };

  function icon(name, cls) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    node.setAttribute("viewBox", "0 0 24 24");
    node.setAttribute("fill", "none");
    node.setAttribute("stroke", "currentColor");
    node.setAttribute("stroke-width", "1.8");
    node.setAttribute("stroke-linecap", "round");
    node.setAttribute("stroke-linejoin", "round");
    node.setAttribute("aria-hidden", "true");
    if (cls) node.setAttribute("class", cls);
    node.innerHTML = ICONS[name] || "";
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function nowDate() {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function nowTime() {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  function clockTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function relativeDay(date) {
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    var time = clockTime(date);
    if (date.toDateString() === today.toDateString()) return "Today, " + time;
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday, " + time;
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + time;
  }
  function fileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  /* -------------------------------------------------------------- state -- */

  var state = {
    view: "Dashboard",
    inProgress: clone(D.contractsInProgress),
    completed: clone(D.completedContracts),
    search: "",
    expanded: {},
    completedOpen: false,
    statModal: null,
    templates: false,
    templateFiles: {},
    wizard: null,
    detail: null,
    conversations: D.conversations.map(function (c) {
      return {
        id: c.id,
        title: c.title,
        timestamp: new Date(Date.now() - c.ageMs),
        messages: c.messages.map(function (m, i) {
          return { id: String(i + 1), role: m.role, content: m.content, timestamp: new Date(Date.now() - m.ageMs) };
        })
      };
    }),
    activeConversation: "1",
    draft: "",
    agentFiles: [],
    motion: {
      boot: true,
      viewKey: null,
      statKey: null,
      wizardOpen: false,
      wizardStep: null,
      detailId: null,
      dialog: null,
      threadId: null,
      msgCount: {},
      justExpanded: null
    }
  };

  var root = document.getElementById("app");
  var toastHost = document.getElementById("toasts");

  /* Per-frame flags: computed once in render(), then consumed by view builders. */
  var frame = {
    boot: false,
    enter: false,
    overlay: false,
    wizard: false,
    wizardStep: false,
    detail: false,
    dialog: false
  };

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function currentViewKey() {
    if (state.view === "Contracts" && state.templates) return "Templates";
    return state.view;
  }

  function enterClass(base) {
    return base + (frame.enter ? ".is-enter" : "");
  }

  function runCountUps() {
    if (reducedMotion()) return;
    Array.prototype.forEach.call(root.querySelectorAll("[data-count]"), function (node) {
      var to = Number(node.getAttribute("data-count"));
      var suffix = node.getAttribute("data-suffix") || "";
      var start = performance.now();
      var dur = 720;
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = Math.round(eased * to) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      node.textContent = "0" + suffix;
      requestAnimationFrame(tick);
    });
  }

  function render() {
    var key = currentViewKey();
    frame.boot = state.motion.boot;
    frame.enter = state.motion.viewKey !== key;
    frame.overlay = !!state.statModal && state.motion.statKey !== state.statModal;
    frame.wizard = !!state.wizard && !state.motion.wizardOpen;
    frame.wizardStep = !!state.wizard && (frame.wizard || state.motion.wizardStep !== state.wizard.step);
    frame.detail = !!state.detail && state.motion.detailId !== state.detail.contract.id;
    frame.dialog = !!(state.detail && state.detail.dialog) && state.motion.dialog !== state.detail.dialog;

    clear(root);
    root.appendChild(
      el("div.app", {},
        sidebar(),
        el("main.main", {}, screen())
      )
    );
    if (state.statModal) root.appendChild(statModal(state.statModal));
    if (state.detail) root.appendChild(detail());
    if (state.wizard) root.appendChild(wizard());

    if (frame.enter && state.view === "Dashboard") runCountUps();

    state.motion.boot = false;
    state.motion.viewKey = key;
    state.motion.statKey = state.statModal;
    state.motion.wizardOpen = !!state.wizard;
    state.motion.wizardStep = state.wizard ? state.wizard.step : null;
    state.motion.detailId = state.detail ? state.detail.contract.id : null;
    state.motion.dialog = state.detail ? state.detail.dialog : null;
    state.motion.justExpanded = null;
  }

  function screen() {
    if (state.view === "Dashboard") return dashboard();
    if (state.view === "Contracts") return state.templates ? templateManager() : contracts();
    if (state.view === "AI Agent") return agent();
    return el("div", { style: { padding: "2rem" } }, el("h1", {}, state.view));
  }

  function toast(message) {
    var node = el("div.toast", {}, message);
    toastHost.appendChild(node);
    setTimeout(function () { node.remove(); }, 3200);
  }

  /* ------------------------------------------------------------ sidebar -- */

  var NAV = [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Contracts", icon: "folder" },
    { label: "AI Agent", icon: "message" }
  ];

  function sidebar() {
    return el("aside.side" + (frame.boot ? ".is-boot" : ""), {},
      el("a.side__back", { href: "../../demos.html" },
        icon("arrowLeft"),
        el("span", {}, "Bespoke demos")
      ),
      el("div.side__brand", {},
        el("h1", {}, "Contract Desk"),
        el("p", {}, D.user.firm)
      ),
      el("nav.side__nav", { "aria-label": "Sections" }, NAV.map(function (item, i) {
        return el("button.side__item", {
          type: "button",
          class: state.view === item.label ? "is-active" : "",
          style: { "--i": i },
          "aria-current": state.view === item.label ? "page" : null,
          onclick: function () {
            state.view = item.label;
            state.templates = false;
            render();
          }
        }, icon(item.icon), el("span", {}, item.label));
      }))
    );
  }

  function userBlock() {
    return el("div.user", {},
      el("div.user__avatar", {}, D.user.initial),
      el("div", {},
        el("p.user__name", {}, D.user.name),
        el("p.user__email", {}, D.user.email)
      )
    );
  }

  function topbar(title, subtitle, lead, full) {
    return el("div.topbar", {},
      el("div.topbar__inner" + (full ? ".topbar__inner--full" : ""), {},
        lead || el("div", {}, el("h2", {}, title), el("p.topbar__sub", {}, subtitle)),
        userBlock()
      )
    );
  }

  /* ---------------------------------------------------------- dashboard -- */

  var STATS = [
    { label: "In Progress", value: "12", count: 12, suffix: "", meta: "31% of total contracts", icon: "clock", tone: "orange", modal: "inProgress" },
    { label: "Completed", value: "48", count: 48, suffix: "", meta: "+5 this month", icon: "check", tone: "green", modal: "completed" },
    { label: "Avg Contract Turnaround Time", value: "4 days", count: 4, suffix: " days", meta: "", icon: "trend", tone: "purple", modal: "turnaround" }
  ];

  function dashboard() {
    var counting = frame.enter && !reducedMotion();
    return el(enterClass("div"), {},
      topbar("Dashboard", "Welcome back " + D.user.name.split(" ")[0] + "!"),
      el("div.page", {},
        el("div.stat-grid", {}, STATS.map(function (stat, i) {
          return el("button.card.stat", {
            type: "button",
            style: { "--i": i },
            onclick: function () { state.statModal = stat.modal; render(); }
          },
            el("span.stat__icon.stat__icon--" + stat.tone, {}, icon(stat.icon)),
            el("p.stat__label", {}, stat.label),
            el("p.stat__value", {
              "data-count": stat.count,
              "data-suffix": stat.suffix
            }, counting ? "0" + stat.suffix : stat.value),
            stat.meta ? el("p.stat__meta", {}, stat.meta) : null
          );
        })),
        el("section.card.panel", {},
          el("div.panel__head", {},
            el("h3", {}, "Contracts by Client and Document Type"),
            el("p", {}, "61 total contracts this year")
          ),
          stackedBarChart(D.byClient),
          legend()
        ),
        mattersTable()
      )
    );
  }

  function legend() {
    return el("div.legend", {}, D.DOC_TYPES.map(function (type, i) {
      return el("span", { style: { "--i": i } }, el("i", { style: { background: D.DOC_COLORS[type] } }), type);
    }));
  }

  function mattersTable() {
    var rows = state.inProgress.concat(state.completed).slice().sort(function (a, b) {
      return new Date(b.completedDate || b.startedDate) - new Date(a.completedDate || a.startedDate);
    }).slice(0, 5);

    var headers = ["Client", "Matter", "Agreement", "Counterparty", "Responsible Attorney",
      "Location", "Date received", "Sent", ""];

    return el("section.card.table-card", {},
      el("div.table-card__head", {}, el("h3", {}, "Matters in Progress")),
      el("div.table-wrap", {},
        el("table.table", {},
          el("thead", {}, el("tr", {}, headers.map(function (h) { return el("th", {}, h); }))),
          el("tbody", {}, rows.map(function (row, i) {
            return el("tr", {
              style: { "--i": i },
              onclick: function () { openDetail(row); }
            },
              el("td", { class: "is-primary" }, row.clientName),
              el("td", {}, "-"),
              el("td", { class: "is-secondary" }, row.documentType),
              el("td", {}, row.id),
              el("td", { class: "is-secondary" }, row.assignee),
              el("td", {}, D.LOCATIONS[row.id] || D.user.firm),
              el("td", {}, row.completedDate || row.startedDate),
              el("td", {}, "-"),
              el("td", {}, el("button.icon-btn", {
                type: "button",
                "aria-label": "Row actions",
                onclick: function (e) { e.stopPropagation(); }
              }, icon("dots")))
            );
          }))
        )
      )
    );
  }

  /* ------------------------------------------------------------- charts -- */

  var tipNode = null;

  function showTip(event, title, entries, unit) {
    hideTip();
    var total = entries.reduce(function (sum, e) { return sum + e.value; }, 0);
    tipNode = el("div.chart-tip", {},
      el("p.chart-tip__title", {}, title),
      el("p.chart-tip__total", {}, unit === "days"
        ? "Avg: " + (total / entries.length).toFixed(1) + " days"
        : "Total: " + total + " contracts"),
      entries.map(function (e) {
        return el("div.chart-tip__row", {},
          el("span", {}, el("i", { style: { background: e.color } }), e.name + ":"),
          el("b", {}, unit === "days" ? e.value + " days" : e.value)
        );
      })
    );
    document.body.appendChild(tipNode);
    moveTip(event);
  }

  function moveTip(event) {
    if (!tipNode) return;
    var pad = 14;
    var x = Math.min(event.clientX + pad, window.innerWidth - tipNode.offsetWidth - pad);
    var y = Math.min(event.clientY + pad, window.innerHeight - tipNode.offsetHeight - pad);
    tipNode.style.left = Math.max(pad, x) + "px";
    tipNode.style.top = Math.max(pad, y) + "px";
  }

  function hideTip() {
    if (tipNode) { tipNode.remove(); tipNode = null; }
  }

  function bindTip(node, title, entries, unit) {
    node.addEventListener("mouseenter", function (e) { showTip(e, title, entries, unit); });
    node.addEventListener("mousemove", moveTip);
    node.addEventListener("mouseleave", hideTip);
  }

  /* Horizontal stacked bars — one row per client, one segment per doc type. */
  function stackedBarChart(data) {
    var W = 900, rowH = 52, padTop = 10, padBottom = 34, labelW = 110, padRight = 30;
    var H = padTop + data.length * rowH + padBottom;
    var max = Math.max.apply(null, data.map(function (d) {
      return d.v.reduce(function (a, b) { return a + b; }, 0);
    }));
    var step = niceStep(max);
    var top = Math.ceil(max / step) * step;
    var plotW = W - labelW - padRight;
    var scale = function (v) { return (v / top) * plotW; };

    var svg = svgEl("svg", {
      class: "chart chart--stack",
      viewBox: "0 0 " + W + " " + H,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "Contracts by client and document type"
    });

    for (var t = 0; t <= top; t += step) {
      var x = labelW + scale(t);
      svg.appendChild(svgEl("line", { class: "chart__grid", x1: x, x2: x, y1: padTop, y2: H - padBottom }));
      var tick = svgEl("text", { class: "chart__tick", x: x, y: H - padBottom + 20, "text-anchor": "middle" });
      tick.textContent = t;
      svg.appendChild(tick);
    }

    data.forEach(function (row, i) {
      var y = padTop + i * rowH;
      var label = svgEl("text", { class: "chart__cat", x: labelW - 12, y: y + rowH / 2 + 4, "text-anchor": "end" });
      label.textContent = row.client;
      label.style.setProperty("--row", String(i));
      svg.appendChild(label);

      var offset = 0;
      row.v.forEach(function (value, j) {
        var rect = svgEl("rect", {
          class: "chart__bar",
          x: labelW + scale(offset),
          y: y + 10,
          width: scale(value),
          height: rowH - 20,
          fill: D.DOC_COLORS[D.DOC_TYPES[j]]
        });
        rect.style.setProperty("--row", String(i));
        rect.style.setProperty("--seg", String(j));
        svg.appendChild(rect);
        offset += value;
      });

      var hit = svgEl("rect", {
        x: labelW, y: y, width: plotW, height: rowH, fill: "transparent"
      });
      bindTip(hit, row.client, row.v.map(function (value, j) {
        return { name: D.DOC_TYPES[j], value: value, color: D.DOC_COLORS[D.DOC_TYPES[j]] };
      }));
      svg.appendChild(hit);
    });

    return svg;
  }

  /* Vertical grouped columns — one cluster per client. */
  function groupedBarChart(data, axisLabel, unit) {
    var W = 1100, H = 520, padTop = 16, padBottom = 46, padLeft = 62, padRight = 24;
    var max = Math.max.apply(null, data.map(function (d) { return Math.max.apply(null, d.v); }));
    var step = niceStep(max);
    var top = Math.ceil(max / step) * step;
    var plotW = W - padLeft - padRight;
    var plotH = H - padTop - padBottom;
    var groupW = plotW / data.length;
    var barW = Math.min(45, (groupW - 12) / D.DOC_TYPES.length);

    var svg = svgEl("svg", {
      class: "chart chart--group",
      viewBox: "0 0 " + W + " " + H,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": axisLabel
    });

    for (var t = 0; t <= top + 1e-9; t += step) {
      var y = padTop + plotH - (t / top) * plotH;
      svg.appendChild(svgEl("line", { class: "chart__grid", x1: padLeft, x2: W - padRight, y1: y, y2: y }));
      var tick = svgEl("text", { class: "chart__tick", x: padLeft - 10, y: y + 4, "text-anchor": "end" });
      tick.textContent = Number(t.toFixed(2));
      svg.appendChild(tick);
    }

    var axis = svgEl("text", {
      class: "chart__axis-label",
      x: 16, y: padTop + plotH / 2,
      "text-anchor": "middle",
      transform: "rotate(-90 16 " + (padTop + plotH / 2) + ")"
    });
    axis.textContent = axisLabel;
    svg.appendChild(axis);

    data.forEach(function (row, i) {
      var gx = padLeft + i * groupW;
      var clusterW = barW * D.DOC_TYPES.length;
      var start = gx + (groupW - clusterW) / 2;

      row.v.forEach(function (value, j) {
        var h = (value / top) * plotH;
        var rect = svgEl("rect", {
          class: "chart__bar",
          x: start + j * barW,
          y: padTop + plotH - h,
          width: Math.max(barW - 2, 2),
          height: h,
          rx: 4,
          fill: D.DOC_COLORS[D.DOC_TYPES[j]]
        });
        rect.style.setProperty("--row", String(i));
        rect.style.setProperty("--seg", String(j));
        svg.appendChild(rect);
      });

      var label = svgEl("text", { class: "chart__cat", x: gx + groupW / 2, y: H - padBottom + 22, "text-anchor": "middle" });
      label.textContent = row.client;
      svg.appendChild(label);

      var hit = svgEl("rect", { x: gx, y: padTop, width: groupW, height: plotH, fill: "transparent" });
      bindTip(hit, row.client, row.v.map(function (value, j) {
        return { name: D.DOC_TYPES[j], value: value, color: D.DOC_COLORS[D.DOC_TYPES[j]] };
      }), unit);
      svg.appendChild(hit);
    });

    return svg;
  }

  function niceStep(max) {
    var raw = max / 6;
    var mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    var candidates = [1, 2, 2.5, 5, 10].map(function (m) { return m * mag; });
    for (var i = 0; i < candidates.length; i++) if (candidates[i] >= raw) return candidates[i];
    return candidates[candidates.length - 1];
  }

  var STAT_MODALS = {
    turnaround: { title: "Turnaround Time by Client and Document Type", data: "turnaround", axis: "Avg Turnaround Time (Days)", unit: "days" },
    completed: { title: "Completed Contracts by Client and Document Type", data: "completedByClient", axis: "Number of Contracts" },
    inProgress: { title: "Contracts in progress by client and type", data: "inProgressByClient", axis: "Number of Contracts" }
  };

  function statModal(key) {
    var config = STAT_MODALS[key];
    var close = function () { hideTip(); state.statModal = null; render(); };

    return el("div.overlay" + (frame.overlay ? ".is-enter" : ""), { onclick: close },
      el("div.overlay__panel", { onclick: function (e) { e.stopPropagation(); } },
        el("button.overlay__close", { type: "button", "aria-label": "Close", onclick: close }, icon("x")),
        el("div.overlay__body", {},
          el("div.card.panel", {},
            el("div.panel__head", {}, el("h3", {}, config.title)),
            groupedBarChart(D[config.data], config.axis, config.unit),
            legend()
          )
        )
      )
    );
  }

  /* ---------------------------------------------------------- contracts -- */

  function matches(contract) {
    var q = state.search.trim().toLowerCase();
    if (!q) return true;
    return [contract.clientName, contract.documentType, contract.assignee, contract.id]
      .some(function (field) { return field.toLowerCase().indexOf(q) !== -1; });
  }

  function contracts() {
    var open = state.inProgress.filter(matches);
    var done = state.completed.filter(matches);

    return el(enterClass("div"), {},
      topbar("Contracts", "Manage and track all your client contracts"),
      el("div.page", {},
        el("div.toolbar", {},
          el("button.btn.btn--magenta", { type: "button", onclick: startWizard },
            icon("plus"), "New Contract"),
          el("button.btn.btn--plum", {
            type: "button",
            onclick: function () { state.templates = true; render(); }
          }, "Template Management"),
          el("div.search", {},
            icon("search"),
            el("input.input", {
              type: "search",
              placeholder: "Search contracts...",
              value: state.search,
              oninput: function (e) {
                state.search = e.target.value;
                var focused = document.activeElement === e.target;
                var pos = e.target.selectionStart;
                render();
                if (focused) {
                  var next = root.querySelector('.search input');
                  if (next) { next.focus(); next.setSelectionRange(pos, pos); }
                }
              }
            })
          )
        ),

        el("div", { style: { marginBottom: "2rem" } },
          el("div.section-head", {}, el("h2", {}, "Contracts in Progress")),
          el("div.contract-list", {}, open.length
            ? open.map(function (c, i) { return contractCard(c, false, i); })
            : el("div.empty", {}, 'No contracts found matching "' + state.search + '"'))
        ),

        el("div", {},
          el("div.section-head", {},
            el("button", {
              type: "button",
              onclick: function () { state.completedOpen = !state.completedOpen; render(); }
            },
              el("h2", {}, "Completed Contracts"),
              icon(state.completedOpen ? "chevronUp" : "chevronDown")
            )
          ),
          state.completedOpen
            ? el("div.contract-list", {}, done.length
              ? done.map(function (c, i) { return contractCard(c, true, i); })
              : el("div.empty", {}, 'No completed contracts found matching "' + state.search + '"'))
            : null
        )
      )
    );
  }

  function contractCard(contract, done, index) {
    var isOpen = !!state.expanded[contract.id];
    var toggle = function () {
      state.expanded[contract.id] = !isOpen;
      state.motion.justExpanded = !isOpen ? contract.id : null;
      render();
    };
    var unfolding = isOpen && state.motion.justExpanded === contract.id;

    return el("article.card.contract" + (done ? ".contract--done" : ""), {
      style: { "--i": index || 0 }
    },
      el("div.contract__main", { onclick: toggle },
        el("div", { style: { flex: "1" } },
          el("div.contract__title", {},
            el("h3", {}, contract.clientName),
            el("span.badge.badge--outline", {}, contract.id),
            el("span.stamp", {}, icon("clock"),
              el("span", {}, "Started " + contract.startedDate + " at " + contract.startedTime)),
            icon(isOpen ? "chevronUp" : "chevronDown", "contract__chev")
          ),
          el("div.contract__meta", {},
            el("span", {}, icon("file"), contract.documentType),
            el("span", {}, icon("user"), contract.assignee)
          )
        ),
        done ? null : el("button.btn.btn--plum", {
          type: "button",
          onclick: function (e) { e.stopPropagation(); openDetail(contract); }
        }, "Open Document", icon("arrowRight"))
      ),
      isOpen ? el("div.contract__timeline" + (unfolding ? ".is-unfold" : ""), { onclick: toggle },
        el("h4", {}, "Contract Timeline"),
        timeline(contract.timeline)
      ) : null
    );
  }

  function timeline(entries) {
    return el("div.timeline", {}, entries.map(function (entry) {
      return el("div.timeline__item", {},
        el("span.dot.dot--" + dotType(entry.type), {}),
        el("div.timeline__body", {},
          el("div.timeline__action", {},
            el("p", {}, entry.action),
            entry.version ? el("span.badge.badge--outline", {}, entry.version) : null
          ),
          el("div.timeline__when", {},
            el("span", {}, entry.date + " at " + entry.time),
            el("span", {}, "•"),
            el("span", {}, entry.assignee)
          )
        )
      );
    }));
  }

  function dotType(type) {
    return ["started", "version", "export", "approval"].indexOf(type) === -1 ? "default" : type;
  }

  /* -------------------------------------------------- template manager -- */

  function templateManager() {
    var lead = el("div", { style: { display: "flex", alignItems: "center", gap: "1rem" } },
      el("button.btn.btn--ghost", {
        type: "button",
        onclick: function () { state.templates = false; render(); }
      }, icon("arrowLeft"), "Back to Contracts"),
      el("span.divider-v", {}),
      el("div", {},
        el("h2", {}, "Template Management"),
        el("p.topbar__sub", {}, "Upload supporting documents for contract generation")
      )
    );

    return el("div", {},
      topbar(null, null, lead),
      el(enterClass("div.page"), {},
        el("p.u-sm.u-muted", { style: { marginBottom: "1.5rem" } },
          "Upload supporting documents for each document type."),
        el("div.tpl-grid", {}, D.TEMPLATE_KINDS.map(function (kind, i) {
          var files = state.templateFiles[kind] || [];
          var inputId = "tpl-" + kind.replace(/\s+/g, "-").toLowerCase();

          return el("section.card.tpl", { style: { "--i": i } },
            el("div.tpl__head", {},
              el("h3", {}, kind),
              el("p", {}, "Upload supporting documents")
            ),
            el("label.tpl__drop", { for: inputId },
              icon("upload"),
              el("p", {}, "Click to upload or drag and drop"),
              el("p", {}, "PDF, DOC, DOCX (max 10MB)")
            ),
            el("input", {
              id: inputId, type: "file", multiple: true, accept: ".pdf,.doc,.docx",
              class: "is-hidden",
              onchange: function (e) {
                var added = Array.prototype.map.call(e.target.files, function (f, i) {
                  return { id: kind + "-" + Date.now() + "-" + i, name: f.name, uploadedDate: nowDate() };
                });
                state.templateFiles[kind] = files.concat(added);
                render();
              }
            }),
            files.length ? el("div.tpl__files", {},
              el("p.u-sm", { style: { color: "var(--g700)" } }, "Uploaded Documents (" + files.length + ")"),
              files.map(function (file) {
                return el("div.tpl__file", {},
                  el("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 } },
                    icon("file"),
                    el("div", {},
                      el("p.u-sm", {}, file.name),
                      el("p.u-xs.u-muted", {}, "Uploaded " + file.uploadedDate)
                    )
                  ),
                  el("button.icon-btn", {
                    type: "button", "aria-label": "Remove",
                    onclick: function () {
                      state.templateFiles[kind] = files.filter(function (f) { return f.id !== file.id; });
                      render();
                    }
                  }, icon("x"))
                );
              })
            ) : null
          );
        }))
      )
    );
  }

  /* -------------------------------------------------------------- agent -- */

  function agent() {
    var conversation = state.conversations.filter(function (c) {
      return c.id === state.activeConversation;
    })[0];

    function send() {
      if (!state.draft.trim() && !state.agentFiles.length) return;
      conversation.messages.push({
        id: String(Date.now()), role: "user", content: state.draft, timestamp: new Date()
      });
      conversation.timestamp = new Date();
      state.draft = "";
      state.agentFiles = [];
      render();
      setTimeout(function () {
        conversation.messages.push({
          id: String(Date.now() + 1),
          role: "assistant",
          content: "I've received your message. In a production environment, I would analyze your request and provide detailed legal assistance. Is there anything specific you'd like me to help you with?",
          timestamp: new Date()
        });
        render();
      }, 1000);
    }

    var fileInput = el("input", {
      type: "file", multiple: true, accept: ".pdf,.doc,.docx,.txt", class: "is-hidden",
      onchange: function (e) {
        state.agentFiles = state.agentFiles.concat(
          Array.prototype.map.call(e.target.files, function (f) {
            return { id: String(Date.now() + Math.random()), name: f.name, size: f.size };
          })
        );
        render();
      }
    });

    var prevCount = conversation ? (state.motion.msgCount[conversation.id] || 0) : 0;
    var enterThread = !!(conversation && (frame.enter || state.motion.threadId !== conversation.id));
    if (conversation) {
      state.motion.msgCount[conversation.id] = conversation.messages.length;
      state.motion.threadId = conversation.id;
    }

    return el("div.agent" + (frame.enter ? ".is-enter" : ""), {},
      topbar("AI Agent", "Your intelligent legal assistant", null, true),
      el("div.agent__body", {},
        el("div.conv-pane", {},
          el("div.conv-pane__head", {},
            el("button.btn.btn--magenta.btn--block", {
              type: "button",
              onclick: function () {
                var fresh = {
                  id: String(Date.now()),
                  title: "New Conversation",
                  timestamp: new Date(),
                  messages: [{
                    id: "1", role: "assistant",
                    content: "Hello! I'm your AI legal assistant. How can I help you today?",
                    timestamp: new Date()
                  }]
                };
                state.conversations.unshift(fresh);
                state.activeConversation = fresh.id;
                render();
              }
            }, icon("plus"), "New Conversation")
          ),
          el("div.conv-list", {}, state.conversations.map(function (c, i) {
            return el("div.conv" + (c.id === state.activeConversation ? ".is-active" : ""), {
              style: { "--i": i },
              onclick: function () { state.activeConversation = c.id; render(); }
            },
              el("div", { style: { flex: "1", minWidth: 0 } },
                el("p.conv__title", {}, c.title),
                el("p.conv__time", {}, relativeDay(c.timestamp))
              ),
              c.id === state.activeConversation ? el("button.icon-btn.icon-btn--danger", {
                type: "button", "aria-label": "Delete conversation",
                onclick: function (e) {
                  e.stopPropagation();
                  state.conversations = state.conversations.filter(function (x) { return x.id !== c.id; });
                  if (state.conversations.length) state.activeConversation = state.conversations[0].id;
                  render();
                }
              }, icon("trash")) : null
            );
          }))
        ),

        el("div.thread", {},
          el("div.thread__inner", {},
            el("div.msgs", {}, conversation ? conversation.messages.map(function (m, i) {
              var fresh = enterThread || i >= prevCount;
              return el("div.msg.msg--" + (m.role === "user" ? "user" : "ai") + (fresh ? ".is-enter" : ""), {
                style: { "--i": enterThread ? i : 0 }
              },
                el("div.msg__bubble", {},
                  el("p", {}, m.content),
                  el("p.msg__time", {}, clockTime(m.timestamp))
                )
              );
            }) : null),
            el("div.composer", {},
              state.agentFiles.length ? el("div.attachments", {}, state.agentFiles.map(function (f) {
                return el("div.attachment", {},
                  icon("clip"),
                  el("span.attachment__name", {}, f.name),
                  el("span.attachment__size", {}, fileSize(f.size)),
                  el("button.icon-btn", {
                    type: "button", "aria-label": "Remove attachment",
                    onclick: function () {
                      state.agentFiles = state.agentFiles.filter(function (x) { return x.id !== f.id; });
                      render();
                    }
                  }, icon("x"))
                );
              })) : null,
              el("div.composer__row", {},
                fileInput,
                el("button.btn.btn--outline", {
                  type: "button", "aria-label": "Attach files",
                  onclick: function () { fileInput.click(); }
                }, icon("clip")),
                el("textarea.textarea", {
                  placeholder: "Ask me anything about your legal documents...",
                  value: state.draft,
                  oninput: function (e) { state.draft = e.target.value; },
                  onkeydown: function (e) {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }
                }),
                el("button.btn.btn--plum", { type: "button", onclick: send, "aria-label": "Send" }, icon("send"))
              )
            )
          )
        )
      )
    );
  }

  /* ------------------------------------------------------------- wizard -- */

  function startWizard(options) {
    options = options || {};
    state.wizard = {
      mode: options.mode || "new-contract",
      preset: options.docType || "",
      contractName: options.contractName || "New Contract",
      step: options.docType ? 3 : (options.mode === "new-version" ? 2 : 1),
      first: options.docType ? 3 : (options.mode === "new-version" ? 2 : 1),
      client: "", newClient: "", matter: "", agreement: "",
      docType: options.docType || "",
      clientType: "", otherClientType: "", templateType: "", agreementType: "",
      foundational: [], supporting: [], amendments: []
    };
    render();
  }

  function wizard() {
    var w = state.wizard;
    var close = function () { state.wizard = null; render(); };

    function fileRow(list, key) {
      return list.length ? el("div.filelist", {}, list.map(function (file, i) {
        return el("div.filelist__row", {},
          el("div", {},
            el("p.filelist__name", {}, file.name),
            el("p.filelist__size", {}, (file.size / 1024).toFixed(2) + " KB")
          ),
          el("button.icon-btn.icon-btn--danger", {
            type: "button", "aria-label": "Remove file",
            onclick: function () { w[key].splice(i, 1); render(); }
          }, icon("trash"))
        );
      })) : null;
    }

    function addFiles(key, files) {
      Array.prototype.forEach.call(files, function (f) { w[key].push(f); });
      render();
    }

    function dropzone(id, key, caption, hint) {
      var list = w[key];
      var input = el("input", {
        id: id, type: "file", multiple: true, accept: ".pdf,.doc,.docx", class: "is-hidden",
        onchange: function (e) { addFiles(key, e.target.files); }
      });
      return el("div.field", {},
        el("label", {}, caption),
        el("label.drop" + (list.length ? ".is-filled" : ""), {
          for: id,
          ondragover: function (e) { e.preventDefault(); e.currentTarget.classList.add("is-over"); },
          ondragleave: function (e) { e.currentTarget.classList.remove("is-over"); },
          ondrop: function (e) {
            e.preventDefault();
            e.currentTarget.classList.remove("is-over");
            addFiles(key, e.dataTransfer.files);
          }
        },
          icon("upload"),
          el("div", {}, el("p", {}, "Click to upload or drag and drop"), el("p", {}, "PDF, DOC, or DOCX"))
        ),
        hint ? el("p.u-xs.u-muted", { style: { textAlign: "left" } }, hint) : null,
        el("button.btn.btn--ghost", {
          type: "button",
          style: { alignSelf: "flex-start" },
          onclick: function (e) {
            e.preventDefault();
            w[key].push({ name: "Sample_" + caption.replace(/\s+/g, "_") + ".pdf", size: 48200 });
            render();
          }
        }, "Use sample file"),
        input,
        fileRow(list, key)
      );
    }

    function selectField(label, key, options, placeholder) {
      return el("div.field", {},
        el("label", {}, label),
        el("select.select", {
          onchange: function (e) { w[key] = e.target.value; render(); }
        },
          el("option", { value: "", disabled: true, selected: !w[key] }, placeholder),
          options.map(function (o) {
            return el("option", { value: o, selected: w[key] === o }, o);
          })
        )
      );
    }

    function valid() {
      if (w.step === 1) {
        return w.client !== "" && (w.client !== "Add New Client" || w.newClient.trim() !== "") &&
          w.matter !== "" && w.agreement !== "";
      }
      if (w.step === 2) return w.docType !== "";
      if (w.step === 3) {
        if (w.docType === "Template Creation") {
          return w.clientType !== "" && (w.clientType !== "Other" || w.otherClientType.trim() !== "") && w.templateType !== "";
        }
        if (w.docType === "Bespoke Document") return w.agreementType !== "";
        return w.docType !== "";
      }
      return false;
    }

    function next() {
      if (w.step < 3) { w.step += 1; render(); return; }
      completeWizard(w);
    }

    var stepNumbers = w.preset ? [1] : (w.mode === "new-version" ? [2, 3] : [1, 2, 3]);

    var stage;
    if (w.step === 1) {
      stage = el("div.wizard__pane", {},
        el("h2", {}, "Set up your contract"),
        el("div.wizard__fields", {},
          el("div.field", {},
            el("label", {}, "Client"),
            el("select.select", {
              onchange: function (e) { w.client = e.target.value; render(); }
            },
              el("option", { value: "", disabled: true, selected: !w.client }, "Select a client"),
              D.CLIENTS.map(function (c) { return el("option", { value: c, selected: w.client === c }, c); }),
              el("option", { value: "Add New Client", selected: w.client === "Add New Client" }, "+ Add New Client")
            ),
            w.client === "Add New Client" ? el("input.input.input--lg", {
              type: "text", placeholder: "Enter client name", value: w.newClient,
              oninput: function (e) { w.newClient = e.target.value; }
            }) : null
          ),
          selectField("Matter", "matter", D.MATTERS, "Select a matter"),
          selectField("Agreement", "agreement", D.AGREEMENTS, "Select an agreement")
        )
      );
    } else if (w.step === 2) {
      stage = el("div.wizard__pane.wizard__pane--wide", {},
        el("h2", {}, "What type of analysis would you like?"),
        el("div.wizard__group", {},
          el("h3", {}, "General Documents"),
          el("div.choice-grid", {}, D.ANALYSIS_GENERAL.map(function (label) {
            return el("button.choice" + (w.docType === label ? ".is-selected" : ""), {
              type: "button",
              onclick: function () { w.docType = label; render(); }
            }, label);
          }))
        ),
        el("div.wizard__group", {},
          el("h3", {}, "Other Documents"),
          el("div.choice-grid", {}, D.ANALYSIS_OTHER.map(function (label) {
            return el("button.choice" + (w.docType === label ? ".is-selected" : ""), {
              type: "button",
              onclick: function () { w.docType = label; render(); }
            }, label);
          }))
        )
      );
    } else if (w.docType === "Template Creation") {
      stage = el("div.wizard__pane", {},
        el("h2", {}, "Configure your template"),
        el("div.field", {},
          el("label", {}, "Client Type"),
          el("select.select", { onchange: function (e) { w.clientType = e.target.value; render(); } },
            el("option", { value: "", disabled: true, selected: !w.clientType }, "Choose client type"),
            D.CLIENT_TYPES.map(function (o) { return el("option", { value: o, selected: w.clientType === o }, o); })
          ),
          w.clientType === "Other" ? el("input.input.input--lg", {
            type: "text", placeholder: "Enter client type", value: w.otherClientType,
            oninput: function (e) { w.otherClientType = e.target.value; }
          }) : null
        ),
        el("div.field", {},
          el("label", {}, "Choose template type"),
          el("select.select", { onchange: function (e) { w.templateType = e.target.value; render(); } },
            el("option", { value: "", disabled: true, selected: !w.templateType }, "Select template type"),
            D.TEMPLATE_TYPES.map(function (o) { return el("option", { value: o, selected: w.templateType === o }, o); })
          ),
          w.templateType ? el("div.note", {},
            el("p", {}, "Template Document:"),
            el("p", {}, D.TEMPLATE_DOCS[w.templateType] || "")
          ) : null
        ),
        dropzone("wiz-supporting", "supporting", "Supporting Documents", "Upload Playbook (optional)")
      );
    } else if (w.docType === "Bespoke Document") {
      stage = el("div.wizard__pane", {},
        el("h2", {}, "Configure your bespoke document"),
        el("div.field", {},
          el("label", {}, "Agreement Type"),
          el("select.select", { onchange: function (e) { w.agreementType = e.target.value; render(); } },
            el("option", { value: "", disabled: true, selected: !w.agreementType }, "Choose agreement type"),
            D.AGREEMENT_TYPES.map(function (o) { return el("option", { value: o, selected: w.agreementType === o }, o); })
          )
        ),
        dropzone("wiz-foundational", "foundational", "Foundational Documents"),
        dropzone("wiz-supporting", "supporting", "Supporting Documents")
      );
    } else if (w.docType === "Amendment Consolidation") {
      stage = el("div.wizard__pane", {},
        el("h2", {}, "Upload documents for Amendment Consolidation"),
        dropzone("wiz-amendments", "amendments", "Upload all amendments")
      );
    } else {
      stage = el("div.wizard__pane", {},
        el("h2", {}, (w.mode === "new-version" ? "Upload documents to generate a new " : "Upload documents to generate ") + w.docType),
        dropzone("wiz-foundational", "foundational",
          w.docType === "Issues List" ? "Upload redline"
            : w.docType === "Term Summary" ? "Please attach an executed document."
              : "Foundational Documents",
          w.docType === "Credit Agreement Analysis" ? "Upload the credit agreement document" : "Optional — continue with sample documents if you have no file to upload"),
        w.docType !== "Term Summary" ? dropzone("wiz-supporting", "supporting", "Supporting Documents",
          w.docType === "Issues List"
            ? "Upload any additional reference documents (Playbook), or continue with samples"
            : "Upload any additional reference documents (optional)") : null
      );
    }

    if (frame.wizardStep && stage) stage.classList.add("is-step");

    if (w.busy) {
      return el("div.wizard" + (frame.wizard ? ".is-enter" : ""), {},
        el("div.wizard__busy", {},
          el("div.spinner", { "aria-hidden": "true" }),
          el("h2", {}, "Generating " + (w.docType || "document") + "…"),
          el("p.u-muted", {}, "Using the workspace playbook" +
            (w.foundational.length || w.amendments.length || w.supporting.length
              ? " and uploaded files." : " and sample documents."))
        )
      );
    }

    return el("div.wizard" + (frame.wizard ? ".is-enter" : ""), {},
      el("div.wizard__bar", {},
        el("div.wizard__bar-inner", {},
          el("div", { style: { width: "2rem" } }),
          el("div.steps", {}, stepNumbers.map(function (n, i) {
            return [
              el("div.step" + (n === w.step ? ".is-current" : n < w.step ? ".is-done" : ""), {},
                el("span", {}, w.mode === "new-version" && !w.preset ? i + 1 : n)),
              i < stepNumbers.length - 1 ? el("div.step__line" + (n < w.step ? ".is-done" : ""), {}) : null
            ];
          })),
          el("button.wizard__close", { type: "button", "aria-label": "Close", onclick: close }, icon("x"))
        )
      ),
      el("div.wizard__body", {},
        el("div.wizard__stage", {}, stage),
        el("div.wizard__foot", {},
          w.step === w.first
            ? el("button.btn.btn--outline.btn--lg", { type: "button", onclick: close }, "Close")
            : el("button.btn.btn--outline.btn--lg", {
              type: "button",
              onclick: function () { w.step -= 1; render(); }
            }, icon("arrowLeft"), "Back"),
          el("button.btn.btn--magenta.btn--lg", {
            type: "button",
            disabled: !valid(),
            style: { minWidth: "140px" },
            onclick: next
          },
            w.step === 3 ? (w.docType === "Amendment Consolidation" ? "Amendment Consolidation" : "Complete") : "Next",
            icon("arrowRight"))
        )
      )
    );
  }

  function completeWizard(w) {
    if (w.busy) return;
    w.busy = true;
    render();
    setTimeout(function () {
      if (state.wizard !== w) return;
      finishWizard(w);
    }, 1100);
  }

  function nextVersion(contract, docLabel) {
    var numbers = contract.timeline
      .filter(function (e) { return documentOf(e) === docLabel && e.version; })
      .map(function (e) { return parseInt(String(e.version).replace(/[^0-9]/g, ""), 10) || 0; });
    return "v" + ((numbers.length ? Math.max.apply(null, numbers) : 0) + 1);
  }

  function finishWizard(w) {
    var docLabel = w.docType === "Template Creation" ? w.templateType
      : w.docType === "Bespoke Document" ? w.agreementType
        : w.docType;
    var date = nowDate(), time = nowTime();

    if (w.mode === "new-version" && state.detail) {
      var contract = state.detail.contract;
      var entry = {
        type: "version",
        action: docLabel + " generated",
        version: nextVersion(contract, docLabel),
        date: date, time: time, assignee: D.user.name
      };
      contract.timeline.unshift(entry);
      state.detail.selected = entryKey(entry);
      state.detail.openGroups[docLabel] = true;
      if (docLabel === "Amendment Consolidation") state.detail.subView = "consolidated";
      state.wizard = null;
      toast(docLabel + " generated");
      render();
      return;
    }

    var ids = state.inProgress.concat(state.completed)
      .map(function (c) { return parseInt(c.id.split("-")[2], 10); })
      .filter(function (n) { return !isNaN(n); });
    var id = "M-2026-" + String((ids.length ? Math.max.apply(null, ids) : 0) + 1).padStart(3, "0");
    var clientName = w.client === "Add New Client" ? w.newClient.trim() : w.client;

    var created = {
      id: id,
      clientName: clientName || w.contractName,
      documentType: w.docType,
      templateType: w.templateType,
      agreementType: w.agreementType,
      assignee: D.user.name,
      status: "Drafting",
      startedDate: date,
      startedTime: time,
      timeline: [
        { type: "version", action: docLabel + " generated", version: "v1", date: date, time: time, assignee: D.user.name },
        { type: "started", action: "Contract started", date: date, time: time, assignee: D.user.name }
      ]
    };

    state.inProgress.unshift(created);
    state.wizard = null;
    openDetail(created);
  }

  /* ---------------------------------------------------- contract detail -- */

  /* "Issues List generated" -> "Issues List". Timeline entries of type
     "started" belong to no document. */
  function documentOf(entry) {
    if (entry.type === "started") return null;
    return entry.action.replace(/\s+(generated|approved|revised|signed off and exported)$/, "");
  }

  function entryKey(entry) {
    var base = entry.action.replace(/\s+/g, "-").toLowerCase();
    return entry.version ? base + "-" + entry.version + "-" + entry.type : base + "-started-" + entry.type;
  }

  function groupDocuments(entries) {
    var groups = {};
    entries.forEach(function (entry) {
      var name = documentOf(entry);
      if (!name) return;
      (groups[name] = groups[name] || []).push(entry);
    });
    return groups;
  }

  function openDetail(contract) {
    var first = contract.timeline.filter(function (e) { return documentOf(e); })[0] || contract.timeline[0];
    state.detail = {
      contract: contract,
      name: contract.clientName,
      renaming: false,
      selected: entryKey(first),
      openGroups: {},
      subView: "consolidated",
      issues: clone(D.issuesList),
      messages: [{
        id: "1", role: "assistant",
        content: "Hello! I'm here to help you edit this document. What would you like to change?",
        timestamp: new Date()
      }],
      draft: "",
      dialog: null,
      format: "",
      email: "",
      emailError: "",
      confirmed: false
    };
    state.detail.openGroups[documentOf(first) || ""] = true;
    render();
  }

  function detail() {
    var d = state.detail;
    var contract = d.contract;
    var groups = groupDocuments(contract.timeline);
    var selectedEntry = contract.timeline.filter(function (e) { return entryKey(e) === d.selected; })[0];
    var docName = selectedEntry ? documentOf(selectedEntry) : Object.keys(groups)[0];
    var isLatest = groups[docName] && entryKey(groups[docName][0]) === d.selected;

    function sendAssistant() {
      if (!d.draft.trim()) return;
      d.messages.push({ id: String(Date.now()), role: "user", content: d.draft, timestamp: new Date() });
      d.draft = "";
      render();
      setTimeout(function () {
        d.messages.push({
          id: String(Date.now() + 1), role: "assistant",
          content: "I understand. Let me help you with that change. I'll update the document accordingly.",
          timestamp: new Date()
        });
        render();
      }, 900);
    }

    return el("div.detail" + (frame.detail ? ".is-enter" : ""), {},
      el("div.detail__head", {},
        el("div.detail__left", {},
          el("button.icon-btn", {
            type: "button", "aria-label": "Back",
            onclick: function () { state.detail = null; render(); }
          }, icon("arrowLeft")),
          el("div", {},
            el("div.detail__name", {}, d.renaming
              ? el("input.input", {
                type: "text", value: d.name, autofocus: true,
                oninput: function (e) { d.name = e.target.value; },
                onblur: function () { commitRename(); },
                onkeydown: function (e) { if (e.key === "Enter") commitRename(); }
              })
              : [
                el("h3", {}, d.name),
                el("button.icon-btn", {
                  type: "button", "aria-label": "Rename contract",
                  onclick: function () { d.renaming = true; render(); }
                }, icon("pencil"))
              ]
            ),
            el("p.detail__saved", {}, "Last automatically saved at 1:35pm")
          )
        ),
        el("div.detail__mid", {},
          el("h2", {}, docName || contract.documentType),
          selectedEntry && selectedEntry.version
            ? el("span.badge.badge--outline", {}, selectedEntry.version) : null,
          isLatest ? el("span.badge.badge--magenta", {}, "Latest version") : null
        ),
        el("div.detail__actions", {},
          el("button.btn.btn--plum", {
            type: "button",
            onclick: function () { toast("Document saved"); }
          }, icon("save"), "Save"),
          el("button.btn.btn--magenta", {
            type: "button",
            onclick: function () { d.dialog = "download"; render(); }
          }, icon("download"), "Download")
        )
      ),

      el("div.detail__body", {},
        el("div.doc-rail", {},
          el("div.doc-rail__scroll", {},
            el("button.btn.btn--outline.btn--block", {
              type: "button",
              style: { marginBottom: "1.5rem" },
              onclick: function () {
                startWizard({ mode: "new-version", contractName: d.name });
              }
            }, icon("file"), "Add new document"),

            Object.keys(groups).map(function (name) {
              var entries = groups[name];
              var collapsed = !d.openGroups[name];

              return el("div.doc-group", {},
                el("button.doc-group__head", {
                  type: "button",
                  onclick: function () {
                    d.selected = entryKey(entries[0]);
                    if (name === "Amendment Consolidation") d.subView = "consolidated";
                    d.openGroups[name] = collapsed;
                    render();
                  }
                },
                  el("span", {}, name),
                  el("span.badge.badge--outline", {}, entries.length + (entries.length === 1 ? " version" : " versions"))
                ),
                collapsed ? null : el("div.doc-group__body", {},
                  el("button.btn.btn--outline.doc-group__add", {
                    type: "button",
                    onclick: function (e) {
                      e.stopPropagation();
                      startWizard({ mode: "new-version", contractName: d.name, docType: name });
                    }
                  }, icon("plus"), "Add new " + name),

                  entries.map(function (entry, index) {
                    var key = entryKey(entry);
                    var active = key === d.selected;

                    return el("div.version" + (active ? ".is-active" : ""), {
                      onclick: function () {
                        d.selected = key;
                        if (name === "Amendment Consolidation") d.subView = "consolidated";
                        render();
                      }
                    },
                      el("div.version__head", {},
                        el("span.dot.dot--" + dotType(entry.type), {}),
                        el("p", {}, entry.action)
                      ),
                      el("div.version__meta", {},
                        el("p", {}, entry.date + " at " + entry.time),
                        el("p", {}, entry.assignee)
                      ),
                      el("div.version__tags", {},
                        index === 0 ? el("span.badge.badge--magenta", {}, "Latest") : null,
                        entry.version ? el("span.badge.badge--outline", {}, entry.version) : null
                      ),
                      name === "Amendment Consolidation" && active
                        ? el("div.version__subs", {}, [
                          ["consolidated", "Amended and Restated", true],
                          ["redline-review", "Redline Review"],
                          ["amendment-review", "Amendment Review"],
                          ["amendment-3", "Amendment 3"],
                          ["amendment-2", "Amendment 2"],
                          ["amendment-1", "Amendment 1"]
                        ].map(function (sub) {
                          return el("div.version__sub" + (sub[2] ? ".version__sub--pill" : "") +
                            (d.subView === sub[0] ? ".is-active" : ""), {
                            onclick: function (e) { e.stopPropagation(); d.subView = sub[0]; render(); }
                          }, sub[1]);
                        }))
                        : null
                    );
                  })
                )
              );
            })
          ),
          el("div.doc-rail__foot", {},
            el("button.btn.btn--outline.btn--block", {
              type: "button",
              onclick: function () { d.dialog = "delete"; render(); }
            }, icon("trash"), "Delete Contract")
          )
        ),

        el("div.doc-pane", {}, documentPane(docName, d)),

        el("aside.assistant", {},
          el("div.assistant__head", {},
            el("h4", {}, "AI Document Assistant"),
            el("p", {}, "Ask me to make changes to the document")
          ),
          el("div.assistant__msgs", {}, d.messages.map(function (m) {
            return el("div.msg.msg--" + (m.role === "user" ? "user" : "ai"), {},
              el("div.msg__bubble", {},
                el("p.u-sm", {}, m.content),
                el("p.msg__time", {}, clockTime(m.timestamp))
              )
            );
          })),
          el("div.assistant__foot", {},
            el("div.composer__row", {},
              el("textarea.textarea", {
                placeholder: "Type your request here...",
                value: d.draft,
                oninput: function (e) { d.draft = e.target.value; },
                onkeydown: function (e) {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAssistant(); }
                }
              }),
              el("button.btn.btn--plum", {
                type: "button", "aria-label": "Send", onclick: sendAssistant
              }, icon("send"))
            )
          )
        )
      ),

      d.dialog === "download" ? downloadDialog(d, docName) : null,
      d.dialog === "delete" ? deleteDialog(d) : null
    );
  }

  function commitRename() {
    var d = state.detail;
    d.renaming = false;
    d.contract.clientName = d.name;
    render();
  }

  function downloadDialog(d, docName) {
    var close = function () {
      d.dialog = null; d.format = ""; d.confirmed = false; d.email = ""; d.emailError = "";
      render();
    };

    function confirm() {
      if (d.email.trim().slice(-D.user.domain.length) !== D.user.domain) {
        d.emailError = "Please enter a valid firm email address (" + D.user.domain + ")";
        render();
        return;
      }
      var contract = d.contract;
      // Versions are numbered per document, not across the whole contract.
      var numbers = contract.timeline
        .filter(function (e) { return documentOf(e) === docName && e.version; })
        .map(function (e) { return parseInt(String(e.version).replace(/[^0-9]/g, ""), 10) || 0; });
      var entry = {
        type: "export",
        action: docName + " signed off and exported",
        version: "v" + ((numbers.length ? Math.max.apply(null, numbers) : 0) + 1),
        date: nowDate(), time: nowTime(), assignee: D.user.name
      };
      contract.timeline.unshift(entry);
      d.selected = entryKey(entry);
      close();
      toast("Document successfully downloaded.");
    }

    return el("div.overlay" + (frame.dialog ? ".is-enter" : ""), { onclick: close },
      el("div.dialog", { onclick: function (e) { e.stopPropagation(); } },
        el("h3", {}, "Download " + (docName || "")),
        el("p.dialog__sub", {}, "Please select your preferred file format and confirm your review."),
        el("div.dialog__body", {},
          el("div.field", {},
            el("label", {}, "Select File Type"),
            [["doc", "Doc"], ["pdf", "PDF"], ["excel", "Excel"]].map(function (opt) {
              return el("div.choice-row", {},
                el("input", {
                  type: "radio", name: "dl-format", id: "dl-" + opt[0], value: opt[0],
                  checked: d.format === opt[0],
                  onchange: function () { d.format = opt[0]; render(); }
                }),
                el("label", { for: "dl-" + opt[0] }, opt[1])
              );
            })
          ),
          el("div.field", {},
            el("label", {}, "Email Address"),
            el("input.input" + (d.emailError ? ".input--error" : ""), {
              type: "email",
              placeholder: "example" + D.user.domain,
              value: d.email,
              oninput: function (e) { d.email = e.target.value; if (d.emailError) { d.emailError = ""; } }
            }),
            d.emailError ? el("p.dialog__error", {}, d.emailError) : null,
            el("p.dialog__hint", {}, "Document will be sent to this email address upon download")
          ),
          el("div.confirm-row", {},
            el("input", {
              type: "checkbox", id: "dl-verify", checked: d.confirmed,
              onchange: function (e) { d.confirmed = e.target.checked; render(); }
            }),
            el("label", { for: "dl-verify" },
              "I have manually reviewed the Issues List and approve all edits made by AI")
          )
        ),
        el("div.dialog__foot", {},
          el("button.btn.btn--outline", { type: "button", onclick: close }, "Cancel"),
          el("button.btn.btn--magenta", {
            type: "button",
            disabled: !d.format || !d.confirmed || !d.email,
            onclick: confirm
          }, icon("download"), "Download")
        )
      )
    );
  }

  function deleteDialog(d) {
    var close = function () { d.dialog = null; render(); };
    return el("div.overlay" + (frame.dialog ? ".is-enter" : ""), { onclick: close },
      el("div.dialog", { onclick: function (e) { e.stopPropagation(); } },
        el("h3", {}, "Are you sure you want to delete this contract?"),
        el("p.dialog__sub", {}, "This action cannot be undone. This will permanently delete the contract and all associated data."),
        el("div.dialog__foot", { style: { paddingTop: "1.5rem" } },
          el("button.btn.btn--outline", { type: "button", onclick: close }, "Cancel"),
          el("button.btn.btn--danger", {
            type: "button",
            onclick: function () {
              var id = d.contract.id;
              state.inProgress = state.inProgress.filter(function (c) { return c.id !== id; });
              state.completed = state.completed.filter(function (c) { return c.id !== id; });
              state.detail = null;
              render();
              toast("Contract successfully deleted");
            }
          }, "Delete")
        )
      )
    );
  }

  /* ---------------------------------------------------------- documents -- */

  function documentPane(docName, d) {
    if (docName === "Term Summary") return termSummary();
    if (docName === "Amendment Consolidation") return pdfView(d.subView);
    if (["ISDA Schedule", "MSFTA", "GMRA"].indexOf(docName) !== -1) return isdaSchedule();
    return issuesSheet(d);
  }

  function pdfView(sub) {
    var map = {
      "consolidated": ["Amended and Restated ISDA Schedule", D.PDFS.consolidated],
      "redline-review": ["Redline Review", D.PDFS.redline],
      "amendment-review": ["Amendment Review", D.PDFS.amendmentReview],
      "amendment-1": ["Amendment 1", D.PDFS.amendment1],
      "amendment-2": ["Amendment 2", D.PDFS.amendment2],
      "amendment-3": ["Amendment 3", D.PDFS.amendment3]
    };
    var current = map[sub] || map.consolidated;

    return el("div.pdfview", {},
      el("div.pdfview__bar", {},
        el("span.pdfview__tag", {}, icon("file"), current[0]),
        el("div", { style: { display: "flex", gap: "0.5rem" } },
          el("a.btn.btn--outline", {
            href: current[1], target: "_blank", rel: "noopener"
          }, "Open in new tab"),
          el("a.btn.btn--plum", { href: current[1], download: "" }, icon("download"), "Export")
        )
      ),
      el("iframe.pdfview__frame", { src: current[1], title: current[0] })
    );
  }

  function termSummary() {
    function row(cells, headCell) {
      return el("div.tsum__row" + (headCell ? ".tsum__row--head" : ""), {}, cells);
    }
    function label(html) { return el("div", { html: html }); }

    return el("div.sheet", {},
      el("div", { style: { marginBottom: "2rem" } },
        el("h1", { style: { color: "var(--g500)", marginBottom: "0.5rem" } }, "Northwind Fund II Entities"),
        el("h2", { style: { textAlign: "center", color: "var(--g500)" } }, "ISDA Term Summary")
      ),
      el("div.tsum", {},
        row([label("<p>Client</p>"), el("div.tsum__span", {})], true),
        row([label("<p>ISDA</p><p>Provisions</p>"), el("div.tsum__span", {})], true),
        row([el("div.tsum__num", {}, "1"), label("<p><em>Counterparty</em></p>"), label('<p>Meridian Clearing Bank ("MCB")</p>')]),
        row([el("div.tsum__num", {}, "2"), label("<p><em>Date</em></p>"), label("<p>January 15, 2025</p>")]),
        row([el("div.tsum__num", {}, "3"), label("<p><em>Adviser</em></p>"), label('<p>Harbor Advisers ("Adviser")</p>')]),
        row([label("<p><em>Cross</em></p><p><em>Default</em></p>"), el("div.tsum__span", {})]),
        row([el("div.tsum__num", {}, "4"), label("<p><em>Cross</em></p><p><em>Acceleration</em></p>"), label('<p class="is-blue">Applicable</p>')]),
        row([el("div.tsum__num", {}, "5"), label("<p><em>Adm Error</em></p><p><em>Carve-out</em></p>"), label('<p class="is-blue">Applicable</p>')]),
        row([
          el("div.tsum__num", { style: { alignItems: "flex-start", paddingTop: "1rem" } }, "6"),
          label("<p><em>Threshold</em></p>"),
          el("div", { html:
            '<div class="tsum__stack">' +
            "<p>MCB, 2% of its S/H Equity</p>" +
            "<p>Each Party B Entity, the lesser of (y) 2% of Net Worth or (z) $25,000,000</p>" +
            '<p>Net Worth = <span style="color:var(--g700)">the sum of (y) the difference the Party B Entity\'s total Assets and total </span>' +
            '<span class="is-blue">liabilities</span><span style="color:var(--g700)"> plus (z) Aggregate Available </span>' +
            '<span class="is-orange">Capital Commitments</span><span style="color:var(--g700)"> as of quarter end.</span></p>' +
            "<p>Aggregate Available Capital<br>Commitments = " +
            '<span style="color:var(--g700)">total amount of capital committed by each Partner that is available to be called or recalled under the relevant </span>' +
            '<span class="is-orange">Limited Partnership Agreement</span><span style="color:var(--g700)">.</span></p>' +
            '<p>"Limited Partnership Agreement" = <span style="color:var(--g700)">the </span>' +
            '<span class="is-orange">Limited Partnership Agreement</span><span style="color:var(--g700)"> of the relevant Party B Entity</span></p>' +
            "</div>"
          })
        ])
      )
    );
  }

  function isdaSchedule() {
    return el("div.sheet", {}, el("div", { html:
      '<div style="text-align:center;margin-bottom:2rem">' +
      "<h1>ISDA</h1>" +
      '<p class="u-sm" style="color:var(--g700)">International Swaps and Derivatives Association, Inc.</p>' +
      "</div>" +
      '<div style="text-align:center;margin-bottom:2rem">' +
      "<h2>SCHEDULE</h2>" +
      '<p class="u-sm" style="color:var(--g700)">to the</p>' +
      '<p class="u-sm" style="color:var(--g700);margin-bottom:1rem">2002 Master Agreement</p>' +
      '<p class="u-sm" style="color:var(--g700)">Dated as of January 15, 2025</p>' +
      "</div>" +
      '<div style="margin-bottom:1.5rem">' +
      '<p class="u-sm" style="color:var(--g700);margin-bottom:0.5rem">between</p>' +
      '<p class="u-sm" style="margin-bottom:1rem">Meridian Clearing Bank</p>' +
      '<p class="u-sm" style="color:var(--g700)">("Party A")</p>' +
      "</div>" +
      '<div style="margin-bottom:2rem">' +
      '<p class="u-sm" style="color:var(--g700);margin-bottom:0.5rem">and</p>' +
      '<p class="u-sm" style="margin-bottom:1rem">Northwind Macro Fund LP</p>' +
      '<p class="u-sm" style="color:var(--g700)">("Party B")</p>' +
      "</div>" +
      "<h3 style=\"margin-bottom:1rem\">Part 1. Termination Provisions:</h3>" +
      '<p class="u-sm" style="color:var(--g700);margin-bottom:0.5rem">(a) "<em>Specified Entities</em>" means in relation to Party A for the purpose of:</p>' +
      '<div style="margin-left:1.5rem;margin-bottom:1rem">' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(a)(v): None</p>' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(a)(vi): None</p>' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(a)(vii): None</p>' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(b)(v): None</p>' +
      "</div>" +
      '<p class="u-sm" style="color:var(--g700);margin-bottom:0.5rem">and in relation to Party B for the purpose of:</p>' +
      '<div style="margin-left:1.5rem;margin-bottom:1rem">' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(a)(v): As defined in the Credit Agreement referred to below</p>' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(a)(vi): As defined in the Credit Agreement referred to below</p>' +
      '<p class="u-sm" style="color:var(--g700)">Section 5(a)(vii): As defined in the Credit Agreement referred to below</p>' +
      "</div>" +
      '<p class="u-sm" style="color:var(--g700);margin-bottom:1rem">(b) "<em>Specified Transaction</em>" will have the meaning specified in Section 14 of this Agreement.</p>' +
      '<p class="u-sm" style="color:var(--g700)">(c) The "<em>Cross Default</em>" provisions of Section 5(a)(vi) will apply to Party A and will apply to Party B.</p>'
    }));
  }

  /* <s>…</s> is superseded text, <g>…</g> is its replacement. */
  function markup(text) {
    return escapeHtml(text)
      .replace(/&lt;s&gt;(.*?)&lt;\/s&gt;/g, '<span class="is-struck">$1</span>')
      .replace(/&lt;g&gt;(.*?)&lt;\/g&gt;/g, '<span class="is-added">$1</span>');
  }

  function issuesSheet(d) {
    var headers = ["", "Provisions", "Descriptions", "Issues", "Counsel Comments", "Client Input"];

    return el("div.sheet.sheet--wide", {},
      el("p.sheet__draft", {}, "Firm Draft March 4, 2026"),
      el("h1", {}, "ISDA SCHEDULE - ISSUES LIST"),
      el("p.sheet__intro", { html:
        '<b>Northwind Capital</b> ("Client"), and <b>Meridian Clearing Bank</b> ("Party A"), and sets out the ' +
        'provisions as of the <em>March 1, 2026 draft of the Schedule</em>.'
      }),
      el("div.issues", {},
        el("div.issues__row.issues__row--head", {}, headers.map(function (h) {
          return el("div", {}, el("p", {}, h));
        })),
        d.issues.map(function (row, index) {
          var seen = [];
          for (var i = 0; i <= index; i++) {
            if (seen.indexOf(d.issues[i].provision) === -1) seen.push(d.issues[i].provision);
          }
          var shade = (seen.length - 1) % 2 === 0 ? "#f3f5fb" : "#fff";

          return el("div.issues__row", { style: { backgroundColor: shade } },
            el("div", {}, el("p.issues__cell.issues__num", {}, row.rowNumber + " " + row.version)),
            el("div", {}, el("p.issues__cell", {}, row.provision)),
            el("div", {}, el("p.issues__cell", { html: markup(row.description) })),
            el("div", {}, el("p.issues__cell", {}, row.issue)),
            el("div", {}, el("p.issues__cell", {}, row.clComments)),
            el("div", {}, el("textarea.issues__input", {
              placeholder: "Add client input...",
              value: row.clientInput,
              oninput: function (e) { row.clientInput = e.target.value; }
            }))
          );
        })
      )
    );
  }

  /* --------------------------------------------------------------- boot -- */

  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (state.detail && state.detail.dialog) { state.detail.dialog = null; render(); return; }
    if (state.wizard) { state.wizard = null; render(); return; }
    if (state.detail) { state.detail = null; render(); return; }
    if (state.statModal) { hideTip(); state.statModal = null; render(); }
  });

  (function applyHash() {
    var raw = (location.hash || "").replace(/^#/, "").toLowerCase();
    var map = {
      dashboard: "Dashboard",
      contracts: "Contracts",
      "ai-agent": "AI Agent",
      agent: "AI Agent"
    };
    if (map[raw]) state.view = map[raw];
  })();

  render();
})();
