# Phase 16: Test Coverage - Research

**Researched:** 2026-03-27
**Domain:** Integration testing with NTARH + MSW + Vitest; Playwright visual regression
**Confidence:** HIGH

## Summary

Phase 16 has two fully independent deliverables. The first is integration tests for three API routes (`checkout`, `billing-portal`, `webhooks/stripe`) using `next-test-api-route-handler` (NTARH) v5 with `vi.mock` for Supabase and `vi.mock` for Stripe's `constructEvent`. No MSW server setup is actually needed — the Stripe API calls that matter in the route tests are either mocked at the Stripe module level (checkout, billing-portal use `getStripe()`) or bypassed entirely (webhook uses `constructEvent` which is mocked). MSW is most useful for the checkout/billing-portal routes where Stripe SDK makes outbound HTTPS calls, but given the project already uses `vi.mock` patterns pervasively, using `vi.mock('@/lib/stripe')` to stub `getStripe()` is the simpler and more consistent approach.

The second deliverable is Playwright visual regression baselines for 6 authenticated pages. The critical constraint from STATE.md is confirmed: **baselines must be generated in CI (Linux), not macOS**, due to font rendering differences. The `visual` Playwright project must depend on the `setup` project (for auth state) and match only `visual-regression.spec.ts`. Screenshots are committed to `platform/e2e/screenshots/` in the repo and managed via `snapshotPathTemplate`.

CI extends the existing `ci.yml` with two new jobs: `integration` (Vitest API route tests, no env vars needed) and `visual-regression` (Playwright with dev server, requires Supabase env secrets). The visual-regression job generates and diffs committed baselines — any CSS change causes a diff failure with a diff image automatically produced by Playwright.

**Primary recommendation:** Mock `getStripe()` via `vi.mock('@/lib/stripe')` to stub Stripe SDK calls; mock `createServiceClient()` and `createServerSupabase()` via `vi.mock('@/lib/supabase/server')` to eliminate all DB calls; mock `@/lib/rate-limit` to always return `{ success: true }`. Use NTARH's `testApiHandler({ appHandler, test })` pattern to invoke route handlers directly with real `NextRequest` objects.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Integration Test Scope (TEST-10)**
- D-01: Test exactly 3 API routes: `api/checkout`, `api/billing-portal`, `api/webhooks/stripe` — no admin routes
- D-02: Use NTARH to invoke route handlers directly in Vitest — no HTTP server needed
- D-03: Use MSW to intercept Stripe API calls (checkout sessions, billing portal sessions). For webhook tests, mock `constructEvent` via `vi.mock` to return typed event objects
- D-04: Supabase mocked via `vi.mock` — same pattern as existing `__tests__/stripe.test.ts`. No real DB calls
- D-05: Stripe webhook tests must cover all 4 event branches: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- D-06: Each route test verifies: correct status code, response shape, and that the right Supabase mutations were called
- D-07: Test file locations: `platform/__tests__/api/checkout.test.ts`, `platform/__tests__/api/billing-portal.test.ts`, `platform/__tests__/api/webhook-stripe.test.ts`
- D-08: Install `next-test-api-route-handler` and `msw` as devDependencies

**Visual Regression Baselines (TEST-11)**
- D-09: Baseline exactly 6 pages: portal dashboard, task list, settings, admin overview, admin billing, admin users
- D-10: Desktop only — 1280x720 viewport. No mobile baselines
- D-11: Dynamic data: seed deterministic test data via Playwright fixtures; mask timestamps via `page.evaluate` to freeze visible dates
- D-12: Use `toHaveScreenshot()` with `maxDiffPixelRatio: 0.01` (1% tolerance)
- D-13: Screenshots committed to `platform/e2e/screenshots/` in repo
- D-14: Single test file: `platform/e2e/visual-regression.spec.ts` using existing Playwright auth setup project
- D-15: Add a `visual` project to existing `playwright.config.ts` that depends on `setup` and only matches `visual-regression.spec.ts`

