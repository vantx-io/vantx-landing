# Phase 1: Foundation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

The technical substrate that every page depends on — CSS design tokens (dark theme), bilingual i18n system with auto-detect + localStorage persistence, and shared nav/footer partials via fetch-inject. This phase is already complete; context is captured retroactively to document locked decisions for Phase 3 and beyond.

</domain>

<decisions>
## Implementation Decisions

### File structure & locations
- Detail pages live in `services/` and `about/` subdirectories under `06-landing-pages/`
  - `services/observability.html`
  - `services/fractional-sre.html`
  - `about/mission.html`
- This matches the nav.html links already in place (`/about/mission.html`)
- Site is hosted at domain root — root-relative nav links (`/about/mission.html`, `/#services`) work as-is

### Base path pattern
- Universal rule: any page one level deep (in `services/` or `about/`) sets `window.VANTIX_BASE = '..'` inline before loading scripts
- Root-level pages (`index.html`) use `window.VANTIX_BASE = '.'`
- No exceptions — every page follows this convention
- Detail pages use relative `../` paths for assets (e.g., `../css/tokens.css`) — works when files are opened directly via `file://` protocol and on server

### CSS loading order
- Every detail page loads: `../css/tokens.css` → `../css/base.css` → `../css/[page].css`
- One CSS file per detail page: `observability.css`, `fractional-sre.css`, `mission.css`
- Same cascade order as `index.html` (tokens before base before page-specific)
- All three detail pages follow the same visual template (same layout, different content) — minimal per-page overrides expected

### Nav behavior on detail pages
- No active states on nav links — nav looks identical regardless of which page the visitor is on
- `/#services` and `/#pricing` nav links navigate home then scroll — this is intentional behavior
- Shared `nav.html` partial requires no modification for detail pages
- Mobile hamburger menu behavior unchanged across all pages

### i18n key namespacing
- Detail page content uses page-level namespaces: `observability.*`, `fractional_sre.*`, `mission.*`
- Reuse existing keys wherever possible — `nav.cta` ("Book a Demo") is the CTA key across all pages
- Service names reuse `footer.*` keys (`footer.observability`, `footer.performance`, `footer.sre`) — single source of truth
- Add new keys only for content truly unique to a detail page

### Claude's Discretion
- Exact section structure within each detail page (hero sub-sections, feature list treatment)
- How partials.js "active link marking" interacts with detail pages (existing code may mark ancestor links — acceptable either way)

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

The requirements document covers all Phase 1 acceptance criteria:
- `FOUND-01`, `FOUND-02`, `FOUND-03` — all complete per `.planning/REQUIREMENTS.md`
- `DSNG-01` — complete per `.planning/REQUIREMENTS.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `css/tokens.css` — all color, typography, spacing as CSS Custom Properties; detail pages import via `../css/tokens.css`
- `css/base.css` — reset, nav/footer styles, button variants (primary/outline/ghost), responsive breakpoints at 768px + 480px
- `js/i18n.js` — exposes `window.i18n`; handles `data-i18n`, `data-i18n-html`, `data-i18n-aria`, `data-i18n-placeholder`, `data-i18n-title` attributes
- `js/partials.js` — fetch-injects `[data-partial="nav"]` and `[data-partial="footer"]`; dispatches `vantix:ready` for page-level hooks
- `partials/nav.html` — fully accessible nav with lang toggle, mobile drawer; all text via `data-i18n`
- `partials/footer.html` — brand + service links + company links; all text via `data-i18n`
- `i18n/en.json` + `i18n/es.json` — already contain `nav.*`, `footer.*` (including service names), and all Phase 2 page keys

### Established Patterns
- **Page boot sequence**: `window.VANTIX_BASE` set inline → load `i18n.js` → load `partials.js` → partials.js handles all i18n init and partial injection
- **i18n attributes**: all localizable text uses `data-i18n="key"` — no hardcoded copy in HTML
- **Color scheme**: zinc-950 background (`--color-bg`), zinc-900 surface (`--color-surface`), blue-500 accent (`--color-accent`) — all via CSS vars
- **Typography**: DM Sans (UI) + JetBrains Mono (code/mono accents) via Google Fonts CDN

### Integration Points
- Detail pages hook into `vantix:ready` event for any page-level JS (e.g., Calendly init): `window.addEventListener('vantix:ready', () => { ... })`
- Language switches dispatch `i18n:changed` event — detail pages can listen if they have dynamic content beyond `data-i18n` attributes
- Calendly popup triggered by `Calendly.initPopupWidget({ url })` — same pattern as `index.html`

</code_context>

<specifics>
## Specific Ideas

- The existing `vantix-landing-v3.html`, `vantix-observability-as-a-service.html`, and `vantix-mision-vision-valores.html` files in `06-landing-pages/` contain approved copy and structure to pull from when building Phase 3 detail pages — "combine the best content, don't reinvent"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-20*
