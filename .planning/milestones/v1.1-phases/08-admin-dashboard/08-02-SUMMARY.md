---
phase: 08-admin-dashboard
plan: 02
subsystem: ui
tags: [next.js, supabase, admin, tailwind, i18n, client-list, activity-feed]

# Dependency graph
requires:
  - phase: 08-admin-dashboard/08-01
    provides: Admin layout shell, middleware guard, RLS policies, admin i18n namespace
provides:
  - Admin overview page with 4 stat cards and 20-event activity feed (ADMIN-03)
  - Client list page with search and subscription details (ADMIN-04)
affects:
  - 08-admin-dashboard plan 03 (billing and tasks pages share same layout shell)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Cross-client queries use no client_id filter (admin sees all data)
    - Promise.all for parallel Supabase queries in useEffect
    - Explicit type casts on Supabase query results to avoid `never` inference
    - Client-side search filter (no debounce, instant — per D-16)
    - StatCard defined locally per D-13 (simpler than portal MetricCard, no delta)

key-files:
  created:
    - platform/src/app/[locale]/admin/clients/page.tsx
  modified:
    - platform/src/app/[locale]/admin/page.tsx

key-decisions:
  - "Removed Supabase join syntax (clients(name)) from admin page queries — caused TypeScript never inference; used explicit type casts instead"
  - "Activity feed uses client names from separate clients array instead of joined data — simplifies type safety"
  - "No click-through from client list rows per D-17 — view-only table"

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 08 Plan 02: Admin Overview and Client List Summary

**Admin overview page (ADMIN-03) with 4 stat cards and 20-event activity feed, plus searchable client list page (ADMIN-04) with subscription details.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T09:57:04Z
- **Completed:** 2026-03-25T10:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Admin overview page replaces placeholder: 4 stat cards (Active Clients, Current MRR, Open Tasks, Pending Payments) pulled via parallel cross-client queries
- Activity feed merges last 20 events from clients/payments/tasks sorted by timestamp — type icons (client/payment/task), description, relative timestamp
- Client list page: searchable table with Name, Status badge (color-coded), Plan, Monthly price, Active Tasks count
- Client-side search filters by name in real time
- Both pages use cross-client queries (no client_id filter) relying on RLS policies from 08-01

## Task Commits

1. **Task 1: Admin overview page with stat cards and activity feed** — `ebd46a8` (feat)
2. **Task 2: Client list page with search and subscription details** — `90383c8` (feat)

## Files Created/Modified

- `platform/src/app/[locale]/admin/page.tsx` — Full overview page replacing placeholder; StatCard component, Promise.all parallel queries, activity feed
- `platform/src/app/[locale]/admin/clients/page.tsx` — New client list page; Badge component, search input, subscription enrichment

## Decisions Made

- Supabase join syntax removed from admin queries — TypeScript infers `never` type for partial select columns when combined with joins; explicit type casts resolve this cleanly without any runtime change.
- Activity feed uses separate client data rather than Supabase joined queries — avoids the join type issue and keeps the query shapes simple.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript `never` inference on Supabase join queries**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** Original plan used `clients(name)` join syntax in select strings; Supabase TypeScript client inferred result type as `never` causing 11 type errors
- **Fix:** Removed join columns from select strings; added explicit inline type casts on all query result arrays
- **Files modified:** `platform/src/app/[locale]/admin/page.tsx`
- **Commit:** included in `ebd46a8`

## Known Stubs

None — all 4 stat cards and activity feed pull live data from Supabase. Search filter operates on live loaded data.

## Self-Check: PASSED

- `platform/src/app/[locale]/admin/page.tsx` exists and contains StatCard, Promise.all, activity feed, all 4 stat translation keys
- `platform/src/app/[locale]/admin/clients/page.tsx` exists and contains Badge, search input, table with 5 columns
- Both commits (ebd46a8, 90383c8) verified in git log
- `npx tsc --noEmit` produces zero errors in admin/ files

---
*Phase: 08-admin-dashboard*
*Completed: 2026-03-25*
