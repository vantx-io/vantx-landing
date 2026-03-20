# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Multi-product monorepo for a B2B SRE/Performance consulting business (Vantix). The technical core is composed of two runnable systems: a Next.js 14 client portal and a k6-based synthetic monitoring framework. The rest of the repo is business artifacts (docs, demos, sales materials, agent config).

**Key Characteristics:**
- Next.js App Router with server components for data fetching and client components for interactivity
- Supabase as the single source of truth for all relational data (clients, subscriptions, payments, test results, tasks, reports)
- k6 framework runs on cron, pushes metrics to Prometheus and results to Supabase
- Stripe handles all billing; webhooks update Supabase subscription state
- Grafana reads Prometheus time-series for real-time dashboards

## Layers

**Middleware / Auth Gate:**
- Purpose: Protect all `/portal` routes; redirect unauthenticated users to `/login`
- Location: `07-plataforma/vantix-platform/src/middleware.ts`
- Contains: Next.js middleware using `@supabase/ssr` cookie-based session check
- Depends on: Supabase anon key, request cookies
- Used by: Every request hitting `/portal/:path*` and `/login`

**Page Layer (App Router):**
- Purpose: Render UI for each portal section; fetch data from Supabase using browser client
- Location: `07-plataforma/vantix-platform/src/app/portal/`
- Contains: `page.tsx` per section (dashboard, tests, reports, tasks, grafana, billing, services, tutorials); all marked `'use client'`; each runs its own `useEffect` data load against Supabase
- Depends on: `@/lib/supabase/client`, `@/lib/types`
- Used by: End users via browser

**Portal Layout:**
- Purpose: Shared sidebar nav, user/client/subscription state loader, logout handler
- Location: `07-plataforma/vantix-platform/src/app/portal/layout.tsx`
- Contains: Client component that fetches user profile, client record, and active subscription on mount; renders persistent sidebar
- Depends on: `@/lib/supabase/client`, `@/lib/types`
- Used by: All `/portal/*` pages (wraps them)

**API Routes (Server-side):**
- Purpose: Handle Stripe operations that require the secret key server-side
- Location: `07-plataforma/vantix-platform/src/app/api/`
- Contains:
  - `checkout/route.ts` — creates Stripe checkout session, upserts Stripe customer
  - `billing-portal/route.ts` — creates Stripe billing portal session
  - `webhooks/stripe/route.ts` — processes Stripe events (checkout.session.completed, invoice.paid, subscription.deleted, invoice.payment_failed)
- Depends on: `@/lib/stripe`, `@/lib/supabase/server` (service client), Stripe secret key
- Used by: Client-side billing page POSTs; Stripe webhook infrastructure

**Library Layer:**
- Purpose: Shared clients and helpers
- Location: `07-plataforma/vantix-platform/src/lib/`
- Contains:
  - `supabase/client.ts` — browser Supabase client (anon key, typed with `Database`)
  - `supabase/server.ts` — two server clients: `createServerSupabase()` (cookie-based, for server components) and `createServiceClient()` (service role key, for API routes/webhooks)
  - `stripe.ts` — singleton Stripe instance, `getPriceId()`, `getOrCreateCustomer()`, `createPortalSession()`
  - `types.ts` — hand-written TypeScript types mirroring the Supabase schema; also defines the `Database` generic used by both Supabase clients
- Depends on: Environment variables only
- Used by: All pages and API routes

**Database / Schema Layer:**
- Purpose: PostgreSQL via Supabase; single migration defines all tables
- Location: `07-plataforma/vantix-platform/supabase/migrations/001_schema.sql`
- Contains: Tables — `clients`, `users`, `subscriptions`, `payments`, `test_results`, `monthly_metrics`, `weekly_metrics`, `reports`, `tasks`, `task_comments`, `incidents`, `services`, `tutorials`
- Seed data: `07-plataforma/vantix-platform/supabase/seed.sql`
- Depends on: Supabase local or cloud PostgreSQL
- Used by: All application layers

**k6 Monitoring Framework:**
- Purpose: Automated performance data collection; feeds all client metrics and deliverables
- Location: `08-k6-framework/vantix-k6/`
- Contains: Scenarios (synthetic, uptime, load tests), per-client config objects, shared lib (metrics definitions, SLO-based thresholds, Prometheus push), cron schedule
- Depends on: k6 runtime, Prometheus pushgateway, Supabase service key
- Used by: Cron; results appear in Supabase `test_results` / `weekly_metrics` / `monthly_metrics` tables

**Report Generator:**
- Purpose: Produces client-facing DOCX/PDF reports from Markdown source files
- Location: `09-generator/generate.js` (canonical) / `07-plataforma/vantix-platform/generator/generate.js` (copy inside platform)
- Contains: Single Node.js script that parses structured Markdown and outputs DOCX via `docx` npm package
- Depends on: `docx`, `dotenv`, Node.js filesystem
- Used by: `npm run generate` or directly `node generator/generate.js <file.md>`

## Data Flow

**Client Portal — Page Load:**
1. Browser hits `/portal/*`; middleware checks Supabase session cookie
2. If authenticated, Next.js serves the page; portal `layout.tsx` mounts
3. Layout `useEffect` calls `supabase.auth.getUser()`, then fetches `users`, `clients`, `subscriptions` rows for the session user
4. Child `page.tsx` `useEffect` runs its own Supabase queries (scoped to `client_id`) to populate page-specific data
5. UI renders with local React state

