# Stack Research

**Domain:** SaaS platform — Security & Polish milestone (v1.2)
**Researched:** 2026-03-25
**Confidence:** HIGH (Supabase MFA, Vercel Cron, Playwright built-in visual regression) / MEDIUM (Upstash free-tier specifics, NTARH Next.js 15 exact compatibility)

---

## Context: What Already Exists

These are installed and working in `platform/package.json`. Do NOT re-add or research them for v1.2.

| Already Installed | Notes |
|-------------------|-------|
| `@supabase/supabase-js ^2.47.0` | MFA API (`auth.mfa.*`) lives on this client |
| `@supabase/ssr ^0.9.0` | Server client for Route Handlers and middleware |
| `recharts ^2.13.3` | Already present — use for MRR chart as-is |
| `@playwright/test ^1.58.2` | Visual regression built in via `toHaveScreenshot()` |
| `vitest ^4.1.1` | Integration test runner |
| `resend ^6.9.4` | Email delivery for weekly digest |
| `@react-email/components ^1.0.10` | Email templates for digest |
| `@react-email/render ^2.0.4` | Renders React Email to HTML string |
| `date-fns ^4.1.0` | Date formatting for digest content |
| `next 14.2.18` | App Router — NTARH v4 requires next >= 14.0.4, satisfied |

---

## New Dependencies Required

### Core Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@upstash/ratelimit` | `^2.0.8` | Sliding-window / fixed-window rate limits on API routes | Only connectionless (HTTP-based) rate limiter designed for Vercel serverless. State lives in external Redis — survives cold starts and is shared across all function instances. `lru-cache` resets per-instance and is not shared, making it trivially bypassable under concurrent load. |
| `@upstash/redis` | `^1.34.x` (latest) | HTTP Redis client — required peer dep for `@upstash/ratelimit` | HTTP-based, no persistent TCP connection. Works identically in Edge runtime and Node.js serverless. Cannot substitute `ioredis` (different interface). |
| `next-test-api-route-handler` | `^4.x` (latest) | Integration-test App Router route handlers in isolation with Vitest | Purpose-built for Next.js App Router. Runs actual route handler code in a Next.js-like environment without a full dev server. Supports App Router since v4 (requires next >= 14.0.4 — satisfied). Pairs with existing Vitest. |
| `msw` | `^2.x` (latest) | Mock external HTTP calls during integration tests | Intercepts `fetch` at the network boundary in Node.js via `setupServer` from `msw/node`. Allows stubbing Supabase REST, Stripe, Resend without changing production code. Pairs with `next-test-api-route-handler`. |

### No Additional Install Required

| Feature | Why No New Package Needed |
|---------|--------------------------|
| **TOTP / 2FA enrollment** | `supabase.auth.mfa.enroll()` returns a QR code as an SVG string directly. Render as `<img src={\`data:image/svg+xml;utf8,${encodeURIComponent(qr)}\`}>`. No qrcode library needed. |
| **TOTP challenge + verify** | `supabase.auth.mfa.challenge()` + `supabase.auth.mfa.verify()` — all on existing `@supabase/supabase-js`. |
| **AAL2 enforcement in middleware** | `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` in `middleware.ts`. Redirect to `/mfa-verify` if `nextLevel === 'aal2'` and current is `aal1`. |
| **Weekly email digest** | Vercel Cron (`vercel.json`) issues a GET to `/api/cron/digest`. Route handler uses existing Resend + React Email. No worker process or job queue. |
| **Notification preferences** | Supabase Postgres column (JSONB or per-type boolean columns) on `users` or separate `notification_preferences` table. Read/write via existing Supabase service client. |
| **Admin user management** | `supabase.auth.admin.inviteUserByEmail()`, `supabase.auth.admin.updateUserById()`, `supabase.auth.admin.deleteUser()` — all on `createServiceClient()` which already uses the service role key. |
| **MRR trend chart** | `recharts ^2.13.3` already installed. Use `<AreaChart>` or `<LineChart>` with `"use client"` directive. Query Stripe `subscriptions` or existing `subscriptions` table. |
| **Playwright visual regression** | `toHaveScreenshot()` is built into `@playwright/test` since v1.26. No snapshot plugin needed. Baselines stored in `__snapshots__` beside test files. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@upstash/ratelimit` | `^2.0.8` | API rate limiting | Wrap any route handler accepting unauthenticated or auth-sensitive input: login, invite, password reset, checkout. Skip on webhook routes (Stripe/Supabase verify signatures). |
| `@upstash/redis` | `^1.34.x` | HTTP Redis client | Peer dep for `@upstash/ratelimit`. Provision one free-tier Upstash database (10k req/day, 256 MB). |
| `next-test-api-route-handler` | `^4.x` | Integration test route handlers | Target: `/api/checkout`, `/api/billing-portal`, `/api/tasks`, `/api/cron/digest`. |
| `msw` | `^2.x` | Mock HTTP in tests | Stub Supabase REST, Stripe API, Resend in integration tests. Use `http` namespace (v2 breaking change from v1's `rest`). |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `vercel.json` (project config) | Declare cron schedule for weekly digest | `"crons": [{"path": "/api/cron/digest", "schedule": "0 9 * * 1"}]` — Mondays 9am UTC. Hobby plan: once/day max. Pro plan: any frequency. |
| Upstash Console (upstash.com) | Provision serverless Redis | Free tier: 10k req/day, 256 MB. Sufficient for rate limiting a small-scale SaaS. No credit card required. |

---

## Installation

```bash
# Rate limiting (2 packages — always install together)
npm install @upstash/ratelimit @upstash/redis

