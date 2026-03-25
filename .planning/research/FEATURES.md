# Feature Research

**Domain:** B2B SRE/performance client portal — v1.2 Security & Polish
**Researched:** 2026-03-25
**Confidence:** HIGH (codebase reviewed in depth; web search verified against current Supabase, Vercel, Playwright, and Upstash docs)

---

## Context: What Already Exists (v1.1 Baseline)

This research covers ONLY the 8 new features for v1.2. The platform already ships:

- Supabase Auth with email/password login, 4 roles: `admin`, `engineer`, `seller`, `client`
- Portal with task CRUD, file uploads (drag-and-drop, Supabase Storage, signed URLs, image lightbox)
- Admin dashboard: client list, task cross-view, billing overview with stat cards
- Notifications: in-app Realtime bell (unread badge, mark-as-read), email (Resend) for payment events + task status changes, Slack on task creation
- Automated tests: Vitest unit tests for `stripe.ts`, `slack.ts`, `notifications.ts`, `email.ts`, `onboard.ts`, `webhook-email.ts`; Playwright E2E for login, task CRUD, admin redirect, cross-tenant isolation, storage isolation
- Supabase schema: 13 tables, full RLS, `notifications` table with `type`, `user_id`, `title`, `body`, `action_link`, `read`

**The 8 new v1.2 features:**
1. Two-factor authentication (TOTP) — SEC-01
2. Rate limiting on API routes — SEC-02
3. Weekly email digest to clients — NOTIF-10
4. User notification preferences (per-type opt-in/out) — NOTIF-11
5. Admin user management (invite, role change, deactivate) — ADMIN-07
6. Admin MRR trend chart — ADMIN-08
7. Integration tests for API routes — TEST-10
8. Playwright visual regression tests — TEST-11

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that, given the v1.1 baseline, users now naturally expect. Missing them = the platform feels
security-incomplete or operationally blind.

