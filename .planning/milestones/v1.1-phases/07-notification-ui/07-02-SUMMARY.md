---
phase: 07-notification-ui
plan: 02
subsystem: ui
tags: [playwright, supabase-rls, nextjs, react, cross-tenant, e2e]

# Dependency graph
requires:
  - phase: 07-01
    provides: NotificationBell component with self-managed auth and Supabase Realtime
  - phase: 06-server-side-integration
    provides: notifications table schema with RLS policies (user_id isolation)
  - phase: 05-foundation
    provides: Playwright E2E setup pattern (auth.setup.ts storageState)

provides:
  - NotificationBell mounted in portal sidebar header (NOTIF-09)
  - Second Playwright auth setup file for cross-tenant isolation testing (D-10)
  - Cross-tenant E2E spec proving RLS prevents User B from seeing User A notifications (D-10, D-11)
  - setup-b and cross-tenant projects in playwright.config.ts

affects:
  - 08 (admin-dashboard — mounts NotificationBell in admin layout, same import pattern)
  - Any future plan that mounts UI in portal/layout.tsx
  - Any future security audit of notification isolation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-tenant E2E pattern: two browser contexts from separate storageState files + service role insert"
    - "Second Playwright setup project: auth.setup-b.ts mirrors auth.setup.ts with E2E_EMAIL_B/E2E_PASSWORD_B env vars"
    - "Bell mounted at sidebar header level (always visible when sidebar shown) not per-page"

key-files:
  created:
    - platform/e2e/auth.setup-b.ts
    - platform/e2e/cross-tenant.spec.ts
  modified:
    - platform/src/app/[locale]/portal/layout.tsx
    - platform/playwright.config.ts

key-decisions:
  - "NotificationBell placed inside sidebar header div after client badges — always visible when authenticated, not tied to any specific route"
  - "Cross-tenant test uses service role key to insert test data for User A, then verifies User B's dropdown excludes it"
  - "cleanup step deletes test notification by unique timestamped title to avoid test pollution"

patterns-established:
  - "Dual-user Playwright pattern: auth.setup.ts + auth.setup-b.ts with separate storageState files enable two-context isolation tests"
  - "Service role insert in E2E: SUPABASE_SERVICE_ROLE_KEY bypasses RLS for test data setup, then RLS is tested from client perspective"

requirements-completed: [NOTIF-09, NOTIF-04]

# Metrics
duration: 12min
completed: 2026-03-25
---

# Phase 07 Plan 02: NotificationBell Portal Integration Summary

**NotificationBell mounted in portal sidebar header plus Playwright cross-tenant E2E test proving RLS isolation between two users via service-role insert and dual browser context**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-25T03:29:47Z
- **Completed:** 2026-03-25T03:42:00Z
- **Tasks:** 2 of 2 (Task 2 approved by user)
- **Files modified:** 4

## Accomplishments

- Portal sidebar now shows NotificationBell below client name/plan badges for all authenticated users
- Second Playwright auth setup file (auth.setup-b.ts) created with E2E_EMAIL_B/E2E_PASSWORD_B env vars
- Cross-tenant Playwright E2E spec (cross-tenant.spec.ts) inserts notification for User A via service role and proves User B's dropdown does not show it
- playwright.config.ts extended with setup-b project and cross-tenant project depending on both setup projects

## Task Commits

Each task was committed atomically:

1. **Task 1: Mount NotificationBell in portal layout and add cross-tenant E2E test** - `85a9d7a` (feat)
2. **Task 2: Verify bell UI and real-time behavior** - approved by user (human-verify checkpoint)

**Plan metadata:** (this commit)

## Files Created/Modified

- `platform/src/app/[locale]/portal/layout.tsx` - Added NotificationBell import and `<NotificationBell />` render inside sidebar header div after client badges (modified)
- `platform/e2e/auth.setup-b.ts` - Second Playwright auth setup authenticating E2E_EMAIL_B/E2E_PASSWORD_B and writing to playwright/.auth/user-b.json (created)
- `platform/e2e/cross-tenant.spec.ts` - Cross-tenant isolation E2E test using two browser contexts and service role inserts (created)
- `platform/playwright.config.ts` - Added setup-b project and cross-tenant project with dual dependencies (modified)

## Decisions Made

- **Bell placement:** Mounted in sidebar header div (after client badges) rather than in main content area or top navbar — always visible when sidebar is rendered, consistent across all portal routes.
- **E2E isolation pattern:** Used `browser.newContext({ storageState })` to get two independent browser contexts with separate JWT sessions, proving RLS works at the HTTP/Supabase client layer, not just in isolation.
- **Test cleanup:** Delete notification by unique timestamped title after test runs to prevent data accumulation in test environments.

## Deviations from Plan

None — plan executed exactly as written. All four actions (mount bell, create auth.setup-b.ts, update playwright.config.ts, create cross-tenant spec) implemented as specified.

## Issues Encountered

- Pre-existing TypeScript errors (54 errors in 13 files) remain unchanged — these are the same errors documented in 07-01-SUMMARY.md. Our new files (layout.tsx import/render, e2e files) introduce no new TypeScript errors. The layout.tsx errors at lines 55/59/65 are pre-existing Supabase type inference failures on `.from("users")`, `.from("clients")`, `.from("subscriptions")` that existed before our changes.

## User Setup Required

For the cross-tenant E2E test to run, two environment variables must be set:
- `E2E_EMAIL_B` — email of a second test user registered in Supabase
- `E2E_PASSWORD_B` — password for that second test user
- `SUPABASE_SERVICE_ROLE_KEY` — service role key for test data insertion (already needed for other admin operations)

The second test user must exist in the database with a `users` row, and must belong to a different client than User A to prove cross-tenant isolation.

## Known Stubs

None — the bell is fully wired to real Supabase data via NotificationBell's self-managed subscription.

## Next Phase Readiness

- Phase 07 is fully complete. All four requirements (NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-09) satisfied across plans 07-01 and 07-02.
- Phase 08 (Admin Dashboard) can mount `<NotificationBell />` using the identical import pattern from portal/layout.tsx.
- The dual-auth Playwright pattern (auth.setup-b.ts + cross-tenant project) is reusable for any future cross-tenant test scenarios.
- Reminder: Supabase Realtime REPLICA IDENTITY FULL must be enabled on the notifications table in the Dashboard before real-time badge updates fire in production or staging.

## Self-Check: PASSED

- FOUND: platform/src/app/[locale]/portal/layout.tsx (NotificationBell mounted)
- FOUND: platform/e2e/auth.setup-b.ts
- FOUND: platform/e2e/cross-tenant.spec.ts
- FOUND: commit 85a9d7a (Task 1 commit)

---
*Phase: 07-notification-ui*
*Completed: 2026-03-25*
