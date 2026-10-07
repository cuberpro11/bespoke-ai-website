/* ==========================================================================
   BESPOKE — shared site behaviour
   Motion charter: transform/opacity only · enter ease-out · ≤520ms interactive
   · everything gated behind prefers-reduced-motion.
   ========================================================================== */
(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE = window.matchMedia("(max-width: 860px)").matches;
  const COARSE = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  // iPadOS 13+ reports as Mac; classic iPads include "iPad" in the UA.
  const IPAD =
    /iPad/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  /* ---------------------------------------------------------------- nav -- */

  const nav = doc.querySelector(".nav");

  // hairline reading-progress indicator under the nav
  let progressEl = null;
  if (nav) {
    progressEl = doc.createElement("span");
    progressEl.className = "scroll-progress";
    progressEl.setAttribute("aria-hidden", "true");
    nav.appendChild(progressEl);
  }

  let scrollRaf = null;
  const updateParallax = () => {
    if (REDUCED || window.matchMedia("(max-width: 860px)").matches) return;
    const ghost = doc.querySelector(".footer__ghost");
    if (ghost) {
      const footer = ghost.closest(".footer");
      const rect = footer ? footer.getBoundingClientRect() : ghost.getBoundingClientRect();
      const progress = 1 - Math.max(0, Math.min(1, rect.top / window.innerHeight));
      const offset = (progress - 0.5) * 48;
      ghost.style.transform = `translateY(calc(18% + ${offset.toFixed(1)}px))`;
    }
    doc.querySelectorAll(".halftone").forEach((ht) => {
      const hero = ht.closest(".hero");
      if (!hero || hero.classList.contains("hero--page")) return;
      const rect = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      ht.style.transform = `translateY(${(progress * 12).toFixed(1)}px)`;
    });
  };
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progressEl && scrollRaf === null) {
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        const max = doc.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        progressEl.style.transform = `scaleX(${p.toFixed(4)})`;
        updateParallax();
      });
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // active link
  // `data-page` lights this page's own nav entry; `data-section` lights the
  // parent dropdown, so adding a solutions page never means editing this file.
  const page = doc.body.dataset.page;
  const section = doc.body.dataset.section;
  if (page) {
    doc.querySelectorAll(`[data-nav="${page}"]`).forEach((el) => el.classList.add("is-active"));
  }
  if (section) {
    doc.querySelectorAll(`[data-nav="${section}"]`).forEach((el) => el.classList.add("is-active"));
  }

  doc.querySelectorAll("a[data-placeholder-link]").forEach((el) => {
    el.addEventListener("click", (e) => e.preventDefault());
  });

  const BURGER_MQ = window.matchMedia("(max-width: 1140px)");

  // mobile menu
  const burger = doc.querySelector(".nav__burger");
  const mobileMenu = doc.getElementById("mobile-menu");
  const menuPanel = mobileMenu ? mobileMenu.querySelector(".mobile-menu__panel") : null;
  const mobileSolutionsDd = mobileMenu ? mobileMenu.querySelector(".mobile-menu__item--dd") : null;
  const mobileSolutionsBtn = mobileSolutionsDd ? mobileSolutionsDd.querySelector(".mobile-menu__toggle") : null;
  const mobileSolutionsSub = mobileMenu ? mobileMenu.querySelector("#mobile-solutions") : null;
  const menuFocusables = () =>
    menuPanel
      ? [...menuPanel.querySelectorAll('a[href], button:not([disabled])')]
      : [];

  const setMobileSolutionsOpen = (open) => {
    if (!mobileSolutionsDd || !mobileSolutionsBtn || !mobileSolutionsSub) return;
    mobileSolutionsBtn.setAttribute("aria-expanded", String(open));

    if (open) {
      mobileSolutionsDd.classList.add("is-open");
      mobileSolutionsSub.removeAttribute("hidden");
      mobileSolutionsDd.classList.remove("is-sub-reveal");
      if (REDUCED) {
        mobileSolutionsDd.classList.add("is-sub-reveal");
        return;
      }
      void mobileSolutionsSub.offsetHeight;
      requestAnimationFrame(() => {
        mobileSolutionsDd.classList.add("is-sub-reveal");
      });
    } else {
      mobileSolutionsDd.classList.remove("is-open", "is-sub-reveal");
      mobileSolutionsSub.setAttribute("hidden", "");
    }
  };

  const setMenuOpen = (open) => {
    if (!burger || !mobileMenu) return;
    doc.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    if (open) {
      if (section === "solutions") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setMobileSolutionsOpen(true));
        });
      }
      const first = menuPanel ? menuPanel.querySelector(".mobile-menu__item--link, .mobile-menu__toggle") : null;
      if (first) requestAnimationFrame(() => first.focus());
    } else {
      setMobileSolutionsOpen(false);
      burger.focus();
    }
  };

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => setMenuOpen(!doc.body.classList.contains("nav-open")));

    mobileMenu.querySelectorAll("[data-menu-close], .mobile-menu__header .brand, .mobile-menu__item--link, .mobile-menu__sub-link, .mobile-menu__footer a").forEach((el) => {
      el.addEventListener("click", () => setMenuOpen(false));
    });

    if (mobileSolutionsBtn) {
      mobileSolutionsBtn.addEventListener("click", () => {
        const open = mobileSolutionsBtn.getAttribute("aria-expanded") !== "true";
        setMobileSolutionsOpen(open);
      });
    }

    const syncMenuOnBreakpoint = () => {
      if (!BURGER_MQ.matches && doc.body.classList.contains("nav-open")) {
        setMenuOpen(false);
      }
    };
    BURGER_MQ.addEventListener("change", syncMenuOnBreakpoint);

    doc.addEventListener("keydown", (e) => {
      if (!doc.body.classList.contains("nav-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = menuFocusables().filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // solutions dropdown (hover intent + click + keyboard)
  doc.querySelectorAll(".nav__item--dd").forEach((item) => {
    const btn = item.querySelector("button.nav__link");
    const panel = item.querySelector(".dropdown");
    if (!btn) return;
    let closeTimer = null;
    const keepOnScreen = () => {
      if (!panel) return;
      const pad = 16;
      const itemRect = item.getBoundingClientRect();
      // Layout box, not getBoundingClientRect: the open animation scales the
      // panel, which would under-measure it on the first frame.
      if (panel.classList.contains("dropdown--mega")) {
        // centered under the trigger, then nudged back inside the viewport
        const width = panel.offsetWidth;
        const maxLeft = Math.max(pad, window.innerWidth - pad - width);
        const center = itemRect.left + itemRect.width / 2;
        const left = Math.min(Math.max(pad, center - width / 2), maxLeft);
        const dx = left - itemRect.left - panel.offsetLeft;
        panel.style.translate = `${dx}px 0`;
        panel.style.setProperty("--dd-caret", `${itemRect.left + itemRect.width / 2 - left}px`);
        return;
      }
      panel.style.translate = "0";
      const left = itemRect.left + panel.offsetLeft;
      const right = left + panel.offsetWidth;
      let dx = 0;
      if (right > window.innerWidth - pad) dx = window.innerWidth - pad - right;
      if (left + dx < pad) dx = pad - left;
      panel.style.translate = dx ? `${dx}px 0` : "0";
      panel.style.setProperty("--dd-shift", `${dx}px`);
    };
    const open = () => {
      clearTimeout(closeTimer);
      keepOnScreen();
      item.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      item.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };
    item.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") open(); });
    item.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") closeTimer = setTimeout(close, 160);
    });
    btn.addEventListener("click", () => {
      item.classList.contains("is-open") ? close() : open();
    });
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) close();
    });
    doc.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("resize", () => {
      if (item.classList.contains("is-open")) keepOnScreen();
    });
  });

  /* ------------------------------------------------------------- reveals -- */

  // auto-assign stagger indices
  doc.querySelectorAll("[data-stagger]").forEach((group) => {
    [...group.children].forEach((el, i) => el.style.setProperty("--i", i));
  });

  const revealEls = doc.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (REDUCED || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              io.unobserve(en.target);
            }
          });
        },
        { rootMargin: MOBILE ? "0px 0px -2% 0px" : "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  // hero motion — homepage only; interior heroes render static
  const isHome = doc.body.dataset.page === "home";
  if (isHome) {
    root.classList.add("animate-headlines");
    requestAnimationFrame(() => {
      root.classList.add("lines-in");
    });
    doc.querySelectorAll(".hero .kicker[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }

  // safety net: if the renderer never advances CSS transitions (embedded
  // browsers, some kiosks), force content to its final visible state.
  if (!REDUCED) {
    setTimeout(() => {
      const probe = root.classList.contains("lines-in")
        ? doc.querySelector("[data-lines] .mask-line > span")
        : null;
      if (probe && parseFloat(getComputedStyle(probe).opacity) < 0.5) {
        root.classList.add("motion-fallback");
      }
    }, 2600);
  }

  /* ------------------------------------------------------------ counters -- */

  const fmt = (n, dec) =>
    dec > 0 ? n.toFixed(dec) : Math.round(n).toLocaleString("en-US");

  const runCounter = (el) => {
    const to = parseFloat(el.dataset.countTo || "0");
    const dec = (el.dataset.countTo || "").includes(".")
      ? (el.dataset.countTo.split(".")[1] || "").length
      : 0;
    const dur = 1100;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = fmt(to * e, dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counters = doc.querySelectorAll("[data-count-to]");
  if (counters.length) {
    if (REDUCED || !("IntersectionObserver" in window)) {
      counters.forEach((el) => {
        const dec = (el.dataset.countTo || "").includes(".")
          ? (el.dataset.countTo.split(".")[1] || "").length : 0;
        el.textContent = fmt(parseFloat(el.dataset.countTo), dec);
      });
    } else {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              runCounter(en.target);
              cio.unobserve(en.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ------------------------------------------------- cursor spot tracking -- */

  if (!REDUCED && window.matchMedia("(hover: hover)").matches) {
    doc.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".spot-card, .sec-tile, .ind-card--sheen");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`);
      card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`);
    }, { passive: true });
  }

  /* -------------------------------------------------------- gentle tilt --- */

  if (!REDUCED && window.matchMedia("(hover: hover)").matches) {
    doc.querySelectorAll("[data-tilt]").forEach((el) => {
      const MAX = parseFloat(el.dataset.tilt) || 1.1; // degrees — deliberately subtle
      let raf = null;
      el.style.transition = "transform 600ms cubic-bezier(0.22,0.61,0.21,1)";
      el.style.willChange = "transform";
      el.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform =
            `perspective(1400px) rotateX(${(-py * MAX).toFixed(3)}deg) rotateY(${(px * MAX).toFixed(3)}deg)`;
        });
      });
      el.addEventListener("pointerleave", () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = "perspective(1400px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  /* ------------------------------------------------------- hero dot-field -- */
  /* Neural energy orbs — soft glassy blue/cyan spheres drifting slowly over a
     dot field, with thin orange trails echoing the product cursor. */

  const canvas = doc.getElementById("hero-canvas");
  if (canvas && canvas.getContext && canvas.closest(".hero--tall")) {
    const ctx = canvas.getContext("2d");
    const heroEl = canvas.closest(".hero");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SPACING = 34;
    const REACH = 190;
    const AGENT_COUNT = 8;
    const TRAIL_LEN = 24;
    const ORB_PALETTE = [
      { core: [74, 114, 240], rim: [36, 84, 216], glow: [120, 210, 255] },
      { core: [56, 196, 232], rim: [24, 140, 180], glow: [160, 235, 255] },
      { core: [90, 130, 255], rim: [48, 96, 210], glow: [180, 220, 255] },
      { core: [68, 108, 228], rim: [32, 72, 196], glow: [130, 200, 248] },
      { core: [48, 178, 220], rim: [20, 128, 168], glow: [150, 228, 252] },
      { core: [82, 122, 248], rim: [40, 88, 204], glow: [170, 215, 255] },
      { core: [62, 188, 238], rim: [28, 132, 174], glow: [145, 230, 255] },
      { core: [78, 118, 244], rim: [38, 80, 208], glow: [165, 212, 252] },
    ];
    let W = 0, H = 0, dots = [], agents = [], running = false, rafId = null;
    let scrollParallax = 0;

    const rand = (min, max) => min + Math.random() * (max - min);
    const rgba = (rgb, a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(3)})`;

    const updateHeroParallax = () => {
      if (!heroEl) return;
      const rect = heroEl.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      scrollParallax = progress;
    };

    const pickTarget = (agent) => {
      const pad = 72;
      agent.tx = rand(pad, Math.max(pad + 1, W - pad));
      agent.ty = rand(pad, Math.max(pad + 1, H - pad));
      agent.speed = rand(0.011, 0.022);
      agent.dwell = Math.round(rand(6, 18));
    };

    const initAgents = () => {
      agents = [];
      for (let i = 0; i < AGENT_COUNT; i++) {
        const agent = {
          x: rand(0, W),
          y: rand(0, H),
          tx: 0,
          ty: 0,
          speed: 0.016,
          dwell: 0,
          pulse: i * 1.4,
          trail: [],
          radius: rand(10, 17),
          depth: 0.52 + (i / Math.max(AGENT_COUNT - 1, 1)) * 0.34,
          parallax: 0.14 + i * 0.11,
          palette: ORB_PALETTE[i % ORB_PALETTE.length],
        };
        pickTarget(agent);
        agent.x = agent.tx;
        agent.y = agent.ty;
        agents.push(agent);
      }
    };

    const build = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const cols = Math.ceil(W / SPACING) + 1;
      const rows = Math.ceil(H / SPACING) + 1;
      const offX = (W - (cols - 1) * SPACING) / 2;
      const offY = (H - (rows - 1) * SPACING) / 2;
      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            ox: offX + c * SPACING,
            oy: offY + r * SPACING,
            x: 0, y: 0,
            lift: 0,
          });
        }
      }
      initAgents();
    };

    const drawEnergyTrail = (agent, parallaxY) => {
      const { trail, pulse, radius } = agent;
      if (trail.length < 2) return;
      const cx = agent.x;
      const cy = agent.y + parallaxY;
      const orbR = radius + Math.sin(pulse * 0.65) * 2.5;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < trail.length; i++) {
        const t = 1 - i / trail.length;
        const alpha = t * t * 0.1 * agent.depth;
        const isStem = i <= 3;
        ctx.strokeStyle = `rgba(255, 118, 45, ${(isStem ? Math.max(alpha, 0.05 * agent.depth) : alpha).toFixed(3)})`;
        ctx.lineWidth = isStem ? 1.4 + t * 0.7 : 0.9 + t * 1.2;
        ctx.beginPath();
        ctx.moveTo(i === 1 ? cx : trail[i - 1].x, i === 1 ? cy : trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 0.55);
      core.addColorStop(0, `rgba(255, 152, 78, ${(0.14 * agent.depth).toFixed(3)})`);
      core.addColorStop(0.42, `rgba(255, 118, 45, ${(0.06 * agent.depth).toFixed(3)})`);
      core.addColorStop(1, "rgba(255, 118, 45, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 0.62, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawNeuralOrb = (agent, parallaxY) => {
      const { x, y, pulse, radius, palette, depth } = agent;
      const drawY = y + parallaxY;
      const alpha = (0.055 + Math.sin(pulse) * 0.018) * depth;
      const r = radius + Math.sin(pulse * 0.65) * 2;

      ctx.save();

      const outerGlow = ctx.createRadialGradient(x, drawY, r * 0.2, x, drawY, r * 2.6);
      outerGlow.addColorStop(0, rgba(palette.glow, alpha * 0.38));
      outerGlow.addColorStop(0.45, rgba(palette.core, alpha * 0.14));
      outerGlow.addColorStop(1, rgba(palette.core, 0));
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(x, drawY, r * 2.6, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(
        x - r * 0.32, drawY - r * 0.38, r * 0.08,
        x + r * 0.08, drawY + r * 0.12, r
      );
      body.addColorStop(0, rgba(palette.glow, alpha * 0.95));
      body.addColorStop(0.38, rgba(palette.core, alpha * 0.78));
      body.addColorStop(0.72, rgba(palette.rim, alpha * 0.48));
      body.addColorStop(1, rgba(palette.rim, alpha * 0.12));
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x, drawY, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rgba([255, 255, 255], alpha * 0.28);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(x, drawY, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = rgba([255, 255, 255], alpha * 0.22);
      ctx.beginPath();
      ctx.ellipse(x - r * 0.24, drawY - r * 0.32, r * 0.18, r * 0.1, -0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const frame = () => {
      updateHeroParallax();
      ctx.clearRect(0, 0, W, H);

      for (const agent of agents) {
        agent.x += (agent.tx - agent.x) * agent.speed;
        agent.y += (agent.ty - agent.y) * agent.speed;
        agent.pulse += 0.025;
        const dx = agent.tx - agent.x;
        const dy = agent.ty - agent.y;
        if (Math.hypot(dx, dy) < 18) {
          if (agent.dwell > 0) agent.dwell--;
          else pickTarget(agent);
        }
        agent.trail.unshift({ x: agent.x, y: agent.y + scrollParallax * agent.parallax * 28 });
        if (agent.trail.length > TRAIL_LEN) agent.trail.pop();
      }

      for (const d of dots) {
        let px = d.ox, py = d.oy, targetLift = 0;
        for (const agent of agents) {
          const parallaxY = scrollParallax * agent.parallax * 28;
          const dx = d.ox - agent.x, dy = d.oy - (agent.y + parallaxY);
          const dist = Math.hypot(dx, dy);
          if (dist < REACH) {
            const f = 1 - dist / REACH;
            const eased = f * f;
            px += (dx / (dist || 1)) * eased * 5;
            py += (dy / (dist || 1)) * eased * 5;
            targetLift = Math.max(targetLift, eased * agent.depth);
          }
        }
        d.lift += (targetLift - d.lift) * 0.1;
        d.x = px; d.y = py;

        const r = 1.1 + d.lift * 0.9;
        const alpha = 0.12 + d.lift * 0.22;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = d.lift > 0.04
          ? `rgba(100, 188, 255, ${alpha.toFixed(3)})`
          : `rgba(180, 182, 190, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      for (const agent of agents) {
        const parallaxY = scrollParallax * agent.parallax * 28;
        drawNeuralOrb(agent, parallaxY);
        drawEnergyTrail(agent, parallaxY);
      }

      if (running) rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || REDUCED) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    build();
    const staticCanvas = REDUCED;
    if (staticCanvas) {
      frame(); // single static frame
    } else {
      const vis = new IntersectionObserver(
        ([en]) => (en.isIntersecting ? start() : stop()),
        { threshold: 0.02 }
      );
      vis.observe(canvas);
      doc.addEventListener("visibilitychange", () =>
        doc.hidden ? stop() : start()
      );
      start();
    }

    let rT = null;
    window.addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { build(); if (staticCanvas) frame(); }, 180);
    });
  }

  /* -------------------------------------------------------- insight chart -- */

  const insightChart = doc.querySelector("[data-insight-chart]");
  if (insightChart) {
    const startChart = () => {
      if (insightChart.classList.contains("is-chart-ready")) return;
      insightChart.classList.add("is-chart-ready");
    };

    if ("IntersectionObserver" in window) {
      const chartIo = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        startChart();
        chartIo.disconnect();
      }, { threshold: 0.15 });
      chartIo.observe(insightChart);

      requestAnimationFrame(() => {
        const rect = insightChart.getBoundingClientRect();
        const vh = window.innerHeight || doc.documentElement.clientHeight;
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        if (visible > 0 && visible / rect.height >= 0.15) {
          startChart();
          chartIo.disconnect();
        }
      });
    } else {
      startChart();
    }
  }

  /* ---------------------------------------------------- deliver timeline -- */

  const stepList = doc.querySelector("[data-steps]");
  if (stepList) {
    const steps = stepList.querySelectorAll(".step-item");
    const bar = doc.querySelector(".deliver-progress .dp-track i");
    const label = doc.querySelector(".deliver-progress .dp-label");
    if ("IntersectionObserver" in window) {
      const sio = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              steps.forEach((s) => s.classList.remove("is-active"));
              en.target.classList.add("is-active");
              const idx = [...steps].indexOf(en.target);
              if (bar) bar.style.transform = `scaleX(${(idx + 1) / steps.length})`;
              if (label) label.textContent = `0${idx + 1} / 0${steps.length}`;
            }
          });
        },
        { rootMargin: "-42% 0px -42% 0px" }
      );
      steps.forEach((s) => sio.observe(s));
      if (steps[0]) steps[0].classList.add("is-active");
    } else {
      steps.forEach((s) => s.classList.add("is-active"));
    }
  }

  /* ------------------------------------------------------ case panels ----- */

  const setCasePanelOpen = (panel, open, animate = true) => {
    const btn = panel.querySelector(".case-panel__trigger");
    const detail = panel.querySelector(".case-panel__detail");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (!detail) {
      panel.classList.toggle("is-open", open);
      return;
    }
    if (open) {
      detail.hidden = false;
      if (animate) {
        panel.classList.remove("is-open");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => panel.classList.add("is-open"));
        });
      } else {
        panel.classList.add("is-open");
      }
    } else {
      panel.classList.remove("is-open");
      detail.hidden = true;
    }
  };

  doc.querySelectorAll(".case-panels:not([data-case-reveal])").forEach((group) => {
    group.querySelectorAll(".case-panel__trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.closest(".case-panel");
        if (!panel) return;
        const willOpen = !panel.classList.contains("is-open");
        group.querySelectorAll(".case-panel").forEach((p) => setCasePanelOpen(p, false, false));
        if (willOpen) setCasePanelOpen(panel, true, true);
      });
    });
  });

  doc.querySelectorAll("[data-case-reveal]").forEach((group) => {
    const panels = [...group.querySelectorAll(".case-panel")];
    const STAGGER = REDUCED ? 0 : 100;
    let timers = [];
    let revealed = false;
    let lastY = window.scrollY;

    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };

    const openStaggered = () => {
      clearTimers();
      panels.forEach((panel, i) => {
        timers.push(setTimeout(() => setCasePanelOpen(panel, true, !REDUCED), i * STAGGER));
      });
    };

    const closeStaggered = () => {
      clearTimers();
      [...panels].reverse().forEach((panel, i) => {
        timers.push(setTimeout(() => setCasePanelOpen(panel, false, false), i * Math.round(STAGGER * 0.7)));
      });
    };

    const closeAll = () => {
      clearTimers();
      panels.forEach((p) => setCasePanelOpen(p, false, false));
    };

    group.querySelectorAll(".case-panel__trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.closest(".case-panel");
        if (!panel) return;
        setCasePanelOpen(panel, !panel.classList.contains("is-open"), true);
      });
    });

    // Scroll-reveal is disabled on phones (coarse + narrow); iPad keeps it.
    if (!IPAD && (MOBILE || COARSE)) return;

    const updateCaseReveal = () => {
      const rect = group.getBoundingClientRect();
      const scrollingDown = window.scrollY >= lastY - 1;
      lastY = window.scrollY;
      const enterLine = window.innerHeight * 0.84;
      const exitLine = window.innerHeight * 0.42;
      const beforeSection = rect.top > window.innerHeight;
      const exitedUpward = rect.bottom < exitLine;

      if (beforeSection) {
        if (revealed) {
          revealed = false;
          closeAll();
        }
        return;
      }

      if (!revealed && scrollingDown && rect.top < enterLine && rect.bottom > 0) {
        revealed = true;
        if (REDUCED) panels.forEach((p) => setCasePanelOpen(p, true, false));
        else openStaggered();
        return;
      }

      if (revealed && !scrollingDown && exitedUpward) {
        revealed = false;
        if (REDUCED) closeAll();
        else closeStaggered();
      }
    };

    let caseRevealRaf = null;
    const queueCaseReveal = () => {
      if (caseRevealRaf !== null) return;
      caseRevealRaf = requestAnimationFrame(() => {
        caseRevealRaf = null;
        updateCaseReveal();
      });
    };

    window.addEventListener("scroll", queueCaseReveal, { passive: true });
    window.addEventListener("resize", queueCaseReveal, { passive: true });
    updateCaseReveal();
  });

  /* ----------------------------------------------------------- flip cards - */

  doc.querySelectorAll(".case-card").forEach((card) => {
    const flip = () => card.classList.toggle("is-flipped");
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    });
  });

  /* ------------------------------------------------------ use-case panes -- */

  doc.querySelectorAll("[data-usecases]").forEach((wrap) => {
    const items = wrap.querySelectorAll(".uc-item");
    const panes = wrap.querySelectorAll(".uc-pane");
    const sideItems = wrap.querySelectorAll(".uc-side__item");
    items.forEach((item) => {
      const btn = item.querySelector("button");
      btn.addEventListener("click", () => {
        if (item.classList.contains("is-open")) return;
        items.forEach((i) => i.classList.remove("is-open"));
        item.classList.add("is-open");
        const key = item.dataset.uc;
        panes.forEach((p) => p.classList.toggle("is-live", p.dataset.uc === key));
        sideItems.forEach((s) => s.classList.toggle("is-active", s.dataset.side === key));
        items.forEach((i) =>
          i.querySelector("button").setAttribute("aria-expanded", String(i === item))
        );
      });
    });
  });

  /* -------------------------------------------------------------- marquee - */

  doc.querySelectorAll(".marquee").forEach((m) => {
    const track = m.querySelector(".marquee__track");
    if (track && !REDUCED) {
      const clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      m.appendChild(clone);
    }
  });

  /* -------------------------------------------------------- contact form -- */

  // Footer mini-form and /contact share this handler, the same Netlify `contact`
  // form, and the same success markup. Fetch posts to "/" so the visitor never
  // leaves the page; Netlify routes on the hidden form-name field.
  const CONTACT_OK = (() => {
    const sparks = Array.from({ length: 8 }, (_, i) => `<i style="--p:${i}"></i>`).join("");
    return (
      '<div class="f-ok__mark" aria-hidden="true">' +
        '<span class="f-ok__glow"></span>' +
        '<span class="f-ok__ring"></span>' +
        '<span class="f-ok__pulse"></span>' +
        `<span class="f-ok__burst">${sparks}</span>` +
        '<svg class="f-ok__check" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      "</div>" +
      '<p class="f-ok__kicker">Sent</p>' +
      '<p class="f-ok__title">Message received.</p>' +
      '<p class="f-ok__lede">We\u2019ll reply within one business day.</p>'
    );
  })();

  const mountContactSuccess = (wrap) => {
    if (!wrap) return null;
    let ok = wrap.querySelector(".f-form__ok");
    if (!ok) {
      ok = doc.createElement("div");
      ok.className = "f-form__ok";
      wrap.appendChild(ok);
    }
    ok.setAttribute("role", "status");
    ok.setAttribute("aria-live", "polite");
    ok.innerHTML = CONTACT_OK;
    return ok;
  };

  const revealContactSuccess = (wrap) => {
    if (!wrap) return;
    const height = wrap.getBoundingClientRect().height;
    if (height > 0) wrap.style.minHeight = Math.round(height) + "px";
    wrap.classList.add("is-sent");
    if (REDUCED) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => wrap.classList.add("is-celebrating"));
    });
  };

  doc.querySelectorAll("[data-contact-form]").forEach((box) => {
    const form = box.querySelector("form");
    if (!form) return;

    const wrap = box.querySelector(".f-form");
    const errEl = box.querySelector(".f-form__err");
    const submitBtn = form.querySelector('[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.textContent : "";

    mountContactSuccess(wrap);

    const showError = () => {
      if (errEl) errEl.hidden = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (errEl) errEl.hidden = true;

      // Netlify's honeypot: a filled bot-field means a bot. Pretend it worked.
      if (String(new FormData(form).get("bot-field") || "").trim()) {
        revealContactSuccess(wrap);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending\u2026";
      }

      const body = new URLSearchParams(new FormData(form)).toString();

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          revealContactSuccess(wrap);
          form.reset();
        })
        .catch(showError);
    });
  });

  /* ---- team cards: flip to the bio ----
     The whole card flips on click; the corner button stays as the keyboard
     and screen-reader control. Links and text selections are left alone. */
  doc.addEventListener("click", (event) => {
    const flip = event.target.closest(".person-flip");
    if (!flip) return;
    const btn = event.target.closest(".person-flip__btn");
    if (!btn && (event.target.closest("a") || String(window.getSelection()).trim())) return;
    const showBio = !flip.classList.contains("is-flipped");
    flip.classList.toggle("is-flipped", showBio);
    flip.querySelectorAll(".person-flip__face").forEach((face) => {
      const isBack = face.classList.contains("person-flip__face--back");
      const hidden = showBio ? !isBack : isBack;
      if (hidden) face.setAttribute("inert", "");
      else face.removeAttribute("inert");
    });
    flip.querySelectorAll(".person-flip__btn").forEach((control) => {
      control.setAttribute("aria-pressed", showBio ? "true" : "false");
    });
    const next = flip.querySelector(
      showBio ? ".person-flip__face--back .person-flip__btn" : ".person-flip__face--front .person-flip__btn"
    );
    if (btn && next) next.focus();
  });

  /* ---- homepage orbit: What we build ----
     A small spring-physics graph. Five services ride the inner ring around
     the core, each with one capability on the outer ring. Every bubble is
     pulled toward its slot on a slowly turning ring, floats around it,
     leans toward the pointer, and springs back when dragged, flung, or
     knocked by a click on the core. The canvas draws a dot field that
     swells under the pointer, the rings, the edges, and the data packets
     that run from the core to each bubble (which pings when one lands).
     Hover, focus, tap, or drag eases the rotation to a stop and opens a
     card; the bubble and its neighbours stay lit while the rest dims. */
  doc.querySelectorAll("[data-orbit]").forEach((stage) => {
    const canvas = stage.querySelector(".orbit__canvas");
    const ctx = canvas.getContext("2d");
    const coreEl = stage.querySelector(".orbit__core");
    const narrow = window.matchMedia("(max-width: 700px)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const TAU = Math.PI * 2;
    const SPEED = TAU / 150; // one lap every two and a half minutes
    const K = 40, DAMP = 7.2; // a slightly bouncy spring
    const ACCENT = "74, 114, 240", HAIR = "172, 174, 182";
    const core = { el: coreEl, hub: true, i: -1, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 0, born: 0 };
    const nodes = [...stage.querySelectorAll(".orbit__node")].map((el, k) => ({
      el, k,
      body: el.querySelector(".orbit__body"),
      ball: el.querySelector(".orbit__ball"),
      card: el.querySelector(".orbit__card"),
      hub: el.dataset.kind === "hub",
      i: Number(el.dataset.i),
      x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 0, born: Infinity, ox: 0, oy: 0,
    }));
    const hubs = nodes.filter((n) => n.hub);
    const leaves = nodes.filter((n) => !n.hub);
    const all = [core, ...nodes];

    // edges: the core feeds every service, and each service its capability
    const edges = [];
    hubs.forEach((h) => edges.push({ a: core, b: h }));
    leaves.forEach((l) => edges.push({ a: hubs[l.i % hubs.length], b: l }));
    edges.forEach((e) => { e.bend = e.a === core ? 0 : 1; e.next = edges.filter((f) => f.a === e.b); });
    all.forEach((n) => {
      n.nb = new Set([n]);
      edges.forEach((e) => { if (e.a === n) n.nb.add(e.b); if (e.b === n) n.nb.add(e.a); });
    });
    nodes.forEach((n) => n.el.style.setProperty("--k", n.k));

    const packets = [], ripples = [];
    let nextPacket = 0, lastHub = -1, hotTimer = 0;
    const pointer = { x: 0, y: 0, in: false, px: 0, py: 0 };
    let W = 0, H = 0, cx = 0, cy = 0, dpr = 1, gap = 24, grid = 44;
    let ringHub = { x: 0, y: 0 }, ringLeaf = { x: 0, y: 0 };
    let t = 0, ts = 1, last = 0, clock = 0, raf = 0, onScreen = false, started = false;
    let hovered = null, opened = null, dragging = null, press = null, suppressClick = false;

    const focus = () => dragging || opened || hovered;

    const measure = () => {
      W = stage.clientWidth; H = stage.clientHeight; cx = W / 2; cy = H / 2;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      core.r = coreEl.offsetWidth / 2;
      core.hx = cx; core.hy = cy;
      core.bw = core.bt = core.bb = core.r;
      nodes.forEach((n) => {
        n.r = n.ball.offsetWidth / 2;
        n.card.style.width = Math.min(296, W - 24) + "px";
        // collision box: the bubble plus the label hanging under it
        const label = n.el.querySelector(".orbit__label");
        n.bw = Math.max(n.r, label.offsetWidth / 2);
        n.bt = n.r;
        n.bb = label.offsetTop + label.offsetHeight;
      });
      const small = narrow.matches;
      const leafR = leaves.length ? leaves[0].r : 0;
      gap = small ? 6 : 10;
      grid = small ? 30 : 40;
      ringHub = { x: W * (small ? 0.27 : 0.25), y: H * (small ? 0.25 : 0.265) };
      ringLeaf = { x: Math.min(W * (small ? 0.39 : 0.42), W / 2 - leafR - (small ? 36 : 64)), y: H * (small ? 0.42 : 0.4) };
    };

    const home = (n) => {
      const R = n.hub ? ringHub : ringLeaf;
      const a = -Math.PI / 2 + (n.i / 5) * TAU + (n.hub ? 0 : TAU / 10) + t * SPEED;
      let fx = 0, fy = 0;
      if (!REDUCED) {
        const A = n.hub ? 7 : 10;
        fx = Math.sin(t * 0.55 + n.k * 1.9) * A + Math.sin(t * 0.31 + n.k) * A * 0.4;
        fy = Math.cos(t * 0.47 + n.k * 2.3) * A + Math.sin(t * 0.23 + n.k * 0.7) * A * 0.4;
      }
      n.hx = cx + Math.cos(a) * R.x + fx;
      n.hy = cy + Math.sin(a) * R.y + fy;
    };

    const step = (dt) => {
      // ease the whole system to a stop while anything has focus
      ts += ((focus() ? 0 : 1) - ts) * Math.min(1, dt * 6);
      if (ts < 0.002) ts = 0;
      t += dt * ts;
      nodes.forEach(home);
      // a dragged bubble tugs its neighbours, and theirs a little
      const tug = new Map();
      if (dragging) {
        const dx = dragging.x - dragging.hx, dy = dragging.y - dragging.hy;
        dragging.nb.forEach((m) => m !== dragging && tug.set(m, 0.3));
        dragging.nb.forEach((m) => m.nb.forEach((q) => q !== dragging && !tug.has(q) && tug.set(q, 0.09)));
        tug.forEach((f, m) => { m.ox = dx * f; m.oy = dy * f; });
        const nx = dragging.x + (pointer.x - dragging.x) * Math.min(1, dt * 22);
        const ny = dragging.y + (pointer.y - dragging.y) * Math.min(1, dt * 22);
        dragging.vx = (nx - dragging.x) / dt; dragging.vy = (ny - dragging.y) / dt;
        dragging.x = nx; dragging.y = ny;
      }
      all.forEach((n) => {
        n.ax = n.ay = 0;
        if (n === dragging) return;
        if (clock < n.born) { n.x = core.x; n.y = core.y; n.vx = n.vy = 0; return; }
        const tx = n.hx + (tug.has(n) ? n.ox : 0), ty = n.hy + (tug.has(n) ? n.oy : 0);
        n.ax = (tx - n.x) * K - n.vx * DAMP;
        n.ay = (ty - n.y) * K - n.vy * DAMP;
        // lean toward the pointer, like filings near a magnet
        if (pointer.in && !dragging && n !== core && fine.matches) {
          const dx = pointer.x - n.x, dy = pointer.y - n.y, d = Math.hypot(dx, dy), R = 170;
          if (d < R && d > 1) { const f = (1 - d / R) ** 2 * (n === hovered ? 12 : 7); n.ax += dx * f; n.ay += dy * f; }
        }
      });
      // soft collisions keep bubbles and their labels from stacking; newborns fly free
      for (let a = 0; a < all.length; a++) {
        for (let b = a + 1; b < all.length; b++) {
          const p = all[a], q = all[b];
          if (clock < p.born + 1400 || clock < q.born + 1400) continue;
          const ox = Math.min(p.x + p.bw, q.x + q.bw) - Math.max(p.x - p.bw, q.x - q.bw) + gap;
          const oy = Math.min(p.y + p.bb, q.y + q.bb) - Math.max(p.y - p.bt, q.y - q.bt) + gap;
          if (ox <= 0 || oy <= 0) continue;
          const dx = q.x - p.x, dy = q.y + (q.bb - q.bt) / 2 - (p.y + (p.bb - p.bt) / 2), d = Math.hypot(dx, dy) || 1;
          const f = Math.min(ox, oy, 40) * 70, ux = dx / d, uy = dy / d;
          if (p !== dragging && p !== core) { p.ax -= ux * f; p.ay -= uy * f; }
          if (q !== dragging) { q.ax += ux * f; q.ay += uy * f; }
        }
      }
      all.forEach((n) => {
        if (n === dragging || clock < n.born) return;
        n.vx += n.ax * dt; n.vy += n.ay * dt;
        n.x += n.vx * dt; n.y += n.vy * dt;
      });
      if (!dragging) nodes.forEach((n) => { n.ox *= 0.9; n.oy *= 0.9; });
    };

    // where the card opens: toward the middle of the stage, kept fully inside it
    const placeCard = (n) => {
      const cw = n.card.offsetWidth, ch = n.card.offsetHeight, pad = 12, g = 14;
      const lift = n.r * 1.14 + g;
      let top = n.below ? lift : -(lift + ch);
      top = Math.min(Math.max(top, pad - n.y), H - pad - ch - n.y);
      const left = Math.min(Math.max(-cw / 2, pad - n.x), W - pad - cw - n.x);
      n.card.style.left = left.toFixed(1) + "px";
      n.card.style.top = top.toFixed(1) + "px";
      n.card.style.setProperty("--ox", (-left).toFixed(1) + "px");
      n.card.style.setProperty("--oy", (n.below ? -g : ch + g).toFixed(1) + "px");
      n.card.dataset.side = n.below ? "below" : "above";
    };

    // a point along an edge's gentle curve, trimmed to the bubbles' rims
    const geom = (e) => {
      const { a, b } = e;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const ra = a.r * (a === core ? 1 : 1.02) + 4, rb = b.r + 4;
      const x0 = a.x + ux * ra, y0 = a.y + uy * ra, x2 = b.x - ux * rb, y2 = b.y - uy * rb;
      const len = Math.max(1, d - ra - rb), bend = len * 0.08 * e.bend;
      return { x0, y0, x2, y2, x1: (x0 + x2) / 2 - uy * bend, y1: (y0 + y2) / 2 + ux * bend, len };
    };
    const at = (g, u) => {
      const v = 1 - u;
      return [v * v * g.x0 + 2 * v * u * g.x1 + u * u * g.x2, v * v * g.y0 + 2 * v * u * g.y1 + u * u * g.y2];
    };

    // a packet lands: the bubble pings, rocks a little, and sends a ripple through the dots
    const land = (n, e) => {
      ripples.push({ x: n.x, y: n.y, t: clock, r0: n.r * 1.05, strong: false });
      if (n === core || focus()) return; // nothing moves while someone is reading
      const g = e.g, d = Math.hypot(g.x2 - g.x0, g.y2 - g.y0) || 1;
      n.vx += ((g.x2 - g.x0) / d) * 90; n.vy += ((g.y2 - g.y0) / d) * 90;
      n.el.classList.remove("is-ping");
      void n.el.offsetWidth;
      n.el.classList.add("is-ping");
    };
    const send = (e) => packets.push({ e, u: 0 });

    const draw = (dt) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const f = focus();
      const secs = clock / 1000;

      // the dot field: hairline dots that swell and turn cobalt under the pointer and ripples
      const live = ripples.map((r) => ({ ...r, rad: r.r0 + ((clock - r.t) / 1000) * (r.strong ? 560 : 120), a: 1 - (clock - r.t) / (r.strong ? 1100 : 650) }));
      const reach = Math.hypot(W, H) * 0.5;
      const ox = (W % grid) / 2, oy = (H % grid) / 2;
      for (let gx = ox; gx <= W; gx += grid) {
        for (let gy = oy; gy <= H; gy += grid) {
          const dc = Math.hypot(gx - cx, (gy - cy) * 1.4);
          const base = 0.22 * Math.max(0, 1 - (dc / reach) ** 2);
          let glow = 0, x = gx, y = gy;
          if (pointer.in && fine.matches) {
            const dx = gx - pointer.x, dy = gy - pointer.y, d = Math.hypot(dx, dy);
            if (d < 150) { const k = (1 - d / 150) ** 2; glow = k; if (d > 0.5) { x += (dx / d) * k * 7; y += (dy / d) * k * 7; } }
          }
          live.forEach((r) => { if (r.a > 0) { const band = Math.abs(Math.hypot(gx - r.x, gy - r.y) - r.rad); if (band < 22) glow = Math.max(glow, (1 - band / 22) * r.a * (r.strong ? 1 : 0.7)); } });
          if (base < 0.01 && glow < 0.02) continue;
          ctx.globalAlpha = Math.min(1, base + glow * 0.8);
          ctx.fillStyle = glow > 0.05 ? `rgb(${ACCENT})` : `rgb(${HAIR})`;
          const r = 0.9 + glow * 1.5;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) if (live[i].a <= 0) ripples.splice(i, 1);

      // the rings
      ctx.globalAlpha = f ? 0.55 : 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${HAIR}, 0.16)`;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.ellipse(cx, cy, ringHub.x, ringHub.y, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([3, 6]);
      ctx.lineDashOffset = -t * 5;
      ctx.strokeStyle = `rgba(${HAIR}, 0.13)`;
      ctx.beginPath(); ctx.ellipse(cx, cy, ringLeaf.x, ringLeaf.y, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);

      // edges
      edges.forEach((e) => {
        const born = Math.max(e.a.born, e.b.born);
        if (clock < born) { e.g = null; return; }
        const grow = Math.min(1, (clock - born) / 600);
        const g = geom(e);
        const hot = !!f && (e.a === f || e.b === f);
        e.hot = hot; e.g = g;
        ctx.beginPath();
        ctx.moveTo(g.x0, g.y0);
        ctx.quadraticCurveTo(g.x0 + (g.x1 - g.x0) * grow, g.y0 + (g.y1 - g.y0) * grow, g.x0 + (g.x2 - g.x0) * grow, g.y0 + (g.y2 - g.y0) * grow);
        if (hot) {
          ctx.strokeStyle = `rgb(${ACCENT})`; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.95;
          ctx.shadowColor = `rgb(${ACCENT})`; ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = `rgb(${HAIR})`; ctx.lineWidth = 1;
          ctx.globalAlpha = (f ? 0.08 : 0.28) * grow;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // data packets run outward from the core; while something is in focus they only run on its edges
      if (!REDUCED) {
        nextPacket -= dt;
        if (!f && ts > 0.5 && nextPacket <= 0 && hubs.every((h) => clock > h.born + 900)) {
          let k; do { k = Math.floor(Math.random() * hubs.length); } while (k === lastHub && hubs.length > 1);
          lastHub = k;
          send(edges[k]);
          nextPacket = 0.9 + Math.random() * 0.9;
        }
        hotTimer -= dt;
        if (f && hotTimer <= 0) { edges.filter((e) => e.hot && e.g).forEach(send); hotTimer = 0.8; }
        for (let i = packets.length - 1; i >= 0; i--) {
          const p = packets[i], e = p.e;
          if (!e.g || (f && !e.hot)) { packets.splice(i, 1); continue; }
          p.u += (dt * 210) / Math.max(60, e.g.len);
          if (p.u >= 1) {
            packets.splice(i, 1);
            land(e.b, e);
            if (!f && Math.random() < 0.8) e.next.forEach(send);
            continue;
          }
          for (let s = 6; s >= 0; s--) {
            const uu = p.u - s * 0.022;
            if (uu < 0) continue;
            const [x, y] = at(e.g, uu);
            ctx.globalAlpha = (1 - s / 7) * 0.9;
            ctx.fillStyle = s ? `rgb(${ACCENT})` : "#ffffff";
            ctx.beginPath(); ctx.arc(x, y, s ? 1.8 - s * 0.2 : 2.1, 0, TAU); ctx.fill();
          }
          const [x, y] = at(e.g, p.u);
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
          glow.addColorStop(0, `rgba(${ACCENT}, 0.7)`); glow.addColorStop(1, `rgba(${ACCENT}, 0)`);
          ctx.globalAlpha = 1;
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
        }
      }

      // ripples: a thin cobalt ring for each landing or core click
      live.forEach((r) => {
        if (r.a <= 0) return;
        ctx.globalAlpha = r.a * r.a * (r.strong ? 0.7 : 0.4);
        ctx.strokeStyle = `rgb(${ACCENT})`; ctx.lineWidth = r.strong ? 1.5 : 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.rad, 0, TAU); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };

    const render = (dt = 0) => {
      coreEl.style.transform = `translate3d(${core.x.toFixed(2)}px, ${core.y.toFixed(2)}px, 0)`;
      nodes.forEach((n) => {
        n.el.style.transform = `translate3d(${n.x.toFixed(2)}px, ${n.y.toFixed(2)}px, 0)`;
        // squash and stretch along the direction of travel
        const sp = Math.hypot(n.vx, n.vy), s = Math.min(0.22, sp / 2600), a = Math.atan2(n.vy, n.vx);
        n.body.style.transform = s > 0.004
          ? `rotate(${a.toFixed(3)}rad) scale(${(1 + s).toFixed(3)}, ${(1 - s * 0.7).toFixed(3)}) rotate(${(-a).toFixed(3)}rad)`
          : "";
      });
      if (opened) placeCard(opened);
      draw(dt);
    };

    const tick = (now) => {
      raf = 0;
      clock = now;
      const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
      last = now;
      nodes.forEach((n) => { if (clock >= n.born && !n.el.classList.contains("is-born")) n.el.classList.add("is-born"); });
      step(dt / 2); step(dt / 2);
      render(dt);
      if (onScreen && !doc.hidden) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (REDUCED) { clock = performance.now(); render(); return; }
      if (!raf && onScreen && started) { last = 0; raf = requestAnimationFrame(tick); }
    };

    const intro = () => {
      if (started) return;
      started = true;
      const now = performance.now();
      coreEl.classList.add("is-born");
      if (REDUCED) {
        nodes.forEach((n) => { n.born = 0; home(n); n.x = n.hx; n.y = n.hy; n.el.classList.add("is-born"); });
      } else {
        // hubs pop out of the core first, then the capabilities
        nodes.forEach((n) => { n.born = now + 280 + (n.hub ? n.i * 120 : 760 + n.i * 95); });
      }
      run();
    };

    const light = () => {
      const f = focus();
      stage.classList.toggle("has-focus", !!f);
      all.forEach((n) => n.el.classList.toggle("is-lit", !!f && f.nb.has(n)));
    };
    const close = (n = opened) => {
      if (!n) return;
      n.el.classList.remove("is-open");
      n.ball.setAttribute("aria-expanded", "false");
      if (opened === n) opened = null;
      light(); run();
    };
    const open = (n) => {
      if (opened === n || dragging) return;
      if (opened) close(opened);
      opened = n;
      n.below = n.y < cy;
      n.el.classList.add("is-open");
      n.ball.setAttribute("aria-expanded", "true");
      placeCard(n);
      light(); run();
    };

    const local = (e) => {
      const r = stage.getBoundingClientRect();
      pointer.x = Math.min(Math.max(e.clientX - r.left, 0), W);
      pointer.y = Math.min(Math.max(e.clientY - r.top, 0), H);
    };
    stage.addEventListener("pointermove", (e) => {
      local(e);
      if (e.pointerType !== "mouse") return;
      pointer.in = true;
      stage.classList.add("is-pointer");
      stage.style.setProperty("--mx", pointer.x + "px");
      stage.style.setProperty("--my", pointer.y + "px");
      if (press && !dragging && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5 && !REDUCED) {
        dragging = press.n;
        close(dragging);
        dragging.el.classList.add("is-dragging");
        light();
      }
    });
    stage.addEventListener("pointerleave", () => { pointer.in = false; stage.classList.remove("is-pointer"); });

    const release = () => {
      if (!press) return;
      const n = dragging;
      press = null;
      if (!n) return;
      dragging = null;
      suppressClick = true;
      n.el.classList.remove("is-dragging");
      // a fling keeps its speed and springs home
      const sp = Math.hypot(n.vx, n.vy), max = 2400;
      if (sp > max) { n.vx *= max / sp; n.vy *= max / sp; }
      hovered = null;
      light();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    nodes.forEach((n) => {
      n.el.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || dragging) return;
        hovered = n;
        open(n);
      });
      n.el.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "mouse" || dragging === n) return;
        if (hovered === n) hovered = null;
        close(n);
      });
      n.ball.addEventListener("pointerdown", (e) => {
        n.wasOpen = opened === n;
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        e.preventDefault(); // no text selection or native drag while grabbing
        press = { n, x: e.clientX, y: e.clientY };
        n.ball.setPointerCapture(e.pointerId);
        local(e);
      });
      n.ball.addEventListener("click", (e) => {
        if (suppressClick) { suppressClick = false; return; }
        if (e.detail === 0 || !fine.matches) {
          // keyboard and touch toggle
          const was = e.detail === 0 ? opened === n : n.wasOpen;
          was ? close(n) : open(n);
        } else {
          open(n);
        }
      });
      n.ball.addEventListener("focus", () => { if (n.ball.matches(":focus-visible")) open(n); });
      n.ball.addEventListener("blur", () => { if (hovered !== n && opened === n) close(n); });
    });
    // tap anywhere else to close
    doc.addEventListener("click", (e) => { if (opened && !opened.el.contains(e.target) && !fine.matches) close(); });
    doc.addEventListener("keydown", (e) => { if (e.key === "Escape" && opened) { const n = opened; hovered = null; close(n); } });

    // the core sends a shockwave that knocks every bubble outward
    coreEl.addEventListener("click", () => {
      if (REDUCED || !started) return;
      ripples.push({ x: core.x, y: core.y, t: clock || performance.now(), r0: core.r, strong: true });
      nodes.forEach((n) => {
        const dx = n.x - core.x, dy = n.y - core.y, d = Math.hypot(dx, dy) || 1;
        const kick = n.hub ? 620 : 520;
        n.vx += (dx / d) * kick; n.vy += (dy / d) * kick;
      });
      coreEl.classList.remove("is-boing");
      void coreEl.offsetWidth;
      coreEl.classList.add("is-boing");
    });

    stage.classList.add("is-live");
    measure();
    core.x = cx; core.y = cy;
    nodes.forEach((n) => { n.x = cx; n.y = cy; });
    render();
    let resizeRaf = 0;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const ocx = cx, ocy = cy;
        measure();
        all.forEach((n) => { n.x += cx - ocx; n.y += cy - ocy; });
        if (REDUCED) nodes.forEach((n) => { home(n); n.x = n.hx; n.y = n.hy; });
        core.x = cx; core.y = cy;
        run();
      });
    });
    doc.addEventListener("visibilitychange", () => { if (!doc.hidden) run(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        onScreen = en.isIntersecting;
        if (onScreen && en.intersectionRatio >= 0.2) intro();
        run();
      }, { threshold: [0, 0.2, 0.4] }).observe(stage);
    } else {
      onScreen = true;
      intro();
    }
  });

  /* ---- bespoke vs subscription: horizon slider (risk page) ----
     The figure ships drawn at Yr 5; dragging the horizon redraws both
     cumulative meters, the gap between them, and the break-even badge. */
  doc.querySelectorAll("[data-bv-horizon]").forEach((fig) => {
    const data = JSON.parse(fig.dataset.bvHorizon);
    const range = fig.querySelector(".bv-hz__range");
    const out = fig.querySelector(".bv-hz__out");
    const [subFill, ownFill] = fig.querySelectorAll(".bv-hz__fill");
    const gap = fig.querySelector(".bv-hz__gap");
    const even = fig.querySelector(".bv-hz__even");
    const draw = () => {
      const i = Number(range.value) - 1;
      const sub = data.sub[i], own = data.own[i];
      out.textContent = data.years[i];
      subFill.style.setProperty("--w", sub + "%");
      ownFill.style.setProperty("--w", own + "%");
      gap.style.setProperty("--l", own + "%");
      gap.style.setProperty("--w", Math.max(0, sub - own) + "%");
      gap.classList.toggle("is-off", sub <= own);
      even.classList.toggle("is-on", i >= data.even);
    };
    range.addEventListener("input", draw);
    draw();
  });

  /* ---- extended motion (additive) ---- */

  updateParallax();

  const yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
