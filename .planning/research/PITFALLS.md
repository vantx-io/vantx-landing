# Pitfalls Research

**Domain:** Adding testing, admin dashboard, real-time notifications, and file uploads to an existing Next.js 14 + Supabase platform (v1.1 — Platform Hardening & Admin)
**Researched:** 2026-03-24
**Confidence:** HIGH (testing/Supabase patterns, RLS behavior, file upload mechanics) / MEDIUM (real-time channel scoping, email i18n edge cases)

---

## Critical Pitfalls

### Pitfall 1: Mocking Supabase in Tests Without Isolating the Service Client

**What goes wrong:**
Tests that import components or route handlers pull in `createClient()` or `createServiceClient()` from `src/lib/supabase/`. Without a mock, they attempt a real network connection to `localhost:54321`. When the local Supabase instance is not running (CI, first checkout), every test fails with a connection error instead of a meaningful assertion failure. Worse: tests that succeed only because the local DB has matching seed data give false confidence — they break on any other machine.

**Why it happens:**
The browser client (`createBrowserClient`) and server client (`createServerClient`) are both instantiated at module import time in the current codebase. Vitest/Jest can't intercept those calls without explicit mocking setup. Developers add a test, it "passes locally," and they move on without realizing the test is coupling to a live database.

**How to avoid:**
- Create `src/lib/supabase/__mocks__/client.ts` and `server.ts` as Vitest manual mocks. Return a typed object with `from`, `auth`, `storage` chains that return `{ data: ..., error: null }` by default, overridable per test.
- Never import the real Supabase client in unit tests. Use `vi.mock('@/lib/supabase/client')` in every test file that touches portal pages.
- For integration tests that need the real DB: gate them with a `TEST_INTEGRATION=true` env flag so they only run when local Supabase is explicitly started.
- Add `supabase:start` as a prerequisite step in the CI integration test job (not in the unit test job).

**Warning signs:**
- Tests pass locally but fail in CI with `ECONNREFUSED`.
- Test files import from `@/lib/supabase/client` or `@/lib/supabase/server` without a corresponding `vi.mock()` call.
- `npm test` output shows different counts on different machines.

**Phase to address:** Testing phase (Phase 1). Establish the mock infrastructure before writing a single test. Getting this wrong means every subsequent test needs to be rewritten.

---

### Pitfall 2: Testing Stripe Webhook Handler Without Raw Body Preservation

