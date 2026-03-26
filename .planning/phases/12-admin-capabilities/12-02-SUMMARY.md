---
phase: 12
plan: 02
subsystem: admin-ui
tags: [admin, users, i18n, recharts, mrr]
dependency_graph:
  requires: ["12-01"]
  provides: ["admin-users-ui", "mrr-chart"]
  affects: ["platform/src/app/[locale]/admin/"]
tech_stack:
  added: []
  patterns: ["recharts-areachart-with-native-svg-defs", "inline-invite-form", "optimistic-ui-state-update"]
key_files:
  created:
    - platform/src/app/[locale]/admin/users/page.tsx
  modified:
    - platform/src/messages/en.json
    - platform/src/messages/es.json
    - platform/src/app/[locale]/admin/layout.tsx
    - platform/src/app/[locale]/admin/billing/page.tsx
decisions:
  - "AreaChart defs/linearGradient are native SVG elements rendered as JSX children inside AreaChart — not recharts imports"
  - "MRR query added as third item to existing Promise.all in billing page — reduces round trips from separate await"
  - "Users page uses optimistic state update (setUsers map) after role/status API calls — no full reload"
metrics:
  duration: "4m"
  completed_date: "2026-03-26"
  tasks: 2
  files: 5
---

# Phase 12 Plan 02: Admin Users UI + MRR Chart Summary

Admin users management page (table + inline invite + role change + deactivation), MRR AreaChart on billing page, i18n for both languages, Users nav in sidebar.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | i18n keys + sidebar nav + Users management page | 673d179 | en.json, es.json, layout.tsx, users/page.tsx |
| 2 | MRR AreaChart on admin billing page | 778abcc | billing/page.tsx |

## What Was Built

### Task 1: Users Management Page + i18n + Sidebar Nav

- Added `admin.nav.users: "Users"` / `"Usuarios"` to both en.json and es.json
- Added `admin.users.*` namespace (20 keys) covering title, invite form, table columns, action labels, feedback messages
- Added `admin.billing.mrr_trend_title` and `mrr_no_data` keys to both files
- Updated `navItems` in `admin/layout.tsx` to include `{ key: "users", segment: "/users" }` after billing
- Created `platform/src/app/[locale]/admin/users/page.tsx` (334 lines) with:
  - 7-column table: Name, Email, Role (badge), Client (lookup), Status (badge), Created, Actions
  - Inline invite form (not modal) toggles via button, disabled client dropdown when role != client
  - Role change dropdown per row calling PATCH `/api/admin/users/[id]/role`
  - Deactivate/Reactivate toggle calling PATCH `/api/admin/users/[id]/status`
  - Deactivated rows dimmed at `opacity-50`
  - Optimistic UI state updates after successful API calls
  - All text via `useTranslations("admin")` with `users.*` keys

### Task 2: MRR AreaChart on Billing Page

- Added Recharts imports: AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
- Added `mrrData` state: `{ month: string; mrr: number }[]`
- Added MRR query as third item in existing `Promise.all` — `.eq("status", "paid")` on last 12 months
- Groups paid payments by `YYYY-MM` key, fills 12-month array with gaps as 0
- AreaChart inserted between stat cards `</div>` and "Recent Payments" `<h2>`
- Blue gradient fill `#2E75B6` with `linearGradient` as native SVG (not recharts import)
- Y-axis formats as `$Xk`, Tooltip shows `$value.toLocaleString()`
- Empty state when `mrrData.some(d => d.mrr > 0)` is false

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All API calls target real routes created in Plan 01. Data is loaded from Supabase.

## Self-Check: PASSED

Files created:
- platform/src/app/[locale]/admin/users/page.tsx — FOUND
- platform/src/messages/en.json (mrr_trend_title, admin.users) — FOUND
- platform/src/messages/es.json (mrr_trend_title, admin.users) — FOUND

Commits:
- 673d179 (Task 1) — FOUND
- 778abcc (Task 2) — FOUND
