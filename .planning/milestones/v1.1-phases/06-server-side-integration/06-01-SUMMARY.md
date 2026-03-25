---
phase: 06-server-side-integration
plan: 01
subsystem: payments
tags: [resend, react-email, stripe, webhooks, notifications, email, bilingual]

# Dependency graph
requires:
  - phase: 05-foundation
    provides: Vitest test infrastructure, Supabase schema with notifications table, Stripe webhook route base

provides:
  - sendEmail() Resend wrapper with Vantx from address and fire-and-forget safe return
  - createNotification() helper for inserting notification rows into Supabase
  - PaymentSuccessEmail bilingual React Email template (EN/ES)
  - PaymentFailedEmail bilingual React Email template (EN/ES)
  - Stripe webhook invoice.paid handler extended with email + notification dispatch
  - Stripe webhook invoice.payment_failed handler extended with email + notification dispatch

affects:
  - 06-02 (task notifications plan will reuse sendEmail and createNotification helpers)

# Tech tracking
tech-stack:
  added:
    - resend@6.9.4 (transactional email SDK)
    - "@react-email/components@1.0.10" (React Email component primitives)
    - "@react-email/render@2.0.4" (server-side HTML rendering from React)
  patterns:
    - Fire-and-forget email dispatch with .catch(err => console.error(...)) — no webhook blocking
    - Lazy Resend instantiation per call (no singleton) — avoids env stub issues in tests
    - Bilingual copy object pattern: locale drives copy selection inline in component
    - vi.hoisted() for variables referenced inside vi.mock() factory functions
    - vi.clearAllMocks() in beforeEach for webhook test isolation

key-files:
  created:
    - platform/src/lib/email.ts
    - platform/src/lib/notifications.ts
    - platform/src/lib/emails/PaymentSuccessEmail.tsx
    - platform/src/lib/emails/PaymentFailedEmail.tsx
    - platform/__tests__/email.test.ts
    - platform/__tests__/webhook-email.test.ts
  modified:
    - platform/src/app/api/webhooks/stripe/route.ts
    - platform/next.config.js
    - platform/vitest.config.mts
    - platform/package.json

key-decisions:
  - "Resend instantiated per sendEmail() call (no module-level singleton) — simpler test isolation via vi.stubEnv, no shared state"
  - "Email locale driven by client.market field (LATAM=es, else en) — consistent with D-09"
  - "Notification row inserted for client-role user only (not admin/engineer/seller) — per D-10/D-13"
  - "@react-email/render HTML-encodes apostrophes as &#x27; — test assertions check for encoded form"
  - "vitest.config.mts exclude e2e/ to prevent Playwright spec pickup by vitest runner"

patterns-established:
  - "Fire-and-forget pattern: sendEmail().catch() + supabase.then().catch() — webhook returns 200 immediately"
  - "Bilingual React Email: single component with locale prop driving inline copy object selection"
  - "vi.hoisted() + vi.mock() factory for shared mock variables in webhook tests"

requirements-completed: [NOTIF-05, NOTIF-06]

# Metrics
duration: 10min
completed: 2026-03-25
---

# Phase 6 Plan 1: Email Infrastructure Summary