**What goes wrong:**
The Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts` calls `stripe.webhooks.constructEvent(body, sig, secret)` where `body` is obtained via `req.text()`. In test environments, developers typically mock `Request` by passing a JSON object or parsed body. `constructEvent` requires the **exact raw byte string** that was signed — any re-serialization (even `JSON.stringify(JSON.parse(rawBody))`) changes whitespace and invalidates the signature. Tests using a constructed `Request` with `JSON.stringify(payload)` will always fail signature verification.

**Why it happens:**
The Stripe signing mechanism is documented in webhook setup guides but developers writing unit tests construct Request objects with `new Request(url, { body: JSON.stringify(event) })` without realizing Stripe's HMAC is computed over the original raw bytes.

**How to avoid:**
- In webhook tests, use Stripe's official test helper: `stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret: testSecret })` to produce a valid `stripe-signature` header for the exact raw body string you're testing.
- Capture real Stripe event payloads using `stripe listen --print-json` and store them as `.json` fixture files in `src/app/api/webhooks/stripe/__fixtures__/`. Load them with `fs.readFileSync` (as raw string, not parsed) in tests.
- For the idempotency tests (duplicate event delivery), reuse the same raw fixture string with a new header to verify the handler returns 200 without double-inserting.

**Warning signs:**
- Webhook test always hits the `catch` block with "No signatures found matching the expected signature for payload."
- Webhook test uses `body: JSON.stringify(event)` instead of a pre-serialized fixture string.
- No fixture files in the webhooks directory — raw payloads are constructed inline.

**Phase to address:** Testing phase (Phase 1). The webhook handler contains the most critical business logic (subscription creation, payment recording). It must be the first integration test written.

---

### Pitfall 3: Admin Dashboard Using Client-Side Role Check Instead of Server-Side

**What goes wrong:**
The current portal layout (`src/app/[locale]/portal/layout.tsx`) is a `'use client'` component that fetches the user profile via `supabase.auth.getUser()` + `supabase.from('users').select()` in a `useEffect`. Adding admin-only nav items or admin pages by checking `user.role === 'admin'` in JSX means the role check happens **after** the page has rendered. A client user briefly sees admin controls (or can navigate to admin URLs) before the check resolves.

**Why it happens:**
The existing pattern for the entire portal is client-side data fetching. Developers extending it for admin will naturally follow the same pattern: add a role check in the useEffect callback, conditionally render admin nav items. This works visually but provides zero actual protection.

**How to avoid:**
- Admin routes (`/portal/admin/*`) must be protected at the middleware level, not in `useEffect`. Extend `src/middleware.ts` to check `user.role` from the session or a fast DB lookup before serving admin pages. Redirect non-admins to `/portal` with a 307.
- Do NOT rely on the existing portal layout's `useEffect` check as the authorization gate. It is a UX convenience, not a security boundary.
- The admin section should use a separate layout (`src/app/[locale]/portal/admin/layout.tsx`) that is a Server Component fetching the user role server-side on every request.
- Add a RLS policy on any admin-writable tables: `USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'))`. The schema already has `"Admins see all tasks"` policy — add equivalent INSERT/UPDATE/DELETE policies for admin-only operations.

**Warning signs:**
- Admin nav items appear in the sidebar before the `useEffect` resolves (visible briefly in loading state).
- Admin page route is accessible by navigating directly to the URL as a client-role user.
- Role check is the only thing in a `useEffect` or inside a JSX ternary in a client component.
- No middleware extension for `/portal/admin`.

**Phase to address:** Admin dashboard phase (Phase 2). Design the authorization model first, before building any admin UI. A retroactive security fix on admin is far more expensive than designing it correctly.

---

### Pitfall 4: Supabase Realtime Subscriptions Leaking Across Clients

**What goes wrong:**
When adding real-time notifications (e.g., `supabase.channel('notifications').on('postgres_changes', ...).subscribe()`), subscriptions are scoped by the JS runtime, not by RLS. A bug in channel naming or filter configuration causes one client's connection to receive notification events intended for another client. In a multi-tenant platform where clients pay for confidential SRE work, data leakage across tenants is a P0 incident.

**Why it happens:**
Developers assume RLS on the `notifications` table will automatically restrict what Postgres changes are broadcast over Realtime. RLS does control what a user can SELECT — but Supabase Realtime's `postgres_changes` event is broadcast based on the table-level `REPLICA IDENTITY` and the channel filter, not purely on RLS. If the filter is misconfigured or missing, all row changes broadcast to all subscribers of that table.

**How to avoid:**
- Always include a `filter` clause that scopes to the current user's `client_id`: `{ event: '*', schema: 'public', table: 'notifications', filter: 'client_id=eq.' + clientId }`.
- Enable `REPLICA IDENTITY FULL` on the notifications table so Supabase can evaluate row-level filters correctly.
- In Supabase Dashboard > Realtime, explicitly enable the table for Realtime (it is opt-in per table, not automatic).
- Test cross-tenant isolation: log in as Client A, subscribe to notifications, then from a service-role client trigger an insert for Client B — verify Client A's subscription receives nothing.
- Use unique channel names per user session: `'notifications:' + userId` prevents accidental shared channel state.

**Warning signs:**
- Channel subscription has no `filter` property — subscribed to all changes on the table.
- No cross-tenant isolation test in the test suite.
- Realtime not enabled on the notifications table in Supabase Dashboard.
- `REPLICA IDENTITY` is set to `DEFAULT` (only broadcasts PK) instead of `FULL`.

**Phase to address:** Notifications phase (Phase 3). The tenant isolation test must be written and pass before the feature ships.

---

### Pitfall 5: File Upload Bypassing RLS via Storage Bucket Path Mismatch

**What goes wrong:**
Supabase Storage uses RLS policies with path-based matching (e.g., `storage.foldername(name)[1] = auth.uid()`). When uploading task attachments, developers set the storage path to something like `task-attachments/{filename}` — a flat structure. The RLS policy is written expecting `{user_id}/{filename}`. The policy silently fails to match, and the fallback behavior depends on whether the bucket is public or private. On a private bucket with misconfigured policy, uploads fail for all users. On an accidentally public bucket, all files are readable by anyone with the URL.

**Why it happens:**
Storage RLS policies require the developer to reason about path structure at policy definition time, then enforce that same structure at upload time. These two places are written at different moments, by potentially different people, with no type-safety between them. The mismatch is invisible until runtime.

**How to avoid:**
- Define the canonical storage path structure before writing any upload code: `task-attachments/{client_id}/{task_id}/{filename}`. Document it as a constant.
- Write the RLS policy to match this exact structure: `(storage.foldername(name))[1] = (SELECT client_id::text FROM users WHERE id = auth.uid())`.
- Keep the bucket **private** by default. Generate signed URLs for file download with a short expiry (1 hour).
- Write an integration test that: (a) uploads a file as Client A, (b) attempts to download it as Client B, (c) verifies Client B gets a 403/401.
- The `task_comments` table already has `attachments TEXT[]` — store only the Supabase Storage path (not a public URL) in this column. Generate signed URLs at display time.

**Warning signs:**
- Storage bucket is public.
- Upload path is flat (`{filename}`) with no user or client namespace.
- Signed URL generation is not implemented — raw storage URLs are stored in the DB.
- No cross-tenant file access test.

**Phase to address:** File uploads phase (Phase 4). Storage RLS design must be settled before a single upload button exists in the UI.

---

### Pitfall 6: next-intl Translation Keys Missing for New Features Cause Silent Fallback

**What goes wrong:**
The platform already uses `next-intl` with `en.json` and `es.json` message files. When adding new features (admin dashboard, notifications, file uploads), developers add English UI strings inline or as new translation keys in `en.json` but forget to add the equivalent to `es.json`. `next-intl` does not throw — it silently returns the key name as the rendered string (e.g., "admin.clients.title" appears verbatim in the Spanish UI). This is only caught during manual testing in ES locale, which developers often skip.

**Why it happens:**
The two JSON files must be kept in sync manually. There is no build-time check that both files have all the same keys. Adding a string to `en.json` is the natural workflow; syncing `es.json` is an afterthought.

**How to avoid:**
- Add a CI check (or `package.json` script) that diffs the key structure of `en.json` and `es.json`: `node -e "const en = require('./en.json'); const es = require('./es.json'); /* walk keys, assert structural parity */"`. Fail the build if keys are missing in either file.
- In development, set `next-intl`'s `onError` handler in `src/i18n/request.ts` to `throw` in development mode (it defaults to logging), making missing translation keys loud.
- Work in pairs: write the English key and Spanish key in the same commit. Code review must check that both files were updated.
- For admin-only strings that will never appear to Spanish-speaking clients, document the decision explicitly rather than leaving Spanish keys empty.

