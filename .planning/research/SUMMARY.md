# Project Research Summary

**Project:** Vantix Kit — B2B landing page system
**Domain:** Static multi-page B2B SaaS marketing site — bilingual EN/ES, dark techy design, Calendly conversion
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

Vantix is a static, no-build B2B landing page system for a performance/SRE consultancy targeting mid-market LATAM and US engineering leaders. The research is unambiguous: vanilla HTML/CSS/JS is the correct and constrained approach — no framework, no bundler, no SSR. The architecture pattern is a fetch-inject partial system (nav/footer loaded once per page) with a data-i18n DOM-walking i18n module backed by JSON translation files. The entire stack is browser-native, CDN-delivered (Calendly, Google Fonts), and collocated with an existing 4-page site that already defines the color palette and typography.

The recommended build order is design tokens first, then shared CSS, then i18n infrastructure, then the main conversion page, then service detail pages. This sequence is non-negotiable: the i18n system depends on the DOM being fully assembled (partials injected) before translations are applied, and the CSS token layer must exist before components are built or color/spacing values scatter across files. The highest-value conversions happen on `index.html` via Calendly popup — the detail pages exist to satisfy deep-evaluation buyers, not as primary conversion surfaces.

The top risk is the cluster of Calendly-related pitfalls: performance blocking, conversion tracking failures, and FOUC from the language system are each independently capable of making the launch embarrassing for a performance consultancy. All three must be addressed at integration time, not post-launch. A secondary risk is the SEO tradeoff of a single-URL bilingual toggle — this sacrifices Spanish organic search and must be explicitly accepted as a v1 tradeoff rather than discovered after launch.

---

## Key Findings

### Recommended Stack

The stack is entirely zero-build: HTML5 with `data-i18n` attributes for translation targets, CSS3 Custom Properties for the dark theme design token system, and Vanilla JavaScript (ES2022 modules) for i18n logic and partial injection. The Calendly Embed Widget is loaded async from CDN and triggered via `Calendly.initPopupWidget()` on CTA buttons. Typography is DM Sans + JetBrains Mono, already established across the codebase — self-host woff2 files before production launch to eliminate the two-server round-trip that would be especially ironic for a performance consultancy.

The key architectural constraint is that no build tooling is introduced. Any solution that requires npm, a compiler, or a bundler is ruled out. This means CSS preprocessors, Tailwind, React, Astro, and separate-HTML-per-language patterns are all off the table. All existing 4 pages confirm the pattern: CSS inline `<style>` blocks will be extracted to a shared `css/` folder as part of the rebuild.

**Core technologies:**
- HTML5 with `data-i18n` attributes: Document structure + i18n markup — project-constrained, zero runtime cost, consistent with existing pages
- CSS Custom Properties (`tokens.css`): Dark theme design tokens — browser-native, no preprocessor, single source of truth for all color/spacing
- Vanilla JS ES2022 modules: i18n detection/toggle + partial injection — ~50 lines covers the full requirement, no library overhead
- Calendly Embed Widget (CDN async): Primary conversion mechanism — popup pattern preferred for performance; pass `background_color`/`text_color`/`primary_color` URL params for dark theme alignment
- DM Sans + JetBrains Mono: Typography — already in brand system; self-host woff2 for production

### Expected Features

The 10 P1 features that must ship at launch form a tight, interdependent set. The bilingual toggle depends on complete copy in both languages — partial translations look broken, so EN-only is preferable to shipping incomplete ES. Calendly is the single conversion mechanism; every CTA on every page should point to it. Transparent pricing is a differentiator for Vantix specifically (competitor gap: "Contact us for quote"), so the existing JetBrains Mono price display format must be preserved.

**Must have (table stakes):**
- Hero with outcome-first headline + single above-the-fold CTA — first 5 seconds decide everything
- Service cards (3) with deliverables and transparent pricing — B2B buyers evaluate before committing
- Problem/pain section (6 cards) — qualification filter; confirms ICP recognition
- How it works (4-step process) — reduces friction for async-model skeptics
- Social proof: client logos (LATAM Airlines, Mercado Libre, etc.) + stats — reduces purchase anxiety
- Final CTA section with Calendly inline or popup — the conversion moment
- Mobile-responsive layout — non-negotiable for any 2026 page
- Navigation linking all pages — users must reach detail pages without friction
- Service detail pages (3: performance, observability, fractional SRE) — deep-evaluation buyers need this

**Should have (competitive differentiators):**
- Bilingual EN/ES with `navigator.language` auto-detect + `localStorage` toggle — LATAM market access; 76% of B2B buyers prefer native-language content
- Calendly inline embed (not just popup link) — eliminates click-away friction
- Problem-first narrative leading into services — resonates with ICP who already feel the pain
- "Alternative to $150K+ SRE hire" positioning near pricing — comparative value frame
- Add-on / one-shot services section — lowers entry commitment for prospects not ready for retainer
- Dark/techy visual design consistently applied — "built by engineers for engineers" signal

