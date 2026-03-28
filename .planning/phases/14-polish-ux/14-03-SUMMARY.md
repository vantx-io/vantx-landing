---
phase: 14-polish-ux
plan: 03
subsystem: ui
tags: [react, next-intl, tailwind, loading-states, error-boundaries]

# Dependency graph
requires:
  - phase: 14-01
    provides: SkeletonCard, SkeletonTable, SkeletonText, SkeletonChart, SectionErrorBoundary components

provides:
  - All 5 admin pages show skeleton placeholders during data loading
  - All 5 admin pages have SectionErrorBoundary around data sections
  - Admin overview: 2 boundaries (stats row, activity feed)
  - Admin clients: 1 boundary (clients table); search input outside boundary
  - Admin tasks: 1 boundary (tasks table); filter dropdowns outside boundary
  - Admin billing: 3 boundaries (stats row, MRR chart, payments+subscriptions tables)
  - Admin users: 1 boundary (users table); invite button, invite form, search outside boundary

affects: [14-polish-ux, admin-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "load().finally(() => setLoading(false)) — loading state via finally ensures setLoading(false) runs even if data fetch fails"
    - "Skeleton guard: if (loading) return <skeleton JSX> before the main return — simple conditional early return"
    - "SectionErrorBoundary wraps data sections only — static UI (nav, title, filters) stays outside boundaries"

key-files:
  created: []
  modified:
    - platform/src/app/[locale]/admin/page.tsx
    - platform/src/app/[locale]/admin/clients/page.tsx
    - platform/src/app/[locale]/admin/tasks/page.tsx
    - platform/src/app/[locale]/admin/billing/page.tsx
    - platform/src/app/[locale]/admin/users/page.tsx

key-decisions:
  - "Admin users page uses loadData().finally() instead of load().finally() — same pattern, different function name due to pre-existing loadData() used by invite form reload"
  - "Admin billing has 3 SectionErrorBoundaries instead of the plan-specified 2 — payments + subscriptions tables combined into a third boundary for safety"
  - "Filter dropdowns (tasks page) and search inputs (clients, users pages) kept outside error boundaries — preserves filter/search functionality if table section errors"

patterns-established:
  - "Admin page loading pattern: const [loading, setLoading] = useState(true) + load().finally(() => setLoading(false)) + if (loading) return <skeleton>"
  - "SectionErrorBoundary with tc('error_section'), tc('error_section_body'), tc('error_retry') i18n keys for consistent fallback copy"

requirements-completed: [UX-01, UX-03]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 14 Plan 03: Admin Pages Skeleton Loading and Error Boundaries Summary

**Loading skeletons and SectionErrorBoundary wired into all 5 admin pages using load().finally() pattern, with filter/search controls kept outside error boundaries**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T17:42:52Z
- **Completed:** 2026-03-26T17:46:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Admin overview and clients pages updated with skeleton loading states and 2+1 SectionErrorBoundaries respectively (Task 1)
- Admin tasks, billing, and users pages updated with skeleton loading states and 1+3+1 SectionErrorBoundaries respectively (Task 2)
- All pages follow `load().finally(() => setLoading(false))` pattern ensuring loading state clears even on error
- Interactive controls (filter dropdowns, search inputs, invite form) remain outside error boundaries so they stay functional if table section errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add skeletons + error boundaries to Admin Overview and Clients** - `9ad3b58` (feat)
2. **Task 2: Add skeletons + error boundaries to Admin Tasks, Billing, Users** - `a4d1dc3` (feat)

**Plan metadata:** *(pending)*

## Files Created/Modified
- `platform/src/app/[locale]/admin/page.tsx` - Added SkeletonCard x4 + SkeletonText loading state, 2 SectionErrorBoundaries (stats row, activity feed)
- `platform/src/app/[locale]/admin/clients/page.tsx` - Added SkeletonTable loading state, 1 SectionErrorBoundary (clients table, search outside)
- `platform/src/app/[locale]/admin/tasks/page.tsx` - Added SkeletonTable loading state, 1 SectionErrorBoundary (tasks table, filter dropdowns outside)
- `platform/src/app/[locale]/admin/billing/page.tsx` - Added SkeletonCard x4 + SkeletonChart + SkeletonText x2 loading state, 3 SectionErrorBoundaries (stats, chart, tables)
- `platform/src/app/[locale]/admin/users/page.tsx` - Added SkeletonTable loading state, 1 SectionErrorBoundary (users table, invite+search outside)

## Decisions Made
- Admin users page calls `loadData().finally()` (not `load().finally()`) because the pre-existing function was named `loadData()` and is also called by the invite flow after successful invite — renaming would have been unnecessary refactoring
- Admin billing got a third SectionErrorBoundary combining payments + subscriptions tables — the plan specified a combined third boundary "for safety" which was implemented as specified
- Filter dropdowns on tasks page and search inputs on clients/users pages left outside error boundaries per plan spec — these controls work independently of the table data

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in unrelated files (stripe webhook route, admin API routes, playwright config) were present before this plan and are out of scope. All 5 admin page files compile without errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- All 5 admin pages now have consistent loading UX and resilient error handling
- Portal pages (dashboard, tests, reports, tasks, billing, services, settings) were handled in plan 14-02
- Phase 14 UX polish requirements UX-01 and UX-03 are now complete across both admin and portal surfaces

---
*Phase: 14-polish-ux*
*Completed: 2026-03-26*

## Self-Check: PASSED

- FOUND: platform/src/app/[locale]/admin/page.tsx
- FOUND: platform/src/app/[locale]/admin/clients/page.tsx
- FOUND: platform/src/app/[locale]/admin/tasks/page.tsx
- FOUND: platform/src/app/[locale]/admin/billing/page.tsx
- FOUND: platform/src/app/[locale]/admin/users/page.tsx
- FOUND: .planning/phases/14-polish-ux/14-03-SUMMARY.md
- FOUND commit 9ad3b58: feat(14-03) admin overview and clients
- FOUND commit a4d1dc3: feat(14-03) admin tasks, billing, users
- FOUND commit 75f8a80: docs(14-03) plan metadata
