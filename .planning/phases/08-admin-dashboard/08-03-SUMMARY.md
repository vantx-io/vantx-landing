---
phase: 08-admin-dashboard
plan: 03
subsystem: ui
tags: [next.js, supabase, playwright, admin, tailwind, e2e, i18n]

# Dependency graph
requires:
  - phase: 08-admin-dashboard
    plan: 01
    provides: Admin layout shell, middleware role guard, RLS policies, i18n namespace
provides:
  - Cross-client task view with three filter dropdowns (ADMIN-05)
  - Billing overview with 4 stat cards and two data tables (ADMIN-06)
  - Playwright E2E test confirming middleware redirect for client-role users (TEST-08)
affects:
  - Admin dashboard completeness (phase 08 final wave 2 plan)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TaskWithClient/SubWithClient/PaymentWithClient intersection types for FK join data
    - Cross-client Supabase queries using FK join syntax select("*, clients(name)") without .eq("client_id") filter
    - Three-dimensional client-side filtering using chained .filter() calls
    - StatCard component pattern: bg-white rounded-xl p-5 border border-gray-100 flex-1
    - E2E test for middleware redirect using storageState from setup project (client-role user)

key-files:
  created:
    - platform/src/app/[locale]/admin/tasks/page.tsx
    - platform/src/app/[locale]/admin/billing/page.tsx
    - platform/e2e/admin-redirect.spec.ts

key-decisions:
  - "Cross-client queries omit .eq('client_id') filter entirely — RLS policies from 002_admin_rls.sql grant admin/engineer/seller full SELECT without client scoping"
  - "MRR null-safe via (s.price_monthly || 0) — price_monthly is nullable in Subscription type, prevents NaN accumulation"
  - "E2E test placed in chromium project using existing juan@novapay.com storageState — no new project or auth setup needed"
  - "No charts on billing page — ADMIN-08 (MRR trend chart) deferred to v2 per D-25"

requirements-completed: [ADMIN-05, ADMIN-06, TEST-08]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 08 Plan 03: Cross-client Tasks, Billing Overview, and Admin Redirect E2E Summary

**Cross-client task view with three filter dropdowns, billing overview with 4 stat cards and payment/subscription tables, and Playwright E2E test proving middleware redirect enforcement for client-role users**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T09:57:15Z
- **Completed:** 2026-03-25T09:58:56Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Admin tasks page shows all tasks from all clients in a table with Title, Client Name, Priority badge, Status badge, Assigned To, Created columns — sorted by `created_at` descending
- Three client-side filter dropdowns (Client, Priority, Status) use chained `.filter()` calls on loaded data — no server round-trips on filter change
- Admin billing page shows 4 stat cards (Total MRR, Active Subscriptions, Pending Payments, Failed Payments) computed from live Supabase data
- Recent payments table shows last 50 payments with FK join to clients table for client name
- Active subscriptions table filtered to `status === "active"` with FK join — null-safe MRR using `(s.price_monthly || 0)`
- E2E spec covers `/en/admin` and `/en/admin/clients` sub-route, both asserting redirect to `/portal` for client-role user

## Task Commits

Each task was committed atomically:

1. **Task 1: Cross-client task view with three filter dropdowns** - `a2bf425` (feat)
2. **Task 2: Billing overview with stat cards and payment tables** - `fb54a19` (feat)
3. **Task 3: E2E Playwright test for admin redirect** - `bfe8bf3` (test)

## Files Created

- `platform/src/app/[locale]/admin/tasks/page.tsx` — Cross-client tasks table with Client/Priority/Status filters and 6-column table
- `platform/src/app/[locale]/admin/billing/page.tsx` — 4 stat cards + recent payments table + active subscriptions table
- `platform/e2e/admin-redirect.spec.ts` — 2 Playwright tests confirming client-role redirect from /admin and /admin/clients

## Decisions Made

- Cross-client queries: no `.eq("client_id")` filter in admin queries — RLS grants admin/engineer/seller full SELECT via 002_admin_rls.sql migration applied in plan 01.
- MRR null-safety: `(s.price_monthly || 0)` prevents NaN when `price_monthly` is null (Subscription type allows null).
- E2E uses existing `chromium` project with `storageState: "playwright/.auth/user.json"` — `juan@novapay.com` is confirmed client-role (auth.setup.ts waits for redirect to `/portal` after login, proving client-role behavior).
- No MRR trend chart (no Recharts import) — ADMIN-08 deferred to v2 per D-25.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is live-wired to Supabase queries. Empty states display i18n-translated messages (no hardcoded placeholders).

## Self-Check: PASSED

All 3 files exist on disk. Commits a2bf425, fb54a19, bfe8bf3 verified in git log.

---
*Phase: 08-admin-dashboard*
*Completed: 2026-03-25*
