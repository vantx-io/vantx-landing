/**
 * Vantx Calendly Integration — lazy-loaded popup + GA4 tracking
 *
 * Instead of loading Calendly's ~300KB widget.js on every page,
 * this script loads it on-demand when a user first clicks a CTA.
 * Subsequent clicks open the popup instantly (script already loaded).
 *
 * Triggers:
 *   .js-calendly-trigger  — button CTA
 *   [href="#calendly"]     — nav link CTA
 *
 * GA4 event:
 *   calendly_booking (fired when Calendly confirms a scheduled event)
 */

(function () {
  "use strict";

  var CALENDLY_URL = "https://calendly.com/hello-vantx/15min";

  var widgetLoaded = false;
  var widgetLoading = false;

  function loadCalendlyWidget() {
    if (widgetLoaded || widgetLoading) return;
    widgetLoading = true;

    // Load CSS (if not already loaded by the deferred print trick)
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

    // Load JS
    var script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.onload = function () {
      widgetLoaded = true;
      widgetLoading = false;
    };
    script.onerror = function () {
      widgetLoading = false;
    };
    document.head.appendChild(script);
  }

  function openCalendly() {
    if (window.Calendly) {
      Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      // Widget not yet loaded — open in new tab as fallback
      window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    }
  }

  // Intercept all CTA clicks
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest('.js-calendly-trigger, [href="#calendly"]');
    if (!trigger) return;
    e.preventDefault();

    if (widgetLoaded) {
      openCalendly();
    } else {
      // First click — start loading, then open when ready
      loadCalendlyWidget();
      // Try to open after a short delay for the script to load
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (window.Calendly) {
          clearInterval(interval);
          openCalendly();
        } else if (attempts > 50) {
          // 5 seconds max — fall back to new tab
          clearInterval(interval);
          window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
        }
      }, 100);
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
    if (
      e.target.closest(
        '.js-calendly-trigger, [href="#calendly"], .btn--primary',
      )
    ) {
      preloadOnInteraction();
    }
  }

  document.addEventListener("mouseover", handlePreload);
  document.addEventListener("touchstart", handlePreload, { passive: true });

  // GA4: track Calendly booking completions
  window.addEventListener("message", function (e) {
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
