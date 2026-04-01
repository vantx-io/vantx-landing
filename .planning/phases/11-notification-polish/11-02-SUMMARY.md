---
phase: 11-notification-polish
plan: "02"
subsystem: api
tags: [notifications, preferences, supabase, stripe, vitest, tdd]

requires:
  - phase: 11-01
    provides: notification_preferences table, settings UI, opt-out model decision (D-03)

provides:
  - Preference-aware notifyTaskEvent that skips email/in-app per user preference
  - Preference-aware Stripe webhook for invoice.paid and invoice.payment_failed
  - TDD test coverage for all preference paths including opt-out model

affects:
  - 11-03 (weekly digest — will need same opt-out model patterns)
  - any future send site added to notifications.ts

tech-stack:
  added: []
  patterns:
    - "maybeSingle() for optional preference lookup (never .single() on notification_preferences)"
    - "Opt-out model: prefs?.email_enabled !== false (null row = enabled)"
    - "Fail-open on prefs lookup error: catch block defaults emailEnabled/inAppEnabled to true"

key-files:
  created:
    - platform/__tests__/webhook-email.test.ts (extended with 5 new NOTIF-12 test cases)
  modified:
    - platform/src/lib/notifications.ts
    - platform/src/app/api/webhooks/stripe/route.ts
    - platform/__tests__/notifications.test.ts

key-decisions:
  - "Preference check placed inside the per-recipient loop in notifyTaskEvent — each recipient has independent preferences"
  - "Stripe webhook user lookup restructured from .then({ data: user }) to .then(async ({ data: user }) to allow await on prefs lookup"
  - "Existing webhook-email.test.ts beforeEach blocks updated to mock notification_preferences with null (opt-out default)"
  - "Slack send in notifyTaskEvent intentionally not gated by preferences — Slack is org-level, not user-level"

patterns-established:
  - "Pattern 1: Before any email/in-app send, query notification_preferences with .maybeSingle() and apply prefs?.field !== false pattern"
  - "Pattern 2: TDD mock builders must include maybeSingle() method alongside single() for preference table support"

requirements-completed: [NOTIF-12]

duration: 5min
completed: 2026-03-26
---

# Phase 11 Plan 02: Preference Enforcement Summary

**Notification preference enforcement wired into notifyTaskEvent and Stripe webhook using opt-out model (.maybeSingle() + null-safe check), with 9 new TDD tests covering all send paths**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-26T02:49:19Z
- **Completed:** 2026-03-26T02:53:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- notifyTaskEvent now checks notification_preferences per recipient before sending email or inserting in-app notification row
- Stripe webhook (invoice.paid and invoice.payment_failed) checks notification_preferences before sending payment emails and creating payment notifications
- Opt-out model correctly implemented in both send sites: null row = all channels enabled, no INSERT on first visit
- 4 new test cases in notifications.test.ts (email disabled, in-app disabled, no row opt-out, both enabled)
- 5 new test cases in webhook-email.test.ts (paid email disabled, paid in-app disabled, paid opt-out, failed email disabled, failed opt-out)
- All 28 total tests pass across both test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Add preference enforcement to notifyTaskEvent with tests** - `eab610c` (feat)
2. **Task 2: Add preference enforcement to Stripe webhook handler with tests** - `0031388` (feat)

_Note: TDD tasks — RED (failing tests added) then GREEN (implementation) combined in single commit per task_

## Files Created/Modified

- `platform/src/lib/notifications.ts` - Added preference lookup per recipient inside for loop; wraps sendEmail and createNotification with emailEnabled/inAppEnabled guards
- `platform/src/app/api/webhooks/stripe/route.ts` - Restructured both invoice.paid and invoice.payment_failed user lookup blocks to async, added preference lookup before sending
- `platform/__tests__/notifications.test.ts` - Added maybeSingle to mock builder chain; added 4 NOTIF-12 preference enforcement test cases
- `platform/__tests__/webhook-email.test.ts` - Added notification_preferences mock to all 3 existing beforeEach blocks; added 5 NOTIF-12 preference enforcement test cases across 2 new describe blocks

## Decisions Made

- Preference check placed inside the per-recipient loop in notifyTaskEvent — each recipient has independent preferences, so per-recipient lookup is correct
- Stripe webhook user lookup restructured from fire-and-forget `.then({ data: user })` to `.then(async ({ data: user })` to allow `await` on the prefs lookup while preserving the existing non-blocking fire-and-forget pattern
- Existing webhook-email.test.ts beforeEach blocks updated to mock notification_preferences returning null (opt-out default), so existing tests continue to exercise the send path
- Slack send in notifyTaskEvent intentionally not gated by preferences — Slack is org-level, not user-level (per CONTEXT.md deferred items)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing webhook-email.test.ts beforeEach blocks to mock notification_preferences**
- **Found during:** Task 2 (GREEN phase — after modifying route.ts)
- **Issue:** Modifying route.ts to call `.from('notification_preferences').select().eq().maybeSingle()` broke 7 existing tests because the existing mockFrom implementations didn't handle that table (returned default object without chained methods)
- **Fix:** Added `notification_preferences` handler returning `{ data: null, error: null }` to all 3 existing `beforeEach` mockFrom implementations (invoice.paid US, invoice.paid LATAM, invoice.payment_failed)
- **Files modified:** platform/__tests__/webhook-email.test.ts
- **Verification:** All 14 webhook-email tests pass after fix
- **Committed in:** 0031388 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test mocks)
**Impact on plan:** Required fix — test infrastructure needed updating to reflect new preference query in production code. No scope creep.

## Issues Encountered

None — the test mock update was anticipated by the plan's note about `buildMockFromWithPrefs` helper pattern, applied consistently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- NOTIF-12 fully implemented: both notifyTaskEvent and Stripe webhook respect user notification preferences
- Plan 03 (weekly digest) can now also apply the same opt-out model pattern for the digest send site
- No blockers

## Self-Check: PASSED

- FOUND: platform/src/lib/notifications.ts
- FOUND: platform/src/app/api/webhooks/stripe/route.ts
- FOUND: platform/__tests__/notifications.test.ts
- FOUND: platform/__tests__/webhook-email.test.ts
- FOUND: .planning/phases/11-notification-polish/11-02-SUMMARY.md
- FOUND: commit eab610c (Task 1)
- FOUND: commit 0031388 (Task 2)
- FOUND: commit 1c2b5eb (docs/metadata)

---
*Phase: 11-notification-polish*
*Completed: 2026-03-26*