**Defer (v2+):**
- Blog / resources section — requires content production workflow, CMS
- Case studies with metrics — requires completed engagements and client approval
- Named testimonial quotes — add when 2-3 clients are available
- SEO optimization with separate `/en/` and `/es/` URL routes — meaningful only after domain and content are stable
- Analytics (Plausible or similar) — ship v1, then add tracking to optimize

### Architecture Approach

The system is a fetch-inject partial architecture: every HTML page is a self-contained file that, on `DOMContentLoaded`, fetches `partials/nav.html` and `partials/footer.html` via `main.js`, injects them via `innerHTML`, and then (and only then) initializes `i18n.js`. The critical dependency rule is that i18n runs after partial injection — the nav contains `data-i18n` nodes that must exist in the DOM before `applyTranslations()` walks it. CSS is split into 4 files: `tokens.css` (custom properties, loaded first), `base.css`, `layout.css`, `components.css`. Translation strings live in `translations/en.json` and `translations/es.json` with flat dot-notation keys.

**Major components:**
1. `css/tokens.css` — all color/spacing/type design tokens; everything else depends on these being defined first
2. `js/i18n.js` — language detection (`localStorage` first, `navigator.languages` fallback), JSON fetch, DOM walking, toggle handler
3. `js/main.js` — orchestrator: fetches partials, injects them, then calls `i18n.init()`; also owns scroll behavior
4. `partials/nav.html` + `partials/footer.html` — shared fragments (no `<html>` shell); fetched once per page load
5. `index.html` — primary conversion page: hero, pain, services, how-it-works, pricing, Calendly CTA
6. `services/performance.html`, `services/observability.html`, `services/fractional-sre.html` — detail pages for deep-evaluation buyers
7. `translations/en.json` + `translations/es.json` — flat-keyed copy files; single source of truth for all visible text

### Critical Pitfalls

1. **Language Toggle FOUC** — The language initialization script must run as a blocking `<script>` in `<head>` before any content renders. Do NOT defer or async it. Read `localStorage` synchronously and set `document.documentElement.lang` before first paint. Testing only in English Chrome will miss this.

2. **Calendly Blocks Core Web Vitals** — Calendly's widget adds 1-2s on desktop, 2-3s on mobile, plus ~1s CPU for bot-protection fingerprinting. Load the `<script>` with `async`; prefer the popup pattern over inline embed so the widget script doesn't block initial render; add `<link rel="preconnect" href="https://assets.calendly.com">` in `<head>`. A slow page from a performance consultancy is a brand-credibility failure.

3. **Calendly Conversion Tracking Broken by Default** — Native GA4 integration fires events on `calendly.com`, not on the Vantix site. Add `window.addEventListener('message', ...)` to capture the `calendly.event_scheduled` postMessage and fire a GA4 custom event from the parent page. Verify with a test booking in GA4 Realtime before launch.

4. **Dark Theme Color Contrast Failures** — `#8A9BC0` on `#1B2A4A` fails WCAG 2.1 AA. Use `#E2E8F0` for body text, `#94A3B8` minimum for secondary/muted text. Run axe DevTools and the impeccable.style audit on the full page (not just the hero) before calling the design done. Lock tokens before building components — fixing contrast after the fact ripples through everything.

5. **SEO Invisibility for Spanish Content** — A single-URL JS toggle means Googlebot indexes only English. This is a known, accepted tradeoff for v1 but must be explicitly documented rather than discovered post-launch. If Spanish SEO becomes a requirement in v2, it means creating separate `/es/` pages, adding `hreflang` annotations, and resubmitting to Search Console — weeks of recovery if not planned for.

---

## Implications for Roadmap

Based on the dependency chain from ARCHITECTURE.md and the phase warnings in PITFALLS.md, the build must follow a strict foundation-first order. The CSS token layer gates everything visual. The i18n system gates all copy. The partial system gates all shared UI. Only after those three foundations are solid should page content be added.

### Phase 1: Foundation — File Structure, CSS Tokens, and Language System

**Rationale:** The fetch-inject sequence (main.js → inject partials → i18n.init()) and the CSS token layer are the two technical decisions everything else depends on. Getting the language system wrong here (FOUC, incorrect initialization order, overwriting stored preferences) affects every page and every element — it is far cheaper to get right first than to fix after content is authored. The SEO/URL architecture decision must also be made and documented here before any URLs are committed.

