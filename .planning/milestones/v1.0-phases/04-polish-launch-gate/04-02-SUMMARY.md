---
phase: 04-polish-launch-gate
plan: 02
subsystem: ui
tags: [html, css, i18n, faq, social-proof, deliverables-grid, bilingual]

# Dependency graph
requires:
  - phase: 03-detail-pages
    provides: "Detail page HTML files (observability, fractional-sre, qa-tech-lead, performance), i18n en.json/es.json structure, detail.css"
provides:
  - "Social proof placeholder section on index.html between services and compare sections"
  - "Service-specific FAQ section on observability.html (was missing before)"
  - "Service-specific FAQ items prepended to fractional-sre.html, qa-tech-lead.html, performance.html"
  - "16 bilingual FAQ items (4 per service) in en.json and es.json"
  - "Deliverables grid layout (2-col desktop) on all 4 detail pages"
  - "social_proof i18n keys in en.json and es.json"
affects: [05-launch, verifier-phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service-specific i18n: page-scoped keys (obs_page.faq.items.{N}.question/answer) vs global faq.items.{N}.q/a"
    - "Deliverables grid: .deliverables__grid wrapper with repeat(2, 1fr) at 768px — applied to all detail pages"
    - "Social proof placeholder: 2 cards with .surface treatment, muted italic placeholder text"

key-files:
  created: []
  modified:
    - landing/index.html
    - landing/css/landing.css
    - landing/css/detail.css
    - landing/services/observability.html
    - landing/services/fractional-sre.html
    - landing/services/qa-tech-lead.html
    - landing/services/performance.html
    - landing/i18n/en.json
    - landing/i18n/es.json

key-decisions:
  - "Service-specific FAQ keys use page-scoped dot notation (obs_page.faq.items.0.question) not the global faq.items.0.q pattern — keeps them scoped and prevents key collisions"
  - "Social proof placeholder uses italic muted text to signal temporary content — visually subordinate without hiding the section structure"
  - "Deliverables grid hides number badges (.deliverable__num-wrap display:none) in grid mode — card visual unit replaces number as primary organizer"
  - "Service-specific FAQs inserted BEFORE shared subscription FAQs — page visitors care about service specifics first"
  - "deliverable-break hr elements removed inside grid wrappers — card borders provide adequate visual separation"

patterns-established:
  - "FAQ pattern: service-specific items first, then shared global items — consistent across all detail pages"
  - "i18n object structure: faq sub-object added at end of each page object in both en.json and es.json"

requirements-completed: [DSNG-02]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 4 Plan 2: Content Enhancements Summary

**Social proof placeholder with 2-col grid, service-specific FAQs (16 bilingual items across 4 pages), and deliverables restructured into scannable 2-col grid cards**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T14:20:22Z
- **Completed:** 2026-03-24T14:27:22Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Social proof section inserted between services and compare on index.html — ready for real testimonials
- Observability page now has a FAQ section (it was the only detail page missing one)
- 16 service-specific FAQ items added across 4 detail pages (4 each), bilingual EN+ES
- Deliverables sections on all 4 detail pages restructured into 2-column card grid on desktop

## Task Commits

Each task was committed atomically:

1. **Task 1: Social proof placeholder section and deliverables grid CSS** - `d05f0a8` (feat)
2. **Task 2: Service-specific FAQs and deliverables grid on 4 detail pages** - `a654f05` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified

- `landing/index.html` - Added `.social-proof` section between services and compare
- `landing/css/landing.css` - Added `.social-proof__grid`, `.social-proof__card`, `.social-proof__quote`, `.social-proof__text` rules
- `landing/css/detail.css` - Added `.deliverables__grid` with 2-col desktop layout and card styling
- `landing/services/observability.html` - Added FAQ section (4 service-specific items); wrapped deliverables in `.deliverables__grid`; removed `<hr class="deliverable-break">`
- `landing/services/fractional-sre.html` - Added 4 service-specific FAQ items before shared items; wrapped deliverables in `.deliverables__grid`; removed `<hr class="deliverable-break">`
- `landing/services/qa-tech-lead.html` - Added 4 service-specific FAQ items before shared items; wrapped deliverables in `.deliverables__grid`; removed `<hr class="deliverable-break">`
- `landing/services/performance.html` - Added 4 service-specific FAQ items before existing items; wrapped deliverables in `.deliverables__grid`; removed `<hr class="deliverable-break">`
- `landing/i18n/en.json` - Added `social_proof` object and `obs_page.faq`, `sre_page.faq`, `qa_page.faq`, `perf_page.faq` sub-objects
- `landing/i18n/es.json` - Same additions with natural Latin American Spanish translations

## Decisions Made

- Service-specific FAQ keys use page-scoped dot notation (`obs_page.faq.items.0.question`) — not the global `faq.items.0.q` pattern — to avoid key collisions
- Social proof placeholder uses italic muted text to signal temporary content while maintaining the section structure for future real testimonials
- Deliverable number badges (`.deliverable__num`) are hidden inside grid mode via CSS — card boundaries replace numbers as the visual organizer
- Service-specific FAQs inserted BEFORE global subscription FAQs on all pages — page visitors care about service-specific questions first

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Parallel execution note: Plan 01 was running concurrently and had already applied the "Also Available" button cleanup (D-16) and added `.services__also-footer` CSS to `landing.css`. The social proof insertion point in index.html was correctly placed after those changes were present.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All content placeholders ready for phase 04-03 (accessibility audit and visual polish)
- Social proof section has correct structure for future testimonials — just swap placeholder text
- FAQ sections have consistent structure across all pages — language toggle will work automatically
- Deliverables grid layout will render correctly when pages are opened in browser

---
*Phase: 04-polish-launch-gate*
*Completed: 2026-03-24*
