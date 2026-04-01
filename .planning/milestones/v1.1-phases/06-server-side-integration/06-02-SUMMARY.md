---
phase: 06-server-side-integration
plan: 02
subsystem: notifications
tags: [slack, react-email, notifications, tasks, api-routes, bilingual, block-kit]

# Dependency graph
requires:
  - phase: 06-server-side-integration
    plan: 01
    provides: sendEmail() Resend wrapper, createNotification() helper, React Email infrastructure

provides:
  - notifyTaskEvent() orchestrator for both task_created and task_updated events
  - TaskStatusEmail bilingual React Email template (EN/ES) for task status changes
  - sendTaskCreatedMessage() Slack Block Kit attachment with priority color bar
  - POST /api/tasks — create task via service client, fires notifyTaskEvent fire-and-forget
  - PATCH /api/tasks/[id]/status — update status, fires notifyTaskEvent fire-and-forget
  - tasks/page.tsx refactored from direct supabase insert to API route fetch

affects:
  - Future task management phases (status changes trigger notification pipeline)
  - Any phase adding task-related UI (status update must go through PATCH API route)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - notifyTaskEvent() single orchestrator pattern — all task side effects (email, Slack, notification rows) in one function
    - Fire-and-forget from API routes: notifyTaskEvent(...).catch(err => console.error(...)) — route never blocked
    - Block Kit attachments with color-coded priority: PRIORITY_COLORS map in slack.ts
    - Array.from(new Set(...)) for TS-compatible Set spread (avoid TS2802 with downlevelIteration)
    - task_updated sends to deduped assigned_to+created_by; task_created sends to admin/engineer only

key-files:
  created:
    - platform/src/lib/emails/TaskStatusEmail.tsx
    - platform/src/app/api/tasks/route.ts
    - platform/src/app/api/tasks/[id]/status/route.ts
    - platform/__tests__/notifications.test.ts
  modified:
    - platform/src/lib/notifications.ts
    - platform/src/lib/slack.ts
    - platform/src/app/[locale]/portal/tasks/page.tsx
    - platform/__tests__/slack.test.ts

key-decisions:
  - "notifyTaskEvent is the single orchestrator for all task notification side effects — email, Slack, notification rows"
  - "Slack messages fire on task_created only (not task_updated) per D-17 — explicit event-type gate in orchestrator"
  - "task_updated recipients: deduplicated Array.from(new Set([assigned_to, created_by].filter(Boolean))) — not client role"
  - "task_created recipients: admin/engineer users queried by .in('role', ['admin','engineer']) — not client users"
  - "Array.from(new Set(...)) used instead of [...new Set(...)] for TypeScript ES5 target compatibility (TS2802)"
  - "Pre-existing TypeScript errors in stripe/route.ts and playwright.config.ts are out-of-scope, deferred"

patterns-established:
  - "notifyTaskEvent: fetch task -> fetch client -> determine locale -> determine recipients -> send email per user -> insert notification per user -> Slack if task_created and slack_channel"
  - "Per-step try/catch with console.error('[notify] step-name failed:', err) — function never throws, always completes"
  - "PRIORITY_COLORS map in slack.ts: critical=#C0392B, high=#E67E22, medium=#F1C40F, low=#95A5A6"
  - "API routes use fire-and-forget: notifyTaskEvent(...).catch() immediately after insert/update, before return"

requirements-completed: [NOTIF-07, NOTIF-08]

# Metrics
duration: 6min
completed: 2026-03-25
---

# Phase 6 Plan 2: Task Notification Pipeline Summary

**Task notification pipeline: notifyTaskEvent orchestrator dispatches bilingual email + Slack Block Kit + notification rows for task_created/task_updated, with API routes replacing direct Supabase inserts**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-25T02:17:38Z
- **Completed:** 2026-03-25T02:23:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `notifyTaskEvent()` orchestrator: bilingual email to deduped recipients, notification row per recipient, Slack Block Kit on task_created
- `TaskStatusEmail` React Email template: EN/ES copy driven by locale prop, consistent Button/Section styling with PaymentSuccessEmail
- `sendTaskCreatedMessage()` Slack function: Block Kit attachment with `PRIORITY_COLORS` (4 priorities), "View in Portal" accessory button
- `POST /api/tasks` and `PATCH /api/tasks/[id]/status` API routes with fire-and-forget notification dispatch
- Portal tasks page `createTask()` refactored from direct Supabase insert to `fetch('/api/tasks', { method: 'POST' })`
- 18 new unit tests (10 notifications + 8 slack) — 68 total pass

