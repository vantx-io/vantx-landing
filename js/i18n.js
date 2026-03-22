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
    // 1. Honour stored preference (localStorage may be unavailable in private browsing)
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (_) {}

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

  /* Cached NodeLists — populated on first apply(), reused on language switch.
     querySelectorAll returns a static NodeList so we must refresh after
     partials inject new DOM (that's why the first apply() always rebuilds). */
  var _cache = null;

  function buildCache() {
    _cache = {
      text: document.querySelectorAll("[data-i18n]"),
      html: document.querySelectorAll("[data-i18n-html]"),
      aria: document.querySelectorAll("[data-i18n-aria]"),
      placeholder: document.querySelectorAll("[data-i18n-placeholder]"),
      title: document.querySelectorAll("[data-i18n-title]"),
      attr: document.querySelectorAll("[data-i18n-attr]"),
      langToggle: document.querySelectorAll("[data-lang-toggle]"),
    };
  }

  /** Sanitize HTML from translations — strip dangerous elements and attrs */
  function sanitizeHTML(raw) {
    var tmp = document.createElement("div");
    tmp.innerHTML = raw;
    tmp
      .querySelectorAll("script,style,iframe,object,embed,form,input,link")
      .forEach(function (n) {
        n.remove();
      });
    tmp.querySelectorAll("*").forEach(function (n) {
      for (var i = n.attributes.length - 1; i >= 0; i--) {
        var attr = n.attributes[i];
        if (attr.name.startsWith("on")) {
          n.removeAttribute(attr.name);
        } else if (
          (attr.name === "href" ||
            attr.name === "src" ||
            attr.name === "action") &&
          /^\s*javascript\s*:/i.test(attr.value)
        ) {
          n.removeAttribute(attr.name);
        }
      }
    });
    return tmp.innerHTML;
  }

  /** Apply all translations to the current DOM. */
  function apply() {
    // Rebuild cache on first call or when DOM has changed (partials injected)
    if (!_cache) buildCache();

    // data-i18n → textContent
    _cache.text.forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    // data-i18n-html → innerHTML (sanitized)
    _cache.html.forEach(function (el) {
      el.innerHTML = sanitizeHTML(t(el.getAttribute("data-i18n-html")));
    });

    // data-i18n-aria → aria-label
    _cache.aria.forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });

    // data-i18n-placeholder → placeholder
    _cache.placeholder.forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });

    // data-i18n-title → title attribute
    _cache.title.forEach(function (el) {
      el.title = t(el.getAttribute("data-i18n-title"));
    });

    // data-i18n-attr → arbitrary attributes (format: "attr:key, attr2:key2")
    _cache.attr.forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(",")
        .forEach(function (pair) {
          var parts = pair.trim().split(":");
          if (parts.length === 2) {
            el.setAttribute(parts[0].trim(), t(parts[1].trim()));
          }
        });
    });

    // Language toggle buttons — show the *other* language code
    _cache.langToggle.forEach(function (btn) {
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
        var parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          _translations = parsed;
          return;
        }
      }
    } catch (_) {
      // Corrupted cache or private browsing — fall through to fetch
      try {
        sessionStorage.removeItem(cacheKey);
      } catch (_e) {}
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
    try {
      localStorage.setItem(STORAGE_KEY, _lang);
    } catch (_) {}
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
    var prevLang = _lang;
    _lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
    // Clear only the NEW language cache to force a fresh fetch;
    // keep previous language cached so we can fall back on failure.
    try {
      sessionStorage.removeItem(CACHE_KEY + lang);
    } catch (_) {}
    try {
      await loadTranslations(lang);
    } catch (e) {
      console.error(
        "i18n: failed to load " + lang + ", reverting to " + prevLang,
        e,
      );
      _lang = prevLang;
      try {
        localStorage.setItem(STORAGE_KEY, prevLang);
      } catch (_) {}
      // Attempt to restore previous translations from cache
      try {
        await loadTranslations(prevLang);
      } catch (_) {}
    }
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