**CI Pipeline**
- D-16: GitHub Actions workflow at `.github/workflows/test.yml` (new file alongside existing `ci.yml`)
- D-17: Two parallel jobs: `integration` and `visual-regression`
- D-18: Visual baselines committed to repo, not stored as CI artifacts
- D-19: Baseline update flow: run locally with `--update-snapshots` → commit new PNGs → PR shows diff

### Claude's Discretion
- MSW handler implementation details (exact request matchers, response shapes)
- Vitest setup file configuration for NTARH
- Playwright fixture design for deterministic data seeding
- GitHub Actions runner OS and Node version
- Whether to split webhook test into 4 separate `it()` blocks or use `it.each`

### Deferred Ideas (OUT OF SCOPE)
- Mobile viewport visual baselines
- Admin route integration tests (invite, role, status)
- Visual regression for Spanish locale pages
- Performance benchmarking in CI (Lighthouse)
- E2E test for full Stripe checkout flow (requires Stripe test mode)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-10 | Integration tests cover API routes (checkout, billing-portal, webhook) using NTARH + MSW | NTARH v5 confirmed compatible with Next.js 14.2.x App Router. Mock layers identified: `@/lib/stripe`, `@/lib/supabase/server`, `@/lib/rate-limit`, `@/lib/onboard`, `@/lib/email`, `@/lib/notifications`. All 4 webhook event branches documented from actual route source. |
| TEST-11 | Playwright visual regression baselines for portal and admin pages (CI-generated) | Playwright 1.58.2 `toHaveScreenshot()` with `maxDiffPixelRatio` confirmed. `snapshotPathTemplate` pattern documented. Linux CI baseline requirement confirmed. Auth setup project reuse pattern verified from existing `playwright.config.ts`. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-test-api-route-handler | 5.0.4 | Invoke App Router handlers in Vitest with real NextRequest | Official Next.js testing recommendation; patches Next.js internals correctly; auto-tested against every Next.js release |
| msw | 2.12.14 | Mock Stripe HTTPS calls at network layer inside NTARH tests | Optional addition — vi.mock on getStripe() is sufficient given project mock style, but D-03 requires MSW installation |
| vitest | 4.1.1 (existing) | Test runner | Already installed |
| @playwright/test | 1.58.2 (existing) | Visual regression via toHaveScreenshot | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| msw/node setupServer | bundled with msw | Node.js process-level interception | Only needed if intercepting real HTTP from NTARH tests rather than mocking getStripe() at module level |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vi.mock for getStripe() | MSW server to intercept Stripe HTTPS | MSW is more realistic but adds setup complexity; vi.mock is consistent with existing project pattern and faster |
| it.each for webhook branches | 4 separate it() blocks | it.each reduces repetition; separate blocks are more readable for review; Claude's discretion |

**Installation:**
```bash
npm install --save-dev next-test-api-route-handler msw
```

**Version verification (confirmed 2026-03-27):**
- `next-test-api-route-handler`: 5.0.4 (latest)
- `msw`: 2.12.14 (latest stable)
- `@playwright/test`: 1.58.2 (already installed in package.json)

---

## Architecture Patterns

### Recommended Project Structure
```
platform/
├── __tests__/
│   ├── api/                          # New subdirectory (D-07)
│   │   ├── checkout.test.ts
│   │   ├── billing-portal.test.ts
│   │   └── webhook-stripe.test.ts
│   ├── stripe.test.ts                # Existing — reference for mock pattern
│   └── notifications.test.ts         # Existing — reference for mock pattern
├── e2e/
│   ├── visual-regression.spec.ts     # New (D-14)
│   ├── screenshots/                  # New — committed baselines (D-13)
│   │   ├── portal-dashboard-1-chromium-linux.png
│   │   ├── task-list-1-chromium-linux.png
│   │   └── ...
│   ├── auth.setup.ts                 # Existing — reused by visual project
│   └── portal.spec.ts                # Existing
└── playwright.config.ts              # Add visual project (D-15)
.github/workflows/
├── ci.yml                            # Existing — lint, unit, e2e, i18n
└── test.yml                          # New — integration + visual-regression (D-16)
```

