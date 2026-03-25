# Project Research Summary

**Project:** Vantix Platform v1.2 — Security & Polish
**Domain:** B2B SRE/performance client portal (Next.js 15 + Supabase)
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

Vantix v1.2 is an incremental hardening milestone layered on top of a fully-operational v1.1 platform. The platform already ships email/password auth, a 4-role system, task CRUD, file uploads, in-app and email notifications, Stripe billing, and both Vitest and Playwright test infrastructure. The 8 new features — TOTP 2FA, API rate limiting, weekly email digest, notification preferences, admin user management, an MRR trend chart, API integration tests, and Playwright visual regression — must slot into the existing architecture without new infrastructure layers or rewrites. The recommended approach is additive integration: each feature modifies or extends existing files at precise integration points rather than introducing new patterns.

The critical sequencing insight from cross-research synthesis is that features have hard dependencies that determine safe build order. Notification preferences (NOTIF-11) must be built before the weekly digest (NOTIF-10) or the digest will send emails to users who later opt out. The TOTP 2FA feature (SEC-01) must ship before admin user management (ADMIN-07) so newly invited users encounter the enrollment flow on first login. Rate limiting (SEC-02) is dependency-free and should ship first as an immediate protective layer on existing routes. Visual regression tests (TEST-11) require the MRR chart (ADMIN-08) to exist before baselines can be captured, placing them last.

The principal risks are architectural, not implementation complexity. Rate limiting with an in-memory Map provides zero protection on Vercel serverless — Upstash Redis is mandatory. MFA middleware that only checks whether a user is authenticated (not their AAL level) leaves enrolled users permanently bypassed. Playwright baselines committed from a macOS machine will fail CI on every PR due to font rendering differences. All three of these failure modes look correct during local development and only surface in production or CI — making early prevention critical.

---

## Key Findings

### Recommended Stack

The v1.2 stack requires only 4 new packages on top of what is already installed. `@upstash/ratelimit` and `@upstash/redis` are the only viable rate-limiting pair for Vercel serverless — in-memory alternatives are explicitly disqualified by the serverless execution model. `next-test-api-route-handler` v4 (NTARH) is the purpose-built integration test tool for Next.js App Router route handlers and pairs with the existing Vitest setup. `msw` v2 provides network-layer mocking for external HTTP calls (Supabase REST, Stripe, Resend) without coupling tests to implementation details.

Everything else — TOTP 2FA, visual regression, weekly digest, notification preferences, admin operations, and the MRR chart — is delivered entirely by packages already installed: `@supabase/supabase-js`, `@playwright/test`, `resend`, `@react-email/components`, and `recharts`.

