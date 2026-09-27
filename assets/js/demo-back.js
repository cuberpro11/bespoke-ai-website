/* Point a demo's chrome back control at the page that opened it.
   Same-origin referrers win; anything else stays on the demos index. */
(function () {
  "use strict";

  var FALLBACK = "/demos";

  function returnHref() {
    try {
      if (!document.referrer) return FALLBACK;
      var url = new URL(document.referrer);
      if (url.origin !== location.origin) return FALLBACK;
      var here = location.pathname.replace(/\/$/, "") || "/";
      var there = url.pathname.replace(/\/$/, "") || "/";
      if (there === here) return FALLBACK;
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return FALLBACK;
    }
  }

  function isDemosIndex(href) {
    try {
      var path = new URL(href, location.origin).pathname.replace(/\/$/, "") || "/";
      return path === "/demos" || path === "/demos.html";
    } catch (e) {
      return true;
    }
  }

  var href = returnHref();
  window.bespokeDemoReturn = { href: href, isIndex: isDemosIndex(href) };

  document.querySelectorAll(".apphead__back, .topbar__back").forEach(function (link) {
    link.setAttribute("href", href);
    if (!window.bespokeDemoReturn.isIndex) {
      var label = link.querySelector("span");
      if (label) label.textContent = "Back";
    }
  });

  // footer links read "Back to all demos"; relabel them when that is not where they go
  document.querySelectorAll(".demo-foot a").forEach(function (link) {
    link.setAttribute("href", href);
    if (!window.bespokeDemoReturn.isIndex) link.textContent = "\u2190 Back";
  });
})();