### Pattern 1: NTARH App Router Test
**What:** `testApiHandler` wraps an imported route module and invokes it with a real NextRequest. All dependencies are mocked before the route module is imported.
**When to use:** Testing POST route handlers that use headers(), cookies(), rate-limiting, Supabase, or Stripe.

```typescript
// Source: NTARH v5 README — App Router Quick Start
import { testApiHandler } from 'next-test-api-route-handler'
import * as appHandler from '@/app/api/checkout/route'

it('returns 200 with url on valid request', async () => {
  await testApiHandler({
    appHandler,
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'client-001', priceId: 'price_test' }),
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.url).toMatch(/^https:\/\/checkout\.stripe\.com/)
    },
  })
})
```

### Pattern 2: Full Mock Stack for Checkout/Billing-Portal Routes
**What:** Three vi.mock calls cover every external dependency the route touches — Supabase service client, Supabase server client (for rate-limit user ID), rate-limit (always pass), and Stripe SDK.
**When to use:** checkout.test.ts and billing-portal.test.ts

```typescript
// vi.mock calls must appear before any imports of the route module
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
  createServerSupabase: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
  getRateLimitIdentifier: vi.fn().mockReturnValue('ip:test'),
  rateLimitResponse: vi.fn(),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
    customers: { create: vi.fn().mockResolvedValue({ id: 'cus_test' }) },
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } },
    billingPortal: { sessions: { create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }) } },
  }),
}))
```

### Pattern 3: Webhook Route — constructEvent Mock
**What:** `getStripe().webhooks.constructEvent` must be mocked to return a typed `Stripe.Event` without a real signature. The Supabase mock must handle the full chain: `.from().upsert()`, `.from().update()`, `.from().insert()`, `.from().select().eq().single()`.
**When to use:** webhook-stripe.test.ts for all 4 event branches.

```typescript
// Mock constructEvent to return a pre-built event object
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
    webhooks: {
      constructEvent: vi.fn(), // overridden per test with mockReturnValue
    },
  }),
  formatCurrency: vi.fn().mockReturnValue('$5,995.00'),
}))

// Also mock fire-and-forget side effects to prevent open handles
vi.mock('@/lib/onboard', () => ({ onboardClient: vi.fn().mockResolvedValue({ overall: 'ok', steps: [] }) }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn().mockResolvedValue({ id: 'mock' }) }))
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }))
```

### Pattern 4: Webhook Supabase Mock — Chainable Builder
**What:** The webhook route uses `.from()` for many different tables with different chain patterns: `.upsert()`, `.update().eq()`, `.insert()`, `.select().eq().single()`, `.select().eq().limit().single()`, `.select().eq().maybeSingle()`. The mock must handle all chains and expose spies.
**When to use:** webhook-stripe.test.ts — replicate the `buildMockSupabase` factory from notifications.test.ts.

```typescript
// Pattern from platform/__tests__/notifications.test.ts
// createServiceClient mock returns a mock supabase with spied .from()
import { createServiceClient } from '@/lib/supabase/server'

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const mockFrom = vi.fn().mockReturnValue({
  upsert: mockUpsert,
  insert: mockInsert,
  update: mockUpdate,
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { client_id: 'client-001' }, error: null }),
      limit: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'user-001' }, error: null }) }),
    }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
})
vi.mocked(createServiceClient).mockReturnValue({ from: mockFrom } as any)
```

### Pattern 5: Visual Regression Spec with Auth Reuse
**What:** Add a `visual` project to `playwright.config.ts` that depends on `setup` (auth) and only runs `visual-regression.spec.ts`. The spec navigates to each of 6 pages using the stored auth state and calls `toHaveScreenshot()`.
**When to use:** platform/e2e/visual-regression.spec.ts