**Billing — Checkout Flow:**
1. Client-side billing page POSTs `clientId` + `priceId` to `/api/checkout`
2. API route uses `createServiceClient()` (service role) to look up existing Stripe customer ID
3. Creates Stripe checkout session; returns redirect URL
4. Browser redirects to Stripe-hosted checkout
5. On success, Stripe fires `checkout.session.completed` to `/api/webhooks/stripe`
6. Webhook handler upserts `subscriptions` row in Supabase with `stripe_subscription_id`

**Billing — Invoice Paid Flow:**
1. Stripe fires `invoice.paid` to `/api/webhooks/stripe`
2. Webhook resolves `client_id` via `stripe_customer_id` lookup in `subscriptions`
3. Inserts a `payments` row with amount, currency, and Stripe invoice reference

**k6 Monitoring — Metrics Pipeline:**
1. Cron triggers `CLIENT=<name> k6 run scenarios/synthetic.js` every 5 minutes
2. Scenario reads client config from `clients/<name>.js` via `lib/config.js`
3. Executes the client's `syntheticFlow` steps; records custom metrics
4. Prometheus pushgateway receives time-series data for Grafana dashboards
5. `handleSummary` writes JSON result to `results/<client>-synthetic-latest.json`
6. Monthly/weekly scripts aggregate results and push to Supabase `test_results`, `weekly_metrics`, `monthly_metrics` tables

**State Management:**
- No global client-side state store (no Redux, Zustand, or Context)
- Each page manages its own data with `useState` + `useEffect`
- Auth state is stored in Supabase cookie; checked server-side in middleware and client-side in `useEffect`

## Key Abstractions

**Supabase Dual Client:**
- Purpose: Separate browser client (anon key + cookie session) from server client (service role, no cookies) to respect Supabase RLS boundaries
- Examples: `07-plataforma/vantix-platform/src/lib/supabase/client.ts`, `07-plataforma/vantix-platform/src/lib/supabase/server.ts`
- Pattern: `createClient()` for browser use; `createServerSupabase()` for server components; `createServiceClient()` for API routes that need to bypass RLS

**Client Config Object (k6):**
- Purpose: Single JS object per client that drives all test scenarios — endpoints, SLOs, auth, load parameters
- Examples: `08-k6-framework/vantix-k6/clients/_template.js`, `08-k6-framework/vantix-k6/clients/novapay.js`
- Pattern: Copy `_template.js`, fill in URLs/SLOs/flows; reference via `CLIENT=<name>` env var; loaded dynamically through registry in `lib/config.js`

**Database Types:**
- Purpose: Hand-maintained TypeScript types that mirror the Supabase schema; used as generics for the typed Supabase client
- Examples: `07-plataforma/vantix-platform/src/lib/types.ts`
- Pattern: `Database` type used in `createBrowserClient<Database>()` and `createServerClient<Database>()` for end-to-end type safety on queries

## Entry Points

**Web Application:**
- Location: `07-plataforma/vantix-platform/src/app/page.tsx`
- Triggers: HTTP request to `/`
- Responsibilities: Check auth, redirect to `/portal` or `/login`

**Auth Middleware:**
- Location: `07-plataforma/vantix-platform/src/middleware.ts`
- Triggers: Every request matching `/portal/:path*` or `/login`
- Responsibilities: Validate session, enforce redirects

**Stripe Webhook:**
- Location: `07-plataforma/vantix-platform/src/app/api/webhooks/stripe/route.ts`
- Triggers: POST from Stripe on subscription events
- Responsibilities: Validate signature, dispatch to event handlers, update Supabase

**k6 Scenarios:**
- Location: `08-k6-framework/vantix-k6/scenarios/synthetic.js`, `uptime.js`, `load-stress.js`
- Triggers: Cron via `08-k6-framework/vantix-k6/crontab`
- Responsibilities: Execute test flow, emit metrics to Prometheus, write JSON summary

**Report Generator:**
- Location: `09-generator/generate.js`
- Triggers: `node generate.js <markdown-file.md>` or `npm run generate`
- Responsibilities: Parse structured Markdown, produce DOCX output

## Error Handling

**Strategy:** Inline try/catch in API routes; k6 scenarios use `check()` pass/fail (no exceptions); UI pages have no explicit error boundaries

**Patterns:**
- API routes catch errors and return `NextResponse.json({ error: err.message }, { status: 400 })`
- Stripe webhook validates signature; returns 400 on bad signature
- k6 scenarios use `check()` to assert expected status codes; failures are recorded as metric failures, not thrown exceptions
- Supabase queries use destructured `{ data, error }` pattern but most UI pages ignore the `error` field (silent failure — see CONCERNS.md)

## Cross-Cutting Concerns

**Logging:** `console.error()` in k6 scenarios for flow failures; no structured logging in Next.js app
**Validation:** None at API route input level; Supabase schema constraints (CHECK constraints, NOT NULL) act as the only validation layer
**Authentication:** Supabase Auth (GoTrue) with cookie-based sessions; enforced by middleware at route level and re-checked in `useEffect` within portal layout

---

*Architecture analysis: 2026-03-20*
