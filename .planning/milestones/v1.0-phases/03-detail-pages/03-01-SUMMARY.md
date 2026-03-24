---
phase: 03-detail-pages
plan: 01
subsystem: css-i18n
tags: [css, i18n, detail-pages, tokens, bilingual]
dependency_graph:
  requires:
    - 06-landing-pages/css/tokens.css
    - 06-landing-pages/css/base.css
    - 06-landing-pages/i18n/en.json (existing keys)
    - 06-landing-pages/i18n/es.json (existing keys)
  provides:
    - 06-landing-pages/css/detail.css
    - obs_page.* i18n namespace (EN + ES)
    - sre_page.* i18n namespace (EN + ES)
    - mission_page.* i18n namespace (EN + ES)
  affects:
    - 06-landing-pages/services/observability.html (next plan)
    - 06-landing-pages/services/fractional-sre.html (next plan)
    - 06-landing-pages/about/mission.html (next plan)
tech_stack:
  added: []
  patterns:
    - CSS Custom Properties for all values (zero raw hex)
    - Responsive breakpoints at 900px / 768px / 600px / 480px
    - JSON array structure for ordered items (i18n arrays indexed by position)
    - Symmetric key structure across en.json and es.json
key_files:
  created:
    - 06-landing-pages/css/detail.css
  modified:
    - 06-landing-pages/i18n/en.json
    - 06-landing-pages/i18n/es.json
decisions:
  - Used .timeline-section class for border-top on timeline section container to avoid conflicts with .section utility class
  - obs_page deliverables: 6 items (plan spec had 6, legacy file had 5 — used plan spec as authoritative since it represents the current service offering)
  - sre_page: content authored in both EN and ES following observability page structure exactly
  - mission_page: ES content taken verbatim from vantix-mision-vision-valores.html legacy file; EN authored as quality translation
metrics:
  duration: "337s (~6 minutes)"
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
requirements_fulfilled:
  - PAGE-01 (foundation layer)
  - PAGE-02 (foundation layer)
  - PAGE-03 (foundation layer)
---

# Phase 3 Plan 1: Detail Page CSS + i18n Foundation Summary

Shared CSS file (`detail.css`) and bilingual i18n keys for all three Phase 3 detail pages — 7 CSS section types in 530 lines with 180 token references, plus 3 new i18n namespaces (~120 keys each) symmetric across EN and ES.

## What Was Built

### Task 1: `detail.css` (530 lines, 180 token references)

Seven section types, all values via CSS Custom Properties from `tokens.css`. Zero raw hex values.

| Section | Class | Purpose |
|---------|-------|---------|
| Page Hero | `.page-hero` | Padding-based hero (not full-viewport) with dot-grid + glow |
| Deliverables | `.deliverables`, `.deliverable` | Numbered grid with green/amber badge variants |
| Outcomes Grid | `.outcomes-grid`, `.outcome-card` | 3-column cards with hover |
| Timeline | `.timeline`, `.timeline__step` | Vertical connector with dot markers |
| Values Grid | `.values-grid`, `.value-card` | 2-column cards for mission page |
| Mission/Vision/Purpose | `.mission-block`, `.vision-block`, `.purpose-block` | Three distinct block styles |
| Manifesto | `.manifesto`, `.manifesto__item` | Em-dash marked list |

Responsive breakpoints:
- `max-width: 900px` — outcomes-grid collapses to 1 column
- `max-width: 768px` — page-hero headline drops to `--text-xl`; deliverables grid collapses to 1fr
- `max-width: 600px` — values-grid collapses to 1 column
- `max-width: 480px` — hero actions stack vertically, buttons full-width

### Task 2: i18n Extensions (~538 new lines)

Three new top-level namespaces added after `cta_section` in both files. All existing keys preserved intact.

| Namespace | EN | ES | Source |
|-----------|----|----|--------|
| `obs_page` | 6 deliverables, 3 outcomes, 6 steps | Same structure | ES from legacy HTML; EN authored |
| `sre_page` | 6 deliverables, 3 outcomes, 5 steps | Same structure | Net-new — authored in both languages |
| `mission_page` | 6 values, 8 manifesto items | Same structure | ES from legacy HTML; EN authored |

Key symmetry confirmed: every array and object in EN has an exact counterpart in ES at the same path.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: detail.css | `0bc3a12` | feat(03-01): create detail.css with all 7 section styles |
| Task 2: i18n keys | `66bab5c` | feat(03-01): add obs_page, sre_page, and mission_page i18n keys |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

1. The plan spec listed 6 deliverables for `obs_page` while the legacy `vantix-observability-as-a-service.html` showed 5. The plan spec is authoritative (it represents the current service offering, not the legacy content). 6 deliverables were implemented as specified.

2. `.timeline-section` helper class added to detail.css (not in the original spec) to carry the `border-top: 1px solid var(--color-border)` prescribed for the section wrapper. This is a non-breaking addition — the plan called for a section border-top but didn't name the class. Executor chose `.timeline-section` to avoid overloading `.section` from base.css.

## Known Stubs

None. Both `detail.css` and the i18n files contain complete, production-ready content. No placeholders or TODO markers. The i18n content for `sre_page` is net-new authored content — no legacy source existed — but it is complete and bilingual, not stubbed.

## Verification Results

All acceptance criteria passed:

- `detail.css` exists: PASS (530 lines)
- Token references >= 50: PASS (180 references)
- All 7 section types present: PASS
- Zero raw hex values: PASS
- Mobile breakpoints at 900px, 768px, 600px, 480px: PASS
- `en.json` parses as valid JSON: PASS
- `es.json` parses as valid JSON: PASS
- All three namespaces in EN: PASS (obs_page, sre_page, mission_page)
- All three namespaces in ES: PASS (obs_page, sre_page, mission_page)
- Existing keys preserved (hero, pain, services, pricing, cta_section): PASS
- Symmetric key structure across EN and ES: PASS

## Self-Check: PASSED

Files confirmed present:
- `06-landing-pages/css/detail.css` — FOUND
- `06-landing-pages/i18n/en.json` (contains obs_page) — FOUND
- `06-landing-pages/i18n/es.json` (contains obs_page) — FOUND

Commits confirmed:
- `0bc3a12` — FOUND
- `66bab5c` — FOUND
