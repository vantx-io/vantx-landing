# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma fácil de reservar tiempo, todo lo demás falla.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 2 of 4 (Main Landing)
Plan: 0 of TBD in current phase
Status: Phase 1 complete — ready to plan Phase 2
Last activity: 2026-03-20 — Phase 1 Foundation executed and shipped

Progress: [██░░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 1/1 | ✓ Complete |
| 2. Main Landing | 0/TBD | Not started |
| 3. Detail Pages | 0/TBD | Not started |
| 4. Polish & Launch Gate | 0/TBD | Not started |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Project init]: Single-URL bilingual toggle (no `/es/` routes) — SEO tradeoff accepted explicitly for v1
- [Project init]: Fetch-inject partial architecture for nav/footer — no build step required
- [Project init]: Calendly popup pattern on main page (not inline) — avoid blocking Core Web Vitals
- [Project init]: ANLT-01 + ANLT-02 assigned to Phase 2 — Calendly tracking must be wired when Calendly is introduced, not post-launch

### Pending Todos

None yet.

### Phase 1 decisions made

- **Font strategy**: Google Fonts CDN (DM Sans + JetBrains Mono) — v1 simplicity wins; revisit self-hosting in Phase 4
- **Base path pattern**: `window.VANTIX_BASE = '.'` (root) / `'..'` (nested) — set inline before scripts load
- **Token palette**: zinc-950/900/800 dark scale + blue-500 accent — matches Vercel/Linear aesthetic

### Blockers/Concerns

- **Calendly account**: Live Calendly scheduling link URL must be confirmed before Phase 2 execution
- **ES copy completeness**: All Phase 1 translations authored in both EN + ES in i18n/en.json + es.json ✓

## Session Continuity

Last session: 2026-03-20
Stopped at: Phase 1 Foundation complete — all deliverables shipped, ready for Phase 2 planning
Resume file: .planning/phases/01-foundation/PLAN.md
