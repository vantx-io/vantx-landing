/**
 * Vantix Partials — Fetch-inject system for shared nav and footer
 *
 * Boot sequence (deterministic):
 *  1. Fetch nav.html and footer.html in parallel
 *  2. Fetch translations via window.i18n.init() — also in parallel
 *  3. After ALL three resolve: apply translations + wire interactivity
 *  4. Dispatch 'vantix:ready' event for page-level code to hook into
 *
 * Page setup (add before <script src="js/partials.js">):
 *   <script>window.VANTIX_BASE = '.';</script>   ← root pages
 *   <script>window.VANTIX_BASE = '..';</script>  ← pages one level deep
 *
 * HTML markers (place these empty elements where nav/footer should appear):
 *   <div data-partial="nav"></div>
 *   <div data-partial="footer"></div>
 */

(function () {
  'use strict';

  function base() {
    return (typeof window.VANTIX_BASE !== 'undefined')
      ? window.VANTIX_BASE
      : '';
  }

  /* ------------------------------------------------------------------
     Partial injection
     ------------------------------------------------------------------ */

  async function injectPartial(selector, url) {
    const container = document.querySelector(selector);
    if (!container) return; // not every page uses every partial

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`partials: failed to load ${url} (${res.status})`);
      return;
    }
    container.innerHTML = await res.text();
  }

  /* ------------------------------------------------------------------
     Mobile nav interactivity
     ------------------------------------------------------------------ */

  function wireMobileNav() {
    const nav    = document.querySelector('.nav');
    const toggle = document.querySelector('.nav__mobile-toggle');
    const drawer = document.querySelector('.nav__drawer');
    if (!nav || !toggle) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (drawer) drawer.classList.toggle('is-open', isOpen);
    });

    // Close drawer when a link inside it is clicked
    drawer && drawer.addEventListener('click', e => {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
      }
    });
  }

  /* ------------------------------------------------------------------
     Language toggle interactivity
     ------------------------------------------------------------------ */

  function wireLangToggle() {
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = window.i18n.getCurrentLang();
        const next = current === 'en' ? 'es' : 'en';
        window.i18n.setLang(next);
      });
    });
  }

  /* ------------------------------------------------------------------
     Active nav link
     ------------------------------------------------------------------ */

  function markActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      // Strip fragment from href for comparison
      const hrefPath = href.split('#')[0];
      if (hrefPath && path.endsWith(hrefPath) && hrefPath !== '/') {
        link.classList.add('is-active');
      } else if (hrefPath === '/' && (path === '/' || path.endsWith('/index.html'))) {
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
    await Promise.all([
      injectPartial('[data-partial="nav"]',    `${b}/partials/nav.html`),
      injectPartial('[data-partial="footer"]', `${b}/partials/footer.html`),
      window.i18n.init(), // loads translations; does NOT touch DOM yet
    ]);

    // Phase B — apply translations to entire DOM (including fresh partials)
    window.i18n.apply();

    // Phase C — wire interactivity
    wireLangToggle();
    wireMobileNav();
    markActiveLink();

    // Phase D — signal readiness to page-level scripts
    document.dispatchEvent(new CustomEvent('vantix:ready'));
  }

  /* ------------------------------------------------------------------
     Entry point
     ------------------------------------------------------------------ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
