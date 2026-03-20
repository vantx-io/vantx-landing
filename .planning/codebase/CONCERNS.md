# Codebase Concerns

**Analysis Date:** 2026-03-20

---

## Tech Debt

**Duplicate Stripe instance initialization:**
- Issue: `src/app/api/checkout/route.ts` (line 5) creates its own `new Stripe(...)` directly, while `src/app/api/billing-portal/route.ts` correctly imports from `src/lib/stripe.ts`. Two divergent patterns for the same singleton.
- Files: `src/app/api/checkout/route.ts`, `src/lib/stripe.ts`
- Impact: Stripe SDK is instantiated twice with potentially different API version strings; changes to Stripe config must be made in two places.
- Fix approach: Replace the inline `new Stripe(...)` in `checkout/route.ts` with `import { stripe } from '@/lib/stripe'`.

**Hardcoded `plan: 'retainer'` in webhook handler:**
- Issue: `src/app/api/webhooks/stripe/route.ts` line 24 always upserts `plan: 'retainer'` regardless of which Stripe Price ID was purchased.
- Files: `src/app/api/webhooks/stripe/route.ts`
- Impact: Customers purchasing a Checkup, Fractional SRE, or any other plan will have their subscription incorrectly recorded as `retainer` in the database.
- Fix approach: Pass the plan type in Stripe `metadata` at checkout session creation and read it back in the webhook handler.

**`current_period_end` not set from Stripe in webhook:**
- Issue: The `checkout.session.completed` handler in `src/app/api/webhooks/stripe/route.ts` sets `current_period_start` to `new Date()` but never sets `current_period_end`. The actual period data comes from the Stripe subscription object, which is not fetched.
- Files: `src/app/api/webhooks/stripe/route.ts`
- Impact: The billing page (`src/app/portal/billing/page.tsx` line 65) shows "Próximo cobro:" which will always be blank for subscriptions created via webhook, because `current_period_end` is never populated.
- Fix approach: Retrieve the Stripe subscription (`stripe.subscriptions.retrieve(session.subscription)`) inside the webhook handler to get `current_period_start` and `current_period_end`.

**`invoice.paid` webhook does not link `subscription_id`:**
- Issue: When inserting into `payments` in `src/app/api/webhooks/stripe/route.ts` (line 36-43), the `subscription_id` FK is omitted even though the `payments` table has the column and the subscription record exists.
- Files: `src/app/api/webhooks/stripe/route.ts`
- Impact: Payment history cannot be queried by subscription; analytics and billing reconciliation are harder.
- Fix approach: Include `subscription_id` from the resolved `sub` row when inserting the payment record.

**k6 client registry requires code change to add new clients:**
- Issue: `08-k6-framework/vantix-k6/lib/config.js` has a commented-out `import scaleapp` pattern. Adding a second client (ScaleApp) means editing the file, adding an import, and registering in the `clients` object.
- Files: `08-k6-framework/vantix-k6/lib/config.js`, `08-k6-framework/vantix-k6/clients/_template.js`
- Impact: Adding a new client is not self-service; it creates friction at scale.
- Fix approach: k6 supports dynamic file loading via `open()` for data files. Alternatively, document the exact change needed so it is a known one-file edit.

**`push-to-supabase.js` `synthetic` and `lighthouse` types are stubs:**
- Issue: `08-k6-framework/vantix-k6/scripts/push-to-supabase.js` lines 48-52 and 94-96 `console.log` for `synthetic` and `lighthouse` types but do not actually write any data to Supabase.
- Files: `08-k6-framework/vantix-k6/scripts/push-to-supabase.js`
- Impact: Synthetic monitoring data and Lighthouse scores from automated runs are never persisted to the database; the portal dashboard shows no data from these pipelines.
- Fix approach: Implement the upsert logic for `weekly_metrics` (synthetic) and `test_results` / `monthly_metrics` (lighthouse), mirroring the `monthly_eval` and `weekly` case blocks.

**Types file is hand-maintained, not generated:**
- Issue: `src/lib/types.ts` comment says "Generated from Supabase schema" but the `package.json` has no `generate:types` script and Supabase CLI type generation is not configured.
- Files: `src/lib/types.ts`, `package.json`
- Impact: Schema changes in `supabase/migrations/001_schema.sql` will silently diverge from the TypeScript types, causing runtime errors that pass type-checking.
- Fix approach: Add `"db:types": "npx supabase gen types typescript --local > src/lib/types.ts"` to `package.json` and run it after each migration.

---

## Known Bugs

