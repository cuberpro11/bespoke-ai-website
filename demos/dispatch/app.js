/* ==========================================================================
   BESPOKE — AI call intake & dispatch demo
   Self-contained demo runtime. No build step, no network: the six intake
   records below are the same call log rendered by all three views, so the
   demo behaves identically every time it is shown.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- data -- */

  var CUSTOMERS = [
    {
      name: "Sarah Martinez",
      time: "7/8/26 2:14 AM",
      rate: "$450",
      service: "Tow",
      status: "Dispatched",
      callback: "(512) 555-0148",
      vehicle: "2019 Honda Civic",
      plate: "7XKP192",
      pickup: "1200 Elm St, Austin TX",
      dropoff: "Mike's Auto Body, 45 5th Ave",
      notes: "Front left tire blown, car won't move safely.",
      thread: [
        { from: "them", text: "Hi, just wanted to check how much longer the tow will be?", time: "2:22 AM" },
        { from: "you", text: "Truck is on the way, ETA about 20 minutes. Driver's name is Mike.", time: "2:23 AM" }
      ]
    },
    {
      name: "Derrick Owusu",
      time: "7/8/26 9:47 AM",
      rate: "$395",
      service: "Lockout",
      status: "En Route",
      callback: "(737) 555-0092",
      vehicle: "2021 Ford F-150",
      plate: "KLT-4482",
      pickup: "Riverside Park lot, north entrance",
      dropoff: "—",
      notes: "Keys visible on driver seat, no spare, has toddler with him — flagged urgent.",
      thread: [
        { from: "you", text: "Hi Derrick, this is Lonestar Towing — driver is en route, ETA 15 min.", time: "9:49 AM" },
        { from: "them", text: "Thank you, we're waiting by the park entrance.", time: "9:50 AM" }
      ]
    },
    {
      name: "Angela Reyes",
      time: "7/8/26 1:32 PM",
      rate: "$380",
      service: "Jump Start",
      status: "New",
      callback: "(512) 555-0173",
      vehicle: "2016 Toyota Camry",
      plate: "9DFM201",
      pickup: "Whole Foods, 4477 Burnet Rd",
      dropoff: "—",
      notes: "Battery dead 2nd time this month, may need replacement — mention to tech.",
      thread: [
        { from: "you", text: "Hi Angela, we got your request — tech is being assigned now, we'll text you the ETA shortly.", time: "1:33 PM" }
      ]
    },
    {
      name: "James Whitfield",
      time: "7/8/26 6:58 PM",
      rate: "$620",
      service: "Tow — Collision",
      status: "New",
      callback: "(512) 555-0210",
      vehicle: "2020 Subaru Outback",
      plate: "GTP-5561",
      pickup: "I-35 N shoulder, mile marker 238",
      dropoff: "Whitfield residence, 812 Oak Bend Dr",
      notes: "Airbags deployed, driver reports minor cuts — confirm welfare.",
      thread: [
        { from: "you", text: "James, this is Lonestar Towing — are you safely off the roadway and okay?", time: "6:59 PM" },
        { from: "them", text: "Yes, pulled onto the shoulder. A little shaken up but okay.", time: "7:00 PM" },
        { from: "you", text: "Good to hear. Truck is en route now, ETA 30 minutes.", time: "7:01 PM" }
      ]
    },
    {
      name: "Priya Nandakumar",
      time: "7/7/26 11:03 PM",
      rate: "$540",
      service: "Winch Out",
      status: "Dispatched",
      callback: "(512) 555-0134",
      vehicle: "2018 Jeep Wrangler",
      plate: "4RTL880",
      pickup: "Off Panther Trail, unpaved shoulder",
      dropoff: "—",
      notes: "Stuck in mud after rain, 4WD unresponsive.",
      thread: [
        { from: "them", text: "Any update on ETA? It's pretty dark out here.", time: "11:10 PM" },
        { from: "you", text: "Driver is 10 minutes out with a winch truck, hang tight.", time: "11:11 PM" }
      ]
    },
    {
      name: "Tom Bradshaw",
      time: "7/7/26 4:21 PM",
      rate: "$475",
      service: "Tow — Impound Release",
      status: "Dispatched",
      callback: "(512) 555-0299",
      vehicle: "2015 Chevy Malibu",
      plate: "8HGT330",
      pickup: "City Impound Lot, 900 Cesar Chavez",
      dropoff: "Bradshaw residence, 233 Pecan Grove Ln",
      notes: "Needs receipt photo texted for insurance.",
      thread: [
        { from: "you", text: "Hi Tom, your vehicle has been released and delivered home. Receipt photo attached below.", time: "4:40 PM" },
        { from: "them", text: "Got it, thank you for the quick turnaround!", time: "4:42 PM" }
      ]
    }
  ];

  /* ------------------------------------------------------------- helpers -- */

  function $(sel) { return doc.querySelector(sel); }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusClass(s) {
    if (s === "Dispatched") return "chip--dispatched";
    if (s === "En Route") return "chip--enroute";
    return "chip--new";
  }

  /* -------------------------------------------------------------- motion -- */

  var motion = { msgCount: {}, enterTimer: null, countGen: 0 };

  function setIndex(nodes) {
    Array.prototype.forEach.call(nodes, function (n, i) {
      n.style.setProperty("--i", i);
    });
  }

  function enterView(id) {
    var view = $("#view-" + id);
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

  function countUpMoney(node, formatted) {
    var n = Number(String(formatted).replace(/[^0-9.]/g, ""));
    var gen = ++motion.countGen;
    if (!node || REDUCED || !n) {
      if (node) node.textContent = formatted;
      return;
    }
    var start = performance.now();
    var dur = 720;
    function tick(now) {
      if (gen !== motion.countGen) return;
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = "$" + Math.round(eased * n);
      if (t < 1) requestAnimationFrame(tick);
    }
    node.textContent = "$0";
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------- tabs -- */

  var tabs = Array.prototype.slice.call(doc.querySelectorAll(".tab"));

  function showView(id) {
    tabs.forEach(function (t) {
      var on = t.dataset.view === id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    doc.querySelectorAll(".view").forEach(function (v) {
      var on = v.id === "view-" + id;
      v.classList.toggle("is-active", on);
      v.hidden = !on;
    });
    enterView(id);
    if (id === "web") {
      countUpMoney($(".detail-rate__value"), CUSTOMERS[activeIndex].rate);
    }
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      if (t.getAttribute("aria-selected") === "true") return;
      showView(t.dataset.view);
    });
    t.addEventListener("keydown", function (e) {
      var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      var next = tabs[(i + step + tabs.length) % tabs.length];
      showView(next.dataset.view);
      next.focus();
    });
  });

  /* ------------------------------------------------------------- console -- */

  var listEl = $("#custList");
  var detailEl = $("#custDetail");
  var activeIndex = 0;

  function renderList() {
    listEl.innerHTML = CUSTOMERS.map(function (c, i) {
      return '' +
        '<button class="cust-item' + (i === activeIndex ? " is-active" : "") + '" type="button" role="option"' +
        ' aria-selected="' + (i === activeIndex ? "true" : "false") + '" data-index="' + i + '">' +
          '<span class="cust-item__row">' +
            '<span class="cust-item__name">' + esc(c.name) + '</span>' +
            '<span class="cust-item__rate">' + esc(c.rate) + '</span>' +
          '</span>' +
          '<span class="cust-item__time">' + esc(c.time) + '</span>' +
          '<span class="cust-item__notes">' + esc(c.notes) + '</span>' +
        '</button>';
    }).join("");
    setIndex(listEl.querySelectorAll(".cust-item"));
  }

  function markActive() {
    listEl.querySelectorAll("[data-index]").forEach(function (btn) {
      var on = Number(btn.dataset.index) === activeIndex;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function renderDetail(switched) {
    var c = CUSTOMERS[activeIndex];
    detailEl.innerHTML = '' +
      '<div class="detail-head">' +
        '<div>' +
          '<h2>' + esc(c.name) + '</h2>' +
          '<div class="detail-sub">' + esc(c.service) + ' &middot; ' + esc(c.time) + '</div>' +
        '</div>' +
        '<div class="detail-rate">' +
          '<div class="detail-rate__label">Est. rate</div>' +
          '<div class="detail-rate__value">' + esc(c.rate) + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="chip ' + statusClass(c.status) + '">' + esc(c.status) + '</span>' +
      '<div class="detail-grid">' +
        field("Callback #", c.callback, true) +
        field("Vehicle", c.vehicle) +
        field("License plate", c.plate, true) +
        field("Service type", c.service) +
        field("Pickup location", c.pickup) +
        field("Drop-off location", c.dropoff) +
        field("Special notes", c.notes, false, true) +
      '</div>' +
      '<div class="text-section">' +
        '<div class="text-section__head">Text ' + esc(c.name.split(" ")[0]) + '</div>' +
        '<div class="thread-box" id="threadMessages"></div>' +
        '<div class="compose-row">' +
          '<input type="text" id="composeInput" placeholder="Type a message…" aria-label="Message ' + esc(c.name) + '">' +
          '<button class="btn btn--primary" type="button" id="composeSend">Send</button>' +
        '</div>' +
      '</div>';

    setIndex(detailEl.querySelectorAll(".detail-field"));
    var enter = !REDUCED && switched;
    detailEl.classList.toggle("is-enter", enter);
    if (enter) {
      countUpMoney(detailEl.querySelector(".detail-rate__value"), c.rate);
      setTimeout(function () { detailEl.classList.remove("is-enter"); }, 900);
    }

    renderThread(switched);

    $("#composeSend").addEventListener("click", sendMessage);
    $("#composeInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
    });
  }

  function field(label, value, mono, span2) {
    return '<div class="detail-field' + (span2 ? " detail-field--span2" : "") + '">' +
      '<div class="detail-field__label">' + esc(label) + '</div>' +
      '<div class="detail-field__value' + (mono ? " mono" : "") + '">' + esc(value) + '</div>' +
    '</div>';
  }

  function renderThread(enterAll) {
    var box = $("#threadMessages");
    if (!box) return;
    var thread = CUSTOMERS[activeIndex].thread;
    var counted = Object.prototype.hasOwnProperty.call(motion.msgCount, activeIndex);
    var prev = counted ? motion.msgCount[activeIndex] : 0;
    box.innerHTML = thread.map(function (m, i) {
      var fresh = !REDUCED && !enterAll && counted && i >= prev;
      return '<div class="msg msg--' + (m.from === "you" ? "you" : "them") +
        (fresh ? " is-enter" : "") + '" style="--i:' + i + '">' +
        esc(m.text) +
        '<span class="msg__time">' + esc(m.time) + '</span>' +
      '</div>';
    }).join("");
    motion.msgCount[activeIndex] = thread.length;
    box.scrollTop = box.scrollHeight;
  }

  function sendMessage() {
    var input = $("#composeInput");
    var text = input.value.trim();
    if (!text) return;
    CUSTOMERS[activeIndex].thread.push({ from: "you", text: text, time: "Now" });
    input.value = "";
    renderThread();
    input.focus();
  }

  listEl.addEventListener("click", function (e) {
    var item = e.target.closest(".cust-item");
    if (!item) return;
    activeIndex = Number(item.dataset.index);
    markActive();
    renderDetail(true);
  });

  /* ----------------------------------------------------------------- boot -- */

  setIndex(doc.querySelectorAll(".tabs .tab"));
  setIndex(doc.querySelectorAll("#view-sms .bubble"));
  setIndex(doc.querySelectorAll("#view-sms .timestamp-row"));
  setIndex(doc.querySelectorAll("#view-sheet tbody tr"));

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
  enterView("sms");
})();