```typescript
// playwright.config.ts addition
{
  name: 'visual',
  testMatch: /visual-regression\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 720 },
    storageState: 'playwright/.auth/user.json',
  },
  dependencies: ['setup'],
}
```

```typescript
// platform/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 720 } })

test('portal dashboard', async ({ page }) => {
  await page.goto('/en/portal')
  await page.waitForLoadState('networkidle')
  // Mask dynamic timestamps
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid="timestamp"]').forEach(el => {
      (el as HTMLElement).textContent = '2026-01-01'
    })
  })
  await expect(page).toHaveScreenshot('portal-dashboard.png', {
    maxDiffPixelRatio: 0.01,
    animations: 'disabled',
  })
})
```

### Pattern 6: snapshotPathTemplate for Committed Screenshots
**What:** Configure `snapshotPathTemplate` in `playwright.config.ts` to write baselines to `platform/e2e/screenshots/` rather than the default sibling-to-spec directory. This puts all PNGs in one known location for git tracking.
**When to use:** playwright.config.ts top-level config.

```typescript
// playwright.config.ts
export default defineConfig({
  snapshotPathTemplate: 'e2e/screenshots/{arg}{ext}',  // relative to testDir
  // ... rest of config
})
```

Note: Playwright's default snapshot naming includes platform in the filename (e.g., `portal-dashboard-chromium-linux.png`). This is correct behavior — do not suppress it. Baselines captured on Linux in CI will have `-linux` suffix.

### Pattern 7: CI — New test.yml Alongside Existing ci.yml
**What:** D-16 specifies a new `.github/workflows/test.yml` (not modifying the existing `ci.yml`). Two parallel jobs: `integration` runs Vitest API tests with no env vars; `visual-regression` runs Playwright visual spec with Supabase secrets and dev server.
**When to use:** .github/workflows/test.yml

```yaml
name: Test
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  integration:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: platform
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: platform/package-lock.json
      - run: npm ci
      - run: npm run test:run  # vitest run — includes new __tests__/api/ files

  visual-regression:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: platform
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      E2E_EMAIL: ${{ secrets.E2E_EMAIL }}
      E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: platform/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --project=visual
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-regression-diffs
          path: platform/playwright-report/
```

### Anti-Patterns to Avoid
- **Mocking `next/headers` in NTARH tests:** NTARH handles `next/headers` internally — do not re-mock `cookies()` in NTARH test files (the existing `src/test/setup.ts` global mock will conflict). Override with `requestPatcher` if needed.
- **Generating baselines on macOS:** macOS and Linux render fonts differently; baselines generated locally will fail CI. First baseline generation must happen in CI via `--update-snapshots` run on ubuntu-latest.
- **Leaving the `__tests__/api/` subdirectory outside Vitest exclude:** The vitest config already excludes `e2e/**` — `__tests__/api/` is inside `__tests__/` which is included by default. No config change needed.
- **Using `waitForTimeout` in visual regression:** Use `waitForLoadState('networkidle')` instead. `waitForTimeout` is non-deterministic under CI load.
- **Asserting on fire-and-forget paths in webhook tests:** The `invoice.paid` branch's email/notification sends happen in a `.then()` chain that is fire-and-forget. Tests must `await vi.runAllTimersAsync()` or spy on the Supabase `from` call to confirm the parent insert happened, but cannot reliably await the nested `.then` without restructuring. Document as known limitation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invoking Next.js App Router handlers in tests | express server, node-mocks-http, raw Request objects | next-test-api-route-handler | NTARH patches global fetch, cookies(), headers() the same way Next.js does — custom solutions miss these patches and create false-positive tests |
| Cross-platform screenshot comparison | Custom pixel-diff scripts | Playwright toHaveScreenshot | Built-in pixelmatch, diff image generation, threshold config, update flow |
| Network-level Stripe mock | fetch mock, nock | msw (if needed) or vi.mock on getStripe() | vi.mock is already the project pattern; MSW is installed per D-03 but module-level mocking is simpler and sufficient |

