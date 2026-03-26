# Roadmap: Vantix Platform

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-24)
- ✅ **v1.1 Platform Hardening & Admin** — Phases 5-9 (shipped 2026-03-25)
- 🔄 **v1.2 Security & Polish** — Phases 10-17 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-24</summary>

- [x] Phase 1: Foundation (1/1 plan) — completed 2026-03-20
- [x] Phase 2: Main Landing (1/1 plan) — completed 2026-03-20
- [x] Phase 3: Detail Pages (3/3 plans) — completed 2026-03-21
- [x] Phase 4: Polish & Launch Gate (3/3 plans) — completed 2026-03-24

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.1 Platform Hardening & Admin (Phases 5-9) — SHIPPED 2026-03-25</summary>

- [x] Phase 5: Foundation — DB migrations + Vitest/Playwright test infrastructure + i18n CI check (completed 2026-03-24)
- [x] Phase 6: Server-Side Integration — Email (Resend) + notification API routes + Stripe webhook + Slack (completed 2026-03-25)
- [x] Phase 7: Notification UI — NotificationBell with Realtime + cross-tenant isolation test (completed 2026-03-25)
- [x] Phase 8: Admin Dashboard — Middleware role guard + 4 admin pages + bell mount (completed 2026-03-25)
- [x] Phase 9: File Uploads — Upload UI + image thumbnails + lightbox + signed URLs + E2E tests (completed 2026-03-25)