# Integration test tooling (dev only)
npm install -D next-test-api-route-handler msw
```

Environment variables to add to `.env.local` and Vercel dashboard:

```bash
# Upstash Redis — get from console.upstash.com after creating a database
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# Vercel Cron auth — generate with: openssl rand -base64 32
CRON_SECRET=your-random-secret-here
```

The weekly digest route handler must check:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

Vercel automatically sends this header when invoking cron jobs.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@upstash/ratelimit` + Upstash Redis | `lru-cache` in-process rate limiter | Only viable if self-hosting with a persistent Node.js process. On Vercel, multiple serverless instances run simultaneously with isolated memory — `lru-cache` limits are not globally enforced. Abuse bypasses limits by hitting different cold instances. |
| `@upstash/ratelimit` + Upstash Redis | `ioredis` + Vercel KV | Vercel KV is backed by Upstash under the hood. Using `@upstash/ratelimit` directly gives a purpose-built API (`ratelimit.limit(identifier)`) vs. writing raw Redis commands. Choose Vercel KV only if the team prefers managing keys via the Vercel dashboard. |
| `next-test-api-route-handler` | Supertest + custom HTTP server | NTARH is purpose-built for Next.js App Router route handlers. Supertest requires spinning up a real HTTP server and doesn't understand route handler conventions, dynamic segments, or middleware. More setup, less accurate to production. |
| `msw` v2 | `vi.mock()` module mocking | Module mocking couples test assertions to implementation details (which internal function was called). MSW mocks at the network boundary — production code runs unchanged. Correct choice for integration tests. `vi.mock()` remains correct for unit tests of individual functions. |
| Vercel Cron (`vercel.json`) | `node-cron`, `agenda`, `bull` | External job queues add infrastructure (Redis worker process, queue UI) incompatible with Vercel's stateless serverless model. Vercel Cron is zero-infrastructure — a GET request to an existing route handler. Sufficient for a weekly digest. |
| Supabase built-in MFA API | `speakeasy` + `otplib` + `qrcode` | Supabase handles TOTP secret generation, QR code SVG, challenge/verify lifecycle, and AAL session upgrade entirely. Rolling your own means duplicating what Supabase already provides — and diverging from its session model introduces security risk. |
| Playwright `toHaveScreenshot()` | `pixelmatch` + custom diffing | `toHaveScreenshot()` is fully integrated: generates baseline on first run, diffs on subsequent runs, produces expected/actual/diff images in `test-results/` on failure. No configuration needed. A standalone `pixelmatch` setup requires custom tooling around the same capability. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `speakeasy` or `otplib` for TOTP | Supabase Auth manages the full MFA lifecycle. Adding a separate TOTP library creates duplication and risks diverging from Supabase's session/AAL model — a security vulnerability surface. | `supabase.auth.mfa.*` APIs on existing client |
| `qrcode` or `qrcode.react` | Supabase `mfa.enroll()` returns an SVG QR code string. No generation library needed. | Render `totp.qr_code` as `<img src={\`data:image/svg+xml;utf8,${encodeURIComponent(qr)}\`}>` |
| `lru-cache` for API rate limiting | State is per-process instance. On Vercel serverless, multiple function instances run simultaneously with isolated memory. Limits are not globally enforced — abuse bypasses them by hitting different instances. | `@upstash/ratelimit` + Upstash Redis |
| `node-cron` / `agenda` / `bull` | Require persistent worker processes incompatible with Vercel's stateless serverless model. | Vercel Cron (`vercel.json`) calling existing route handlers |
| `playwright-visual-regression` (any 3rd-party) | Redundant — `@playwright/test` has `toHaveScreenshot()` built in since v1.26. The platform is on v1.58.2. | `expect(page).toHaveScreenshot()` — no install needed |
| Upgrading `recharts` to v3 mid-milestone | If recharts v3 exists it would be a major version with breaking API changes. The platform has v2.13.3 locked and working. | Use existing `recharts ^2.13.3` for MRR chart |
| `msw` v1 | MSW v1 uses the `rest` import namespace. MSW v2 (current) uses `http`. If you pin v1 and the team adds v2 tooling later, there's a namespace conflict. Install v2 from the start. | `msw ^2.x` |

