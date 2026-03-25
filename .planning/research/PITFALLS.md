# Pitfalls Research

**Domain:** Adding 2FA/TOTP, rate limiting, weekly email digest, notification preferences, admin user management, MRR charting, and advanced testing to an existing Next.js 15 + Supabase platform (v1.2 — Security & Polish)
**Researched:** 2026-03-25
**Confidence:** HIGH (Supabase MFA/TOTP, rate limiting patterns, Playwright visual regression) / MEDIUM (MRR data consistency, notification preference schema, digest scheduling on Vercel)

---

## Critical Pitfalls

### Pitfall 1: 2FA Does Not Protect Already-Authenticated Sessions

**What goes wrong:**
You add TOTP enrollment and the challenge UI, users enroll, QR code scans fine — but every existing logged-in session retains `aal1` assurance forever. The middleware and API routes never check AAL level. A user who completed email/password login days ago is never prompted for TOTP, even after they enroll. From Supabase's perspective they are `aal1`, but the app treats them as fully authenticated. MFA exists in the DB but is completely bypassed.

**Why it happens:**
The existing middleware at `src/middleware.ts` checks `supabase.auth.getUser()` for presence, not for assurance level. Adding 2FA enrollment UI without updating the middleware AAL check is the most common implementation error. Developers test enrollment, see the QR code scan work, and ship — without realizing that login-to-challenge routing only triggers for new sign-ins where the client-side flow explicitly calls `mfa.getAuthenticatorAssuranceLevel()`.

**How to avoid:**
After enrollment is implemented, extend `src/middleware.ts` to call `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` for any user accessing `/portal` or `/admin`. If `currentLevel === 'aal1'` and `nextLevel === 'aal2'`, redirect to a `/verify-mfa` route instead of the requested page. This must happen at the middleware level, not in a `useEffect`. The existing middleware already does DB lookups for role checks — add the AAL check in the same pattern.

**Warning signs:**
- Middleware only checks `user` presence, never checks `aal` claim from the JWT.
- 2FA is "optional" with no enforcement path — users who enroll can still access the app without completing the challenge.
- No `/verify-mfa` route exists in the router despite TOTP being shipped.
- Existing logged-in users are not re-prompted after enabling 2FA for their account.

**Phase to address:** SEC-01 (2FA/TOTP) — must be verified before the feature is marked done. Write a Playwright test that: (1) enrolls TOTP, (2) logs out, (3) logs in fresh, (4) asserts the MFA challenge screen appears before the portal is accessible.

---

### Pitfall 2: Unverified TOTP Factors Accumulate and Block Future Enrollment

**What goes wrong:**
Calling `supabase.auth.mfa.enroll()` creates a factor in `aal1` state immediately. If the user abandons the enrollment flow mid-way (closes the modal, refreshes, navigates away), the unverified factor persists in `auth.mfa_factors`. There is a hard limit of 10 factors per user. After 10 abandoned enrollments, the user can never enroll in MFA — all subsequent calls to `enroll()` return an error. Support has to manually delete the dangling factors from the Supabase dashboard.

**Why it happens:**
The enrollment flow is split across two steps: `enroll()` (get QR URI) and then `challengeAndVerify()` (confirm TOTP code). Any interruption between these steps leaves an unverified factor. Supabase auto-deletes unverified factors after ~5 minutes (as of recent versions), but this is not reliable in all hosted environments. The TOTP setup UI typically does not clean up on mount.

**How to avoid:**
On mount of the TOTP enrollment modal, call `supabase.auth.mfa.listFactors()` and unenroll any factors with `status === 'unverified'` before calling `enroll()`. This guarantees a clean slate. The cleanup call is idempotent and safe. Do not rely on the auto-cleanup timeout — explicitly clean up first. Also avoid using the user's email as the `friendlyName` for the factor (Supabase enforces uniqueness per user on friendly names, causing 500 errors on re-enrollment if the previous factor used the same name).

**Warning signs:**
- Enrollment UI does not call `listFactors()` before `enroll()`.
- `friendlyName` is set to the user's email address.
- Support receives reports of "can't set up 2FA" from users who tried multiple times.
- No error handling in the enrollment UI for the "factor limit reached" error code.

**Phase to address:** SEC-01 (2FA/TOTP) — implement pre-enrollment cleanup in the same task as building the enrollment UI. One function, always called first.

---

### Pitfall 3: Rate Limiting with In-Memory State on Vercel Serverless

**What goes wrong:**
The developer implements rate limiting by storing request counts in a module-level `Map` or `LRU` cache:
```typescript
const rateMap = new Map<string, { count: number; reset: number }>();
```
This works perfectly in local development where a single Node process handles all requests. On Vercel, each invocation may run in a separate serverless function instance. The `Map` is per-instance. Two requests from the same IP hitting different instances each see a fresh count of zero. The rate limiter provides zero actual protection against abuse — it limits to N requests per function instance lifetime, which may be a single request.