**`getOrCreateCustomer` in `src/lib/stripe.ts` does not persist the new customer ID:**
- Symptoms: A new Stripe customer is created in `getOrCreateCustomer()` (line 25-29 of `src/lib/stripe.ts`) but the returned `customer.id` is never written back to `subscriptions.stripe_customer_id` in Supabase. The function in `checkout/route.ts` (lines 18-23) correctly does this manually, but the shared helper omits it.
- Files: `src/lib/stripe.ts`
- Trigger: Any caller using the shared `getOrCreateCustomer()` utility instead of the inline version in `checkout/route.ts`.
- Workaround: The current `checkout/route.ts` does the update manually (line 23), so it is not broken in practice today, but the helper is incorrect.

**Grafana iframe embedded without authentication:**
- Symptoms: `docker-compose.yml` sets `GF_AUTH_ANONYMOUS_ENABLED=true` and `GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer`. The iframe in `src/app/portal/grafana/page.tsx` points to `process.env.NEXT_PUBLIC_GRAFANA_URL` with no token.
- Files: `src/app/portal/grafana/page.tsx`, `07-plataforma/vantix-platform/docker-compose.yml`
- Trigger: Any user who discovers the Grafana URL (exposed on port 3001) can access all dashboards without authentication.
- Workaround: This is only viable in a local dev scenario; before production deployment Grafana anonymous access must be disabled and service account tokens used for embedding.

**Task comment `user_id` seeded with nil UUID:**
- Symptoms: `supabase/seed.sql` lines 70-71 insert task comments with `user_id = '00000000-0000-0000-0000-000000000000'`, which does not reference any real user row. `scripts/seed-demo.js` patches this post-hoc (lines 114-121) but only if `jose@vantix.cl` exists.
- Files: `supabase/seed.sql`, `scripts/seed-demo.js`
- Trigger: If `seed-demo.js` fails or is not run, comments have an invalid FK that violates the `REFERENCES users(id)` constraint (depending on whether the FK is deferred).
- Workaround: Run `npm run db:seed` after every `npm run db:reset`.

**Login page exposes demo credentials in the UI:**
- Symptoms: `src/app/login/page.tsx` line 51-53 renders `Demo: juan@novapay.com / demo2026` in plain text for all visitors, including production deployments.
- Files: `src/app/login/page.tsx`
- Trigger: Any visitor to the login page.
- Workaround: Remove the credentials hint before any production or client-facing deployment.

---

## Security Considerations

**Checkout API endpoint has no authentication:**
- Risk: `src/app/api/checkout/route.ts` accepts a `clientId` from the request body without verifying that the authenticated session belongs to that client. Any authenticated user (or unauthenticated user if session middleware is bypassed) can trigger a checkout for any other client's account.
- Files: `src/app/api/checkout/route.ts`
- Current mitigation: Middleware enforces auth for `/portal` routes; the API routes at `/api/` are not covered by the middleware matcher (only `/portal/:path*` and `/login` are in the config at `src/middleware.ts` line 38).
- Recommendations: Add server-side session validation inside the API handlers; derive `clientId` from the authenticated user's JWT/session rather than trusting the request body.

**Billing portal API has no authentication:**
- Risk: Same pattern as checkout — `src/app/api/billing-portal/route.ts` accepts `clientId` from the body and opens a Stripe billing session for the matching customer without verifying the caller owns that account.
- Files: `src/app/api/billing-portal/route.ts`
- Current mitigation: None beyond relying on the frontend not calling with another client's ID.
- Recommendations: Validate `clientId` against the session user server-side.

**API routes under `/api/` are outside middleware protection:**
- Risk: The middleware matcher (`src/middleware.ts` line 38) only covers `/portal/:path*` and `/login`. All `/api/*` routes are not session-gated at the middleware level.
- Files: `src/middleware.ts`
- Current mitigation: Supabase RLS policies protect database reads for client-scoped data; however, write operations via the service-role client in the API routes bypass RLS.
- Recommendations: Add `/api/(billing-portal|checkout)` to the middleware matcher, or add per-handler session checks.

**Service role key used in API routes without scope restriction:**
- Risk: `createServiceClient()` in `src/lib/supabase/server.ts` uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses all RLS policies. This client is used in webhook handlers and checkout routes, making any injection in those routes a full-database compromise.
- Files: `src/lib/supabase/server.ts`, `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`
- Current mitigation: Stripe webhook signature verification prevents replay attacks; checkout/billing-portal lack equivalent verification.
- Recommendations: Scope service-role usage strictly to webhook handlers; use the authenticated user's session client for checkout/billing-portal routes.

**Grafana admin password in `.env.local.example`:**
- Risk: `.env.local.example` contains `GRAFANA_ADMIN_PASSWORD=vantix2026`, a hardcoded weak password. Teams that do not change this before production deployment will have a publicly-exposed Grafana with a known password (port 3001 is in `docker-compose.yml`).
- Files: `07-plataforma/vantix-platform/.env.local.example`, `07-plataforma/vantix-platform/docker-compose.yml`
- Current mitigation: None; the docker-compose defaults to this value if the env var is not set.
- Recommendations: Remove the password value from the example file; require operators to set it explicitly.