#### Security

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Rate limiting on auth + API routes | Any production SaaS must protect against brute force and abuse; absent rate limiting is a red flag on security reviews | MEDIUM | Upstash `@upstash/ratelimit` + Redis via Next.js middleware or per-route; sliding window algorithm preferred; `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars; free tier covers <10k requests/day which is sufficient at current scale (HIGH confidence — Upstash + Vercel verified) |
| TOTP two-factor authentication | Enterprise clients increasingly mandate 2FA; a B2B portal handling SRE data without 2FA is a trust gap | HIGH | Supabase Auth TOTP is free, enabled by default on all projects; enrollment: `mfa.enroll()` → QR code display → `mfa.challenge()` → `mfa.verify()`; post-login assurance level check via `getAuthenticatorAssuranceLevel()`; if `currentLevel = aal1` and `nextLevel = aal2` → redirect to MFA challenge page; PKCE not supported with `inviteUserByEmail` (relevant for ADMIN-07 interaction) (HIGH confidence — Supabase TOTP docs reviewed) |

#### Notifications

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-notification-type opt-out | Now that clients receive email digests + in-app notifications across 4 event types, controlling noise is table stakes UX | MEDIUM | DB table `notification_preferences` with `(user_id, notification_type, email_enabled, inapp_enabled)`; checked before `sendEmail` and `createNotification` calls; default = all enabled; UI: settings page with toggles per type (HIGH confidence — standard SaaS UX pattern) |

#### Admin Operations

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Admin user management: invite | Admins must be able to add client users and team members without accessing the Supabase dashboard | HIGH | `supabase.auth.admin.inviteUserByEmail(email, { data: { role, client_id } })` via service role key; invitation email sent by Supabase automatically; user sets password on first login; call must be in a server-only API route (never a client component); PKCE not supported on invite flow (HIGH confidence — Supabase admin API reviewed) |
| Admin user management: role change | Admins need to promote/demote users (e.g., engineer → admin, client user added as viewer) without direct DB access | MEDIUM | UPDATE on `public.users.role`; gate to admin-only server action; existing 4-role enum (`admin`, `engineer`, `seller`, `client`) covers all cases (HIGH confidence — existing schema supports this) |
| Admin user management: deactivate | Ability to remove access for churned clients or departed team members | MEDIUM | Two-step: (1) `supabase.auth.admin.deleteUser(userId)` via service role; (2) CASCADE deletes `public.users` row (FK with `ON DELETE CASCADE` already in schema); soft-delete option: set `is_active = false` column (requires schema migration) — prefer hard delete for simplicity at current scale (HIGH confidence — Supabase admin API verified) |
| Admin MRR trend chart | Current billing page shows point-in-time MRR stat card only; trend over time is needed for business monitoring | MEDIUM | Recharts `AreaChart` with monthly aggregated data from `payments` table (sum `amount` where `status = 'paid'` grouped by month); 6–12 month rolling window; Recharts already proven pattern in Next.js — must be `"use client"` component due to browser-only DOM APIs (HIGH confidence — Recharts + existing `payments` schema verified) |

#### Testing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Integration tests for API routes | Unit tests mock everything; integration tests verify the actual route handler behavior with real request/response objects — required for `tasks`, `checkout`, `billing-portal`, and `webhooks/stripe` routes | HIGH | `next-test-api-route-handler` (NTARH) v4+ supports Next.js 15 App Router; must be first import in test file; use Vitest with `environment: 'node'` (never jsdom); mock Supabase via existing `__mocks__/client.ts` pattern; mock Stripe SDK with `vi.mock` (HIGH confidence — NTARH + Vitest compatibility verified via web search) |
| Playwright visual regression baseline | Captures UI state as source of truth; detects unintended visual changes in portal and admin pages during future refactoring | HIGH | Playwright `expect(page).toHaveScreenshot()` — generates `.png` baseline on first run, diffs on subsequent runs; must run in CI with fixed viewport + masked dynamic regions (timestamps, user names); `--update-snapshots` only on intentional UI changes; store baseline `.png` files in git (HIGH confidence — Playwright visual comparison docs reviewed) |

---

### Differentiators (Competitive Advantage)

Features that exceed baseline expectations and create meaningful operational or UX value for Vantix specifically.

#### Security

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Differentiated rate limits per route | Auth routes get stricter limits (5/min) than general API routes (60/min) — prevents brute force on login specifically | MEDIUM | Upstash `Ratelimit` instance per route category; `sliding window` algorithm avoids burst-at-boundary problem; key = IP address from `req.headers.get('x-forwarded-for')` on Vercel; responses return `Retry-After` header (MEDIUM confidence — pattern verified via Upstash docs; IP extraction from Vercel headers is standard) |
| MFA enforcement for admin role | Admins have access to all client data; requiring AAL2 for `/admin` routes is a meaningful security guarantee | MEDIUM | Middleware checks: if path starts with `/admin` and `currentLevel !== 'aal2'`, redirect to `/mfa-challenge`; normal client portal only requires AAL1 (MEDIUM confidence — Supabase AAL docs reviewed; implementation pattern from training data) |

#### Notifications

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Weekly email digest (Monday morning) | Proactive async communication reduces client anxiety without requiring portal login; differentiates Vantix from typical consulting firms | HIGH | Vercel Cron Job (`vercel.json` `crons` field, `0 8 * * 1` = Monday 8am UTC); route handler at `/api/cron/digest`; queries last 7 days of task status changes, completed tasks, and open tasks per client; sends via Resend using existing React Email pattern; gate: `export const dynamic = 'force-dynamic'`; Cron only runs on Production deployments (HIGH confidence — Vercel cron docs reviewed) |
| Granular channel control (email vs. in-app per type) | Advanced users want Slack as primary channel and want to disable email for lower-priority notification types | MEDIUM | `notification_preferences` table includes `email_enabled` and `inapp_enabled` booleans per type; UI renders two toggle columns; `notifyTaskEvent` and `createNotification` check preferences before acting (MEDIUM confidence — requires schema migration; logic straightforward given existing notification infrastructure) |

#### Admin Operations

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| User list view with status indicators | Admins see all users, their roles, client associations, and whether they are active — single source of truth for team roster | MEDIUM | Query `public.users` with `client_id` join to `clients.name`; display role badge, client name, created date; no new schema required (HIGH confidence — existing schema supports this) |
| MRR chart with subscription overlay | Trend line of paid MRR + markers for new/cancelled subscriptions tells the full revenue story | HIGH | Two data series: (1) monthly paid MRR from `payments`, (2) subscription events (new, cancelled) from `subscriptions`; Recharts `ComposedChart` with `Area` + `ReferenceLine` or `Bar`; increases chart complexity significantly — may defer overlay to v2 (MEDIUM confidence — Recharts supports composed charts; data model supports it) |

#### Testing

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Visual regression baseline for portal + admin pages | Catches unexpected UI regressions that unit/integration tests cannot detect — broken layouts, missing components, style corruption | HIGH | Target pages: portal dashboard, tasks page (with task selected), admin overview, admin billing (with chart); mask dynamic: notification timestamps, user display names, chart Y-axis labels (if data-dependent); run after every PR in CI (HIGH confidence — Playwright docs reviewed) |
| API integration test coverage for Stripe webhook paths | Stripe webhook handler processes payments, triggers onboarding, and sends emails — one of the highest-risk routes | HIGH | Test each `event.type` branch (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`); use NTARH to create real HTTP requests; mock Stripe `webhooks.constructEvent` and Supabase calls; assert DB inserts + email calls per branch (HIGH confidence — pattern verified against existing unit test structure) |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| SMS / phone 2FA | "More accessible than TOTP apps" | Requires Supabase Phone Auth add-on, a SMS provider (Twilio), per-message cost, and phone number collection — significant scope increase for marginal UX gain over TOTP | TOTP is free, works offline, no cost per verification, supported by every major authenticator app |
| Recovery code generation for 2FA | "What if I lose my phone?" | Generating, hashing, and storing single-use recovery codes is an additional security-sensitive subsystem; Supabase does not handle this natively — requires custom code | Admin-assisted account recovery: admin can unenroll a user's MFA factor via `supabase.auth.admin.mfa.deleteFactor()`; simpler and sufficient at current team size |
| In-memory rate limiting (no Redis) | "Why add Upstash dependency?" | In-memory rate limits don't work on Vercel serverless (each invocation is stateless/separate process); limits would never actually trigger across real traffic | Upstash Redis over HTTPS (no persistent connection needed) is the correct architecture for serverless; free tier covers current scale |
| Notification digest on user-defined schedule | "Let users pick their digest day/time" | Per-user scheduling requires cron-per-user (or dynamic job scheduling via Inngest/QStash), timezone handling, and persistence — engineering effort that outweighs benefit at current client count (<20 clients) | Monday 8am UTC fixed schedule covers the use case for a weekly async service model; revisit when client count exceeds 50 |
| Visual regression against external services | "Test Grafana embed rendering, Stripe portal" | External service content is outside our control, changes without notice, and introduces flaky tests tied to network state | Mask or skip iframes in visual regression scope; focus on first-party portal UI only |
| Full i18n coverage in visual regression tests | "Take screenshots in both EN and ES" | Doubles the baseline count, requires two-language test runs, and adds CI time; text layout differences create false positives | Run visual regression in English only; i18n parity is covered by dedicated i18n unit tests in existing CI |

