# Phase 5: Foundation - Research

**Researched:** 2026-03-24
**Domain:** Vitest unit testing, Playwright E2E, Supabase DB migrations, GitHub Actions CI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Max file size: 50 MB per file
- **D-02:** Allowed types: everything except executables (.exe, .sh, .bat, .cmd, .ps1, .msi, .dll, .so)
- **D-03:** No limit on number of files per comment
- **D-04:** Bucket must be private; only signed URLs with expiry for downloads
- **D-05:** Canonical path structure: `task-attachments/{client_id}/{task_id}/{filename}` — RLS scoped to client_id
- **D-06:** Notification types: `payment_success`, `payment_failed`, `task_updated`, `task_created`
- **D-07:** Each notification stores: user_id, type, title, body, read (boolean), action_link (nullable), created_at
- **D-08:** Retention: 90 days — implement cleanup via scheduled SQL or Supabase cron
- **D-09:** RLS: users see only their own notifications; admins see all
- **D-10:** Vitest for unit/component tests — ESM-native, no transform config
- **D-11:** Playwright for e2e — required for async RSC pages
- **D-12:** Supabase client mocked via `vi.mock('@/lib/supabase/client')` manual mocks — no live DB in unit tests
- **D-13:** GitHub Actions as CI platform
- **D-14:** Tests gate PR merges — run on every PR, block merge on failure
- **D-15:** Full pipeline: lint + type-check + Vitest unit tests + Playwright e2e + i18n key parity check
- **D-16:** Playwright runs in CI too — headless Chromium in GitHub Actions

### Claude's Discretion
- Action links on notifications — Claude decides per notification type whether to include a link to the relevant resource
- Test file organization — co-located vs top-level `__tests__/` directory
- Vitest configuration details (coverage thresholds, reporters)
- Playwright auth helper implementation (fixture vs setup project)
- GitHub Actions workflow file structure (single vs multiple jobs)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Vitest configured with Supabase manual mocks and test helpers | Vitest 4.1.1 + vite-tsconfig-paths 6.1.1 + jsdom 29.0.1; vi.mock pattern for createClient() |
| TEST-02 | Unit tests for stripe.ts (getPriceId, formatCurrency, webhook signature) | getPriceId and formatCurrency are pure functions — trivially testable without mocks; getStripe() requires env var mock |
| TEST-03 | Unit tests for slack.ts (channel creation, message posting) | global.fetch mock via vi.stubGlobal covers all Slack API calls; isConfigured() gated by SLACK_BOT_TOKEN |
| TEST-04 | Unit tests for onboard.ts (orchestration flow) | supabase mock + provisionGrafana/provisionSlack vi.mock targets; tests overall + partial + failed paths |
| TEST-05 | Playwright configured against local dev server with auth helpers | @playwright/test 1.58.2; setup project pattern with storageState saves login once |
| TEST-09 | CI check: i18n key parity between EN and ES JSON files | Node.js script comparing flat key sets; currently 153 keys each, 0 drift — run as CI step |
| NOTIF-01 | Notifications DB table with user_id, type, title, body, read status | New migration 002_notifications.sql; type uses CHECK constraint; 90-day retention via pg_cron or scheduled function |
| UPLOAD-01 | Supabase Storage bucket 'task-attachments' with private access | New migration 003_storage.sql; bucket created via SQL or Supabase CLI; private=true |
| UPLOAD-02 | Storage RLS policies scoped to client_id path structure | storage.foldername(name)[1] matches client_id; verified against current Supabase docs |
</phase_requirements>

## Summary

Phase 5 is a pure infrastructure phase — no feature UI is delivered. It creates three artifacts that unblock all downstream phases: (1) two Supabase migrations establishing the `notifications` table and `task-attachments` storage bucket with RLS; (2) Vitest unit test infrastructure with Supabase manual mocks and tests for `stripe.ts`, `slack.ts`, and `onboard.ts`; and (3) Playwright E2E infrastructure with auth helpers and a GitHub Actions CI workflow.

