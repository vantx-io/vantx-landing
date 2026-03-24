---
phase: 05-foundation
plan: 02
subsystem: testing
tags: [vitest, unit-tests, mocking, stripe, slack, onboard]
dependency_graph:
  requires: []
  provides: [vitest-infrastructure, supabase-mock, stripe-tests, slack-tests, onboard-tests]
  affects: [all-subsequent-phases]
tech_stack:
  added:
    - vitest@4.1.1
    - "@vitejs/plugin-react@6.0.1"
    - jsdom@29.0.1
    - "@testing-library/react@16.3.2"
    - "@testing-library/dom"
    - vite-tsconfig-paths@6.1.1
    - "@testing-library/jest-dom@6.9.1"
    - "@vitest/coverage-v8@4.1.1"
  patterns:
    - vi.mock() for module-level mocking
    - vi.stubEnv() for environment variable isolation
    - vi.stubGlobal('fetch', ...) for fetch-based API mocking
    - __mocks__ directory for automatic Vipabase client mock resolution
key_files:
  created:
    - platform/vitest.config.mts
    - platform/src/test/setup.ts
    - platform/src/lib/supabase/__mocks__/client.ts
    - platform/__tests__/stripe.test.ts
    - platform/__tests__/slack.test.ts
    - platform/__tests__/onboard.test.ts
  modified:
    - platform/package.json (added test, test:run, test:coverage scripts; installed 8 dev deps)
decisions:
  - "Vitest globals: true — avoids needing explicit describe/it imports in every test file"
  - "vi.stubEnv + vi.unstubAllEnvs pattern for env var isolation between tests"
  - "onboard.test.ts injects supabase as parameter (no module mock needed) — cleaner interface"
  - "provisionSlack called with (client, undefined, undefined) when Grafana skipped — test asserts exact undefined args not expect.anything()"
metrics:
  duration: 5m
  completed: "2026-03-24T22:54:45Z"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  tests_added: 32
---

# Phase 05 Plan 02: Vitest Unit Test Infrastructure Summary

Vitest 4.1.1 with Supabase manual mock factory, covering all critical business logic modules with 32 passing tests and zero live service dependencies.

## What Was Built

**Task 1: Vitest infrastructure**
- Installed 8 dev dependencies into `platform/package.json`
- Added `test`, `test:run`, `test:coverage` scripts
- Created `vitest.config.mts` with jsdom environment, `tsconfigPaths()` plugin (resolves `@/*` alias), react plugin, and `setupFiles`
- Created `src/test/setup.ts` with `@testing-library/jest-dom` matchers and `next/headers` mock (prevents server component import failures in unit test environment)
- Created `src/lib/supabase/__mocks__/client.ts` with `mockSupabase` object and `createClient()` factory — auto-resolved by Vitest's `__mocks__` directory convention

**Task 2: Unit test files (32 tests)**
- `stripe.test.ts` (15 tests): `getPriceId` across all plan/market/pilot combinations using `vi.stubEnv()`; `formatCurrency` for USD, MXN, defaults, and edge cases
- `slack.test.ts` (12 tests): `provisionSlack` with no-token skip path (verifies no `fetch` called); with-token success path; `name_taken` idempotency handling; and partial failure (welcome message fails but channel succeeded)
- `onboard.test.ts` (10 tests): full orchestration success; client-not-found failure; partial failure (Slack fails, k6 fails); Supabase update called with correct `grafana_org_id` and `slack_channel`; result propagation of `grafanaUrl` and `slackChannel`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] expect.anything() does not match undefined args in Vitest**
- **Found during:** Task 2, running tests
- **Issue:** `provisionSlack(client, grafanaUrl, faroSnippet)` is called with `(client, undefined, undefined)` when Grafana returns skipped steps. `expect.anything()` in Vitest does not match `undefined` — only non-null, non-undefined values.
- **Fix:** Changed assertion to `toHaveBeenCalledWith(expect.objectContaining({...}), undefined, undefined)` — explicitly asserts the undefined args.
- **Files modified:** `platform/__tests__/onboard.test.ts`
- **Commit:** b0d4ee8

## Known Stubs

None — all test assertions target real behavior. No placeholder data flows to any UI.

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (f458846, b0d4ee8) verified in git history. 32 tests pass with exit code 0.