**NovaPay synthetic user credentials in version control:**
- Risk: `08-k6-framework/vantix-k6/clients/novapay.js` lines 58-59 include default fallback credentials (`synthetic@vantix.cl` / `test-token-2026`) that are checked into git. These are used against the production client API.
- Files: `08-k6-framework/vantix-k6/clients/novapay.js`
- Current mitigation: The `||` operator means they are only active if env vars are not set; `.env.example` marks them as overridable.
- Recommendations: Remove the hardcoded defaults; fail fast if env vars are missing.

---

## Performance Bottlenecks

**Dashboard page fires 5 sequential Supabase queries on mount:**
- Problem: `src/app/portal/page.tsx` `load()` function (lines 44-68) makes 5 separate `await supabase.from(...)` calls sequentially: `users`, `clients`, `monthly_metrics`, `weekly_metrics`, `reports`, `tasks`. The queries are not parallelized with `Promise.all`.
- Files: `src/app/portal/page.tsx`
- Cause: Sequential `await` in a single async function.
- Improvement path: Wrap independent queries in `Promise.all([...])` after the initial user/profile lookup, reducing waterfall latency by approximately 4x on the data-fetch phase.

**Portal layout re-fetches auth and profile on every navigation:**
- Problem: `src/app/portal/layout.tsx` is a `'use client'` component that runs `load()` in a `useEffect` on every mount (line 26). In a Next.js App Router SPA-style navigation the layout can remount, refetching user, profile, client, and subscription on every route change within the portal.
- Files: `src/app/portal/layout.tsx`
- Cause: No caching layer or React context; every page transition triggers 3 Supabase queries.
- Improvement path: Move auth/profile data into a React context provider wrapping the portal layout, or use Next.js server components for the layout data fetch.

**`dangerouslySetInnerHTML` with a custom markdown renderer:**
- Problem: `src/app/portal/tutorials/page.tsx` lines 14-29 implement a hand-rolled regex markdown-to-HTML renderer that uses `dangerouslySetInnerHTML`. No sanitization is applied to the Supabase-stored `content_md`.
- Files: `src/app/portal/tutorials/page.tsx`
- Cause: Avoids adding a markdown library dependency.
- Improvement path: Use a proper library (`react-markdown` or `marked` with DOMPurify sanitization), especially since `content_md` is admin-controlled today but may be user-editable in future.

---

## Fragile Areas

**Single Supabase migration file for entire schema:**
- Files: `supabase/migrations/001_schema.sql`
- Why fragile: All schema changes must be added as new migration files (`002_`, `003_`, etc.), but the project currently has only one file. If a developer modifies `001_schema.sql` directly and runs `db reset`, it works locally but breaks incremental migration for any deployed instance.
- Safe modification: Always create new numbered migration files (`002_schema.sql`). Never edit `001_schema.sql`.
- Test coverage: No migration tests exist.

**`supabase/seed.sql` uses hardcoded UUIDs:**
- Files: `supabase/seed.sql`
- Why fragile: Client rows use fixed UUIDs (`11111111-...`, `22222222-...`). Scripts like `seed-demo.js` reference these UUIDs by convention. Any reset without these exact IDs causes FK violations in task comments and other cross-referenced rows.
- Safe modification: Always reset via `npm run db:reset` followed immediately by `npm run db:seed`; never run `seed.sql` in isolation on a non-empty database.

**Grafana iframe depends on local Docker service:**
- Files: `src/app/portal/grafana/page.tsx`
- Why fragile: The iframe `src` is built from `process.env.NEXT_PUBLIC_GRAFANA_URL` which defaults to `http://localhost:3001`. If Grafana is not running, the iframe shows a blank/error state with no user-facing fallback.
- Safe modification: Add a fallback UI that detects iframe load failure and shows an actionable message; the current placeholder text is hardcoded in the template string (line 52).

**RLS policies missing for several tables:**
- Files: `supabase/migrations/001_schema.sql`
- Why fragile: `incidents`, `monthly_metrics`, `weekly_metrics`, `services`, and `tutorials` have `ENABLE ROW LEVEL SECURITY` but missing or very limited policies (services/tutorials only have public SELECT). There is no admin-only INSERT/UPDATE/DELETE policy for client-scoped tables like `incidents`, `monthly_metrics`, or `weekly_metrics`. Any admin/engineer inserting data must use the service-role client, which bypasses RLS entirely.
- Safe modification: Add explicit admin policies (`USING (role IN ('admin','engineer'))`) for all tables before adding any write-path UI for internal users.