**Why it happens:**
Local development behavior masks the problem completely. There is no indication during testing that the state is not shared. Rate limiting "works" locally because `next dev` uses a single process.

**How to avoid:**
Use Upstash Redis with `@upstash/ratelimit` — it provides a shared, serverless-friendly key-value store that persists across invocations. The `slidingWindow` algorithm is the correct default for API rate limiting (handles burst at window boundaries better than fixed window). Declare the `Ratelimit` instance outside the request handler (module level) so the internal cache is reused across warm invocations, reducing Redis round-trips. The Upstash free tier is sufficient for this scale; no self-hosted Redis needed.

Rate-limit key strategy: use `user-id:{userId}` for authenticated routes (checkout, billing-portal) rather than IP, since mobile users share carrier IPs. Fall back to `ip:{ipAddress}` for unauthenticated routes.

**Warning signs:**
- Rate limiting code uses a module-level `Map`, `Set`, or object for state.
- Rate limiter is not initialized with an external store (Redis, KV).
- Rate limiting test uses a single process and does not simulate concurrent instances.
- `request.ip` is used directly without falling back to `x-forwarded-for` (it is undefined in some Vercel environments).

**Phase to address:** SEC-02 (Rate Limiting) — must use external store from day one; retrofitting later requires touching every rate-limited route.

---

### Pitfall 4: The Login Flow Breaks for Non-MFA Users When 2FA Middleware Is Added

**What goes wrong:**
After adding the AAL enforcement middleware (see Pitfall 1), the developer tests the happy path with a 2FA-enrolled user and it works. But existing users who have not enrolled in 2FA have `nextLevel === 'aal1'` (same as `currentLevel`). If the middleware logic incorrectly checks `nextLevel === 'aal2'` without also confirming the user actually has enrolled factors, it may redirect non-MFA users to the MFA challenge screen — where they have no factor to challenge. The login loop becomes unbreakable without direct DB intervention.

**Why it happens:**
The condition `nextLevel === 'aal2'` is only true when the user has at least one verified TOTP factor enrolled. But a bug in the middleware condition (e.g., checking `currentLevel !== 'aal2'` instead of `nextLevel === 'aal2' && currentLevel !== 'aal2'`) will break the login flow for non-MFA users. The existing login test at `e2e/login.spec.ts` uses `juan@novapay.com` — if that user has no 2FA enrolled, the E2E test will not catch this breakage.

**How to avoid:**
The correct middleware condition is: redirect to `/verify-mfa` only when `nextLevel === 'aal2'` AND `currentLevel !== 'aal2'`. Also: when 2FA is optional (not mandated for all users), users with no enrolled factors must pass through normally. The E2E test for login must be extended to cover three states: (a) no MFA enrolled — goes directly to portal, (b) MFA enrolled, challenge not done — goes to `/verify-mfa`, (c) MFA enrolled, challenge completed — goes to portal. Do not ship 2FA without all three E2E scenarios passing.

**Warning signs:**
- The login E2E test only tests the email/password happy path, not the post-2FA-rollout state.
- Middleware does not distinguish between "user has no factors" and "user has factors but hasn't challenged."
- After deploying 2FA middleware, non-MFA users report being locked out.
- No test environment has a user with 2FA enrolled and a separate user without.

**Phase to address:** SEC-01 (2FA/TOTP) — the E2E test update is a hard prerequisite for deploying the middleware change.

---

### Pitfall 5: Weekly Digest Runs in a Single Serverless Invocation, Times Out at Scale

**What goes wrong:**
The Vercel cron job hits a single API route (e.g., `/api/cron/weekly-digest`), which fetches all active client users, builds a personalized email for each one using Resend + React Email, and `await`s every send in a loop. With 20+ active users, the loop takes 30-60 seconds. Vercel serverless functions have a maximum duration of 60 seconds on the Pro plan (10 seconds on Hobby). The function times out mid-loop. Some users get the digest, others do not, with no retry or visibility into who was skipped. Next week the function times out again at the same point.

**Why it happens:**
The fan-out pattern (one job per recipient) feels like over-engineering for a small client roster. Developers implement sequential sending as a for-loop because it is simple and works in testing (where the roster is 2-3 seed users). The timeout only surfaces with a real client list.

**How to avoid:**
Use the fan-out pattern from the start: the cron route enqueues one Vercel Cron trigger or Upstash QStash message per recipient, each of which sends a single email. At Vantix's current scale (sub-50 clients), even a simple approach works: iterate the recipient list and use `Promise.allSettled()` instead of sequential `await`. This parallelizes sends and completes in the time of a single Resend API call (~200ms) regardless of recipient count. Log failed sends individually — do not let one failure abort the loop.

