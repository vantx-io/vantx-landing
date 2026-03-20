# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
vantix-kit/                          # Repository root — Vantix business monorepo
├── 01-plan-de-negocio/              # Business plan docs (PDF, DOCX, MD)
├── 02-catalogo-y-pricing/           # Service catalog and pricing docs
├── 03-ventas/                       # Sales materials (playbook, manual, tracker)
├── 04-demos-novapay/                # Demo deliverables for NovaPay prospect
├── 05-templates/                    # Reusable report templates (DOCX)
├── 06-landing-pages/                # Static HTML landing pages
├── 07-plataforma/
│   └── vantix-platform/             # Next.js 14 client portal (primary runnable app)
│       ├── src/
│       │   ├── app/                 # Next.js App Router
│       │   │   ├── layout.tsx       # Root HTML layout + global styles
│       │   │   ├── page.tsx         # Root redirect (/ → /portal or /login)
│       │   │   ├── login/
│       │   │   │   └── page.tsx     # Supabase magic link / email auth UI
│       │   │   ├── portal/          # Protected client portal
│       │   │   │   ├── layout.tsx   # Sidebar nav + user/client/subscription loader
│       │   │   │   ├── page.tsx     # Dashboard — metrics, charts, reports, tasks
│       │   │   │   ├── tests/       # Load test results and web performance history
│       │   │   │   ├── reports/     # Published reports (PDF/DOCX download)
│       │   │   │   ├── tasks/       # Task tracker with comments
│       │   │   │   ├── grafana/     # Embedded Grafana iframe
│       │   │   │   ├── billing/     # Subscription status, checkout, invoice history
│       │   │   │   ├── services/    # Service catalog with CTA
│       │   │   │   └── tutorials/   # Markdown tutorials with Loom embeds
│       │   │   └── api/             # Server-side API routes
│       │   │       ├── checkout/route.ts       # POST — Stripe checkout session
│       │   │       ├── billing-portal/route.ts # POST — Stripe billing portal session
│       │   │       └── webhooks/stripe/route.ts # POST — Stripe event webhook
│       │   ├── lib/
│       │   │   ├── supabase/
│       │   │   │   ├── client.ts    # Browser Supabase client (anon key + cookie)
│       │   │   │   └── server.ts    # Server Supabase clients (cookie + service role)
│       │   │   ├── stripe.ts        # Stripe singleton + helpers
│       │   │   └── types.ts         # TypeScript types mirroring DB schema
│       │   ├── styles/
│       │   │   └── globals.css      # Tailwind base + custom font imports
│       │   └── middleware.ts        # Route protection + auth redirect
│       ├── supabase/
│       │   ├── config.toml          # Supabase local config
│       │   ├── migrations/
│       │   │   └── 001_schema.sql   # Complete schema (all tables)
│       │   └── seed.sql             # Demo data for local dev
│       ├── grafana/
│       │   ├── provisioning/        # Auto-provisioned datasources + dashboard configs
│       │   └── dashboards/          # Dashboard JSON files (RED, k6, Web Vitals)
│       ├── generator/               # MD → DOCX report generator (copy of 09-generator)
│       │   ├── generate.js          # Main generator script
│       │   └── examples/            # Example markdown inputs
│       ├── scripts/
│       │   ├── setup-stripe.js      # Create Stripe products/prices in test mode
│       │   └── seed-demo.js         # Create auth users + demo data via Supabase API
│       ├── public/                  # Static assets
│       ├── docker-compose.yml       # Grafana + Prometheus for local dev
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
├── 08-k6-framework/
│   └── vantix-k6/                   # k6 synthetic monitoring framework
│       ├── clients/                 # Per-client config objects
│       │   ├── _template.js         # Copy this for new clients
│       │   └── novapay.js           # NovaPay config (demo)
│       ├── scenarios/               # k6 test scripts
│       │   ├── synthetic.js         # Critical flow — runs every 5 min via cron
│       │   ├── uptime.js            # Health check — runs every 1 min via cron
│       │   └── load-stress.js       # Ramp-to-breakpoint load test
│       ├── lib/                     # Shared k6 libraries
│       │   ├── config.js            # Client registry + env-var-based loader
│       │   ├── checks.js            # Reusable check helpers
│       │   ├── metrics.js           # Custom metric definitions + threshold builder
│       │   └── supabase.js          # Push results to Supabase
│       ├── scripts/                 # Automation (Lighthouse, report aggregation)
│       ├── docker/                  # k6 runner Dockerfile + compose
│       ├── results/                 # JSON output from runs (gitignored)
│       ├── logs/                    # Cron run logs (gitignored)
│       ├── crontab                  # All cron job definitions
│       └── package.json
├── 09-generator/                    # Canonical report generator (source of truth)
│   ├── generate.js                  # MD → DOCX generator script
│   ├── examples/                    # Example input markdown files
│   ├── SKILL.md                     # Generator capability reference
│   └── SKILL-analysis.md
├── 10-logos/                        # Brand assets
├── agents/
│   └── ceo/                         # CEO Claude agent persona
│       ├── SOUL.md                  # CEO persona definition
│       ├── AGENTS.md                # Agent configuration
│       ├── HEARTBEAT.md             # Ongoing context/state
│       ├── TOOLS.md                 # Available tools
│       └── memory/                  # Agent memory logs (date-stamped MD files)
└── docs/                            # Internal analysis docs (ICP, pricing, design partners)
```

## Directory Purposes

**`07-plataforma/vantix-platform/src/app/`:**
- Purpose: All Next.js App Router pages and API routes
- Contains: One `page.tsx` per portal section; `layout.tsx` for root and portal; `route.ts` for each API endpoint
- Key files: `portal/layout.tsx` (sidebar shell), `portal/page.tsx` (dashboard), `middleware.ts`, `api/webhooks/stripe/route.ts`

**`07-plataforma/vantix-platform/src/lib/`:**
- Purpose: Shared infrastructure — database clients, type definitions, third-party helpers
- Contains: Supabase clients split by execution context; Stripe utilities; all TypeScript domain types
- Key files: `supabase/client.ts`, `supabase/server.ts`, `stripe.ts`, `types.ts`

**`07-plataforma/vantix-platform/supabase/`:**
- Purpose: Database schema, migrations, and seed data
- Contains: Single SQL migration defining all tables; demo data seed
- Key files: `migrations/001_schema.sql`, `seed.sql`, `config.toml`

**`07-plataforma/vantix-platform/grafana/`:**
- Purpose: Grafana dashboard definitions provisioned automatically on `docker compose up`
- Contains: Dashboard JSON files (RED metrics overview, k6 results, Web Vitals); datasource YAML config
- Generated: No (hand-maintained JSON). Committed: Yes.

**`08-k6-framework/vantix-k6/clients/`:**
- Purpose: One file per monitored client; drives all test scenarios
- Contains: Config objects with base URLs, critical flow steps, SLO targets, auth config, load test parameters
- Key files: `_template.js` (authoritative template for new clients)

**`08-k6-framework/vantix-k6/scenarios/`:**
- Purpose: Executable k6 test scripts; imported by cron
- Contains: `synthetic.js` (critical flow replay), `uptime.js` (health check), `load-stress.js` (ramp test)

**`08-k6-framework/vantix-k6/lib/`:**
- Purpose: Shared utilities imported by all scenarios
- Contains: Custom metric definitions (Counter, Gauge, Rate, Trend), SLO threshold builder, client tag helper

**`09-generator/`:**
- Purpose: Canonical report generator. The copy at `07-plataforma/vantix-platform/generator/` is a duplicate for platform self-sufficiency.
- Contains: `generate.js` — parses structured Markdown, outputs DOCX via `docx` npm package

**`agents/ceo/`:**
- Purpose: Long-running Claude CEO agent with persistent memory
- Contains: Persona files, memory logs, heartbeat doc
- Generated: `memory/` files are generated by agent runs. Committed: Yes.

**`08-k6-framework/vantix-k6/results/` and `logs/`:**
- Purpose: Runtime output from k6 runs
- Generated: Yes. Committed: No (gitignored).

## Key File Locations

**Entry Points:**
- `07-plataforma/vantix-platform/src/app/page.tsx`: Root redirect based on auth state
- `07-plataforma/vantix-platform/src/app/login/page.tsx`: Auth UI
- `07-plataforma/vantix-platform/src/middleware.ts`: Route-level auth guard
- `08-k6-framework/vantix-k6/crontab`: All scheduled monitoring jobs

**Configuration:**
- `07-plataforma/vantix-platform/package.json`: Scripts, dependencies
- `07-plataforma/vantix-platform/tailwind.config.ts`: Brand colors and fonts
- `07-plataforma/vantix-platform/tsconfig.json`: TypeScript config with `@/` path alias
- `07-plataforma/vantix-platform/docker-compose.yml`: Grafana + Prometheus services
- `07-plataforma/vantix-platform/.env.local.example`: All required environment variables

**Core Logic:**
- `07-plataforma/vantix-platform/src/lib/types.ts`: All domain types (Client, User, Subscription, Task, etc.)
- `07-plataforma/vantix-platform/src/lib/stripe.ts`: Stripe helpers (getPriceId, getOrCreateCustomer, createPortalSession)
- `07-plataforma/vantix-platform/src/app/api/webhooks/stripe/route.ts`: Stripe event processing
- `08-k6-framework/vantix-k6/lib/metrics.js`: All custom Prometheus metric definitions
- `08-k6-framework/vantix-k6/lib/config.js`: Client config registry and loader

**Database:**
- `07-plataforma/vantix-platform/supabase/migrations/001_schema.sql`: Full schema
- `07-plataforma/vantix-platform/supabase/seed.sql`: Demo data
- `07-plataforma/vantix-platform/scripts/seed-demo.js`: Auth user creation script

## Naming Conventions

**Files (Next.js):**
- Pages: `page.tsx` (exactly, required by App Router)
- Layouts: `layout.tsx` (exactly, required by App Router)
- API handlers: `route.ts` (exactly, required by App Router)
- Library modules: `camelCase.ts` (e.g., `client.ts`, `server.ts`, `stripe.ts`, `types.ts`)

**Files (k6):**
- Scenarios: `kebab-case.js` (e.g., `load-stress.js`, `synthetic.js`)
- Libraries: `kebab-case.js` (e.g., `config.js`, `metrics.js`, `checks.js`)
- Client configs: `<clientname>.js` (lowercase, no hyphens — e.g., `novapay.js`)

**Directories:**
- Next.js routes: `kebab-case/` (e.g., `billing-portal/`, `portal/`)
- Business content: `NN-kebab-case/` numbered prefix (e.g., `01-plan-de-negocio/`)
- k6 sub-dirs: `lowercase/` (e.g., `clients/`, `scenarios/`, `lib/`)

**TypeScript:**
- Types/Interfaces: PascalCase (e.g., `Client`, `User`, `Subscription`, `TestResult`)
- Functions: camelCase (e.g., `createClient`, `createServerSupabase`, `buildThresholds`)
- Constants: camelCase for objects, UPPER_SNAKE_CASE for env vars
- React components: PascalCase function declarations (e.g., `DashboardPage`, `PortalLayout`, `MetricCard`)

## Where to Add New Code

**New Portal Page (e.g., `/portal/incidents`):**
- Create directory: `07-plataforma/vantix-platform/src/app/portal/incidents/`
- Add: `page.tsx` with `'use client'` directive, `useState` + `useEffect` pattern matching existing pages
- Add nav entry: `07-plataforma/vantix-platform/src/app/portal/layout.tsx` in the `nav` array
- Add type: `07-plataforma/vantix-platform/src/lib/types.ts` if new DB table needed

**New API Route:**
- Create directory: `07-plataforma/vantix-platform/src/app/api/<route-name>/`
- Add: `route.ts` with exported `POST` or `GET` function
- Use `createServiceClient()` for routes requiring elevated DB access (bypasses RLS)
- Use `createServerSupabase()` for routes scoped to the session user

**New DB Table:**
- Add `CREATE TABLE` to `07-plataforma/vantix-platform/supabase/migrations/001_schema.sql`
- Add corresponding TypeScript interface to `07-plataforma/vantix-platform/src/lib/types.ts`
- Add to `Database` type's `Tables` map in `types.ts`
- Run `npx supabase db reset` locally to apply

**New Monitored Client (k6):**
- Copy `08-k6-framework/vantix-k6/clients/_template.js` to `clients/<clientname>.js`
- Fill in: `baseUrl`, `webUrl`, `syntheticFlow`, `slos`, `loadTest`, `auth` as needed
- Register: Add import + entry to the `clients` registry in `08-k6-framework/vantix-k6/lib/config.js`
- Add cron lines: `08-k6-framework/vantix-k6/crontab`

**New Shared Library (k6):**
- Add file: `08-k6-framework/vantix-k6/lib/<name>.js`
- Export named functions/constants; import with relative path in scenarios

**Shared UI Components:**
- Location: `07-plataforma/vantix-platform/src/components/` (directory exists but is currently empty — inline components are used directly in page files)

## Special Directories

**`07-plataforma/vantix-platform/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes. Committed: No.

**`07-plataforma/vantix-platform/generator/`:**
- Purpose: Copy of the report generator bundled with the platform for self-contained operation
- Generated: No. Committed: Yes. Source of truth is `09-generator/`.

**`08-k6-framework/vantix-k6/results/`:**
- Purpose: JSON output files from k6 runs (e.g., `novapay-synthetic-latest.json`)
- Generated: Yes (by k6 `handleSummary`). Committed: No.

**`08-k6-framework/vantix-k6/logs/`:**
- Purpose: Cron stdout/stderr capture
- Generated: Yes. Committed: No.

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: Yes (by Claude). Committed: Yes.

**`agents/ceo/memory/`:**
- Purpose: Persistent memory for the CEO Claude agent (date-stamped markdown logs)
- Generated: Yes (by agent runs). Committed: Yes.

---

*Structure analysis: 2026-03-20*
