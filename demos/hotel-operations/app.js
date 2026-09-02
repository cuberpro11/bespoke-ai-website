/* Hotel operations demo — The Marlow rooms-division console.
   Plain browser JS: no framework, no build step. Seed data in data.js. */

(function () {
  "use strict";

  var D = window.HOTEL;
  var I18N = window.HOTEL_I18N;
  var root = document.getElementById("app");
  var toastHost = document.getElementById("toasts");
  var toastTimer = null;
  var focusId = null;
  var focusPos = null;
  var scrollPos = {};
  var lastPage = null;
  var pinThread = false;
  var windowY = 0;
  var LANG_KEY = "hotel-ops-lang";

  function readLang() {
    try {
      var stored = localStorage.getItem(LANG_KEY);
      if (stored === "ar" || stored === "en") return stored;
    } catch (err) {}
    return "en";
  }

  function applyDir(lang) {
    var ar = lang === "ar";
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.documentElement.classList.toggle("is-ar", ar);
    document.title = ar ? "عمليات الفندق — عرض بيسكوك" : "Hotel Operations — Bespoke Demo";
  }

  function setLang(next) {
    state.lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (err) {}
    applyDir(next);
    render();
  }

  function t(key, vars) {
    return I18N.t(state.lang, key, vars);
  }

  function fmtTime(d) {
    return D.fmtTime(d, state.lang);
  }

  function fmtDay(d) {
    return D.fmtDay(d, state.lang);
  }

  function fmtWhen(d, now) {
    return D.fmtWhen(d, now || state.now, state.lang);
  }

  function locLabel(x) {
    return I18N.locLabel(state.lang, x);
  }

  function taskName(x) {
    return I18N.taskName(state.lang, typeof x === "string" ? x : x.name);
  }

  function roleLabel(v) {
    return I18N.role(state.lang, v);
  }

  function messageText(m) {
    if (m && m.i18nKey) {
      var vars = Object.assign({}, m.i18nVars || {});
      if (m.i18nKey === "overdueAlert" || m.i18nKey === "reminderBody") {
        vars.name = taskName(vars.name);
        vars.room = vars.room ? t("inRoom", { room: I18N.room(state.lang, vars.room) }) : "";
        if (vars.due) vars.time = fmtTime(new Date(vars.due));
      }
      return t(m.i18nKey, vars);
    }
    return I18N.messageText(state.lang, m);
  }

  function allOpt(list, translator) {
    return [{ value: "All", label: t("filterAll") }].concat(list.map(function (v) {
      return { value: v, label: translator ? translator(v) : v };
    }));
  }

  var ICONS = {
    home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    tasks: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    template: "M12 5v14M5 12h14",
    msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7"
  };

  var state = {
    page: "overview",
    lang: readLang(),
    now: new Date(D.BASE_NOW.getTime()),
    employees: D.EMPLOYEES,
    tasks: D.TASKS.map(function (x) { return Object.assign({}, x); }),
    templates: D.TEMPLATES.map(function (x) { return Object.assign({}, x); }),
    messages: D.MESSAGES.map(function (x) { return Object.assign({}, x); }),
    selEmp: "e1",
    msgEmp: null,
    taskFilters: {},
    taskQuery: "",
    empQuery: "",
    empDraft: "",
    msgDraft: "",
    msgFilter: "All",
    floorSel: null,
    templateForm: Object.assign({}, D.EMPTY_TEMPLATE),
    templateErr: "",
    modal: null,
    modalForm: null,
    modalErr: "",
    toastMsg: "",
    toastTick: 0,
    motion: {
      boot: true,
      pageKey: null,
      modalOpen: false,
      selEmp: null,
      msgEmp: null,
      floorKey: "",
      toastKey: "",
      msgCount: 0,
      taskCount: 0,
      templateCount: 0,
      filterKey: "",
      msgFilter: "All",
      overdueCount: 0,
      now: 0
    }
  };

  var frame = {
    boot: false, enter: false, modal: false, emp: false, thread: false,
    floor: false, toast: false, freshMsg: false, freshTask: false,
    freshTpl: false, list: false, msgList: false, tick: false, countPop: false,
    freshMsgIds: null, freshTaskId: null, freshTplId: null
  };

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  /* ------------------------------------------------------------ helpers -- */

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

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function icon(n) {
    var svg = svgEl("svg", {
      width: "16", height: "16", viewBox: "0 0 24 24", fill: "none",
      stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round",
      "stroke-linejoin": "round", "aria-hidden": "true"
    });
    svg.appendChild(svgEl("path", { d: ICONS[n] || "" }));
    return svg;
  }

  function findEmp(id) {
    for (var i = 0; i < state.employees.length; i++) {
      if (state.employees[i].id === id) return state.employees[i];
    }
    return null;
  }

  function trackField(e) {
    focusId = e.target.id || null;
    if (e.target.selectionStart != null) focusPos = e.target.selectionStart;
  }

  function bindText(obj, key, id) {
    return {
      id: id,
      value: obj[key],
      oninput: function (e) {
        obj[key] = e.target.value;
        trackField(e);
      }
    };
  }

  function bindTextRender(obj, key, id) {
    return {
      id: id,
      value: obj[key],
      oninput: function (e) {
        obj[key] = e.target.value;
        trackField(e);
        render();
      }
    };
  }

  function selectOf(value, opts, onChange, extra) {
    var props = Object.assign({
      onchange: function (e) { onChange(e.target.value); }
    }, extra || {});
    return el("select", props, opts.map(function (o) {
      var val = typeof o === "object" ? o.value : o;
      var label = typeof o === "object" ? o.label : o;
      return el("option", { value: val, selected: String(value) === String(val) }, label);
    }));
  }

  /* -------------------------------------------------------- small pieces -- */

  function statusPill(s) {
    if (s === "Overdue") {
      return el("span.pill.overdue", {}, el("i", { style: { background: "#fff" } }), I18N.status(state.lang, s));
    }
    return el("span.pill", {}, el("i", { style: { background: D.STATUS_COLOR[s] } }), I18N.status(state.lang, s));
  }

  function priorityPill(p) {
    var bg = p === "Urgent" ? "var(--claret-soft)" : p === "High" ? "var(--brass-soft)" : "var(--line-2)";
    return el("span.pill", { style: { background: bg, color: D.PRIORITY_COLOR[p] } }, I18N.priority(state.lang, p));
  }

  function avatar(e, lg) {
    return el("span" + (lg ? ".avatar.lg" : ".avatar"), {}, e.initials);
  }

  function scoreRing(v) {
    var r = 36;
    var c = 2 * Math.PI * r;
    var col = v >= 85 ? "var(--sage)" : v >= 65 ? "var(--amber)" : "var(--claret)";
    var svg = svgEl("svg", { width: "84", height: "84" });
    svg.appendChild(svgEl("circle", {
      cx: "42", cy: "42", r: String(r), stroke: "var(--line-2)",
      "stroke-width": "7", fill: "none"
    }));
    svg.appendChild(svgEl("circle", {
      cx: "42", cy: "42", r: String(r), stroke: col, "stroke-width": "7", fill: "none",
      "stroke-dasharray": String(c), "stroke-dashoffset": String(c * (1 - v / 100)),
      "stroke-linecap": "round"
    }));
    return el("div.score" + ((frame.enter || frame.emp) ? ".is-draw" : ""), {}, svg, el("b", {}, String(v)));
  }

  function bubble(m, i) {
    var meta = "";
    if (m.from === "ai") meta += t("assistant");
    else if (m.from === "manager") meta += t("you");
    if (m.from !== "employee") meta += " · ";
    if (m.kind !== "message") meta += I18N.kind(state.lang, m.kind) + " · ";
    meta += fmtWhen(m.time, state.now);
    return el("div.msg." + m.from + (frame.freshMsgIds && frame.freshMsgIds[m.id] ? ".is-fresh" : ""), { style: { "--i": i || 0 } }, messageText(m), el("div.meta", {}, meta));
  }

  /* ------------------------------------------------------------ actions -- */

  function toast(message, skipRender) {
    state.toastMsg = message;
    state.toastTick += 1;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      state.toastMsg = "";
      toastTimer = null;
      render();
    }, 2600);
    if (!skipRender) render();
  }

  function go(page, filters) {
    state.page = page;
    if (filters) state.taskFilters = filters;
    render();
  }

  function openEmployee(id) {
    state.selEmp = id;
    state.page = "employees";
    render();
  }

  function openMessages(id) {
    state.msgEmp = id;
    state.page = "messages";
    render();
  }

  function sendMessage(employeeId, text, kind, i18n) {
    var msg = {
      id: "m" + Date.now(),
      employeeId: employeeId,
      from: "manager",
      kind: kind,
      text: text,
      time: state.now
    };
    if (i18n) {
      msg.i18nKey = i18n.key;
      msg.i18nVars = i18n.vars;
    }
    state.messages.push(msg);
    pinThread = true;
    toast(kind === "message" ? t("toastSent") : kind === "alert" ? t("toastAlertSent") : t("toastReminderSent"));
  }

  function setPriority(id, p) {
    state.tasks.forEach(function (x) {
      if (x.id === id) x.priority = p;
    });
    toast(t("toastPriority", { p: I18N.priority(state.lang, p) }));
  }

  function quickAssign(employeeId) {
    var onDuty = state.employees.filter(function (e) { return e.onDuty; });
    var defaultId = typeof employeeId === "string" ? employeeId : onDuty[0].id;
    state.modal = { employeeId: defaultId };
    state.modalErr = "";
    state.modalForm = {
      name: "",
      employeeId: defaultId,
      category: D.CATEGORIES[3],
      floor: "L",
      wing: "North",
      room: "",
      priority: "High",
      start: D.fmtTime(state.now),
      allotted: 20,
      notes: ""
    };
    focusId = "modal-name";
    focusPos = 0;
    render();
  }

  function flagOverdue() {
    var late = state.tasks.filter(function (x) {
      return x.status === "In progress" && x.due < state.now;
    });
    if (!late.length) return;
    late.forEach(function (x) { x.status = "Overdue"; });
    late.forEach(function (x) {
      state.messages.push({
        id: "m" + Date.now() + x.id,
        employeeId: x.employeeId,
        from: "ai",
        kind: "alert",
        time: state.now,
        text: I18N.t("en", "overdueAlert", {
          name: x.name,
          room: x.room ? I18N.t("en", "inRoom", { room: x.room }) : "",
          time: D.fmtTime(x.due, "en")
        }),
        i18nKey: "overdueAlert",
        i18nVars: { name: x.name, room: x.room || "", due: x.due.getTime() }
      });
    });
    var first = findEmp(late[0].employeeId);
    toast(t("toastOverdueAlert", { name: first ? first.name.split(" ")[0] : t("aColleague") }), true);
  }

  /* ---------------------------------------------------------- floor map -- */

  function floorMap() {
    function cellState(f, w) {
      var list = state.tasks.filter(function (x) {
        return x.floor === f && x.wing === w && x.status !== "Completed";
      });
      if (list.some(function (x) { return x.status === "Overdue"; })) return ["late", list.length];
      if (list.some(function (x) { return x.status === "In progress"; })) return ["active", list.length];
      if (list.length) return ["", list.length];
      var done = state.tasks.some(function (x) {
        return x.floor === f && x.wing === w && x.status === "Completed";
      });
      return [done ? "done" : "", 0];
    }

    var cellI = 0;
    var nodes = [el("div")];
    D.WINGS.forEach(function (w) {
      nodes.push(el("div.lbl", { style: { justifyContent: "center" } }, I18N.wing(state.lang, w)));
    });
    D.FLOORS.slice().reverse().forEach(function (f) {
      nodes.push(el("div.lbl", {}, I18N.floorLabel(state.lang, f)));
      D.WINGS.forEach(function (w) {
        var pair = cellState(f, w);
        var st = pair[0];
        var n = pair[1];
        var isSel = state.floorSel && state.floorSel.floor === f && state.floorSel.wing === w;
        var cls = "cell";
        if (st) cls += "." + st;
        if (isSel) cls += ".sel";
        nodes.push(el("button." + cls, {
          type: "button",
          title: t("cellOpen", { floor: I18N.floorLabel(state.lang, f), wing: I18N.wing(state.lang, w), n: n }),
          style: { "--i": cellI++ },
          onclick: function () {
            state.floorSel = isSel ? null : { floor: f, wing: w };
            render();
          }
        }, n > 0 ? el("span", {}, String(n)) : null));
      });
    });
    return el("div.fmap", {}, nodes);
  }

  /* ---------------------------------------------------------- composer -- */

  function composer(emp, draftKey) {
    var next = state.tasks.filter(function (x) {
      return x.employeeId === emp.id && x.status !== "Completed";
    }).sort(function (a, b) { return a.due - b.due; })[0];

    function send() {
      var draft = state[draftKey];
      if (!draft.trim()) return;
      state[draftKey] = "";
      sendMessage(emp.id, draft.trim(), "message");
    }

    return el("div", { style: { borderTop: "1px solid var(--line-2)", padding: "10px 14px" } },
      el("div.row", { style: { gap: "6px", marginBottom: "8px", flexWrap: "wrap" } },
        el("span.small.muted", {}, t("quickSend")),
        next ? el("button.chip", {
          type: "button",
          onclick: function () {
            sendMessage(emp.id, t("reminderBody", {
              name: taskName(next),
              room: next.room ? t("inRoom", { room: I18N.room(state.lang, next.room) }) : "",
              time: fmtTime(next.due)
            }), "reminder", { key: "reminderBody", vars: { name: next.name, room: next.room || "", due: next.due.getTime() } });
          }
        }, t("remindNext")) : null,
        el("button.chip", {
          type: "button",
          onclick: function () {
            sendMessage(emp.id, t("checkInBody"), "message", { key: "checkInBody" });
          }
        }, t("checkIn")),
        el("button.chip", {
          type: "button",
          onclick: function () {
            sendMessage(emp.id, t("urgentBody"), "alert", { key: "urgentBody" });
          }
        }, t("urgentCallIn"))
      ),
      el("div.row", {},
        el("input", Object.assign({
          placeholder: t("phMessage", { name: emp.name.split(" ")[0] })
        }, bindText(state, draftKey, "draft-" + draftKey), {
          onkeydown: function (e) { if (e.key === "Enter") send(); }
        })),
        el("button.primary", { type: "button", onclick: send }, t("send"))
      )
    );
  }

  /* ----------------------------------------------------------- overview -- */

  function overview() {
    var now = state.now;
    var onDuty = state.employees.filter(function (e) { return e.onDuty; });
    var open = state.tasks.filter(function (x) { return x.status !== "Completed" && D.sameDay(x.start, now); });
    var overdue = state.tasks.filter(function (x) { return x.status === "Overdue"; });
    var inProg = state.tasks.filter(function (x) { return x.status === "In progress"; });
    var doneToday = state.tasks.filter(function (x) { return x.status === "Completed" && D.sameDay(x.completedAt, now); });
    var alerts = state.messages.filter(function (m) {
      return m.from === "ai" || m.from === "manager";
    }).sort(function (a, b) { return b.time - a.time; }).slice(0, 6);
    var sel = state.floorSel;
    var selTasks = sel
      ? state.tasks.filter(function (x) {
        return x.floor === sel.floor && x.wing === sel.wing && x.status !== "Completed";
      })
      : [];
    var onTimePct = Math.round(100 * doneToday.filter(function (x) {
      return x.completedAt <= x.due;
    }).length / Math.max(1, doneToday.length));
    var alertsToday = state.messages.filter(function (m) {
      return m.from === "ai" && D.sameDay(m.time, now);
    }).length;

    var stats = [
      { label: t("statOverdue"), value: overdue.length, suffix: "", sub: t("subTasks"), color: overdue.length > 0 ? "var(--claret)" : undefined, fn: function () { go("tasks", { status: "Overdue" }); } },
      { label: t("statInProgress"), value: inProg.length, suffix: "", sub: t("subTasks"), fn: function () { go("tasks", { status: "In progress" }); } },
      { label: t("statCompletedToday"), value: doneToday.length, suffix: "", sub: t("subTasks"), fn: function () { go("tasks", { status: "Completed" }); } },
      { label: t("statOnTimeRate"), value: onTimePct, suffix: "%", sub: t("subToday"), fn: function () { go("employees"); } },
      { label: t("statAlertsSent"), value: alertsToday, suffix: "", sub: t("subAlerts"), fn: function () { go("messages"); } }
    ];

    return [
      el("div.pagehead", {},
        el("div", {},
          el("h1", {}, t("goodAfternoon")),
          el("p", {}, I18N.overviewSub(state.lang, { day: fmtDay(now), onDuty: onDuty.length, open: open.length }))
        ),
        el("div.row", { style: { flexShrink: "0" } },
          el("button", { type: "button", onclick: quickAssign }, t("assignATask")),
          el("button.primary", { type: "button", onclick: function () { go("messages"); } }, t("sendAMessage"))
        )
      ),
      el("div.card.stats", { style: { marginBottom: "16px" } }, stats.map(function (s, i) {
        return el("div.stat", { style: { cursor: "pointer", "--i": i }, onclick: s.fn },
          el("b", {
            style: s.color ? { color: s.color } : undefined,
            "data-count": s.value,
            "data-suffix": s.suffix
          }, String(s.value) + s.suffix),
          el("span", {}, s.label + " ", el("span", { style: { opacity: "0.6" } }, s.sub))
        );
      })),
      el("div.grid.ov-grid", { style: { alignItems: "start" } },
        el("div.card", {},
          el("div.hd", {},
            el("h3", {}, t("propertyGlance")),
            el("span.small.muted", {}, t("openWorkByFloor"))
          ),
          el("div.bd", {},
            floorMap(),
            el("div.row.small.muted", { style: { marginTop: "12px", gap: "14px" } },
              el("span.row", { style: { gap: "5px" } }, el("i.dot", { style: { background: "rgba(220, 38, 38, 0.45)" } }), t("statOverdue")),
              el("span.row", { style: { gap: "5px" } }, el("i.dot", { style: { background: "rgba(36, 84, 216, 0.4)" } }), t("statInProgress")),
              el("span.row", { style: { gap: "5px" } }, el("i.dot", { style: { background: "rgba(18, 138, 112, 0.45)" } }), t("legendAllClear"))
            ),
            sel ? el("div.floor-detail" + (frame.floor ? ".is-swap" : ""), { style: { marginTop: "14px", borderTop: "1px solid var(--line-2)", paddingTop: "12px" } },
              el("div.row", { style: { justifyContent: "space-between" } },
                el("b", {}, locLabel(sel)),
                el("button.linkbtn", { type: "button", onclick: function () { go("tasks", { floor: sel.floor }); } }, t("seeAllOnFloor"))
              ),
              selTasks.length === 0
                ? el("p.small.muted", { style: { margin: "6px 0 0" } }, t("nothingOpenHere"))
                : selTasks.map(function (x) {
                  var emp = findEmp(x.employeeId);
                  return el("div.row", { style: { justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--line-2)" } },
                    el("div", {},
                      el("div", {}, taskName(x), x.room ? el("span.muted", {}, " · " + I18N.room(state.lang, x.room)) : null),
                      el("div.small.muted", {}, (emp ? emp.name : "") + " · " + t("due") + " " + fmtTime(x.due))
                    ),
                    statusPill(x.status)
                  );
                })
            ) : null
          )
        ),
        el("div.grid", { style: { gap: "16px" } },
          el("div.card", {},
            el("div.hd", {},
              el("h3", {}, t("onDutyNow")),
              el("button.linkbtn", { type: "button", onclick: function () { go("employees"); } }, t("allColleagues"))
            ),
            el("div.roster", { "data-scroll": "roster" }, onDuty.map(function (e, i) {
              var s = D.employeeStats(e, state.tasks);
              var current = null;
              for (var ti = 0; ti < s.mine.length; ti++) {
                if (s.mine[ti].status === "In progress" || s.mine[ti].status === "Overdue") {
                  current = s.mine[ti];
                  break;
                }
              }
              var nextLine = current
                ? taskName(current) + (current.room ? ", " + I18N.room(state.lang, current.room) : "") + " · " + t("due") + " " + fmtTime(current.due)
                : t("nextPrefix") + (s.active[0] ? taskName(s.active[0]) + " " + t("at") + " " + fmtTime(s.active[0].start) : t("nothingScheduled"));
              var scoreColor = s.score >= 85 ? "var(--sage)" : s.score >= 65 ? "var(--amber)" : "var(--claret)";
              return el("div.item", { style: { "--i": i }, onclick: function () { openEmployee(e.id); } },
                avatar(e),
                el("div.grow", {},
                  el("div.row", { style: { gap: "8px", flexWrap: "wrap" } },
                    el("b", { style: { fontWeight: "600" } }, e.name),
                    el("span.small.muted", {}, roleLabel(e.role))
                  ),
                  el("div.small.muted", { style: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, nextLine)
                ),
                current ? statusPill(current.status) : null,
                el("span.small", { style: { width: "34px", textAlign: "right", color: scoreColor, fontWeight: "600" } }, String(s.score)),
                el("button.ghost.small", {
                  type: "button",
                  onclick: function (ev) {
                    ev.stopPropagation();
                    openMessages(e.id);
                  }
                }, t("messageBtn"))
              );
            }))
          ),
          el("div.card", {},
            el("div.hd", {},
              el("h3", {}, t("recentAlerts")),
              el("button.linkbtn", { type: "button", onclick: function () { go("messages"); } }, t("messageCenter"))
            ),
            el("div", {}, alerts.map(function (m) {
              var e = findEmp(m.employeeId);
              var pillBg = m.kind === "alert" ? "var(--claret-soft)" : m.kind === "reminder" ? "var(--brass-soft)" : "var(--line-2)";
              return el("div.row", {
                style: { padding: "10px 18px", borderBottom: "1px solid var(--line-2)", alignItems: "flex-start", cursor: "pointer" },
                onclick: function () { openMessages(m.employeeId); }
              },
                el("span.pill", { style: { marginTop: "2px", flexShrink: "0", background: pillBg } },
                  (m.from === "ai" ? t("assistant") : t("you")) + " · " + I18N.kind(state.lang, m.kind)
                ),
                el("div", { style: { flex: "1 1 0", minWidth: "0" } },
                  el("div.small.muted", {}, t("to") + " " + (e ? e.name : "") + " · " + fmtWhen(m.time, now)),
                  el("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, messageText(m))
                )
              );
            }))
          )
        )
      )
    ];
  }

  /* ---------------------------------------------------------- employees -- */

  function employeesPage() {
    var emp = findEmp(state.selEmp) || state.employees[0];
    var s = D.employeeStats(emp, state.tasks);
    var thread = state.messages.filter(function (m) {
      return m.employeeId === emp.id;
    }).sort(function (a, b) { return a.time - b.time; });
    var q = state.empQuery.toLowerCase();
    var list = state.employees.filter(function (e) {
      return e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        roleLabel(e.role).toLowerCase().includes(q);
    });
    var openCount = s.active.length + s.overdue.length;
    var assigned = s.overdue.concat(s.active).sort(function (a, b) { return a.start - b.start; });
    var doneLog = s.done.slice().sort(function (a, b) { return b.completedAt - a.completedAt; });
    var avgLabel = (s.avgDelta > 0 ? "+" : "") + s.avgDelta + " min";

    return [
      el("div.pagehead", {},
        el("div", {},
          el("h1", {}, t("colleaguesTitle")),
          el("p", {}, t("colleaguesSub"))
        )
      ),
      el("div.grid", { style: { gridTemplateColumns: "260px 1fr", alignItems: "start" } },
        el("div.card", {},
          el("div.bd", { style: { paddingBottom: "8px" } },
            el("input", Object.assign({
              placeholder: t("searchNameRole")
            }, bindTextRender(state, "empQuery", "emp-search")))
          ),
          el("div.tlist", { "data-scroll": "emp-list" }, list.map(function (e, i) {
            return el("div.item.row" + (e.id === emp.id ? ".sel" : ""), {
              style: { "--i": i },
              onclick: function () { state.selEmp = e.id; render(); }
            },
              avatar(e),
              el("div", { style: { flex: "1" } },
                el("div", { style: { fontWeight: "500" } }, e.name),
                el("div.small.muted", {}, roleLabel(e.role) + " · " + (e.onDuty ? t("onDuty") : t("offDuty")))
              )
            );
          }))
        ),
        el("div.grid.pane" + (frame.emp ? ".is-swap" : ""), { style: { gap: "16px" } },
          el("div.card", {},
            el("div.bd.row", { style: { gap: "18px" } },
              avatar(emp, true),
              el("div", { style: { flex: "1" } },
                el("h2", {}, emp.name),
                el("div.muted", {}, roleLabel(emp.role) + " · " + t("shift") + " " + emp.shift + " · " + I18N.zone(state.lang, emp)),
                el("div.row", { style: { marginTop: "8px", gap: "8px" } },
                  el("span.pill", {},
                    el("i", { style: { background: emp.onDuty ? "var(--sage)" : "#8A9AA6" } }),
                    emp.onDuty ? t("onDuty") : t("offDuty")
                  ),
                  s.overdue.length > 0
                    ? el("span.pill", { style: { background: "var(--claret-soft)", color: "var(--claret)" } }, t("nOverdue", { n: s.overdue.length }))
                    : null
                )
              ),
              el("div", { style: { textAlign: "center" } },
                scoreRing(s.score),
                el("div.small.muted", { style: { marginTop: "4px" } }, t("overallScore"))
              ),
              el("button", { type: "button", onclick: function () { quickAssign(emp.id); } }, t("assignTask"))
            )
          ),
          el("div.card", { style: { display: "flex" } },
            [
              [String(s.done.length), t("completed7d")],
              [String(Math.round(s.onTimeRate * 100)) + "%", t("onTime")],
              [avgLabel, t("avgVsAllotted")],
              [String(s.active.length), t("assignedNow")]
            ].map(function (pair) {
              return el("div.stat", { style: { flex: "1" } }, el("b", {}, pair[0]), el("span", {}, pair[1]));
            })
          ),
          el("div.grid", { style: { gridTemplateColumns: "1fr 1fr", alignItems: "start" } },
            el("div.card", {},
              el("div.hd", {},
                el("h3", {}, t("assignedTasks")),
                el("span.small.muted", {}, t("nOpen", { n: openCount }))
              ),
              el("table.tbl", {},
                el("tbody", {},
                  assigned.map(function (x) {
                    return el("tr", {},
                      el("td", {},
                        el("div", {}, taskName(x)),
                        el("div.small.muted", {}, locLabel(x))
                      ),
                      el("td.small.muted", { style: { whiteSpace: "nowrap" } }, fmtWhen(x.start, state.now) + "–" + fmtTime(x.due)),
                      el("td", {}, statusPill(x.status))
                    );
                  }),
                  openCount === 0 ? el("tr", {}, el("td.muted", {}, t("nothingAssigned"))) : null
                )
              )
            ),
            el("div.card", {},
              el("div.hd", {}, el("h3", {}, t("completedLog"))),
              el("table.tbl", {},
                el("tbody", {}, doneLog.map(function (x) {
                  var delta = D.minutesBetween(x.due, x.completedAt);
                  var lateLabel = delta > 0 ? t("minLate", { n: delta }) : delta === 0 ? t("onTime") : t("minEarly", { n: -delta });
                  return el("tr", {},
                    el("td", {},
                      el("div", {}, taskName(x)),
                      el("div.small.muted", {}, locLabel(x))
                    ),
                    el("td.small.muted", { style: { whiteSpace: "nowrap" } }, fmtWhen(x.completedAt, state.now)),
                    el("td.small", { style: { color: delta > 0 ? "var(--claret)" : "var(--sage)", whiteSpace: "nowrap" } }, lateLabel)
                  );
                }))
              )
            )
          ),
          el("div.card", { style: { display: "flex", flexDirection: "column", height: "380px" } },
            el("div.hd", {},
              el("h3", {}, t("conversation")),
              el("span.small.muted", {}, t("conversationHint"))
            ),
            el("div.thread", { "data-scroll": "thread" },
              thread.length === 0 ? el("p.muted.small", {}, t("noMessagesYet")) : null,
              thread.map(bubble)
            ),
            composer(emp, "empDraft")
          )
        )
      )
    ];
  }

  /* -------------------------------------------------------------- tasks -- */

  function tasksPage() {
    var f = state.taskFilters;
    var q = state.taskQuery.toLowerCase();
    var list = state.tasks.filter(function (x) {
      if (f.status && f.status !== "All" && x.status !== f.status) return false;
      if (f.role && f.role !== "All" && (findEmp(x.employeeId) || {}).role !== f.role) return false;
      if (f.category && f.category !== "All" && x.category !== f.category) return false;
      if (f.floor && f.floor !== "All" && x.floor !== f.floor) return false;
      if (f.when === "Past" && !(x.status === "Completed" || x.due < state.now)) return false;
      if (f.when === "Current" && !(x.status === "In progress" || x.status === "Overdue" || (x.status === "Scheduled" && D.sameDay(x.start, state.now) && x.start <= state.now))) return false;
      if (f.when === "Upcoming" && !(x.status === "Scheduled" && x.start > state.now)) return false;
      if (q) {
        var empQ = findEmp(x.employeeId);
        var hay = [
          x.name, taskName(x), x.room, I18N.room(state.lang, x.room),
          empQ ? empQ.name : "", empQ ? empQ.role : "", empQ ? roleLabel(empQ.role) : ""
        ].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return a.start - b.start; });

    var when = f.when || "All";
    var hasFilters = !!(f.status || f.role || f.category || f.floor || state.taskQuery || (f.when && f.when !== "All"));

    function setFilter(k, v) {
      var next = Object.assign({}, state.taskFilters);
      next[k] = v;
      state.taskFilters = next;
      render();
    }

    var whenLabels = { All: t("whenAll"), Current: t("whenCurrent"), Upcoming: t("whenUpcoming"), Past: t("whenPast") };

    return [
      el("div.pagehead", {},
        el("div", {},
          el("h1", {}, t("tasksTitle")),
          el("p", {}, t("tasksSub"))
        ),
        el("button.primary", { type: "button", onclick: function () { quickAssign(); } }, t("addOneOff"))
      ),
      el("div.card", {},
        el("div.hd", { style: { flexWrap: "wrap", gap: "8px" } },
          el("div.row", { style: { gap: "6px" } },
            ["All", "Current", "Upcoming", "Past"].map(function (w) {
              return el("button.chip" + (when === w ? ".on" : ""), {
                type: "button",
                onclick: function () { setFilter("when", w); }
              }, whenLabels[w]);
            })
          ),
          el("div.row", { style: { gap: "8px", flexWrap: "wrap" } },
            el("input", Object.assign({
              placeholder: t("searchTask"),
              style: { width: "220px" }
            }, bindTextRender(state, "taskQuery", "task-search"))),
            selectOf(f.status || "All", allOpt(["Scheduled", "In progress", "Overdue", "Completed"], function (v) { return I18N.status(state.lang, v); }), function (v) { setFilter("status", v); }, { style: { width: "auto" }, "aria-label": t("ariaStatus") }),
            selectOf(f.role || "All", allOpt(D.ROLES, function (v) { return roleLabel(v); }), function (v) { setFilter("role", v); }, { style: { width: "auto" }, "aria-label": t("ariaTeam") }),
            selectOf(f.category || "All", allOpt(D.CATEGORIES, function (v) { return I18N.category(state.lang, v); }), function (v) { setFilter("category", v); }, { style: { width: "auto" }, "aria-label": t("ariaCategory") }),
            selectOf(f.floor || "All", allOpt(D.FLOORS, function (v) { return I18N.floorLabel(state.lang, v); }), function (v) { setFilter("floor", v); }, { style: { width: "auto" }, "aria-label": t("ariaFloor") }),
            hasFilters ? el("button.ghost", {
              type: "button",
              onclick: function () {
                state.taskFilters = {};
                state.taskQuery = "";
                render();
              }
            }, t("clear")) : null
          )
        ),
        el("table.tbl" + (frame.list ? ".is-refresh" : ""), {},
          el("thead", {},
            el("tr", {},
              el("th", {}, t("thTask")), el("th", {}, t("thLocation")), el("th", {}, t("thAssignedTo")),
              el("th", {}, t("thWindow")), el("th", {}, t("thStatus")), el("th", {}, t("thPriority"))
            )
          ),
          el("tbody", {},
            list.map(function (x, i) {
              var e = findEmp(x.employeeId);
              var locked = x.status === "Completed";
              var rowCls = (x.status === "Overdue" ? ".late" : "") + (frame.freshTask && x.id === frame.freshTaskId ? ".is-fresh" : "");
              return el("tr" + rowCls, { style: { "--i": i } },
                el("td", {},
                  el("div", { style: { fontWeight: "500" } }, taskName(x)),
                  el("div.small.muted", {}, I18N.category(state.lang, x.category) + (x.source ? "" : " · " + t("oneOff")))
                ),
                el("td.small", {}, locLabel(x)),
                el("td", {},
                  el("button.linkbtn", { type: "button", onclick: function () { openEmployee(e.id); } }, e ? e.name : ""),
                  el("div.small.muted", {}, e ? roleLabel(e.role) : "")
                ),
                el("td.small.muted", { style: { whiteSpace: "nowrap" } },
                  fmtWhen(x.start, state.now) + " – " + fmtTime(x.due),
                  x.completedAt ? el("div", {}, t("done") + " " + fmtTime(x.completedAt)) : null
                ),
                el("td", {}, statusPill(x.status)),
                el("td", {},
                  locked
                    ? priorityPill(x.priority)
                    : selectOf(x.priority, D.PRIORITIES.map(function (p) {
                      return { value: p, label: I18N.priority(state.lang, p) };
                    }), function (v) { setPriority(x.id, v); }, {
                      style: { width: "96px", color: D.PRIORITY_COLOR[x.priority], fontWeight: "500" }
                    })
                )
              );
            }),
            list.length === 0
              ? el("tr", {}, el("td.muted", { colSpan: 6, style: { padding: "28px", textAlign: "center" } }, t("noTasksMatch")))
              : null
          )
        )
      )
    ];
  }

  /* ---------------------------------------------------------- templates -- */

  function templatesPage() {
    var form = state.templateForm;

    function setForm(k, v) {
      form[k] = v;
    }

    function save() {
      if (!form.name.trim()) {
        state.templateErr = "errTaskName";
        render();
        return;
      }
      if (!form.allotted || Number(form.allotted) <= 0) {
        state.templateErr = "errAllotted";
        render();
        return;
      }
      state.templates.unshift(Object.assign({}, form, {
        id: "tp" + Date.now(),
        allotted: Number(form.allotted),
        escalation: Number(form.escalation)
      }));
      state.templateForm = Object.assign({}, D.EMPTY_TEMPLATE);
      state.templateErr = "";
      toast(t("toastTypeSaved"));
    }

    var floorOpts = [{ value: "Any", label: t("any") }].concat(D.FLOORS.map(function (c) {
      return { value: c, label: I18N.floorLabel(state.lang, c) };
    }));
    var wingOpts = [{ value: "Any", label: t("any") }].concat(D.WINGS.map(function (w) {
      return { value: w, label: I18N.wing(state.lang, w) };
    }));

    return [
      el("div.pagehead", {},
        el("div", {},
          el("h1", {}, t("taskTypesTitle")),
          el("p", {}, t("taskTypesSub"))
        )
      ),
      el("div.grid", { style: { gridTemplateColumns: "1fr 1fr", alignItems: "start" } },
        el("div.card", {},
          el("div.hd", {}, el("h3", {}, t("newTaskType"))),
          el("div.bd", {},
            el("div.fgroup", {},
              el("label", {}, t("taskName")),
              el("input", Object.assign({ placeholder: t("phEveningTurndown") }, bindText(form, "name", "tp-name")))
            ),
            el("div.fgroup", {},
              el("label", {}, t("descAndStandard")),
              el("textarea", Object.assign({
                placeholder: t("phDescription")
              }, bindText(form, "description", "tp-desc")))
            ),
            el("div.field2.fgroup", {},
              el("div", {},
                el("label", {}, t("category")),
                selectOf(form.category, D.CATEGORIES.map(function (c) {
                  return { value: c, label: I18N.category(state.lang, c) };
                }), function (v) { setForm("category", v); })
              ),
              el("div", {},
                el("label", {}, t("assignedToTeam")),
                selectOf(form.role, D.ROLES.map(function (r) {
                  return { value: r, label: roleLabel(r) };
                }), function (v) { setForm("role", v); })
              )
            ),
            el("div.field3.fgroup", {},
              el("div", {},
                el("label", {}, t("floor")),
                selectOf(form.floor, floorOpts, function (v) { setForm("floor", v); })
              ),
              el("div", {},
                el("label", {}, t("wing")),
                selectOf(form.wing, wingOpts, function (v) { setForm("wing", v); })
              ),
              el("div", {},
                el("label", {}, t("roomOrArea")),
                el("input", Object.assign({ placeholder: t("optional") }, bindText(form, "room", "tp-room")))
              )
            ),
            el("div.field3.fgroup", {},
              el("div", {},
                el("label", {}, t("allottedMin")),
                el("input", Object.assign({ type: "number", min: "1" }, bindText(form, "allotted", "tp-allotted")))
              ),
              el("div", {},
                el("label", {}, t("escalateAfter")),
                el("input", Object.assign({ type: "number", min: "0" }, bindText(form, "escalation", "tp-esc")))
              ),
              el("div", {},
                el("label", {}, t("defaultPriority")),
                selectOf(form.priority, D.PRIORITIES.map(function (p) {
                  return { value: p, label: I18N.priority(state.lang, p) };
                }), function (v) { setForm("priority", v); })
              )
            ),
            el("div.field2.fgroup", {},
              el("div", {},
                el("label", {}, t("schedule")),
                el("input", Object.assign({ placeholder: t("phSchedule") }, bindText(form, "recurrence", "tp-rec")))
              ),
              el("div", {},
                el("label", {}, t("verifiedBy")),
                el("input", Object.assign({ placeholder: t("phVerified") }, bindText(form, "verification", "tp-ver")))
              )
            ),
            state.templateErr ? el("p", { style: { color: "var(--claret)", margin: "0 0 10px" } }, t(state.templateErr)) : null,
            el("div.row", { style: { justifyContent: "flex-end", gap: "8px" } },
              el("button", {
                type: "button",
                onclick: function () {
                  state.templateForm = Object.assign({}, D.EMPTY_TEMPLATE);
                  state.templateErr = "";
                  render();
                }
              }, t("reset")),
              el("button.primary", { type: "button", onclick: save }, t("saveTaskType"))
            )
          )
        ),
        el("div.card", {},
          el("div.hd", {},
            el("h3", {}, t("existingTypes")),
            el("span.small.muted", {}, t("nDefined", { n: state.templates.length }))
          ),
          el("div", {}, state.templates.map(function (tp) {
            var meta = t("tplMeta", {
              allotted: tp.allotted,
              esc: tp.escalation,
              recurrence: I18N.recurrence(state.lang, tp.recurrence)
            });
            if (tp.verification) meta += " · " + t("verifiedByMeta", { v: I18N.verification(state.lang, tp.verification) });
            return el("div.tpl-item" + (frame.freshTpl && tp.id === frame.freshTplId ? ".is-fresh" : ""), { style: { padding: "12px 18px", borderBottom: "1px solid var(--line-2)" } },
              el("div.row", { style: { justifyContent: "space-between" } },
                el("b", { style: { fontWeight: "600" } }, taskName(tp.name)),
                priorityPill(tp.priority)
              ),
              el("div.small.muted", {}, roleLabel(tp.role) + " · " + I18N.category(state.lang, tp.category) + " · " + locLabel(tp)),
              el("div.small", { style: { marginTop: "4px" } }, I18N.description(state.lang, tp.id, tp.description)),
              el("div.small.muted", { style: { marginTop: "4px" } }, meta)
            );
          }))
        )
      )
    ];
  }

  /* ----------------------------------------------------------- messages -- */

  function messagesPage() {
    var threads = state.employees.map(function (e) {
      var ms = state.messages.filter(function (m) { return m.employeeId === e.id; })
        .sort(function (a, b) { return b.time - a.time; });
      return { e: e, last: ms[0], alerts: ms.filter(function (m) { return m.from === "ai" && m.kind === "alert"; }).length };
    }).filter(function (x) { return x.last; })
      .sort(function (a, b) { return b.last.time - a.last.time; });

    var shown = threads.filter(function (x) {
      if (state.msgFilter === "All") return true;
      if (state.msgFilter === "Alerts") return x.last.from === "ai";
      return x.last.from === "employee";
    });

    var emp = findEmp(state.msgEmp) || (shown[0] && shown[0].e) || state.employees[0];
    if (!state.msgEmp && emp) state.msgEmp = emp.id;
    var thread = state.messages.filter(function (m) {
      return m.employeeId === emp.id;
    }).sort(function (a, b) { return a.time - b.time; });

    return [
      el("div.pagehead", {},
        el("div", {},
          el("h1", {}, t("messagesTitle")),
          el("p", {}, t("messagesSub"))
        )
      ),
      el("div.grid", { style: { gridTemplateColumns: "300px 1fr", height: "calc(100vh - 190px)", minHeight: "480px" } },
        el("div.card", { style: { display: "flex", flexDirection: "column", overflow: "hidden" } },
          el("div.hd", { style: { gap: "6px" } },
            [
              ["All", t("whenAll")],
              ["Alerts", t("filterAlerts")],
              ["Replies", t("filterReplies")]
            ].map(function (pair) {
              return el("button.chip" + (state.msgFilter === pair[0] ? ".on" : ""), {
                type: "button",
                onclick: function () { state.msgFilter = pair[0]; render(); }
              }, pair[1]);
            })
          ),
          el("div.tlist" + (frame.msgList ? ".is-refresh" : ""), { "data-scroll": "msg-list", style: { overflow: "auto" } },
            shown.map(function (row, i) {
              var last = row.last;
              var prefix = last.from === "ai" ? t("prefixAssistant") : last.from === "manager" ? t("prefixYou") : "";
              return el("div.item.row" + (row.e.id === emp.id ? ".sel" : ""), {
                style: { alignItems: "flex-start", "--i": i },
                onclick: function () { state.msgEmp = row.e.id; render(); }
              },
                avatar(row.e),
                el("div", { style: { flex: "1", minWidth: "0" } },
                  el("div.row", { style: { justifyContent: "space-between" } },
                    el("span", { style: { fontWeight: "500" } }, row.e.name),
                    el("span.small.muted", {}, fmtWhen(last.time, state.now))
                  ),
                  el("div.small", { style: { color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, prefix + messageText(last)),
                  row.alerts > 0
                    ? el("span.pill.small", { style: { marginTop: "4px", background: "var(--claret-soft)", color: "var(--claret)" } },
                      I18N.alertsCount(state.lang, row.alerts))
                    : null
                )
              );
            }),
            shown.length === 0 ? el("p.muted.small", { style: { padding: "16px" } }, t("noConversations")) : null
          )
        ),
        el("div.card.pane" + (frame.thread ? ".is-swap" : ""), { style: { display: "flex", flexDirection: "column", overflow: "hidden" } },
          el("div.hd", {},
            el("div.row", {},
              avatar(emp),
              el("div", {},
                el("b", { style: { fontWeight: "600" } }, emp.name),
                el("div.small.muted", {}, roleLabel(emp.role) + " · " + (emp.onDuty ? t("onDuty") : t("offDuty")) + " · " + I18N.zone(state.lang, emp))
              )
            )
          ),
          el("div.thread", { "data-scroll": "thread" },
            thread.map(bubble)
          ),
          composer(emp, "msgDraft")
        )
      )
    ];
  }

  /* -------------------------------------------------------------- modal -- */

  function newTaskModal() {
    var f = state.modalForm;
    var floorOpts = D.FLOORS.map(function (c) {
      return { value: c, label: I18N.floorLabel(state.lang, c) };
    });
    var empOpts = state.employees.map(function (e) {
      return { value: e.id, label: e.name + " · " + roleLabel(e.role) + (e.onDuty ? "" : " " + t("offDutyParen")) };
    });

    function save() {
      if (!f.name.trim()) {
        state.modalErr = "errModalName";
        render();
        return;
      }
      var parts = String(f.start).split(":").map(Number);
      var h = parts[0];
      var m = parts[1];
      if (Number.isNaN(h)) {
        state.modalErr = "errStartTime";
        render();
        return;
      }
      var start = new Date(state.now);
      start.setHours(h, m, 0, 0);
      var due = new Date(start.getTime() + Number(f.allotted) * 60000);
      var tsk = {
        id: "t" + Date.now(),
        name: f.name.trim(),
        category: f.category,
        employeeId: f.employeeId,
        floor: f.floor,
        wing: f.wing,
        room: f.room,
        priority: f.priority,
        start: start,
        due: due,
        completedAt: null,
        status: start <= state.now ? "In progress" : "Scheduled",
        source: null,
        notes: f.notes
      };
      state.tasks.push(tsk);
      state.modal = null;
      state.modalForm = null;
      var emp = findEmp(tsk.employeeId);
      toast(t("toastAssignedTo", { name: emp ? emp.name : t("aColleague") }));
    }

    function close() {
      state.modal = null;
      state.modalForm = null;
      state.modalErr = "";
      render();
    }

    return el("div.modalbg" + (frame.modal ? ".is-enter" : ""), { onclick: close },
      el("div.modal", {
        onclick: function (e) { e.stopPropagation(); },
        role: "dialog",
        "aria-label": t("addOneOff")
      },
        el("div.hd", {},
          el("h2", {}, t("modalTitle")),
          el("div.small.muted", {}, t("modalSub"))
        ),
        el("div.bd", {},
          el("div.fgroup", {},
            el("label", {}, t("labelTask")),
            el("input", Object.assign({
              placeholder: t("phDeliverPillows")
            }, bindText(f, "name", "modal-name")))
          ),
          el("div.field2.fgroup", {},
            el("div", {},
              el("label", {}, t("assignTo")),
              selectOf(f.employeeId, empOpts, function (v) { f.employeeId = v; })
            ),
            el("div", {},
              el("label", {}, t("category")),
              selectOf(f.category, D.CATEGORIES.map(function (c) {
                return { value: c, label: I18N.category(state.lang, c) };
              }), function (v) { f.category = v; })
            )
          ),
          el("div.field3.fgroup", {},
            el("div", {},
              el("label", {}, t("floor")),
              selectOf(f.floor, floorOpts, function (v) { f.floor = v; })
            ),
            el("div", {},
              el("label", {}, t("wing")),
              selectOf(f.wing, D.WINGS.map(function (w) {
                return { value: w, label: I18N.wing(state.lang, w) };
              }), function (v) { f.wing = v; })
            ),
            el("div", {},
              el("label", {}, t("roomOrArea")),
              el("input", Object.assign({ placeholder: "1108" }, bindText(f, "room", "modal-room")))
            )
          ),
          el("div.field3.fgroup", {},
            el("div", {},
              el("label", {}, t("startToday")),
              el("input", Object.assign({ placeholder: "14:30" }, bindText(f, "start", "modal-start")))
            ),
            el("div", {},
              el("label", {}, t("allottedMin")),
              el("input", Object.assign({ type: "number", min: "1" }, bindText(f, "allotted", "modal-allotted")))
            ),
            el("div", {},
              el("label", {}, t("priority")),
              selectOf(f.priority, D.PRIORITIES.map(function (p) {
                return { value: p, label: I18N.priority(state.lang, p) };
              }), function (v) { f.priority = v; })
            )
          ),
          el("div.fgroup", {},
            el("label", {}, t("notesForColleague")),
            el("textarea", Object.assign({
              placeholder: t("phNotes")
            }, bindText(f, "notes", "modal-notes")))
          ),
          state.modalErr ? el("p", { style: { color: "var(--claret)", margin: "0" } }, t(state.modalErr)) : null
        ),
        el("div.ft", {},
          el("button", { type: "button", onclick: close }, t("cancel")),
          el("button.primary", { type: "button", onclick: save }, t("assignTask"))
        )
      )
    );
  }

  /* --------------------------------------------------------------- app -- */

  function screen() {
    if (state.page === "overview") return overview();
    if (state.page === "employees") return employeesPage();
    if (state.page === "tasks") return tasksPage();
    if (state.page === "templates") return templatesPage();
    if (state.page === "messages") return messagesPage();
    return el("div");
  }

  function render() {
    var motion = state.motion;
    var overdueCount = state.tasks.filter(function (x) { return x.status === "Overdue"; }).length;
    var floorKey = state.floorSel ? state.floorSel.floor + "-" + state.floorSel.wing : "";
    var tf = state.taskFilters;
    var filterKey = [tf.when || "", tf.status || "", tf.role || "", tf.category || "", tf.floor || ""].join("|");
    var nowTs = state.now.getTime();

    frame.boot = motion.boot;
    frame.enter = motion.pageKey !== state.page;
    frame.modal = !!state.modal && !motion.modalOpen;
    frame.emp = !frame.enter && state.page === "employees" && motion.selEmp != null && motion.selEmp !== state.selEmp;
    frame.thread = !frame.enter && state.page === "messages" && !!state.msgEmp && motion.msgEmp !== state.msgEmp;
    frame.floor = !frame.enter && !!floorKey && floorKey !== motion.floorKey;
    frame.toast = !!state.toastMsg && motion.toastKey !== state.toastTick;
    frame.freshMsg = !frame.boot && state.messages.length > motion.msgCount;
    frame.freshMsgIds = {};
    if (frame.freshMsg) {
      for (var mi = motion.msgCount; mi < state.messages.length; mi++) {
        frame.freshMsgIds[state.messages[mi].id] = true;
      }
    }
    frame.freshTask = !frame.boot && state.tasks.length > motion.taskCount;
    frame.freshTaskId = frame.freshTask ? state.tasks[state.tasks.length - 1].id : null;
    frame.freshTpl = !frame.boot && state.templates.length > motion.templateCount;
    frame.freshTplId = frame.freshTpl ? state.templates[0].id : null;
    frame.list = !frame.enter && state.page === "tasks" && motion.filterKey !== "" && motion.filterKey !== filterKey;
    frame.msgList = !frame.enter && state.page === "messages" && motion.msgFilter !== state.msgFilter;
    frame.tick = !frame.boot && nowTs !== motion.now;
    frame.countPop = !frame.boot && overdueCount > motion.overdueCount;

    var NAV = [
      ["overview", t("navOverview"), "home"],
      ["employees", t("navColleagues"), "people"],
      ["tasks", t("navTasks"), "tasks", overdueCount],
      ["templates", t("navTaskTypes"), "template"],
      ["messages", t("navMessages"), "msg"]
    ];

    var tree = el("div.hx", {},
      el("aside.side" + (frame.boot ? ".is-boot" : ""), {},
        el("a.side__back", { href: "../../demos.html" },
          icon("arrowLeft"),
          el("span", {}, t("backDemos"))
        ),
        el("div.brand", {},
          el("h1", {}, t("brandName")),
          el("span", {}, t("brandSub"))
        ),
        el("nav", { style: { paddingTop: "10px", flex: "1" } }, NAV.map(function (item, i) {
          var id = item[0];
          var label = item[1];
          var ico = item[2];
          var count = item[3];
          return el("button.navbtn" + (state.page === id ? ".active" : ""), {
            type: "button",
            style: { "--i": i },
            onclick: function () { state.page = id; render(); }
          },
            icon(ico),
            el("span.t", {}, label),
            count > 0 ? el("span.count" + (frame.countPop ? ".is-pop" : ""), {}, String(count)) : null
          );
        })),
        el("div.foot", { style: { padding: "16px 20px", fontSize: "12.5px", color: "var(--muted)", borderTop: "1px solid var(--line)" } },
          t("footer")
        )
      ),
      el("div.main", {},
        el("header.topbar", {},
          el("span.clock.ltr" + (frame.tick ? ".is-tick" : ""), { dir: "ltr" }, fmtTime(state.now)),
          el("span.small.muted", {}, fmtDay(state.now)),
          el("span.pill", {}, el("i", { style: { background: "var(--sage)" } }), t("camerasOnline")),
          el("span.small.muted", {}, t("occupancy")),
          el("div.lang-toggle", {
            role: "group",
            "aria-label": t("langToggleAria")
          },
            el("button" + (state.lang === "en" ? ".on" : ""), {
              type: "button",
              onclick: function () { if (state.lang !== "en") setLang("en"); }
            }, "EN"),
            el("button" + (state.lang === "ar" ? ".on" : ""), {
              type: "button",
              onclick: function () { if (state.lang !== "ar") setLang("ar"); }
            }, "عربي")
          ),
          el("div.user", {},
            el("div.ua", {}, "E"),
            el("div", {},
              el("b", {}, "Elena Marsh"),
              el("span.ltr", { dir: "ltr" }, "elena.marsh@themarlow.example")
            )
          )
        ),
        el("div.content" + (frame.enter ? ".is-enter" : ""), { "data-scroll": "main" }, screen())
      ),
      state.modal ? newTaskModal() : null
    );

    var samePage = lastPage === state.page;
    lastPage = state.page;
    saveScroll();
    clear(root).appendChild(tree);

    clear(toastHost);
    if (state.toastMsg) toastHost.appendChild(el("div.toast" + (frame.toast ? ".is-enter" : ""), {}, state.toastMsg));

    if (focusId) {
      var node = document.getElementById(focusId);
      if (node && typeof node.focus === "function") {
        try { node.focus({ preventScroll: true }); } catch (err) { node.focus(); }
        if (typeof focusPos === "number" && node.setSelectionRange) {
          try { node.setSelectionRange(focusPos, focusPos); } catch (err) {}
        }
      }
    }

    restoreScroll(samePage);
    if (frame.enter && state.page === "overview") runCountUps();

    state.motion.boot = false;
    state.motion.pageKey = state.page;
    state.motion.modalOpen = !!state.modal;
    state.motion.selEmp = state.selEmp;
    state.motion.msgEmp = state.msgEmp;
    state.motion.floorKey = floorKey;
    state.motion.toastKey = state.toastTick;
    state.motion.msgCount = state.messages.length;
    state.motion.taskCount = state.tasks.length;
    state.motion.templateCount = state.templates.length;
    state.motion.filterKey = filterKey;
    state.motion.msgFilter = state.msgFilter;
    state.motion.overdueCount = overdueCount;
    state.motion.now = nowTs;
  }

  function saveScroll() {
    windowY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var next = {};
    var nodes = root.querySelectorAll("[data-scroll]");
    for (var i = 0; i < nodes.length; i++) {
      next[nodes[i].getAttribute("data-scroll")] = nodes[i].scrollTop;
    }
    scrollPos = next;
  }

  function restoreScroll(samePage) {
    function apply() {
      if (samePage) window.scrollTo(0, windowY);
      var nodes = root.querySelectorAll("[data-scroll]");
      for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].getAttribute("data-scroll");
        if (key === "thread" && pinThread) {
          nodes[i].scrollTop = nodes[i].scrollHeight;
          continue;
        }
        if (samePage && scrollPos[key] != null) nodes[i].scrollTop = scrollPos[key];
      }
    }
    apply();
    requestAnimationFrame(function () {
      apply();
      pinThread = false;
    });
  }

  setInterval(function () {
    state.now = new Date(state.now.getTime() + 60000);
    flagOverdue();
    render();
  }, 8000);

  applyDir(state.lang);
  render();
})();