**Resend + React Email payment pipeline: bilingual payment success/failure emails via Stripe webhook with matching in-app notification rows, all fire-and-forget**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-25T02:02:17Z
- **Completed:** 2026-03-25T02:12:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `sendEmail()` Resend wrapper with `Vantx <hello@vantx.io>` from address, graceful no-key skip, structured `{ id } | { error }` return
- `createNotification()` Supabase helper for inserting notification rows with correct column mapping
- Two bilingual React Email templates (PaymentSuccessEmail, PaymentFailedEmail) with EN/ES copy driven by locale prop
- Stripe webhook extended: `invoice.paid` and `invoice.payment_failed` now dispatch email + notification row fire-and-forget
- 50 unit tests passing (18 new: 9 email helper/template tests + 9 webhook-email integration tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Email helper, notification helper, payment email templates** - `76987b7` (feat)
2. **Task 2: Extend Stripe webhook for payment email + notification dispatch** - `9fe0dd4` (feat)

## Files Created/Modified

- `platform/src/lib/email.ts` — Resend sendEmail() wrapper with no-key guard and fire-and-forget safe return
- `platform/src/lib/notifications.ts` — createNotification() for inserting notification rows into Supabase
- `platform/src/lib/emails/PaymentSuccessEmail.tsx` — Bilingual payment success React Email template
- `platform/src/lib/emails/PaymentFailedEmail.tsx` — Bilingual payment failed React Email template
- `platform/__tests__/email.test.ts` — Unit tests for email helper, notification helper, and both templates
- `platform/__tests__/webhook-email.test.ts` — Integration tests for webhook email/notification dispatch
- `platform/src/app/api/webhooks/stripe/route.ts` — Extended with email + notification fire-and-forget in invoice.paid and invoice.payment_failed
- `platform/next.config.js` — Added serverComponentsExternalPackages for @react-email to prevent Next.js 14 build failures
- `platform/vitest.config.mts` — Added e2e/ exclude to prevent Playwright spec pickup

## Decisions Made

- **No Resend singleton**: Resend is instantiated per call rather than as a module-level singleton. This simplifies test isolation via `vi.stubEnv` — no need to reset module cache between tests.
- **Locale from client.market**: `client.market === 'LATAM'` maps to `'es'`, everything else maps to `'en'`. Aligns with D-09.
- **Notification for client-role user only**: The user lookup filters `.eq('role', 'client')` — notifications go to the client portal user, not to internal admin/engineer/seller users.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Resend class mock needed `vi.hoisted()` to work with `new Resend()`**
- **Found during:** Task 1 (email.test.ts RED phase)
- **Issue:** `vi.fn().mockImplementation(...)` is not a constructor; `new Resend()` threw `TypeError: not a constructor`
- **Fix:** Changed mock to `class MockResend { emails = { send: mockSend }; constructor() {} }` inside `vi.mock()` factory
- **Files modified:** `platform/__tests__/email.test.ts`
- **Verification:** 9/9 email tests pass
- **Committed in:** 76987b7 (Task 1 commit)

**2. [Rule 1 - Bug] `@react-email/render` encodes apostrophes as `&#x27;` in HTML output**
- **Found during:** Task 1 (PaymentFailedEmail test)
- **Issue:** Template body `"couldn't process"` renders as `couldn&#x27;t process` — literal apostrophe check failed
- **Fix:** Updated test assertion to check for `&#x27;` encoded form (`html.includes("couldn&#x27;t process")`)
- **Files modified:** `platform/__tests__/email.test.ts`
- **Verification:** Test passes, encoding behavior documented in comment
- **Committed in:** 76987b7 (Task 1 commit)

**3. [Rule 3 - Blocking] `vi.hoisted()` required for mock variables referenced in `vi.mock()` factories**
- **Found during:** Task 2 (webhook-email.test.ts)
- **Issue:** `mockConstructEvent` declared with `const` before `vi.mock()` call — `vi.mock` is hoisted before variable declaration, causing `ReferenceError: Cannot access before initialization`
- **Fix:** Wrapped shared mock variables in `vi.hoisted(() => { ... })` call
- **Files modified:** `platform/__tests__/webhook-email.test.ts`
- **Verification:** 9/9 webhook-email tests pass
- **Committed in:** 9fe0dd4 (Task 2 commit)

**4. [Rule 1 - Bug] `e2e/portal.spec.ts` (Playwright) was being picked up by vitest runner**
- **Found during:** Task 2 overall verification (`vitest run` suite)
- **Issue:** vitest.config.mts had no `exclude` for e2e/ directory; Playwright's `test()` call threw `Playwright Test did not expect test() to be called here`
- **Fix:** Added `exclude: ['e2e/**', 'node_modules/**']` to vitest.config.mts
- **Files modified:** `platform/vitest.config.mts`
- **Verification:** `vitest run` exits 0 with 50/50 tests passing
- **Committed in:** 9fe0dd4 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 bug-pre-existing)
**Impact on plan:** All auto-fixes necessary for test correctness and CI reliability. No scope creep.

## Issues Encountered

- `@react-email/render` v2 API is async (returns Promise) — plan correctly specified `await render()`. No issue during implementation, works as expected.
- `formatCurrency` from `@/lib/stripe` includes currency symbol in formatted string (e.g., `$5,995.00`) — the template also receives `currency` as a separate prop, resulting in output like `USD $5,995.00`. This matches the plan's design for bilingual email body copy.

## User Setup Required

**External service configuration required before payment emails can be sent in production.**

Configure the following environment variable in `platform/.env.local`:

```
RESEND_API_KEY=re_xxxx  # Resend Dashboard → API Keys → Create API Key
```

Also verify in Resend Dashboard → Domains that `hello@vantx.io` is configured for sending.

Without `RESEND_API_KEY`, `sendEmail()` gracefully returns `{ error: 'RESEND_API_KEY not configured' }` — the webhook still returns 200 and the payment record is still inserted.

## Next Phase Readiness

- `sendEmail()` and `createNotification()` helpers are ready for reuse in task notification plans (Phase 6 Plan 2)
- Payment email pipeline is fully wired; Stripe webhook will dispatch emails once `RESEND_API_KEY` is set
- All 50 unit tests pass; CI pipeline will run these on each push

---
*Phase: 06-server-side-integration*
*Completed: 2026-03-25*

## Self-Check: PASSED

- FOUND: platform/src/lib/email.ts
- FOUND: platform/src/lib/notifications.ts
- FOUND: platform/src/lib/emails/PaymentSuccessEmail.tsx
- FOUND: platform/src/lib/emails/PaymentFailedEmail.tsx
- FOUND: platform/__tests__/email.test.ts
- FOUND: platform/__tests__/webhook-email.test.ts
- FOUND: .planning/phases/06-server-side-integration/06-01-SUMMARY.md
- FOUND commit: 76987b7 (Task 1)
- FOUND commit: 9fe0dd4 (Task 2)
