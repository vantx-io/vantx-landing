/**
 * Vantx Calendly Integration — lazy-loaded popup + GA4 tracking
 *
 * Instead of loading Calendly's ~300KB widget.js on every page,
 * this script loads it on-demand when a user first clicks a CTA.
 * Subsequent clicks open the popup instantly (script already loaded).
 *
 * Triggers:
 *   .js-calendly-trigger  — all Calendly CTA buttons (hero, nav, CTA section)
 *
 * GA4 event:
 *   calendly_booking (fired when Calendly confirms a scheduled event)
 */

(function () {
  "use strict";

  var CALENDLY_URLS = {
    en: "https://calendly.com/hello-vantx/15min",
    es: "https://calendly.com/hello-vantx/15min-es",
  };

  function getCalendlyUrl() {
    var lang =
      window.i18n && typeof window.i18n.getCurrentLang === "function"
        ? window.i18n.getCurrentLang()
        : "en";
    return CALENDLY_URLS[lang] || CALENDLY_URLS.en;
  }

  var widgetLoaded = false;
  var _widgetPromise = null;

  var WIDGET_TIMEOUT_MS = 10000;

  function loadCalendlyWidget() {
    if (_widgetPromise) return _widgetPromise;

    _widgetPromise = new Promise(function (resolve, reject) {
      // Load CSS (if not already loaded)
      if (
        !document.querySelector(
          'link[href*="calendly.com/assets/external/widget.css"]',
        )
      ) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://assets.calendly.com/assets/external/widget.css";
        document.head.appendChild(link);
      }

      // Timeout guard — don't leave button stuck in loading state forever
      var timer = setTimeout(function () {
        _widgetPromise = null;
        reject(new Error("Calendly widget load timed out"));
      }, WIDGET_TIMEOUT_MS);

      // Load JS
      var script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.onload = function () {
        clearTimeout(timer);
        widgetLoaded = true;
        resolve();
      };
      script.onerror = function () {
        clearTimeout(timer);
        _widgetPromise = null; // allow retry
        reject(new Error("Calendly widget failed to load"));
      };
      document.head.appendChild(script);
    });

    return _widgetPromise;
  }

  function openCalendly() {
    if (window.Calendly) {
      Calendly.initPopupWidget({ url: getCalendlyUrl() });
    } else {
      // Widget not yet loaded — open in new tab as fallback
      window.open(getCalendlyUrl(), "_blank", "noopener,noreferrer");
    }
  }

  /** Show/hide a loading state on the trigger button while Calendly loads */
  function setTriggerLoading(trigger, loading) {
    if (!trigger) return;
    if (loading) {
      trigger._originalText = trigger.textContent;
      trigger.setAttribute("aria-busy", "true");
      trigger.style.pointerEvents = "none";
      trigger.style.opacity = "0.7";
    } else {
      trigger.removeAttribute("aria-busy");
      trigger.style.pointerEvents = "";
      trigger.style.opacity = "";
    }
  }

  // Intercept all CTA clicks
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".js-calendly-trigger");
    if (!trigger) return;
    e.preventDefault();

    if (widgetLoaded) {
      openCalendly();
    } else {
      // First click — load widget via onload callback, no polling
      setTriggerLoading(trigger, true);
      loadCalendlyWidget()
        .then(function () {
          setTriggerLoading(trigger, false);
          openCalendly();
        })
        .catch(function () {
          setTriggerLoading(trigger, false);
          window.open(getCalendlyUrl(), "_blank", "noopener,noreferrer");
        });
    }
  });

  // Preload Calendly widget on first user interaction (hover/touch)
  // so it's ready by the time they actually click
  var preloaded = false;
  function preloadOnInteraction() {
    if (preloaded) return;
    preloaded = true;
    loadCalendlyWidget();
    document.removeEventListener("mouseover", handlePreload);
    document.removeEventListener("touchstart", handlePreload);
  }

  function handlePreload(e) {
    if (e.target.closest(".js-calendly-trigger")) {
      preloadOnInteraction();
    }
  }

  document.addEventListener("mouseover", handlePreload);
  document.addEventListener("touchstart", handlePreload, { passive: true });

  // GA4: track Calendly booking completions
  // Validate origin strictly — must end with calendly.com (not a substring match)
  window.addEventListener("message", function (e) {
    try {
      var origin = new URL(e.origin);
      if (
        origin.hostname !== "calendly.com" &&
        !origin.hostname.endsWith(".calendly.com")
      )
        return;
    } catch (_) {
      return; // malformed origin — ignore
    }
    if (e.data && e.data.event === "calendly.event_scheduled") {
      if (typeof gtag === "function") {
        gtag("event", "calendly_booking", {
          event_category: "engagement",
          event_label: "demo_scheduled",
        });
      }
    }
  });
})();
