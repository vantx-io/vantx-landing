# Roadmap: Vantix Platform

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-24)
- ✅ **v1.1 Platform Hardening & Admin** — Phases 5-9 (shipped 2026-03-25)
- 🔄 **v1.2 Security & Polish** — Phases 10-13 (in progress)

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

### v1.2 Security & Polish (Phases 10-13)

- [ ] **Phase 10: Rate Limiting** — Upstash Redis rate limiting on all API routes
- [ ] **Phase 11: Notification Polish** — Per-type notification preferences with enforcement + weekly Monday email digest
- [ ] **Phase 12: Admin Capabilities** — User invite, role change, and deactivation + MRR trend chart on billing page
- [ ] **Phase 13: Test Coverage** — API route integration tests + Playwright visual regression baselines

## Phase Details

### Phase 10: Rate Limiting
**Goal**: All API routes are protected against brute-force and abuse via Upstash Redis sliding-window rate limiting
**Depends on**: Nothing (dependency-free)
**Requirements**: SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. Calling any API route more than the allowed limit returns HTTP 429 with a `Retry-After` header
  2. Rate limits are enforced across concurrent Vercel serverless instances (not in-memory)
  3. Different route types have appropriate thresholds (auth stricter than general API)
**Plans**: TBD

### Phase 11: Notification Polish
**Goal**: Users control which notification channels they receive, and enrolled clients automatically get a weekly email digest of task activity every Monday
**Depends on**: Nothing (notification pipeline is independent of rate limiting)
**Requirements**: NOTIF-10, NOTIF-11, NOTIF-12
**Success Criteria** (what must be TRUE):
  1. A user can open portal settings and toggle email and in-app notifications on or off per notification type
  2. After disabling email notifications, the user does not receive email for events that would previously have triggered one
  3. Every Monday morning, clients receive an email digest listing task activity from the past week
  4. A client who has disabled email notifications does not receive the weekly digest
**Plans**: TBD

### Phase 12: Admin Capabilities
**Goal**: Admins can manage the full user lifecycle from within the platform and can track MRR trends over time without leaving the admin dashboard
**Depends on**: Nothing (admin APIs use existing auth flow)
**Requirements**: ADMIN-07, ADMIN-08, ADMIN-09, ADMIN-10, ADMIN-11
**Success Criteria** (what must be TRUE):
  1. An admin can invite a new user by email, assigning a role and client; the invited user's public profile row is automatically created when they accept
  2. An admin can change an existing user's role from the user management page
  3. An admin can deactivate a user account; that user can no longer log in until reactivated
  4. An admin can view a Recharts line chart of MRR over time on the billing page, derived from the payments table
**Plans**: TBD

### Phase 13: Test Coverage
**Goal**: All API routes have integration tests that run in CI, and Playwright visual regression baselines exist for portal and admin pages so layout regressions are caught automatically
**Depends on**: Phase 12 (MRR chart must exist before billing page baselines are captured)
**Requirements**: TEST-10, TEST-11
**Success Criteria** (what must be TRUE):
  1. Running the integration test suite in CI covers checkout, billing-portal, and Stripe webhook route handlers using NTARH + MSW with no real DB calls
  2. Stripe webhook tests cover all 4 event branches (payment succeeded, payment failed, subscription updated, subscription deleted)
  3. Running Playwright in CI captures and stores screenshot baselines for portal dashboard, task list, admin overview, and admin billing pages
  4. A deliberate CSS change to a portal page causes the visual regression test to fail with a diff image
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
| 10. Rate Limiting | v1.2 | 0/? | Not started | - |
| 11. Notification Polish | v1.2 | 0/? | Not started | - |
| 12. Admin Capabilities | v1.2 | 0/? | Not started | - |
| 13. Test Coverage | v1.2 | 0/? | Not started | - |
