/* ==========================================================================
   INSIGHTS — hub filters, article contents rail, and the looping "fx"
   product mockups inside article figures.

   FX timeline: a figure's data-timeline lists how long each step lasts (ms).
   Elements with data-at="n" appear at step n; data-type text types itself out
   over its step; data-count numbers count up. After the last step the figure
   fades and starts over. Figures only run while on screen and the tab is
   visible; with reduced motion they show their finished frame and stay still.
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
    const host = el.closest("[data-at]");
    return host ? Number(host.dataset.at) : 0;
  };

  const fmt = (el, v) => {
    const dec = Number(el.dataset.dec || 0);
    return `${el.dataset.pre || ""}${v.toFixed(dec)}${el.dataset.post || ""}`;
  };

  function Fx(fx) {
    const steps = fx.dataset.timeline.trim().split(/\s+/).map(Number);
    const shown = [...fx.querySelectorAll("[data-at]")];
    const types = [...fx.querySelectorAll("[data-type]")];
    const counts = [...fx.querySelectorAll("[data-count]")];
    types.forEach((el) => { el.dataset.full = el.textContent; });

    let gen = 0;      // bumps on every stop so stale timers do nothing
    let step = -1;
    let timer = null;
    let running = false;

    const finish = () => {
      shown.forEach((el) => el.classList.add("is-on"));
      types.forEach((el) => { el.textContent = el.dataset.full; el.classList.remove("is-typing"); });
      counts.forEach((el) => { el.textContent = fmt(el, Number(el.dataset.count)); });
    };

    const reset = () => {
      shown.forEach((el) => el.classList.remove("is-on"));
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
      shown.forEach((el) => { if (Number(el.dataset.at) === k) el.classList.add("is-on"); });
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

    this.start = () => {
      if (running) return;
      running = true;
      gen += 1;
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
    };

    if (REDUCED || !("IntersectionObserver" in window)) {
      finish();
      return;
    }
    fx.classList.add("is-live");
    reset();
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
    doc.addEventListener("visibilitychange", () => {
      figs.forEach((f) => {
        if (doc.hidden) f.fx.stop();
        else if (f.seen) f.fx.start();
      });
    });
  }
})();