**`services/page.tsx` "Solicitar" button has no action:**
- Files: `src/app/portal/services/page.tsx` line 60
- Why fragile: The button renders with `{svc.is_active ? 'Solicitar' : 'Próximamente'}` but clicking "Solicitar" does nothing — there is no `onClick` handler. Users who click it will see no response.
- Safe modification: Add an `onClick` that routes to the billing/checkout flow or opens a contact form before any client-facing demo.

---

## Scaling Limits

**Supabase local development only — no production hosting documented:**
- Current capacity: Local Supabase via `npx supabase start` (PostgreSQL on `localhost:54321`).
- Limit: Local Supabase is a development tool. Production requires a hosted Supabase project (supabase.com) with separate project URL, anon key, and service role key.
- Scaling path: Create a hosted Supabase project; update env vars. No code changes required.

**Prometheus has no persistent storage configured in docker-compose:**
- Current capacity: `docker-compose.yml` mounts only a config file for Prometheus; no named volume for Prometheus data storage.
- Limit: Prometheus data is lost on `docker compose down`. Grafana `grafana-data` volume persists dashboard configurations but not metrics data.
- Scaling path: Add a `prometheus-data` named volume; configure `--storage.tsdb.retention.time` for the desired retention window.

---

## Dependencies at Risk

**`docx` version `^9.1.1` — no PDF generation in-process:**
- Risk: The report generator (`09-generator/generate.js`) depends on LibreOffice (`libreoffice --headless`) for PDF conversion. LibreOffice is not a Node.js dependency and must be installed separately on the system.
- Impact: PDF generation silently skips on machines without LibreOffice. The generator prints a warning but exits successfully.
- Migration plan: Use a Node-native PDF library (e.g., `pdfkit`) or a headless browser (Puppeteer) for PDF output without requiring LibreOffice.

**`next` pinned to `14.2.18` — Next.js 15 released:**
- Risk: Next.js 14 is an older minor, though still maintained. Several React 19 features and App Router improvements require Next.js 15+.
- Impact: Low immediate risk; upgrade requires testing async params handling changes in Next.js 15.
- Migration plan: Upgrade to Next.js 15 when comfortable; review breaking changes for `cookies()` and `headers()` which are now async.

---

## Missing Critical Features

**No tests of any kind:**
- Problem: There are no unit tests, integration tests, or E2E tests in the platform codebase. `package.json` has no `test` script.
- Blocks: Refactoring, adding new API routes, or changing webhook logic carries full regression risk.

**No error boundary or loading state in portal pages:**
- Problem: All portal pages (`portal/page.tsx`, `portal/tests/page.tsx`, `portal/tasks/page.tsx`, etc.) fetch data in `useEffect` without any loading state indicator or error handling. If a query fails, the page silently renders empty.
- Files: All files in `src/app/portal/`
- Blocks: Client-facing reliability; failed queries are invisible to the user and to operators.

**Seller and admin dashboards not implemented:**
- Problem: The `users` table supports roles `admin`, `engineer`, `seller`, `client`. The portal navigation and all pages are built exclusively for the `client` role. Admins and engineers use the same portal with no management UI.
- Files: `src/app/portal/layout.tsx` (checks `isAdmin` but uses it only to determine a variable, not to conditionally render any admin content)
- Blocks: Internal operations — managing clients, publishing reports, updating tasks from the Vantix side — all require direct database access or Supabase Studio.

**No real-time updates:**
- Problem: All data fetches are one-time on mount. If a task is updated or a new report is published while the client has the portal open, they will not see it without a page reload.
- Files: All portal pages using `useEffect` data loading.
- Blocks: Collaborative use cases; task comment updates require manual reload.

---

## Test Coverage Gaps

**All API routes — zero coverage:**
- What's not tested: `/api/checkout`, `/api/billing-portal`, `/api/webhooks/stripe`
- Files: `src/app/api/checkout/route.ts`, `src/app/api/billing-portal/route.ts`, `src/app/api/webhooks/stripe/route.ts`
- Risk: Webhook mishandling (wrong plan, missing fields) and unprotected checkout calls go undetected.
- Priority: High

**Middleware auth guard — zero coverage:**
- What's not tested: The redirect logic in `src/middleware.ts` that protects `/portal` routes.
- Files: `src/middleware.ts`
- Risk: A regression could expose the portal to unauthenticated users.
- Priority: High

**k6 script logic — zero coverage:**
- What's not tested: `push-to-supabase.js` data mapping, `aggregate-monthly.js`, `generate-weekly.js`
- Files: `08-k6-framework/vantix-k6/scripts/`
- Risk: Silent data errors in the automated data pipeline (wrong field mappings, missing client lookups) produce incorrect metrics in the portal.
- Priority: Medium

---

*Concerns audit: 2026-03-20*