---

## Stack Patterns by Variant

**If on Vercel Hobby plan:**
- Cron jobs limited to once per day maximum
- Weekly digest: `"schedule": "0 9 * * 1"` (Monday 9am UTC) — once/day and within limit
- Daily digest frequency requires Pro plan upgrade

**If on Vercel Pro plan:**
- Any cron frequency supported (down to per-minute)
- Consider separate schedules: weekly summary digest + daily activity digest

**Rate limiting — choose algorithm by route type:**
- Login / invite / password reset: `slidingWindow(5, '15 m')` per IP — prevents credential stuffing
- General authenticated API routes: `fixedWindow(60, '1 m')` per user ID — prevents runaway automation
- Webhook routes (`/api/webhooks/stripe`): skip rate limiting — Stripe signature verification is the auth mechanism

**2FA AAL2 enforcement — scope by route sensitivity:**
- Admin routes (user management, role changes, billing actions): enforce AAL2
- Client portal routes (view tasks, reports, tutorials): AAL1 (email/password) is sufficient
- Pattern: in `middleware.ts`, check `getAuthenticatorAssuranceLevel()`, redirect to `/mfa-verify` if `nextLevel === 'aal2'` and current is `aal1`

**MSW setup pattern for integration tests (Node.js):**
- Import `setupServer` from `msw/node` (not `msw/browser`)
- Call `server.listen()` in `beforeAll`, `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll`
- Register as `setupFiles` in `vitest.config.ts`

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@upstash/ratelimit ^2.0.8` | `@upstash/redis ^1.x` | v2 ratelimit requires `@upstash/redis` v1 client — not `ioredis`. |
| `next-test-api-route-handler ^4.x` | `next ^14.0.4+`, `vitest ^4.x` | NTARH v4 supports App Router. In Next.js 15, route handler `params` is a Promise — use `await params` inside tests. |
| `msw ^2.x` | `vitest ^4.x` | MSW v2 uses `http` import (not `rest`). Use `setupServer` from `msw/node` for Vitest Node.js environment. Incompatible with `bun test` — use `npm test`. |
| `recharts ^2.13.3` | `react ^18.3.1` | Already installed. No upgrade needed for MRR chart. Requires `"use client"` directive on any component using Recharts primitives. |
| `@playwright/test ^1.58.2` | `toHaveScreenshot()` | Built-in since v1.26. Baselines stored in `__snapshots__/` beside test files. First run generates baseline; subsequent runs diff. |
| `@supabase/supabase-js ^2.47.0` | MFA API (`auth.mfa.*`) | Free and enabled by default on all Supabase projects. Must be enabled in Supabase Dashboard > Authentication > MFA before enrollment API calls work. |

---

## Sources

- [Supabase TOTP MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa/totp) — enrollment flow, QR SVG return value, AAL levels confirmed. No extra npm package needed. HIGH confidence.
- [Supabase MFA API Reference](https://supabase.com/docs/reference/javascript/auth-mfa-api) — enroll/challenge/verify/getAuthenticatorAssuranceLevel method signatures. HIGH confidence.
- [@upstash/ratelimit npm](https://www.npmjs.com/package/@upstash/ratelimit) — v2.0.8, published ~2 months ago, actively maintained. HIGH confidence.
- [upstash/ratelimit-js GitHub](https://github.com/upstash/ratelimit-js) — Next.js middleware example confirmed, sliding window algorithm. HIGH confidence.
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs) — `vercel.json` format, CRON_SECRET pattern, `vercel-cron/1.0` user agent. HIGH confidence.
- [Vercel Cron Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) — Hobby: once/day max; Pro: per-minute; max 100 cron jobs/project. HIGH confidence.
- [Playwright Visual Comparisons Docs](https://playwright.dev/docs/test-snapshots) — `toHaveScreenshot()` built-in, no external library. HIGH confidence.
- [next-test-api-route-handler GitHub](https://github.com/Xunnamius/next-test-api-route-handler) — v4 App Router support confirmed for next >= 14.0.4; Next.js 15 params-as-Promise caveat noted. MEDIUM confidence (no explicit v4 + Next.js 15 confirmation found).
- [MSW Quick Start](https://mswjs.io/docs/quick-start/) — v2 Node.js integration, `setupServer` from `msw/node`. HIGH confidence.
- [Upstash Ratelimit + Next.js 2026](https://noqta.tn/en/tutorials/upstash-redis-nextjs-rate-limiting-caching-2026) — Community tutorial confirming current patterns. MEDIUM confidence.

---

*Stack research for: Vantix Platform v1.2 — Security & Polish (2FA, Rate Limiting, Cron Digest, Admin Mgmt, MRR Chart, Integration + Visual Regression Tests)*
*Researched: 2026-03-25*
