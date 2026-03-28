---
phase: 16-test-coverage
verified: 2026-03-27T16:30:00Z
status: gaps_found
score: 8/9 must-haves verified
re_verification: false
gaps:
  - truth: "Playwright visual project runs against 6 authenticated pages and captures baseline screenshots"
    status: failed
    reason: "No baseline PNG files exist anywhere in the repository. The screenshots directory does not exist. The CI workflow runs --project=visual without --update-snapshots, meaning the first CI run will fail with 'snapshot does not exist' errors."
    artifacts:
      - path: "platform/e2e/screenshots/"
        issue: "Directory does not exist. Zero baseline PNG files committed."
    missing:
      - "Run `npx playwright test --project=visual --update-snapshots` against a running dev server (or CI Linux environment) and commit the 6 generated PNG files to platform/e2e/screenshots/"
      - "Alternatively, add --update-snapshots to the first CI run of test.yml, let CI generate baselines, commit the output, then revert to standard command"
      - "Confirm that the platform/e2e/fixtures/test.png (69 bytes) is not being mistaken for a visual baseline — it is a test fixture for attachment tests, not a Playwright screenshot"
human_verification:
  - test: "Run visual regression CI job end-to-end"
    expected: "Both integration and visual-regression jobs pass green on a PR to main"
    why_human: "Cannot verify CI job success programmatically without triggering a real GitHub Actions run; baseline generation requires a live authenticated Supabase session"
---

# Phase 16: Test Coverage Verification Report

**Phase Goal:** All API routes have integration tests that run in CI, and Playwright visual regression baselines exist for all portal and admin pages
**Verified:** 2026-03-27T16:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                        | Status      | Evidence                                                                                        |
|----|--------------------------------------------------------------------------------------------------------------|-------------|-------------------------------------------------------------------------------------------------|
| 1  | POST /api/checkout returns 200 with a checkout URL when a Stripe customer already exists                     | VERIFIED   | `checkout.test.ts` line 105: `it("returns 200 with checkout URL when customer exists"...`      |
| 2  | POST /api/checkout creates a new Stripe customer and returns 200 when no customer exists                     | VERIFIED   | `checkout.test.ts` line 138: `it("creates Stripe customer when none exists and returns 200"...` |
| 3  | POST /api/billing-portal returns 200 with a billing portal URL when a Stripe customer exists                 | VERIFIED   | `billing-portal.test.ts` line 72: `it("returns 200 with billing portal URL when customer exists"` |
| 4  | POST /api/billing-portal returns 400 with error message when no Stripe customer exists                       | VERIFIED   | `billing-portal.test.ts` line 101: `expect(json.error).toBe("No Stripe customer found")`      |
| 5  | Both route tests run with zero real DB calls and zero real Stripe API calls                                  | VERIFIED   | All three libs mocked via `vi.mock('@/lib/supabase/server')`, `vi.mock('@/lib/stripe')`, `vi.mock('@/lib/rate-limit')` |
| 6  | All 4 webhook event branches return `{ received: true }` with status 200 and correct Supabase mutations     | VERIFIED   | `webhook-stripe.test.ts`: 6 tests covering upsert/insert/update on all 4 branches + invalid sig |
| 7  | Playwright visual project runs against 6 authenticated pages and captures baseline screenshots               | FAILED     | Visual project configured, spec exists with 6 tests, but zero PNG baselines exist anywhere in repo |
| 8  | CI workflow runs integration tests (Vitest) and visual regression tests (Playwright) in parallel jobs        | VERIFIED   | `.github/workflows/test.yml`: `integration` and `visual-regression` jobs with no `needs:` dependency |
| 9  | Portal and admin pages all have visual baselines (portal dashboard, task list, settings, admin overview, admin billing, admin users) | FAILED | `platform/e2e/screenshots/` directory does not exist; no committed PNGs |

**Score:** 7/9 truths verified (Truths 7 and 9 represent the same root gap — missing baselines)

---

### Required Artifacts

| Artifact                                               | Expected                                      | Min Lines | Actual Lines | Status       | Details                                                  |
|--------------------------------------------------------|-----------------------------------------------|-----------|--------------|--------------|----------------------------------------------------------|
| `platform/__tests__/api/checkout.test.ts`             | Checkout route integration tests              | 60        | 262          | VERIFIED    | 4 test cases; proper vi.mock declarations; NTARH wiring  |
| `platform/__tests__/api/billing-portal.test.ts`       | Billing portal route integration tests        | 50        | 155          | VERIFIED    | 3 test cases; vi.mock; NTARH imports `billing-portal/route` |
| `platform/__tests__/api/webhook-stripe.test.ts`       | Stripe webhook integration tests (4 branches) | 120       | 321          | VERIFIED    | 6 test cases (checkout, skip-guard, invoice.paid, invoice.payment_failed, subscription.deleted, invalid sig) |
| `platform/e2e/visual-regression.spec.ts`              | Visual regression tests for 6 pages          | 40        | 79           | VERIFIED    | 6 test calls; maskDynamicContent helper; maxDiffPixelRatio: 0.01; waitForLoadState |
| `.github/workflows/test.yml`                           | CI workflow with integration and visual-regression jobs | 30 | 49     | VERIFIED    | 2 parallel jobs; npm run test:run; npx playwright test --project=visual |
| `platform/e2e/screenshots/*.png`                       | Baseline PNG screenshots for all 6 pages     | —         | 0 files      | MISSING     | Directory does not exist; no baselines committed          |

---

### Key Link Verification

