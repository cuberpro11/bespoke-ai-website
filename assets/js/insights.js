/* ==========================================================================
   INSIGHTS — hub filters, article contents rail, and the looping "fx"
   product mockups inside article figures.

   FX timeline: a figure's data-timeline lists how long each step lasts (ms).
   Elements with data-at="n" appear at step n (and leave again after step m
   with data-until="m"); data-active="a b" marks an always-visible element
   .is-active from step a to b; data-type text types itself out over its
   step; data-count numbers count up. After the last step the figure fades
   and starts over. data-module="name" adds a hand-written behaviour (see
   MODULES) that runs alongside, or instead of, a timeline. Figures only run
   while on screen and the tab is visible; with reduced motion they show
   their finished frame and stay still.
   ========================================================================== */
(() => {
  "use strict";

  const doc = document;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- hub -- */

  const filters = [...doc.querySelectorAll(".ins-filter")];
  const cards = [...doc.querySelectorAll(".ins-card")];
  const empty = doc.querySelector(".ins-empty");

  const applyFilter = (id, push) => {
    if (!filters.some((f) => f.dataset.filter === id)) id = "all";
    filters.forEach((f) => f.setAttribute("aria-pressed", String(f.dataset.filter === id)));
    let first = null;
    let shown = 0;
    cards.forEach((card) => {
      const on = id === "all" || card.dataset.labels.split(" ").includes(id);
      card.hidden = !on;
      card.classList.remove("is-lead");
      if (on) {
        shown += 1;
        if (!first) first = card;
      }
    });
    if (first) first.classList.add("is-lead");
    if (empty) empty.hidden = shown > 0;
    if (push) {
      const url = id === "all" ? location.pathname : `${location.pathname}#${id}`;
      history.replaceState(null, "", url);
    }
  };

  if (filters.length) {
    filters.forEach((f) => f.addEventListener("click", () => applyFilter(f.dataset.filter, true)));
    applyFilter(decodeURIComponent(location.hash.slice(1)) || "all", false);
    window.addEventListener("hashchange", () => applyFilter(decodeURIComponent(location.hash.slice(1)) || "all", false));
  }

  /* ---------------------------------------------- article contents rail -- */

  const tocLinks = [...doc.querySelectorAll(".ins-toc__list a")];
  if (tocLinks.length && "IntersectionObserver" in window) {
    const heads = tocLinks.map((a) => doc.getElementById(a.hash.slice(1))).filter(Boolean);
    const setCurrent = () => {
      // the last heading that has scrolled past the top third of the screen
      const line = window.innerHeight * 0.33;
      let cur = null;
      heads.forEach((h) => { if (h.getBoundingClientRect().top < line) cur = h; });
      tocLinks.forEach((a) => a.classList.toggle("is-current", !!cur && a.hash === `#${cur.id}`));
    };
    let raf = null;
    window.addEventListener("scroll", () => {
      if (raf === null) raf = requestAnimationFrame(() => { raf = null; setCurrent(); });
    }, { passive: true });
    setCurrent();
  }

  /* -------------------------------------------------------------- fx -- */

  const stepOf = (el) => {
    const host = el.closest("[data-at], [data-active]");
    if (!host) return 0;
    return Number(host.dataset.at ?? host.dataset.active.split(" ")[0]);
  };

  const fmt = (el, v) => {
    const dec = Number(el.dataset.dec || 0);
    const num = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return `${el.dataset.pre || ""}${num}${el.dataset.post || ""}`;
  };

  /* Hand-written figure behaviours. Each returns { start, stop }; the static
     markup is the still frame, so stop() can leave things as they are. */
  const MODULES = {
    // FX desk: watchlist prices tick and new orders stream into the blotter
    blotter(fx) {
      const rows = [...fx.querySelectorAll("[data-pair]")].map((row) => ({
        row,
        pair: row.dataset.pair,
        pip: Number(row.dataset.pip),
        spread: Number(row.dataset.spread),
        open: Number(row.dataset.bid),
        bid: Number(row.dataset.bid),
      }));
      const list = fx.querySelector(".fx-orders");
      const orders = JSON.parse(fx.querySelector("[data-orders]").textContent);
      const dp = (r) => Math.round(-Math.log10(r.pip)) + 1;
      const quote = (v, places) => {
        const str = v.toFixed(places);
        return `${str.slice(0, -3)}<b>${str.slice(-3, -1)}</b><sup>${str.slice(-1)}</sup>`;
      };
      const paint = (r, dir) => {
        const places = dp(r);
        const ask = r.bid + r.spread * r.pip;
        r.row.querySelector("[data-q=bid]").innerHTML = quote(r.bid, places);
        r.row.querySelector("[data-q=ask]").innerHTML = quote(ask, places);
        const chg = (r.bid - r.open) / r.pip;
        const c = r.row.querySelector("[data-q=chg]");
        c.textContent = `${chg > 0 ? "+" : chg < 0 ? "\u2212" : ""}${Math.abs(chg).toFixed(1)}`;
        c.classList.toggle("is-up", chg > 0);
        c.classList.toggle("is-down", chg < 0);
        if (dir) {
          r.row.classList.remove("is-up", "is-down");
          void r.row.offsetWidth;
          r.row.classList.add(dir > 0 ? "is-up" : "is-down");
        }
      };
      let clock = 14 * 3600 + 32 * 60 + 5;
      let n = 0;
      let tickT = null;
      let orderT = null;
      const tickPrices = () => {
        rows.forEach((r) => {
          if (Math.random() > 0.55) return;
          const move = (Math.floor(Math.random() * 7) - 3) * 0.1 + (Math.random() < 0.5 ? -0.1 : 0.1);
          // drift back toward the open so prices wander but never run away
          const pull = ((r.open - r.bid) / r.pip) * 0.08;
          const d = Math.round((move + pull) * 10) / 10;
          if (!d) return;
          r.bid += d * r.pip;
          paint(r, d);
        });
      };
      const hms = (t) => [Math.floor(t / 3600) % 24, Math.floor(t / 60) % 60, t % 60].map((v) => String(v).padStart(2, "0")).join(":");
      const addOrder = () => {
        const o = orders[n % orders.length];
        n += 1;
        clock += 4 + Math.floor(Math.random() * 18);
        const r = rows.find((x) => x.pair === o.pair);
        const px = o.side === "Buy" ? r.bid + r.spread * r.pip : r.bid;
        const li = doc.createElement("li");
        li.className = `fx-order is-new is-${o.side.toLowerCase()}`;
        li.innerHTML = `<span class="fx-order__t">${hms(clock)}</span><span class="fx-order__side">${o.side}</span>` +
          `<span class="fx-order__pair">${o.pair}</span><span class="fx-order__lots">${o.lots.toFixed(1)}</span>` +
          `<span class="fx-order__px">${px.toFixed(dp(r))}</span><span class="fx-order__st">Working</span>`;
        list.prepend(li);
        setTimeout(() => {
          const st = li.querySelector(".fx-order__st");
          st.textContent = "Filled";
          li.classList.add("is-filled");
        }, 900 + Math.random() * 700);
        while (list.children.length > 6) list.lastElementChild.remove();
      };
      rows.forEach((r) => paint(r, 0));
      return {
        start() {
          tickT = setInterval(tickPrices, 850);
          orderT = setInterval(addOrder, 2300);
        },
        stop() {
          clearInterval(tickT);
          clearInterval(orderT);
        },
      };
    },
  };

  function Fx(fx) {
    const mod = MODULES[fx.dataset.module] ? MODULES[fx.dataset.module](fx) : null;
    const steps = (fx.dataset.timeline || "").trim().split(/\s+/).filter(Boolean).map(Number);
    const shown = [...fx.querySelectorAll("[data-at]")];
    const active = [...fx.querySelectorAll("[data-active]")];
    const types = [...fx.querySelectorAll("[data-type]")];
    const counts = [...fx.querySelectorAll("[data-count]")];
    types.forEach((el) => { el.dataset.full = el.textContent; });

    let gen = 0;      // bumps on every stop so stale timers do nothing
    let step = -1;
    let timer = null;
    let running = false;

    const finish = () => {
      // the still frame: everything that is on at the last step
      const last = steps.length - 1;
      shown.forEach((el) => el.classList.toggle("is-on", !(Number(el.dataset.until ?? 1e9) < last)));
      active.forEach((el) => {
        const [a, b] = el.dataset.active.split(" ").map(Number);
        el.classList.toggle("is-active", a <= last && last <= (b ?? a));
      });
      types.forEach((el) => { el.textContent = el.dataset.full; el.classList.remove("is-typing"); });
      counts.forEach((el) => { el.textContent = fmt(el, Number(el.dataset.count)); });
    };

    const reset = () => {
      shown.forEach((el) => el.classList.remove("is-on"));
      active.forEach((el) => el.classList.remove("is-active"));
      types.forEach((el) => { el.textContent = ""; el.classList.remove("is-typing"); });
      counts.forEach((el) => { el.textContent = fmt(el, 0); });
    };

    const type = (el, ms, g) => {
      const full = el.dataset.full;
      const per = Math.max(14, Math.min(42, (ms * 0.8) / full.length));
      let i = 0;
      el.classList.add("is-typing");
      const next = () => {
        if (g !== gen) return;
        i += 1;
        el.textContent = full.slice(0, i);
        if (i < full.length) setTimeout(next, per);
        else setTimeout(() => { if (g === gen) el.classList.remove("is-typing"); }, 500);
      };
      next();
    };

    const count = (el, g) => {
      const to = Number(el.dataset.count);
      const t0 = performance.now();
      const frame = (t) => {
        if (g !== gen) return;
        const p = Math.min(1, (t - t0) / 900);
        el.textContent = fmt(el, to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    const enter = (k, g) => {
      shown.forEach((el) => {
        if (Number(el.dataset.at) === k) el.classList.add("is-on");
        if (Number(el.dataset.until) === k - 1) el.classList.remove("is-on");
      });
      active.forEach((el) => {
        const [a, b] = el.dataset.active.split(" ").map(Number);
        el.classList.toggle("is-active", a <= k && k <= (b ?? a));
      });
      types.forEach((el) => { if (stepOf(el) === k) type(el, steps[k], g); });
      counts.forEach((el) => { if (stepOf(el) === k) count(el, g); });
    };

    const tick = () => {
      const g = gen;
      step += 1;
      if (step >= steps.length) {
        fx.classList.add("is-fading");
        timer = setTimeout(() => {
          if (g !== gen) return;
          reset();
          fx.classList.remove("is-fading");
          step = -1;
          timer = setTimeout(tick, 300);
        }, 450);
        return;
      }
      enter(step, g);
      timer = setTimeout(tick, steps[step]);
    };

    // Reserve the tallest step's height so the article below never jumps
    // while a figure expands and collapses (the news panel does both).
    const win = fx.querySelector(".fx-win");
    const measure = () => {
      if (!win || !steps.length) return;
      fx.classList.add("is-measuring");
      win.style.minHeight = "";
      const keep = { on: shown.filter((el) => el.classList.contains("is-on")), act: active.filter((el) => el.classList.contains("is-active")), text: types.map((el) => el.textContent) };
      let tallest = 0;
      steps.forEach((_, k) => {
        shown.forEach((el) => el.classList.toggle("is-on", Number(el.dataset.at) <= k && !(Number(el.dataset.until ?? 1e9) < k)));
        active.forEach((el) => {
          const [a, b] = el.dataset.active.split(" ").map(Number);
          el.classList.toggle("is-active", a <= k && k <= (b ?? a));
        });
        types.forEach((el) => { el.textContent = stepOf(el) <= k ? el.dataset.full : ""; });
        tallest = Math.max(tallest, win.offsetHeight);
      });
      shown.forEach((el) => el.classList.toggle("is-on", keep.on.includes(el)));
      active.forEach((el) => el.classList.toggle("is-active", keep.act.includes(el)));
      types.forEach((el, i) => { el.textContent = keep.text[i]; });
      win.style.minHeight = `${tallest}px`;
      void win.offsetHeight;
      fx.classList.remove("is-measuring");
    };
    this.measure = measure;

    this.start = () => {
      if (running) return;
      running = true;
      gen += 1;
      if (mod) mod.start();
      if (!steps.length) return;
      reset();
      fx.classList.remove("is-fading");
      step = -1;
      timer = setTimeout(tick, 250);
    };

    this.stop = () => {
      if (!running) return;
      running = false;
      gen += 1;
      clearTimeout(timer);
      if (mod) mod.stop();
    };

    if (REDUCED || !("IntersectionObserver" in window)) {
      if (steps.length) finish();
      return;
    }
    fx.classList.add("is-live");
    if (steps.length) reset();
    measure();
  }

  const figs = [...doc.querySelectorAll("[data-fx]")].map((el) => ({ el, fx: new Fx(el), seen: false }));
  if (!REDUCED && "IntersectionObserver" in window && figs.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const f = figs.find((x) => x.el === en.target);
        f.seen = en.isIntersecting;
        if (en.isIntersecting && !doc.hidden) f.fx.start();
        else f.fx.stop();
      });
    }, { threshold: 0.35 });
    figs.forEach((f) => io.observe(f.el));
    let rz = null;
    window.addEventListener("resize", () => {
      clearTimeout(rz);
      rz = setTimeout(() => figs.forEach((f) => f.fx.measure()), 200);
    });
    // web fonts change line wrapping, so measure again once they are in
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => figs.forEach((f) => f.fx.measure()));
    doc.addEventListener("visibilitychange", () => {
      figs.forEach((f) => {
        if (doc.hidden) f.fx.stop();
        else if (f.seen) f.fx.start();
      });
    });
  }
})();
