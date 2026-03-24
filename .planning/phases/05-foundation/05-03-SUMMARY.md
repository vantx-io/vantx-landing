---
phase: 05-foundation
plan: 03
subsystem: testing
tags: [playwright, e2e, github-actions, ci, i18n, auth-setup]

requires:
  - phase: 05-02
    provides: vitest-infrastructure, unit-tests — Playwright complements Vitest for E2E layer
provides:
  - playwright-e2e-infrastructure
  - auth-setup-storagestate-pattern
  - i18n-parity-check-script
  - github-actions-ci-workflow

affects: [all-subsequent-phases, ci-gating, pr-merges]

tech-stack:
  added:
    - "@playwright/test@^1.58.2"
    - chromium browser (via npx playwright install)
  patterns:
    - Playwright setup project pattern — auth.setup.ts runs once, storageState reused by all specs
    - i18n parity via flat leafKeys comparison — 10-line Node.js script, zero deps
    - 4-job CI pipeline — lint+typecheck gates all parallel downstream jobs

key-files:
  created:
    - platform/playwright.config.ts
    - platform/e2e/auth.setup.ts
    - platform/e2e/portal.spec.ts
    - platform/scripts/check-i18n.js
    - .github/workflows/ci.yml
  modified:
    - platform/package.json (added e2e, e2e:headed, check-i18n scripts)
    - platform/.gitignore (added playwright/.auth/, playwright-report/, test-results/)

key-decisions:
  - "Playwright setup project pattern chosen over per-test auth — runs once, reuses storageState"
  - "4-job CI with lint-and-typecheck as single gate for unit-tests, e2e-tests, i18n-check"
  - "E2E job uploads playwright-report artifact on failure for debugging"
  - "i18n-check job needs no npm ci — only node scripts/check-i18n.js (no dependencies)"

patterns-established:
  - "Pattern: Playwright setup project — auth.setup.ts saves storageState; chromium project declares dependencies: [setup]"
  - "Pattern: i18n leafKeys — flat key enumeration using flatMap recursion; compare Set membership"
  - "Pattern: CI workflow — working-directory: platform in defaults.run for all jobs"

requirements-completed: [TEST-05, TEST-09]

duration: 8m
completed: "2026-03-24"
---

# Phase 05 Plan 03: Playwright E2E and CI Pipeline Summary

Playwright E2E infrastructure with storageState auth helper, i18n key parity check script (153 keys, 0 drift), and 4-job GitHub Actions CI workflow gating all PRs on lint, type-check, unit tests, E2E, and i18n checks.

## Performance

- **Duration:** 8m
- **Started:** 2026-03-24T23:08:53Z
- **Completed:** 2026-03-24T23:16:53Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Playwright 1.58.2 installed with Chromium browser; config uses setup project pattern so login runs once and storageState is reused across all specs
- i18n parity script passes at 153 keys with exit code 0; will exit 1 on any future EN/ES key drift
- GitHub Actions CI workflow with 4 jobs: `lint-and-typecheck` gates `unit-tests`, `e2e-tests`, and `i18n-check` — all run on PR and push to main

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Playwright and create E2E test infrastructure with auth helpers** - `2524a27` (feat)
2. **Task 2: Create i18n parity check script and GitHub Actions CI workflow** - `e31a83e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `platform/playwright.config.ts` — Playwright config with setup project, webServer (reuses existing on local), storageState path
- `platform/e2e/auth.setup.ts` — Logs in via `/en/login`, waits for portal redirect, saves session to `playwright/.auth/user.json`
- `platform/e2e/portal.spec.ts` — Smoke test: authenticated user reaches `/en/portal` without "Sign in" prompt
- `platform/scripts/check-i18n.js` — Recursively flattens EN/ES JSON to leaf keys, compares sets, exits 1 on mismatch
- `.github/workflows/ci.yml` — 4-job CI: lint+typecheck → (unit-tests, e2e-tests, i18n-check) in parallel
- `platform/package.json` — Added `e2e`, `e2e:headed`, `check-i18n` scripts
- `platform/.gitignore` — Added `playwright/.auth/`, `playwright-report/`, `test-results/`

## Decisions Made

- Playwright setup project pattern over per-test login fixtures — runs auth once, shares storageState; standard Playwright recommendation
- `lint-and-typecheck` as the single sequential gate before all parallel test jobs — fastest total CI time while ensuring no broken code runs tests
- E2E job uploads `playwright-report` artifact on failure so failures are debuggable in GitHub Actions UI
- `i18n-check` job skips `npm ci` (no node_modules needed for a plain `require()` script) — fastest job in the pipeline

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**GitHub Actions secrets required before E2E tests pass in CI:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `E2E_EMAIL` — demo user email (e.g. `juan@novapay.com`)
- `E2E_PASSWORD` — demo user password (e.g. `demo2026`)

E2E tests run locally with `npm run e2e` using the fallback demo credentials in `auth.setup.ts`.

## Known Stubs

None — no placeholder data, no hardcoded empty values flowing to UI.

## Next Phase Readiness

- Full test pipeline ready: `npm test -- --run` (unit), `npx playwright test` (E2E), `node scripts/check-i18n.js` (i18n)
- CI gates PR merges from this point forward
- Phase 05 is complete — all 3 plans (01: DB migrations, 02: Vitest unit tests, 03: Playwright + CI) delivered

---
*Phase: 05-foundation*
*Completed: 2026-03-24*