| From                                               | To                                                | Via                                    | Status    | Details                                                                                    |
|----------------------------------------------------|---------------------------------------------------|----------------------------------------|-----------|--------------------------------------------------------------------------------------------|
| `platform/__tests__/api/checkout.test.ts`         | `platform/src/app/api/checkout/route.ts`          | NTARH testApiHandler appHandler import | WIRED    | Line 40: `import * as appHandler from "@/app/api/checkout/route"`; route.ts exists         |
| `platform/__tests__/api/billing-portal.test.ts`   | `platform/src/app/api/billing-portal/route.ts`    | NTARH testApiHandler appHandler import | WIRED    | Line 37: `import * as appHandler from "@/app/api/billing-portal/route"`; route.ts exists   |
| `platform/__tests__/api/webhook-stripe.test.ts`   | `platform/src/app/api/webhooks/stripe/route.ts`   | NTARH testApiHandler appHandler import | WIRED    | Line 38: `import * as appHandler from "@/app/api/webhooks/stripe/route"`; route.ts exists  |
| `platform/playwright.config.ts`                   | `platform/e2e/visual-regression.spec.ts`          | visual project testMatch               | WIRED    | Line 36: `testMatch: /visual-regression\.spec\.ts/`                                        |
| `.github/workflows/test.yml`                       | `platform/package.json`                           | npm run test:run                       | WIRED    | test:run script confirmed at package.json line 25: `"test:run": "vitest run"`              |
| `platform/e2e/visual-regression.spec.ts`           | `platform/e2e/auth.setup.ts`                      | storageState from setup project dep    | WIRED    | playwright.config.ts visual project: `storageState: "playwright/.auth/user.json"`, `dependencies: ["setup"]`; auth.setup.ts writes to that path |
| `platform/e2e/visual-regression.spec.ts`           | `platform/e2e/screenshots/`                       | toHaveScreenshot baseline PNG files   | NOT_WIRED | spec references PNG names but directory does not exist; no committed baselines              |

---

### Requirements Coverage

| Requirement | Source Plans   | Description                                                                     | Status    | Evidence                                                                                              |
|-------------|----------------|---------------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------|
| TEST-10     | 16-01, 16-02, 16-03 | Integration tests cover API routes (checkout, billing-portal, webhook) using NTARH + MSW | SATISFIED | 3 test files with 13 total test cases; NTARH + MSW in devDependencies; all routes mocked; CI runs `npm run test:run` |
| TEST-11     | 16-03          | Playwright visual regression baselines for portal and admin pages (CI-generated) | BLOCKED  | Spec and Playwright config are correct; CI workflow correctly structured; but zero baseline PNGs committed — first CI `visual-regression` job will fail |

Both TEST-10 and TEST-11 appear in REQUIREMENTS.md at lines 48-49. No orphaned requirements found.

---

### Anti-Patterns Found

| File                                               | Line | Pattern                | Severity | Impact                                                                   |
|----------------------------------------------------|------|------------------------|----------|--------------------------------------------------------------------------|
| `.github/workflows/test.yml`                       | 44   | `npx playwright test --project=visual` without `--update-snapshots` on first run | Warning | First CI execution will fail because no baselines exist; requires manual intervention to seed baselines before CI can be green |

No TODO/FIXME/placeholder comments found in any of the 5 key files. No `return null` or `return []` stub patterns in any test file. All test implementations are substantive with real assertions.

---

### Human Verification Required

#### 1. CI Green on First Run

**Test:** Trigger a pull request against main after committing baseline PNGs to verify both `integration` and `visual-regression` CI jobs pass.
**Expected:** Both jobs complete green; integration job shows all Vitest tests passing; visual-regression job shows 6 Playwright visual tests passing with no screenshot diff failures.
**Why human:** Requires a real GitHub Actions execution with live Supabase credentials. Cannot verify programmatically without triggering the run.

---

### Gaps Summary

**Root cause:** One gap blocks the phase goal. The Playwright visual regression infrastructure is fully and correctly implemented (config, spec file, CI workflow), but no baseline PNG screenshots have been committed to the repository. The `platform/e2e/screenshots/` directory does not exist.

The SUMMARY for plan 03 explicitly acknowledges this: "Dev server not running prevented local baseline generation... baselines will be generated on first CI run." However, the CI workflow does not use `--update-snapshots`, so the first CI run of `visual-regression` will fail with "snapshot does not exist" errors rather than generating baselines.

**Impact on phase goal:** The requirement is "Playwright visual regression baselines exist for all portal and admin pages." The word "exist" is the operative criterion. The spec and tooling are correct — but baselines do not exist, meaning CI cannot pass the visual regression job and the goal is not yet achieved.

**What is NOT a gap:**
- Integration tests (TEST-10): fully complete. All 3 API route test files exist, are substantive, and are correctly wired to the actual route handlers. 13 test cases cover all required branches.
- CI workflow structure: correct. Two parallel jobs, correct commands, correct secrets wiring, artifact upload on failure.
- Playwright configuration: correct. Visual project added at end, snapshotPathTemplate set, storageState and setup dependency wired.

**What needs to happen to close the gap:**
1. Generate baselines: run `npx playwright test --project=visual --update-snapshots` against a running dev server authenticated to a Supabase dev instance, OR temporarily add `--update-snapshots` to the CI workflow, trigger a run, and commit the generated PNGs.
2. Commit the 6 PNG files in `platform/e2e/screenshots/` to the repository.
3. Revert the CI workflow to the standard command (if step 1 used the CI approach).

---

_Verified: 2026-03-27T16:30:00Z_
_Verifier: Claude (gsd-verifier)_
