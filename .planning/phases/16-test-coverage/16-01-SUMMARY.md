---
phase: 16-test-coverage
plan: 01
subsystem: testing
tags: [vitest, ntarh, next-test-api-route-handler, msw, stripe, supabase, integration-tests]

# Dependency graph
requires:
  - phase: 10-security-foundation
    provides: Rate limiting middleware (rateLimit, rateLimitResponse, rateLimitHeaders) used in tested routes
  - phase: 15-security-hardening
    provides: API routes checkout and billing-portal that are now tested
provides:
  - Integration tests for POST /api/checkout route (4 tests)
  - Integration tests for POST /api/billing-portal route (3 tests)
  - NTARH (next-test-api-route-handler) installed as devDependency
  - MSW installed as devDependency
affects: [16-02-visual-regression, launch]

# Tech tracking
tech-stack:
  added: [next-test-api-route-handler@5.0.4, msw]
  patterns: [NTARH testApiHandler with vi.mock for zero-network API route integration tests, per-table mockImplementation for multi-call Supabase chains]

key-files:
  created:
    - platform/__tests__/api/checkout.test.ts
    - platform/__tests__/api/billing-portal.test.ts
  modified:
    - platform/package.json

key-decisions:
  - "NTARH v5 testApiHandler appHandler pattern chosen for Next.js App Router route testing without real HTTP server"
  - "vi.mock declarations placed strictly before route imports - required for Vitest hoisting to work correctly"
  - "next/headers NOT re-mocked in test files - NTARH handles internally; createServerSupabase already mocked at module level so cookies() never called"
  - "per-table mockImplementation using callCount for multi-step Supabase chains (subscriptions->clients->subscriptions update flow)"

patterns-established:
  - "API route test pattern: vi.mock declarations at top, imports after, beforeEach resets all mocks + sets auth user, per-test createServiceClient mock"
  - "Rate limit test pattern: override rateLimit+rateLimitResponse with mockResolvedValueOnce/mockReturnValueOnce in each test"

requirements-completed: [TEST-10]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 16 Plan 01: Test Coverage - API Integration Tests Summary

**NTARH-based integration tests for checkout and billing-portal API routes with zero real DB/Stripe calls via vi.mock (7 tests, 2 files)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T14:12:08Z
- **Completed:** 2026-03-27T14:18:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Installed `next-test-api-route-handler` v5.0.4 and `msw` as devDependencies
- Created 4-test suite for POST /api/checkout: existing customer returns 200, new customer creation returns 200 with Stripe customer.create assertion, malformed body returns 400, rate-limited returns 429
- Created 3-test suite for POST /api/billing-portal: existing customer returns 200 with portal URL, no customer returns 400 with "No Stripe customer found", rate-limited returns 429

## Task Commits

Each task was committed atomically:

1. **Task 1: Install NTARH+MSW and create checkout integration test** - `68fd997` (feat)
2. **Task 2: Create billing-portal integration test** - `6de6845` (feat)

## Files Created/Modified

- `platform/__tests__/api/checkout.test.ts` - 4 integration tests for POST /api/checkout using NTARH + vi.mock
- `platform/__tests__/api/billing-portal.test.ts` - 3 integration tests for POST /api/billing-portal using NTARH + vi.mock
- `platform/package.json` - Added next-test-api-route-handler and msw as devDependencies

## Decisions Made

- NTARH `testApiHandler` with `appHandler` pattern used for Next.js App Router routes - no real HTTP server, no live network calls
- `vi.mock` declarations placed before all route imports (Vitest hoisting requirement)
- `next/headers` not re-mocked in test files - NTARH provides the mock environment; `createServerSupabase` is already mocked at module level so `cookies()` from `next/headers` is never reached
- Multi-step Supabase chains (subscriptions -> clients -> subscriptions update) handled via `callCount` variable inside `mockImplementation` per table name

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed dynamic `require()` call for rateLimitHeaders inside beforeEach**
- **Found during:** Task 1 (first vitest run)
- **Issue:** `require('@/lib/rate-limit')` inside beforeEach callback failed at runtime since the module is ESM and already mocked - produced "Cannot find module" error
- **Fix:** Added `rateLimitHeaders` to top-level import statement and removed the `require()` call; the vi.mocked() reference works correctly via the ESM import
- **Files modified:** platform/__tests__/api/checkout.test.ts
- **Verification:** All 4 tests passed after fix
- **Committed in:** 68fd997 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix required for ESM/CJS compatibility. No scope changes.

## Issues Encountered

None beyond the auto-fixed deviation above.

## Next Phase Readiness

- TEST-10 complete: checkout and billing-portal routes fully integration-tested with NTARH
- NTARH and MSW installed and confirmed working - pattern established for additional route tests in future plans
- Phase 16-02 (visual regression) can proceed independently

---
*Phase: 16-test-coverage*
*Completed: 2026-03-27*