**Warning signs:**
- Literal key strings like `"admin.clients.title"` visible in the ES locale UI.
- `en.json` and `es.json` have different key counts.
- Pull requests modifying UI text only touch `en.json`.
- No automated key-parity check in CI.

**Phase to address:** All phases. Add the key-parity CI check in Phase 1 (testing infrastructure) so it is enforced from the start.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Testing only the happy path in webhook tests | Faster test writing | Payment failures, cancellations, duplicate events are untested — first real billing issue hits production cold | Never — webhook handlers need adversarial tests |
| Admin check in `useEffect` only (client-side) | Reuses existing portal layout pattern | Admin routes accessible via direct URL navigation; security depends entirely on RLS | Never — middleware protection is required |
| Polling for notifications (`setInterval` + `supabase.from('notifications').select()`) | No Realtime subscription setup needed | Every connected user hammers the DB every N seconds; 10 concurrent users = 10 req/s on a free Supabase tier | Only acceptable as MVP fallback if Realtime encounters blocking issues |
| Storing public storage URLs in `task_comments.attachments` | No signed-URL generation code needed | Files permanently publicly accessible; storage URLs do not expire; leak risk if someone gets the path | Never in production — always use signed URLs with expiry |
| Using `any` type in upload/download code | Faster implementation | TypeScript won't catch incorrect field names; storage path bugs become runtime errors | Never — Supabase Storage operations have well-typed SDKs |
| Sending transactional email in the webhook handler synchronously (await inside switch) | Simple — no queue | Webhook times out (>30s) on email provider slowness; Stripe retries the webhook; duplicate emails sent | Never — fire-and-forget with logging, or use a queue |
| Hard-coding `'en'` as the email template locale | Removes bilingual email complexity | LATAM clients (`market = 'LATAM'`) receive English emails for a product sold in Spanish | Only acceptable as an explicitly documented v1.1 deferral, not an accident |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Realtime | Subscribe to a table without enabling it in Dashboard > Realtime | Enable Realtime per table explicitly; it is opt-in |
| Supabase Realtime | Missing `filter` parameter in `postgres_changes` subscription | Always pass `filter: 'client_id=eq.' + clientId` for tenant isolation |
| Supabase Storage | Creating a public bucket for task attachments | Create a private bucket; generate 1-hour signed URLs at download time |
| Supabase Storage | Writing RLS policy using `auth.uid()` path matching but uploading to a client-scoped path | Keep path structure and RLS policy in sync; document the canonical path as a constant |
| Stripe webhook (tests) | Using `JSON.stringify(mockEvent)` as the request body in unit tests | Use Stripe's `generateTestHeaderString` with a pre-serialized raw fixture string |
| Stripe webhook (production) | Sending email in the same `async switch` block | Fire email asynchronously (`.then().catch()`) to avoid timeout-triggered retries |
| next-intl email templates | Using `useTranslations()` hook inside a server-side email renderer | Use `getTranslations(locale)` (async, server-safe) instead of the React hook |
| Grafana iframe (admin view) | Embedding admin-level Grafana dashboards in the admin portal using the same anonymous-viewer URL | Admin views should use a separate Grafana service account token scoped to admin org; do not reuse the client-facing anonymous token |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Notification polling with `setInterval` | DB query count spikes with concurrent users; free Supabase tier rate limits | Use Supabase Realtime channel subscription instead | ~5-10 concurrent logged-in users |
| Portal layout fetching auth + profile + client + subscription on every navigation (existing bug) | Each page change fires 3 Supabase queries; adds ~200-400ms per navigation | Extract to a React context provider wrapping the portal; fetch once on mount, not on every route change | Immediately visible; gets worse as the portal grows |
| Admin page loading all clients + all subscriptions + all metrics in one query without pagination | Admin dashboard takes 3-5s to load as data grows | Add pagination (limit/offset or cursor) from the first render; never `select('*')` on admin tables without a LIMIT | When clients table exceeds ~50 rows |
| Uploading files directly to Supabase Storage from the browser on slow connections without progress indication | User clicks upload, waits with no feedback, clicks again, double-uploads | Show upload progress using the `onUploadProgress` callback from the Supabase storage JS client | First user on a slow mobile connection |
| Generating signed URLs for all attachments on every comment load | If a task has 20 comments each with 3 attachments, that is 60 signed URL API calls on page load | Batch generate signed URLs only for the visible/expanded comment; lazy-generate on expand | ~10+ comments with attachments per task |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Admin routes protected only by client-side role check in `useEffect` | Any client-role user can navigate to `/portal/admin` and see admin data before the check resolves | Extend `src/middleware.ts` to gate `/portal/admin/*` with a server-side role check |
| `/api/checkout` and `/api/billing-portal` routes accept `clientId` from request body without session validation (existing concern) | Authenticated user can trigger checkout/billing portal for any other client's account | Derive `clientId` from the authenticated session server-side; never trust the request body for identity |
| Service role key (`createServiceClient`) used in admin API routes | Admin API routes that use service role bypass all RLS — a single injection vulnerability gives full DB access | Scope service role strictly to webhook handlers; use the user's session client for admin operations and rely on admin-scoped RLS policies |
| Supabase Storage bucket set to public for "convenience" during development | Anyone with a guessed storage path can download client attachments (task files, reports) | Keep buckets private; signed URLs with short expiry; never store public URL in DB |
| Email sending triggered from a client component via a fetch to an unprotected API route | Any caller can trigger transactional emails for arbitrary email addresses | Email-sending API routes must validate the session and derive recipient from `auth.uid()`, not from request body |
| Admin impersonation (viewing platform as a specific client) without audit log | No trace of which admin accessed which client data | Log admin access events to a `audit_log` table before building any admin impersonation feature |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Admin and client views sharing the same sidebar with admin items hidden by JS | Clients on slow connections briefly see admin nav items before the role check resolves | Admin lives at a separate route prefix (`/portal/admin`) protected by middleware; the shared sidebar never renders admin items for clients |
| Real-time notification badge disappearing on page navigation (no persistence) | User sees a notification, navigates away, badge disappears — unread state is lost | Store read/unread state in the `notifications` table, not in React state; derive badge count from DB |
| File upload replacing the comment form submit button with a separate "Attach" button | Confusing UX — users try to submit the comment before attaching, or forget to attach | Integrate attachment into the comment form; one submit action posts comment + attachments atomically |
| Email notifications sent in English to LATAM clients | Feels impersonal and unprofessional to Spanish-speaking clients paying $5,995/mo | Use `client.market` or `user` locale preference to select email template language; default to Spanish for `market = 'LATAM'` |
| Notification bell shows total notification count including dismissed ones | Stale badge count creates "crying wolf" effect — users stop acting on notifications | Badge count = unread (not dismissed) notifications only; implement dismiss/mark-as-read before shipping the bell |
| Admin dashboard loads all data eagerly without loading states | Admin sees a blank/broken UI for 2-3 seconds on first load | Show skeleton loaders per card/section; load critical summary stats first, detail tables lazily |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Testing:** Test suite runs `npm test` and all pass — but tests mock nothing. Verify tests pass with `NEXT_PUBLIC_SUPABASE_URL` pointing to a non-existent host.
- [ ] **Testing:** Webhook handler tests cover `invoice.payment_failed` and `customer.subscription.deleted`, not just the happy path `checkout.session.completed`.
- [ ] **Admin dashboard:** Admin nav item appears in sidebar conditionally — but verify direct URL navigation to `/portal/admin` as a `client`-role user returns a redirect, not the page.
- [ ] **Admin dashboard:** Admin can view all clients — but verify the RLS policy prevents a client user from calling the same query and seeing other clients' data.
- [ ] **Notifications (Realtime):** Channel subscription appears to work — but verify in the Network tab that no notification events from Client B appear in Client A's WebSocket messages.
- [ ] **Notifications (email):** Email sends in development — but verify the `to:` address is derived from `auth.uid()` session, not from the request body.
- [ ] **File uploads:** Upload succeeds and file appears in Supabase Storage — but verify that navigating to the raw storage URL as a different authenticated user returns 403.
- [ ] **File uploads:** Attachment shows in the task comment — but verify the display URL is a signed URL (short expiry), not a permanent public URL.
- [ ] **i18n:** All new UI strings appear correctly in EN locale — but manually test every new screen in ES locale and verify no literal key strings render.
- [ ] **Email i18n:** Email sends correctly with EN template — but verify LATAM-market clients receive the ES template.
- [ ] **Types:** `src/lib/types.ts` comment says "generated" but there is no `db:types` script. After adding the `notifications` table migration, verify `types.ts` was updated to include the new table type.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tests coupled to live DB are already written | MEDIUM | Add Vitest manual mocks; rewrite tests to use mocks; gate DB-hitting tests behind `TEST_INTEGRATION=true` flag |
| Admin route was protected only by client-side check and a client user accessed it | HIGH | Audit all admin data that user could have seen; rotate any sensitive data displayed; add middleware protection immediately; consider logging the access |
| Supabase Storage bucket created as public by mistake and files were uploaded | HIGH | Change bucket to private immediately; invalidate any distributed public URLs (not possible natively — regenerate all stored file references); audit who accessed the bucket in Supabase logs |
| Realtime subscription missing `filter` — cross-tenant notification events received | HIGH | Unsubscribe all active channels; add filter to subscription code; verify isolation; notify affected clients if sensitive data was exposed |
| Transactional email sent twice due to Stripe webhook retry on timeout | LOW | Implement idempotency key check before sending: store `stripe_event_id` on the notification record; check for existing record before inserting/sending |
| Translation key missing in `es.json` ships to production | LOW | Add the missing key to `es.json`; deploy; no data migration needed |
| `types.ts` diverged from schema after adding `notifications` table | MEDIUM | Run `npx supabase gen types typescript --local > src/lib/types.ts`; fix any TypeScript errors that surface; likely reveals queries that were silently using wrong field names |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Supabase mock missing in tests | Phase 1: Testing infrastructure | `npm test` passes with `NEXT_PUBLIC_SUPABASE_URL=http://0.0.0.0:1` |
| Webhook test using re-serialized body | Phase 1: Testing infrastructure | Webhook test uses `generateTestHeaderString` with raw fixture string |
| Translation key parity CI check | Phase 1: Testing infrastructure | CI fails when `en.json` and `es.json` key counts differ |
| Admin route protected client-side only | Phase 2: Admin dashboard | Direct URL navigation to `/portal/admin` as `client` role returns 307 |
| Admin using service role client | Phase 2: Admin dashboard | Admin API routes use `createServerSupabase()` (user-scoped), not `createServiceClient()` |
| Realtime cross-tenant notification leak | Phase 3: Notifications | Integration test: Client B's subscription receives zero events after Client A insert |
| Notification email sent synchronously in webhook | Phase 3: Notifications | Webhook handler returns 200 within 5s even when email provider is unavailable |
| Email locale not derived from client market | Phase 3: Notifications | LATAM-market user receives ES email in test fixture |
| Storage bucket public by accident | Phase 4: File uploads | Bucket policy is `PRIVATE`; raw storage URL for a test file returns 403 as a different user |
| Storage path/RLS policy mismatch | Phase 4: File uploads | Cross-tenant file access test returns 403 |
| `types.ts` not updated after new migration | All phases | `db:types` script in `package.json`; run after every migration |

---

## Sources

- Codebase analysis: `platform/supabase/migrations/001_schema.sql` — existing RLS policy patterns
- Codebase analysis: `platform/src/middleware.ts` — current auth middleware scope (only `/portal` and `/login`)
- Codebase analysis: `platform/src/app/api/webhooks/stripe/route.ts` — synchronous webhook handler structure
- Codebase analysis: `platform/src/app/[locale]/portal/layout.tsx` — client-side role pattern
- Codebase analysis: `platform/src/lib/supabase/server.ts` — service role client usage
- Codebase analysis: `.planning/codebase/CONCERNS.md` — documented tech debt and security concerns
- Codebase analysis: `.planning/codebase/TESTING.md` — zero automated tests currently
- Supabase documentation (authoritative): Realtime Postgres Changes filtering, Storage RLS, `supabase gen types`
- Stripe documentation (authoritative): Webhook signature verification, `generateTestHeaderString` test helper
- next-intl documentation (authoritative): `getTranslations` vs `useTranslations` for server-side rendering

---
*Pitfalls research for: Next.js 14 + Supabase platform — v1.1 testing, admin, notifications, file uploads*
*Researched: 2026-03-24*
