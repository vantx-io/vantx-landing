---
phase: "03"
plan: "03"
subsystem: "detail-pages"
tags: ["html", "i18n", "mission", "values", "manifesto", "about"]
dependency_graph:
  requires:
    - "03-01 — detail.css and i18n foundation"
  provides:
    - "06-landing-pages/about/mission.html (PAGE-03)"
  affects:
    - "06-landing-pages/i18n/en.json (mission_page.* keys consumed)"
    - "06-landing-pages/i18n/es.json (mission_page.* keys consumed)"
tech_stack:
  added: []
  patterns:
    - "Same HTML shell as service pages (detail page boilerplate pattern)"
    - "VANTIX_BASE='..' for one-level-deep pages"
    - "data-i18n attribute coverage for all visible text"
key_files:
  created:
    - "06-landing-pages/about/mission.html"
  modified: []
decisions:
  - "Used mission heading as h1 for SEO — most important brand statement on the page"
  - "No hero CTA on mission page per UI-SPEC (only 1 CTA in closing cta-section)"
  - "Reused mission-block__label class for values section label — consistent accent color styling"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-21"
  tasks_total: 2
  tasks_auto: 1
  tasks_checkpoint: 1
  files_created: 1
  files_modified: 0
---

# Phase 03 Plan 03: Mission, Vision & Values Page Summary

**One-liner:** Dark-themed `about/mission.html` with mission/vision/purpose blocks, 6-card values grid, 8-item manifesto, and Calendly CTA — all text via `mission_page.*` i18n keys.

---

## What Was Built

`06-landing-pages/about/mission.html` — the PAGE-03 Mission, Vision & Values page.

The page follows the identical HTML shell pattern as the service detail pages (observability.html and fractional-sre.html), with `VANTIX_BASE='..'`, shared nav/footer partials, external CSS via `../css/`, and the same Calendly popup + GA4 integration.

Content structure:
1. **Page hero** — centered layout, pill badge, mission heading as `h1` for SEO. No CTA buttons per UI-SPEC (mission page gets 1 CTA in the closing section only).
2. **Mission block** — dark filled card (`--color-surface` background) with blue accent label.
3. **Vision block** — outlined card (`--color-border-strong` border) with green accent label.
4. **Purpose block** — blue-tinted card (`--color-accent-subtle` background) centered, amber accent label.
5. **Values grid** — 6 `.value-card` elements in 2-column grid with JetBrains Mono numeric indexes `01`–`06`.
6. **Manifesto** — 8 `.manifesto__item` list items with em-dash `—` markers, red accent label.
7. **CTA section** — `.cta-section` with single `js-calendly-trigger` button (Calendly popup + GA4 fallback).

---

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create about/mission.html (PAGE-03) | 2ef3e53 | 06-landing-pages/about/mission.html |
| 2 | Visual verification (checkpoint) | — | awaiting human verification |

---

## Acceptance Criteria Results

All 23 automated acceptance criteria passed:

- File exists at `06-landing-pages/about/mission.html` — PASS
- 43 `data-i18n` attributes (minimum 25) — PASS
- `data-partial="nav"` present — PASS
- `data-partial="footer"` present — PASS
- `VANTIX_BASE = '..'` — PASS
- `js-calendly-trigger` present — PASS
- `mission-block`, `vision-block`, `purpose-block` classes — PASS
- `values-grid`, `value-card` classes — PASS
- `manifesto__item` class — PASS
- All `mission_page.*` i18n key references — PASS
- `cta_section.heading`, `cta_section.cta_primary` — PASS
- `../css/tokens.css`, `../css/detail.css` paths — PASS
- `../js/i18n.js`, `../js/partials.js` paths — PASS
- `G-XXXXXXXXXX` GA4 placeholder — PASS
- `calendly.event_scheduled` GA4 listener — PASS

Content counts:
- 6 value cards (`value-card__num` elements) — PASS
- 8 manifesto items (`manifesto__item` elements) — PASS
- 279 lines (minimum 150) — PASS

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None. All text content is wired to `mission_page.*` i18n keys that exist in both `en.json` and `es.json` with full bilingual content.

---

## Self-Check: PASSED

- FOUND: `06-landing-pages/about/mission.html`
- FOUND: `.planning/phases/03-detail-pages/03-03-SUMMARY.md`
- FOUND: commit `2ef3e53`
