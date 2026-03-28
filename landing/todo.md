# Vantx — Pending Gaps

From critique + copywriting review (2026-03-22).

## Copy

- [ ] **Service-specific FAQs for Observability page** — 4-5 questions (e.g., "What tools do you integrate with?", "How do you reduce our telemetry bill?", "Do you replace our current monitoring?")
- [ ] **Service-specific FAQs for Fractional SRE page** — 4-5 questions (e.g., "How embedded is the SRE?", "What happens during a live incident?", "Do you do on-call?")
- [ ] **Service-specific FAQs for QA Tech Lead page** — 4-5 questions (e.g., "What frameworks do you support?", "Do you write tests or teach our team?", "How long until we're autonomous?")
- [ ] **Social proof section** — No testimonials, logos, case studies, or client outcomes anywhere on the site. Biggest conversion blocker for a $5,995/mo B2B service. Options when content is available:
  - Anonymized dashboard screenshot or redacted report excerpt
  - Client testimonial (even 1 is better than 0)
  - "What clients receive in week 1" concrete artifact
  - Place between services section and comparison table on landing page

## Design / Layout

- [ ] **Detail pages are text walls** — 7 deliverables on performance page with no visual break. Options:
  - Break deliverables into 2-3 groups with section dividers or alternating backgrounds
  - Pull one key stat from each deliverable into a visual callout
  - Reduce to 4-5 deliverables, collapse rest into expandable section
  - Use `/arrange` for structural rhythm, `/distill` to reduce to essentials
- [ ] **LATAM banner alignment** — Centered text while rest of page is left-aligned. Feels disconnected when it appears. Align left to match page rhythm.
- [ ] **Hero empty space** — `min-height: 100vh` on desktop means pill-headline-sub-CTAs float in a sea of white surface. Top half is underdressed. Consider reducing min-height or adding subtle visual element.
- [ ] **Dashed border inconsistency** — Service card's "Or start with" one-time section uses a dashed border top — the only dashed border on the site. Replace with solid or a different visual separator.
- [ ] **Credibility bar entrance animation** — 700ms delay causes visible pop-in below hero on fast connections. Consider removing translateY and using fade-only, or reducing delay.

## CTA / Conversion

- [ ] **"Also available" per-row CTAs** — Three identical "Book a Call" buttons in a column reads as template, not design. Consider a single CTA at the bottom of the group instead of per-row buttons.
- [ ] **Stripe checkout transition** — "Start Today" goes to Stripe test link. When live, the jump from warm-parchment-editorial to Stripe's default checkout is a tonal shift. Add a custom Stripe product description that matches brand voice, or add a pre-checkout confirmation step.
- [ ] **`content-visibility: auto` layout jumps** — `contain-intrinsic-size` estimates on `.pain`, `.compare`, `.faq` are rough. If actual sizes differ, users see visible layout jumps when scrolling. Measure and calibrate.
