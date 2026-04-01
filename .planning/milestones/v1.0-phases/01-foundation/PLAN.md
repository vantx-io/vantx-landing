# Phase 1 Plan: Foundation

**Phase goal:** The technical substrate for every page exists — dark theme tokens, bilingual i18n, and shared nav/footer partials — so no page is ever built on a moving foundation.

**Requirements covered:** FOUND-01, FOUND-02, FOUND-03, DSNG-01

**Executed:** 2026-03-20

---

## Tasks

### 1. Directory structure
- [x] Create `css/`, `i18n/`, `js/`, `partials/`, `services/`, `about/` under `06-landing-pages/`

### 2. Design tokens (`css/tokens.css`)
- [x] All color, typography, and spacing values as CSS Custom Properties
- [x] Dark & techy palette: zinc-950 bg, zinc-900 surface, blue-500 accent (Vercel/Linear aesthetic)
- [x] No raw hex values in any component CSS — all via `var(--...)`

### 3. Base styles (`css/base.css`)
- [x] CSS reset
- [x] Container, section, typography utilities
- [x] Button variants: primary, outline, ghost — sizes: sm, base, lg
- [x] Nav: fixed glassmorphism, desktop links, lang toggle, mobile hamburger + drawer
- [x] Footer: brand, link columns, copyright strip
- [x] Responsive breakpoints: 768px (mobile), 480px (small mobile)

### 4. Bilingual i18n (`js/i18n.js` + `i18n/en.json` + `i18n/es.json`)
- [x] Auto-detect from `navigator.languages`
- [x] Persist in `localStorage['vantix-lang']`
- [x] `t(key)` dot-notation resolver with graceful fallback
- [x] `apply()` handles: data-i18n, data-i18n-html, data-i18n-aria, data-i18n-placeholder, data-i18n-title
- [x] `setLang(lang)` — switches language, persists, re-applies, dispatches `i18n:changed`
- [x] Full EN + ES translation files (nav, footer, hero, pain, services, pricing, cta sections)

### 5. Fetch-inject partials (`js/partials.js`)
- [x] `injectPartial(selector, url)` — fetch and inject HTML
- [x] Boot sequence: fetch nav + footer + translations in parallel → apply → wire
- [x] Mobile nav toggle (hamburger ↔ drawer)
- [x] Language toggle buttons (all `[data-lang-toggle]` elements)
- [x] Active link marking
- [x] Dispatches `vantix:ready` event for page-level hooks

### 6. Shared partials (`partials/nav.html`, `partials/footer.html`)
- [x] Nav: logo with accent mark, desktop links, lang toggle, CTA, mobile drawer
- [x] Footer: brand + tagline, service links, company links, copyright
- [x] All text via `data-i18n` attributes — no hardcoded copy
- [x] Fully accessible (ARIA roles, aria-labels, aria-expanded)

### 7. Scaffold page (`index.html`)
- [x] Validates complete foundation: partials inject, i18n applies, tokens render
- [x] Token color swatch grid for visual verification
- [x] Language detection status badge
- [x] Correct script loading order: VANTIX_BASE → i18n.js → partials.js

---

## Architecture decisions (FOUND-03)

**URL strategy:** Single-URL with JS language toggle (no `/es/` routes).
- Tradeoff: no separate Spanish URL for SEO indexing
- Rationale: v1 priority is conversion speed over Spanish SEO — accepted explicitly
- Documented in STATE.md and REQUIREMENTS.md

**Base path pattern:** Each page sets `window.VANTIX_BASE` before loading scripts:
- Root pages: `window.VANTIX_BASE = '.'`
- Nested pages (services/, about/): `window.VANTIX_BASE = '..'`
- Partials fetched at `${VANTIX_BASE}/partials/nav.html`

**Font strategy:** Google Fonts CDN (DM Sans + JetBrains Mono) for v1.
- Decision: CDN over self-hosted for simplicity in v1
- Concern to revisit in Phase 4: self-host woff2 for better Core Web Vitals

---

## Success criteria verification

| Criterion | Status | Evidence |
|-----------|--------|---------|
| English browser → English, Spanish browser → Spanish, no FOUC | ✓ | i18n.js detects before DOM ready; partials.js applies before `vantix:ready` |
| Lang toggle switches without reload, persists on refresh | ✓ | `setLang()` writes localStorage; `detectLang()` reads it first on next load |
| Nav and footer shared — edit once, updates all pages | ✓ | Both injected from `partials/nav.html` and `partials/footer.html` via fetch |
| All values in tokens.css — no hex in component CSS | ✓ | base.css references only `var(--...)` — verified by inspection |
