---
phase: 10-security-foundation
plan: 01
subsystem: api
tags: [upstash, redis, rate-limiting, sliding-window, security]

# Dependency graph
requires: []
provides:
  - Upstash Redis sliding-window rate limiting helper (rate-limit.ts)
  - All 6 non-webhook API routes protected with per-route rate limits
  - 8 unit tests covering success/failure/fail-open/identifier/response helpers
affects: [11-notification-preferences, 12-admin-user-management, 13-integration-tests]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit", "@upstash/redis"]
  patterns:
    - "Rate limit block outside try/catch — fail-open guarantees rl is always defined for response headers"
    - "window: '1 m' as const — satisfies Upstash Duration branded type from string literal"
    - "createServerSupabase() for user ID in rate limit identifier (not createServiceClient which has no session)"
    - "vi.hoisted() pattern for mock variables referenced in vi.mock() factory closures"
    - "Module-level ephemeralCache Map for cross-call warm instance optimization"

key-files:
  created:
    - platform/src/lib/rate-limit.ts
    - platform/__tests__/rate-limit.test.ts
  modified:
    - platform/src/app/api/checkout/route.ts
    - platform/src/app/api/billing-portal/route.ts
    - platform/src/app/api/tasks/route.ts
    - platform/src/app/api/tasks/[taskId]/route.ts
    - platform/src/app/api/tasks/[id]/status/route.ts
    - platform/src/app/api/tasks/[taskId]/comments/route.ts
    - platform/.env.local.example
    - platform/package.json

key-decisions:
  - "Rate limit block placed OUTSIDE try/catch so rl is guaranteed defined for rateLimitHeaders() in error responses"
  - "window: '1 m' as const required — TypeScript infers string from const object, Upstash Duration is a branded template literal type"
  - "createServerSupabase() (not createServiceClient()) used for user session — service client has empty cookies and no auth context"
  - "vi.hoisted() required for mockLimit variable referenced in Ratelimit class mock factory"
  - "Class-based mock (class MockRatelimit) used instead of vi.fn() factory — vitest warns when constructor mock doesn't use function/class"

patterns-established:
  - "RL_CONFIG as route-level const with as const on window prevents Duration type errors"
  - "getRateLimitIdentifier: user ID preferred, fallback to first X-Forwarded-For IP, fallback to ip:anonymous"
  - "All success and error responses include rateLimitHeaders(rl) for consistent quota visibility"

requirements-completed: [SEC-04, SEC-05]

# Metrics
duration: 7min
completed: 2026-03-26
---

# Phase 10 Plan 01: Security Foundation Summary

**Upstash Redis sliding-window rate limiting on all 6 API routes — 5 req/min for auth-adjacent, 20 req/min for task mutations, fail-open design, full header coverage**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T00:56:48Z
- **Completed:** 2026-03-26T01:03:41Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created `rate-limit.ts` helper with lazy Redis singleton, sliding window algorithm, fail-open error handling, and 4 exports: `rateLimit`, `getRateLimitIdentifier`, `rateLimitResponse`, `rateLimitHeaders`
- 8 unit tests passing (TDD — RED then GREEN): success, over-limit, fail-open, identifier priority/fallback/anonymous, 429 response shape, headers object
- All 6 API routes protected with route-specific prefixes and thresholds: checkout (5/min), billing-portal (5/min), tasks (20/min), tasks-update (20/min), tasks-status (20/min), tasks-comments (20/min)
- Stripe webhook route verified untouched (D-02 exemption)
- Upstash env vars documented in `.env.local.example`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create rate-limit helper library with unit tests (TDD)** - `3521853` (feat)
2. **Task 2: Integrate rate limiting into all API routes** - `9af6be7` (feat)

**Plan metadata:** _(docs commit — see below)_

_Note: Task 1 used TDD (test RED then implementation GREEN)._