**Core technologies:**
- `@upstash/ratelimit ^2.0.8` + `@upstash/redis ^1.34.x`: shared serverless-safe rate limiting — the only architecture that enforces limits across concurrent Vercel function instances
- `next-test-api-route-handler ^4.x`: integration test App Router route handlers with real request/response objects — must be first import in every test file
- `msw ^2.x`: network-boundary mocking in Node.js; use `http` namespace (v2 breaking change from v1's `rest`); `setupServer` from `msw/node`
- `supabase.auth.mfa.*` APIs (existing `@supabase/supabase-js`): full TOTP lifecycle — enroll (returns QR SVG), challenge, verify, AAL level check; no TOTP library needed
- `toHaveScreenshot()` (existing `@playwright/test ^1.58.2`): built-in visual regression since v1.26; no snapshot plugin needed
- Vercel Cron via `vercel.json`: zero-infrastructure weekly digest trigger; compatible with Hobby plan at weekly frequency

**Critical version notes:**
- `@upstash/ratelimit ^2.x` requires `@upstash/redis ^1.x` — incompatible with `ioredis`
- NTARH v4 requires `next >= 14.0.4` (satisfied); in Next.js 15, `params` is a Promise — use `await params` in tests
- MSW v2: always use `msw/node` for Vitest; incompatible with `bun test`

### Expected Features

**Must have (table stakes for v1.2):**
- SEC-02: Rate limiting on auth and API routes — absent rate limiting is a red flag on security reviews
- NOTIF-11: Notification preferences per type — now that multiple channels exist, users expect noise control
- SEC-01: TOTP two-factor authentication — B2B enterprise clients mandate 2FA; trust gap without it
- ADMIN-07: Admin user management (invite, role change, deactivate) — ops cannot rely on the Supabase dashboard
- NOTIF-10: Weekly email digest — proactive async communication differentiates Vantix from typical consulting firms
- ADMIN-08: Admin MRR trend chart — trend visibility over the existing point-in-time stat card
- TEST-10: API integration tests — unit tests mock everything; integration tests verify real route handler behavior
- TEST-11: Playwright visual regression — catches layout regressions unit and integration tests cannot detect

**Defer to v1.3+:**
- MRR chart subscription overlay (new/cancelled markers) — add complexity after the core chart proves useful
- Admin-assisted 2FA unenrollment UI — promote when first support request occurs; Supabase dashboard is sufficient now
- Per-user digest schedule (timezone-aware) — revisit when client count exceeds 50

**Defer to v2+:**
- SMS/phone 2FA — only if an enterprise client explicitly mandates it; TOTP covers the use case free
- Notification CMS (templates, scheduling) — only if Vantix white-labels the portal
- Recovery codes for 2FA — admin-assisted unenroll via Supabase dashboard is sufficient at current team size

**Anti-features (explicitly excluded):**
- In-memory rate limiting — broken by design on Vercel serverless; never acceptable in production
- `speakeasy`/`otplib` for TOTP — Supabase handles the full MFA lifecycle; adding separate libraries creates divergence from the session/AAL model, a security vulnerability surface
- `qrcode` or `qrcode.react` — Supabase `mfa.enroll()` returns an SVG QR code string directly; no generation library needed
- `node-cron` / `agenda` / `bull` — require persistent worker processes incompatible with Vercel's stateless model
- Visual regression against external services (Grafana embed, Stripe portal) — mask or skip iframes; test first-party UI only

### Architecture Approach

The v1.2 architecture follows a strict additive integration pattern. All 8 features extend existing files at well-defined integration points: the middleware gains an AAL2 gate appended after its existing role guard; `lib/notifications.ts` gains a preference lookup before each channel send; existing API routes each gain a rate limiter call at their top. No new architectural layers are introduced. New files are either isolated library modules (`lib/mfa.ts`, `lib/digest.ts`, `lib/rate-limit.ts`) or new pages/routes in the established App Router structure.

**Major components:**
1. `src/middleware.ts` (MODIFIED) — AAL2 MFA check appended after existing role guard; `getAuthenticatorAssuranceLevel()` reads JWT claims locally with zero network round-trips
2. `src/lib/rate-limit.ts` (NEW) — Upstash sliding-window rate limiter; `Ratelimit` instance declared at module level for warm-invocation cache reuse; called at top of each protected route
3. `src/lib/notifications.ts` (MODIFIED) — preference lookup via `user_notification_prefs` LEFT JOIN before each channel send; null row defaults to all-enabled (opt-out model)
4. `src/lib/mfa.ts` (NEW) — TOTP enroll/challenge/verify wrappers; enrollment page calls `listFactors()` + `unenroll()` any unverified factors before `enroll()`
5. `src/app/api/cron/digest/route.ts` (NEW) — CRON_SECRET-gated GET handler; digest logic in `lib/digest.ts`; parallel sends via `Promise.allSettled()`
6. `src/app/api/admin/users/` routes (NEW) — all routes verify caller role server-side via `createServerSupabase()` before using `createServiceClient()` for privileged operations
7. Two new DB migrations — `005_notification_prefs.sql` (one row per user with boolean columns, not one row per user+type) and `006_user_invitations.sql` (invite tracking)
8. `vercel.json` (NEW) — cron schedule `0 9 * * 1` (Monday 09:00 UTC); Vercel injects CRON_SECRET header automatically on trigger

### Critical Pitfalls

1. **2FA middleware bypass** — Adding TOTP enrollment without updating `middleware.ts` to check AAL level leaves all enrolled users permanently at `aal1`; MFA exists in DB but is never enforced. Prevention: middleware must call `getAuthenticatorAssuranceLevel()` and redirect to `/mfa-verify` when `nextLevel === 'aal2' && currentLevel !== 'aal2'`.

2. **Non-MFA user login loop** — Incorrect middleware condition (`currentLevel !== 'aal2'` without also checking `nextLevel === 'aal2'`) redirects users with no enrolled factor to the MFA challenge page, locking them out. Prevention: the correct compound condition is required; E2E tests must cover three states — no MFA enrolled, MFA enrolled but not challenged, MFA enrolled and challenged.

3. **In-memory rate limiting on Vercel** — Module-level `Map`/`LRU` for rate limit state works locally (single process) but provides zero protection on Vercel (each serverless invocation has isolated memory). Prevention: Upstash Redis is mandatory; declare `Ratelimit` instance at module level for cache reuse across warm invocations.

4. **Unverified TOTP factors accumulate** — Abandoned enrollment flows leave unverified factors in `auth.mfa_factors`; hard limit of 10 per user; after 10 abandonments, MFA enrollment is permanently broken for that user. Prevention: always call `listFactors()` and `unenroll()` any factors with `status === 'unverified'` before `enroll()`; never use user email as `friendlyName` (uniqueness constraint causes 500 on re-enrollment).

5. **Digest sequential send timeout** — `for...await` loop over all recipients times out on Vercel (60s Pro, 10s Hobby) for any non-trivial user list; partial sends with no retry or visibility. Prevention: use `Promise.allSettled()` to parallelize all sends; log failed sends individually.

6. **Notification preferences not enforced at send time** — Building the preferences UI without updating `notifyTaskEvent()` in `lib/notifications.ts` means opt-outs save to the DB but emails still fire. Prevention: modify the orchestrator in the same task as building the UI, never defer.

7. **Orphaned auth accounts from invite** — `inviteUserByEmail()` creates `auth.users` row; if public profile creation fails, the user accepts the invite and the portal breaks. Prevention: use a Supabase database trigger on `auth.users` INSERT to auto-create the public profile row; never rely on application code for this.

8. **Playwright CI baseline mismatch** — Baselines generated on macOS fail on CI Linux due to font rendering differences; CI fails every PR. Prevention: generate and commit baselines from the CI environment only; set `maxDiffPixels: 50` or `threshold: 0.05`; mask dynamic elements; disable CSS animations before capture.

9. **MRR chart overstating revenue** — Querying `subscriptions.price_monthly WHERE status = 'active'` counts `cancel_at_period_end = true` subscriptions as active MRR. Prevention: add `cancel_at_period_end` column via migration before writing chart code; use `payments` table as ground truth for historical MRR.

10. **Integration tests polluting the DB** — Route handlers using `createServiceClient()` hit real Supabase in tests; DB fills with test data; CI fails non-deterministically. Prevention: `vi.mock('@/lib/supabase/server')` for all integration tests; guard `NEXT_PUBLIC_SUPABASE_URL` against production when `TEST_INTEGRATION=true`.

---

## Implications for Roadmap

The dependency graph from feature research directly dictates a 4-phase build order. Features are grouped by their dependency requirements, not arbitrarily.

### Phase 1: Security Foundation
**Rationale:** Rate limiting (SEC-02) is dependency-free and protects existing routes immediately — best early win at low risk. TOTP 2FA (SEC-01) must come before admin user management; both share the middleware change and should ship together in the same milestone phase.
**Delivers:** Production-safe auth layer — brute-force protection on all routes, TOTP enrollment and challenge flows, AAL2 enforcement in middleware for `/admin` routes
**Addresses:** SEC-01, SEC-02
**Avoids:** In-memory rate limit pitfall, AAL middleware bypass pitfall, non-MFA login loop pitfall, unverified factor accumulation pitfall
**Migrations needed:** None (Supabase manages `auth.mfa_factors` internally)
**Research flag:** Standard — Supabase TOTP and Upstash patterns documented at HIGH confidence; no additional research needed

### Phase 2: Notification System Polish
**Rationale:** Notification preferences (NOTIF-11) must ship before the weekly digest (NOTIF-10) — the digest checks opt-outs at send time. Building the digest first creates a window of non-compliance with user intent.
**Delivers:** Per-type notification preference toggles (email + in-app), `notifications.ts` updated to enforce at send time, `user_notification_prefs` migration; then weekly Monday digest on top
**Addresses:** NOTIF-11, NOTIF-10
**Uses:** Vercel Cron, existing Resend + React Email, new migration
**Avoids:** Preference-not-enforced pitfall, digest timeout pitfall
**Research flag:** Standard — Vercel Cron and notification pattern at HIGH confidence; `Promise.allSettled` is deterministic

### Phase 3: Admin Capabilities
**Rationale:** Admin user management (ADMIN-07) depends on SEC-01 (Phase 1) being live so invite recipients encounter a complete auth flow. MRR chart (ADMIN-08) belongs here logically and must precede visual regression baselines for the billing page.
**Delivers:** User invite/role-change/deactivate flows on `/admin/users`; MRR trend chart on `/admin/billing` using historical `payments` data
**Addresses:** ADMIN-07, ADMIN-08
**Uses:** Existing `createServiceClient()`, existing Recharts (dynamic import with `ssr: false`), new `006_user_invitations.sql` migration; `cancel_at_period_end` column added to `subscriptions` before chart code
**Avoids:** Orphaned auth account pitfall (trigger in migration, not app code), MRR data accuracy pitfall
**Research flag:** Standard — Supabase admin API documented at HIGH confidence; Recharts `dynamic(..., { ssr: false })` is a known requirement

### Phase 4: Test Coverage
**Rationale:** Integration tests (TEST-10) and visual regression tests (TEST-11) validate the completed feature set. Visual regression must follow Phase 3 — baselines captured before ADMIN-08 exists become stale on day 1.
**Delivers:** NTARH integration tests for all API routes (tasks, checkout, billing-portal, all 4 Stripe webhook branches); Playwright visual regression baselines for portal dashboard, tasks, admin overview, admin billing
**Addresses:** TEST-10, TEST-11
**Uses:** Existing Vitest + Playwright; adds `next-test-api-route-handler` and `msw`
**Avoids:** DB pollution pitfall (vi.mock strategy established before any test is written), CI baseline mismatch pitfall (baselines generated in CI only)
**Research flag:** Validate NTARH + Next.js 15 `await params` behavior in the first integration test before building the full suite (MEDIUM confidence gap)

### Phase Ordering Rationale

- SEC-02 opens Phase 1 because it is risk-free and delivers immediate value with no dependencies — the first feature any production SaaS should have
- SEC-01 must precede ADMIN-07; they are separated by one phase rather than grouped because SEC-01 needs to be confirmed working in production before the invite flow exposes new users to it
- NOTIF-11 strictly precedes NOTIF-10 — building the digest without preferences in place sends emails to users who later opt out, a trust-damaging default
- ADMIN-08 must precede TEST-11 — visual baselines for the admin billing page captured without the MRR chart are immediately stale
- TEST-10 is independent of TEST-11 and both can progress in parallel within Phase 4; route handler integration tests do not depend on visual baselines

### Research Flags

Phases needing validation during implementation:
- **Phase 4 (TEST-10):** Validate NTARH v4 + Next.js App Router `params` as Promise (`await params`) in the first test written before building the suite — this is the only MEDIUM confidence gap across all research
- **Phase 3 (ADMIN-07 invite trigger):** The Supabase post-signup trigger creating the public `users` row must be written and tested before invite UI is built; verify trigger syntax against existing schema constraints and RLS policies; fallback: two-step API call with error compensation

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 1 (SEC-01, SEC-02):** Supabase TOTP and Upstash docs are comprehensive and HIGH confidence; implementation patterns are directly applicable to the codebase
- **Phase 2 (NOTIF-10, NOTIF-11):** Vercel Cron and React Email patterns at HIGH confidence; `Promise.allSettled` is standard Node.js
- **Phase 4 (TEST-11 visual regression):** CI-first baseline generation and Playwright config patterns at HIGH confidence from official docs

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 4 new packages verified against official docs; existing packages confirmed installed from `package.json`; one MEDIUM gap on NTARH + Next.js 15 `params` behavior |
| Features | HIGH | All 8 features reviewed against the live codebase (`001_schema.sql`, API routes, `notifications.ts`, Playwright config); feature dependencies confirmed by code inspection |
| Architecture | HIGH | Integration points are precise and additive; research grounded in existing codebase structure, not hypothetical greenfield design |
| Pitfalls | HIGH | 10 critical pitfalls with concrete failure modes, root causes, and prevention strategies; all verified against official Supabase, Vercel, and Playwright docs |

**Overall confidence:** HIGH

### Gaps to Address

- **NTARH + Next.js 15 `params` as Promise:** The `await params` requirement in App Router route handlers under Next.js 15 was documented but not confirmed with a live test. Write one test first to validate the behavior before building the full suite (Phase 4).
- **Supabase post-signup trigger for profile row (ADMIN-07):** Trigger syntax for auto-creating the `users` row from `auth.users` INSERT must be validated against existing schema constraints and RLS before the migration is written. Plan the fallback if the trigger conflicts.
- **Vercel cron timing on Hobby plan:** Weekly frequency is within spec, but ±1 hour accuracy applies. Confirm the cron fires within an acceptable window during first production deployment.
- **Upstash free tier budget:** 10k requests/day; rate limiting across protected routes at current scale (<20 concurrent users) should stay within budget. Monitor usage after launch.

---

## Sources

### Primary (HIGH confidence)
- [Supabase TOTP MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa/totp) — enrollment flow, QR SVG return value, AAL levels, `getAuthenticatorAssuranceLevel()` as local JWT inspection
- [Supabase MFA API Reference](https://supabase.com/docs/reference/javascript/auth-mfa-api) — enroll/challenge/verify/listFactors method signatures
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — `inviteUserByEmail`, `deleteUser`, `updateUserById` (ban_duration), PKCE limitation confirmed
- [@upstash/ratelimit GitHub](https://github.com/upstash/ratelimit-js) — v2.0.8, sliding window algorithm, Vercel middleware example
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs) — `vercel.json` format, CRON_SECRET header injection, plan limits (Hobby: daily max; Pro: per-minute)
- [Playwright Visual Comparisons Docs](https://playwright.dev/docs/test-snapshots) — `toHaveScreenshot()` built-in, `maxDiffPixels`, mask option, CI baseline generation workflow
- [MSW Quick Start](https://mswjs.io/docs/quick-start/) — v2 Node.js integration, `setupServer` from `msw/node`, `http` namespace
- Existing codebase reviewed: `platform/supabase/migrations/001_schema.sql`, `platform/src/lib/notifications.ts`, `platform/src/app/api/**`, `platform/src/lib/supabase/server.ts`, `platform/playwright.config.ts`, `platform/__tests__/`

### Secondary (MEDIUM confidence)
- [next-test-api-route-handler GitHub](https://github.com/Xunnamius/next-test-api-route-handler) — v4 App Router support confirmed for `next >= 14.0.4`; Next.js 15 `params` as Promise noted but not live-tested
- [Upstash Ratelimit + Next.js 2026 community tutorial](https://noqta.tn/en/tutorials/upstash-redis-nextjs-rate-limiting-caching-2026) — confirms current patterns
- SaaS notification UX patterns (Smashing Magazine, Userpilot) — opt-out model as expected default behavior

---

*Research completed: 2026-03-25*
*Ready for roadmap: yes*
