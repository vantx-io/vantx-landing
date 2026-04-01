/**
 * Vantx Partials — Fetch-inject system for shared nav and footer
 *
 * Boot sequence (deterministic):
 *  1. Fetch nav.html and footer.html in parallel
 *  2. Fetch translations via window.i18n.init() — also in parallel
 *  3. After ALL three resolve: apply translations + wire interactivity
 *  4. Dispatch 'vantx:ready' event for page-level code to hook into
 *
 * Page setup (add before <script src="js/partials.js">):
 *   <script>window.VANTX_BASE = '.';</script>   ← root pages
 *   <script>window.VANTX_BASE = '..';</script>  ← pages one level deep
 *
 * HTML markers (place these empty elements where nav/footer should appear):
 *   <div data-partial="nav"></div>
 *   <div data-partial="footer"></div>
 */

(function () {
  "use strict";

  function base() {
    return typeof window.VANTX_BASE !== "undefined" ? window.VANTX_BASE : "";
  }

  /* ------------------------------------------------------------------
     Partial injection
     ------------------------------------------------------------------ */

  var CACHE_PREFIX = "vantx-partial-";

  async function injectPartial(selector, url) {
    const container = document.querySelector(selector);
    if (!container) return; // not every page uses every partial

    // Skip fetch if content is already inlined in the HTML
    if (container.children.length > 0) return;

    var cacheKey = CACHE_PREFIX + url.split("/").pop();
    var raw = null;

    // 1. Try sessionStorage (zero network, instant)
    try {
      raw = sessionStorage.getItem(cacheKey);
    } catch (_) {}

    // 2. Fall back to network
    if (!raw) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(
            "partials: failed to load " + url + " (" + res.status + ")",
          );
          return;
        }
        raw = await res.text();
      } catch (err) {
        console.error("partials: network error loading " + url, err);
        return;
      }
      try {
        sessionStorage.setItem(cacheKey, raw);
      } catch (_) {}
    }

    container.innerHTML = raw.replaceAll("{{BASE}}", base());
  }

  /* ------------------------------------------------------------------
     Mobile nav interactivity
     ------------------------------------------------------------------ */

  function wireMobileNav() {
    const nav = document.querySelector(".nav");
    const toggle = document.querySelector(".nav__mobile-toggle");
    const drawer = document.querySelector(".nav__drawer");
    if (!nav || !toggle) return;

    var _previousFocus = null; // restore focus on close

    function closeDrawer() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (drawer) drawer.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      // Restore focus to the element that was active before the drawer opened
      if (_previousFocus && _previousFocus.focus) {
        _previousFocus.focus();
        _previousFocus = null;
      } else {
        toggle.focus();
      }
    }

    function openDrawer() {
      _previousFocus = document.activeElement;
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      if (drawer) {
        drawer.classList.add("is-open");
        var firstLink = drawer.querySelector("a, button");
        if (firstLink) firstLink.focus();
      }
      document.body.classList.add("nav-open");
    }

    toggle.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close drawer when a link inside it is clicked
    if (drawer) {
      drawer.addEventListener("click", (e) => {
        if (e.target.closest("a")) closeDrawer();
      });
    }

    // Keyboard handling — single listener for Escape + focus trap
    document.addEventListener("keydown", (e) => {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        closeDrawer();
        return;
      }
      if (e.key === "Tab" && drawer) {
        var focusable = drawer.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Close when clicking outside the nav (on page content behind drawer)
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("is-open") && !e.target.closest(".nav")) {
        closeDrawer();
      }
    });
  }

  /* ------------------------------------------------------------------
     Language toggle interactivity
     ------------------------------------------------------------------ */

  function wireLangToggle() {
    // Create an aria-live region so screen readers announce language changes
    var liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);

    document.addEventListener("i18n:changed", function (e) {
      var langName = e.detail.lang === "es" ? "Espa\u00f1ol" : "English";
      liveRegion.textContent = langName;
    });

    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = window.i18n.getCurrentLang();
        const next = current === "en" ? "es" : "en";
        window.i18n.setLang(next);
      });
    });
  }

  /* ------------------------------------------------------------------
     Active nav link
     ------------------------------------------------------------------ */

  function markActiveLink() {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll(".nav__link").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      // Strip fragment and query from href for comparison
      const hrefPath = href.split("#")[0].split("?")[0];
      // Normalize: resolve relative paths and strip trailing slash
      const normalizedHref = hrefPath.replace(/\/$/, "") || "/";
      if (normalizedHref !== "/" && path.endsWith(normalizedHref)) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      } else if (
        normalizedHref === "/" &&
        (path === "/" || path.endsWith("/index.html"))
      ) {
        // Root page — don't mark nav links as active to avoid confusion
      }
    });
  }

  /* ------------------------------------------------------------------
     Boot sequence
     ------------------------------------------------------------------ */

  async function boot() {
    const b = base();

    // Phase A — load partials and translations in parallel
    // Individual .catch() prevents one failure from blocking the others
    await Promise.all([
      injectPartial('[data-partial="nav"]', `${b}/partials/nav.html`).catch(
        (e) => console.error("partials: nav load failed", e),
      ),
      injectPartial(
        '[data-partial="footer"]',
        `${b}/partials/footer.html`,
      ).catch((e) => console.error("partials: footer load failed", e)),
      window.i18n
        .init()
        .catch((e) => console.error("partials: i18n init failed", e)),
    ]);

    // Phase B — apply translations to entire DOM (including fresh partials)
    window.i18n.apply();

    // Phase C — wire interactivity
    wireLangToggle();
    wireMobileNav();
    markActiveLink();

    // Phase D — signal readiness to page-level scripts
    document.dispatchEvent(new CustomEvent("vantx:ready"));
  }

  /* ------------------------------------------------------------------
     Entry point
     ------------------------------------------------------------------ */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