---

## Feature Dependencies

```
[TOTP 2FA — SEC-01]
    └──requires──> [Supabase Auth MFA: free, enabled by default on project]
    └──requires──> [/mfa-enroll page (QR code + verify step)]
    └──requires──> [/mfa-challenge page (post-login AAL1→AAL2 redirect)]
    └──requires──> [middleware AAL check for /admin routes]
    └──enhances──> [Admin User Management — SEC-01 must ship before ADMIN-07 invite flow]
    └──interacts──> [Admin User Management: inviteUserByEmail does not support PKCE;
                     user sets up 2FA after first login, not during invite]

[Rate Limiting — SEC-02]
    └──requires──> [Upstash Redis instance (free tier sufficient)]
    └──requires──> [UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars]
    └──can live in──> [Next.js middleware (global) OR per-route (targeted)]
    └──no conflict──> [All existing API routes; additive protection layer]

[Weekly Email Digest — NOTIF-10]
    └──requires──> [Vercel Cron Job (vercel.json crons field)]
    └──requires──> [/api/cron/digest route handler]
    └──requires──> [Resend + React Email (already configured)]
    └──enhances──> [Notification Preferences — digest should respect email_enabled for digest type]
    └──depends on──> [Notification Preferences (NOTIF-11) for opt-out check]

[Notification Preferences — NOTIF-11]
    └──requires──> [NEW DB table: notification_preferences]
    └──requires──> [Settings UI page (new portal page or modal)]
    └──requires──> [notifyTaskEvent + createNotification checks preference before acting]
    └──enhances──> [Weekly Email Digest — digest honors preferences]
    └──enhances──> [All existing notification flows (payment, task events)]
    └──NOTE: build NOTIF-11 before NOTIF-10 to avoid digest sending to opted-out users]

[Admin User Management — ADMIN-07]
    └──requires──> [service role client (createServiceClient — already exists)]
    └──requires──> [/admin/users page (new admin route)]
    └──requires──> [/api/admin/users route — invite, role change, deactivate actions]
    └──requires──> [TOTP 2FA (SEC-01) should ship first — invite flow interacts with MFA setup]
    └──uses──> [supabase.auth.admin.inviteUserByEmail()]
    └──uses──> [supabase.auth.admin.deleteUser()]
    └──uses──> [public.users UPDATE for role change]

[Admin MRR Chart — ADMIN-08]
    └──requires──> [Recharts (already in package.json per PROJECT.md)]
    └──uses──> [existing payments table (amount, status, created_at)]
    └──uses──> [existing subscriptions table]
    └──extends──> [existing /admin/billing page (adds chart section)]
    └──requires──> ["use client" component — Recharts uses browser-only APIs]
    └──no new DB needed]

[Integration Tests — TEST-10]
    └──requires──> [next-test-api-route-handler (NTARH) v4+]
    └──requires──> [existing Vitest + vi.mock infrastructure (already in place)]
    └──requires──> [existing __mocks__/client.ts Supabase mock pattern]
    └──covers──> [/api/tasks (POST), /api/tasks/[taskId] (PATCH/DELETE)]
    └──covers──> [/api/webhooks/stripe (all 4 event branches)]
    └──covers──> [/api/checkout (POST), /api/billing-portal (POST)]
    └──enhances──> [all existing unit tests — complementary, not replacement]

[Visual Regression Tests — TEST-11]
    └──requires──> [existing Playwright setup (playwright.config.ts)]
    └──requires──> [existing auth setup files (playwright/.auth/user.json)]
    └──requires──> [stable test environment (same viewport, masked dynamic regions)]
    └──new project in playwright.config.ts: "visual"]
    └──target pages──> [portal dashboard, tasks, admin overview, admin billing]
    └──depends on──> [Admin MRR Chart (ADMIN-08) for admin billing visual baseline]
```