For the cron schedule, use Vercel's `vercel.json` cron configuration:
```json
{ "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }] }
```
This fires every Monday at 9:00 UTC. Secure the route with a `CRON_SECRET` bearer token check — Vercel automatically injects this header; reject any request without it.

**Warning signs:**
- Digest route uses `for (const user of users) { await sendEmail(...) }` (sequential).
- No timeout handling or partial-send tracking.
- No `CRON_SECRET` check on the digest API route (anyone can trigger mass sends).
- The cron is tested manually by hitting the URL, not via an actual Vercel cron trigger in staging.
- Hobby plan is being used (2-cron limit and 10s timeout).

**Phase to address:** NOTIF-10 (Weekly Digest) — use `Promise.allSettled` and the `CRON_SECRET` guard from the first implementation. Do not optimize later.

---

### Pitfall 6: Notification Preferences Not Checked at Send Time, Only at Preference Save Time

**What goes wrong:**
The developer builds a notification preferences UI where users can toggle per-type notifications on or off. Preferences are saved to a `notification_preferences` table. The existing `notifyTaskEvent` orchestrator in `src/lib/notifications.ts` is not updated to query preferences before sending. The preferences UI works — toggles save correctly — but all notifications still fire regardless. Users who opt out of `task_updated` emails still receive them. This is a trust issue for a B2B platform.

**Why it happens:**
The preferences table and the notification send path are implemented in separate tasks. The UI (NOTIF-11) is often implemented first or in parallel with the digest (NOTIF-10). The orchestrator code is touched last — and the developer adding preferences forgets that the orchestrator is the actual enforcement point, not the UI.

