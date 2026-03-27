# Phase 16: Test Coverage - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

All API routes have integration tests that run in CI, and Playwright visual regression baselines exist for all portal and admin pages. Two deliverables: (1) integration tests for checkout, billing-portal, and Stripe webhook routes using NTARH + MSW with no real DB calls, and (2) Playwright visual regression baselines for 6 authenticated pages.

</domain>

<decisions>
## Implementation Decisions

### Integration Test Scope (TEST-10)
- **D-01:** Test exactly 3 API routes: `api/checkout`, `api/billing-portal`, `api/webhooks/stripe` — no admin routes (they're covered by auth + rate limiting + audit logging from prior phases, and the requirement specifically names only these 3)
- **D-02:** Use NTARH (next-test-api-route-handler) to invoke route handlers directly in Vitest — no HTTP server needed
- **D-03:** Use MSW to intercept Stripe API calls (checkout sessions, billing portal sessions). For webhook tests, mock `constructEvent` via `vi.mock` to return typed event objects
- **D-04:** Supabase mocked via `vi.mock` — same pattern as existing `__tests__/stripe.test.ts`. No real DB calls
- **D-05:** Stripe webhook tests must cover all 4 event branches: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- **D-06:** Each route test verifies: correct status code, response shape, and that the right Supabase mutations were called (e.g. `.upsert()`, `.update()`)
- **D-07:** Test file locations: `platform/__tests__/api/checkout.test.ts`, `platform/__tests__/api/billing-portal.test.ts`, `platform/__tests__/api/webhook-stripe.test.ts`
- **D-08:** Install `next-test-api-route-handler` and `msw` as devDependencies

### Visual Regression Baselines (TEST-11)
- **D-09:** Baseline exactly 6 pages (matches success criteria): portal dashboard (`/en/portal`), task list (`/en/portal/tasks`), settings (`/en/portal/settings`), admin overview (`/en/admin`), admin billing (`/en/admin/billing`), admin users (`/en/admin/users`)
- **D-10:** Desktop only — 1280x720 viewport. No mobile baselines (not in requirements)
- **D-11:** Dynamic data handling: seed deterministic test data via Playwright fixtures (same names, dates, amounts). Mask timestamps with `page.evaluate` to freeze visible dates before screenshot
- **D-12:** Use Playwright's `toHaveScreenshot()` with `maxDiffPixelRatio: 0.01` (1% tolerance) — catches real CSS changes, ignores anti-aliasing
- **D-13:** Screenshots committed to `platform/e2e/screenshots/` in repo. Intentional UI changes: developer runs `npx playwright test --update-snapshots` and commits new PNGs
- **D-14:** Single test file: `platform/e2e/visual-regression.spec.ts` using existing Playwright auth setup project
- **D-15:** Add a `visual` project to existing `playwright.config.ts` that depends on `setup` and only matches `visual-regression.spec.ts`

### CI Pipeline
- **D-16:** GitHub Actions workflow at `.github/workflows/test.yml`
- **D-17:** Two parallel jobs: `integration` (runs `npm run test:run` — Vitest with API route tests, no DB) and `visual-regression` (runs Playwright visual regression spec with dev server)
- **D-18:** Visual baselines committed to repo, not stored as CI artifacts. Diffs show up in PRs naturally
- **D-19:** Baseline update flow: run locally with `--update-snapshots` → commit new PNGs → PR shows diff

### Claude's Discretion
- MSW handler implementation details (exact request matchers, response shapes)
- Vitest setup file configuration for NTARH
- Playwright fixture design for deterministic data seeding
- GitHub Actions runner OS and Node version
- Whether to split webhook test into 4 separate `it()` blocks or use `it.each`

</decisions>

<specifics>
## Specific Ideas

- Webhook test should verify all 4 branches produce the expected Supabase mutations (upsert subscription, send email, create notification, update status)
- Visual regression should catch the scenario in success criteria #4: a deliberate CSS change causes test failure with diff image
- Existing `__tests__/stripe.test.ts` has the Supabase mocking pattern to follow

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API routes to test
- `platform/src/app/api/checkout/route.ts` — Stripe checkout session creation
- `platform/src/app/api/billing-portal/route.ts` — Stripe billing portal session creation
- `platform/src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler with 4 event branches

### Existing test patterns
- `platform/__tests__/stripe.test.ts` — Supabase mocking pattern (vi.mock) to replicate
- `platform/__tests__/notifications.test.ts` — Additional mocking examples
- `platform/e2e/login.spec.ts` — Playwright auth setup pattern
- `platform/e2e/portal.spec.ts` — Authenticated page navigation pattern

### Test config
- `platform/playwright.config.ts` — Existing Playwright config (add visual project here)
- `platform/package.json` — Existing test scripts and deps (add NTARH + MSW here)

### Pages for visual baselines
- `platform/src/app/[locale]/portal/page.tsx` — Portal dashboard
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Task list
- `platform/src/app/[locale]/portal/settings/page.tsx` — Settings
- `platform/src/app/[locale]/admin/page.tsx` — Admin overview (includes audit log section)
- `platform/src/app/[locale]/admin/billing/page.tsx` — Admin billing
- `platform/src/app/[locale]/admin/users/page.tsx` — Admin users

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `platform/__tests__/stripe.test.ts` — Supabase mock pattern with `vi.mock('@/lib/supabase/server')` returning chainable `.from().select().eq().single()` mocks
- `platform/e2e/login.spec.ts` + auth setup — Playwright auth state stored at `playwright/.auth/user.json`, reusable across visual regression specs
- Existing `playwright.config.ts` — Multi-project setup with setup dependencies, webServer config

### Established Patterns
- Vitest tests in `platform/__tests__/` — flat structure, `*.test.ts` naming
- E2E tests in `platform/e2e/` — `*.spec.ts` naming, project-based auth
- Supabase service client mocked per-test, not globally
- Route handlers export named functions (`POST`, `GET`) — NTARH can call these directly

### Integration Points
- `package.json` — add `msw` and `next-test-api-route-handler` as devDependencies
- `playwright.config.ts` — add `visual` project
- `.github/workflows/test.yml` — new CI workflow file
- `platform/__tests__/api/` — new subdirectory for API route integration tests
- `platform/e2e/visual-regression.spec.ts` — new visual regression spec
- `platform/e2e/screenshots/` — baseline screenshot directory (committed)

</code_context>

<deferred>
## Deferred Ideas

- Mobile viewport visual baselines — not in requirements, add when responsive testing needed
- Admin route integration tests (invite, role, status) — covered by auth + rate limit + audit, test if regressions appear
- Visual regression for Spanish locale pages — could add later for i18n parity
- Performance benchmarking in CI (Lighthouse) — separate concern
- E2E test for full Stripe checkout flow (requires Stripe test mode) — beyond integration scope

</deferred>

---

*Phase: 16-test-coverage*
*Context gathered: 2026-03-27*