The codebase currently has zero automated tests — no Vitest, no Playwright, no Jest. Everything in this phase is net-new. The existing `package.json` has no test runner installed. The i18n files (`en.json` and `es.json`) are currently in perfect parity at 153 leaf keys each — the CI check must enforce this going forward, not fix existing drift.

The critical insight for this phase is that Supabase mocking must be established before any test is written. Without `vi.mock('@/lib/supabase/client')`, every test that imports a module importing the Supabase client will attempt a live connection — passing locally and failing in CI with `ECONNREFUSED`. The mock infrastructure is the foundation of the test foundation.

**Primary recommendation:** Install Vitest + Playwright first, establish the Supabase mock factory in `src/lib/supabase/__mocks__/client.ts`, run the two DB migrations, then write the unit tests. Do not write tests before the mock is in place.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.1 | Unit test runner | Next.js official recommendation; ESM-native, no transform config needed |
| @vitejs/plugin-react | 6.0.1 | JSX transform for Vitest | Required to process TSX in tests |
| vite-tsconfig-paths | 6.1.1 | Resolves `@/*` path alias | tsconfig.json has `@/*` → `./src/*`; without this, imports fail in Vitest |
| jsdom | 29.0.1 | DOM environment for unit tests | Standard Vitest browser emulation environment |
| @testing-library/react | 16.3.2 | React component rendering | Pairs with Vitest for component tests |
| @testing-library/dom | latest | DOM query utilities | Required peer of @testing-library/react |
| @playwright/test | 1.58.2 | E2E test runner | Next.js official recommendation; handles async RSC that Vitest cannot render |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | 4.1.1 | Coverage reporting | Optional; add if coverage gate desired in CI |
| @testing-library/user-event | 14.6.1 | User interaction simulation | Needed when testing form interactions in Vitest |
| @testing-library/jest-dom | 6.9.1 | Custom DOM matchers (`toBeInTheDocument`) | Improves assertion ergonomics; add to setupFiles |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest requires transform config for ESM; Next.js official docs recommend Vitest for new projects |
| Playwright setup project auth | Custom auth fixture | Setup project is the Playwright-recommended pattern; runs once, reuses storageState |
| Manual vi.mock | MSW (Mock Service Worker) | MSW intercepts HTTP; vi.mock intercepts the module import directly — simpler for pure unit tests of lib functions |
| Node.js parity script | jest-expect-diff | No additional dependency needed; JSON key comparison is 10 lines of Node.js |

**Installation:**
```bash
# From platform/ directory
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @testing-library/jest-dom @vitest/coverage-v8
npx playwright install --with-deps chromium
```

**Version verification (confirmed 2026-03-24 via npm registry):**
- vitest: 4.1.1
- @vitejs/plugin-react: 6.0.1
- vite-tsconfig-paths: 6.1.1
- jsdom: 29.0.1
- @testing-library/react: 16.3.2
- @playwright/test: 1.58.2

## Architecture Patterns

### Recommended Project Structure
```
platform/
├── vitest.config.mts              # Vitest config (mts extension for ESM)
├── playwright.config.ts           # Playwright config
├── src/
│   ├── lib/
│   │   └── supabase/
│   │       └── __mocks__/
│   │           └── client.ts      # Manual mock for vi.mock auto-resolution
│   └── test/
│       └── setup.ts               # Vitest setup file (jest-dom matchers)
├── __tests__/                     # Unit tests (top-level, mirrors src/lib/)
│   ├── stripe.test.ts
│   ├── slack.test.ts
│   └── onboard.test.ts
├── e2e/                           # Playwright E2E specs
│   ├── auth.setup.ts              # Login once, save storageState
│   └── portal.spec.ts             # Basic auth smoke test
└── supabase/
    └── migrations/
        ├── 001_schema.sql         # Existing
        ├── 002_notifications.sql  # New: notifications table + RLS
        └── 003_storage.sql        # New: task-attachments bucket + RLS
```