## Task Commits

Each task was committed atomically:

1. **Task 1: TaskStatusEmail, notifyTaskEvent, sendTaskCreatedMessage, tests** - `5b07af9` (feat)
2. **Task 2: Task API routes and tasks page refactor** - `ff95552` (feat)

**Plan metadata:** [docs commit hash]

## Files Created/Modified

- `platform/src/lib/emails/TaskStatusEmail.tsx` — Bilingual task status React Email template (EN/ES)
- `platform/src/lib/notifications.ts` — Extended with notifyTaskEvent() orchestrator below createNotification()
- `platform/src/lib/slack.ts` — Extended with PRIORITY_COLORS constant and sendTaskCreatedMessage() function
- `platform/__tests__/notifications.test.ts` — 10 unit tests for notifyTaskEvent (task_updated, task_created, resilience)
- `platform/__tests__/slack.test.ts` — 8 new tests for sendTaskCreatedMessage (colors, no-token skip, throws on error)
- `platform/src/app/api/tasks/route.ts` — POST /api/tasks with validation, insert, notifyTaskEvent fire-and-forget
- `platform/src/app/api/tasks/[id]/status/route.ts` — PATCH route with status validation, update, notifyTaskEvent fire-and-forget
- `platform/src/app/[locale]/portal/tasks/page.tsx` — createTask() uses fetch('/api/tasks') instead of direct supabase insert

## Decisions Made

- **Array.from(new Set(...)) for TS compatibility**: TypeScript's ES5 target (TS2802) doesn't allow spread syntax on Set. Using `Array.from(new Set([...].filter(Boolean)))` is the correct pattern.
- **Slack fires on task_created only**: The `eventType === 'task_created'` guard ensures Slack messages never fire on status changes, implementing D-17 explicitly.
- **Actor name from recipients list**: The actor is looked up in the recipients array by `actorUserId`. If the actor is not a recipient (e.g., a seller), falls back to `'Vantx'`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Set spread operator caused TS2802 TypeScript error**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `[...new Set([task.assigned_to, task.created_by].filter(Boolean))]` triggers `TS2802: Type 'Set<string>' can only be iterated through when using '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.`
- **Fix:** Changed to `Array.from(new Set(...))` which is ES5-compatible
- **Files modified:** `platform/src/lib/notifications.ts`
- **Verification:** `npx tsc --noEmit` shows no errors in our files
- **Committed in:** ff95552 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix necessary for TypeScript compliance. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in `platform/src/app/api/webhooks/stripe/route.ts` (L134/L225 — `.catch()` on `PromiseLike<void>`) and `playwright.config.ts` were present before our changes. These are out-of-scope and deferred per deviation rule scope boundary. Our files have zero TypeScript errors.

## User Setup Required

None — task notification pipeline reuses the existing `RESEND_API_KEY` and `SLACK_BOT_TOKEN` environment variables set up in Plan 01. No additional configuration needed.

## Next Phase Readiness

- Complete task notification pipeline ready: both `task_created` and `task_updated` events trigger email + notification rows
- Slack Block Kit messages fire on task creation whenever `client.slack_channel` is set
- API routes are the single entry point for task mutations — future phases should use `POST /api/tasks` and `PATCH /api/tasks/[id]/status`
- 68 unit tests passing; CI will validate on each push

---
*Phase: 06-server-side-integration*
*Completed: 2026-03-25*

## Self-Check: PASSED

- FOUND: platform/src/lib/emails/TaskStatusEmail.tsx
- FOUND: platform/src/lib/notifications.ts
- FOUND: platform/src/lib/slack.ts
- FOUND: platform/src/app/api/tasks/route.ts
- FOUND: platform/src/app/api/tasks/[id]/status/route.ts
- FOUND: platform/__tests__/notifications.test.ts
- FOUND: .planning/phases/06-server-side-integration/06-02-SUMMARY.md
- FOUND commit: 5b07af9 (Task 1)
- FOUND commit: ff95552 (Task 2)
- FOUND commit: 62aeb36 (docs/metadata)