**Key insight:** NTARH's value is that it patches Next.js internals (global fetch, Request/Response, cookies, headers) exactly as production does. Any hand-rolled solution that skips this patching will pass tests that would fail in production.

---

## Common Pitfalls

### Pitfall 1: `next/headers` Cookie Mock Conflict
**What goes wrong:** The global `src/test/setup.ts` mocks `next/headers` for all tests. NTARH also patches `next/headers` internally. Conflicting mocks cause `cookies()` to return stale values or throw.
**Why it happens:** `setup.ts` runs before every test file. NTARH's internal patch happens when `testApiHandler` is called.
**How to avoid:** The checkout and billing-portal routes call `createServerSupabase()` which calls `cookies()`. Since `createServerSupabase` is mocked via `vi.mock('@/lib/supabase/server')`, cookies() is never actually called. The setup.ts mock stays harmless. Do not add an additional `vi.mock('next/headers')` in the API test files.
**Warning signs:** TypeScript error "Cannot read cookies()" or "cookies is not a function" in test output.

### Pitfall 2: Supabase Chain Completeness
**What goes wrong:** The webhook route uses deeply nested Supabase chains — `.from('subscriptions').select(...).eq(...).single()` and `.from('payments').insert(...)`. If any chain method is missing from the mock, the call returns `undefined` and the route throws.
**Why it happens:** The Supabase mock must be a complete chainable object. Missing `.limit()` or `.maybeSingle()` on a chain causes `undefined is not a function`.
**How to avoid:** Model the mock on `buildMockSupabase` from `notifications.test.ts`. Add `maybeSingle`, `limit`, and `upsert` to the base chain. Return `vi.fn().mockResolvedValue({ data: null, error: null })` as the default for unknown chains.
**Warning signs:** `TypeError: chain.X is not a function` in test output.

### Pitfall 3: Fire-and-Forget in invoice.paid and invoice.payment_failed
**What goes wrong:** The user lookup and notification/email sends in `invoice.paid` and `invoice.payment_failed` run in a `.then()` chain that is intentionally fire-and-forget. The route handler returns `{ received: true }` before these chains complete. Tests that try to assert on `sendEmail` or `createNotification` calls will see `toHaveBeenCalled` fail intermittently because the promise is still in flight.
**Why it happens:** The webhook route does `supabase.from('users').select(...).then(async ({ data: user }) => { ... }).catch(...)` — this is fire-and-forget by design.
**How to avoid:** Two strategies: (1) assert only on the synchronous mutations (`.insert()` into payments table) which complete before the response; (2) use `await vi.runAllTimersAsync()` after the fetch call but only if using fake timers. The simplest reliable assertion is `expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }))` for the payments insert, and accept that email/notification assertions are best-effort in unit tests.
**Warning signs:** Flaky test — passes on first run, fails on re-run, or vice versa.

### Pitfall 4: Linux vs macOS Baseline Mismatch
**What goes wrong:** Developer captures baselines locally (macOS, Retina display), commits them, CI fails on Linux with 15-40% pixel diff on text elements.
**Why it happens:** macOS and Linux render fonts with different subpixel anti-aliasing. Even at 1280x720 non-Retina, small text renders differently.
**How to avoid:** Never capture baselines on macOS. The canonical workflow: (a) run `npx playwright test --project=visual --update-snapshots` on ubuntu-latest CI (via `gh workflow run` or a dedicated PR), or (b) use Docker with `--platform=linux/amd64` locally. Once Linux baselines are committed, local macOS runs against them will likely show diffs — that is expected and acceptable for this project (CI is the gate, not local).
**Warning signs:** `maxDiffPixelRatio: 0.01` exceeded immediately on first CI run against locally-generated baselines.