### Dependency Notes

- **NOTIF-11 before NOTIF-10:** Notification preferences must be built before the digest cron job so the digest can check opt-outs. Building NOTIF-10 first would send digests to users who later opt out — bad default.
- **SEC-01 (2FA) before ADMIN-07:** The admin invite flow creates new users who will encounter the MFA enrollment prompt on first login. Both flows should be ready together to avoid a broken post-invite experience.
- **SEC-02 (rate limiting) is independent:** Can ship in any phase; does not depend on any v1.2 feature. Good candidate for Phase 1 since it protects existing routes immediately.
- **ADMIN-08 before TEST-11:** Visual regression baseline for admin billing must be captured after the MRR chart exists, otherwise the baseline will be stale the moment the chart is added.
- **NTARH must be first import:** In every integration test file, `next-test-api-route-handler` must be the first import statement due to Next.js internal resolution requirements.
- **Vercel cron runs on Production only:** The weekly digest cron job will not fire on preview deployments. Provide a manual trigger endpoint (`/api/cron/digest?secret=X`) for local testing.

---

## MVP Definition

### v1.2 Launch With (all 8 features, ordered by dependency)

Phase ordering recommended by dependencies:

- [ ] **SEC-02: Rate limiting** — independent, protects existing routes immediately; low risk to ship first
- [ ] **NOTIF-11: Notification preferences** — must precede digest; new DB table + settings UI
- [ ] **SEC-01: TOTP 2FA** — enrollment + challenge flows; must precede ADMIN-07
- [ ] **ADMIN-07: Admin user management** — invite, role change, deactivate; requires SEC-01 to be live
- [ ] **NOTIF-10: Weekly email digest** — Vercel cron + React Email template; requires NOTIF-11
- [ ] **ADMIN-08: Admin MRR chart** — Recharts AreaChart on billing page; standalone visual feature
- [ ] **TEST-10: Integration tests** — NTARH + existing Vitest; covers all API routes
- [ ] **TEST-11: Visual regression** — Playwright `.toHaveScreenshot()`; requires ADMIN-08 to be stable

