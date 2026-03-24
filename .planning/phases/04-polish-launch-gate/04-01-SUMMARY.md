---
phase: 04-polish-launch-gate
plan: 01
subsystem: ui
tags: [css, animations, content-visibility, cls, i18n, accessibility]

# Dependency graph
requires:
  - phase: 02-main-landing
    provides: landing/css/landing.css, landing/index.html, landing/i18n/en.json, landing/i18n/es.json
provides:
  - Credibility bar fade-in animation without pop-in (D-04 fix)
  - Hero desktop height override removing excess whitespace (D-05 fix)
  - All borders on site are solid — dashed outlier removed
  - CLS-calibrated contain-intrinsic-size for compare (520px) and cta-section (380px)
  - LATAM banner left-aligned to match page rhythm
  - Single "See all services" text link replacing 3 identical per-row Book a Call buttons (D-16 fix)
  - services.see_all i18n key in both EN and ES
affects: [04-02-plan, 04-03-plan, impeccable-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@keyframes fade-in { from { opacity: 0; } } — simple opacity-only entrance, no translateY pop-in"
    - "content-visibility: auto with calibrated contain-intrinsic-size for layout-stable offscreen sections"
    - "Single group-level CTA (text link) instead of per-row buttons for also-available patterns"

key-files:
  created: []
  modified:
    - landing/css/landing.css
    - landing/index.html
    - landing/i18n/en.json
    - landing/i18n/es.json

key-decisions:
  - "fade-in 400ms (no delay) replaces hero-enter 600ms 700ms for credibility bar — eliminates pop-in on fast connections"
  - "Hero desktop override: min-height: 0 + padding-top/bottom var(--space-24) at min-width: 1024px"
  - "contain-intrinsic-size estimates are starting values — auto prefix lets browser learn real height after first paint"
  - "services.see_all uses arrow via Unicode \\u2192 in JSON, &rarr; entity in HTML"

patterns-established:
  - "Also-available rows: info-only li items with single group footer link — no per-row CTAs"
  - "Credibility bar entrance: fade-in only, 0ms delay — safe pattern for above-fold secondary elements"

requirements-completed: [DSNG-02]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 04 Plan 01: CSS Bug Fixes & Launch Gate Polish Summary

**Six targeted CSS fixes eliminating credibility bar pop-in, hero desktop whitespace, dashed border outlier, CLS jumps, LATAM misalignment, and 3 identical per-row CTAs replaced by a single "See all services" link**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T14:19:16Z
- **Completed:** 2026-03-24T14:22:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Fixed 6 CSS bugs across landing.css and index.html that would have been flagged in the impeccable.style audit
- Credibility bar now fades in at 400ms with no delay, eliminating the pop-in visible on fast connections
- Hero section on desktop (1024px+) uses content-driven height instead of 100dvh, removing blank space below CTA
- Replaced 3 identical "Book a Call" buttons in Also Available rows with a single accessible "See all services" text link

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix CSS bugs — credibility bar, hero height, dashed border, CLS, LATAM banner** - `ded8879` (fix)
2. **Task 2: Replace Also Available per-row CTAs with single "See all services" link** - `d05f0a8` (feat, included in parallel 04-02 commit)

## Files Created/Modified

- `landing/css/landing.css` - 6 CSS fixes: fade-in animation, hero desktop override, solid border, contain-intrinsic-size calibration, LATAM text-align left, services__also-footer and services__also-link rules
- `landing/index.html` - Removed 3 per-row Book a Call buttons, added .services__also-footer with "See all services" link
- `landing/i18n/en.json` - Added services.see_all key: "See all services →"
- `landing/i18n/es.json` - Added services.see_all key: "Ver todos los servicios →"

## Decisions Made

- Used `fade-in 400ms var(--ease-out) both` (no delay) for credibility bar — opacity-only to avoid the translateY motion that caused the pop-in while maintaining a gentle entrance. The `hero-enter` keyframe was preserved intact for existing hero element animations.
- Hero desktop override adds `min-height: 0; padding-top: var(--space-24); padding-bottom: var(--space-24)` at `min-width: 1024px` — mobile `min-height: calc(100dvh - var(--nav-height))` preserved.
- CLS intrinsic-size values are calibrated estimates (not measured) — the `auto` prefix lets the browser learn real heights after first paint, so approximate values reduce initial CLS without being exact.
- "See all services" is a text link (`<a>`) not a button — low visual weight signals navigation, not conversion action. This avoids competing with the primary CTA in the card.

## Deviations from Plan

None — plan executed exactly as written. All 6 CSS fixes applied per specification. The Task 2 commit hash is `d05f0a8` because the parallel 04-02 agent committed on top of the working tree edits, incorporating both plans' changes into a single commit.

## Issues Encountered

- Task 2 commit appeared already incorporated into commit `d05f0a8` by the parallel 04-02 plan agent which was running concurrently on the same working tree. Verified all Task 2 acceptance criteria passed in HEAD.

## Known Stubs

None — all changes are functional CSS fixes and a real i18n key. No hardcoded placeholder text or empty values that flow to UI rendering in the files modified by this plan.

## Next Phase Readiness

- Visual quality gates resolved: audit in Plan 03 sees a clean baseline for the impeccable.style review
- No dashed borders, no pop-in animations, no excess hero whitespace, no template-looking CTA rows
- CLS estimates need browser validation in Plan 03 checkpoint — values are reasonable starting points

## Self-Check: PASSED

- FOUND: landing/css/landing.css
- FOUND: landing/index.html
- FOUND: landing/i18n/en.json
- FOUND: landing/i18n/es.json
- FOUND: .planning/phases/04-polish-launch-gate/04-01-SUMMARY.md
- FOUND commit: ded8879 (Task 1 CSS fixes)
- FOUND commit: d05f0a8 (Task 2 Also Available CTA replacement, via parallel agent)

---
*Phase: 04-polish-launch-gate*
*Completed: 2026-03-24*
