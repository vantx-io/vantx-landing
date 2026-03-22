/**
 * Vantx GA4 Custom Events
 *
 * Tracks key conversion signals beyond what GA4 Enhanced Measurement
 * provides out of the box (pageviews, scrolls, outbound clicks).
 *
 * Events:
 *   begin_checkout   — Stripe "Start Today" link clicked
 *   generate_lead    — "Book a Call" Calendly CTA clicked
 *   view_item        — service detail page loaded (with service name)
 *   select_item      — "Also available" service link clicked
 *   faq_open         — FAQ accordion item opened
 *   lang_switch      — language toggle clicked
 */

(function () {
  "use strict";

  function track(event, params) {
    if (typeof gtag === "function") {
      gtag("event", event, params);
    }
  }

  /* ------------------------------------------------------------------
     Stripe CTA → begin_checkout
     Fires when user clicks any link pointing to buy.stripe.com
     ------------------------------------------------------------------ */

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href*="buy.stripe.com"]');
    if (!link) return;

    // Detect which product from the URL or page context
    var label = "unknown";
    if (link.href.indexOf("gEg00") !== -1) label = "performance_subscription";
    if (link.href.indexOf("gEg01") !== -1) label = "performance_checkup";

    track("begin_checkout", {
      currency: "USD",
      items: [{ item_name: label }],
    });
  });

  /* ------------------------------------------------------------------
     Calendly CTA → generate_lead
     Fires on click (not on booking — that's in calendly.js)
     ------------------------------------------------------------------ */

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".js-calendly-trigger");
    if (!trigger) return;

    // Determine context from closest section or page
    var section = trigger.closest("[aria-label], [aria-labelledby]");
    var label = section
      ? section.getAttribute("aria-label") ||
        section.getAttribute("aria-labelledby")
      : "unknown";

    track("generate_lead", {
      event_label: label,
      currency: "USD",
      value: 0,
    });
  });

  /* ------------------------------------------------------------------
     Service detail page → view_item
     Fires once on load if the page is a service detail page
     ------------------------------------------------------------------ */

  var pageHero = document.querySelector(".page-hero");
  if (pageHero) {
    var pill = pageHero.querySelector(".pill");
    var serviceName = pill ? pill.textContent.trim() : document.title;
    var priceEl = pageHero.querySelector(".page-hero__price-amount");
    var price = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, "") : "";

    track("view_item", {
      currency: "USD",
      value: parseFloat(price) || 0,
      items: [
        {
          item_name: serviceName,
          price: parseFloat(price) || 0,
        },
      ],
    });
  }

  /* ------------------------------------------------------------------
     "Also available" service links → select_item
     ------------------------------------------------------------------ */

  document.addEventListener("click", function (e) {
    var link = e.target.closest(".services__also-name");
    if (!link) return;

    track("select_item", {
      items: [{ item_name: link.textContent.trim() }],
    });
  });

  /* ------------------------------------------------------------------
     FAQ accordion → faq_open
     ------------------------------------------------------------------ */

  document.addEventListener("toggle", function (e) {
    if (!e.target.matches || !e.target.matches(".faq__item")) return;
    if (!e.target.open) return; // only track opens, not closes

    var question = e.target.querySelector(".faq__question");
    track("faq_open", {
      event_label: question ? question.textContent.trim() : "unknown",
    });
  }, true); // useCapture — toggle doesn't bubble

  /* ------------------------------------------------------------------
     Language switch → lang_switch
     ------------------------------------------------------------------ */

  document.addEventListener("i18n:changed", function (e) {
    track("lang_switch", {
      event_label: e.detail ? e.detail.lang : "unknown",
    });
  });
})();
