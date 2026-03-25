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

## Milestone: v1.1 — Platform Hardening & Admin

**Shipped:** 2026-03-25
**Phases:** 5 | **Plans:** 13 | **Tasks:** 25 | **Timeline:** 5 days (2026-03-21 → 2026-03-25)

### What Was Built
- Test infrastructure: Vitest with Supabase manual mocks (32 unit tests), Playwright E2E scaffold, GitHub Actions CI, i18n key parity check
- Notification system: Resend + React Email for transactional emails (payment success/failure, task status), Slack Block Kit messages, notifyTaskEvent orchestrator
- NotificationBell: Supabase Realtime subscription, unread badge (9+ cap, animate-ping), dropdown with mark-read/mark-all, cross-tenant isolation verified by E2E test
- Admin dashboard: Middleware role guard on /admin, 4 pages (overview with MRR + activity feed, client list with search, cross-client task view with filters, billing overview), dark sidebar layout
- File uploads: CommentForm with react-dropzone drag-and-drop, client-side validation (executables blocked, 50MB limit), simulated progress, Supabase Storage upload with signed URLs
- Attachment display: Image thumbnails (120x120) with lightbox modal, non-image file cards with icon/filename/file size/type badge/download
- E2E tests: Login flow (happy + wrong password), task CRUD lifecycle (create + edit title + change status + comment with attachment), admin redirect, cross-tenant storage isolation

### What Worked
- Sequential phase dependencies (5→6→7→8→9) prevented integration issues — each phase built cleanly on the previous
- Wave-based execution within phases kept agents from conflicting on shared files (e.g., page.tsx in Phase 9)
- Supabase manual mocks pattern from Phase 5 enabled all subsequent phases to have testable code paths without live DB
- notifyTaskEvent orchestrator pattern (Phase 6) provided a clean abstraction that Phase 7-9 built on top of
- Phase 8 middleware-first approach meant admin routes were secure before any page was built
- PLAN files with full code snippets in context blocks dramatically reduced executor deviation

### What Was Inefficient
- 3 tracking gaps (NOTIF-01, UPLOAD-01, UPLOAD-02) marked as Pending despite being shipped in Phase 5 — requirement status updates need enforcement at phase completion
- No milestone audit was run before completion — would have caught tracking gaps earlier
- Phase 9 ROADMAP progress wasn't updated by the phase-complete tool (showed 1/3 instead of 3/3) — tooling gap

### Patterns Established
- `notifyTaskEvent()` orchestrator dispatches email + Slack + in-app notification in one call
- `createServiceClient()` for server-side Supabase operations (admin/service-role)
- `createClient()` for browser-side Supabase operations (auth-scoped)
- Signed URL pattern: generate on display (images) or on click (non-images), 1-hour expiry, no stored public URLs
- Dual browser context pattern for cross-tenant E2E tests (user.json + user-b.json storageState)
- `react-dropzone` + hidden `<input>` with `useRef` for composable file upload UI
- File type badge color system: green (images), blue (docs), purple (archives), orange (data), muted (logs)

### Key Lessons
1. **Always run milestone audit before completion** — tracking gaps are invisible until you check
2. **Requirement checkboxes must be updated at phase completion**, not deferred — stale traceability erodes trust
3. **Plans with full code context produce better executor output** — worth the extra planning tokens
4. **Wave-based sequential execution prevents merge conflicts** on shared files like page.tsx
5. **Supabase Realtime + RLS is the right pattern for multi-tenant notifications** — no polling, row-level security

### Cost Observations
- Model mix: sonnet executors + sonnet verifier (quality profile)
- Sessions: ~6 sessions across 5 days
- Notable: 13 plans across 5 phases with 3 waves each — sequential execution was correct choice given shared file dependencies

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | 5 days | 4 | 8 | Established patterns for static site development |
| v1.1 | 5 days | 5 | 13 | Full-stack platform with multi-tenant security, wave-based execution |

### Top Lessons (Verified Across Milestones)

1. **Keep traceability in sync** — v1.0 had stale Pending rows, v1.1 had unchecked requirements. Must enforce at phase completion.
2. **Foundation-first pays off** — v1.0 built tokens/i18n before pages, v1.1 built test infra + DB schema before features. Zero rework both times.
3. **Plans with rich context reduce executor deviation** — confirmed in both milestones, worth the planning investment.
4. **Sequential dependencies prevent integration issues** — validated across 9 phases and 21 plans.
