# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-24
**Phases:** 4 | **Plans:** 8 | **Timeline:** 5 days

### What Was Built
- Bilingual (EN/ES) static landing page system with auto-detect + toggle
- Main conversion page with hero, pain cards, services, pricing, Calendly popup, GA4 tracking
- 3 detail pages (Observability, Fractional SRE, Mission/Vision) sharing dark theme and i18n
- WCAG 2.1 AA compliance, impeccable.style audit passed, 25-point launch gate cleared

### What Worked
- Coarse 4-phase granularity kept planning overhead minimal for a static site project
- Foundation-first approach (tokens + i18n + partials before any pages) eliminated rework — no page was ever built on a moving foundation
- Shared detail.css (530 lines, 180 token refs) made detail pages fast to ship — consistent by construction
- Phase 4 polish pass caught real contrast issues (dark mode CTA 3.50:1 → 5.01:1) before launch
- Combining validated content from existing pages rather than writing from scratch saved significant copy work

### What Was Inefficient
- Phases 1 and 2 executed without SUMMARY.md tracking — accomplishment extraction at milestone time had gaps
- REQUIREMENTS.md traceability table for Phase 2 items never got updated from "Pending" to "Done" — stale metadata
- Some Phase 4 plans overlapped in scope (CSS fixes vs content additions touched similar files)

### Patterns Established
- `detail.css` shared stylesheet pattern for all detail pages — 7 section types, token-only values
- Page-scoped i18n namespace convention: `obs_page.*`, `sre_page.*`, `mission_page.*`
- `VANTIX_BASE` path pattern for subdirectory pages (`'.'` root, `'..'` nested)
- Fetch-inject partials for nav/footer — zero build step, shared across all pages
- Service-specific FAQ keys with page-scoped dot notation to avoid key collisions

### Key Lessons
1. Always create SUMMARY.md files even for early phases — milestone completion depends on them
2. Keep traceability tables in sync with requirement completion — automate or enforce at phase completion
3. Static site projects benefit from very coarse granularity — 4 phases was right for this scope
4. Single-URL bilingual toggle works for v1 but will need revisiting for SEO at scale
5. Placeholders (Calendly URL, GA4 ID) must be tracked as blockers and surfaced prominently

### Cost Observations
- Model mix: balanced profile used throughout
- Sessions: ~8 sessions across 5 days
- Notable: Coarse granularity + parallel plan execution in Phase 3/4 kept context window efficient

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 5 days | 4 | First milestone — established patterns for static site development |

### Top Lessons (Verified Across Milestones)

1. (First milestone — lessons will be verified as patterns repeat in v1.1+)