## Files Created/Modified
- `platform/src/lib/rate-limit.ts` - Rate limiting helper: lazy Redis singleton, slidingWindow, fail-open, identifier extraction, 429 response builder, headers extractor
- `platform/__tests__/rate-limit.test.ts` - 8 unit tests covering all exported functions with vi.hoisted mock pattern
- `platform/src/app/api/checkout/route.ts` - Added 5 req/min rate limit (auth-adjacent)
- `platform/src/app/api/billing-portal/route.ts` - Added 5 req/min rate limit (auth-adjacent)
- `platform/src/app/api/tasks/route.ts` - Added 20 req/min rate limit (task mutation)
- `platform/src/app/api/tasks/[taskId]/route.ts` - Added 20 req/min rate limit (task mutation)
- `platform/src/app/api/tasks/[id]/status/route.ts` - Added 20 req/min rate limit (task mutation)
- `platform/src/app/api/tasks/[taskId]/comments/route.ts` - Added 20 req/min rate limit (task mutation)
- `platform/.env.local.example` - Added UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN documentation
- `platform/package.json` - Added @upstash/ratelimit and @upstash/redis dependencies

## Decisions Made
- Rate limit block placed outside try/catch so `rl` variable is always defined when adding `rateLimitHeaders(rl)` to error responses
- `window: '1 m' as const` required on all RL_CONFIG objects — TypeScript infers `string` from object literals, but Upstash expects `Duration` (branded template literal `${number} ${Unit}`)
- `createServerSupabase()` used for user session extraction (Pitfall 3: `createServiceClient()` has empty cookies and returns no auth user)
- `vi.hoisted()` + class-based mock (not vi.fn() factory) — vitest v4 warns when constructor mock doesn't use function/class syntax

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Duration type error in RateLimitConfig and all RL_CONFIG objects**
- **Found during:** Task 2 (TypeScript type check)
- **Issue:** `window: string` in RateLimitConfig and `window: "1 m"` inferred as `string` in route RL_CONFIG objects — Upstash `Ratelimit.slidingWindow` expects `Duration` (branded template literal), not plain `string`
- **Fix:** Changed `RateLimitConfig.window` from `string` to `Duration` (imported from `@upstash/ratelimit`), added `as const` to all 6 route RL_CONFIG window values
- **Files modified:** platform/src/lib/rate-limit.ts, all 6 route files
- **Verification:** `npx tsc --noEmit` shows no rate-limit related errors
- **Committed in:** `9af6be7` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed vi.fn() constructor mock incompatible with vitest v4**
- **Found during:** Task 1 (TDD RED/GREEN)
- **Issue:** Initial test used `vi.mock('@upstash/ratelimit', () => ({ Ratelimit: vi.fn().mockImplementation(() => ({ limit: mockLimit })) }))` — vitest v4 warns "mock did not use function or class" when mocking constructors with vi.fn(); mockLimit reference in factory also failed without vi.hoisted()
- **Fix:** Replaced with class-based mock (`class MockRatelimit { limit = mockLimit; ... }`), used vi.hoisted() for mockLimit to satisfy vi.mock() factory closure timing
- **Files modified:** platform/__tests__/rate-limit.test.ts
- **Verification:** All 8 tests pass with no vitest warnings
- **Committed in:** `3521853` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs fixed inline)
**Impact on plan:** Both fixes required for TypeScript correctness and test infrastructure compatibility. No scope creep.

## Issues Encountered
- Pre-existing TypeScript `never` type errors throughout the codebase (portal pages, webhook route, and existing API routes) — these are out-of-scope pre-existing issues caused by the Supabase Database type definition using placeholder types. Logged to deferred-items.md.

## User Setup Required
**External services require manual configuration.** Before deploying:
1. Create an [Upstash](https://console.upstash.com) Redis database
2. Copy REST URL and Token from the Redis dashboard
3. Add to `.env.local` (local) and Vercel environment variables (production):
   - `UPSTASH_REDIS_REST_URL=https://...`
   - `UPSTASH_REDIS_REST_TOKEN=...`
4. Verify: `curl -X POST /api/checkout` more than 5 times → should receive HTTP 429 with `Retry-After` header

## Next Phase Readiness
- Rate limiting foundation complete — all API routes protected, ready for v1.2 remaining phases
- No blockers for next phases (notification preferences, admin user management, etc.)
- Upstash free tier (10k requests/day) sufficient for current scale (<20 concurrent users)

---
*Phase: 10-security-foundation*
*Completed: 2026-03-26*