**Decision on test file location:** Use top-level `__tests__/` for unit tests of `src/lib/` modules. This is the pattern shown in Next.js official Vitest docs and avoids cluttering `src/lib/` with test files. Playwright tests go in `e2e/` (separate from `__tests__/`).

### Pattern 1: Vitest Configuration
**What:** `vitest.config.mts` at project root with tsconfig path resolution and jsdom environment
**When to use:** All unit tests

```typescript
// vitest.config.mts
// Source: https://nextjs.org/docs/app/guides/testing/vitest
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

### Pattern 2: Supabase Manual Mock
**What:** A `__mocks__/client.ts` file co-located with `src/lib/supabase/client.ts` so `vi.mock('@/lib/supabase/client')` auto-resolves without a factory
**When to use:** Every unit test that imports any module that calls `createClient()`

```typescript
// src/lib/supabase/__mocks__/client.ts
import { vi } from 'vitest'

export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
}

export function createClient() {
  return mockSupabase
}
```

**Usage in tests:**
```typescript
// __tests__/onboard.test.ts
vi.mock('@/lib/supabase/client')
import { mockSupabase } from '@/lib/supabase/__mocks__/client'
```

### Pattern 3: next/headers Mock for Server-Side Code
**What:** Mock `next/headers` in Vitest setup to prevent `cookies()` errors when server.ts is imported transitively
**When to use:** Any test that imports code using `createServerSupabase()`

```typescript
// src/test/setup.ts
import { vi } from 'vitest'
import '@testing-library/jest-dom'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))
```

### Pattern 4: Stripe Unit Tests (Pure Functions)
**What:** `getPriceId` and `formatCurrency` are pure — no Stripe SDK call. `getStripe()` lazy-initializes. Tests verify env var wiring and number formatting.
**When to use:** TEST-02

```typescript
// __tests__/stripe.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getPriceId, formatCurrency } from '@/lib/stripe'

describe('getPriceId', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRICE_RETAINER_US', 'price_us_test')
    vi.stubEnv('STRIPE_PRICE_RETAINER_PILOT_US', 'price_pilot_test')
  })

  it('returns standard price for non-pilot', () => {
    expect(getPriceId('retainer', 'US', false)).toBe('price_us_test')
  })

  it('returns pilot price when isPilot=true', () => {
    expect(getPriceId('retainer', 'US', true)).toBe('price_pilot_test')
  })

  it('returns empty string when env var missing', () => {
    expect(getPriceId('unknown', 'US')).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats USD amount', () => {
    expect(formatCurrency(5995, 'USD')).toBe('$5,995.00')
  })
})
```

### Pattern 5: Slack Unit Tests (fetch mock)
**What:** `slack.ts` uses `global.fetch` — mock via `vi.stubGlobal('fetch', mockFetch)`
**When to use:** TEST-03

```typescript
// __tests__/slack.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { provisionSlack } from '@/lib/slack'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('provisionSlack', () => {
  beforeEach(() => {
    vi.stubEnv('SLACK_BOT_TOKEN', 'xoxb-test-token')
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, channels: [], response_metadata: { next_cursor: '' } }),
    })
  })

  it('skips all steps when SLACK_BOT_TOKEN missing', async () => {
    vi.stubEnv('SLACK_BOT_TOKEN', '')
    const results = await provisionSlack({ name: 'TestCo', short_name: 'testco' })
    expect(results.every(r => r.status === 'skipped')).toBe(true)
  })
})
```

### Pattern 6: Playwright Auth Setup Project
**What:** Single `auth.setup.ts` logs in once with demo credentials and saves `storageState`; all test projects depend on it
**When to use:** TEST-05 — reused by all E2E specs

```typescript
// e2e/auth.setup.ts
// Source: https://playwright.dev/docs/auth
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/en/login')
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || 'juan@novapay.com')
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || 'demo2026')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/portal**')
  await page.context().storageState({ path: authFile })
})
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
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