See: `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

### v1.2 Security & Polish (Phases 10-17)

- [x] **Phase 10: Rate Limiting** — Upstash Redis rate limiting on all API routes (completed 2026-03-26)
- [x] **Phase 11: Notification Polish** — Per-type notification preferences with enforcement + weekly Monday email digest (completed 2026-03-26)
- [x] **Phase 12: Admin Capabilities** — User invite, role change, deactivation + MRR trend chart (completed 2026-03-26)
- [x] **Phase 13: Auth UX** — Forgot password, password change, user profile in portal settings (completed 2026-03-26)
- [ ] **Phase 14: Polish UX** — Loading skeletons, onboarding guide, section-level error boundaries
- [ ] **Phase 15: Security Hardening** — CSP headers + admin audit logging
- [ ] **Phase 16: Test Coverage** — API route integration tests + Playwright visual regression baselines
- [ ] **Phase 17: Pre-Launch** — Production deploy (Cloudflare, Vercel, Supabase, Stripe live, Calendly, GA4)

## Phase Details

### Phase 10: Rate Limiting
**Goal**: All API routes are protected against brute-force and abuse via Upstash Redis sliding-window rate limiting
**Depends on**: Nothing (dependency-free)
**Requirements**: SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. Calling any API route more than the allowed limit returns HTTP 429 with a `Retry-After` header
  2. Rate limits are enforced across concurrent Vercel serverless instances (not in-memory)
  3. Different route types have appropriate thresholds (auth stricter than general API)
**Plans:** 1/1 plans complete
Plans:
- [x] 10-01-PLAN.md — Rate limit helper library + integration into all 6 API routes

### Phase 11: Notification Polish
**Goal**: Users control which notification channels they receive, and enrolled clients automatically get a weekly email digest of task activity every Monday
**Depends on**: Nothing (notification pipeline is independent)
**Requirements**: NOTIF-10, NOTIF-11, NOTIF-12
**Success Criteria** (what must be TRUE):
  1. A user can open portal settings and toggle email and in-app notifications on or off per notification type
  2. After disabling email notifications, the user does not receive email for events that would previously have triggered one
  3. Every Monday morning, clients receive an email digest listing task activity from the past week
  4. A client who has disabled email notifications does not receive the weekly digest
**Plans:** 3/3 plans complete
Plans:
- [x] 11-01-PLAN.md — Migration + types + preferences API + settings page with toggles
- [x] 11-02-PLAN.md — Preference enforcement in notifyTaskEvent + Stripe webhook
- [x] 11-03-PLAN.md — WeeklyDigestEmail template + cron handler + vercel.json

### Phase 12: Admin Capabilities
**Goal**: Admins can manage the full user lifecycle from within the platform and can track MRR trends over time
**Depends on**: Nothing (admin APIs use existing auth flow)
**Requirements**: ADMIN-07, ADMIN-08, ADMIN-09, ADMIN-10, ADMIN-11
**Success Criteria** (what must be TRUE):
  1. An admin can invite a new user by email, assigning a role and client; the invited user's public profile row is automatically created when they accept
  2. An admin can change an existing user's role from the user management page
  3. An admin can deactivate a user account; that user can no longer log in until reactivated
  4. An admin can view a Recharts line chart of MRR over time on the billing page, derived from the payments table
**Plans:** 2/2 plans complete
Plans:
- [x] 12-01-PLAN.md — DB migration (is_active + auth trigger) + 3 admin API routes + middleware is_active check + deactivated page
- [x] 12-02-PLAN.md — Users management page + MRR AreaChart + i18n + sidebar nav

### Phase 13: Auth UX
**Goal**: Users can recover and manage their accounts without admin intervention
**Depends on**: Phase 11 (settings page created there; auth UX extends it)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A user who forgot their password can click "Forgot password?" on the login page, receive a reset email, and set a new password
  2. A logged-in user can change their password from the portal settings page
  3. A logged-in user can view and edit their display name from the portal settings page
**Plans:** 2/2 plans complete
Plans:
- [x] 13-01-PLAN.md — Inline forgot-password widget on login page + reset-password page + i18n
- [x] 13-02-PLAN.md — Profile + Security sections on settings page + /api/profile route + RLS migration + i18n

### Phase 14: Polish UX
**Goal**: The portal feels polished — pages load gracefully, new users are guided, and errors are contained
**Depends on**: Phase 13 (all portal pages must exist before adding skeletons/error boundaries)
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. Every portal page shows a skeleton placeholder while data loads (no empty flash)
  2. A brand-new user who logs in for the first time sees a welcome guide with key actions
  3. If a section of a page fails to load, the error is caught by a boundary and the rest of the page remains functional
**Plans**: TBD

### Phase 15: Security Hardening
**Goal**: The platform has defense-in-depth headers and an audit trail for admin actions
**Depends on**: Phase 12 (audit logging needs admin actions to exist)
**Requirements**: SECURE-01, SECURE-02
**Success Criteria** (what must be TRUE):
  1. All platform responses include Content-Security-Policy headers that block inline scripts and restrict sources
  2. Every admin action (invite, role change, deactivation) creates an audit log entry with actor, action, target, and timestamp
  3. Audit log is queryable from the admin dashboard or database
**Plans**: TBD

### Phase 16: Test Coverage
**Goal**: All API routes have integration tests that run in CI, and Playwright visual regression baselines exist for all portal and admin pages
**Depends on**: Phase 14 (all UI must be final before capturing visual baselines)
**Requirements**: TEST-10, TEST-11
**Success Criteria** (what must be TRUE):
  1. Running the integration test suite in CI covers checkout, billing-portal, and Stripe webhook route handlers using NTARH + MSW with no real DB calls
  2. Stripe webhook tests cover all 4 event branches (payment succeeded, payment failed, subscription updated, subscription deleted)
  3. Running Playwright in CI captures and stores screenshot baselines for portal dashboard, task list, settings, admin overview, admin billing, and admin users pages
  4. A deliberate CSS change to a portal page causes the visual regression test to fail with a diff image
**Plans**: TBD

### Phase 17: Pre-Launch
**Goal**: Production infrastructure is provisioned and all placeholder values are replaced with real credentials
**Depends on**: Phase 16 (all code must be tested before production deploy)
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04, LAUNCH-05, LAUNCH-06
**Success Criteria** (what must be TRUE):
  1. Clicking "Book a Call" on the landing site opens a real Calendly booking page
  2. GA4 is receiving real pageview and booking events
  3. Landing site is live at vantx.io via Cloudflare Pages
  4. Platform is live at its custom domain via Vercel
  5. Stripe checkout creates real charges (live mode)
  6. Supabase production database has all migrations applied and seed data loaded
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-03-20 |
| 2. Main Landing | v1.0 | 1/1 | Complete | 2026-03-20 |
| 3. Detail Pages | v1.0 | 3/3 | Complete | 2026-03-21 |
| 4. Polish & Launch Gate | v1.0 | 3/3 | Complete | 2026-03-24 |
| 5. Foundation | v1.1 | 3/3 | Complete | 2026-03-24 |
| 6. Server-Side Integration | v1.1 | 2/2 | Complete | 2026-03-25 |
| 7. Notification UI | v1.1 | 2/2 | Complete | 2026-03-25 |
| 8. Admin Dashboard | v1.1 | 3/3 | Complete | 2026-03-25 |
| 9. File Uploads | v1.1 | 3/3 | Complete | 2026-03-25 |
| 10. Rate Limiting | v1.2 | 1/1 | Complete    | 2026-03-26 |
| 11. Notification Polish | v1.2 | 3/3 | Complete    | 2026-03-26 |
| 12. Admin Capabilities | v1.2 | 2/2 | Complete    | 2026-03-26 |
| 13. Auth UX | v1.2 | 2/2 | Complete   | 2026-03-26 |
| 14. Polish UX | v1.2 | 0/? | Not started | - |
| 15. Security Hardening | v1.2 | 0/? | Not started | - |
| 16. Test Coverage | v1.2 | 0/? | Not started | - |
| 17. Pre-Launch | v1.2 | 0/? | Not started | - |