### Pitfall 5: Dynamic Content in Visual Snapshots
**What goes wrong:** Pages show real timestamps, task counts, or subscription amounts that change between test runs. Every snapshot comparison fails with spurious diffs.
**Why it happens:** The portal dashboard, task list, and admin pages fetch live data from Supabase staging/production.
**How to avoid:** Two-part approach per D-11: (a) use Playwright `use.storageState` from the seeded test user (juan@novapay.com with deterministic demo data from `seed-demo.js`); (b) before each screenshot, use `page.evaluate` to freeze visible date strings and mask any non-deterministic numeric counters with `page.locator(...).evaluate(el => el.textContent = 'MASKED')`.
**Warning signs:** Diff images show text-only changes (numbers, dates) but layout is identical.

### Pitfall 6: NTARH Must Be Imported First
**What goes wrong:** If any import in the test file loads Next.js modules before `testApiHandler`, the NTARH patches are not applied and Next.js internals behave as if in production (failing without a real server).
**Why it happens:** NTARH patches `next/dist/server/app-render/work-unit-async-storage.external` and related modules on import. ES module hoisting via vi.mock() runs before any imports, so this is handled — but `testApiHandler` must appear in the first import line (before the route module import).
**Warning signs:** `Error: cookies() was called outside of a request handler` or similar Next.js invariant errors.

---

## Code Examples

### Complete checkout.test.ts Skeleton
```typescript
// Source: NTARH v5 README + existing project mock patterns
import { testApiHandler } from 'next-test-api-route-handler'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// All mocks before route import
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
  createServerSupabase: vi.fn().mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-001' } }, error: null }) },
  }),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
  getRateLimitIdentifier: vi.fn().mockReturnValue('ip:test'),
  rateLimitResponse: vi.fn(),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
    customers: { create: vi.fn().mockResolvedValue({ id: 'cus_test_123' }) },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' }),
      },
    },
  }),
}))

import * as appHandler from '@/app/api/checkout/route'
import { createServiceClient } from '@/lib/supabase/server'

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: subscription row has existing customer
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { stripe_customer_id: 'cus_existing' },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    } as any)
  })

  it('returns 200 with checkout URL when customer exists', async () => {
    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: 'client-001', priceId: 'price_test' }),
        })
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.url).toBe('https://checkout.stripe.com/test-session')
      },
    })
  })

  it('creates Stripe customer when none exists and returns 200', async () => {
    // Override: no existing customer
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({
          // subscriptions query returns no customer
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }) }),
        })
        .mockReturnValueOnce({
          // clients query for name/email
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { name: 'Acme', email: 'acme@test.com' }, error: null }) }) }),
        })
        .mockReturnValueOnce({
          // subscriptions update with new customerId
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }),
    } as any)

    await testApiHandler({
      appHandler,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: 'client-001', priceId: 'price_test' }),
        })
        expect(res.status).toBe(200)
      },
    })
  })
})
```

### Webhook Test — checkout.session.completed Branch
```typescript
// Source: webhook route source analysis + NTARH pattern
import { getStripe } from '@/lib/stripe'

it('checkout.session.completed: upserts subscription row', async () => {
  vi.mocked(getStripe).mockReturnValue({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { client_id: 'client-001' },
            subscription: 'sub_test_123',
            customer: 'cus_test_123',
          },
        },
      }),
    },
  } as any)

  await testApiHandler({
    appHandler,
    requestPatcher(req) {
      req.headers.set('stripe-signature', 'test-sig')
    },
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        body: JSON.stringify({}),  // body content doesn't matter — constructEvent is mocked
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.received).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        client_id: 'client-001',
        status: 'active',
        stripe_subscription_id: 'sub_test_123',
      }))
    },
  })
})
```

