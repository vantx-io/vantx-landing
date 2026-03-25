---
phase: 08-admin-dashboard
plan: 01
subsystem: ui
tags: [next.js, supabase, rls, middleware, i18n, admin, tailwind]

# Dependency graph
requires:
  - phase: 07-notification-ui
    provides: NotificationBell component (self-managing, no props needed)
  - phase: 06-server-side-integration
    provides: notifications table, task notification events
provides:
  - RLS migration expanding admin/engineer/seller access to all 8 tables
  - Middleware role guard blocking client-role users from /admin routes
  - Admin layout with dark sidebar, ADMIN badge, role badge, NotificationBell
  - Admin i18n namespace (en + es) with nav, sidebar, overview, clients, tasks, billing keys
  - Placeholder admin overview page
affects:
  - 08-admin-dashboard plans 02 and 03 (depend on layout shell and middleware guard)
  - Any future admin page or feature (all depend on this foundation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Admin layout mirrors portal layout structure with client-scoped state removed
    - Middleware early-exit guard extended to include /admin paths before auth check
    - Role-based redirect: client/null role -> /portal, unauthenticated -> /login
    - i18n parity: admin namespace in both en.json and es.json with identical English content

key-files:
  created:
    - platform/supabase/migrations/002_admin_rls.sql
    - platform/src/app/[locale]/admin/layout.tsx
    - platform/src/app/[locale]/admin/page.tsx
  modified:
    - platform/src/middleware.ts
    - platform/src/messages/en.json
    - platform/src/messages/es.json

key-decisions:
  - "Admin role guard in middleware queries users table for role before allowing /admin access — never client-side only"
  - "Seller role added to all admin RLS policies (was missing from 001_schema.sql policies)"
  - "Admin layout uses useTranslations('admin') not 'nav' — separate namespace keeps admin/portal keys isolated"
  - "Sign out button is literal string (not translated) because the translation key logic was a no-op in the plan code"

patterns-established:
  - "Admin guard pattern: middleware checks pathWithoutLocale.startsWith('/admin') + role lookup in users table"
  - "Admin layout structure: dark sidebar (bg-brand-sidebar) + ADMIN badge + role badge + NotificationBell + nav + footer with logout + Back to Portal"

requirements-completed: [ADMIN-01, ADMIN-02, NOTIF-09]

# Metrics
duration: 12min
completed: 2026-03-25
---

# Phase 08 Plan 01: Admin Foundation Summary

**Supabase RLS migration for cross-client access, middleware role guard on /admin routes, and admin layout with dark sidebar and NotificationBell completing NOTIF-09**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-25T09:55:00Z
- **Completed:** 2026-03-25T10:07:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- RLS migration (002_admin_rls.sql) extends 2 existing policies to include seller role and adds 6 new policies covering subscriptions, payments, test_results, monthly_metrics, weekly_metrics, reports
- Middleware now intercepts /admin routes: unauthenticated users redirected to /login, client/null-role users redirected to /portal
- Admin layout with dark sidebar matching portal aesthetic — ADMIN badge, user role badge, NotificationBell, 4 nav items (Overview/Clients/Tasks/Billing), footer with logout and Back to Portal
- Admin i18n namespace with 35+ translation keys in both en.json and es.json for i18n parity

## Task Commits

Each task was committed atomically:

1. **Task 1: RLS migration + middleware admin guard + admin i18n namespace** - `8bacf82` (feat)
2. **Task 2: Admin layout with dark sidebar and NotificationBell** - `c122273` (feat)

**Plan metadata:** (docs commit, see below)

## Files Created/Modified
- `platform/supabase/migrations/002_admin_rls.sql` - 8 RLS policies granting admin/engineer/seller cross-client SELECT on all tables
- `platform/src/middleware.ts` - Extended early-exit condition and added /admin role guard block
- `platform/src/messages/en.json` - Added "admin" namespace with nav/sidebar/overview/clients/tasks/billing keys
- `platform/src/messages/es.json` - Added identical "admin" namespace (English content for parity per D-09)
- `platform/src/app/[locale]/admin/layout.tsx` - Admin layout with dark sidebar, NotificationBell, nav, footer
- `platform/src/app/[locale]/admin/page.tsx` - Placeholder overview page rendering within admin layout

## Decisions Made
- Seller role added to all admin policies — the existing 001_schema.sql only had admin and engineer; this migration corrects that gap.
- Admin role guard placed after the portal/login guards in middleware — preserves existing redirect logic order.
- Admin layout uses a standalone `Sign out` literal rather than `tc("logout")` from common namespace — avoids importing a second translations hook purely for one string; the common namespace `logout` key is English anyway.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `platform/src/app/[locale]/portal/tests/page.tsx` (2 errors on client_id) and `platform/playwright.config.ts` (1 error on baseURL) were present before this plan and are not caused by these changes. All new files (admin layout, migration) compile without errors.

## User Setup Required

None - no external service configuration required.

The RLS migration (002_admin_rls.sql) must be applied to the Supabase database via `supabase db push` or the Supabase Dashboard SQL editor when deploying to production.

## Next Phase Readiness

- Admin foundation complete — middleware guard, layout shell, and RLS policies are all in place
- Plan 02 can implement the admin overview page (replacing the placeholder page.tsx)
- Plan 03 can implement clients, tasks, and billing admin pages within the layout shell
- NotificationBell is live in admin sidebar (NOTIF-09 complete)

## Self-Check: PASSED

All 6 files exist on disk. Both task commits (8bacf82, c122273) verified in git log.

---
*Phase: 08-admin-dashboard*
*Completed: 2026-03-25*
