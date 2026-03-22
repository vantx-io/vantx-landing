/**
 * Vantx Scroll-Reveal — Entrance animations for below-the-fold sections
 *
 * Adds .reveal to sections that start below the viewport, then adds
 * .is-visible when they enter view via IntersectionObserver. CSS handles
 * the transition (defined in base.css).
 *
 * Skipped entirely for prefers-reduced-motion users — sections render
 * normally without any opacity/transform changes.
 */

(function () {
  "use strict";

  // Respect reduced-motion preference — show everything immediately
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  function init() {
    var viewportH = window.innerHeight;

    // Select sections that DON'T have their own entrance animations
    var sections = document.querySelectorAll(
      ".section:not(.hero):not(.page-hero):not(.credibility)",
    );

    sections.forEach(function (el) {
      var rect = el.getBoundingClientRect();

      // Only animate sections starting below the viewport —
      // avoids flashing content the user has already seen
      if (rect.top >= viewportH) {
        el.classList.add("reveal");
        observer.observe(el);
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
