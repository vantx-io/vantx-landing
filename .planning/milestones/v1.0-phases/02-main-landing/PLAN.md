# Phase 2 Plan: Main Landing

**Phase goal:** `index.html` converts — a visitor can read the hero, understand the pain, see the services and prices, and book a demo without leaving the page; every booking is tracked in GA4.

**Requirements covered:** LAND-01, LAND-02, LAND-03, LAND-04, ANLT-01, ANLT-02

**Started:** 2026-03-20

---

## Tasks

### 1. Add missing i18n key
- [x] Add `services.learn_more` to `i18n/en.json` and `i18n/es.json`

### 2. Create `css/landing.css`
- [x] Hero section styles (dot grid bg, headline, CTA row)
- [x] Pain section — 3×2 card grid
- [x] Services section — 3-column card grid
- [x] Pricing section — 3 tier cards, Growth card featured
- [x] CTA section — full-width closing push

### 3. Replace `index.html` with full conversion page
- [x] Hero with pill badge, headline, subheadline, two CTAs (LAND-01)
- [x] Pain section with 6 problem cards (LAND-02)
- [x] Services section with 3 cards + detail page links (LAND-03)
- [x] Pricing section with real tier prices (LAND-04)
- [x] CTA section at bottom
- [x] GA4 async snippet with placeholder ID (ANLT-01)
- [x] Calendly popup — async widget load, popupWidget on CTA click (LAND-01)
- [x] `calendly.event_scheduled` postMessage → GA4 event (ANLT-02)

---

## Architecture decisions

**Calendly integration pattern:** Async widget load (CSS in head, JS at body end with `async`).
- On CTA click: call `Calendly.initPopupWidget({ url })` if loaded, fallback to `window.open`.
- Calendly URL placeholder: `https://calendly.com/vantix/30min` — **must be replaced with real URL before launch.**
- Trigger selector: `.js-calendly-trigger` (page CTAs) + `[href="#calendly"]` (nav CTA via delegation).

**GA4 integration:** `gtag.js` loaded async in `<head>` via `<script async>`.
- Measurement ID placeholder: `G-XXXXXXXXXX` — **must be replaced before launch.**
- `calendly.event_scheduled` → `gtag('event', 'calendly_booking', {...})`.

**Hero headline newline:** `hero.headline` contains `\n` — rendered via `white-space: pre-line` on `.hero__headline-main`.

---

## Blockers (pre-launch)

| Item | Action needed |
|------|---------------|
| Calendly URL | Replace `https://calendly.com/vantix/30min` with real account link |
| GA4 Measurement ID | Replace `G-XXXXXXXXXX` with real ID from GA4 property |

---

## Success criteria verification

| Criterion | Status | Evidence |
|-----------|--------|---------|
| CTA click opens Calendly popup, no perceptible lag | ✓ | Calendly widget loads async (`async` attribute); popup triggered on click only |
| `calendly.event_scheduled` → GA4 event | ✓ | postMessage listener wired; fires `gtag('event', 'calendly_booking')` |
| Pricing shows real prices, no "contact us" | ✓ | Starter $2,500 / Growth $5,000 / Enterprise $8,500 via data-i18n |
| 6 pain cards + 3 service cards with detail links visible, bilingual | ✓ | All data-i18n wired; detail page hrefs set for services/ directory |