### Add After v1.2 Validation (v1.3+)

- [ ] MRR chart subscription overlay (new/cancelled markers) — adds complexity after core chart proves useful
- [ ] Admin-assisted 2FA unenrollment UI — currently requires Supabase dashboard; promote when first support request occurs
- [ ] Per-user digest schedule (timezone-aware) — promote when client count exceeds 50

### Future Consideration (v2+)

- [ ] SMS/phone 2FA — if enterprise client mandates it explicitly
- [ ] Notification digest for internal team (admin/engineer summary of all client activity) — different use case from client digest
- [ ] Full CMS for notifications (templates, scheduling) — if Vantix white-labels the portal

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SEC-02: Rate limiting | HIGH (security baseline) | LOW | P1 |
| NOTIF-11: Notification preferences | MEDIUM (enables opt-out) | MEDIUM | P1 (gating NOTIF-10) |
| SEC-01: TOTP 2FA | HIGH (enterprise trust) | HIGH | P1 |
| ADMIN-07: User management | HIGH (operational need) | HIGH | P1 |
| NOTIF-10: Weekly digest | HIGH (client retention) | MEDIUM | P1 |
| ADMIN-08: MRR chart | MEDIUM (business insight) | LOW | P2 |
| TEST-10: Integration tests | HIGH (code quality) | MEDIUM | P2 |
| TEST-11: Visual regression | MEDIUM (regression safety) | MEDIUM | P2 |

**Priority key:**
- P1: Must have for v1.2 milestone completion
- P2: Completes the milestone but can slip to end of milestone if needed
- P3: Defer (nothing deferred in v1.2 — all 8 are committed features)

---

## Implementation Notes (Actionable for Roadmap)

### SEC-01: TOTP Two-Factor Authentication

- **Supabase side:** TOTP MFA is free and enabled by default. No Supabase project config change needed.
- **New pages needed:**
  - `/[locale]/mfa-enroll` — post-login enrollment: call `mfa.enroll()`, display QR code (use `qrcode` npm package or render `otpauth://` URI), confirm with `mfa.challenge()` + `mfa.verify()`
  - `/[locale]/mfa-challenge` — post-login verification gate: list factors via `mfa.listFactors()`, call `mfa.challenge()`, accept 6-digit code, call `mfa.verify()`, redirect to destination
