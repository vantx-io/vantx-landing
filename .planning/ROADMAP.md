# Roadmap: Vantix Landing Page System

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-24)
- 🚧 **v1.1 Platform Hardening & Admin** — Phases 5-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-24</summary>

- [x] Phase 1: Foundation (1/1 plan) — completed 2026-03-20
- [x] Phase 2: Main Landing (1/1 plan) — completed 2026-03-20
- [x] Phase 3: Detail Pages (3/3 plans) — completed 2026-03-21
- [x] Phase 4: Polish & Launch Gate (3/3 plans) — completed 2026-03-24

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### 🚧 v1.1 Platform Hardening & Admin (In Progress)

**Milestone Goal:** Solidify the platform with complete automated testing, an internal admin dashboard, in-app and transactional email notifications, and file attachments on tasks.

- [x] **Phase 5: Foundation** - DB migrations + Vitest/Playwright test infrastructure + i18n CI check (completed 2026-03-24)
- [ ] **Phase 6: Server-Side Integration** - Email helper (Resend) + notification API routes + Stripe webhook extension + Slack on task created
- [ ] **Phase 7: Notification UI** - NotificationBell component with Realtime subscription + cross-tenant isolation test + portal mount
- [ ] **Phase 8: Admin Dashboard** - Middleware role guard + admin layout + all four admin pages + bell mount
- [ ] **Phase 9: File Uploads** - Storage RLS + upload UI in task comments + validation + preview + signed URLs

## Phase Details

### Phase 5: Foundation
**Goal**: Test infrastructure and database schema are in place so all subsequent phases can be built, tested, and merged without coupling to a live database or creating untested notification/storage schema.
**Depends on**: Phase 4 (v1.0 shipped)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-09, NOTIF-01, UPLOAD-01, UPLOAD-02
**Success Criteria** (what must be TRUE):
  1. `npm test` runs Vitest unit test suite without hitting a live Supabase instance — Supabase client is mocked and all existing tests pass in CI
  2. `npx playwright test` executes against the local dev server using auth helpers without manual setup steps
  3. Unit tests for stripe.ts, slack.ts, and onboard.ts all pass and cover the primary code paths
  4. The i18n CI check fails the build if any key exists in EN but not in ES (or vice versa)
  5. `notifications` table and `task-attachments` storage bucket exist in Supabase with RLS policies applied (migration files in `supabase/migrations/`)
**Plans:** 3/3 plans complete

Plans:
- [x] 05-01-PLAN.md — DB migrations (notifications table + storage bucket) and Notification type
- [x] 05-02-PLAN.md — Vitest infrastructure + unit tests for stripe.ts, slack.ts, onboard.ts
- [x] 05-03-PLAN.md — Playwright E2E setup + i18n parity script + GitHub Actions CI workflow

### Phase 6: Server-Side Integration
**Goal**: All server-side notification delivery (email and Slack) is wired, tested, and operational before any UI component depends on it.
**Depends on**: Phase 5
**Requirements**: NOTIF-05, NOTIF-06, NOTIF-07, NOTIF-08
**Success Criteria** (what must be TRUE):
  1. A successful Stripe payment triggers a payment-received email to the client (visible in Resend logs or test inbox) without blocking the webhook response
  2. A failed Stripe payment triggers a payment-failed email to the client
  3. A task status change triggers a notification email to the client assigned to that task
  4. Creating a new task dispatches a Slack message to the client's channel using the existing `slack.ts` integration
**Plans**: TBD

### Phase 7: Notification UI
**Goal**: Users in the portal see live in-app notifications, can mark them read, and the NotificationBell component is ready to mount in any layout without security risk.
**Depends on**: Phase 6
**Requirements**: NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-09
**Success Criteria** (what must be TRUE):
  1. A bell icon in the portal navbar shows an unread count badge that updates in real time when a new notification row is inserted for the current user
  2. Clicking the bell opens a dropdown listing recent notifications; clicking a notification marks it read and the badge count decreases
  3. "Mark all as read" clears the unread badge in a single action
  4. A user logged in as Client A cannot receive or see notifications belonging to Client B — verified by a dedicated cross-tenant Playwright or integration test
**Plans**: TBD

### Phase 8: Admin Dashboard
**Goal**: Vantix team members (admin, engineer, seller roles) can access internal operational views of all clients, subscriptions, tasks, and billing — and client-role users are blocked from these routes at the middleware layer.
**Depends on**: Phase 7
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, TEST-08
**Success Criteria** (what must be TRUE):
  1. Navigating to `/admin` as a client-role user redirects to the portal — enforced by Next.js middleware, not a client-side check
  2. An admin user sees an overview page with active client count, current MRR, and a recent activity feed
  3. The client list page shows all clients with subscription status and plan details, with a working search input
  4. The cross-client task view lists tasks across all clients and can be filtered by client, priority, and status
  5. The billing page shows recent payments and current subscription statuses for all clients
**Plans**: TBD

### Phase 9: File Uploads
**Goal**: Team members and clients can attach files to task comments, view image previews inline, and download files via time-limited signed URLs — storage is private and scoped per client.
**Depends on**: Phase 8
**Requirements**: UPLOAD-03, UPLOAD-04, UPLOAD-05, UPLOAD-06, TEST-06, TEST-07
**Success Criteria** (what must be TRUE):
  1. A user can attach a file to a task comment via drag-and-drop or file picker and see it appear in the comment thread after submit
  2. Files exceeding the size limit or of a disallowed type are rejected client-side before upload with a clear error message
  3. Uploaded images render as inline preview thumbnails in the comment thread without requiring a separate download step
  4. Clicking a non-image attachment generates a signed download URL that expires — no permanent public URLs are stored in the database
  5. The Playwright login flow test and task CRUD test pass against the updated task page with uploads present

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-03-20 |
| 2. Main Landing | v1.0 | 1/1 | Complete | 2026-03-20 |
| 3. Detail Pages | v1.0 | 3/3 | Complete | 2026-03-21 |
| 4. Polish & Launch Gate | v1.0 | 3/3 | Complete | 2026-03-24 |
| 5. Foundation | v1.1 | 3/3 | Complete   | 2026-03-24 |
| 6. Server-Side Integration | v1.1 | 0/TBD | Not started | - |
| 7. Notification UI | v1.1 | 0/TBD | Not started | - |
| 8. Admin Dashboard | v1.1 | 0/TBD | Not started | - |
| 9. File Uploads | v1.1 | 0/TBD | Not started | - |
