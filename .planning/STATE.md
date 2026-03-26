---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Security & Polish
status: unknown
stopped_at: Completed 14-polish-ux-01-PLAN.md
last_updated: "2026-03-26T13:00:57.749Z"
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 11
  completed_plans: 9
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma fácil de reservar tiempo, todo lo demás falla.
**Current focus:** Phase 14 — polish-ux

## Current Position

Phase: 14 (polish-ux) — EXECUTING
Plan: 2 of 3

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v1.2)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |

*Updated after each plan completion*

**v1.1 reference (for calibration):**

| Phase 05 P02 | 5m | 2 tasks | 7 files |
| Phase 05 P03 | 8m | 2 tasks | 7 files |
| Phase 06-server-side-integration P01 | 10min | 2 tasks | 9 files |
| Phase 06 P02 | 6min | 2 tasks | 7 files |
| Phase 07-notification-ui P01 | 15min | 2 tasks | 4 files |
| Phase 07-notification-ui P02 | 12min | 2 tasks | 4 files |
| Phase 08-admin-dashboard P01 | 12min | 2 tasks | 6 files |
| Phase 08 P02 | 8min | 2 tasks | 2 files |
| Phase 08-admin-dashboard P03 | 2min | 3 tasks | 3 files |
| Phase 09 P01 | 5min | 2 tasks | 8 files |
| Phase 09 P02 | 3min | 2 tasks | 3 files |
| Phase 09 P03 | 3min | 2 tasks | 6 files |
| Phase 10-security-foundation P01 | 7min | 2 tasks | 10 files |
| Phase 11 P01 | 5min | 2 tasks | 8 files |
| Phase 11 P03 | 5m | 2 tasks | 4 files |
| Phase 11 P02 | 5min | 2 tasks | 4 files |
| Phase 12 P01 | 2m | 2 tasks | 7 files |
| Phase 12 P02 | 4m | 2 tasks | 5 files |
| Phase 13-auth-ux P01 | 5m | 2 tasks | 4 files |
| Phase 13-auth-ux P02 | 8m | 2 tasks | 5 files |
| Phase 14-polish-ux P01 | 3min | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.

Key architectural decisions for v1.1 (inherited context):

- Vitest replaces Jest (Next.js official recommendation, ESM-native)
- Resend + React Email for transactional email (verify free tier at implementation)
- Admin routes protected in middleware + layout.tsx — never client-side only
- Supabase Realtime subscriptions must include `user_id` filter (cross-tenant safety)
- Storage bucket `task-attachments` private from day one; signed URLs at display time
- [Phase 05]: Vitest globals:true avoids explicit imports in every test file
- [Phase 05]: onboard.ts accepts supabase as parameter — injected mock in tests, no module mock needed
- [Phase 05]: vi.stubEnv + vi.unstubAllEnvs pattern for env var isolation between tests
- [Phase 05]: Playwright setup project pattern chosen over per-test auth — runs once, reuses storageState
- [Phase 05]: 4-job CI with lint-and-typecheck as single gate for unit-tests, e2e-tests, i18n-check
- [Phase 06-01]: Resend instantiated per sendEmail() call (no singleton) — simpler test isolation via vi.stubEnv
- [Phase 06-01]: Email locale from client.market field: LATAM=es, else en
- [Phase 06-01]: vi.hoisted() required for mock variables referenced in vi.mock() factories
- [Phase 06-01]: vitest.config.mts must exclude e2e/ to prevent Playwright spec pickup
- [Phase 06]: notifyTaskEvent is the single orchestrator for all task notification side effects — email, Slack, notification rows
- [Phase 06]: Slack messages fire on task_created only (not task_updated) per D-17 — explicit event-type gate in orchestrator
- [Phase 06]: task_updated recipients: deduped Array.from(new Set([assigned_to, created_by].filter(Boolean))) — not client role users
- [Phase 06]: Array.from(new Set(...)) used instead of [...new Set(...)] for TypeScript ES5 target compatibility
- [Phase 07-01]: AppNotification declared before Database type to avoid DOM global Notification interface collision (lib:dom in tsconfig)
- [Phase 07-01]: userId guard in NotificationBell: returns null render until auth resolves — bell invisible to unauthenticated users
- [Phase 07-01]: Realtime subscription cleanup returns supabase.removeChannel(channel) to prevent double-mount leak in React Strict Mode
- [Phase 07]: NotificationBell placed in portal sidebar header after client badges — always visible on all portal routes for authenticated users
- [Phase 07]: Cross-tenant E2E: dual browser contexts with separate storageState + service role insert prove RLS isolation from client perspective
- [Phase 08-admin-dashboard]: Admin role guard in middleware queries users table for role — never client-side only (ADMIN-01)
- [Phase 08-admin-dashboard]: Seller role added to all admin RLS policies — was missing from 001_schema.sql existing admin policies
- [Phase 08-admin-dashboard]: Admin layout uses useTranslations('admin') separate namespace — isolates admin/portal i18n keys
- [Phase 08]: Removed Supabase join syntax from admin queries — TypeScript never inference; explicit type casts resolve cleanly
- [Phase 08-admin-dashboard]: Cross-client queries omit .eq('client_id') — RLS grants admin/engineer/seller full SELECT via 002_admin_rls.sql
- [Phase 09]: react-dropzone v15 installed (v14 in blockers, v15 resolved cleanly)
- [Phase 09]: Simulated progress ticker for Supabase Storage uploads (SDK lacks native progress events)
- [Phase 09]: Image signed URLs eagerly on mount; non-image lazily on click (Pitfall 6)
- [Phase 09]: File sizes fetched from Supabase Storage list() metadata — no schema changes (D-07)
- [Phase 09]: Storage isolation E2E test uses REST API fetch with credentials:include in page.evaluate instead of @supabase/ssr dynamic import