- **Middleware change:** After auth check, call `getAuthenticatorAssuranceLevel()`. If path is `/admin/*` and `nextLevel = aal2` and `currentLevel = aal1`, redirect to `/mfa-challenge`.
- **UX:** TOTP codes are valid for 30 seconds with one-interval clock skew tolerance. Show a countdown timer on the challenge page to reduce failed submission frustration.
- **Do not build:** SMS fallback, recovery codes (admin unenroll via Supabase dashboard is sufficient).

### SEC-02: Rate Limiting

- **Package:** `@upstash/ratelimit` + `@upstash/redis` — HTTP-based, no persistent connection, works on Vercel serverless.
- **Algorithm:** Sliding window (prevents burst-at-boundary exploits that fixed window allows).
- **Placement option A (global middleware):** Apply in `middleware.ts` before all other checks — simplest but applies same limit to all routes.
- **Placement option B (per-route):** Import `Ratelimit` directly in route handler — allows per-route tuning.
- **Recommended:** Option B. Auth routes (login) get 5 req/min; task creation gets 30 req/min; Stripe webhook is exempt (protected by signature verification).
- **Key:** `req.headers.get('x-forwarded-for') || '127.0.0.1'` — standard on Vercel.
- **Response:** `NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } })`.

### NOTIF-10: Weekly Email Digest

- **Vercel config:** Add to `vercel.json`: `{ "crons": [{ "path": "/api/cron/digest", "schedule": "0 8 * * 1" }] }` (Monday 8am UTC).
- **Route:** `/api/cron/digest` — secured by `Authorization: Bearer ${CRON_SECRET}` header check (Vercel sends this automatically).
- **Data gathered per client:** last 7 days of completed tasks, in-progress tasks, any new reports, next billing date.
- **Template:** New React Email template `WeeklyDigestEmail`; bilingual (check `client.market`).
- **Local testing:** Add `?secret=X` query param trigger for manual invocation during development.
- **Gate:** Check NOTIF-11 preferences before sending — skip clients with `digest` type's `email_enabled = false`.

### NOTIF-11: Notification Preferences

- **New DB table:**
  ```sql
  CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    inapp_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
  );
  ```
- **Notification types to cover:** `task_created`, `task_updated`, `payment_success`, `payment_failed`, `weekly_digest` (new).
- **UI:** Settings section in portal sidebar or `/[locale]/portal/settings` — one toggle row per notification type, two toggle columns (email / in-app).
- **Read path:** `notifyTaskEvent()` and `createNotification()` must check preferences before acting. Fetch user's preferences at notification time; default = enabled if no row exists (opt-out model, not opt-in).
- **RLS:** Users can only read/write their own preference rows.

### ADMIN-07: Admin User Management

- **New route:** `/[locale]/admin/users` — table of all users with role, client association, created date, action buttons.
- **New API routes (server-only):**
  - `POST /api/admin/users/invite` — calls `supabase.auth.admin.inviteUserByEmail(email, { data: { role, client_id } })`
  - `PATCH /api/admin/users/[userId]/role` — updates `public.users.role`
  - `DELETE /api/admin/users/[userId]` — calls `supabase.auth.admin.deleteUser(userId)`
- **All API routes must use `createServiceClient()`** (service role key, already implemented in `server.ts`).
- **Gate:** Verify caller is `admin` role before executing any action (read `users.role` from the session).
- **Note on PKCE:** `inviteUserByEmail` does not support PKCE. This is expected and documented. The invited user receives an email with a link to set their password.

### ADMIN-08: Admin MRR Trend Chart

- **Placement:** New chart section at the top of the existing `/[locale]/admin/billing` page, above the stat cards.
- **Data query:** `payments` table — `SELECT DATE_TRUNC('month', paid_at) as month, SUM(amount) as mrr FROM payments WHERE status = 'paid' GROUP BY month ORDER BY month` — last 12 months.
- **Component:** `"use client"` component wrapping Recharts `AreaChart` with:
  - X-axis: month labels (`Jan`, `Feb`, etc.)
  - Y-axis: USD formatted
  - `Area` fill with brand color gradient
  - `Tooltip` showing month + MRR value
