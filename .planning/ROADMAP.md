# Roadmap: Vantix Landing Page System

## Overview

Build a static bilingual landing page system that converts visitors into booked demos via Calendly. The work follows a strict dependency order: design tokens and language infrastructure first, then the main conversion page (the highest-value surface and full integration test), then service detail pages, then a mandatory audit gate before launch. Four phases — coarse granularity — each delivering a verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - CSS tokens, i18n system, shared partials — everything else depends on this
- [x] **Phase 2: Main Landing** - index.html with hero, services, pricing, Calendly popup, and GA4 tracking
- [ ] **Phase 3: Detail Pages** - Three service pages (Observability, Fractional SRE, Mission/Vision)
- [ ] **Phase 4: Polish & Launch Gate** - impeccable.style audit, cross-device verification, ship

## Phase Details

### Phase 1: Foundation
**Goal**: The technical substrate for every page exists — dark theme tokens, bilingual i18n, and shared nav/footer partials — so no page is ever built on a moving foundation
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, DSNG-01
**Success Criteria** (what must be TRUE):
  1. Loading any page in an English browser shows English content; loading in a Spanish browser shows Spanish content with no flash of untranslated text
  2. The language toggle in the nav switches content without a page reload and the preference persists on refresh
  3. Nav and footer render identically on every page, fetched from shared partials — editing `partials/nav.html` updates all pages simultaneously
  4. All color, typography, and spacing values are defined as CSS Custom Properties in `tokens.css` — no hex values or font stacks appear in component CSS
**Plans**: TBD

### Phase 2: Main Landing
**Goal**: `index.html` converts — a visitor can read the hero, understand the pain, see the services and prices, and book a demo without leaving the page; and every booking is tracked in GA4
**Depends on**: Phase 1
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, ANLT-01, ANLT-02
**Success Criteria** (what must be TRUE):
  1. Clicking any CTA on `index.html` opens the Calendly popup without perceptible page lag (Calendly loads async, does not block initial render)
  2. Completing a Calendly booking fires a GA4 custom event visible in GA4 Realtime — the `calendly.event_scheduled` postMessage listener is wired and verified with a real test booking
  3. The pricing section shows tier names and actual prices — no "contact us for pricing" anywhere
  4. The pain section's 6 problem cards and the 3 service cards with links to detail pages are visible and fully translated in both EN and ES
**Plans**: TBD

### Phase 3: Detail Pages
**Goal**: Deep-evaluation buyers can read service-specific pages that share the same dark theme, nav, footer, and i18n as the main landing — each ending with a Calendly conversion moment
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, PAGE-03
**Success Criteria** (what must be TRUE):
  1. All three detail pages (`services/observability.html`, `services/fractional-sre.html`, `about/mission.html` or equivalent) load with the correct dark theme, shared nav, and shared footer — no visual drift from `index.html`
  2. Every detail page is fully bilingual: switching language on the main landing and navigating to a detail page shows the correct language
  3. Each service detail page contains a Calendly booking entry point (inline embed or popup CTA)
**Plans:** 3 plans
Plans:
- [ ] 03-01-PLAN.md — Foundation: detail.css shared styles + all i18n keys for 3 pages
- [ ] 03-02-PLAN.md — Service pages: observability.html + fractional-sre.html
- [ ] 03-03-PLAN.md — Mission page: mission.html + visual verification checkpoint

### Phase 4: Polish & Launch Gate
**Goal**: The site passes every objective quality gate before going live — accessible contrast, design audit, iOS Safari, and font performance
**Depends on**: Phase 3
**Requirements**: DSNG-02
**Success Criteria** (what must be TRUE):
  1. The impeccable.style/cheatsheet audit passes on all four pages — no unresolved design issues
  2. All body text and secondary text passes WCAG 2.1 AA contrast (ratio ≥ 4.5:1) verified with axe DevTools across every page
  3. The language preference persists correctly after a hard reload in a private/incognito window (localStorage behavior confirmed)
  4. Pages render correctly on iOS Safari (tested on a real device, not only DevTools emulation)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | ✓ Done | 2026-03-20 |
| 2. Main Landing | 1/1 | ✓ Done | 2026-03-20 |
| 3. Detail Pages | 0/3 | Planned | - |
| 4. Polish & Launch Gate | 0/TBD | Not started | - |
