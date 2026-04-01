# Architecture Research

**Domain:** Next.js 15 App Router + Supabase platform — v1.2 Security & Polish feature integration
**Researched:** 2026-03-25
**Confidence:** HIGH (Supabase MFA, Vercel Cron, and Playwright docs verified against official sources; in-memory rate limiter pattern and Recharts integration confirmed against codebase)

---

## Context: What Already Exists

This document is integration-focused. The v1.1 platform is fully running. The eight new features (2FA, rate limiting, weekly digest, notification prefs, admin user management, MRR chart, integration tests, visual regression) must slot into the existing architecture without introducing new layers or rewrites.

**Existing architecture constraints that drive integration decisions:**

- Three Supabase clients: `createClient()` (browser), `createServerSupabase()` (server/cookie-based), `createServiceClient()` (API routes, bypasses RLS)
- Middleware handles: locale detection, session auth check, role guard for `/admin`, redirect to login
- Notification pipeline: `notifyTaskEvent()` in `lib/notifications.ts` orchestrates email (Resend), in-app row insert, and Slack; called fire-and-forget from API routes
- Auth: Supabase email/password with roles `admin | engineer | seller | client` stored in `users.role`
- Test infra: Vitest (jsdom) + Playwright (chromium with auth state); both already configured
- Recharts already installed (`"recharts": "^2.13.3"` in package.json)
- `subscriptions.price_monthly` already exists — MRR data is already in the DB

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js 15 App Router (Vercel)                                     │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Middleware  │  │  Admin Pages  │  │  Portal    │  │ Cron API │ │
│  │  (existing)  │  │  (+ users pg) │  │  Pages     │  │ /digest  │ │
│  │  + AAL2 gate │  │  (+ MRR chart)│  │  (+ notif  │  │          │ │
│  │  + rate gate │  │               │  │   prefs)   │  │          │ │
│  └──────┬───────┘  └──────┬────────┘  └─────┬──────┘  └────┬─────┘ │
│         │                 │                  │              │       │
│  ┌──────┴─────────────────┴──────────────────┴──────────────┴─────┐ │
│  │                    API Routes Layer                             │ │
│  │  /api/checkout  /api/billing-portal  /api/tasks/*              │ │
│  │  /api/webhooks/stripe                                          │ │
│  │  /api/admin/users  /api/admin/users/[id]  (NEW)                │ │
│  │  /api/cron/digest  (NEW)                                       │ │
│  │                                                                │ │
│  │  Rate Limiter: lib/rate-limit.ts (in-memory Map, per-route)   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
           │                           │                │
           ▼                           ▼                ▼
┌──────────────────┐   ┌───────────────────────────┐  ┌──────────┐
│ Supabase Auth    │   │ Supabase Postgres          │  │  Resend  │
│ (existing)       │   │ (existing 13 tables)       │  │ (existing│
│ + TOTP MFA       │   │ + user_notification_prefs  │  │  + weekly│
│   enroll/verify  │   │ + user_invitations         │  │  digest) │
│ + AAL2 sessions  │   │                            │  └──────────┘
└──────────────────┘   └───────────────────────────┘
```

---

## Component Inventory: New vs Modified

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| `src/middleware.ts` | **MODIFIED** | Existing | Add AAL2 MFA check after existing role guard |
| `src/lib/rate-limit.ts` | **NEW** | `src/lib/` | In-memory sliding window rate limiter |
| `src/lib/mfa.ts` | **NEW** | `src/lib/` | TOTP enroll / verify / unenroll wrappers |
| `src/lib/digest.ts` | **NEW** | `src/lib/` | Weekly digest query + send logic |
| `src/lib/emails/WeeklyDigestEmail.tsx` | **NEW** | `src/lib/emails/` | React Email digest template |
| `src/lib/notifications.ts` | **MODIFIED** | Existing | Add preference filter before each channel send |
| `src/app/api/admin/users/route.ts` | **NEW** | `src/app/api/admin/users/` | GET list users, POST invite |
| `src/app/api/admin/users/[id]/route.ts` | **NEW** | `src/app/api/admin/users/[id]/` | PATCH role/deactivate |
| `src/app/api/cron/digest/route.ts` | **NEW** | `src/app/api/cron/digest/` | Secured by CRON_SECRET |
| `src/app/api/checkout/route.ts` | **MODIFIED** | Existing | Add rate limiter check at top |
| `src/app/api/billing-portal/route.ts` | **MODIFIED** | Existing | Add rate limiter check at top |
| `src/app/api/tasks/route.ts` | **MODIFIED** | Existing | Add rate limiter check at top |
| `src/app/[locale]/admin/users/page.tsx` | **NEW** | Admin pages | User list + invite form + role/deactivate |
| `src/app/[locale]/admin/billing/page.tsx` | **MODIFIED** | Existing | Add MRR chart section |
| `src/app/[locale]/portal/security/page.tsx` | **NEW** | Portal pages | 2FA enrollment UI |
| `src/app/[locale]/portal/notifications/page.tsx` | **NEW** | Portal pages | Notification preference toggles |
| `src/app/[locale]/mfa-verify/page.tsx` | **NEW** | Outside /portal | MFA challenge screen (shown post-login) |
| `supabase/migrations/005_notification_prefs.sql` | **NEW** | Migrations | `user_notification_prefs` table + RLS |
| `supabase/migrations/006_user_invitations.sql` | **NEW** | Migrations | `user_invitations` tracking table + RLS |
| `vercel.json` | **NEW** | `platform/` root | Cron schedule definition |
| `src/__tests__/api/*.test.ts` | **NEW** | `src/__tests__/api/` | Integration tests for API routes |
| `e2e/visual/*.spec.ts` | **NEW** | `e2e/visual/` | Visual regression tests |
| `playwright.config.ts` | **MODIFIED** | Existing | Add `visual` project |

---

## Feature Integration Details

### Feature 1: Two-Factor Authentication (TOTP) — SEC-01

**Integration point:** Supabase Auth TOTP MFA is enabled by default on all Supabase projects and free on all plans. No new infrastructure needed. The existing `@supabase/ssr` client already has the MFA API available.

**Authentication Assurance Levels:**
- `aal1` = password only (current state for all users)
- `aal2` = password + TOTP verified (after enrollment and challenge)

**New files:**

```
src/app/[locale]/portal/security/page.tsx   ← Enrollment UI: QR code + verify + manage
src/app/[locale]/mfa-verify/page.tsx        ← Challenge screen post-login
src/lib/mfa.ts                              ← enroll(), verify(), unenroll() SDK wrappers
```

**Middleware change (additive — append after existing role check):**

```typescript
// src/middleware.ts — after existing admin role check, before final return:
const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
if (
  aalData?.nextLevel === 'aal2' &&
  aalData?.currentLevel !== 'aal2' &&
  pathWithoutLocale !== '/mfa-verify'
) {
  return NextResponse.redirect(new URL(`/${locale}/mfa-verify`, request.url))
}
```

**`getAuthenticatorAssuranceLevel()` is a local computation** — it inspects the JWT claims in the existing session cookie without a network round-trip to Supabase. Latency impact on middleware is negligible.

**Enrollment data flow:**

```
User visits /portal/security
  → client: supabase.auth.mfa.enroll({ factorType: 'totp' })
    returns: { id: factorId, totp: { qr_code, secret } }
  → Display QR code SVG as <img src="data:..."> + plain-text secret fallback
  → User scans with authenticator app, enters 6-digit code
  → client: supabase.auth.mfa.challenge({ factorId })
    returns: { id: challengeId }
  → client: supabase.auth.mfa.verify({ factorId, challengeId, code })
  → on success: session upgraded to aal2; show confirmation
```

**Login challenge data flow:**

```
User submits password → aal1 session established
  → middleware: getAuthenticatorAssuranceLevel()
      nextLevel === 'aal2' && currentLevel !== 'aal2'?
        YES → redirect /mfa-verify
  → /mfa-verify: user enters TOTP code
      → challenge() + verify() → aal2 session established
      → redirect to /portal (or stored return URL)
```

**No DB migration needed.** Supabase stores factor data in `auth.mfa_factors` (internal, managed).

---

### Feature 2: Rate Limiting on API Routes — SEC-02

**Integration point:** The three existing API routes (`/api/checkout`, `/api/billing-portal`, `/api/tasks`) have zero rate limiting. New routes (`/api/admin/*`, `/api/cron/digest`) also need protection.

**Approach: per-route in-memory Map with sliding window.** No Redis or external dependency needed at current scale (Vantix has < 20 concurrent users). Vercel serverless is ephemeral — the Map resets on cold starts, which is acceptable (attackers see the limit reset too, and a cold-start attack is self-throttling).

**New file: `src/lib/rate-limit.ts`**

```typescript
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  ip: string,
  limit: number = 20,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}
```

**Usage pattern (added to top of each protected route):**

```typescript
const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'
const { allowed } = rateLimit(ip, 20, 60_000)
if (!allowed) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

**Limits per route:**

| Route | Limit | Window | Rationale |
|-------|-------|--------|-----------|
| `/api/checkout` | 5/min | 60s | Stripe session creation is expensive |
| `/api/billing-portal` | 10/min | 60s | Portal redirect |
| `/api/tasks` POST | 20/min | 60s | Normal admin usage |
| `/api/admin/users` POST | 10/min | 60s | Invite operations |
| `/api/cron/digest` | CRON_SECRET only | — | Secret validates the caller; no IP rate limit |

---

### Feature 3: Weekly Email Digest — NOTIF-10

**Integration point:** Vercel Cron Jobs trigger an HTTP GET to a new API route at `0 9 * * 1` (Monday 09:00 UTC). The route uses the existing `sendEmail()` helper and reads from existing Supabase tables.

**New files:**

```
src/app/api/cron/digest/route.ts      ← GET handler, CRON_SECRET gate
src/lib/digest.ts                     ← query logic + looping send
src/lib/emails/WeeklyDigestEmail.tsx  ← React Email template (bilingual)
platform/vercel.json                  ← Cron schedule config (new file)
```

**`vercel.json`:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Security — CRON_SECRET pattern (verified Vercel docs):**

```typescript
// src/app/api/cron/digest/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const result = await sendWeeklyDigest()
  return Response.json(result)
}
```

Vercel automatically injects `Authorization: Bearer $CRON_SECRET` when triggering the cron. Local testing: call `GET /api/cron/digest` with the header manually.

**Digest data flow:**

```
Vercel Cron (Monday 09:00 UTC)
  → GET /api/cron/digest (Authorization: Bearer $CRON_SECRET)
  → digest.ts: SELECT clients WHERE status = 'active'
  → for each client:
      SELECT users WHERE client_id = client.id
      SELECT weekly_metrics WHERE client_id = ? ORDER BY week_start DESC LIMIT 1
      SELECT tasks WHERE client_id = ? AND updated_at > (now - 7 days)
      for each user:
        SELECT user_notification_prefs WHERE user_id = user.id
        if email_digest_weekly = true (or row is null → default true):
          sendEmail(WeeklyDigestEmail, { locale, client, metrics, tasks })
  → return { sent: N, skipped: M }
```

**Dependency on NOTIF-11:** The `email_digest_weekly` preference check requires the `user_notification_prefs` table. Build NOTIF-11 (migration + table) before NOTIF-10. In the interim, default to send-all (treat missing pref row as `true`).

**Cron plan note:** Vercel Hobby plan allows once-per-day minimum. Weekly (`0 9 * * 1`) is once per week — allowed on all plans. Pro plan gets per-minute precision; Hobby gets ±1 hour accuracy on daily crons (weekly is coarser and within spec).

---

### Feature 4: Notification Preferences — NOTIF-11

**Integration point:** New DB table. The existing `notifyTaskEvent` orchestrator gains a preference lookup before each channel send. Preferences default to `true` (opt-out model) to preserve current behavior for users who have not set preferences.

**New migration: `005_notification_prefs.sql`**

```sql
CREATE TABLE user_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_task_created BOOLEAN DEFAULT true,
  email_task_updated BOOLEAN DEFAULT true,
  email_digest_weekly BOOLEAN DEFAULT true,
  inapp_task_created BOOLEAN DEFAULT true,
  inapp_task_updated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs" ON user_notification_prefs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins read all prefs" ON user_notification_prefs
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer')
  );
```

**New portal page:**

```
src/app/[locale]/portal/notifications/page.tsx   ← Toggle switches, one per channel
```

**Modified `lib/notifications.ts`** — add preference filter inside the per-user loop:

```typescript
// Before sending to each user, look up their prefs:
const { data: prefs } = await supabase
  .from('user_notification_prefs')
  .select('email_task_created, email_task_updated, inapp_task_created, inapp_task_updated')
  .eq('user_id', user.id)
  .single()

// null prefs row = user hasn't set preferences = all channels enabled (default)
const emailEnabled = eventType === 'task_created'
  ? (prefs?.email_task_created ?? true)
  : (prefs?.email_task_updated ?? true)

const inappEnabled = eventType === 'task_created'
  ? (prefs?.inapp_task_created ?? true)
  : (prefs?.inapp_task_updated ?? true)

if (emailEnabled) { await sendEmail(...) }
if (inappEnabled) { await createNotification(...) }
```

**Preference row creation strategy:** Use `INSERT INTO user_notification_prefs (user_id) VALUES (?) ON CONFLICT DO NOTHING` when a user first visits the notifications page. Avoids a separate onboarding step.

---

### Feature 5: Admin User Management — ADMIN-07

**Integration point:** Uses Supabase Admin API (`supabase.auth.admin.inviteUserByEmail`) from server-side API routes using the existing `createServiceClient()` (service role key). No new auth infrastructure needed.

**New migration: `006_user_invitations.sql`**

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'seller', 'client')),
  client_id UUID REFERENCES clients(id),
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitations" ON user_invitations
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer')
  );
```

**New API routes:**

```
src/app/api/admin/users/route.ts       ← GET list, POST invite
src/app/api/admin/users/[id]/route.ts  ← PATCH (role/deactivate)
```

**Security pattern for all `/api/admin/*` routes** — verify caller before using service client:

```typescript
// Every admin API route must do this:
const userClient = createServerSupabase()        // cookie-based, respects RLS
const { data: { user } } = await userClient.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const { data: profile } = await userClient
  .from('users').select('role').eq('id', user.id).single()
if (!['admin', 'engineer'].includes(profile?.role ?? '')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Now safe to use service client for privileged operation:
const admin = createServiceClient()
```

**Invite flow:**

```
Admin submits form: { email, role, client_id? }
  → POST /api/admin/users
  → verify caller is admin
  → serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { role, client_id }  // stored in user metadata
    })
  → Supabase sends magic-link invite email to user
  → INSERT user_invitations { email, role, client_id, invited_by }
  → return 201

User receives email, clicks link
  → Supabase handles accept flow (sets password)
  → Trigger or post-signup hook creates users row with role from metadata
  → UPDATE user_invitations SET accepted_at = NOW() WHERE email = ?
```

**Known limitation:** `inviteUserByEmail` does not support PKCE (documented by Supabase — the browser sending the invite differs from the one accepting it). This is expected behavior and does not affect security for this use case.

**Role change flow:**

```
Admin changes role in dropdown
  → PATCH /api/admin/users/[id] { action: 'role', role: 'engineer' }
  → serviceClient.from('users').update({ role }).eq('id', userId)
  → Middleware picks up new role on user's next request (session refresh)
```

**Deactivate flow:**

```
Admin clicks Deactivate
  → PATCH /api/admin/users/[id] { action: 'deactivate' }
  → serviceClient.auth.admin.updateUserById(userId, { ban_duration: '87600h' })
    (ban for 10 years = effective permanent)
  → OR: UPDATE users SET status = 'inactive' WHERE id = ? (soft delete, no auth ban)
```

**New admin page:**

```
src/app/[locale]/admin/users/page.tsx   ← Table: name, email, role, status + actions
                                            Invite form: email + role + client select
                                            Pending invitations list
```

---

### Feature 6: Admin MRR Trend Chart — ADMIN-08

**Integration point:** Recharts is already installed. MRR data already exists in `subscriptions.price_monthly` + `subscriptions.started_at` + `subscriptions.cancelled_at`. No new library, no new DB migration needed.

**Data query approach** — aggregate from existing `subscriptions` table in the route or server component. At current scale (< 20 clients), simple in-process aggregation is sufficient:

```typescript
// Pseudo-logic for 12-month MRR series:
const months = getLast12Months()  // array of { start: Date, end: Date, label: string }
const { data: subs } = await supabase
  .from('subscriptions')
  .select('price_monthly, started_at, cancelled_at, status, currency')

const mrrData = months.map(({ start, end, label }) => ({
  month: label,
  mrr: subs
    .filter(s =>
      s.price_monthly > 0 &&
      new Date(s.started_at) <= end &&
      (!s.cancelled_at || new Date(s.cancelled_at) >= start)
    )
    .reduce((sum, s) => sum + Number(s.price_monthly), 0)
}))
```

**Integration into existing billing page:**

```
src/app/[locale]/admin/billing/page.tsx   ← Add MRR chart section above billing table
```

**Chart component (new Client Component):**

```
src/components/MRRChart.tsx   ← 'use client', wraps Recharts AreaChart
```

**Server/Client boundary:** The billing page (`page.tsx`) is a server component that fetches subscription data. It passes the aggregated `mrrData` array as props to `<MRRChart />` which is a `'use client'` component. Recharts uses browser APIs and cannot render in server context.

---

### Feature 7: Integration Tests for API Routes — TEST-10

**Integration point:** Existing Vitest setup uses jsdom environment. API route integration tests need Node environment. Recommended library: `next-test-api-route-handler` — wraps actual route handlers in a simulated Next.js environment without running the server.

**New dev dependency:**

```bash
npm install -D next-test-api-route-handler
```

**New test files:**

```
src/__tests__/api/
  checkout.test.ts          ← Tests POST /api/checkout: rate limit, Stripe call, response
  billing-portal.test.ts    ← Tests POST /api/billing-portal
  tasks.test.ts             ← Tests POST /api/tasks: field validation, notify call
  admin-users.test.ts       ← Tests POST /api/admin/users: auth check, invite call
  cron-digest.test.ts       ← Tests GET /api/cron/digest: CRON_SECRET, send count
```

**Per-file environment override** (Node required for route handlers):

```typescript
// @vitest-environment node
import { testApiHandler } from 'next-test-api-route-handler'
import * as handler from '@/app/api/checkout/route'
```

**Extended Supabase mock** — new `src/lib/supabase/__mocks__/server.ts`:

```typescript
export const createServerSupabase = vi.fn(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn() })),
}))

export const createServiceClient = vi.fn(() => ({
  from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn() })),
  auth: {
    admin: {
      inviteUserByEmail: vi.fn(),
      updateUserById: vi.fn(),
    }
  },
}))
```

**Stripe mock** — `src/lib/__mocks__/stripe.ts`:

```typescript
export const getStripe = vi.fn(() => ({
  customers: { create: vi.fn() },
  checkout: { sessions: { create: vi.fn(() => ({ url: 'https://checkout.stripe.com/test' })) } },
  billingPortal: { sessions: { create: vi.fn() } },
}))
```

**Rate limiter mock** — `src/lib/__mocks__/rate-limit.ts`:

```typescript
export const rateLimit = vi.fn(() => ({ allowed: true, remaining: 19 }))
```

---

### Feature 8: Visual Regression Tests — TEST-11

**Integration point:** Playwright already configured with `chromium` project and `playwright/.auth/user.json` auth state. Visual regression uses `page.toHaveScreenshot()` — no new dependencies.

**New Playwright project in `playwright.config.ts`:**

```typescript
{
  name: 'visual',
  testMatch: /visual\/.*\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.auth/user.json',
  },
  dependencies: ['setup'],
}
```

**New test files:**

```
e2e/visual/
  admin-overview.spec.ts        ← Admin dashboard overview
  admin-billing.spec.ts         ← MRR chart (mask chart values)
  portal-dashboard.spec.ts      ← Client portal home
  portal-notifications.spec.ts  ← Notification preferences toggles
  portal-security.spec.ts       ← 2FA enrollment page
  login.spec.ts                 ← Login page (no auth required)
```

**Standard visual test pattern:**

```typescript
test('admin overview matches snapshot', async ({ page }) => {
  await page.goto('/en/admin')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('admin-overview.png', {
    mask: [
      page.locator('[data-testid="timestamp"]'),
      page.locator('[data-testid="live-metric"]'),
    ],
    maxDiffPixels: 50,
  })
})
```

**Baseline update:**

```bash
# Generate initial baselines (run once):
playwright test --project=visual --update-snapshots

# Review diffs after UI changes:
playwright show-report
```

**Critical: mask dynamic content.** Timestamps, MRR chart values, notification counts, and any data that changes between runs must be masked. Chart areas should be masked entirely for the MRR chart, or seed deterministic test data via `scripts/seed-demo.js` before visual runs.

---

## Data Flow Diagrams

### 2FA Login Flow

```
User submits password
  → aal1 session established
  → middleware: getAuthenticatorAssuranceLevel()
      nextLevel === 'aal2' && currentLevel !== 'aal2'?
        YES → redirect /mfa-verify
        NO  → allow to /portal
  → /mfa-verify: user enters TOTP
      → challenge({ factorId }) → verify({ factorId, challengeId, code })
      → aal2 session established
      → redirect /portal
```

### Weekly Digest Flow

```
Vercel Cron (Monday 09:00 UTC)
  → GET /api/cron/digest
  → validate CRON_SECRET
  → digest.ts:
      for each active client:
        for each user:
          check user_notification_prefs (email_digest_weekly)
          if enabled:
            query tasks + weekly_metrics for that client
            sendEmail(WeeklyDigestEmail)
  → return { sent: N, skipped: M }
```

### Admin Invite Flow

```
Admin: POST /api/admin/users { email, role, client_id }
  → verify admin role (userClient)
  → serviceClient.auth.admin.inviteUserByEmail(email, { data: { role, client_id } })
  → INSERT user_invitations
  → Supabase sends invite email

User clicks link
  → Supabase handles redirect + password set
  → users row created (role from metadata)
  → UPDATE user_invitations SET accepted_at = NOW()
```

### MRR Chart Data Flow

```
Admin visits /admin/billing
  → Server component fetches subscriptions from Supabase
  → Aggregates price_monthly per month (12-month window)
  → Passes mrrData[] as props to <MRRChart /> (client component)
  → Recharts renders AreaChart in browser
```

---

## Recommended Project Structure (Delta — v1.2 additions only)

```
platform/
├── vercel.json                          ← NEW — cron schedule config
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   │   ├── route.ts         ← NEW: GET list, POST invite
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts     ← NEW: PATCH role/deactivate
│   │   │   │   └── mrr/
│   │   │   │       └── route.ts         ← OPTIONAL: if extracting MRR query to API
│   │   │   └── cron/
│   │   │       └── digest/
│   │   │           └── route.ts         ← NEW: CRON_SECRET guarded GET
│   │   └── [locale]/
│   │       ├── admin/
│   │       │   └── users/
│   │       │       └── page.tsx         ← NEW: user management UI
│   │       ├── portal/
│   │       │   ├── security/
│   │       │   │   └── page.tsx         ← NEW: 2FA enrollment
│   │       │   └── notifications/
│   │       │       └── page.tsx         ← NEW: notification preference toggles
│   │       └── mfa-verify/
│   │           └── page.tsx             ← NEW: TOTP challenge screen
│   ├── components/
│   │   └── MRRChart.tsx                 ← NEW: 'use client' Recharts wrapper
│   ├── lib/
│   │   ├── mfa.ts                       ← NEW: TOTP enroll/verify/unenroll
│   │   ├── rate-limit.ts                ← NEW: in-memory sliding window
│   │   ├── digest.ts                    ← NEW: weekly digest logic
│   │   └── emails/
│   │       └── WeeklyDigestEmail.tsx    ← NEW: React Email template
│   └── __tests__/
│       └── api/
│           ├── checkout.test.ts         ← NEW
│           ├── billing-portal.test.ts   ← NEW
│           ├── tasks.test.ts            ← NEW
│           ├── admin-users.test.ts      ← NEW
│           └── cron-digest.test.ts      ← NEW
├── supabase/
│   └── migrations/
│       ├── 005_notification_prefs.sql   ← NEW
│       └── 006_user_invitations.sql     ← NEW
└── e2e/
    └── visual/
        ├── admin-overview.spec.ts        ← NEW
        ├── admin-billing.spec.ts         ← NEW
        ├── portal-dashboard.spec.ts      ← NEW
        ├── portal-notifications.spec.ts  ← NEW
        └── portal-security.spec.ts       ← NEW
```

---

## Architectural Patterns

### Pattern 1: Additive Middleware Guard

**What:** Append a new auth check to existing middleware by appending logic after the existing checks. Each guard returns early if its condition does not apply; otherwise falls through.

**When to use:** Adding the MFA AAL2 check without restructuring the existing locale + session + role guards.

**Trade-offs:** `getAuthenticatorAssuranceLevel()` is a local JWT inspection (no network call) when the session is cached — documented as microsecond-fast. Safe to call on every protected request.

### Pattern 2: Service Client for Privileged Admin Operations

**What:** All `/api/admin/*` route handlers follow a two-client pattern: (1) use `createServerSupabase()` (cookie-based, respects RLS) to verify the caller's role, then (2) use `createServiceClient()` (service role, bypasses RLS) for the privileged operation.

**When to use:** Any time an admin needs to write data on behalf of another user, or use Supabase Admin API methods. Never use service client for reads that should be scoped to the caller.

**Trade-offs:** Service role bypasses all RLS. Every admin route must do its own explicit authorization check. Treat the service client as a loaded gun — verify intent before use.

### Pattern 3: CRON_SECRET Gate

**What:** Vercel injects `Authorization: Bearer $CRON_SECRET` on cron-triggered requests. The handler validates this before executing.

**When to use:** All `/api/cron/*` routes. Also allows manual testing locally by providing the header.

**Trade-offs:** The secret must be added to Vercel's environment variables. Rotate it if it leaks. Anyone with the secret can trigger the job, so treat it with the same care as a service account key.

### Pattern 4: Preference-Aware Notification Filtering

**What:** Before each channel send inside `notifyTaskEvent`, look up `user_notification_prefs` for the recipient. Treat a missing row as all-enabled (null-coalescing to `true`).

**When to use:** Every new notification channel should follow this same gate. The `user_notification_prefs` table is the single source of truth for per-user, per-channel opt-outs.

**Trade-offs:** One extra DB query per recipient per event. Acceptable at current scale. If the recipient list grows (fan-out to 50+ users), fetch all prefs in a single `IN` query before the loop.

### Pattern 5: Server-Fetched, Client-Rendered Chart

**What:** Server component fetches and aggregates raw subscription data, passes as serializable props to a `'use client'` chart component.

**When to use:** Any visualization using Recharts, Chart.js, or other browser-API-dependent charting libraries inside a Next.js App Router page.

**Trade-offs:** Separates data fetching (server) from rendering (client). Means the chart cannot update in real time without adding a client-side fetch or SWR hook, but for an admin billing chart that changes monthly, static render is sufficient.

---

## Build Order — Dependency Graph

```
[SEC-02] Rate Limiting        ← No deps. Touches only existing routes.
     ↓ (parallel OK)
[SEC-01] 2FA / TOTP           ← No deps. Middleware change is additive.
     ↓
[NOTIF-11] Notification Prefs ← Migration + UI. No deps.
     ↓
[NOTIF-10] Weekly Digest      ← Depends on NOTIF-11 (pref table for filter)
     ↓ (parallel OK)
[ADMIN-07] User Management    ← No deps. New routes + page.
     ↓ (parallel OK)
[ADMIN-08] MRR Chart          ← No deps. Data already in DB, Recharts already installed.
     ↓
[TEST-10] Integration Tests   ← Depends on all API routes being complete.
     ↓
[TEST-11] Visual Regression   ← Depends on all UI pages being complete.
```

**Recommended phase grouping:**

| Phase | Features | Rationale |
|-------|----------|-----------|
| 1 | SEC-02 rate limiting | Isolated change to existing routes, lowest risk |
| 2 | SEC-01 2FA/TOTP | Middleware change; needs clean state from Phase 1 |
| 3 | NOTIF-11 prefs + NOTIF-10 digest | Sequential: prefs migration before digest preference filter |
| 4 | ADMIN-07 user mgmt + ADMIN-08 MRR chart | Independent of each other; can parallelize within phase |
| 5 | TEST-10 integration tests + TEST-11 visual regression | Must come last; tests stable features |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (< 20 users, < 20 clients) | In-memory rate limiter is fine. Digest loops in-process. MRR aggregation in-process. |
| 100 users / 100 clients | Replace Map-based rate limiter with `@upstash/ratelimit` + Vercel KV. Digest loop can still run in-process (< 100 emails in one cron invocation). |
| 1,000+ users | Move digest to Trigger.dev or Inngest (background job with retries). Rate limiting at Edge middleware. MRR chart switches to a precomputed materialized view. |

---

## Anti-Patterns

### Anti-Pattern 1: Calling Service Client from Middleware

**What people do:** Use `createServiceClient()` in `middleware.ts` to bypass RLS for role checks.

**Why it's wrong:** Middleware runs on the Vercel Edge Runtime. The service role key must remain server-only. Embedding it in middleware exposes it to the edge context and can cause configuration errors. The existing middleware uses `createServerClient` with the anon key — this is correct.

**Do this instead:** Keep service client usage inside `/api/*` route handlers only. The existing middleware role check (`supabase.from('users').select('role')` with the anon key) is sufficient because RLS allows authenticated users to read their own `users` row.

### Anti-Pattern 2: Calling Admin API from Client Components

**What people do:** Call `supabase.auth.admin.inviteUserByEmail` directly in a client component using `createClient()`.

**Why it's wrong:** Admin API methods require the service role key. The anon key returns 403. These methods must always go through an API route that uses `createServiceClient()`.

**Do this instead:** POST to `/api/admin/users` from the admin page's form submit handler. The route handler verifies the caller's role, then uses `createServiceClient()` for the invite operation.

### Anti-Pattern 3: Skipping AAL Check on Protected Routes

**What people do:** Only check MFA enrollment at login time; skip `getAuthenticatorAssuranceLevel()` in middleware.

**Why it's wrong:** If a user's session is refreshed without completing the MFA challenge (e.g., via token refresh), they bypass 2FA on subsequent requests.

**Do this instead:** Call `getAuthenticatorAssuranceLevel()` in middleware on every request to `/portal` and `/admin`. It is a local JWT inspection — no latency cost.

### Anti-Pattern 4: Recharts Directly in Server Components

**What people do:** Import `{ AreaChart }` from `'recharts'` inside a `page.tsx` or `layout.tsx` without `'use client'`.

**Why it's wrong:** Recharts uses `window` and DOM APIs. Server-side rendering throws: `ReferenceError: window is not defined`.

**Do this instead:** Isolate all Recharts imports in a dedicated `'use client'` component (`<MRRChart />`). The server component fetches data and passes it as props. The client component handles rendering.

### Anti-Pattern 5: Visual Tests Against Live Data

**What people do:** Take screenshots of pages showing live DB values (task counts, timestamps, MRR numbers) and compare against a baseline.

**Why it's wrong:** Tests fail on every data change, even when the UI is correct. This makes visual tests noisy and teams start ignoring failures.

**Do this instead:** Use `mask: [locator]` to hide dynamic regions, or seed deterministic fixture data before running visual tests.

---

## Integration Points

### External Services

| Service | Existing Integration | v1.2 Change |
|---------|---------------------|-------------|
| Supabase Auth | `@supabase/ssr` session management | Add MFA API: `mfa.enroll`, `mfa.challenge`, `mfa.verify`, `mfa.getAuthenticatorAssuranceLevel` |
| Supabase Admin API | `createServiceClient()` for RLS bypass | Add `auth.admin.inviteUserByEmail`, `auth.admin.updateUserById` |
| Supabase Postgres | 13 existing tables + RLS | Add 2 tables: `user_notification_prefs`, `user_invitations` |
| Resend | `sendEmail()` in `lib/email.ts` | Add `WeeklyDigestEmail` template; called from `digest.ts` |
| Stripe | Checkout, billing portal, webhooks | No change — MRR reads from local `subscriptions` table |
| Vercel Cron | Not present | Add `vercel.json` crons config; one job: Monday 09:00 UTC |
| Recharts | Already installed in package.json | Add `<MRRChart />` client component using `AreaChart` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `middleware.ts` ↔ Supabase Auth | SDK `getAuthenticatorAssuranceLevel()` | Add after existing role check; local JWT inspection, no network |
| `notifyTaskEvent` ↔ `user_notification_prefs` | Supabase query per recipient | Null pref row = all channels enabled; treat as opt-out model |
| `/api/admin/*` ↔ Supabase Admin API | `createServiceClient()` | Must verify caller role first via `createServerSupabase()` |
| `/api/cron/digest` ↔ `digest.ts` | Function call | Logic separated from handler for unit testability |
| `<MRRChart />` ↔ server page | Props (serialized array) | Server fetches + aggregates; client renders — no client-side fetch needed |
| Integration tests ↔ route handlers | `next-test-api-route-handler` | Tests use mocked `@/lib/supabase/server` and `@/lib/stripe` |

---

## Sources

- [Supabase TOTP MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa/totp) — HIGH confidence, official docs
- [Supabase Auth MFA JavaScript API Reference](https://supabase.com/docs/reference/javascript/auth-mfa-api) — HIGH confidence, official docs
- [Supabase Admin inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — HIGH confidence, official docs
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) — HIGH confidence, official docs
- [Vercel Managing Cron Jobs (CRON_SECRET)](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — HIGH confidence, official docs; CRON_SECRET pattern confirmed with code example
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) — HIGH confidence, official Playwright docs
- [next-test-api-route-handler GitHub](https://github.com/Xunnamius/next-test-api-route-handler) — MEDIUM confidence; actively maintained, Next.js 15 App Router support confirmed in README
- Recharts `package.json` — HIGH confidence; already installed at `^2.13.3`, verified in codebase
- `subscriptions.price_monthly` + `started_at` + `cancelled_at` — HIGH confidence; confirmed in `001_schema.sql`

---

*Architecture research for: Vantix Platform v1.2 — 2FA, rate limiting, digest, notification prefs, admin user mgmt, MRR chart, integration tests, visual regression*
*Researched: 2026-03-25*