**How to avoid:**
The `notifyTaskEvent` function in `src/lib/notifications.ts` must be extended to: (1) fetch the recipient's preference row for the current notification type, (2) skip email send if `email_enabled = false` for that type, (3) still insert the in-app notification row (so the bell still shows it) unless `in_app_enabled = false`. The schema for preferences should be:

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  task_created_email BOOLEAN DEFAULT true,
  task_updated_email BOOLEAN DEFAULT true,
  weekly_digest_email BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true
);
```

A single row per user (not one row per preference type) avoids complex joins and makes the default case (no preferences row = all enabled) easy to implement with a `LEFT JOIN`.

**Warning signs:**
- `notifyTaskEvent` does not query the `notification_preferences` table.
- Preferences UI saves correctly but opt-out users still receive emails.
- Preferences schema uses one row per user+type (many rows) — this complicates the query and creates a footgun where missing rows are interpreted as disabled instead of defaulting to enabled.
- No test verifies that an opted-out user does not receive the email.

**Phase to address:** NOTIF-11 (Notification Preferences) — the preference check must be added to `notifyTaskEvent` in the same phase that builds the preferences UI, not deferred.

---

### Pitfall 7: Admin Invite Creates Auth User But No Profile Row — Leaving Orphaned Auth Accounts

**What goes wrong:**
`supabase.auth.admin.inviteUserByEmail()` creates a row in `auth.users` with an invite token. The `users` public profile table (the one with `role`, `client_id`, `full_name`) is populated separately — either by a trigger on `auth.users` insert, or by explicit code after the invite call. If the trigger is missing or the explicit insert fails (network error, duplicate email, constraint violation), the auth account exists with no matching public profile. The user receives the invite email, clicks through, sets a password — and then the portal breaks because every page queries `users` by `auth.uid()` and finds nothing.

**Why it happens:**
`inviteUserByEmail` is a two-step process: (1) auth invite (async, Supabase-handled), (2) profile row creation (developer-handled). Step 2 is easy to forget or lose to a race condition. The schema has `users.id REFERENCES auth.users(id)`, so inserting the profile row requires the auth row to exist first — but the auth row only becomes "real" when the user accepts the invite and sets a password. This timing dependency is non-obvious.

**How to avoid:**
Use a Supabase database trigger on `auth.users` INSERT to automatically create the public profile row with defaults (role = 'client', full_name = email prefix). The admin invite UI should then allow editing the role, client association, and name after creation — not pre-supplying them to the invite call. This decouples auth account creation from profile creation and eliminates the race condition entirely.

For deactivation, use `supabase.auth.admin.updateUserById(userId, { ban_duration: '87660h' })` (10 years = effectively permanent). Note: banning a user does NOT automatically invalidate their active JWT. Existing sessions remain valid until they expire (typically 1 hour). After banning, the middleware's `supabase.auth.getUser()` will return an error for the banned user on their next token refresh — which happens automatically. For immediate lockout, you must also revoke the user's sessions via `auth.admin.signOut(userId, 'others')`.

**Warning signs:**
- No database trigger on `auth.users` that creates the public profile row.
- Admin invite code calls `inviteUserByEmail` and immediately inserts a profile row in the same request without error handling.
- No E2E test for the full invite → accept → login flow.
- Deactivated users can still log in with existing sessions for up to 1 hour after banning.
- Invite API route does not check for duplicate email before calling `inviteUserByEmail` (the API does not error on duplicates — it silently re-sends the invite to an existing account).

**Phase to address:** ADMIN-07 (User Management) — the trigger must be in the migration, not in application code. Write the migration before writing any invite UI.

---

### Pitfall 8: MRR Chart Shows Stale/Incorrect Data Because It Reads the Local DB Table, Not Stripe Truth

**What goes wrong:**
The existing admin billing page calculates MRR as `sum(subscriptions.price_monthly WHERE status = 'active')`. The MRR trend chart adds historical data points over time. But `subscriptions.price_monthly` is populated manually or via the Stripe webhook handler — it may not reflect current Stripe subscription prices if a price was updated in Stripe's dashboard without going through the webhook. More critically: subscriptions with `status = 'active'` but `cancel_at_period_end = true` in Stripe are counted as active MRR in the DB but will churn next billing cycle. The chart overstates MRR.

**Why it happens:**
The DB subscription table is a local cache of Stripe state. Local caches drift. `cancel_at_period_end` is a Stripe concept that is not always reflected in the local DB schema. The existing schema has no `cancel_at_period_end` column on the `subscriptions` table.

**How to avoid:**
Add a `cancel_at_period_end BOOLEAN DEFAULT false` column to `subscriptions` via migration. Populate it from the Stripe webhook `customer.subscription.updated` event. For the MRR trend chart, calculate MRR by grouping historical payment records (already in the `payments` table) by month rather than querying `subscriptions` — actual received payments are ground truth for past MRR, while `subscriptions` with `cancel_at_period_end = false` represent projected future MRR.

For the chart component (Recharts + `ResponsiveContainer`), use dynamic import with `ssr: false` to prevent the hydration mismatch that occurs because `ResponsiveContainer` requires browser dimensions:
```typescript
const MRRChart = dynamic(() => import('./MRRChart'), { ssr: false });
```

**Warning signs:**
- `subscriptions` table has no `cancel_at_period_end` column.
- MRR chart query is `SELECT sum(price_monthly) FROM subscriptions WHERE status = 'active'` — does not account for pending cancellations.
- `ResponsiveContainer` from Recharts used in a Server Component or without `dynamic(..., { ssr: false })` — causes hydration mismatch error.
- Chart shows MRR for past months based on current subscription state, not on historical payment records.
- No monthly snapshot is stored — chart will always show current state retroactively if queried from the subscriptions table.

**Phase to address:** ADMIN-08 (MRR Chart) — add the `cancel_at_period_end` column in the migration before writing a single line of chart code. Decide the data source (payments table = ground truth vs. subscriptions table = approximate) before building the UI.

---

### Pitfall 9: Playwright Visual Regression Snapshots Fail in CI Due to Environment Differences

**What goes wrong:**
Visual regression snapshots generated on a developer's MacBook (macOS, Retina display, macOS font rendering) do not match snapshots generated in CI (Linux, headless Chromium, different font rendering engine). The pixel diff threshold is exceeded for every component, even ones that haven't changed. The CI job fails on every PR. Developers start ignoring visual regression failures, then update snapshots blindly to make CI pass — defeating the purpose entirely.

**Why it happens:**
Playwright's `toHaveScreenshot()` uses pixel-level comparison. Font rendering differs between macOS and Linux. Subpixel antialiasing differs. Even the same system font renders 1-2px differently. At default threshold (0 tolerance), every snapshot fails cross-platform.

**How to avoid:**
Generate and commit baseline snapshots from the CI environment, not from a developer's machine. The workflow: on the first run, generate snapshots in CI with `--update-snapshots`, commit them. On subsequent runs, compare against those CI-generated baselines. Never commit snapshots generated locally.

Set `maxDiffPixels: 50` or `threshold: 0.05` as the project-level default in `playwright.config.ts` to tolerate minor font rendering differences. Mask dynamic elements (dates, notification counts, user names) using the `mask` option. Disable CSS animations with `page.emulateMedia({ reducedMotion: 'reduce' })` and wait for `document.fonts.ready` before capturing.

Scope visual regression to layout-critical components only (sidebar, page headers, stat cards) — not every page in full. Full-page snapshots are too brittle; component-level snapshots are stable.

**Warning signs:**
- Snapshot files committed to the repo were generated on macOS.
- CI visual regression step fails on every PR regardless of what changed.
- `maxDiffPixels` is not set in `playwright.config.ts` (defaults to 0).
- Visual regression tests capture full pages including dynamic data (timestamps, counts).
- No `page.waitForLoadState('networkidle')` or font-ready wait before screenshot capture.

**Phase to address:** TEST-11 (Visual Regression) — set the CI-generation workflow and config options before writing a single test. If the first snapshot is generated wrong, all subsequent runs fail until regenerated.

---

### Pitfall 10: Integration Tests for API Routes Re-use the Live Supabase Service Client, Polluting the DB

**What goes wrong:**
Integration tests for `/api/checkout` and `/api/billing-portal` call the route handlers directly. The handlers use `createServiceClient()` with the real `SUPABASE_SERVICE_ROLE_KEY`. Tests run against the local Supabase instance and insert real rows into `subscriptions`, `clients`, and `payments`. After the test run, the DB is full of test data that mixes with seed data. CI fails non-deterministically because tests assume a clean state that no longer exists. Worse: if `SUPABASE_URL` accidentally points to production, integration tests create real Stripe customers and modify real subscriptions.

**Why it happens:**
The API routes use the same `createServiceClient()` call that production code uses. Integration tests that call the handler directly inherit this dependency. Setting up a test double for `createServiceClient` requires more thought than just calling the route. Developers take the path of least resistance.

**How to avoid:**
Use Vitest's `vi.mock('@/lib/supabase/server')` to replace `createServiceClient` with a typed mock that returns controlled test data. For true integration tests that need a real DB, use a local Supabase instance (`supabase start`) gated behind `TEST_INTEGRATION=true` and wrap each test in a transaction that is rolled back on teardown. Never run integration tests against production — enforce this by requiring `NEXT_PUBLIC_SUPABASE_URL` to contain `localhost` or `127.0.0.1` when `TEST_INTEGRATION=true`.

The Stripe client (`getStripe()`) must also be mocked in all tests — use `vi.mock('@/lib/stripe')` and return a mock Stripe instance that logs calls but makes no actual API requests.

**Warning signs:**
- Integration tests do not use `vi.mock` for Supabase or Stripe.
- Test DB is polluted after running the suite (manual inspection required to clean up).
- `SUPABASE_SERVICE_ROLE_KEY` is in `.env.test` without a guard verifying the URL is local.
- Tests assert against specific row IDs that were seeded manually (brittle — break if seed data changes).

**Phase to address:** TEST-10 (Integration Tests) — establish the mocking strategy and the `TEST_INTEGRATION` guard before writing any test that touches the route handlers.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping the AAL middleware check and relying on client-side `getAuthenticatorAssuranceLevel()` | Simpler implementation, no middleware changes | MFA is enforced in JS only — bypassed by disabling JS or forging a session cookie | Never — AAL must be checked server-side in middleware |
| Using in-memory Map for rate limit state | No Redis dependency, simpler local dev | Provides zero protection on Vercel — each serverless instance has its own counter | Never in production |
| Sending the weekly digest in a sequential for-await loop | Easier to read and debug | Times out on Vercel for any non-trivial user list; partial sends are not retried | Only acceptable if confirmed list will never exceed ~5 users |
| Storing notification preferences as individual rows per user+type | Granular, extensible | Complex joins required at every send; missing rows ambiguous (disabled or never set?) | Never — one row per user with boolean columns is simpler and unambiguous |
| Generating MRR trend chart from `subscriptions.price_monthly` without `cancel_at_period_end` | No additional DB query needed | Chart overstates MRR; pending churns invisible until they process | Never for financial reporting |
| Committing Playwright baseline snapshots generated on macOS | Faster to set up | CI fails on every PR; developers start ignoring visual test output | Never — baselines must come from the CI environment |
| Using `auth.admin.inviteUserByEmail` without a pre-existing profile trigger | Less code | Orphaned auth accounts with no profile when invite flow encounters errors | Never without a compensating trigger or idempotent retry |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase MFA | Checking `currentLevel !== 'aal2'` instead of `nextLevel === 'aal2' && currentLevel !== 'aal2'` | Use both conditions; `nextLevel === 'aal2'` signals the user HAS a factor enrolled; `currentLevel !== 'aal2'` signals they haven't challenged yet |
| Supabase MFA | Calling `enroll()` without first unenrolling stale unverified factors | Always call `listFactors()` and `unenroll()` unverified factors before `enroll()` |
| Supabase MFA | `friendlyName` set to user email — causes 500 on re-enrollment | Use a timestamp or UUID as `friendlyName`; never an attribute that repeats |
| Supabase `inviteUserByEmail` | No error on duplicate email — silently re-invites existing user | Check for existing user before calling invite; log or surface the duplicate to the admin UI |
| Supabase ban | Expecting immediate session invalidation after `ban_duration` is set | Existing JWTs remain valid until next refresh (~1 hour); call `signOut(userId, 'others')` for immediate invalidation |
| Upstash Ratelimit | Using `request.ip` directly on Vercel — can be undefined | Use `ipAddress(request)` from `@vercel/edge` or fall back to `request.headers.get('x-forwarded-for')` |
| Vercel Cron | Cron route accessible without authentication | Always verify `Authorization: Bearer ${process.env.CRON_SECRET}` header; Vercel injects this automatically but manual triggers won't have it |
| Recharts `ResponsiveContainer` | Used in a Server Component or without `ssr: false` | Always wrap in `dynamic(() => import(...), { ssr: false })`; `ResponsiveContainer` requires `window` |
| Resend digest | Sending from the default `onboarding@resend.dev` sender in production | Configure a verified domain sender (e.g., `hello@vantx.io`) in Resend dashboard; emails from `resend.dev` are spam-flagged |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sequential email sends in the digest cron | Vercel function timeout, partial sends | Use `Promise.allSettled()` to parallelize all sends in one invocation | ~5-8 recipients with a 10s Hobby timeout; ~30+ with 60s Pro timeout |
| Notification preferences checked via a separate query inside the notification loop (N+1) | Notification orchestrator adds 1 DB round-trip per recipient per send | Fetch all preferences for the recipient batch in a single `IN` query before the loop | ~10+ concurrent notifications |
| MRR chart querying all payments with no date filter | Admin billing page gets slower as payment history grows | Always filter by date range (e.g., last 24 months); index `payments(client_id, created_at)` already exists | ~1,000+ payment rows |
| Visual regression tests capturing full pages | Snapshot diff noise from any dynamic content, test flakiness grows | Use element-level snapshots for components, not full-page screenshots | First time a timestamp appears in a screenshot |
| Admin user list loading all users without pagination | Page hangs as user count grows | Add `LIMIT 50` and cursor-based pagination from the first implementation | ~200+ users in the `users` table |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| TOTP challenge only enforced client-side (no middleware AAL check) | Authenticated users bypass 2FA by making direct API calls or using stale sessions | Middleware must read `aal` claim from JWT on every protected route request |
| Rate limiting applied only to unauthenticated endpoints | Authenticated users can hammer `/api/checkout` creating unlimited Stripe sessions | Rate limit authenticated endpoints keyed by `userId`, not just IP |
| Digest cron route has no `CRON_SECRET` check | Anyone who discovers the URL can trigger mass email sends to all clients | Reject requests without `Authorization: Bearer {CRON_SECRET}` |
| Admin invite endpoint uses service role but is only protected by client-side role check | A client-role user who discovers the API endpoint can invite arbitrary users to the platform | Verify `auth.uid()` role server-side in every admin API route handler, even those using `createServiceClient` |
| Banned user's active JWT not invalidated after deactivation | Deactivated user retains portal access for up to 1 hour (JWT TTL) | Call `supabase.auth.admin.signOut(userId, 'others')` immediately after setting `ban_duration` |
| MRR data visible to all admin roles, including `seller` | Revenue figures are sensitive; `seller` role should not see individual client MRR | Add explicit role check in the MRR chart page: restrict to `admin` only, not `engineer` or `seller` |
| Notification preference API allows users to modify other users' preferences via `userId` in request body | User A opts out User B's email notifications | Derive `userId` from `auth.uid()` on the server side; ignore any `userId` in the request body |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 2FA enrollment UI shows QR code but no "can't scan?" fallback | Users on devices without camera (desktop Linux) or with accessibility needs cannot enroll | Always show the text secret key alongside the QR code; most authenticator apps accept manual entry |
| 2FA forced on users with no warning or opt-out period | User is mid-session, suddenly locked out, has no authenticator app installed | For optional 2FA: send an advance email notification; provide a 7-day grace period; provide account recovery instructions upfront |
| Weekly digest sent at fixed UTC time, ignoring client timezone | LATAM clients (UTC-5 to UTC-3) receive the digest at 2:00–4:00 AM local time | Send at 9:00 AM in the client's timezone; derive from `clients.market` (LATAM → UTC-5 by default) or store timezone in `clients` table |
| Notification preferences page has no "test notification" button | User opts in to weekly digest but is unsure if it's working; no confirmation | Add a "send me a test digest" button that triggers a single-recipient send immediately |
| Admin deactivates a user without confirmation and cannot undo immediately | Accidental deactivations lock out real users; frantic support call | Show a confirmation dialog with the user's name and email; provide a one-click "Reactivate" in the same UI |
| MRR chart renders with no loading state | Admin sees a blank chart area for 1-2s before data loads; looks broken | Show a skeleton loader or a "Loading revenue data…" placeholder while the Supabase query completes |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **2FA (SEC-01):** TOTP enrollment works — but verify that a logged-in user with an enrolled factor is redirected to `/verify-mfa` on next login, not admitted directly to `/portal`.
- [ ] **2FA (SEC-01):** MFA challenge UI works — but verify that a user with no factors enrolled bypasses the challenge and goes directly to `/portal` (middleware logic handles both cases).
- [ ] **2FA (SEC-01):** Unverified factor cleanup on re-enrollment: verify that opening the enrollment modal twice without completing does not hit the 10-factor limit.
- [ ] **Rate Limiting (SEC-02):** Rate limit triggers in local testing — but verify with two concurrent requests from different simulated serverless instances that the counter is shared (requires Redis, not in-memory).
- [ ] **Rate Limiting (SEC-02):** `/api/checkout` is rate-limited — but verify `/api/billing-portal` is also rate-limited (both routes are unauthenticated in the current codebase and equally exposed).
- [ ] **Weekly Digest (NOTIF-10):** Email sends correctly — but verify the `CRON_SECRET` check rejects a request without the header (curl the endpoint without the auth header; must return 401).
- [ ] **Weekly Digest (NOTIF-10):** Digest sends to all active users — but verify opted-out users (via NOTIF-11 preferences) do not receive it.
- [ ] **Notification Preferences (NOTIF-11):** Preferences save correctly — but verify that a user who opts out of `task_updated` emails does NOT receive one when a task is updated (trigger `notifyTaskEvent` via Vitest integration test after setting preference to false).
- [ ] **Admin User Management (ADMIN-07):** Invite sends email — but verify the public `users` profile row is created with the correct role and client association before the invited user accepts the email.
- [ ] **Admin User Management (ADMIN-07):** User is banned (deactivated) — but verify: (a) they cannot log in fresh, (b) existing session is invalidated within the JWT TTL, (c) reactivation restores access correctly.
- [ ] **MRR Chart (ADMIN-08):** Chart renders with data — but verify `ResponsiveContainer` is not causing a hydration mismatch error in the browser console. Check with `dynamic(..., { ssr: false })`.
- [ ] **MRR Chart (ADMIN-08):** Current MRR matches the number on the billing stat card — but verify subscriptions with `cancel_at_period_end = true` are correctly excluded or flagged.
- [ ] **Integration Tests (TEST-10):** Tests pass against local Supabase — but verify they do NOT connect to production when `SUPABASE_SERVICE_ROLE_KEY` is accidentally set to a production key (guard must check URL domain).
- [ ] **Visual Regression (TEST-11):** Snapshots pass locally — but verify CI generates and uses its own baseline (macOS-generated baselines will fail in CI Linux runners).

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| MFA middleware breaks login for non-MFA users in production | HIGH | Roll back middleware change immediately; fix condition; re-deploy; investigate affected users and provide direct password reset links |
| Unverified TOTP factors block user from enrolling | LOW | Admin uses Supabase Dashboard > Authentication > Users > [user] > MFA factors; delete unverified factors manually; add proactive cleanup code to prevent recurrence |
| Rate limiter using in-memory state (no Redis) ships to production | MEDIUM | Add Upstash Redis; swap the limiter implementation; no data migration needed; existing in-flight requests unaffected |
| Weekly digest sends to opted-out users | MEDIUM | Apology email to affected users; fix preference check in `notifyTaskEvent`; add integration test to prevent recurrence |
| Orphaned auth user (no profile row) after failed invite | LOW | Insert the missing profile row directly via Supabase Dashboard Table Editor or a one-off service-role script; add the database trigger to prevent recurrence |
| Banned user still has an active session | LOW | Call `supabase.auth.admin.signOut(userId, 'others')` from the admin console or a one-off script; add this call to the deactivation handler |
| Visual regression snapshots committed from macOS, CI fails on every PR | LOW | Delete all snapshot files; add `--update-snapshots` to CI; let CI generate new baselines; commit the new snapshots |
| MRR chart shows incorrect data (pending cancellations counted as active) | MEDIUM | Add `cancel_at_period_end` column via migration; update webhook handler to populate it; update chart query |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 2FA bypasses existing sessions (no AAL middleware) | SEC-01: 2FA/TOTP | Playwright test: login → portal without 2FA challenge fails for MFA-enrolled user |
| Unverified factor accumulation blocks re-enrollment | SEC-01: 2FA/TOTP | Enrollment modal opened 3x without completing → 4th attempt succeeds (factors cleaned up) |
| Login breaks for non-MFA users after middleware update | SEC-01: 2FA/TOTP | E2E test with non-enrolled user still reaches `/portal` directly after login |
| In-memory rate limiting on Vercel | SEC-02: Rate Limiting | Integration test verifies Redis counter increments (not per-instance Map) |
| Cron route without CRON_SECRET guard | NOTIF-10: Weekly Digest | `curl /api/cron/weekly-digest` without auth header returns 401 |
| Digest sends to opted-out users | NOTIF-10 + NOTIF-11 | Integration test: user with `weekly_digest_email = false` is not in the send list |
| Preferences not checked at send time | NOTIF-11: Notification Preferences | Vitest integration test: `notifyTaskEvent` skips opted-out recipients |
| Orphaned auth user on failed invite | ADMIN-07: User Management | DB trigger test: inserting to `auth.users` creates matching `users` row |
| Banned user active session not invalidated | ADMIN-07: User Management | E2E: deactivate user → existing session cookie rejected within test |
| MRR chart hydration mismatch (Recharts SSR) | ADMIN-08: MRR Chart | Zero hydration errors in browser console after chart renders |
| MRR overstated (cancel_at_period_end not tracked) | ADMIN-08: MRR Chart | `cancel_at_period_end` column exists in schema and is populated by Stripe webhook |
| Integration tests polluting production DB | TEST-10: API Integration Tests | Guard fails build if `SUPABASE_URL` is not localhost when `TEST_INTEGRATION=true` |
| Visual snapshots generated on macOS, fail in CI | TEST-11: Visual Regression | CI generates and commits baseline snapshots; subsequent CI runs compare against them |
| Sequential digest loop timeout | NOTIF-10: Weekly Digest | Load test the cron handler with 50 mock recipients; completes within Vercel 60s limit |

---

## Sources

- Supabase MFA/TOTP official docs: [https://supabase.com/docs/guides/auth/auth-mfa/totp](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- Supabase MFA overview: [https://supabase.com/docs/guides/auth/auth-mfa](https://supabase.com/docs/guides/auth/auth-mfa)
- GitHub discussion — MFA enrollment best practices: [https://github.com/orgs/supabase/discussions/16067](https://github.com/orgs/supabase/discussions/16067)
- Supabase `inviteUserByEmail` reference: [https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- Supabase user deactivation discussion: [https://github.com/orgs/supabase/discussions/9239](https://github.com/orgs/supabase/discussions/9239)
- Upstash ratelimit — edge rate limiting: [https://upstash.com/blog/edge-rate-limiting](https://upstash.com/blog/edge-rate-limiting)
- Upstash ratelimit — Next.js integration: [https://upstash.com/blog/nextjs-ratelimiting](https://upstash.com/blog/nextjs-ratelimiting)
- Vercel Cron Jobs official docs: [https://vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)
- Vercel Cron — securing cron routes (Next.js 14 app router): [https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)
- Recharts SSR + ResponsiveContainer pitfall: [https://leanylabs.com/blog/awesome-react-charts-tips/](https://leanylabs.com/blog/awesome-react-charts-tips/)
- Playwright visual regression flakiness: [https://www.houseful.blog/posts/2023/fix-flaky-playwright-visual-regression-tests/](https://www.houseful.blog/posts/2023/fix-flaky-playwright-visual-regression-tests/)
- Playwright snapshot testing 2026: [https://www.browserstack.com/guide/playwright-snapshot-testing](https://www.browserstack.com/guide/playwright-snapshot-testing)
- Stripe MRR accuracy pitfalls: [https://www.quantledger.app/blog/stripe-dashboard-mrr-accuracy](https://www.quantledger.app/blog/stripe-dashboard-mrr-accuracy)
- Supabase MFA RLS enforcement via AAL: [https://supabase.com/blog/mfa-auth-via-rls](https://supabase.com/blog/mfa-auth-via-rls)
- Codebase analysis: `platform/src/middleware.ts` — current auth middleware (no AAL check)
- Codebase analysis: `platform/src/app/[locale]/login/page.tsx` — current login flow (no challenge step)
- Codebase analysis: `platform/src/lib/notifications.ts` — `notifyTaskEvent` orchestrator (no preference check)
- Codebase analysis: `platform/src/app/api/checkout/route.ts` — no rate limiting
- Codebase analysis: `platform/src/app/api/billing-portal/route.ts` — no rate limiting
- Codebase analysis: `platform/supabase/migrations/001_schema.sql` — no `notification_preferences`, no `cancel_at_period_end`
- Codebase analysis: `platform/e2e/login.spec.ts` — current E2E login test (no 2FA scenario)

---
*Pitfalls research for: Next.js 15 + Supabase platform — v1.2 Security & Polish (2FA, rate limiting, digest, notification preferences, admin user management, MRR chart, integration + visual regression tests)*
*Researched: 2026-03-25*