**Delivers:** Project directory structure, `css/tokens.css` with full dark palette and typography, `js/i18n.js` with auto-detect and toggle, `js/main.js` with partial orchestration, `translations/en.json` + `translations/es.json` skeleton, `partials/nav.html` + `partials/footer.html` skeleton, documented SEO language tradeoff decision.

**Addresses:** Bilingual EN/ES toggle (P1 feature dependency foundation), navigation shared across all pages

**Avoids:** FOUC pitfall (Pitfall 1), CSS duplication/drift anti-pattern (Architecture anti-pattern 1), separate HTML per language anti-pattern, i18n-before-partials sequencing bug (Pitfall notes + Architecture anti-pattern 4)

---

### Phase 2: Design System and Shared Components

**Rationale:** Once tokens exist, build the full CSS component library (`base.css`, `layout.css`, `components.css`) and wire the real nav/footer partials. This phase is a multiplier — every page benefits from it. Contrast and accessibility checks belong here, before any page uses the components. Running the impeccable.style audit here catches design failures before they are baked into 4 pages.

**Delivers:** Complete CSS component library (hero section, service cards, CTA buttons, nav, footer, how-it-works, pricing display), real `partials/nav.html` with language toggle, `partials/footer.html`, WCAG contrast verified across all token combinations.

**Uses:** CSS Custom Properties token system, DM Sans + JetBrains Mono (self-hosting decision made in Phase 1, woff2 files added here if self-hosting)

**Avoids:** Dark theme contrast failures (Pitfall 4 — fix tokens here, not after pages are built), Google Fonts render-blocking (Performance trap — add `display=swap`, `preconnect`, or switch to self-hosted)

---

### Phase 3: Main Conversion Page (`index.html`)

**Rationale:** `index.html` is the primary conversion surface and the full-stack integration test. Building it before the detail pages validates that partials, i18n, Calendly, and CSS all work end-to-end on the page that matters most. The Calendly integration (async loading, popup pattern, postMessage tracking) is implemented and verified here — performance tested with PageSpeed Insights before moving on.

**Delivers:** Complete `index.html` with hero, pain section, services overview, how-it-works, social proof (client logos + stats), transparent pricing, and Calendly popup CTA. Calendly conversion tracking verified. PageSpeed score > 80 with Calendly active.

**Implements:** `index.html` main page, Calendly popup integration, postMessage conversion tracking

**Avoids:** Calendly blocking Core Web Vitals (Pitfall 2 — lazy-load, async, preconnect), Calendly conversion tracking broken by default (Pitfall 3 — postMessage listener before launch), multiple competing CTAs (Pitfall 6 — one visible primary CTA per viewport)

---

### Phase 4: Service Detail Pages

**Rationale:** The three detail pages (`services/performance.html`, `services/observability.html`, `services/fractional-sre.html`) reuse everything built in Phases 1-3. They are structurally similar and primarily additive HTML. The Calendly integration on detail pages uses `initInlineWidget()` (full booking experience visible without a click) vs. the popup pattern on the main page. Content is migrated from existing `06-landing-pages/*.html` files.

**Delivers:** Three service detail pages with consistent nav/footer, shared CSS, i18n support, and Calendly inline embeds. All cross-linking between index and detail pages verified.

**Implements:** `services/performance.html`, `services/observability.html`, `services/fractional-sre.html`, Calendly inline widget on each, content migrated from existing HTML files

**Avoids:** Service detail pages drifting visually from main page (Feature dependency note — shared CSS prevents this), missing mobile tap targets (Pitfall UX section — all buttons min 44x44px)

---

### Phase 5: Polish, Audit, and Cross-Device Verification

**Rationale:** The "looks done but isn't" checklist from PITFALLS.md identifies a class of failures that only appear in production-like conditions: language preference persistence on reload, Calendly tracking on a real booking, mobile rendering on iOS Safari (not DevTools), fonts on slow 3G in Incognito. This phase is the systematic verification sweep before launch.

**Delivers:** Confirmed language persistence (localStorage tested on reload), confirmed Calendly booking event in GA4 Realtime, impeccable.style audit passed on all pages (not just hero), iOS Safari tested on real device, Lighthouse/PageSpeed > 80 on production URL, Spanish SEO tradeoff documented.

**Avoids:** All "looks done but isn't" pitfalls simultaneously — this phase exists specifically to catch them

---

### Phase Ordering Rationale