### Pattern 7: i18n Key Parity Script
**What:** Node.js script that reads `en.json` and `es.json`, flattens to leaf keys, compares sets, exits with code 1 on mismatch
**When to use:** TEST-09 — run as CI step

```javascript
// scripts/check-i18n.js
const en = require('../src/messages/en.json')
const es = require('../src/messages/es.json')

function leafKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null ? leafKeys(v, full) : [full]
  })
}

const enKeys = new Set(leafKeys(en))
const esKeys = new Set(leafKeys(es))
const onlyEn = [...enKeys].filter(k => !esKeys.has(k))
const onlyEs = [...esKeys].filter(k => !enKeys.has(k))

if (onlyEn.length || onlyEs.length) {
  if (onlyEn.length) console.error('Keys in EN missing from ES:', onlyEn)
  if (onlyEs.length) console.error('Keys in ES missing from EN:', onlyEs)
  process.exit(1)
}
console.log(`i18n parity OK — ${enKeys.size} keys`)
```

Current state: EN=153 keys, ES=153 keys, 0 drift.

### Pattern 8: Notifications Migration
**What:** `002_notifications.sql` — creates `notifications` table with RLS matching existing schema patterns
**When to use:** NOTIF-01

```sql
-- supabase/migrations/002_notifications.sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_success', 'payment_failed', 'task_updated', 'task_created')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Admins see all notifications
CREATE POLICY "Admins see all notifications" ON notifications FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'));

-- Service role inserts (cross-user writes via createServiceClient)
-- Service role bypasses RLS by default — no INSERT policy needed for service role

-- 90-day retention index
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
```

