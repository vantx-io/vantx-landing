# Phase 4: Polish & Launch Gate - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

The site passes every objective quality gate before going live. This phase fixes all visual design issues, contrast/accessibility gaps, UX problems from todo.md, and verifies cross-device rendering. No new features — only audit, fix, and verify.

</domain>

<decisions>
## Implementation Decisions

### Audit scope & methodology
- **D-01:** impeccable.style/cheatsheet audit must pass with ALL flagged issues fixed — no exceptions, no "good enough"
- **D-02:** Audit covers visual design quality AND UX gaps from todo.md (text walls, redundant CTAs, missing FAQs, layout issues)
- **D-03:** Audit covers ALL public pages: index.html, 3 service detail pages (observability, fractional-sre, performance), mission.html, welcome.html, legal/privacy.html, legal/terms.html
- **D-04:** Fix credibility bar 700ms entrance delay (causes visible pop-in on fast connections) — reduce or eliminate
- **D-05:** Fix hero `min-height: 100vh` empty whitespace on desktop

### Contrast & accessibility
- **D-06:** WCAG 2.1 AA contrast (ratio >= 4.5:1) verified with axe DevTools on every page
- **D-07:** Audit BOTH light mode and dark mode equally — dark mode users deserve same contrast quality
- **D-08:** When axe flags contrast issues, fix in tokens.css first (global); per-element overrides only if global change breaks something else
- **D-09:** Full WCAG 2.1 AA audit scope: contrast + keyboard navigation (tab order) + screen reader experience (labels, announcements)
- **D-10:** Verify Calendly popup doesn't trap keyboard focus or break tab flow
- **D-11:** Verify mobile nav drawer properly traps focus when open and announces state changes

### UX fixes from todo.md
- **D-12:** Add social proof placeholder section to index.html — section structure with placeholder content ready to swap in real testimonials/logos
- **D-13:** Add service-specific FAQs to detail pages (observability, fractional-sre, performance)
- **D-14:** Break up text walls on detail pages (especially performance page with 7 deliverables)
- **D-15:** Fix `content-visibility: auto` / `contain-intrinsic-size` layout jumps (CLS issue)
- **D-16:** Fix "Also available" rows — differentiate or reduce the 3 identical "Book a Call" buttons that read as template-like

### Launch readiness
- **D-17:** Real Calendly URL and GA4 Measurement ID are already in place — no placeholder replacement needed
- **D-18:** Language preference persistence must work after hard reload in incognito (localStorage verification)
- **D-19:** iOS Safari rendering verification required (real device, not only DevTools emulation) — functional correctness, not pixel-perfect

### Claude's Discretion
- Exact social proof placeholder layout and copy
- How to restructure text walls (accordion, tabs, progressive disclosure, or trimming)
- Which service FAQs to write and how many per page
- How to differentiate the "Also available" CTAs (different copy, single CTA, or different treatment)
- Credibility bar animation timing replacement value
- Hero height fix approach (auto height, max-height, or content-driven)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system & brand
- `landing/.impeccable.md` — Brand personality, aesthetic direction, design principles, anti-references
- `landing/css/tokens.css` — All color, typography, spacing tokens with documented contrast ratios
- `landing/css/base.css` — Reset, nav/footer styles, accessibility utilities (skip-link, sr-only, focus-visible)

### Outstanding issues
- `landing/todo.md` — Known UX gaps, conversion blockers, performance notes

### Phase 1 patterns
- `.planning/phases/01-foundation/01-CONTEXT.md` — Base path pattern, CSS load order, i18n key namespacing, nav behavior

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `landing/css/tokens.css` — All design tokens with contrast annotations; light + dark mode via `@media (prefers-color-scheme: dark)`
- `landing/css/base.css` — Skip link, sr-only, focus-visible, prefers-reduced-motion, touch targets already implemented
- `landing/css/fonts.css` — Self-hosted DM Sans + JetBrains Mono with `font-display: swap` and preloading
- `landing/js/reveal.js` — Scroll-reveal with IntersectionObserver (credibility bar delay lives here or in CSS)

### Established Patterns
- **Accessibility**: semantic HTML, aria-labels, focus-visible outlines (2px solid, 2px offset), 44x44px touch targets
- **Dark mode**: automatic via `@media (prefers-color-scheme: dark)` in tokens.css — no toggle, follows system preference
- **i18n**: `data-i18n="key"` attributes, localStorage persistence, `i18n:changed` event for dynamic content
- **Fonts**: Self-hosted woff2, unicode-range split for latin + latin-ext, preloaded with `fetchpriority="high"`

### Integration Points
- axe DevTools: run manually in browser — no automated test harness exists (must create or run manually)
- Calendly popup: `Calendly.initPopupWidget({ url })` — third-party embed, focus trap not controlled by us
- Mobile nav drawer: `partials/nav.html` — hamburger toggle, drawer overlay

</code_context>

<specifics>
## Specific Ideas

- impeccable.style/cheatsheet is the reference audit checklist — run it against every page
- The `.impeccable.md` file in landing/ contains brand personality and aesthetic direction that should guide subjective audit decisions
- todo.md is the source of truth for known UX gaps — every item should be addressed or explicitly deferred with rationale

</specifics>

<deferred>
## Deferred Ideas

- Real client testimonials and logos for social proof section (placeholder structure ships in Phase 4, real content added when available)
- Automated accessibility CI pipeline (axe-core in CI) — post-launch
- PAGE-V2-01: Performance as a Service detail page refactor (already deferred to v2)
- SEO-V2-01: Separate `/es/` URLs with hreflang (deferred to v2)

</deferred>

---

*Phase: 04-polish-launch-gate*
*Context gathered: 2026-03-24*
