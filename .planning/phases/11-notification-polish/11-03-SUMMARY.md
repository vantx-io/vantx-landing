---
phase: 11-notification-polish
plan: 03
subsystem: backend
tags: [react-email, vercel-cron, vitest, tdd, date-fns, supabase, resend]

# Dependency graph
requires:
  - phase: 11-01
    provides: notification_preferences table, CRON_SECRET env var, sendEmail pattern
  - phase: 06-server-side-integration
    provides: sendEmail(), TaskStatusEmail pattern, createServiceClient()
provides:
  - WeeklyDigestEmail React Email template (bilingual en/es)
  - GET /api/cron/digest cron handler with CRON_SECRET auth
  - vercel.json cron schedule (Monday 9:00 UTC)
  - Unit tests for digest cron handler and email template (11 tests)
affects: [production-deploy — CRON_SECRET env var required]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Vercel Cron handler pattern with CRON_SECRET Bearer auth gate
    - Promise.allSettled for parallel per-user email sends (resilient to individual failures)
    - notification_preferences cast to (supabase as any) — same pattern as existing codebase for tables not in generated types
    - TDD RED-GREEN cycle for cron handler and email template

key-files:
  created:
    - platform/src/lib/emails/WeeklyDigestEmail.tsx
    - platform/src/app/api/cron/digest/route.ts
    - platform/vercel.json
    - platform/__tests__/digest.test.ts
  modified: []

key-decisions:
  - "Sellers receive cross-client digest via same else-branch as admin/engineer (D-10) — they have cross-client access via RLS, no separate handling needed"
  - "notification_preferences queried with (supabase as any) cast — migration 003 table not in generated types, matches established pattern from Phase 11-01"
  - "Zero-activity check before sendEmail prevents empty digest emails (D-08)"
  - "Promise.allSettled ensures all users are attempted regardless of individual email failures (D-19)"

metrics:
  duration: 5m
  completed: "2026-03-26"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
  tests_added: 11
  tests_passing: 11
---

# Phase 11 Plan 03: Digest Delivery Summary

Weekly digest email system — React Email template, Vercel Cron handler querying 7-day task activity and sending personalized Monday digests, with vercel.json cron config and 11 unit tests covering auth, sending, skip logic, resilience, and bilingual rendering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | WeeklyDigestEmail template and vercel.json | 27b6f8a | WeeklyDigestEmail.tsx, vercel.json |
| 2 (RED) | Digest handler failing tests | ffd430f | __tests__/digest.test.ts |
| 2 (GREEN) | Cron digest handler implementation | d11c1ca | src/app/api/cron/digest/route.ts |
| 2 (fix) | TypeScript compatibility fix | 840e83a | route.ts (as any cast) |

## What Was Built

### WeeklyDigestEmail (`platform/src/lib/emails/WeeklyDigestEmail.tsx`)

React Email component following TaskStatusEmail design language exactly:
- Max-width 560px, white card on `#f9f9f9` background, 32px padding, border-radius 8
- Bilingual (en/es) — `locale` prop switches all copy at render time
- Status summary: New / In Progress / Completed counts as inline text (fontSize 14)
- Task list: up to 10 items with truncation line for overflow ("and N more" / "y N más")
- CTA button: `#2563EB` blue, 12px/24px padding, border-radius 6
- Footer: "Vantx . vantx.io . hello@vantx.io"

### Cron Handler (`platform/src/app/api/cron/digest/route.ts`)

GET /api/cron/digest — protected Vercel Cron endpoint:
1. Verifies `Authorization: Bearer <CRON_SECRET>` → 401 on mismatch
2. Fetches all users via service client (bypasses RLS)
3. Builds client map for locale lookup
4. Per user: checks `digest_enabled` in `notification_preferences` (null row = send, opt-out model)
5. Client role users → scoped task query with `.eq('client_id', ...)` + 7-day window
6. Admin/engineer/seller → cross-client task query (no client_id filter)
7. Skips silently when zero tasks in window (D-08)
8. Builds `taskSummary` and `recentTasks.slice(0, 10)` for template
9. Sends bilingual email with `sendEmail()` + `React.createElement(WeeklyDigestEmail, ...)`
10. Uses `Promise.allSettled` — one user failure does not block others (D-19)

### vercel.json (`platform/vercel.json`)

Configures Vercel Cron to run `/api/cron/digest` every Monday at 09:00 UTC (`0 9 * * 1`).

### Tests (`platform/__tests__/digest.test.ts`)

11 tests across 5 suites:
- CRON_SECRET validation (missing, wrong, correct)
- Digest sending to eligible client users
- Skip on digest_enabled=false
- Skip on zero task activity (D-08)
- Promise.allSettled resilience — handler resolves even when sendEmail rejects (D-19)
- Admin cross-client view
- Seller cross-client view (same as admin — RLS grants access)
- WeeklyDigestEmail bilingual rendering (en heading, es heading)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error on notification_preferences query**
- **Found during:** Task 2 GREEN — TypeScript compile check
- **Issue:** `TS2339 Property 'digest_enabled' does not exist on type 'never'` — the `notification_preferences` table was added in migration 003 and is not in the generated `Database` TypeScript types
- **Fix:** Applied `(supabase as any)` cast to the `.from('notification_preferences')` call — matches the established codebase pattern used in Phase 11-01 (preferences API route) and the existing Stripe webhook handler
- **Files modified:** `platform/src/app/api/cron/digest/route.ts`
- **Commit:** 840e83a

## Known Stubs

None. All functionality is fully wired:
- WeeklyDigestEmail renders real data passed via props
- Cron handler queries real Supabase tables
- vercel.json configures real schedule

The CRON_SECRET env var must be set in production Vercel environment variables before the cron triggers.

## Self-Check: PASSED

Files verified:
- FOUND: platform/src/lib/emails/WeeklyDigestEmail.tsx
- FOUND: platform/src/app/api/cron/digest/route.ts
- FOUND: platform/vercel.json
- FOUND: platform/__tests__/digest.test.ts

Commits verified:
- FOUND: 27b6f8a (feat WeeklyDigestEmail + vercel.json)
- FOUND: ffd430f (test RED digest handler)
- FOUND: d11c1ca (feat GREEN digest handler)
- FOUND: 840e83a (fix TypeScript as-any cast)

Tests: 11/11 passing (`npx vitest run __tests__/digest.test.ts`)
TypeScript: 0 errors in plan files