**Action link per notification type (Claude's discretion):**
- `payment_success` → `/en/portal/billing`
- `payment_failed` → `/en/portal/billing`
- `task_updated` → `/en/portal/tasks/{task_id}`
- `task_created` → `/en/portal/tasks/{task_id}`

### Pattern 9: Storage Migration
**What:** `003_storage.sql` — creates private `task-attachments` bucket and RLS policies using `storage.foldername()`
**When to use:** UPLOAD-01, UPLOAD-02

```sql
-- supabase/migrations/003_storage.sql
-- Create private bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  52428800,  -- 50 MB in bytes
  NULL       -- all types allowed; enforcement via RLS + client-side validation
)
ON CONFLICT (id) DO NOTHING;

-- RLS: clients can upload to their own client_id folder
CREATE POLICY "Clients can upload own attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = (
      SELECT client_id::text FROM users WHERE id = auth.uid()
    )
  );

-- RLS: clients can read their own attachments
CREATE POLICY "Clients can read own attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = (
      SELECT client_id::text FROM users WHERE id = auth.uid()
    )
  );

-- RLS: admins can read all attachments
CREATE POLICY "Admins can read all attachments" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer')
  );
```

**Verified:** `storage.foldername(name)[1]` is 1-indexed and returns the first path segment. For path `{client_id}/{task_id}/{filename}`, index `[1]` = `client_id`. Confirmed against current Supabase Storage docs (2026-03-24).

### Pattern 10: GitHub Actions CI Workflow
**What:** Single workflow file running on PR; sequential jobs: lint/type-check → unit tests → E2E → i18n check
**When to use:** D-13 through D-16

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-typecheck:
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
      - run: npm run lint
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
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
      - run: npm test -- --run

  e2e-tests:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
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
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: platform/playwright-report/

  i18n-check:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    defaults:
      run:
        working-directory: platform
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node scripts/check-i18n.js
```

### Anti-Patterns to Avoid
- **Writing tests before the Supabase mock exists:** Every test importing a module that imports `@/lib/supabase/client` will attempt a live connection. Establish `__mocks__/client.ts` first.
- **Using `vi.mock` without the `__mocks__` directory:** Without the auto-resolution file, every test must specify a factory inline. Co-locating the mock once eliminates repetition.
- **Not mocking `next/headers` in setup:** `createServerSupabase()` calls `cookies()` from `next/headers`. Tests that import `server.ts` transitively will throw without the global mock.
- **Running `npm test` (watch mode) in CI:** Use `npm test -- --run` for CI to run once and exit.
- **Storing `playwright/.auth/user.json` in git:** This file contains session tokens. Add it to `.gitignore`.
- **E2E test depending on specific demo user data:** Demo data can change; tests should assert structure/navigation not specific values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path alias `@/*` in Vitest | Manual alias config in vitest.config | `vite-tsconfig-paths` plugin | Reads existing tsconfig.json automatically; stays in sync |
| Supabase chainable query mock | Custom class with every method mocked | `vi.fn().mockReturnThis()` chain | Covers `.from().select().eq().single()` without a class |
| i18n key comparison | Third-party i18n testing library | 10-line Node.js script | Zero dependencies; exact fit for flat JSON structure |
| Auth in every E2E test | Login steps in each `test()` | Playwright setup project + storageState | Runs once; reused by all tests; standard Playwright pattern |
| Storage bucket creation via dashboard | Manual UI click | SQL migration `INSERT INTO storage.buckets` | Reproducible; runs with `supabase db reset` |

**Key insight:** The entire test infrastructure for this codebase can be built with packages that are either already in the Next.js ecosystem or installable with one `npm install` line. No custom tooling is needed anywhere.

## Common Pitfalls

### Pitfall 1: Supabase Client Not Mocked
**What goes wrong:** Tests pass locally (live Supabase running) and fail in CI with `ECONNREFUSED` or `fetch failed`
**Why it happens:** `createBrowserClient` makes a real connection on module load if not intercepted
**How to avoid:** Create `src/lib/supabase/__mocks__/client.ts` before writing any test; add `vi.mock('@/lib/supabase/client')` at top of every test file that needs it
**Warning signs:** Test output shows Supabase URLs in error messages

### Pitfall 2: next/headers in Unit Test Context
**What goes wrong:** `Error: cookies() was called outside a request scope`
**Why it happens:** `onboard.ts` imports from `@supabase/ssr` which has a peer dependency on next/headers patterns
**How to avoid:** Add `vi.mock('next/headers', ...)` in `src/test/setup.ts` so it applies globally to all tests
**Warning signs:** Tests fail on import, not on assertion

### Pitfall 3: Stripe Webhook Test Body Corruption
**What goes wrong:** `stripe.webhooks.constructEvent` throws `No signatures found matching the expected signature`
**Why it happens:** `JSON.stringify(JSON.parse(rawBody))` changes byte order and whitespace, invalidating the HMAC
**How to avoid:** Use a pre-serialized fixture file as raw bytes; use `stripe.webhooks.generateTestHeaderString` with that exact buffer
**Warning signs:** Webhook unit tests fail only when testing `constructEvent`, not other functions

### Pitfall 4: Storage RLS Path Indexing Off-By-One
**What goes wrong:** Uploads succeed but downloads return 403 (or vice versa) due to wrong array index
**Why it happens:** `storage.foldername(name)` is 1-indexed in PostgreSQL arrays; developers familiar with 0-indexed languages use `[0]`
**How to avoid:** Use `[1]` for the first path segment (client_id) — verified against current Supabase docs
**Warning signs:** Policy works for INSERT but not SELECT or vice versa

### Pitfall 5: Playwright storageState File Committed to Git
**What goes wrong:** Session tokens exposed in repository history
**Why it happens:** `playwright/.auth/user.json` is created locally and staged accidentally
**How to avoid:** Add `playwright/.auth/` to `.gitignore` before running auth setup
**Warning signs:** `git status` shows `playwright/.auth/user.json` as untracked

### Pitfall 6: i18n CI Script Finds False Positives with Nested Keys
**What goes wrong:** Script reports missing keys that actually exist under different nesting
**Why it happens:** Simple `Object.keys()` only reads top-level; nested objects appear as missing
**How to avoid:** Use recursive key flattening (the `leafKeys()` pattern above); confirmed working against current 153-key JSON structure
**Warning signs:** Script reports drift when `en.json` and `es.json` appear identical in diff

### Pitfall 7: E2E Test Hitting Locale Prefix
**What goes wrong:** `page.goto('/portal')` returns 404 because the app uses `[locale]` routing
**Why it happens:** next-intl wraps all routes under `/en/` or `/es/`; bare paths don't exist
**How to avoid:** Always use full locale paths in E2E tests: `/en/login`, `/en/portal`, or set `baseURL` to `http://localhost:3000` and use `/en/` prefix consistently
**Warning signs:** E2E tests get 404 or infinite redirect loop

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 + @playwright/test 1.58.2 |
| Config file | `platform/vitest.config.mts` (to be created in Wave 0) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Vitest boots without hitting live DB | unit | `npm test -- --run` | Wave 0 |
| TEST-02 | getPriceId returns correct env var key | unit | `npm test -- --run __tests__/stripe.test.ts` | Wave 0 |
| TEST-02 | formatCurrency formats USD correctly | unit | `npm test -- --run __tests__/stripe.test.ts` | Wave 0 |
| TEST-03 | provisionSlack skips when no token | unit | `npm test -- --run __tests__/slack.test.ts` | Wave 0 |
| TEST-03 | createChannel calls conversations.create | unit | `npm test -- --run __tests__/slack.test.ts` | Wave 0 |
| TEST-04 | onboardClient returns failed when client not found | unit | `npm test -- --run __tests__/onboard.test.ts` | Wave 0 |
| TEST-04 | onboardClient returns partial when some steps fail | unit | `npm test -- --run __tests__/onboard.test.ts` | Wave 0 |
| TEST-05 | Playwright auth setup reaches /portal | e2e | `npx playwright test e2e/auth.setup.ts` | Wave 0 |
| TEST-09 | i18n check exits 0 when keys match | unit | `node scripts/check-i18n.js` | Wave 0 |
| TEST-09 | i18n check exits 1 when keys diverge | unit | `node scripts/check-i18n.js` | Wave 0 |
| NOTIF-01 | notifications table exists with correct columns | manual/migration | `supabase db reset` | Wave 0 |
| UPLOAD-01 | task-attachments bucket exists and is private | manual/migration | `supabase db reset` | Wave 0 |
| UPLOAD-02 | Storage RLS blocks cross-client reads | manual/smoke | `npx playwright test e2e/storage-rls.spec.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run && npx playwright test && node scripts/check-i18n.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/vitest.config.mts` — Vitest configuration
- [ ] `platform/playwright.config.ts` — Playwright configuration
- [ ] `platform/src/test/setup.ts` — jest-dom + next/headers global mocks
- [ ] `platform/src/lib/supabase/__mocks__/client.ts` — Supabase manual mock
- [ ] `platform/__tests__/stripe.test.ts` — TEST-02
- [ ] `platform/__tests__/slack.test.ts` — TEST-03
- [ ] `platform/__tests__/onboard.test.ts` — TEST-04
- [ ] `platform/e2e/auth.setup.ts` — TEST-05 auth helper
- [ ] `platform/e2e/portal.spec.ts` — TEST-05 smoke spec
- [ ] `platform/scripts/check-i18n.js` — TEST-09
- [ ] `platform/supabase/migrations/002_notifications.sql` — NOTIF-01
- [ ] `platform/supabase/migrations/003_storage.sql` — UPLOAD-01, UPLOAD-02
- [ ] `platform/.github/workflows/ci.yml` — D-13 through D-16
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @testing-library/jest-dom`
- [ ] Playwright install: `npx playwright install --with-deps chromium`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest for Next.js | Vitest | 2023 (Next.js official guidance) | No transform config; ESM-native; faster |
| Cypress for E2E | Playwright | 2022-2023 | Better async RSC support; maintained by Microsoft; official Next.js recommendation |
| Public Supabase Storage buckets | Private buckets + signed URLs | Supabase Storage v2 | Prevents accidental data exposure |
| `storage.foldername()[0]` | `storage.foldername()[1]` | PostgreSQL arrays are 1-indexed | Common gotcha when coming from JavaScript |

**Deprecated/outdated:**
- `jest.config.js` in Next.js: Still works but requires transform config; not recommended for new projects
- `cy.intercept` (Cypress) for auth mocking: Playwright `storageState` is simpler and more reliable

## Open Questions

1. **90-day notification retention mechanism**
   - What we know: D-08 specifies pg_cron or scheduled SQL
   - What's unclear: `pg_cron` requires the extension to be enabled in the Supabase project dashboard; availability varies by Supabase plan
   - Recommendation: Write the retention policy as a SQL function `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days'` and note in the migration comment that it requires manual scheduling via Supabase Dashboard → Database → Cron Jobs. Do not block migration on pg_cron availability.

2. **Supabase Storage bucket creation via SQL vs CLI**
   - What we know: `INSERT INTO storage.buckets` works in SQL migrations
   - What's unclear: Whether `supabase db reset` applies storage bucket SQL in the same pass as table migrations
   - Recommendation: Keep `003_storage.sql` as a standard migration file; verify with `supabase db reset` locally before merging. If bucket insert fails in migration, fallback is `supabase storage create task-attachments --private` via CLI as a documented manual step.

3. **E2E test credentials in CI**
   - What we know: Demo credentials `juan@novapay.com / demo2026` exist in `en.json`
   - What's unclear: Whether the staging/CI Supabase instance has the demo user seeded
   - Recommendation: Parameterize via `E2E_EMAIL` and `E2E_PASSWORD` env vars in `auth.setup.ts`; store as GitHub Actions secrets; fall back to demo credentials when vars absent.

## Sources

### Primary (HIGH confidence)
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) — verified 2026-03-24; package list, vitest.config.mts pattern
- [Next.js Playwright Guide](https://nextjs.org/docs/app/guides/testing/playwright) — verified 2026-03-24; webServer config, project structure
- [Playwright Authentication Docs](https://playwright.dev/docs/auth) — verified 2026-03-24; setup project pattern, storageState
- [Supabase Storage RLS Docs](https://supabase.com/docs/guides/storage/security/access-control) — verified 2026-03-24; `storage.foldername()[1]` syntax confirmed 1-indexed
- `platform/package.json` — current dependency versions (Next.js 14.2.18, @supabase/ssr ^0.9.0)
- `platform/supabase/migrations/001_schema.sql` — existing migration pattern; new migrations follow same structure
- `platform/src/lib/types.ts` — existing type patterns; Notification type follows same shape
- `platform/src/lib/supabase/client.ts` — `createClient()` mock target confirmed
- npm registry (2026-03-24) — vitest@4.1.1, @playwright/test@1.58.2, vite-tsconfig-paths@6.1.1, jsdom@29.0.1

### Secondary (MEDIUM confidence)
- [Playwright CI Guide](https://playwright.dev/docs/ci-intro) — headless chromium, `npx playwright install --with-deps chromium`
- WebSearch: vi.mock Supabase patterns — manual mock with `vi.fn().mockReturnThis()` confirmed across multiple sources

### Tertiary (LOW confidence)
- pg_cron availability on Supabase free/pro tiers — training data; verify in Supabase Dashboard before scheduling retention job

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry 2026-03-24
- Architecture: HIGH — patterns from official Next.js and Playwright docs, cross-referenced with codebase analysis
- Pitfalls: HIGH — most from direct code inspection (Supabase client pattern, locale routing, next/headers); storage RLS index is MEDIUM (verified in current Supabase docs)

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable libraries; Playwright and Vitest APIs change slowly)