### Visual Regression — Playwright Config Addition
```typescript
// Source: Playwright docs + existing playwright.config.ts structure
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  snapshotPathTemplate: 'e2e/screenshots/{arg}{ext}',  // commits to e2e/screenshots/
  use: { trace: 'on-first-retry' },
  projects: [
    // ... existing projects (setup, setup-b, chromium, cross-tenant, storage-isolation)
    {
      name: 'visual',
      testMatch: /visual-regression\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-mocks-http for Next.js route tests | NTARH with real NextRequest | 2023 (App Router release) | NTARH patches Next.js fetch, cookies(), headers() exactly as production |
| Jest for Next.js | Vitest | 2023 (Next.js official) | Already adopted in this project (Phase 05 decision) |
| MSW 1.x setupServer | MSW 2.x — breaking API change (http instead of rest) | 2023 | Use `http.post(...)` not `rest.post(...)`; HttpResponse.json() not res(ctx.json()) |
| Playwright screenshot separate CI job with artifact upload | Baselines committed to repo, diffs in PR | Current best practice | D-18 aligns with this: no artifact storage, just committed PNGs |

**Deprecated/outdated:**
- MSW `rest.post(...)` and `res(ctx.json(...))`: Replaced by `http.post(...)` and `HttpResponse.json(...)` in MSW 2.x. Using the old API will throw at runtime.
- `node-mocks-http`: Does not patch Next.js internals. NTARH is the replacement.

---

## Open Questions

1. **Fire-and-forget assertion coverage in webhook tests**
   - What we know: `invoice.paid` and `invoice.payment_failed` run user lookup + email/notification in a `.then()` chain that completes after the route returns `{ received: true }`.
   - What's unclear: Whether the test framework awaits these pending microtasks before the test ends, making `sendEmail` assertions reliable.
   - Recommendation: Wrap the `testApiHandler` call with `await vi.runAllMicrotasksAsync()` (if available in Vitest 4.x) after the test block, or limit webhook branch assertions to the synchronous DB mutations (`.insert()` into payments, `.upsert()` into subscriptions) and accept that email/notification mocks are not reliably assertable in fire-and-forget branches. Document this explicitly in the test file.

2. **snapshotPathTemplate and Linux filename suffix**
   - What we know: Playwright appends `{browser}-{platform}` to snapshot names automatically. On Linux CI the suffix is `-chromium-linux`. The `snapshotPathTemplate` `'e2e/screenshots/{arg}{ext}'` omits this suffix from the template but Playwright still adds it.
   - What's unclear: Whether the custom `snapshotPathTemplate` suppresses the platform suffix or whether the final filename is `portal-dashboard-chromium-linux.png` regardless.
   - Recommendation: Plan the task to commit baselines with whatever suffix CI generates on first run. Document the exact filename format after the first CI baseline capture.

3. **Visual regression and Supabase live data**
   - What we know: The dev server needs Supabase URL + anon key to render authenticated pages. The seed user (`juan@novapay.com`) has deterministic data from `seed-demo.js`.
   - What's unclear: Whether the CI Supabase instance is the staging project or a local Supabase (which isn't started in the CI job).
   - Recommendation: The `visual-regression` CI job uses the same Supabase secrets as the existing `e2e-tests` job (staging project). No local Supabase needed. Mask dynamic elements in the spec to handle any live data variance.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 (unit/integration) + Playwright 1.58.2 (visual) |
| Config file | `platform/vitest.config.mts` (Vitest) / `platform/playwright.config.ts` (Playwright) |
| Quick run command | `npm run test:run` (from platform/) |
| Full suite command | `npm run test:run && npx playwright test --project=visual` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-10 | checkout POST returns 200 with url | integration | `npm run test:run -- __tests__/api/checkout.test.ts` | Wave 0 |
| TEST-10 | checkout POST creates Stripe customer when none exists | integration | `npm run test:run -- __tests__/api/checkout.test.ts` | Wave 0 |
| TEST-10 | billing-portal POST returns 200 with url | integration | `npm run test:run -- __tests__/api/billing-portal.test.ts` | Wave 0 |
| TEST-10 | billing-portal POST returns 400 when no customer | integration | `npm run test:run -- __tests__/api/billing-portal.test.ts` | Wave 0 |
| TEST-10 | webhook: checkout.session.completed upserts subscription | integration | `npm run test:run -- __tests__/api/webhook-stripe.test.ts` | Wave 0 |
| TEST-10 | webhook: invoice.paid inserts payment row | integration | `npm run test:run -- __tests__/api/webhook-stripe.test.ts` | Wave 0 |
| TEST-10 | webhook: invoice.payment_failed inserts failed payment | integration | `npm run test:run -- __tests__/api/webhook-stripe.test.ts` | Wave 0 |
| TEST-10 | webhook: customer.subscription.deleted updates status to cancelled | integration | `npm run test:run -- __tests__/api/webhook-stripe.test.ts` | Wave 0 |
| TEST-11 | portal dashboard visual baseline matches | visual | `npx playwright test --project=visual` | Wave 0 |
| TEST-11 | task list visual baseline matches | visual | `npx playwright test --project=visual` | Wave 0 |
| TEST-11 | settings visual baseline matches | visual | `npx playwright test --project=visual` | Wave 0 |
| TEST-11 | admin overview visual baseline matches | visual | `npx playwright test --project=visual` | Wave 0 |
| TEST-11 | admin billing visual baseline matches | visual | `npx playwright test --project=visual` | Wave 0 |
| TEST-11 | admin users visual baseline matches | visual | `npx playwright test --project=visual` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run` (from platform/)
- **Per wave merge:** `npm run test:run && npx playwright test --project=visual`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/__tests__/api/checkout.test.ts` — covers TEST-10 checkout branch
- [ ] `platform/__tests__/api/billing-portal.test.ts` — covers TEST-10 billing-portal branch
- [ ] `platform/__tests__/api/webhook-stripe.test.ts` — covers TEST-10 all 4 webhook branches
- [ ] `platform/e2e/visual-regression.spec.ts` — covers TEST-11 all 6 page baselines
- [ ] `platform/e2e/screenshots/` directory — baseline PNGs (generated by first CI run)
- [ ] `.github/workflows/test.yml` — new CI workflow file
- [ ] `playwright.config.ts` update — add `visual` project + `snapshotPathTemplate`
- [ ] `package.json` update — add `next-test-api-route-handler` and `msw` as devDependencies

---

## Sources

### Primary (HIGH confidence)
- NTARH v5 README (npm view next-test-api-route-handler readme) — Quick Start App Router, appHandler API, Next.js 14 compatibility note
- MSW 2.x docs (mswjs.io/docs/getting-started) — setupServer, http.post, HttpResponse.json, Vitest setup pattern
- Playwright docs (playwright.dev/docs/api/class-pageassertions) — toHaveScreenshot options: maxDiffPixelRatio, animations, mask
- Playwright docs (playwright.dev/docs/api/class-testconfig) — snapshotPathTemplate template variables
- Platform source code (read directly) — all 3 route handlers, vitest.config.mts, playwright.config.ts, package.json, existing test files

### Secondary (MEDIUM confidence)
- STATE.md architectural decision: "Playwright visual regression baselines: generated in CI (Linux) only — macOS baselines fail CI due to font rendering diff" — confirmed by Playwright cross-platform docs

### Tertiary (LOW confidence)
- Fire-and-forget microtask timing in Vitest 4.x — not verified against official Vitest docs; flagged as Open Question

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry confirmed exact versions 2026-03-27
- Architecture: HIGH — derived from reading actual source files and NTARH/Playwright official docs
- Pitfalls: HIGH (pitfalls 1-5) / MEDIUM (pitfall 6 NTARH import order) — based on direct code analysis and docs
- CI patterns: HIGH — existing ci.yml reviewed; new test.yml follows identical structure

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (NTARH and MSW are stable; Playwright snapshot API is stable)
