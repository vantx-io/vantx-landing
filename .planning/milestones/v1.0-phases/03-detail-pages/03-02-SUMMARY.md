---
phase: 03
plan: 02
subsystem: landing-pages
tags: [html, i18n, detail-pages, observability, sre, calendly, ga4]
dependency_graph:
  requires:
    - "03-01"  # detail.css and updated i18n keys
  provides:
    - "services/observability.html (PAGE-01)"
    - "services/fractional-sre.html (PAGE-02)"
  affects:
    - "06-landing-pages/services/ — both pages now exist"
tech_stack:
  added: []
  patterns:
    - "VANTIX_BASE = '..' pattern for subdirectory pages"
    - "data-i18n attribute i18n integration with obs_page.*/sre_page.* namespaces"
    - "Calendly popup trigger + GA4 booking event listener (from index.html)"
    - "detail.css section classes: .page-hero, .deliverable, .outcomes-grid, .timeline"
key_files:
  created:
    - "06-landing-pages/services/observability.html"
    - "06-landing-pages/services/fractional-sre.html"
  modified: []
decisions:
  - "Used timeline-section class on how-it-works section to apply border-top via detail.css rather than inline style"
  - "Price display placed above h1 in hero for scanability — price is a key qualifying signal"
  - "SRE page has 5 timeline steps (sre_page.how.steps.0-4) vs 6 for observability — matches i18n keys exactly"
  - "Both pages reuse cta_section.* keys for closing CTA — no new CTA copy needed"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 3 Plan 2: Service Detail Pages Summary

**One-liner:** Two bilingual service detail pages (observability green + SRE amber) with Calendly popup, GA4 tracking, shared partials, and full i18n using 74 and 70 data-i18n attributes respectively.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create services/observability.html (PAGE-01) | a7f8a31 | 06-landing-pages/services/observability.html |
| 2 | Create services/fractional-sre.html (PAGE-02) | 05b3e0b | 06-landing-pages/services/fractional-sre.html |

---

## What Was Built

### observability.html (PAGE-01)
- 401 lines, 74 data-i18n attributes
- Sections: page-hero (green, $3,000/month), problem (2 paragraphs), deliverables (6 items with green numbered badges), outcomes (3 cards), how-it-works (6 steps), CTA
- All deliverable badges use `deliverable__num--green` and `deliverable__badge--freq-green`
- Hero CTA + closing CTA both use `js-calendly-trigger` class
- All i18n keys reference `obs_page.*` namespace (67 obs_page.* references)

### fractional-sre.html (PAGE-02)
- 389 lines, 70 data-i18n attributes
- Sections: page-hero (amber, $5,500/month), problem (2 paragraphs), deliverables (6 items with amber numbered badges), outcomes (3 cards), how-it-works (5 steps), CTA
- All deliverable badges use `deliverable__num--amber` and `deliverable__badge--freq-amber`
- Hero CTA + closing CTA both use `js-calendly-trigger` class
- All i18n keys reference `sre_page.*` namespace (63 sre_page.* references)

### Shared boilerplate (both pages)
- `window.VANTIX_BASE = '..'` as first script tag
- CSS: `../css/tokens.css`, `../css/base.css`, `../css/detail.css`
- Scripts: `../js/i18n.js`, `../js/partials.js`
- Calendly popup trigger + fallback window.open
- GA4 snippet with `G-XXXXXXXXXX` placeholder + `calendly.event_scheduled` booking event listener
- `<div data-partial="nav">` and `<div data-partial="footer">` for shared chrome

---

## Deviations from Plan

None — plan executed exactly as written.

The plan specified `style="background: var(--color-surface);"` inline on Problem and Outcomes sections as an acceptable layout override. Both pages follow this guidance. The `how-it-works` section uses the `.timeline-section` class (already defined in detail.css with `border-top: 1px solid var(--color-border)`) instead of an inline style.

---

## Known Stubs

None. All i18n keys reference populated values in both `en.json` and `es.json`. Price values `$3,000` (observability) and `$5,500` (SRE) are canonical and match `index.html`. No placeholder text or empty states exist in either page.

---

## Self-Check: PASSED

Files confirmed:
- `06-landing-pages/services/observability.html` — FOUND
- `06-landing-pages/services/fractional-sre.html` — FOUND

Commits confirmed:
- `a7f8a31` (feat: observability.html) — verified in git log
- `05b3e0b` (feat: fractional-sre.html) — verified in git log