- **Fallback:** If no payment data, show "No billing data yet" placeholder (avoid Recharts error on empty data array).
- **SSR note:** Recharts uses browser-only APIs — must not render on server. Wrap in dynamic import with `ssr: false` if needed.

### TEST-10: Integration Tests for API Routes

- **Package:** `next-test-api-route-handler` v4+ — supports Next.js 15 App Router; must be first import.
- **Vitest environment:** `environment: 'node'` in `vitest.config.ts` for integration test files (currently `jsdom` for component tests — separate config or `environmentMatchGlobs`).
- **Routes to cover:**
  - `POST /api/tasks` — missing required fields → 400; valid body → 201 with task; Supabase error → 500
  - `PATCH /api/tasks/[taskId]` — status update → 200; not found → 404
  - `POST /api/webhooks/stripe` — invalid signature → 400; `checkout.session.completed` → upserts subscription; `invoice.paid` → inserts payment + sends email; `invoice.payment_failed` → inserts failed payment + sends email; `customer.subscription.deleted` → updates status
  - `POST /api/checkout` — creates Stripe session
  - `POST /api/billing-portal` — creates Stripe portal session
- **Mocking strategy:** `vi.mock('@/lib/supabase/server')` using existing `__mocks__/client.ts` pattern; `vi.mock('stripe')` for Stripe SDK; `vi.mock('@/lib/email')` for Resend calls.

### TEST-11: Playwright Visual Regression

- **New Playwright project** in `playwright.config.ts`:
  ```typescript
  { name: "visual", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" } }
  ```
- **Baseline pages to capture:**
  - Portal: dashboard (`/en/portal`), tasks page (`/en/portal/tasks`)
  - Admin: overview (`/en/admin`), billing page with MRR chart (`/en/admin/billing`)
- **Dynamic masking:** Mask notification timestamps, user display names, and any data-populated table cells that change between runs.
- **Threshold:** `maxDiffPixelRatio: 0.02` (2% pixel difference tolerance) to absorb sub-pixel font rendering variation.
- **Baseline storage:** Commit `.png` baseline files to git in `e2e/__snapshots__/`.
- **Update workflow:** Run `playwright test --update-snapshots` only on intentional UI changes; PR description must note "visual baseline updated".

---

## Sources

- [Supabase TOTP MFA docs](https://supabase.com/docs/guides/auth/auth-mfa/totp) — HIGH confidence
- [Supabase Auth Admin API: inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — HIGH confidence
- [Upstash Rate Limiting for Next.js](https://upstash.com/blog/nextjs-ratelimiting) — HIGH confidence
- [Vercel Cron Jobs docs](https://vercel.com/docs/cron-jobs) — HIGH confidence
- [Playwright Visual Comparisons docs](https://playwright.dev/docs/test-snapshots) — HIGH confidence
- [next-test-api-route-handler GitHub](https://github.com/Xunnamius/next-test-api-route-handler) — HIGH confidence (Next.js 15 compatibility verified)
- [Recharts npm + GitHub](https://github.com/recharts/recharts) — HIGH confidence
- Existing codebase reviewed: `platform/supabase/migrations/001_schema.sql`, `platform/src/lib/notifications.ts`, `platform/src/lib/types.ts`, `platform/src/app/api/**`, `platform/src/lib/supabase/server.ts`, `platform/playwright.config.ts`, `platform/__tests__/notifications.test.ts`
- SaaS notification UX patterns: Smashing Magazine, Userpilot (MEDIUM confidence — UX research)

---

*Feature research for: Vantix platform v1.2 — security hardening, notification preferences, admin user management, MRR chart, integration + visual regression tests*
*Researched: 2026-03-25*