Key architectural decisions for v1.2 (from research):

- Rate limiting via Upstash Redis (sliding window) — in-memory Maps are broken on Vercel serverless
- Supabase native MFA APIs (supabase.auth.mfa.*) — no speakeasy/otplib needed; QR SVG returned directly from enroll()
- AAL2 middleware gate: compound condition (nextLevel === 'aal2' && currentLevel !== 'aal2') — prevents non-MFA user lockout
- listFactors() + unenroll() unverified factors before enroll() — prevents 10-factor hard limit accumulation
- Notification preferences: opt-out model (null row = all channels enabled); enforced in notifyTaskEvent at send time
- Weekly digest via Vercel Cron (vercel.json) — no persistent worker; Promise.allSettled() for parallel sends
- Admin invite: Supabase DB trigger auto-creates public users row on auth.users INSERT — never application code
- MRR chart: use payments table as ground truth (not subscriptions.price_monthly); add cancel_at_period_end column first
- Playwright visual regression baselines: generated in CI (Linux) only — macOS baselines fail CI due to font rendering diff
- [Phase 10-security-foundation]: Rate limit block outside try/catch ensures rl always defined for rateLimitHeaders() in error responses
- [Phase 10-security-foundation]: window: '1 m' as const required on RL_CONFIG — Upstash Duration is branded template literal, TypeScript infers string from object literals
- [Phase 10-security-foundation]: createServerSupabase() (not createServiceClient()) for rate limit user ID extraction — service client has empty cookies, no auth context
- [Phase 11]: Opt-out model: null row in notification_preferences = all channels on; no INSERT on first visit
- [Phase 11]: Supabase upsert typed via (supabase as any) cast — TypeScript never inference fix, matches existing codebase pattern
- [Phase 11]: Settings nav item as last entry with gear icon from lucide-react — distinguishes from text-only nav items
- [Phase 11]: Sellers receive cross-client digest via same else-branch as admin/engineer — RLS grants cross-client access, no separate handling needed
- [Phase 11]: notification_preferences queried via (supabase as any) cast in digest handler — matches established pattern from 11-01 and existing codebase
- [Phase 11]: Preference check placed inside per-recipient loop in notifyTaskEvent — each recipient has independent preferences
- [Phase 11]: Stripe webhook user lookup restructured to async to allow await on prefs lookup while preserving fire-and-forget pattern
- [Phase 12]: SECURITY DEFINER on handle_new_user trigger: authenticated role lacks INSERT policy on users table; DEFINER runs as owner and bypasses RLS
- [Phase 12]: ban_duration=876000h for permanent-style ban; none to unban — matches Supabase Auth admin.updateUserById API
- [Phase 12]: is_active portal check placed after unauthenticated redirect — deactivated users with valid sessions caught before reaching portal
- [Phase 12]: AreaChart defs/linearGradient are native SVG elements inside AreaChart JSX — not recharts imports (Pitfall 5)
- [Phase 12]: MRR query added as third item to existing Promise.all in billing page to reduce round trips
- [Phase 13-auth-ux]: RLS UPDATE policy uses WITH CHECK (id = auth.uid()) — field restriction enforced at API layer only
- [Phase 13-auth-ux]: Two separate useEffects for profile and prefs load — independent loading concerns
- [Phase 14-polish-ux]: SectionErrorBoundary uses 'use client' directive as first line — required for class components with error boundary behavior in Next.js App Router
- [Phase 14-polish-ux]: has_onboarded PATCH branch placed before full_name validation — early-return pattern for orthogonal Profile API operations
- [Phase 14-polish-ux]: Existing users backfilled to has_onboarded=true in migration 007 — prevents onboarding card appearing for established accounts after deploy

### Pending Todos

- Phase 10: Validate AAL2 middleware compound condition with E2E test covering 3 states (no MFA, enrolled+unchallenged, enrolled+challenged)
- Phase 12: Validate Supabase post-signup trigger syntax against existing schema before migration is written
- Phase 13: Write first NTARH test before building full suite — validate Next.js 15 `await params` behavior (MEDIUM confidence gap)

### Blockers/Concerns

- **Vercel Hobby cron timing**: Weekly frequency confirmed within spec, but ±1h accuracy applies — verify after first production deployment
- **Upstash free tier**: 10k requests/day; monitor after launch at current scale (<20 concurrent users)
- **Playwright CI baselines**: Must be generated from CI environment (Linux), not macOS — set maxDiffPixels: 50 or threshold: 0.05; mask dynamic elements; disable CSS animations before capture

## Session Continuity

Last session: 2026-03-26T13:00:57.743Z
Stopped at: Completed 14-polish-ux-01-PLAN.md
Resume file: None