- **Tokens before components, components before pages:** A color token change ripples through everything. Lock the system before building on top of it.
- **i18n foundation before copy:** Writing content into HTML before the `data-i18n` system is wired produces untranslatable markup. Wire the system first with placeholder keys; add real copy later.
- **Main page before detail pages:** Index.html is the full integration test. Catching a partial-injection/i18n sequencing bug on the main page is far cheaper than finding it on the third detail page.
- **Calendly performance and tracking in Phase 3, not Phase 5:** These cannot be post-launch fixes. A slow page or a broken conversion funnel must be caught during the phase that introduces Calendly.
- **Audit phase last but mandatory:** The impeccable.style audit, WCAG contrast check, and iOS Safari test are never "done" incrementally — they require a complete page to audit meaningfully.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Language System):** The FOUC prevention technique (blocking `<script>` in `<head>` vs. `visibility: hidden` CSS approach) has implementation nuance. The postMessage sequencing with partial injection may need a spike to verify the exact callback order.
- **Phase 3 (Calendly Integration):** Calendly's widget API behavior (dark theme param coverage, `hideEventTypeDetails`, UTM passthrough, `calendly.event_scheduled` postMessage format) should be verified against a live Calendly account during planning — the CDN script is unversioned and can change without notice.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Design System):** CSS Custom Properties theming is a well-documented, stable pattern. Implementing dark tokens is mechanical given the palette is already defined.
- **Phase 4 (Service Detail Pages):** These are structural replicas of the main page. No novel patterns; content migration from existing HTML files is mechanical.
- **Phase 5 (Polish/Audit):** The checklist is already written in PITFALLS.md. Execution, not research, is needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions verifiable from existing codebase + official Calendly docs + browser standards. Zero ambiguity: no framework, no build step. |
| Features | HIGH | Multiple corroborated sources (B2B conversion research, existing page content, competitor analysis). P1 feature set is clear. |
| Architecture | HIGH | Well-documented patterns (fetch-inject, data-i18n, CSS custom properties). The partial-injection/i18n sequencing dependency is the main non-obvious detail — fully documented. |
| Pitfalls | HIGH (technical) / MEDIUM (SEO) | Calendly performance, FOUC, contrast failures are verified from specific audits and official sources. SEO single-URL limitation is medium confidence — Googlebot JS execution behavior is partially documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **Calendly account configuration:** Research confirms the embed API but cannot verify Vantix's specific Calendly scheduling link URL, timezone settings, or ES locale support. Verify against the live account before Phase 3.
- **Copy completeness in both languages:** The bilingual system depends on complete EN and ES translations. The existing pages have validated Spanish copy, but the restructured sections (new service card formats, how-it-works rewrite) will need new strings authored in both languages simultaneously — this is a content production dependency, not a technical one.
- **Google Fonts vs. self-hosted decision:** Research recommends self-hosting woff2 for production Core Web Vitals, but the decision timing (Phase 1 setup vs. Phase 5 polish) should be made explicit in roadmap planning. Self-hosting has no technical complexity but requires the woff2 files to be downloaded and committed before the CSS is written.
- **Calendly dark theme parameter coverage:** The `background_color`/`text_color`/`primary_color` URL params have a known limitation (some internal Calendly UI elements may override them). Whether this is visually acceptable requires a live test.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase `06-landing-pages/vantix-landing-v3.html` — palette, typography, structure confirmed
- `.planning/PROJECT.md` — explicit stack constraint: vanilla HTML/CSS/JS, no frameworks
- [Calendly developer embed docs](https://developer.calendly.com/how-to-display-the-scheduling-page-for-users-of-your-app) — `initInlineWidget` / `initPopupWidget` API
- [MDN: Navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language) — language detection
- [Calendly Web Performance Audit — DebugBear](https://www.debugbear.com/blog/calendly-web-performance-audit) — specific performance metrics (4.5s LCP, 464 KB CSS, 1s CPU bot-protection)
- [Track Calendly with GTM and GA4 — Analytics Mania](https://www.analyticsmania.com/post/how-to-track-calendly-with-google-tag-manager-and-google-analytics-4/) — postMessage tracking approach

### Secondary (MEDIUM confidence)
- [9 B2B Landing Page Lessons — Instapage](https://instapage.com/blog/b2b-landing-page-best-practices) — single CTA, social proof placement
- [We studied 100 devtool landing pages — Evil Martians](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025) — dark techy design trust signals
- [Inclusive Dark Mode — Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) — contrast failure patterns
- [Managing Multi-Regional Sites — Google Search Central](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) — single-URL toggle SEO limitations
- [Localization for B2B SaaS Landing Pages — OCNJ Daily](https://ocnjdaily.com/news/2026/feb/18/localization-for-b2b-saas-landing-pages-messaging-adaptation-that-improves-conversions/) — bilingual conversion lift

### Tertiary (LOW confidence / needs live validation)
- Calendly `?locale=es` parameter for Spanish embed — confirmed mentioned in community sources; requires live account test
- `#8A9BC0` on `#1B2A4A` contrast failure — inferred from WCAG math; verify with axe DevTools

---

*Research completed: 2026-03-20*
*Ready for roadmap: yes*
