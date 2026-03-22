/**
 * Vantx i18n — Bilingual language system
 *
 * Features:
 *  - Auto-detect language from navigator.languages
 *  - Persist preference in localStorage
 *  - DOM injection via data-i18n attributes
 *  - Exposes window.i18n for external use by partials.js
 *
 * Usage (HTML attributes):
 *  data-i18n="nav.cta"            → sets textContent
 *  data-i18n-html="hero.headline" → sets innerHTML (use sparingly)
 *  data-i18n-aria="nav.logo_aria" → sets aria-label
 *  data-i18n-placeholder="..."    → sets placeholder
 *  data-lang-toggle               → marks the lang toggle button(s)
 *
 * Initialization:
 *  partials.js calls window.i18n.init() — do NOT auto-init here.
 *  This keeps the boot sequence deterministic.
 */

window.i18n = (function () {
  "use strict";

  const STORAGE_KEY = "vantx-lang";
  const CACHE_KEY = "vantx-i18n-";
  const SUPPORTED = ["en", "es"];
  const DEFAULT_LANG = "en";

  /* Base path set by each page before loading scripts:
     window.VANTX_BASE = '.'    (root-level pages)
     window.VANTX_BASE = '..'  (one level deep)
     Falls back to '' (root-relative, works on servers). */
  function basePath() {
    return typeof window.VANTX_BASE !== "undefined" ? window.VANTX_BASE : "";
  }

  let _translations = {};
  let _lang = DEFAULT_LANG;

  /* ------------------------------------------------------------------
     Language detection
     ------------------------------------------------------------------ */

  function detectLang() {
    // 1. Honour stored preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;

    // 2. Auto-detect from browser language list
    const prefs =
      Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language || DEFAULT_LANG];

    for (const pref of prefs) {
      const code = pref.split("-")[0].toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }

    return DEFAULT_LANG;
  }

  /* ------------------------------------------------------------------
     Translation resolution
     ------------------------------------------------------------------ */

  /**
   * Resolve a dot-notation key against the loaded translations.
   * Returns the key itself when not found (graceful degradation).
   */
  function t(key) {
    const parts = key.split(".");
    let node = _translations;
    for (const part of parts) {
      if (node == null || typeof node !== "object") return key;
      node = node[part];
    }
    return node != null && node !== "" ? String(node) : key;
  }

  /* ------------------------------------------------------------------
     DOM application
     ------------------------------------------------------------------ */

  /** Apply all translations to the current DOM. */
  function apply() {
    // data-i18n → textContent
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    // data-i18n-html → innerHTML (for bold/em markup in copy)
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });

    // data-i18n-aria → aria-label
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });

    // data-i18n-placeholder → placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });

    // data-i18n-title → title attribute
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.getAttribute("data-i18n-title"));
    });

    // Language toggle buttons — show the *other* language code
    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.textContent = t("lang.toggle_label");
      btn.setAttribute("aria-label", t("lang.toggle_aria"));
    });

    // Sync <html lang> attribute for assistive tech
    document.documentElement.lang = _lang;
  }

  /* ------------------------------------------------------------------
     Translation loading
     ------------------------------------------------------------------ */

  /**
   * Load translations for a language code.
   * Checks sessionStorage first — if the translations were already
   * fetched during this browser session (e.g. on the home page),
   * subsequent pages load them instantly with zero network requests.
   */
  async function loadTranslations(lang) {
    var cacheKey = CACHE_KEY + lang;

    // 1. Try sessionStorage (synchronous, instant)
    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        _translations = JSON.parse(cached);
        return;
      }
    } catch (_) {
      // Private browsing or storage full — fall through to fetch
    }

    // 2. Fetch from network
    var url = basePath() + "/i18n/" + lang + ".json";
    var res = await fetch(url);
    if (!res.ok)
      throw new Error("i18n: failed to load " + url + " (" + res.status + ")");
    _translations = await res.json();

    // 3. Cache for the rest of the session
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(_translations));
    } catch (_) {
      // Storage full — translations still work, just won't be cached
    }
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */

  /**
   * Detect language and load its translations.
   * Called once by partials.js during boot.
   * Returns the resolved language code.
   */
  async function init() {
    _lang = detectLang();
    // Persist detected language so other pages skip browser detection
    localStorage.setItem(STORAGE_KEY, _lang);
    await loadTranslations(_lang);
    return _lang;
  }

  /**
   * Switch to a new language, persist the choice, and re-apply DOM.
   */
  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) {
      console.warn(`i18n: unsupported language "${lang}"`);
      return;
    }
    _lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    // Clear cached translations so loadTranslations fetches the new language
    try {
      SUPPORTED.forEach(function (l) {
        sessionStorage.removeItem(CACHE_KEY + l);
      });
    } catch (_) {}
    await loadTranslations(lang);
    apply();
    document.dispatchEvent(
      new CustomEvent("i18n:changed", { detail: { lang } }),
    );
  }

  /** Return the currently active language code. */
  function getCurrentLang() {
    return _lang;
  }

  return { init, setLang, apply, t, getCurrentLang };
})();
