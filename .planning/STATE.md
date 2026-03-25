---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Platform Hardening & Admin
status: unknown
stopped_at: Completed 07-01-PLAN.md
last_updated: "2026-03-25T03:28:03.926Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 7
  completed_plans: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-24)

**Core value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma fácil de reservar tiempo, todo lo demás falla.
**Current focus:** Phase 07 — notification-ui

## Current Position

Phase: 07 (notification-ui) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v1.1)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |

*Updated after each plan completion*
| Phase 05 P02 | 5m | 2 tasks | 7 files |
| Phase 05 P03 | 8m | 2 tasks | 7 files |
| Phase 06-server-side-integration P01 | 10min | 2 tasks | 9 files |
| Phase 06 P02 | 6min | 2 tasks | 7 files |
| Phase 07-notification-ui P01 | 15min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.

Key architectural decisions for v1.1:

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

### Pending Todos

None yet.

### Blockers/Concerns

- **Resend free tier**: Verify 3,000 emails/month limit before Phase 6 — WebFetch was blocked during research
- **react-dropzone version**: Confirm `^14.x` resolves at npm install time in Phase 9
- **Supabase Realtime REPLICA IDENTITY FULL**: Must be enabled in Supabase Dashboard before Phase 7
- **Storage RLS `storage.foldername` syntax**: Verify array indexing in current Supabase docs at migration time (Phase 5)
- **Email i18n locale signal**: Verify `market` field exists on `clients` table before Phase 6 email templates

## Session Continuity

Last session: 2026-03-25T03:28:03.922Z
Stopped at: Completed 07-01-PLAN.md
Resume file: None
