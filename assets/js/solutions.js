/* ==========================================================================
   BESPOKE — solution sub-page visuals
   One module per page, keyed by [data-viz]. Each visual ships in its final,
   readable state; JS arms it and plays the sequence only while on screen.
   Reduced motion (or ?reduced in the URL) leaves the final state untouched.
   ========================================================================== */
(() => {
  "use strict";

  const doc = document;
  const REDUCED =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    /[?&]reduced\b/.test(location.search);
  const MOBILE = () => window.matchMedia("(max-width: 860px)").matches;
  const CANCEL = Symbol("cancel");

  const $ = (sel, ctx = doc) => ctx.querySelector(sel);
  const $$ = (sel, ctx = doc) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const fmt = (n, dec = 0) =>
    n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* Start/stop callbacks as an element enters and leaves the viewport. */
  const whenVisible = (el, start, stop, threshold = 0.2) => {
    if (!("IntersectionObserver" in window)) {
      start();
      return;
    }
    let on = false;
    new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting && !on) {
          on = true;
          start();
        } else if (!en.isIntersecting && on) {
          on = false;
          stop && stop();
        }
      },
      { threshold }
    ).observe(el);
  };

  /* Loop an async script while `el` is visible. The script receives `wait`,
     which rejects once the loop is stopped, so a paused sequence unwinds. */
  const loopWhileVisible = (el, script, { threshold = 0.25, once = false } = {}) => {
    let token = 0;
    const start = () => {
      const my = ++token;
      const wait = (ms) =>
        new Promise((res, rej) => setTimeout(() => (my === token ? res() : rej(CANCEL)), ms));
      (async () => {
        try {
          do {
            await script(wait, () => my === token);
          } while (!once && my === token);
        } catch (e) {
          if (e !== CANCEL) console.error(e);
        }
      })();
    };
    whenVisible(el, start, () => token++, threshold);
    return () => token++;
  };

  /* Tween a number into an element's text. */
  const tweenText = (el, from, to, ms, render) =>
    new Promise((res) => {
      if (REDUCED || ms <= 0) {
        el.textContent = render(to);
        return res();
      }
      const t0 = performance.now();
      const step = (now) => {
        const t = clamp((now - t0) / ms, 0, 1);
        el.textContent = render(lerp(from, to, easeOut(t)));
        t < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });

  /* Restart a CSS animation on an element by toggling a class. */
  const pulse = (el, cls = "is-flash") => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  const VIZ = {};

  /* ================================================================ trading */
  /* An order walks the execution path. Each stage lights, its microsecond
     stamp counts up, child orders fill across venues, and a tick tape runs
     underneath with fill markers. */
  VIZ.trading = (root) => {
    const stages = $$(".tr-stage", root);
    const fill = $(".tr-track i", root);
    const venues = $$(".tr-venue", root);
    const clock = $(".tr-clock b", root);
    const tape = $(".tr-tape svg", root);
    const line = $(".tr-tape__line", root);
    const area = $(".tr-tape__area", root);
    const marks = $(".tr-tape__marks", root);
    const last = $(".tr-tape__px", root);

    // tick tape — random walk, redrawn on an interval while visible
    const W = 1200, H = 96, N = 120;
    const pts = [];
    let px = 131.38;
    for (let i = 0; i < N; i++) {
      px += (Math.random() - 0.48) * 0.018;
      pts.push(px);
    }
    const drawTape = () => {
      const lo = Math.min(...pts) - 0.01, hi = Math.max(...pts) + 0.01;
      const y = (v) => H - 10 - ((v - lo) / (hi - lo)) * (H - 20);
      const d = pts.map((v, i) => `${((i / (N - 1)) * W).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
      line.setAttribute("points", d);
      area.setAttribute("points", `0,${H} ${d} ${W},${H}`);
      if (last) last.textContent = pts[N - 1].toFixed(2);
      $$("circle", marks).forEach((c) => {
        const i = +c.dataset.i;
        if (i < 0) return c.setAttribute("opacity", "0");
        c.setAttribute("opacity", "1");
        c.setAttribute("cx", ((i / (N - 1)) * W).toFixed(1));
        c.setAttribute("cy", y(pts[i]).toFixed(1));
      });
    };
    drawTape();
    if (REDUCED) return;

    let tapeTimer = 0;
    whenVisible(
      root,
      () => {
        tapeTimer = setInterval(() => {
          px = pts[N - 1] + (Math.random() - 0.49) * 0.02;
          pts.shift();
          pts.push(px);
          $$("circle", marks).forEach((c) => (c.dataset.i = +c.dataset.i - 1));
          drawTape();
        }, 160);
      },
      () => clearInterval(tapeTimer),
      0.05
    );

    root.classList.add("is-armed");
    const stamps = stages.map((s) => $(".tr-stage__t b", s));
    const finalT = stamps.map((b) => +b.dataset.t);

    const reset = () => {
      stages.forEach((s) => s.classList.remove("is-on", "is-done"));
      stamps.forEach((b) => (b.textContent = "—"));
      venues.forEach((v) => {
        v.style.setProperty("--p", 0);
        $("em", v).textContent = "0";
      });
      fill.style.transform = "scaleX(0)";
      if (clock) clock.textContent = "0";
    };

    loopWhileVisible(root, async (wait) => {
      reset();
      await wait(700);
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const vertical = window.matchMedia("(max-width: 560px)").matches;
        fill.style.transform = vertical
          ? `scaleY(${(i + 0.5) / stages.length})`
          : `scaleX(${(i + 0.5) / stages.length})`;
        if (i > 0) stages[i - 1].classList.replace("is-on", "is-done");
        s.classList.add("is-on");
        const from = i ? finalT[i - 1] : 0;
        tweenText(stamps[i], from, finalT[i], 520, (v) => fmt(Math.round(v)));
        if (clock) tweenText(clock, from, finalT[i], 520, (v) => fmt(Math.round(v)));
        if (s.dataset.stage === "venues") {
          await wait(260);
          await Promise.all(
            venues.map(async (v, k) => {
              await wait(k * 180);
              v.style.setProperty("--p", 1);
              const qty = +v.dataset.qty;
              await tweenText($("em", v), 0, qty, 700, (n) => fmt(Math.round(n / 100) * 100));
            })
          );
          // drop fill markers onto the newest ticks of the tape
          $$("circle", marks).forEach((c, k) => (c.dataset.i = N - 1 - (2 - k) * 3));
          drawTape();
          await wait(400);
        } else {
          await wait(1000);
        }
      }
      stages[stages.length - 1].classList.replace("is-on", "is-done");
      fill.style.transform = window.matchMedia("(max-width: 560px)").matches ? "scaleY(1)" : "scaleX(1)";
      await wait(3600);
    });
  };

  /* =================================================================== risk */
  /* Three stress factors drive a sector × rating heatmap of stressed loss
     rates and four limit checks. Plays through presets until touched. */
  VIZ.risk = (root) => {
    const grid = $("[data-heat]", root);
    const inputs = $$("input[data-k]", root);
    const outs = Object.fromEntries($$("[data-out]", root).map((o) => [o.dataset.out, o]));
    const checks = Object.fromEntries($$("[data-check]", root).map((c) => [c.dataset.check, c]));

    const SECTORS = ["Commercial real estate", "Energy", "Technology", "Retail", "Healthcare"];
    const EXPOSURE = [ // $M by rating tier
      [120, 210, 140, 60],
      [80, 150, 110, 70],
      [160, 180, 90, 40],
      [60, 120, 100, 55],
      [140, 130, 60, 25],
    ];
    const PD = [0.004, 0.012, 0.035, 0.09];
    const RATE_SENS = [1.5, 0.7, 0.9, 1.2, 0.5];
    const SPREAD_SENS = [1.2, 1.3, 1.0, 1.4, 0.8];
    const TIER_MULT = [0.6, 1, 1.5, 2];

    const cells = [];
    SECTORS.forEach((name, r) => {
      const label = doc.createElement("span");
      label.className = "rk-heat__row";
      label.textContent = name;
      grid.appendChild(label);
      EXPOSURE[r].forEach((exp, t) => {
        const c = doc.createElement("span");
        c.className = "rk-cell";
        c.innerHTML = `<b></b><small>$${exp}M</small>`;
        grid.appendChild(c);
        cells.push({ c, r, t, exp });
      });
    });

    const state = { rate: 200, spread: 150, haircut: 10 };
    const color = (lr) => {
      const t = clamp(Math.log(lr / 0.002) / Math.log(0.2 / 0.002), 0, 1);
      // porcelain → cobalt → deep navy
      const stops = [[245, 245, 244], [74, 114, 240], [23, 52, 143]];
      const seg = t < 0.55 ? 0 : 1;
      const k = seg === 0 ? t / 0.55 : (t - 0.55) / 0.45;
      const a = stops[seg], b = stops[seg + 1];
      return {
        bg: `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(",")})`,
        ink: t > 0.42 ? "#fff" : "var(--ink-900)",
      };
    };

    const setCheck = (key, ok, val) => {
      const el = checks[key];
      $(".rk-check__val", el).textContent = val;
      $(".rk-check__state", el).textContent = ok ? "Pass" : "Breach";
      if (el.classList.contains("is-breach") === ok) pulse(el);
      el.classList.toggle("is-breach", !ok);
    };

    const render = () => {
      const { rate, spread, haircut } = state;
      outs.rate.textContent = `+${Math.round(rate)} bps`;
      outs.spread.textContent = `+${Math.round(spread)} bps`;
      outs.haircut.textContent = `${Math.round(haircut)}%`;
      const lgd = Math.min(0.9, 0.45 * (1 + (haircut / 100) * 1.2));
      let total = 0, totalExp = 0;
      const bySector = [0, 0, 0, 0, 0];
      cells.forEach(({ c, r, t, exp }) => {
        const pd = Math.min(
          0.6,
          PD[t] * (1 + (rate / 100) * 0.35 * RATE_SENS[r]) * (1 + (spread / 100) * 0.3 * SPREAD_SENS[r] * TIER_MULT[t])
        );
        const lr = pd * lgd;
        const el = exp * lr;
        total += el;
        totalExp += exp;
        bySector[r] += el;
        const { bg, ink } = color(lr);
        c.style.background = bg;
        c.style.color = ink;
        c.classList.toggle("is-hot", lr >= 0.08);
        $("b", c).textContent = `${(lr * 100).toFixed(lr < 0.1 ? 1 : 0)}%`;
      });
      const lr = total / totalExp;
      outs.el.textContent = `$${total.toFixed(1)}M`;
      outs.lr.textContent = `${(lr * 100).toFixed(2)}%`;
      const conc = Math.max(...bySector) / total;
      const dscr = 1.68 - (rate / 100) * 0.14 - (spread / 100) * 0.03;
      const lcr = 136 - haircut * 2.2 - (spread / 100) * 2;
      setCheck("lr", lr <= 0.03, `${(lr * 100).toFixed(2)}%`);
      setCheck("conc", conc <= 0.3, `${Math.round(conc * 100)}%`);
      setCheck("dscr", dscr >= 1.25, `${dscr.toFixed(2)}×`);
      setCheck("lcr", lcr >= 100, `${Math.round(lcr)}%`);
      inputs.forEach((i) => {
        i.value = state[i.dataset.k];
        i.style.setProperty("--fill", `${((i.value - i.min) / (i.max - i.min)) * 100}%`);
      });
    };
    render();

    let touched = false;
    let tweenId = 0;
    const touch = () => {
      touched = true;
      tweenId++;
    };
    inputs.forEach((i) =>
      i.addEventListener("input", () => {
        touch();
        state[i.dataset.k] = +i.value;
        render();
      })
    );

    const tweenTo = (target, ms) =>
      new Promise((res) => {
        const from = { ...state };
        const id = ++tweenId;
        if (REDUCED || ms <= 0) {
          Object.assign(state, target);
          render();
          return res();
        }
        const t0 = performance.now();
        const step = (now) => {
          if (id !== tweenId) return res();
          const k = easeOut(clamp((now - t0) / ms, 0, 1));
          Object.keys(target).forEach((key) => (state[key] = lerp(from[key], target[key], k)));
          render();
          k < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });

    $$("[data-preset]", root).forEach((b) =>
      b.addEventListener("click", () => {
        touched = true;
        const [rate, spread, haircut] = b.dataset.preset.split(",").map(Number);
        tweenTo({ rate, spread, haircut }, 600);
      })
    );

    if (REDUCED) return;
    const PRESETS = [
      { rate: 0, spread: 0, haircut: 0 },
      { rate: 350, spread: 125, haircut: 8 },
      { rate: 150, spread: 450, haircut: 24 },
      { rate: 200, spread: 150, haircut: 10 },
    ];
    const stop = loopWhileVisible(root, async (wait) => {
      for (const p of PRESETS) {
        if (touched) return stop();
        await tweenTo(p, 1400);
        await wait(2200);
      }
    });
  };

  /* ============================================================= compliance */
  /* A scan line reads the entity file, checks resolve one by one, and each
     decision is sealed onto an append-only hash chain. */
  VIZ.compliance = (root) => {
    const checks = $$(".cp-check", root);
    const chain = $("[data-chain]", root);
    const verdict = $(".cp-verdict", root);
    const file = $(".cp-file", root);
    if (REDUCED) return;
    root.classList.add("is-armed");

    const EVENTS = ["registry.verified", "id.verified", "ubo.resolved", "pep.escalated", "sanctions.clear", "media.noted"];
    const hex = () => Math.random().toString(16).slice(2, 6);
    const hash = () => `${hex()}…${hex()}`;
    let seq = 417;
    let prev = hash();
    let clock = 14 * 3600 + 2 * 60 + 4;
    const stamp = () => {
      clock += 1;
      const h = Math.floor(clock / 3600), m = Math.floor((clock % 3600) / 60), s = clock % 60;
      return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    };
    const addBlock = (label, kind) => {
      const h = hash();
      const li = doc.createElement("li");
      li.className = `cp-block is-new${kind ? ` cp-block--${kind}` : ""}`;
      li.innerHTML = `<b>#0${++seq}</b><span>${label}</span><code>h ${h}</code><code>prev ${prev}</code><time>${stamp()}</time>`;
      prev = h;
      chain.appendChild(li);
      requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove("is-new")));
      const blocks = $$(".cp-block", chain);
      const max = window.matchMedia("(max-width: 860px)").matches ? 2 : 4;
      blocks.slice(0, Math.max(0, blocks.length - max)).forEach((b) => b.remove());
    };

    loopWhileVisible(root, async (wait) => {
      checks.forEach((c) => c.classList.remove("is-running", "is-done"));
      verdict.classList.remove("is-in");
      chain.innerHTML = "";
      seq = 417;
      clock = 14 * 3600 + 2 * 60 + 4;
      await wait(500);
      file.classList.remove("is-scanning");
      void file.offsetWidth;
      file.classList.add("is-scanning");
      await wait(900);
      for (let i = 0; i < checks.length; i++) {
        const c = checks[i];
        c.classList.add("is-running");
        await wait(c.dataset.state === "warn" ? 1100 : 650);
        c.classList.replace("is-running", "is-done");
        addBlock(EVENTS[i], c.dataset.state === "warn" ? "warn" : "");
        await wait(350);
      }
      file.classList.remove("is-scanning");
      await wait(400);
      verdict.classList.add("is-in");
      addBlock("rating.medium · edd.open", "seal");
      await wait(5200);
    });
  };

  /* ================================================================= wealth */
  /* Parsed documents populate a household treemap; a quarter scrubber
     resizes it as capital calls and distributions land. */
  VIZ.wealth = (root) => {
    const tree = $("[data-tree]", root);
    const docs = $$(".wm-doc", root);
    const qBtns = $$("[data-q]", root);
    const nwEl = $("[data-nw]", root);
    const deltaEl = $("[data-delta]", root);
    const noteEl = $("[data-note]", root);

    const HOLD = [
      { k: "eq", name: "Custodial equities", src: "Schwab & Fidelity statements", v: [6.2, 6.62, 6.14, 6.88] },
      { k: "fi", name: "Fixed income", src: "Fidelity statement", v: [3.1, 3.12, 3.18, 3.21] },
      { k: "tr", name: "Family trust", src: "Trust agreement · cash & munis", v: [2.4, 2.38, 2.08, 2.3] },
      { k: "re", name: "Real estate LP", src: "K-1 · distribution notice", v: [1.62, 1.55, 1.6, 1.38], alt: true },
      { k: "pe", name: "PE Fund III", src: "K-1 · capital call notices", v: [1.4, 1.92, 2.21, 2.08], alt: true },
      { k: "vc", name: "VC Fund II", src: "Capital call notice", v: [0.8, 0.81, 1.12, 1.04], alt: true },
    ];
    const NOTES = [
      "Q1 · Opening position assembled from 5 onboarding documents. A quarter of net worth sits outside the custodian.",
      "Q2 · PE Fund III called $500k. The notice was parsed and the unfunded commitment updated to $1.1M.",
      "Q3 · VC Fund II called $300k, funded from the trust's cash sleeve. Custodial equities fell 7.3%.",
      "Q4 · Real estate LP distributed $220k. Net worth closed the year at $16.9M, up 8.8% since onboarding.",
    ];
    const totals = [0, 1, 2, 3].map((q) => HOLD.reduce((a, h) => a + h.v[q], 0));

    const tiles = HOLD.map((h) => {
      const t = doc.createElement("div");
      t.className = `wm-tile wm-tile--${h.k}${h.alt ? " wm-tile--alt" : ""}`;
      t.innerHTML = `<span class="wm-tile__name">${h.name}</span><b class="wm-tile__v"></b><span class="wm-tile__src">${h.src}</span>`;
      tree.appendChild(t);
      return t;
    });

    const squarify = (items, x, y, w, h) => {
      const out = [];
      let rest = items.slice();
      const worst = (row, side, scale) => {
        const areas = row.map((o) => o.v * scale);
        const s = areas.reduce((a, b) => a + b, 0);
        return Math.max((side * side * Math.max(...areas)) / (s * s), (s * s) / (side * side * Math.min(...areas)));
      };
      while (rest.length) {
        const side = Math.min(w, h);
        const scale = (w * h) / rest.reduce((a, b) => a + b.v, 0);
        let row = [rest[0]];
        let i = 1;
        while (i < rest.length && worst([...row, rest[i]], side, scale) <= worst(row, side, scale)) row.push(rest[i++]);
        const s = row.reduce((a, b) => a + b.v * scale, 0);
        if (w >= h) {
          const cw = s / h;
          let cy = y;
          row.forEach((o) => {
            const ch = (o.v * scale) / cw;
            out.push({ ...o, x, y: cy, w: cw, h: ch });
            cy += ch;
          });
          x += cw;
          w -= cw;
        } else {
          const rh = s / w;
          let cx = x;
          row.forEach((o) => {
            const cw = (o.v * scale) / rh;
            out.push({ ...o, x: cx, y, w: cw, h: rh });
            cx += cw;
          });
          y += rh;
          h -= rh;
        }
        rest = rest.slice(i);
      }
      return out;
    };

    let q = 3;
    const layout = () => {
      const W = tree.clientWidth || 1000, H = tree.clientHeight || 400;
      const rects = squarify(HOLD.map((h, i) => ({ i, v: h.v[q] })), 0, 0, W, H);
      rects.forEach((r) => {
        const t = tiles[r.i];
        t.style.left = `${(r.x / W) * 100}%`;
        t.style.top = `${(r.y / H) * 100}%`;
        t.style.width = `${(r.w / W) * 100}%`;
        t.style.height = `${(r.h / H) * 100}%`;
        t.classList.toggle("is-small", r.w < 150 || r.h < 86);
        $(".wm-tile__v", t).textContent = `$${HOLD[r.i].v[q].toFixed(2)}M`;
      });
    };

    const setQ = (next, animate = true) => {
      const prevTotal = totals[q];
      q = next;
      qBtns.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.q === q)));
      layout();
      tweenText(nwEl, animate ? prevTotal : totals[q], totals[q], animate ? 700 : 0, (v) => v.toFixed(2));
      const d = q === 0 ? null : (totals[q] / totals[q - 1] - 1) * 100;
      deltaEl.textContent = d === null ? "Onboarding" : `${d >= 0 ? "+" : ""}${d.toFixed(1)}% QoQ`;
      deltaEl.classList.toggle("is-down", d !== null && d < 0);
      noteEl.textContent = NOTES[q];
    };
    setQ(3, false);
    window.addEventListener("resize", layout);

    let touched = false;
    qBtns.forEach((b) =>
      b.addEventListener("click", () => {
        touched = true;
        setQ(+b.dataset.q);
      })
    );
    if (REDUCED) return;
    root.classList.add("is-armed");

    let played = false;
    const stop = loopWhileVisible(root, async (wait) => {
      if (!played) {
        played = true;
        docs.forEach((d) => d.classList.remove("is-parsed"));
        tree.classList.add("is-empty");
        setQ(0, false);
        await wait(500);
        for (const d of docs) {
          d.classList.add("is-parsed");
          await wait(380);
        }
        tree.classList.remove("is-empty");
        await wait(1800);
      }
      for (let n = 1; n <= 4; n++) {
        if (touched) return stop();
        setQ(n % 4);
        await wait(n === 4 ? 3200 : 2800);
      }
    });
  };

  /* ============================================================= accounting */
  /* Ledger rows tie out to the bank statement one pair at a time, tickmarks
     are stamped, the reconciliation foots, and the reviewer signs off. */
  VIZ.accounting = (root) => {
    const books = $(".ac-books", root);
    const svg = $(".ac-links", root);
    const glRows = $$('[data-side="gl"] tbody tr', root);
    const bankRows = $$('[data-side="bank"] tbody tr', root);
    const recon = $$(".ac-recon__row", root);
    const signs = $$(".ac-sign__row", root);
    const NS = "http://www.w3.org/2000/svg";

    const pathFor = (m) => {
      const a = glRows.find((r) => r.dataset.m === m);
      const b = bankRows.find((r) => r.dataset.m === m);
      const box = books.getBoundingClientRect();
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.right - box.left + 4, y1 = ra.top + ra.height / 2 - box.top;
      const x2 = rb.left - box.left - 4, y2 = rb.top + rb.height / 2 - box.top;
      const mx = (x1 + x2) / 2;
      return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    };
    const links = {};
    const drawLinks = () => {
      const box = books.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      ["1", "2", "3", "4", "5"].forEach((m) => {
        let p = links[m];
        if (!p) {
          p = links[m] = doc.createElementNS(NS, "path");
          svg.appendChild(p);
        }
        p.setAttribute("d", pathFor(m));
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        if (!root.classList.contains("is-armed") || p.classList.contains("is-on")) p.style.strokeDashoffset = 0;
      });
    };
    drawLinks();
    window.addEventListener("resize", drawLinks);
    if (REDUCED) return;
    root.classList.add("is-armed");

    const on = (els) => els.forEach((e) => e && e.classList.add("is-on"));
    loopWhileVisible(root, async (wait) => {
      $$(".is-on", root).forEach((e) => e.classList.remove("is-on"));
      Object.values(links).forEach((p) => {
        p.classList.remove("is-on");
        p.style.strokeDashoffset = p.getTotalLength();
      });
      drawLinks();
      await wait(700);
      for (const m of ["1", "2", "3", "4", "5"]) {
        const a = glRows.find((r) => r.dataset.m === m);
        const b = bankRows.find((r) => r.dataset.m === m);
        a.classList.add("is-on");
        await wait(260);
        links[m].classList.add("is-on");
        links[m].style.strokeDashoffset = 0;
        await wait(360);
        b.classList.add("is-on");
        await wait(320);
      }
      on(glRows.filter((r) => r.dataset.m === "x"));
      on(bankRows.filter((r) => !r.dataset.m));
      await wait(900);
      for (const r of recon) {
        r.classList.add("is-on");
        await wait(520);
      }
      await wait(300);
      for (const s of signs) {
        s.classList.add("is-on");
        await wait(900);
      }
      await wait(5000);
    });
  };

  /* ==================================================================== api */
  /* A webhook travels from Clio into the middleware, the payload is rewritten
     field by field, then fans out to three systems with a live request log. */
  VIZ.api = (root) => {
    const wires = Object.fromEntries($$(".ap-wires path", root).map((p) => [p.id.replace("apW-", ""), p]));
    const nodes = Object.fromEntries($$(".ap-node", root).map((n) => [n.dataset.node, n]));
    const core = $(".ap-core", root);
    const packets = $$(".ap-packet", root);
    const code = $("[data-code] code", root);
    const tabs = $$(".ap-code__tab", root);
    const log = $("[data-log]", root);
    if (REDUCED) return;
    root.classList.add("is-armed");

    const K = (k) => `<span class="k">"${k}"</span>`;
    const S = (s) => `<span class="s">"${s}"</span>`;
    const Nn = (n) => `<span class="n">${n}</span>`;
    const IN = [
      "{",
      `  ${K("client_name")}: ${S("Hartwell &amp; Co.")},`,
      `  ${K("matter_id")}: ${Nn(88214)},`,
      `  ${K("status")}: ${S("Open")},`,
      `  ${K("billing_rate")}: ${S("450.00 USD/hr")},`,
      `  ${K("opened")}: ${S("03/14/2026")},`,
      `  ${K("attachment")}: ${S("engagement.pdf")}`,
      "}",
    ];
    const OUT = [
      "{",
      `  ${K("Account.Name")}: ${S("Hartwell &amp; Co.")},`,
      `  ${K("Matter__c.ExternalId")}: ${S("clio-88214")},`,
      `  ${K("Stage")}: ${S("Active")},`,
      `  ${K("Rate")}: { ${K("amount")}: ${Nn(450)}, ${K("currency")}: ${S("USD")}, ${K("unit")}: ${S("hour")} },`,
      `  ${K("OpenedAt")}: ${S("2026-03-14T00:00:00Z")},`,
      `  ${K("Files")}: [{ ${K("name")}: ${S("engagement.pdf")}, ${K("sha256")}: ${S("9c1e…a07b")} }]`,
      "}",
    ];
    const setTab = (which) => tabs.forEach((t) => t.toggleAttribute("data-on", t.dataset.tab === which));
    const renderCode = (lines) => {
      code.innerHTML = lines.map((l) => `<span class="ap-ln">${l}</span>`).join("\n");
    };
    let ms = 118;
    const logLine = (verb, cls, text, status, statusCls) => {
      ms += 11 + Math.floor(Math.random() * 60);
      const li = doc.createElement("li");
      li.className = "is-new";
      li.innerHTML = `<time>14:02:07.${String(ms).padStart(3, "0")}</time><b class="${cls}">${verb}</b><span>${text}</span>${
        status ? `<em class="${statusCls}">${status}</em>` : ""
      }`;
      log.appendChild(li);
      requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove("is-new")));
      const items = $$("li", log);
      items.slice(0, Math.max(0, items.length - 6)).forEach((i) => i.remove());
    };
    const travel = (packet, path, dur) =>
      new Promise((res) => {
        const len = path.getTotalLength();
        const t0 = performance.now();
        packet.classList.add("is-on");
        const step = (now) => {
          const t = clamp((now - t0) / dur, 0, 1);
          const p = path.getPointAtLength(len * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2));
          packet.setAttribute("cx", p.x);
          packet.setAttribute("cy", p.y);
          if (t < 1) requestAnimationFrame(step);
          else {
            packet.classList.remove("is-on");
            res();
          }
        };
        requestAnimationFrame(step);
      });
    const hot = (n, cls = "is-hot") => nodes[n].classList.add(cls);

    loopWhileVisible(root, async (wait) => {
      Object.values(nodes).forEach((n) => n.classList.remove("is-hot", "is-warn"));
      Object.values(wires).forEach((w) => w.classList.remove("is-on"));
      core.classList.remove("is-busy");
      log.innerHTML = "";
      ms = 118 - 40;
      renderCode(IN);
      setTab("in");
      await wait(700);
      hot("clio");
      wires.clio.classList.add("is-on");
      await travel(packets[0], wires.clio, 900);
      logLine("← WEBHOOK", "in", "clio matter.updated · HMAC verified");
      core.classList.add("is-busy");
      await wait(300);
      const lines = $$(".ap-ln", code);
      for (let i = 1; i < IN.length - 1; i++) {
        lines[i].classList.add("is-strike");
        await wait(260);
        lines[i].innerHTML = OUT[i];
        lines[i].classList.remove("is-strike");
        pulse(lines[i]);
        await wait(200);
      }
      setTab("out");
      logLine("TRANSFORM", "", "6 fields mapped · 1 file hashed");
      await wait(400);
      core.classList.remove("is-busy");
      ["sf", "qb", "pg"].forEach((k) => wires[k].classList.add("is-on"));
      await Promise.all([
        (async () => {
          await travel(packets[0], wires.sf, 950);
          hot("sf");
          logLine("→ PATCH", "out", "salesforce /sobjects/Account", "200 · 73ms", "ok");
        })(),
        (async () => {
          await wait(120);
          await travel(packets[1], wires.qb, 950);
          hot("qb", "is-warn");
          logLine("→ POST", "out", "quickbooks /v3/invoice", "429 · retry 400ms", "warn");
          await wait(700);
          await travel(packets[1], wires.qb, 700);
          nodes.qb.classList.remove("is-warn");
          hot("qb");
          logLine("→ POST", "out", "quickbooks /v3/invoice", "201 · 88ms", "ok");
        })(),
        (async () => {
          await wait(240);
          await travel(packets[2], wires.pg, 950);
          hot("pg");
          logLine("→ INSERT", "out", "postgres matters", "1 row · 9ms", "ok");
        })(),
      ]);
      await wait(3800);
    });
  };

  /* ================================================================== email */
  /* Messages land, entities are marked, a value score fills, each message is
     routed to a lane, and the high-value one gets a draft awaiting approval.
     Numbered hotspots on the mock point at the capability they illustrate. */
  VIZ.email = (root) => {
    const section = root.closest("section");
    const mail = $("[data-mail]", root);
    const f = (k) => $(`[data-${k}]`, mail);
    const gauge = $(".em-gauge__fill", root);
    const lanes = Object.fromEntries($$("[data-lane]", root).map((l) => [l.dataset.lane, l]));
    const draft = $("[data-draft]", root);
    const draftText = $("[data-draft-text]", root);
    const approve = $("[data-approve]", root);
    const sent = $("[data-sent]", root);
    const count = $("[data-count]", root);
    const caps = $$("[data-cap]", section);
    const hots = $$("[data-hot]", root);

    // hotspots ↔ capability list
    const setActive = (n) => {
      caps.forEach((c) => c.classList.toggle("is-active", c.dataset.cap === n));
      hots.forEach((h) => h.classList.toggle("is-active", h.dataset.hot === n));
      $$(".em-caps", section).forEach((w) => w.classList.toggle("has-active", !!n));
    };
    hots.forEach((h) => {
      h.addEventListener("click", () => {
        const on = h.classList.contains("is-active");
        setActive(on ? null : h.dataset.hot);
        if (!on && MOBILE()) caps.find((c) => c.dataset.cap === h.dataset.hot)?.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
      });
    });
    caps.forEach((c) => {
      c.addEventListener("pointerenter", () => hots.forEach((h) => h.classList.toggle("is-ping", h.dataset.hot === c.dataset.cap)));
      c.addEventListener("pointerleave", () => hots.forEach((h) => h.classList.remove("is-ping")));
    });

    let approveResolve = null;
    approve.addEventListener("click", () => {
      if (approve.disabled) return;
      approve.disabled = true;
      approve.textContent = "Sent";
      sent.textContent = "Sent 09:42 · approved by J. Ortiz";
      draft.classList.add("is-sent");
      approveResolve && approveResolve();
    });
    if (REDUCED) {
      approve.disabled = false;
      return;
    }
    root.classList.add("is-armed");

    const EMAILS = [
      {
        from: "Tom Reyes", av: "TR", subject: "Question about invoice #4471", score: 18, lane: "standard", chip: "T. Reyes · invoice",
        body: 'Could you resend <mark data-tag="ref">invoice #4471</mark>? Our AP team needs a copy that shows <mark data-tag="ref">PO number 88-120</mark> before <mark data-tag="date">Friday</mark>.',
      },
      {
        from: "Priya Nair", av: "PN", subject: "Lease dispute across three locations", score: 71, lane: "intake", chip: "Nair Hospitality · lease",
        body: 'Our landlord is claiming <mark data-tag="amount">$1.2M in back rent</mark> across <mark data-tag="matter">three restaurant locations</mark>. We received a <mark data-tag="date">notice of default on May 12</mark> and need advice this week.',
      },
      {
        from: "Dana Whitfield", av: "DW", subject: "Rear-end collision, need a lawyer", score: 86, lane: "senior", chip: "D. Whitfield · PI",
        body: 'I was rear-ended on I-95 on <mark data-tag="date">March 3</mark>. The other driver\'s insurer says the <mark data-tag="amount">policy limit is $250,000</mark>. I\'ve missed three weeks of work and have <mark data-tag="amount">medical bills over $40,000</mark>. Can someone call me about a <mark data-tag="matter">personal injury claim</mark>?',
      },
    ];
    const paras = $$("p", draftText);

    loopWhileVisible(root, async (wait) => {
      Object.values(lanes).forEach((l) => {
        $(".em-lane__n", l).textContent = "0";
        $(".em-lane__chips", l).innerHTML = "";
      });
      draft.classList.add("is-waiting");
      draft.classList.remove("is-sent");
      paras.forEach((p) => p.classList.remove("is-in"));
      approve.disabled = true;
      approve.textContent = "Approve & send";
      sent.textContent = "";
      count.textContent = "0";
      for (let i = 0; i < EMAILS.length; i++) {
        const e = EMAILS[i];
        mail.classList.remove("is-routed", "is-parsed");
        mail.classList.add("is-arriving");
        f("from").textContent = e.from;
        f("avatar").textContent = e.av;
        f("subject").textContent = e.subject;
        f("body").innerHTML = e.body;
        f("score").textContent = "0";
        gauge.style.strokeDashoffset = 100;
        count.textContent = String(i + 1);
        await wait(80);
        mail.classList.remove("is-arriving");
        await wait(900);
        mail.classList.add("is-parsed");
        await wait(700);
        gauge.style.strokeDashoffset = 100 - e.score;
        await tweenText(f("score"), 0, e.score, 800, (v) => String(Math.round(v)));
        await wait(700);
        mail.classList.add("is-routed");
        mail.dataset.lane = e.lane;
        const lane = lanes[e.lane];
        const chip = doc.createElement("li");
        chip.textContent = e.chip;
        $(".em-lane__chips", lane).appendChild(chip);
        $(".em-lane__n", lane).textContent = String($$("li", lane).length);
        pulse(lane, "is-ping");
        await wait(i === EMAILS.length - 1 ? 500 : 1100);
      }
      // the high-value message gets a draft
      mail.classList.remove("is-routed");
      draft.classList.remove("is-waiting");
      for (const p of paras) {
        p.classList.add("is-in");
        await wait(650);
      }
      approve.disabled = false;
      await Promise.race([wait(6500), new Promise((r) => (approveResolve = r))]);
      approveResolve = null;
      if (!approve.disabled) {
        sent.textContent = "Waiting for approval";
      }
      await wait(approve.disabled ? 3200 : 2600);
    });
  };

  /* =============================================================== docauto */
  /* Intake answers rebuild a template: clauses enter and leave, sections
     renumber, cross-references follow, and variable fields flash. */
  VIZ.docauto = (root) => {
    const form = $("[data-form]", root);
    const list = $("[data-clauses]", root);
    const countEl = $("[data-count]", root);
    const note = $("[data-note]", root);
    const status = $("[data-export-status]", root);
    form.addEventListener("submit", (e) => e.preventDefault());

    const LAW = {
      DE: "This Agreement is governed by the laws of the State of <var>Delaware</var>. The parties submit to the exclusive jurisdiction of the <var>Delaware Court of Chancery</var>.",
      NY: "This Agreement is governed by the laws of the State of <var>New York</var>. The parties submit to the exclusive jurisdiction of the state and federal courts located in <var>New York County</var>.",
      CA: "This Agreement is governed by the laws of the State of <var>California</var>. The parties submit to the exclusive jurisdiction of the state and federal courts located in <var>San Francisco County</var>.",
    };
    const read = () => {
      const fd = new FormData(form);
      return {
        party: (fd.get("party") || "").trim() || "Counterparty",
        law: fd.get("law"),
        fee: fd.get("fee"),
        term: fd.get("term"),
        nonsolicit: fd.get("nonsolicit") === "on",
      };
    };
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const build = (s) =>
      [
        { id: "parties", t: "Parties", b: `This Master Services Agreement is entered into by Bespoke Client LLC (“Client”) and <var>${esc(s.party)}</var> (“Provider”).` },
        { id: "services", t: "Services", b: "Provider shall perform the services described in each Statement of Work executed under this Agreement." },
        s.fee === "fixed"
          ? { id: "fees", t: "Fees", b: "Client shall pay a fixed fee of <var>$48,000</var>, invoiced in four equal quarterly installments." }
          : { id: "fees", t: "Fees", b: 'Client shall pay for Services at the <var>hourly rates in Schedule B</var>, invoiced monthly in arrears and subject to the cap in <ref data-to="cap"></ref>.' },
        s.fee === "hourly" && { id: "cap", t: "Fee cap", b: "Fees under any Statement of Work shall not exceed the cap stated in it without Client’s prior written approval." },
        { id: "term", t: "Term", b: `This Agreement begins on the Effective Date and continues for <var>${s.term} months</var>, then renews for successive twelve-month periods.` },
        s.nonsolicit && s.law !== "CA" && { id: "nonsol", t: "Non-solicitation", b: 'During the Term and for twelve months after, neither party shall solicit any employee of the other who performed work under <ref data-to="services"></ref>.' },
        { id: "conf", t: "Confidentiality", b: 'Each party shall protect the other’s Confidential Information. These obligations survive for three years after the Term described in <ref data-to="term"></ref>.' },
        { id: "law", t: "Governing law", b: LAW[s.law] },
      ].filter(Boolean);

    const live = new Map();
    let first = true;
    const render = () => {
      const s = read();
      const items = build(s);
      const num = Object.fromEntries(items.map((it, i) => [it.id, i + 1]));
      note.hidden = !(s.nonsolicit && s.law === "CA");
      note.textContent = "Non-solicitation omitted: California limits restrictive covenants (Bus. & Prof. Code §16600).";
      const keep = new Set(items.map((i) => i.id));
      live.forEach((li, id) => {
        if (keep.has(id) || li.classList.contains("is-leave")) return;
        li.classList.add("is-leave");
        live.delete(id);
        setTimeout(() => li.remove(), REDUCED ? 0 : 380);
      });
      let prev = null;
      items.forEach((it, i) => {
        let li = live.get(it.id);
        const fresh = !li;
        if (fresh) {
          li = doc.createElement("li");
          li.className = "da-clause";
          li.innerHTML = `<span class="da-clause__no"></span><div><b class="da-clause__t"></b><p class="da-clause__b"></p></div>`;
          live.set(it.id, li);
          if (!first && !REDUCED) li.classList.add("is-enter");
        }
        const body = it.b.replace(/<ref data-to="(\w+)"><\/ref>/g, (_, to) => `<ref>§${num[to]}</ref>`);
        const noEl = $(".da-clause__no", li);
        if (noEl.textContent !== `${i + 1}.`) {
          if (!fresh) pulse(noEl);
          noEl.textContent = `${i + 1}.`;
        }
        $(".da-clause__t", li).textContent = it.t;
        const bEl = $(".da-clause__b", li);
        if (bEl.innerHTML !== body) {
          const before = bEl.innerHTML;
          bEl.innerHTML = body;
          if (!fresh && before) {
            const oldVars = before.match(/<(var|ref)>.*?<\/\1>/g) || [];
            $$("var, ref", bEl).forEach((v) => {
              if (!oldVars.includes(v.outerHTML)) pulse(v);
            });
          }
        }
        const anchor = prev ? prev.nextSibling : list.firstChild;
        if (li !== anchor) list.insertBefore(li, anchor);
        if (li.classList.contains("is-enter")) requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove("is-enter")));
        prev = li;
      });
      countEl.textContent = String(items.length);
      first = false;
    };
    render();

    let touched = false;
    form.addEventListener("input", (e) => {
      if (e.isTrusted) touched = true;
      render();
    });
    form.addEventListener("change", (e) => {
      if (e.isTrusted) touched = true;
      render();
    });

    $$("[data-export]", root).forEach((b) =>
      b.addEventListener("click", async () => {
        const s = read();
        const slug = s.party.split(/[\s,]+/)[0].replace(/[^\w-]/g, "") || "Draft";
        const ext = { pdf: "pdf", docx: "docx", sign: "zip" }[b.dataset.export];
        status.classList.remove("is-done");
        status.textContent = "Generating…";
        await new Promise((r) => setTimeout(r, REDUCED ? 0 : 900));
        status.classList.add("is-done");
        status.textContent = `✓ MSA_${slug}_${s.law}.${ext} · ${list.children.length + 1} pages`;
      })
    );

    if (REDUCED) return;
    const set = (name, value) => {
      const els = form.elements[name];
      if (els instanceof RadioNodeList) {
        [...els].forEach((r) => (r.checked = r.value === value));
      } else if (els.type === "checkbox") {
        els.checked = value;
      } else {
        els.value = value;
      }
      const target = els instanceof RadioNodeList ? [...els].find((r) => r.checked) : els;
      target.closest("label, .da-field")?.classList.add("is-auto");
      setTimeout(() => target.closest("label, .da-field")?.classList.remove("is-auto"), 900);
      render();
    };
    const SCRIPT = [
      ["law", "NY"],
      ["fee", "hourly"],
      ["term", "36"],
      ["law", "CA"],
      ["nonsolicit", false],
      ["fee", "fixed"],
      ["nonsolicit", true],
      ["law", "DE"],
      ["term", "24"],
    ];
    const stop = loopWhileVisible(root, async (wait) => {
      await wait(1400);
      for (const [k, v] of SCRIPT) {
        if (touched) return stop();
        set(k, v);
        await wait(2300);
      }
    });
  };

  /* ===================================================================== kb */
  /* Document chunks sit in a 2D meaning space. A question retrieves its
     nearest chunks, skips restricted ones, and evidence cards stack up. */
  VIZ.kb = (root) => {
    const svgDots = $("[data-dots]", root);
    const svgLinks = $("[data-links]", root);
    const query = $("[data-query]", root);
    const qBtns = $$("[data-q]", root);
    const answer = $("[data-answer]", root);
    const meta = $("[data-meta]", root);
    const evidence = $("[data-evidence]", root);
    const NS = "http://www.w3.org/2000/svg";

    let seed = 20260914;
    const rnd = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const SOURCES = ["drive", "sp", "notion", "pdf"];
    const CLUSTERS = [
      { cx: 150, cy: 120, lock: 0 },
      { cx: 385, cy: 120, lock: 0 },
      { cx: 380, cy: 310, lock: 4 },
      { cx: 140, cy: 305, lock: 2 },
    ];
    const dots = [];
    CLUSTERS.forEach((c, ci) => {
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2, r = 12 + Math.sqrt(rnd()) * 78;
        dots.push({
          x: clamp(c.cx + Math.cos(a) * r, 16, 504),
          y: clamp(c.cy + Math.sin(a) * r * 0.8, 16, 404),
          src: SOURCES[Math.floor(rnd() * 4)],
          lock: i < c.lock,
          cluster: ci,
        });
      }
    });
    // locked chunks sit near the center of their cluster so they compete
    dots.forEach((d) => {
      if (!d.lock) return;
      const c = CLUSTERS[d.cluster];
      d.x = c.cx + (rnd() - 0.5) * 50;
      d.y = c.cy + (rnd() - 0.5) * 40;
    });
    dots.forEach((d) => {
      const g = doc.createElementNS(NS, "g");
      g.setAttribute("class", `kb-dot kb-dot--${d.src}${d.lock ? " is-locked" : ""}`);
      g.setAttribute("transform", `translate(${d.x.toFixed(1)},${d.y.toFixed(1)})`);
      g.innerHTML = d.lock
        ? '<circle r="7" class="kb-dot__ring"/><rect x="-3.2" y="-1" width="6.4" height="4.6" rx="1"/><path d="M-1.9,-1 v-1.4 a1.9,1.9 0 0 1 3.8,0 v1.4" fill="none"/>'
        : '<circle r="5.5"/>';
      svgDots.appendChild(g);
      d.el = g;
    });

    const QS = [
      {
        at: [222, 178], acc: 3, lock: 0,
        answer: "Employees can carry over up to 40 hours of unused PTO into the next plan year. Anything above the cap is forfeited on January 31.",
        cards: [
          ["“Up to forty (40) hours of accrued, unused PTO may be carried into the following plan year.”", "SharePoint › HR › Policies › PTO-Policy-2026.pdf", "p. 4", 0.91],
          ["“Carryover balances exceeding the cap are forfeited on January 31.”", "Notion › People Ops › Handbook › Time off", "§2", 0.86],
          ["“Carryover applies to part-time staff, prorated to scheduled hours.”", "Drive › HR › FAQ › Benefits-FAQ.docx", "p. 2", 0.78],
        ],
      },
      {
        at: [318, 176], acc: 3, lock: 0,
        answer: "New vendors need a W-9, a signed MSA and a completed security questionnaire before procurement can issue a purchase order.",
        cards: [
          ["“No purchase order is issued until the W-9, MSA and security questionnaire are on file.”", "SharePoint › Operations › SOPs › Vendor-Onboarding.pdf", "p. 2", 0.93],
          ["“Vendors handling client data complete the security questionnaire (SIG Lite).”", "Notion › Procurement › Checklist", "step 3", 0.84],
          ["“Use MSA template v7 unless Legal approves the vendor's paper.”", "Drive › Legal › Templates › MSA-v7.docx", "p. 1", 0.8],
        ],
      },
      {
        at: [304, 262], acc: 1, lock: 2,
        answer: "One accessible source lists Arden Retail as requiring an annual SOC 2 Type II report. Two other matches are restricted to the Partner group and were not used.",
        cards: [
          ["“Arden Retail: annual SOC 2 Type II report due each March.”", "PDF vault › Client Ops › Security-Requirements.pdf", "p. 6", 0.82],
          [null, "PDF vault › Partners › Client-Audit-Clauses.pdf", "restricted", 0.9],
          [null, "SharePoint › Partners › Engagement-Terms-2026.xlsx", "restricted", 0.88],
        ],
      },
    ];

    const select = (qi, animate = true) => {
      const q = QS[qi];
      qBtns.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.q === qi)));
      query.setAttribute("transform", `translate(${q.at[0]},${q.at[1]})`);
      query.style.transform = `translate(${q.at[0]}px, ${q.at[1]}px)`;
      const byDist = dots
        .map((d) => ({ d, dist: Math.hypot(d.x - q.at[0], d.y - q.at[1]) }))
        .sort((a, b) => a.dist - b.dist);
      const acc = byDist.filter((o) => !o.d.lock).slice(0, q.acc).map((o) => o.d);
      const lock = byDist.filter((o) => o.d.lock).slice(0, q.lock).map((o) => o.d);
      dots.forEach((d) => {
        d.el.classList.toggle("is-hit", acc.includes(d));
        d.el.classList.toggle("is-denied", lock.includes(d));
      });
      root.classList.add("has-query");
      svgLinks.innerHTML = "";
      [...acc, ...lock].forEach((d, i) => {
        const l = doc.createElementNS(NS, "line");
        l.setAttribute("x1", q.at[0]);
        l.setAttribute("y1", q.at[1]);
        l.setAttribute("x2", d.x);
        l.setAttribute("y2", d.y);
        l.setAttribute("class", d.lock ? "is-denied" : "");
        l.style.setProperty("--d", `${i * 90}ms`);
        svgLinks.appendChild(l);
      });
      answer.textContent = q.answer;
      meta.textContent = `${q.acc} source${q.acc > 1 ? "s" : ""} · ${q.lock} excluded`;
      evidence.innerHTML = q.cards
        .map(
          ([quote, path, loc, rel], i) =>
            `<li class="kb-card${quote ? "" : " kb-card--locked"}" style="--d:${i * 140}ms">${
              quote
                ? `<p class="kb-card__q">${quote}</p>`
                : `<p class="kb-card__q">Excluded · requires <b>Partner</b> role</p>`
            }<p class="kb-card__src"><span>${path}</span><span>${loc}</span></p><span class="kb-card__rel"><i style="--r:${rel}"></i>${rel.toFixed(2)}</span></li>`
        )
        .join("");
      if (animate && !REDUCED) {
        pulse(answer, "is-in");
        pulse(root, "is-retrieving");
      }
    };
    select(0, false);

    let touched = false;
    qBtns.forEach((b) =>
      b.addEventListener("click", () => {
        touched = true;
        select(+b.dataset.q);
      })
    );
    if (REDUCED) return;
    let qi = 0;
    const stop = loopWhileVisible(root, async (wait) => {
      await wait(5200);
      if (touched) return stop();
      qi = (qi + 1) % QS.length;
      select(qi);
    });
  };

  /* ============================================================ realestate */
  /* A stacking plan coloured by lease expiry. Selecting a suite opens the
     abstracted lease with a rent-step chart; building metrics recompute. */
  VIZ.realestate = (root) => {
    const stack = $("[data-stack]", root);
    const kv = $("[data-kv]", root);
    const stepsSvg = $("[data-steps]", root);
    const tenantEl = $('[data-f="tenant"]', root);
    const suiteEl = $('[data-f="suite"]', root);
    const M = Object.fromEntries($$("[data-m]", root).map((m) => [m.dataset.m, m]));
    const abstract = $("[data-abstract]", root);

    const FLOORS = [
      [8, [["800", "Halvorsen Capital", 18400, 2031, 64, 10]]],
      [7, [["700", "Brightline Health", 9800, 2027, 58, 7], ["720", null, 4200, 0, 58], ["740", "Ortega & Pike LLP", 4400, 2029, 61, 5]]],
      [6, [["600", "Northwind Analytics", 12600, 2026, 55, 5], ["650", "Keel Studio", 5800, 2028, 57, 5]]],
      [5, [["500", "Meridian Title", 7200, 2030, 59, 7], ["540", null, 5600, 0, 57], ["570", "Cask & Co.", 5600, 2027, 54, 5]]],
      [4, [["400", "Arden Retail HQ", 18400, 2029, 60, 10]]],
      [3, [["300", "Juniper Dental", 6100, 2026, 52, 5], ["330", "Parcel Labs", 12300, 2028, 56, 7]]],
      [2, [["200", "Summit Staffing", 9200, 2027, 53, 5], ["250", null, 9200, 0, 52]]],
      [1, [["100", "Blue Fern Café", 3400, 2032, 72, 10], ["120", "First Harbor Bank", 6200, 2030, 78, 10], ["lobby", "Lobby & common", 8800, -1, 0]]],
    ];
    const PRICE = 88e6, OPEX = 12, LTV = 0.6, RATE = 0.061, NOW = 2026.7;
    const suites = [];
    FLOORS.forEach(([n, list]) => {
      const row = doc.createElement("div");
      row.className = "re-floor";
      row.innerHTML = `<span class="re-floor__n">${n}</span><div class="re-floor__suites"></div>`;
      const wrap = $(".re-floor__suites", row);
      list.forEach(([id, tenant, rsf, exp, rent, term], k) => {
        const s = { id, tenant, rsf, exp, rent, term, floor: n, idx: suites.length };
        const band = exp === -1 ? "common" : !tenant ? "vac" : exp <= 2026 ? "26" : exp === 2027 ? "27" : exp <= 2029 ? "28" : "30";
        const el = doc.createElement(exp === -1 ? "div" : "button");
        el.className = `re-suite re-suite--${band}`;
        el.style.flexGrow = rsf;
        if (exp !== -1) {
          el.type = "button";
          el.setAttribute("aria-pressed", "false");
          el.setAttribute("aria-label", `Suite ${id}, ${tenant || "vacant"}, ${fmt(rsf)} RSF${tenant ? `, expires ${exp}` : ""}`);
        }
        el.innerHTML = `<b>${exp === -1 ? "" : id}</b><span>${tenant || (exp === -1 ? tenant : "Vacant")}</span><small>${fmt(rsf)} RSF${tenant && exp > 0 ? ` · ${exp}` : ""}</small>`;
        if (exp === -1) el.querySelector("span").textContent = tenant;
        wrap.appendChild(el);
        s.el = el;
        suites.push(s);
      });
      stack.appendChild(row);
    });
    const leasable = suites.filter((s) => s.exp !== -1);
    const totalRsf = leasable.reduce((a, s) => a + s.rsf, 0);

    const metrics = (extra) => {
      const occ = leasable.filter((s) => s.tenant);
      let gross = occ.reduce((a, s) => a + s.rsf * s.rent, 0);
      let occRsf = occ.reduce((a, s) => a + s.rsf, 0);
      let waltNum = occ.reduce((a, s) => a + s.rsf * (s.exp + 0.5 - NOW), 0);
      if (extra) {
        gross += extra.rsf * extra.rent;
        occRsf += extra.rsf;
        waltNum += extra.rsf * 7;
      }
      const noi = gross - OPEX * totalRsf;
      const debt = PRICE * LTV * RATE;
      return {
        occ: `${((occRsf / totalRsf) * 100).toFixed(1)}%`,
        walt: `${(waltNum / occRsf).toFixed(1)} yrs`,
        noi: `$${(noi / 1e6).toFixed(2)}M`,
        cap: `${((noi / PRICE) * 100).toFixed(2)}%`,
        coc: `${(((noi - debt) / (PRICE * (1 - LTV))) * 100).toFixed(2)}%`,
      };
    };
    const base = metrics();
    const showMetrics = (m, scenario) => {
      Object.entries(m).forEach(([k, v]) => {
        if (M[k].textContent !== v) {
          M[k].textContent = v;
          if (scenario !== undefined) pulse(M[k]);
        }
        M[k].classList.toggle("is-scenario", !!scenario && v !== base[k]);
      });
    };

    const money = (n) => `$${fmt(Math.round(n))}`;
    const select = (s) => {
      suites.forEach((o) => o.el.getAttribute && o.el.setAttribute && o.exp !== -1 && o.el.setAttribute("aria-pressed", String(o === s)));
      abstract.classList.remove("is-swap");
      void abstract.offsetWidth;
      abstract.classList.add("is-swap");
      if (!s.tenant) {
        tenantEl.textContent = "Vacant suite";
        suiteEl.textContent = `Suite ${s.id} · ${fmt(s.rsf)} RSF · floor ${s.floor}`;
        kv.innerHTML = [
          ["Market rent", `$${s.rent.toFixed(2)} / RSF / yr`, "broker comps, Q3"],
          ["Scenario", `7-year lease at market`, "underwriting model"],
          ["Added base rent", money(s.rsf * s.rent), "year 1"],
          ["TI allowance", "$65 / RSF", "leasing guidelines §2"],
        ]
          .map(([k, v, ref]) => `<div><dt>${k}</dt><dd>${v}<cite>${ref}</cite></dd></div>`)
          .join("");
        drawSteps(s.rent, 7, 0.03, s.rsf);
        showMetrics(metrics(s), true);
        abstract.classList.add("is-vacant");
        return;
      }
      abstract.classList.remove("is-vacant");
      const esc = s.idx % 3 === 0 ? 0.03 : s.idx % 3 === 1 ? 0.025 : 0.035;
      const start = s.exp - s.term;
      const p = 3 + ((s.idx * 7) % 9);
      tenantEl.textContent = s.tenant;
      suiteEl.textContent = `Suite ${s.id} · ${fmt(s.rsf)} RSF · floor ${s.floor}`;
      kv.innerHTML = [
        ["Term", `Jan ${start} – Dec ${s.exp - 1 >= start ? s.exp - 1 : s.exp}`, `§3.1 · p.${p}`],
        ["Base rent", `$${s.rent.toFixed(2)} / RSF / yr`, `§4.1 · p.${p + 2}`],
        ["Escalation", `${(esc * 100).toFixed(1)}% annually`, `§4.2 · p.${p + 2}`],
        ["Renewal", s.term >= 7 ? "2 × 5 yrs at 95% FMV" : "1 × 5 yrs at FMV", `§24.1 · p.${p + 28}`],
        ["Termination", s.term >= 7 ? "Year 5 · 9 mo notice · unamortized TI" : "None", `§26.3 · p.${p + 31}`],
      ]
        .map(([k, v, ref]) => `<div><dt>${k}</dt><dd>${v}<cite>${ref}</cite></dd></div>`)
        .join("");
      drawSteps(s.rent / Math.pow(1 + esc, Math.max(0, Math.floor(NOW) - start)), s.term, esc, s.rsf, Math.floor(NOW) - start);
      showMetrics(base, false);
    };

    const drawSteps = (rent0, years, esc, rsf, current = -1) => {
      const vals = Array.from({ length: years }, (_, i) => rent0 * Math.pow(1 + esc, i) * rsf);
      const max = Math.max(...vals);
      const w = 300 / years;
      stepsSvg.innerHTML = vals
        .map((v, i) => {
          const h = 16 + (v / max) * 66;
          return `<rect x="${(i * w + 2).toFixed(1)}" y="${(90 - h).toFixed(1)}" width="${(w - 4).toFixed(1)}" height="${h.toFixed(1)}" class="${i === current ? "is-now" : ""}" style="--d:${i * 50}ms"/>`;
        })
        .join("");
      stepsSvg.setAttribute("aria-label", `${money(vals[0])} in year 1 rising to ${money(vals[vals.length - 1])}`);
    };

    let touched = false;
    leasable.forEach((s) =>
      s.el.addEventListener("click", () => {
        touched = true;
        select(s);
      })
    );
    const byId = (id) => suites.find((s) => s.id === id);
    select(byId("600"));
    showMetrics(base);
    if (REDUCED) return;
    const TOUR = ["720", "800", "330", "600"];
    const stop = loopWhileVisible(root, async (wait) => {
      for (const id of TOUR) {
        await wait(3600);
        if (touched) return stop();
        select(byId(id));
      }
    });
  };

  /* =============================================================== legaldoc */
  /* Scroll-driven: each margin note that reaches the middle of the viewport
     applies its change to the sticky agreement. States are cumulative. */
  VIZ.legaldoc = (root) => {
    const page = $("[data-page]", root);
    const notes = $$(".ld-note", root);
    const setState = (n) => {
      [1, 2, 3, 4].forEach((i) => page.classList.toggle(`s${i}`, i <= n));
      notes.forEach((note) => note.classList.toggle("is-current", +note.dataset.step === n));
    };
    if (REDUCED || !("IntersectionObserver" in window)) return;
    const stacked = () => window.matchMedia("(max-width: 960px)").matches;
    root.classList.add("is-armed");
    setState(0);
    let current = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (stacked()) return;
        entries.forEach((en) => {
          const step = +en.target.dataset.step;
          if (en.isIntersecting) current = step;
          else if (en.boundingClientRect.top > 0 && step === current) current = step - 1;
        });
        setState(current);
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    notes.forEach((n) => io.observe(n));
    const onResize = () => {
      if (stacked()) {
        root.classList.remove("is-armed");
        setState(4);
        notes.forEach((n) => n.classList.remove("is-current"));
      } else {
        root.classList.add("is-armed");
        setState(current);
      }
    };
    window.addEventListener("resize", onResize);
    onResize();
  };

  /* =============================================================== workflow */
  /* A matter board that moves itself. Each move shows the rule that fired;
     deadlines land on the week strip. */
  VIZ.workflow = (root) => {
    const cols = Object.fromEntries($$("[data-col]", root).map((c) => [c.dataset.col, c]));
    const rule = $("[data-rule]", root);
    const whenEl = $("[data-when]", root);
    const thenEl = $("[data-then]", root);
    const days = $$(".lw-day ul", root);

    const CARDS = {
      reyes: { t: "Reyes v. Coastal Freight", a: "Personal injury", who: "AC" },
      chen: { t: "Chen Family Trust", a: "Estate planning", who: "MK" },
      park: { t: "Estate of M. Park", a: "Probate", who: "AC" },
      delgado: { t: "Delgado v. Metro Transit", a: "Personal injury", who: "JO" },
      hartwell: { t: "Hartwell & Co.", a: "Contract review", who: "MK" },
    };
    const START = { intake: [], conflict: [], signed: ["chen"], active: ["park", "delgado"], billing: ["hartwell"] };
    const els = {};
    const makeCard = (id) => {
      const c = CARDS[id];
      const el = doc.createElement("div");
      el.className = "lw-card";
      el.dataset.id = id;
      el.innerHTML = `<b>${c.t}</b><span>${c.a}</span><div class="lw-card__foot"><i class="lw-card__who">${c.who}</i><em class="lw-card__badge"></em></div>`;
      els[id] = el;
      return el;
    };
    const counts = () =>
      Object.values(cols).forEach((c) => ($(".lw-col__head b", c).textContent = $$(".lw-card", c).length));
    const reset = () => {
      Object.values(cols).forEach((c) => ($(".lw-col__list", c).innerHTML = ""));
      Object.entries(START).forEach(([col, ids]) => ids.forEach((id) => $(".lw-col__list", cols[col]).appendChild(makeCard(id))));
      days.forEach((d) => (d.innerHTML = ""));
      counts();
    };
    const move = async (id, to) => {
      const el = els[id];
      const first = el.getBoundingClientRect();
      $(".lw-col__list", cols[to]).appendChild(el);
      const last = el.getBoundingClientRect();
      counts();
      if (REDUCED) return;
      el.animate(
        [
          { transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) rotate(-2deg)`, boxShadow: "0 20px 40px -18px rgba(12,26,58,.45)" },
          { transform: "none", boxShadow: "0 1px 2px rgba(12,26,58,.08)" },
        ],
        { duration: 700, easing: "cubic-bezier(0.45,0,0.25,1)" }
      );
      cols[to].classList.remove("is-drop");
      void cols[to].offsetWidth;
      cols[to].classList.add("is-drop");
    };
    const fire = (when, then) => {
      whenEl.textContent = when;
      thenEl.textContent = then;
      pulse(rule, "is-fired");
    };
    const badge = (id, text) => {
      const b = $(".lw-card__badge", els[id]);
      b.textContent = text;
      pulse(els[id], "is-touched");
    };
    const deadline = (day, text) => {
      const li = doc.createElement("li");
      li.textContent = text;
      days[day].appendChild(li);
    };
    const add = (id, col) => {
      const el = makeCard(id);
      $(".lw-col__list", cols[col]).appendChild(el);
      counts();
      pulse(el, "is-new");
    };

    const STEPS = [
      () => (add("reyes", "intake"), fire("a web intake form is submitted", "create lead · run conflict search")),
      () => (move("reyes", "conflict"), badge("reyes", "0 conflicts · 12,408 contacts"), fire("the conflict search comes back clear", "send engagement letter via DocuSign")),
      () => (move("reyes", "signed"), badge("reyes", "Signed 10:14"), fire("the engagement letter is signed", "create matter in Clio · assign A. Chen · due in 3 days"), deadline(2, "Reyes · initial disclosures")),
      () => (badge("park", "Filed: death certificate.pdf"), fire("a client email arrives with an attachment", "file to Matter 2026-0388 › Correspondence · draft reply")),
      () => (move("chen", "active"), badge("chen", "Retainer received"), fire("the retainer payment posts", "open matter tasks · notify M. Keane"), deadline(3, "Chen · asset inventory")),
      () => (move("delgado", "billing"), badge("delgado", "Final invoice drafted"), fire("the matter phase is set to Closing", "generate final invoice in Clio"), deadline(4, "Delgado · invoice review")),
    ];

    reset();
    if (REDUCED) {
      STEPS.forEach((s) => s());
      return;
    }
    root.classList.add("is-armed");
    STEPS.forEach((s) => s());
    let first = true;
    loopWhileVisible(root, async (wait) => {
      if (!first) await wait(3200);
      first = false;
      reset();
      rule.classList.remove("is-fired");
      whenEl.textContent = "…";
      thenEl.textContent = "watching 14 rules";
      await wait(900);
      for (const s of STEPS) {
        s();
        await wait(2300);
      }
    });
  };

  /* ==================================================================== crm */
  /* A Sankey of inquiries narrowing to retained matters with particles, and
     a client portal whose milestones and document requests progress. */
  VIZ.crm = (root) => {
    const NS = "http://www.w3.org/2000/svg";
    const bands = $("[data-bands]", root);
    const parts = $("[data-particles]", root);
    const labels = $("[data-labels]", root);
    const flow = $(".cr-flow", root);

    const STAGES = [
      ["Inquiries", 240], ["Qualified", 142], ["Consult booked", 96], ["Fee agreement sent", 71], ["Retained", 58],
    ];
    const DROPS = [
      [["Not a fit", 98]],
      [["No response", 37], ["Conflict found", 9]],
      [["Declined", 25]],
      [["Still deciding", 13]],
    ];
    const X = [20, 190, 360, 530, 700 - 10];
    const TOP = 50, K = 0.72, NODE = 10;
    const el = (tag, attrs, parent) => {
      const n = doc.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      parent.appendChild(n);
      return n;
    };
    const band = (x0, a0, b0, x1, a1, b1) => {
      const m = (x0 + x1) / 2;
      return `M${x0},${a0} C${m},${a0} ${m},${a1} ${x1},${a1} L${x1},${b1} C${m},${b1} ${m},${b0} ${x0},${b0} Z`;
    };
    const routes = [];
    STAGES.forEach(([name, v], i) => {
      const h = v * K;
      el("rect", { x: X[i], y: TOP, width: NODE, height: h, rx: 2, class: "cr-node", style: `--d:${i * 160}ms` }, bands);
      const tx = i === STAGES.length - 1 ? X[i] + NODE : X[i];
      const anchor = i === STAGES.length - 1 ? "end" : "start";
      el("text", { x: tx, y: TOP - 22, class: "cr-label__v", "text-anchor": anchor }, labels).textContent = v;
      el("text", { x: tx, y: TOP - 8, class: "cr-label__n", "text-anchor": anchor }, labels).textContent = name;
      if (i === STAGES.length - 1) return;
      const next = STAGES[i + 1][1];
      el("path", { d: band(X[i] + NODE, TOP, TOP + next * K, X[i + 1], TOP, TOP + next * K), class: "cr-band", style: `--d:${i * 160 + 80}ms` }, bands);
      routes.push({ from: X[i] + NODE, to: X[i + 1], top: TOP, h: next * K });
      let y = TOP + next * K;
      let dy = 258;
      DROPS[i].forEach(([dn, dv], k) => {
        const dh = dv * K;
        const dx = X[i] + 70;
        el("path", { d: band(X[i] + NODE, y, y + dh, dx, dy, dy + dh), class: "cr-band cr-band--drop", style: `--d:${i * 160 + 140}ms` }, bands);
        el("rect", { x: dx, y: dy, width: 4, height: dh, class: "cr-node cr-node--drop" }, bands);
        el("text", { x: dx + 10, y: dy + Math.min(dh, 30) / 2 + 4, class: "cr-label__drop" }, labels).textContent = `${dn} · ${dv}`;
        y += dh;
        dy += dh + 10;
      });
    });

    // portal
    const miles = $$(".cr-miles li", root);
    const mile = $("[data-mile]", root);
    const bar = $("[data-mile] i", root);
    const pct = $("[data-mile] small", root);
    const docs = $$("[data-doc]", root);
    const toast = $("[data-toast]", root);
    if (REDUCED) return;
    root.classList.add("is-armed");

    // particles along the main flow, some peeling off at each stage
    let raf = 0, last = 0;
    const live = [];
    const spawn = () => {
      const r = Math.random();
      const lane = Math.random();
      live.push({ x: X[0] + NODE, lane, stop: r < 0.41 ? 0 : r < 0.6 ? 1 : r < 0.7 ? 2 : r < 0.76 ? 3 : 4, drop: 0, y: 0, n: el("circle", { r: 2.6, class: "cr-dot" }, parts) });
    };
    const tick = (now) => {
      if (now - last > 180) {
        spawn();
        last = now;
      }
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i];
        const seg = routes.findIndex((r) => p.x >= r.from && p.x < r.to);
        if (p.drop) {
          p.drop += 1.4;
          p.x += 0.6;
          p.y += p.drop * 0.08;
        } else {
          p.x += 1.7;
          const r = routes[seg] || routes[routes.length - 1];
          const h = r ? r.h : 0;
          p.y = TOP + 3 + p.lane * Math.max(4, h - 6);
          if (seg >= 0 && seg === p.stop && p.x > routes[seg].from + 6 && p.stop < 4) {
            p.drop = 1;
          }
        }
        p.n.setAttribute("cx", p.x.toFixed(1));
        p.n.setAttribute("cy", p.y.toFixed(1));
        if (p.x > X[4] + NODE || p.y > 350) {
          p.n.remove();
          live.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    whenVisible(
      flow,
      () => {
        flow.classList.add("is-in");
        raf = requestAnimationFrame(tick);
      },
      () => cancelAnimationFrame(raf),
      0.2
    );

    loopWhileVisible($("[data-phone]", root), async (wait) => {
      toast.classList.remove("is-in");
      docs.forEach((d, i) => d.classList.toggle("is-done", i < 1));
      miles.forEach((m) => m.classList.remove("is-flash"));
      bar.style.setProperty("--p", 0.38);
      pct.lastChild.textContent = "38%";
      await wait(900);
      docs[1].classList.add("is-done");
      await wait(900);
      bar.style.setProperty("--p", 0.58);
      tweenText(pct.lastChild, 38, 58, 700, (v) => `${Math.round(v)}%`);
      await wait(1100);
      docs[2].classList.add("is-done");
      await wait(700);
      bar.style.setProperty("--p", 0.72);
      tweenText(pct.lastChild, 58, 72, 700, (v) => `${Math.round(v)}%`);
      pulse(mile);
      await wait(900);
      toast.classList.add("is-in");
      await wait(4200);
    });
  };

  /* ==================================================================== lms */
  /* A course as a transit map. Stations compile from the syllabus, then
     learners ride it; a low checkpoint score reroutes through review. */
  VIZ.lms = (root) => {
    const section = root.closest("section");
    const stations = $$(".lm-st", root);
    const rider = $("[data-rider]", root);
    const trail = $("[data-trail]", root);
    const bubble = $("[data-bubble]", root);
    const bubbleText = $("[data-bubble-text]", root);
    const learner = $("[data-learner]", root);
    const compiled = $("[data-compiled]", root);
    const callouts = $$(".lm-callout", section);

    // callout hover lights its stations
    callouts.forEach((c) => {
      const on = (v) => {
        root.classList.toggle("has-focus", v);
        stations.forEach((s) => s.classList.toggle("is-focus", v && s.dataset.g === c.dataset.g));
        c.classList.toggle("is-focus", v);
      };
      c.addEventListener("pointerenter", () => on(true));
      c.addEventListener("pointerleave", () => on(false));
      c.addEventListener("focusin", () => on(true));
      c.addEventListener("focusout", () => on(false));
    });
    if (REDUCED) return;
    root.classList.add("is-armed");

    const NS = "http://www.w3.org/2000/svg";
    const ROUTE_B = "M80,170 L530,170 L600,240 L700,240 L770,170 L1020,170";
    const ROUTE_A = "M80,170 L1020,170";
    const probe = doc.createElementNS(NS, "path");
    const pos = (s) => {
      const m = /translate\(([\d.]+),([\d.]+)\)/.exec(s.getAttribute("transform"));
      return { x: +m[1], y: +m[2] };
    };
    const lengthsFor = (d) => {
      probe.setAttribute("d", d);
      const L = probe.getTotalLength();
      return stations.map((s) => {
        const p = pos(s);
        let best = Infinity, at = -1;
        for (let l = 0; l <= L; l += 4) {
          const q = probe.getPointAtLength(l);
          const dist = Math.hypot(q.x - p.x, q.y - p.y);
          if (dist < best) {
            best = dist;
            at = l;
          }
        }
        return best < 3 ? at : -1;
      });
    };
    const R = {
      A: { d: ROUTE_A, at: lengthsFor(ROUTE_A) },
      B: { d: ROUTE_B, at: lengthsFor(ROUTE_B) },
    };

    const ride = (route, from, to, ms) =>
      new Promise((res) => {
        trail.setAttribute("d", route.d);
        const L = trail.getTotalLength();
        trail.style.strokeDasharray = L;
        const t0 = performance.now();
        const step = (now) => {
          const t = clamp((now - t0) / ms, 0, 1);
          const l = lerp(from, to, t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
          const p = trail.getPointAtLength(l);
          rider.setAttribute("cx", p.x);
          rider.setAttribute("cy", p.y);
          trail.style.strokeDashoffset = L - l;
          route.at.forEach((a, i) => a >= 0 && a <= l + 1 && stations[i].classList.add("is-visited"));
          t < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });

    let built = false;
    let turn = 0;
    loopWhileVisible(root, async (wait) => {
      stations.forEach((s) => s.classList.remove("is-visited"));
      bubble.classList.remove("is-in", "is-warn");
      if (!built) {
        stations.forEach((s) => s.classList.remove("is-built"));
        root.classList.add("is-compiling");
        await wait(400);
        const order = [0, 1, 2, 3, 6, 7, 8, 4, 5];
        for (let i = 0; i < order.length; i++) {
          stations[order[i]].classList.add("is-built");
          compiled.textContent = String(Math.min(7, i + 1));
          await wait(220);
        }
        root.classList.remove("is-compiling");
        built = true;
        await wait(600);
      }
      const low = turn % 2 === 0;
      const route = low ? R.B : R.A;
      const quizAt = route.at[3];
      trail.setAttribute("d", route.d);
      const L = trail.getTotalLength();
      learner.textContent = low ? "Learner A · starting Orientation" : "Learner B · starting Orientation";
      rider.classList.toggle("is-b", !low);
      await ride(route, 0, quizAt, 2600);
      bubbleText.textContent = low ? "58% · reroute to review" : "91% · continue";
      bubble.classList.toggle("is-warn", low);
      bubble.classList.add("is-in");
      learner.textContent = low ? "Learner A · Checkpoint 58% · rerouted to review" : "Learner B · Checkpoint 91% · straight to case studies";
      await wait(1500);
      bubble.classList.remove("is-in");
      await ride(route, quizAt, L, low ? 3600 : 2600);
      learner.textContent = `${low ? "Learner A" : "Learner B"} · credential issued · grade synced to SIS`;
      await wait(2600);
      turn++;
    });
  };

  /* @modules */

  /* ------------------------------------------------------------------ boot */
  $$("[data-viz]").forEach((el) => {
    const fn = VIZ[el.dataset.viz];
    if (!fn) return;
    try {
      fn(el);
    } catch (e) {
      console.error(`[viz:${el.dataset.viz}]`, e);
    }
  });
})();
