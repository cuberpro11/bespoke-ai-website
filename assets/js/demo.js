/* ==========================================================================
   OTC HEDGE — scripted product demonstration
   A deterministic, seekable timeline that plays like a screen recording:
   ingest → organize → ask → trace citation → draft → deliver.
   Pauses offscreen, pausable by the user, static poster under reduced motion.
   ========================================================================== */
(() => {
  "use strict";

  const stage = document.getElementById("demo-stage");
  if (!stage) return;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE = window.matchMedia("(max-width: 860px)").matches;
  const COARSE = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const HIDE_CURSOR = MOBILE || COARSE;
  if (HIDE_CURSOR && el.cursor) el.cursor.style.display = "none";
  const PLAYBACK_RATE = 1.2;
  const realMs = (ms) => ms / PLAYBACK_RATE;
  const $ = (key) => stage.querySelector(`[data-el="${key}"]`);
  const el = {
    sideDocs: $("side-docs"), sideChat: $("side-chat"), sideDraft: $("side-draft"),
    badgeDocs: $("badge-docs"), badgeDraft: $("badge-draft"),
    docsStatus: $("docs-status"), dropzone: $("dropzone"),
    folderGrid: $("folder-grid"), fileLayer: $("file-layer"),
    chatStatus: $("chat-status"), chatScroll: $("chat-scroll"),
    msgUser: $("msg-user"), msgAi: $("msg-ai"),
    aiStep: $("ai-step"), aiText: $("ai-text"), chipRow: $("chip-row"), chipDraft: $("chip-draft"),
    composer: $("composer"), composerText: $("composer-text"), composerPh: $("composer-ph"),
    sendBtn: $("send-btn"),
    src: [null, $("src-1"), $("src-2"), $("src-3")],
    viewer: $("viewer"), docLines: $("doc-lines"), docClause: $("doc-clause"), citeFlag: $("cite-flag"),
    draftStatus: $("draft-status"), draftTitle: $("draft-title"), draftMeta: $("draft-meta"),
    draftH1: $("draft-h1"), draftP1: $("draft-p1"), draftH2: $("draft-h2"), draftP2: $("draft-p2"),
    draftSkel: $("draft-skel"), draftCheckTitle: $("draft-check-title"),
    checks: [$("check-1"), $("check-2"), $("check-3")],
    exportBtn: $("export-btn"), toast: $("toast"), cursor: $("cursor"),
  };
  const scenes = {
    docs: stage.querySelector('[data-scene="docs"]'),
    chat: stage.querySelector('[data-scene="chat"]'),
    draft: stage.querySelector('[data-scene="draft"]'),
  };
  const deck = document.querySelector(".demo-deck");
  const chapterBtns = [...document.querySelectorAll(".chapter")];
  const toggleBtn = document.querySelector('[data-el="demo-toggle"]');

  /* ------------------------------------------------------------- content -- */

  const FILES = [
    { name: "ISDA Master — Meridian.pdf",   kind: "PDF",  sub: "2002 form · NY law",        folder: "trading", sx: 6,  sy: 6 },
    { name: "CSA Amendment (2024).pdf",     kind: "PDF",  sub: "Margin terms · executed",   folder: "trading", sx: 46, sy: 14 },
    { name: "GMSLA — Meridian Sec.pdf",     kind: "PDF",  sub: "Securities lending",        folder: "trading", sx: 22, sy: 34 },
    { name: "Fund II LPA.docx",             kind: "DOCX", sub: "Delaware LP · 148 pp",      folder: "funds",   sx: 62, sy: 40 },
    { name: "Side Letter — Anchor LP.pdf",  kind: "PDF",  sub: "MFN · fee terms",           folder: "funds",   sx: 10, sy: 62 },
    { name: "Credit Agreement — B.pdf",     kind: "PDF",  sub: "Facility B · secured",      folder: "credit",  sx: 52, sy: 66 },
    { name: "Guarantee & Security.pdf",     kind: "PDF",  sub: "Cross-lien schedule",       folder: "credit",  sx: 30, sy: 84 },
    { name: "Board Minutes — Q3.docx",      kind: "DOCX", sub: "Governance record",         folder: "gov",     sx: 66, sy: 88 },
  ];

  const FOLDERS = [
    { key: "trading", label: "Trading Documentation", tags: ["ISDA 2002", "NY law", "Margin"] },
    { key: "funds",   label: "Fund Formation",        tags: ["MFN", "Fee terms"] },
    { key: "credit",  label: "Credit",                tags: ["Cross-liens", "Facility B"] },
    { key: "gov",     label: "Governance",            tags: ["Q3 record"] },
  ];

  const PROMPT = "Summarize our termination and cross-default exposure across the Meridian trading agreements — and flag any margin terms that changed in the 2024 CSA amendment.";

  const ANSWER = [
    { b: "Exposure summary — Meridian entities." },
    { t: " Cross-default under the ISDA Master triggers at USD 10M of Specified Indebtedness " },
    { c: 1 },
    { t: " and termination events extend to the GMSLA through §14 " },
    { c: 3 },
    { t: ". The 2024 CSA amendment materially tightened margin terms — Party B's Threshold drops from USD 250,000 to USD 100,000 with a one-day cure " },
    { c: 2 },
    { t: ". Recommend refreshing collateral triggers in monitoring before month-end." },
  ];

  const DRAFT = {
    title: "Client Memorandum — Meridian Trading Exposure",
    meta: "PRIVILEGED & CONFIDENTIAL · ATTORNEY WORK PRODUCT · DRAFT v1",
    h1: "I. Termination & Cross-Default",
    p1: "Cross-default under the ISDA Master Agreement is triggered at USD 10,000,000 of Specified Indebtedness [1]; termination events extend to the GMSLA by operation of §14 [3].",
    h2: "II. Margin & Collateral — 2024 Amendment",
    p2: "The 2024 CSA Amendment reduces Party B's Threshold to USD 100,000 and shortens the Delivery Amount cure period to one Business Day [2].",
  };

  const folderIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  /* -------------------------------------------------------------- helpers -- */

  let chips = [];

  const buildFolders = () => {
    el.folderGrid.innerHTML = FOLDERS.map(
      (f) => `<div class="folder" data-folder="${f.key}">
        <div class="folder__head">${folderIcon}${f.label}<span class="count">0</span></div>
        <div class="folder__tags">${f.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      </div>`
    ).join("");
  };

  const buildChips = () => {
    el.fileLayer.innerHTML = "";
    chips = FILES.map((f) => {
      const d = document.createElement("div");
      d.className = "file-chip";
      d.style.left = f.sx + "%";
      d.style.top = f.sy + "%";
      d.innerHTML = `<span class="f-ico">${f.kind}</span>
        <span class="f-body"><span class="f-name">${f.name}</span><span class="f-sub">${f.sub}</span></span>
        <span class="f-check">${checkIcon}</span>
        <span class="f-scan"></span>`;
      el.fileLayer.appendChild(d);
      return d;
    });
  };

  const slotChips = () => {
    // move each chip into its folder, stacked below the header
    const layerR = el.fileLayer.getBoundingClientRect();
    const perFolder = {};
    FILES.forEach((f, i) => {
      const chip = chips[i];
      const folder = el.folderGrid.querySelector(`[data-folder="${f.folder}"]`);
      if (!folder || !layerR.width) return;
      const idx = (perFolder[f.folder] = (perFolder[f.folder] ?? -1) + 1);
      const fr = folder.getBoundingClientRect();
      const head = folder.querySelector(".folder__head").getBoundingClientRect();
      const chipH = chip.offsetHeight;
      const chipW = fr.width * 0.91;
      const gap = chipH * 0.18;
      const x = fr.left - layerR.left + (fr.width - chipW) / 2;
      const y = head.bottom - layerR.top + chipH * 0.28 + idx * (chipH + gap);
      chip.classList.add("is-grouped");
      chip.style.width = chipW + "px";
      chip.style.left = x + "px";
      chip.style.top = y + "px";
      folder.classList.add("is-packed");
    });
  };

  const setScene = (key) => {
    Object.entries(scenes).forEach(([k, s]) => s.classList.toggle("is-live", k === key));
    el.sideDocs.classList.toggle("is-active", key === "docs");
    el.sideChat.classList.toggle("is-active", key === "chat");
    el.sideDraft.classList.toggle("is-active", key === "draft");
  };

  const answerHTML = (budget, withCaret) => {
    let html = "", used = 0, fired = [];
    for (const seg of ANSWER) {
      if (used >= budget) break;
      if (seg.b !== undefined || seg.t !== undefined) {
        const text = seg.b ?? seg.t;
        const take = Math.min(text.length, budget - used);
        const part = text.slice(0, take);
        html += seg.b !== undefined ? `<b>${part}</b>` : part;
        used += take;
      } else if (seg.c !== undefined) {
        html += `<span class="cite" data-n="${seg.c}">${seg.c}</span>`;
        used += 1;
        fired.push(seg.c);
      }
    }
    if (withCaret) html += '<span class="caret" aria-hidden="true"></span>';
    return { html, fired };
  };
  const answerLen = ANSWER.reduce((n, s) => n + (s.c !== undefined ? 1 : (s.b ?? s.t).length), 0);

  const typeText = (target, text) => (p) => {
    target.textContent = text.slice(0, Math.round(p * text.length));
  };

  /* cursor ------------------------------------------------------------- */

  const cursorRoot = () => el.cursor.offsetParent || stage;
  const CURSOR_HOTSPOT = { x: 5.5 / 24, y: 3.2 / 24 };

  const cursorTo = (target, opts = {}) => {
    if (HIDE_CURSOR) return;
    const { dur = 850, ox = 0, oy = 0 } = opts;
    const node = typeof target === "string" ? $(target) : target;
    if (!node) return;
    const root = cursorRoot();
    const rr = root.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const cr = el.cursor.getBoundingClientRect();
    const tipX = r.left - rr.left + r.width / 2 + ox;
    const tipY = r.top - rr.top + r.height / 2 + oy;
    const x = tipX - cr.width * CURSOR_HOTSPOT.x;
    const y = tipY - cr.height * CURSOR_HOTSPOT.y;
    el.cursor.style.transitionDuration = (dur > 0 ? realMs(dur) : 0) + "ms";
    el.cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };
  const cursorClick = () => {
    if (HIDE_CURSOR) return;
    el.cursor.classList.add("is-click");
    setTimeout(() => el.cursor.classList.remove("is-click"), realMs(340));
  };
  const cursorHome = () => {
    if (HIDE_CURSOR) return;
    const root = cursorRoot();
    const rr = root.getBoundingClientRect();
    const cr = el.cursor.getBoundingClientRect();
    el.cursor.style.transitionDuration = "0ms";
    const x = rr.width * 0.62 - cr.width * CURSOR_HOTSPOT.x;
    const y = rr.height * 0.78 - cr.height * CURSOR_HOTSPOT.y;
    el.cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };

  /* ----------------------------------------------------- state composers -- */

  const clearAll = () => {
    el.dropzone.classList.remove("is-hidden");
    buildFolders();
    buildChips();
    el.folderGrid.querySelectorAll(".folder").forEach((f) => f.classList.remove("is-in", "is-lit", "is-packed"));
    el.docsStatus.textContent = "Waiting for upload…";
    el.docsStatus.classList.remove("is-good");
    el.badgeDocs.classList.remove("is-on");
    el.badgeDraft.classList.remove("is-on");
    // chat
    el.chatStatus.textContent = "Grounded on 8 documents";
    el.msgUser.classList.remove("is-in");
    el.msgUser.textContent = "";
    el.msgAi.classList.remove("is-in");
    el.aiStep.innerHTML = "";
    el.aiStep.classList.remove("is-done");
    el.aiText.innerHTML = "";
    el.chipRow.classList.remove("is-in");
    el.chipDraft.classList.remove("is-hot");
    el.composerText.textContent = "";
    el.composerPh.style.display = "";
    el.composer.classList.remove("is-focus");
    el.sendBtn.classList.remove("is-hot");
    el.src.forEach((s) => s && s.classList.remove("is-in", "is-hot"));
    // viewer
    el.viewer.classList.remove("is-open");
    el.docClause.classList.remove("is-hl");
    el.citeFlag.classList.remove("is-in");
    el.docLines.style.transition = "none";
    el.docLines.style.transform = "translateY(3cqw)";
    // draft
    el.draftStatus.textContent = "Composing from cited sources…";
    el.draftStatus.classList.remove("is-good");
    el.draftTitle.textContent = "";
    el.draftMeta.textContent = "";
    el.draftH1.textContent = "";
    el.draftP1.innerHTML = "";
    el.draftH2.textContent = "";
    el.draftP2.innerHTML = "";
    el.draftSkel.classList.remove("is-on");
    el.draftCheckTitle.textContent = "Verifying…";
    el.checks.forEach((c) => (c.style.opacity = "0.25"));
    el.exportBtn.classList.remove("is-hot");
    el.toast.classList.remove("is-in");
    el.cursor.classList.remove("is-on", "is-click");
    cursorHome();
  };

  const composeIngested = () => {
    chips.forEach((c) => c.classList.add("is-in", "is-done"));
    el.docsStatus.textContent = "8 documents ingested";
    el.docsStatus.classList.add("is-good");
  };

  const composeOrganized = () => {
    el.dropzone.classList.add("is-hidden");
    el.folderGrid.querySelectorAll(".folder").forEach((f) => f.classList.add("is-in"));
    // counts + tags immediately
    FOLDERS.forEach((f) => {
      const n = FILES.filter((x) => x.folder === f.key).length;
      el.folderGrid.querySelector(`[data-folder="${f.key}"] .count`).textContent = n;
    });
    el.folderGrid.querySelectorAll(".tag").forEach((t) => t.classList.add("is-in"));
    slotChips();
    el.docsStatus.textContent = "Organized · 8 documents across 4 matters";
    el.docsStatus.classList.add("is-good");
    el.badgeDocs.classList.add("is-on");
  };

  const composeAnswered = () => {
    el.msgUser.textContent = PROMPT;
    el.msgUser.classList.add("is-in");
    el.msgAi.classList.add("is-in");
    el.aiStep.classList.add("is-done");
    el.aiStep.innerHTML = "<i></i>Grounded in 3 sources · 12 citations";
    el.aiText.innerHTML = answerHTML(answerLen, false).html;
    el.chipRow.classList.add("is-in");
    el.src.forEach((s) => s && s.classList.add("is-in"));
  };

  const composeDrafted = () => {
    el.draftTitle.textContent = DRAFT.title;
    el.draftMeta.textContent = DRAFT.meta;
    el.draftH1.textContent = DRAFT.h1;
    el.draftP1.innerHTML = draftRich(DRAFT.p1);
    el.draftH2.textContent = DRAFT.h2;
    el.draftP2.innerHTML = draftRich(DRAFT.p2);
    el.draftSkel.classList.add("is-on");
    el.draftCheckTitle.textContent = "Ready for review";
    el.checks.forEach((c) => (c.style.opacity = "1"));
    el.draftStatus.textContent = "Draft complete · 12 citations retained";
    el.draftStatus.classList.add("is-good");
    el.badgeDraft.classList.add("is-on");
  };

  // render [n] citation markers inside draft paragraphs as chips
  const draftRich = (text) =>
    text.replace(/\[(\d)\]/g, '<span class="cite" data-n="$1">$1</span>');

  /* ------------------------------------------------------------ chapters -- */

  const firedCites = new Set();
  const onCite = (n) => {
    if (firedCites.has(n)) return;
    firedCites.add(n);
    const s = el.src[n];
    if (s) s.classList.add("is-in");
  };

  const chapters = [
    /* 0 — INGEST ---------------------------------------------------------- */
    {
      key: "ingest", dur: 7000,
      init() {
        clearAll();
        setScene("docs");
      },
      cues: [
        { t: 300, run: () => { el.cursor.classList.add("is-on"); cursorTo(el.dropzone, { dur: 1100, oy: 30 }); } },
        { t: 700, run: () => (el.docsStatus.textContent = "Uploading 8 documents…") },
        ...FILES.map((f, i) => ({
          t: 800 + i * 280,
          run: () => chips[i].classList.add("is-in", "is-scanning"),
        })),
        { t: 3400, run: () => (el.docsStatus.textContent = "Analyzing — parties, dates, obligations, governing law…") },
        ...FILES.map((f, i) => ({
          t: 3600 + i * 300,
          run: () => { chips[i].classList.remove("is-scanning"); chips[i].classList.add("is-done"); },
        })),
        { t: 6300, run: () => { el.docsStatus.textContent = "8 documents ingested"; el.docsStatus.classList.add("is-good"); } },
      ],
    },

    /* 1 — ORGANIZE --------------------------------------------------------- */
    {
      key: "organize", dur: 7000,
      init() {
        clearAll();
        setScene("docs");
        composeIngested();
      },
      cues: [
        { t: 200, run: () => { el.dropzone.classList.add("is-hidden"); el.docsStatus.classList.remove("is-good"); el.docsStatus.textContent = "Classifying into matters…"; } },
        ...FOLDERS.map((f, i) => ({
          t: 420 + i * 130,
          run: () => el.folderGrid.querySelector(`[data-folder="${f.key}"]`).classList.add("is-in"),
        })),
        { t: 1050, run: () => slotChips() },
        ...FOLDERS.map((f, i) => ({
          t: 1500 + i * 220,
          run: () => {
            const node = el.folderGrid.querySelector(`[data-folder="${f.key}"]`);
            node.classList.add("is-lit");
            node.querySelector(".count").textContent = FILES.filter((x) => x.folder === f.key).length;
          },
        })),
        { t: 2600, run: () => (el.docsStatus.textContent = "Extracting parties, dates, governing law…") },
        { t: 4600, run: () => el.folderGrid.querySelectorAll(".folder").forEach((f) => f.classList.remove("is-lit")) },
        { t: 5200, run: () => { el.docsStatus.textContent = "Organized · 8 documents across 4 matters"; el.docsStatus.classList.add("is-good"); el.badgeDocs.classList.add("is-on"); } },
        { t: 6200, run: () => { el.cursor.classList.add("is-on"); cursorTo(el.sideChat, { dur: 800 }); } },
        { t: 6800, run: () => cursorClick() },
      ],
    },

    /* 2 — ASK --------------------------------------------------------------- */
    {
      key: "ask", dur: 10500,
      init() {
        clearAll();
        setScene("chat");
        composeOrganized();      /* docs scene stays consistent behind */
        setScene("chat");
        el.cursor.classList.add("is-on");
        cursorTo(el.composer, { dur: 0 });
      },
      cues: [
        { t: 150, run: () => { el.composer.classList.add("is-focus"); el.composerPh.style.display = "none"; } },
        { t: 200, dur: 3200, tick: typeText(el.composerText, PROMPT) },
        { t: 3550, run: () => { cursorTo(el.sendBtn, { dur: 500 }); } },
        { t: 4100, run: () => { el.sendBtn.classList.add("is-hot"); cursorClick(); } },
        {
          t: 4350,
          run: () => {
            el.composerText.textContent = "";
            el.composerPh.style.display = "";
            el.composer.classList.remove("is-focus");
            el.sendBtn.classList.remove("is-hot");
            el.msgUser.textContent = PROMPT;
            el.msgUser.classList.add("is-in");
            el.chatStatus.textContent = "Retrieving across 8 documents…";
          },
        },
        { t: 4900, run: () => { el.msgAi.classList.add("is-in"); el.aiStep.innerHTML = "<i></i>Reviewing 3 source documents…"; } },
        { t: 6050, run: () => { el.aiStep.innerHTML = "<i></i>Cross-referencing definitions & schedules…"; } },
        {
          t: 7050,
          run: () => { el.aiStep.classList.add("is-done"); el.aiStep.innerHTML = "<i></i>Grounded in 3 sources · 12 citations"; el.chatStatus.textContent = "Grounded on 8 documents"; },
        },
        {
          t: 7100, dur: 3100,
          tick: (p) => {
            const { html, fired } = answerHTML(Math.round(p * answerLen), p < 1);
            el.aiText.innerHTML = html;
            fired.forEach(onCite);
          },
        },
        { t: 10300, run: () => el.chipRow.classList.add("is-in") },
      ],
    },

    /* 3 — TRACE -------------------------------------------------------------- */
    {
      key: "trace", dur: 8500,
      init() {
        clearAll();
        setScene("chat");
        composeAnswered();
        el.cursor.classList.add("is-on");
        cursorTo(el.chatScroll, { dur: 0, oy: 60 });
      },
      cues: [
        { t: 400, run: () => { const c = el.aiText.querySelector('.cite[data-n="2"]'); if (c) cursorTo(c, { dur: 900 }); } },
        {
          t: 1450,
          run: () => {
            cursorClick();
            const c = el.aiText.querySelector('.cite[data-n="2"]');
            if (c) c.classList.add("is-hot");
            el.src[2].classList.add("is-hot");
          },
        },
        { t: 1800, run: () => el.viewer.classList.add("is-open") },
        {
          t: 2450,
          run: () => {
            el.docLines.style.transition = `transform ${realMs(900)}ms cubic-bezier(0.45,0,0.25,1)`;
            el.docLines.style.transform = "translateY(0)";
          },
        },
        { t: 3400, run: () => el.docClause.classList.add("is-hl") },
        { t: 4300, run: () => el.citeFlag.classList.add("is-in") },
        { t: 6600, run: () => el.viewer.classList.remove("is-open") },
        {
          t: 7300,
          run: () => {
            const c = el.aiText.querySelector('.cite[data-n="2"]');
            if (c) c.classList.remove("is-hot");
            el.src[2].classList.remove("is-hot");
          },
        },
      ],
    },

    /* 4 — DRAFT --------------------------------------------------------------- */
    {
      key: "draft", dur: 8200,
      init() {
        clearAll();
        setScene("chat");
        composeAnswered();
        el.cursor.classList.add("is-on");
        cursorTo(el.chatScroll, { dur: 0, oy: 40 });
      },
      cues: [
        { t: 300, run: () => cursorTo(el.chipDraft, { dur: 800 }) },
        { t: 1250, run: () => { cursorClick(); el.chipDraft.classList.add("is-hot"); } },
        { t: 1650, run: () => { setScene("draft"); el.badgeDraft.classList.add("is-on"); } },
        { t: 2000, dur: 900, tick: typeText(el.draftTitle, DRAFT.title) },
        { t: 2950, run: () => (el.draftMeta.textContent = DRAFT.meta) },
        { t: 3150, dur: 500, tick: typeText(el.draftH1, DRAFT.h1) },
        {
          t: 3700, dur: 1500,
          tick: (p) => {
            const take = Math.round(p * DRAFT.p1.length);
            el.draftP1.innerHTML = draftRich(DRAFT.p1.slice(0, take)) + (p < 1 ? '<span class="caret"></span>' : "");
          },
        },
        { t: 5300, dur: 500, tick: typeText(el.draftH2, DRAFT.h2) },
        {
          t: 5850, dur: 1300,
          tick: (p) => {
            const take = Math.round(p * DRAFT.p2.length);
            el.draftP2.innerHTML = draftRich(DRAFT.p2.slice(0, take)) + (p < 1 ? '<span class="caret"></span>' : "");
          },
        },
        { t: 7200, run: () => el.draftSkel.classList.add("is-on") },
        { t: 7300, run: () => (el.checks[0].style.opacity = "1") },
        { t: 7550, run: () => (el.checks[1].style.opacity = "1") },
        { t: 7800, run: () => { el.checks[2].style.opacity = "1"; el.draftCheckTitle.textContent = "Ready for review"; } },
      ],
    },

    /* 5 — DELIVER ---------------------------------------------------------------- */
    {
      key: "deliver", dur: 6500,
      init() {
        clearAll();
        setScene("draft");
        composeDrafted();
        el.cursor.classList.add("is-on");
        cursorTo(el.draftSkel, { dur: 0, oy: 40 });
      },
      cues: [
        { t: 300, run: () => cursorTo(el.exportBtn, { dur: 850 }) },
        { t: 1300, run: () => { cursorClick(); el.exportBtn.classList.add("is-hot"); } },
        { t: 1700, run: () => el.toast.classList.add("is-in") },
      ],
    },
  ];

  /* --------------------------------------------------------------- engine -- */

  let chIdx = 0;
  let chT = 0;
  let rafId = null;
  let last = null;
  let userPaused = false;
  let inView = true;

  const playing = () => !userPaused && inView && !REDUCED;

  const paintChapters = () => {
    chapterBtns.forEach((b, i) => {
      b.classList.toggle("is-now", i === chIdx);
      b.classList.toggle("is-done", i < chIdx);
      if (i > chIdx) b.querySelector(".ch-bar i").style.setProperty("--p", 0);
    });
  };

  const enterChapter = (i) => {
    chIdx = i;
    chT = 0;
    firedCites.clear();
    const ch = chapters[i];
    ch.cues.forEach((c) => { c._ran = false; c._done = false; });
    stage.classList.add("no-anim");
    ch.init();
    void stage.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("no-anim")));
    paintChapters();
  };

  const syncLoop = () => {
    if (playing() && rafId === null) {
      last = null;
      rafId = requestAnimationFrame(frame);
    } else if (!playing() && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const frame = (now) => {
    if (!playing()) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    if (last === null) last = now;
    const dt = Math.min(64, now - last);
    last = now;
    chT += dt * PLAYBACK_RATE;

    const ch = chapters[chIdx];
    for (const cue of ch.cues) {
      if (cue.tick) {
        if (chT >= cue.t && !cue._done) {
          const p = Math.min(1, (chT - cue.t) / cue.dur);
          cue.tick(p);
          if (p >= 1) cue._done = true;
        }
      } else if (!cue._ran && chT >= cue.t) {
        cue._ran = true;
        cue.run();
      }
    }

    const bar = chapterBtns[chIdx]?.querySelector(".ch-bar i");
    if (bar) bar.style.setProperty("--p", Math.min(1, chT / ch.dur).toFixed(3));

    if (chT >= ch.dur) enterChapter((chIdx + 1) % chapters.length);
  };

  /* --------------------------------------------------------------- wiring -- */

  if (REDUCED) {
    // static poster: the answered state — the richest, most legible frame
    stage.classList.add("is-static", "no-anim");
    setScene("chat");
    clearAll();
    setScene("chat");
    composeAnswered();
    el.cursor.classList.remove("is-on");
    chapterBtns.forEach((b, i) => {
      b.disabled = true;
      b.classList.toggle("is-now", i === 2);
      if (i <= 2) b.querySelector(".ch-bar i").style.setProperty("--p", 1);
    });
    if (toggleBtn) toggleBtn.style.display = "none";
    return;
  }

  toggleBtn.classList.add("is-playing");
  toggleBtn.addEventListener("click", () => {
    userPaused = !userPaused;
    toggleBtn.classList.toggle("is-playing", !userPaused);
    toggleBtn.setAttribute("aria-label", userPaused ? "Play demonstration" : "Pause demonstration");
    syncLoop();
  });

  chapterBtns.forEach((b, i) =>
    b.addEventListener("click", () => {
      enterChapter(i);
      syncLoop();
    })
  );

  const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; syncLoop(); }, { threshold: 0.12 });
  io.observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) inView = false;
    else {
      const r = stage.getBoundingClientRect();
      inView = r.bottom > 0 && r.top < innerHeight;
    }
    syncLoop();
  });

  // deterministic seek hook (used by tests/QA tooling; harmless in production)
  window.__demoSeek = (n, t = 0) => {
    enterChapter(n);
    if (t > 0) {
      chT = t;
      const ch = chapters[n];
      for (const cue of ch.cues) {
        if (cue.tick) {
          if (t >= cue.t) {
            cue.tick(Math.min(1, (t - cue.t) / cue.dur));
            if (t >= cue.t + cue.dur) cue._done = true;
          }
        } else if (t >= cue.t) {
          cue._ran = true;
          cue.run();
        }
      }
      const bar = chapterBtns[n]?.querySelector(".ch-bar i");
      if (bar) bar.style.setProperty("--p", Math.min(1, t / ch.dur).toFixed(3));
    }
  };

  // re-slot grouped chips on resize so they track folder geometry
  let rz = null;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (chips[0] && chips[0].classList.contains("is-grouped")) {
        stage.classList.add("no-anim");
        slotChips();
        void stage.offsetWidth;
        stage.classList.remove("no-anim");
      }
    }, 160);
  });

  enterChapter(0);
  syncLoop();
})();
