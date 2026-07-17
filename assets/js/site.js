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
  const page = doc.body.dataset.page;
  const solutionPages = new Set(["law", "finance", "ps"]);
  if (page) {
    doc.querySelectorAll(`[data-nav="${page}"]`).forEach((el) => el.classList.add("is-active"));
    if (solutionPages.has(page)) {
      doc.querySelectorAll('[data-nav="solutions"]').forEach((el) => el.classList.add("is-active"));
    }
  }

  const BURGER_MQ = window.matchMedia("(max-width: 960px)");

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
      if (page && solutionPages.has(page)) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setMobileSolutionsOpen(true));
        });
      }
      const first = menuPanel ? menuPanel.querySelector(".mobile-menu__close") : null;
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
    if (!btn) return;
    let closeTimer = null;
    const open = () => {
      clearTimeout(closeTimer);
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

  // hero motion — pages with mask-line headlines
  const heroLines = doc.querySelector(".hero [data-lines]");
  if (heroLines) {
    root.classList.add("animate-headlines");
    requestAnimationFrame(() => {
      root.classList.add("lines-in");
      doc.querySelectorAll(".hero [data-reveal]").forEach((el) => el.classList.add("is-visible"));
    });
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
  /* A restrained grid of dots rippling under three autonomous orange cursors —
     like AI agents working in the background. No user input required. */

  const canvas = doc.getElementById("hero-canvas");
  if (canvas && canvas.getContext && canvas.closest(".hero--tall")) {
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SPACING = 34;
    const REACH = 190; // px radius of each agent's influence
    const AGENT_COUNT = 3;
    const CURSOR_PATH = new Path2D(
      "M5.5 3.2a.7.7 0 0 1 1.13-.55l12.2 9.42a.7.7 0 0 1-.35 1.25l-5.38.7 3.03 5.51a.7.7 0 0 1-.28.95l-1.9 1.05a.7.7 0 0 1-.95-.28l-3.03-5.5-3.95 3.7a.7.7 0 0 1-1.18-.5Z"
    );
    let W = 0, H = 0, dots = [], agents = [], running = false, rafId = null;

    const rand = (min, max) => min + Math.random() * (max - min);

    const pickTarget = (agent) => {
      const pad = 56;
      agent.tx = rand(pad, Math.max(pad + 1, W - pad));
      agent.ty = rand(pad, Math.max(pad + 1, H - pad));
      agent.speed = rand(0.028, 0.058);
      agent.dwell = Math.round(rand(0, 8));
    };

    const initAgents = () => {
      agents = [];
      for (let i = 0; i < AGENT_COUNT; i++) {
        const agent = {
          x: rand(0, W),
          y: rand(0, H),
          tx: 0,
          ty: 0,
          speed: 0.04,
          dwell: 0,
          pulse: i * 2.1,
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

    const drawAgentCursor = (x, y, pulse) => {
      const glow = 0.42 + Math.sin(pulse) * 0.08;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.92, 0.92);
      ctx.fillStyle = `rgba(255, 118, 45, ${glow.toFixed(3)})`;
      ctx.strokeStyle = `rgba(11, 17, 32, ${(glow * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.15;
      ctx.fill(CURSOR_PATH);
      ctx.stroke(CURSOR_PATH);
      ctx.beginPath();
      ctx.arc(2, 2, 5.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 118, 45, ${(glow * 0.35).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);

      for (const agent of agents) {
        agent.x += (agent.tx - agent.x) * agent.speed;
        agent.y += (agent.ty - agent.y) * agent.speed;
        agent.pulse += 0.04;
        const dx = agent.tx - agent.x;
        const dy = agent.ty - agent.y;
        if (Math.hypot(dx, dy) < 24) {
          if (agent.dwell > 0) agent.dwell--;
          else pickTarget(agent);
        }
      }

      for (const d of dots) {
        let px = d.ox, py = d.oy, targetLift = 0;
        for (const agent of agents) {
          const dx = d.ox - agent.x, dy = d.oy - agent.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH) {
            const f = 1 - dist / REACH;
            const eased = f * f;
            px += (dx / (dist || 1)) * eased * 10;
            py += (dy / (dist || 1)) * eased * 10;
            targetLift = Math.max(targetLift, eased);
          }
        }
        d.lift += (targetLift - d.lift) * 0.15;
        d.x = px; d.y = py;

        const r = 1.1 + d.lift * 1.4;
        const alpha = 0.16 + d.lift * 0.62;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = d.lift > 0.04
          ? `rgba(255, 132, 58, ${alpha.toFixed(3)})`
          : `rgba(180, 182, 190, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      for (const agent of agents) {
        drawAgentCursor(agent.x, agent.y, agent.pulse);
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

  /* ------------------------------------------------------- power toggle --- */

  doc.querySelectorAll("[data-switch]").forEach((widget) => {
    const tabs = widget.querySelectorAll(".power-toggle button");
    const toggle = widget.querySelector(".power-toggle");
    const panels = widget.querySelectorAll(".switch-panel");
    tabs.forEach((tab, idx) => {
      tab.addEventListener("click", () => {
        if (tab.getAttribute("aria-selected") === "true") return;
        toggle.dataset.side = idx;
        tabs.forEach((t, i) => t.setAttribute("aria-selected", String(i === idx)));
        const incoming = panels[idx];
        const outgoing = [...panels].find((p, i) => !p.hidden && i !== idx);
        const showIncoming = () => {
          incoming.hidden = false;
          if (!REDUCED) {
            incoming.style.animation = "none";
            void incoming.offsetWidth;
            incoming.style.animation = "";
          }
        };
        if (outgoing && !REDUCED) {
          outgoing.classList.add("is-leaving");
          setTimeout(() => {
            outgoing.classList.remove("is-leaving");
            outgoing.hidden = true;
            showIncoming();
          }, 220);
        } else {
          panels.forEach((p, i) => {
            if (i !== idx) p.hidden = true;
          });
          showIncoming();
        }
      });
    });
  });

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

  /* -------------------------------------------------------- ring diagram -- */

  const ring = doc.querySelector("[data-ring]");
  if (ring) {
    const segs = ring.querySelectorAll(".ring-svg .seg");
    const items = ring.querySelectorAll(".ring-item");
    const setHot = (key) => {
      segs.forEach((s) => {
        s.classList.toggle("is-hot", s.dataset.seg === key);
        s.classList.toggle("is-dim", key !== null && s.dataset.seg !== key);
      });
      items.forEach((it) => it.classList.toggle("is-hot", it.dataset.seg === key));
    };
    if (IPAD) {
      // Touch taps fire pointerleave immediately after pointerenter, so hover
      // handlers never hold the highlight. Tap-to-select matches desktop intent.
      [...segs, ...items].forEach((el) => {
        el.addEventListener("click", () => setHot(el.dataset.seg));
        el.addEventListener("focusin", () => setHot(el.dataset.seg));
      });
    } else {
      [...segs, ...items].forEach((el) => {
        el.addEventListener("pointerenter", () => setHot(el.dataset.seg));
        el.addEventListener("pointerleave", () => setHot(null));
        el.addEventListener("focusin", () => setHot(el.dataset.seg));
        el.addEventListener("focusout", () => setHot(null));
      });
    }

    // draw-in on first view
    const circles = ring.querySelectorAll(".ring-svg .seg circle");
    if (!REDUCED && "IntersectionObserver" in window) {
      circles.forEach((c) => {
        const len = c.getTotalLength ? c.getTotalLength() : 0;
        if (!len) return;
        const dash = c.getAttribute("stroke-dasharray");
        c.dataset.finalDash = dash || "";
        c.style.strokeDasharray = `0 ${len}`;
      });
      const rio = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        circles.forEach((c, i) => {
          c.style.transition = `stroke-dasharray 1100ms cubic-bezier(0.45,0,0.25,1) ${i * 140}ms`;
          c.style.strokeDasharray = c.dataset.finalDash;
        });
        rio.disconnect();
      }, { threshold: 0.4 });
      rio.observe(ring);
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

  doc.querySelectorAll("[data-contact-form]").forEach((box) => {
    const form = box.querySelector("form");
    const formWrap = box.querySelector(".f-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      (formWrap || box).classList.add("is-sent");
    });
  });

  /* ---- extended motion (additive) ---- */

  updateParallax();

  const yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
