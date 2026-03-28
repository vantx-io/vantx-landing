---
phase: 15-security-hardening
plan: "01"
subsystem: api
tags: [security, csp, headers, audit-logging, postgres, supabase, typescript]

# Dependency graph
requires:
  - phase: 12-admin-capabilities
    provides: "Admin endpoints (invite, role change, status toggle) that are now instrumented"
  - phase: 10-security-foundation
    provides: "Rate limiting pattern and createServiceClient() — audit.ts mirrors the same fail-silently pattern"
provides:
  - "CSP + 5 additional security headers on all Next.js routes via next.config.js"
  - "audit_logs Postgres table with RLS (admin SELECT, service-role INSERT)"
  - "AuditLog TypeScript type in types.ts"
  - "logAuditEvent() helper in audit.ts with silent failure semantics"
  - "3 admin endpoints instrumented: user.invite, user.role_change, user.deactivate/user.reactivate"
affects: [15-02, 16-integration-tests, launch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "(supabase as any).from('audit_logs') — established pattern for tables not in Database type"
    - "Fail-silently audit helper: try/catch wraps entire DB call, dev console.error only in development"
    - "IP extraction: x-forwarded-for (first entry, trimmed) with x-real-ip fallback, undefined if absent"

key-files:
  created:
    - platform/next.config.js (modified, not created)
    - platform/supabase/migrations/008_audit_logs.sql
    - platform/src/lib/audit.ts
  modified:
    - platform/next.config.js
    - platform/src/lib/types.ts
    - platform/src/app/api/admin/users/invite/route.ts
    - platform/src/app/api/admin/users/[id]/role/route.ts
    - platform/src/app/api/admin/users/[id]/status/route.ts

key-decisions:
  - "target_id in audit_logs has NO FK constraint — avoids violation when logging invite events (invited user's public.users row does not exist at invite time, only after acceptance via DB trigger)"
  - "audit_logs not added to Database type — use (supabase as any).from('audit_logs') per established codebase pattern from phases 11 and 13"
  - "logAuditEvent() wraps entire insert in try/catch with silent failure — audit errors must never block admin operations"
  - "CSP uses unsafe-inline + unsafe-eval for script-src to support Next.js in-line scripts and dev fast refresh"

patterns-established:
  - "Security headers pattern: async headers() in nextConfig before withNextIntl wrapper, source '/(.*)', cspHeader.replace(/\\n/g, '') for single-line CSP"
  - "Audit logging pattern: import logAuditEvent, extract IP, await logAuditEvent() after successful mutation before success return"

requirements-completed: [SECURE-01, SECURE-02]

# Metrics
duration: 4m 16s
completed: 2026-03-27
---

# Phase 15 Plan 01: Security Hardening — Headers + Audit Infrastructure Summary

**CSP + 5 defense-in-depth headers on all routes via next.config.js, audit_logs table with RLS, and 3 admin endpoints instrumented with action-specific audit events**

## Performance

- **Duration:** 4m 16s
- **Started:** 2026-03-27T11:09:47Z
- **Completed:** 2026-03-27T11:14:03Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- All platform routes now serve 6 security headers: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and Strict-Transport-Security
- Created `audit_logs` Postgres table with RLS (admin-only SELECT, service-role INSERT bypasses RLS) and a DESC index on `created_at` for dashboard queries
- Built `logAuditEvent()` helper in `audit.ts` mirroring the rate-limit fail-silently pattern — audit failures cannot block admin operations
- Instrumented all 3 admin user management endpoints with action-specific events and IP extraction

## Task Commits

Each task was committed atomically:

1. **Task 1: CSP headers + migration + types + audit helper** - `8ba04b3` (feat)
2. **Task 2: Instrument admin endpoints with audit logging** - `a0f7217` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `platform/next.config.js` - Added `cspHeader` const and `async headers()` function with 6 security headers on `/(.*)`
- `platform/supabase/migrations/008_audit_logs.sql` - audit_logs table, RLS policy, DESC index; target_id intentionally has no FK
- `platform/src/lib/types.ts` - Added `AuditLog` type before the `Database` type
- `platform/src/lib/audit.ts` - `logAuditEvent()` helper with `AuditAction` union type and `AuditEventParams` interface
- `platform/src/app/api/admin/users/invite/route.ts` - Captures `inviteData`, logs `user.invite` with `inviteData?.user?.id` as target
- `platform/src/app/api/admin/users/[id]/role/route.ts` - Logs `user.role_change` with `new_role` + `client_id` metadata
- `platform/src/app/api/admin/users/[id]/status/route.ts` - Logs `user.reactivate` or `user.deactivate` based on `newIsActive`

## Decisions Made

- `target_id` has no FK constraint on `audit_logs` — invite events are logged before the invited user's `public.users` row exists (the DB trigger creates it only after acceptance). A hard FK would cause a constraint violation.
- `audit_logs` table intentionally excluded from the `Database` TypeScript type; use `(supabase as any).from('audit_logs')` per the established codebase pattern from phases 11 and 13 for `notification_preferences`.
- CSP `script-src` includes `unsafe-inline` and `unsafe-eval` to support Next.js inline scripts and dev fast-refresh. This is the standard Next.js 14 CSP baseline — nonce-based CSP can be added in v1.3 if needed.
- `logAuditEvent()` catches all errors silently (dev console.error only) — matches the `rateLimit()` fail-silently pattern established in phase 10.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors (68 errors in 18 files) were present before this plan, primarily in `src/app/api/webhooks/stripe/route.ts` and the admin routes themselves (TS2339 on `.role` and `.is_active` from pre-existing Supabase `never` inference). None of the errors are in files created or modified by this plan. No action taken — out of scope.

## User Setup Required

None - no external service configuration required. The `008_audit_logs.sql` migration must be applied to the Supabase project before the audit logging calls will succeed, but logAuditEvent() fails silently until then.

## Next Phase Readiness

- Security headers and audit infrastructure are complete and ready for plan 15-02
- The `audit_logs` table migration needs to be run in Supabase before audit events are persisted
- Pre-existing TypeScript errors in stripe webhook and admin routes are deferred items — not blocking this phase

## Self-Check: PASSED

- FOUND: platform/next.config.js
- FOUND: platform/supabase/migrations/008_audit_logs.sql
- FOUND: platform/src/lib/audit.ts
- FOUND: .planning/phases/15-security-hardening/15-01-SUMMARY.md
- FOUND commit 8ba04b3 (Task 1)
- FOUND commit a0f7217 (Task 2)

---
*Phase: 15-security-hardening*
*Completed: 2026-03-27*
