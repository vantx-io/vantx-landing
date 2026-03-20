# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.7 - Platform (`07-plataforma/vantix-platform/src/`)
- JavaScript (Node.js) - Scripts, generator, k6 scenarios (`scripts/`, `generator/`, `08-k6-framework/`)

**Secondary:**
- SQL (PostgreSQL) - Database migrations (`07-plataforma/vantix-platform/supabase/migrations/`)
- HTML - Static landing pages (`06-landing-pages/`)

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` at root)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present at `07-plataforma/vantix-platform/package-lock.json`

## Frameworks

**Core:**
- Next.js 14.2.18 - Full-stack React framework, App Router, Server Actions (`07-plataforma/vantix-platform/`)

**UI:**
- React 18.3.1 - Component library
- Tailwind CSS 3.4.16 - Utility-first CSS (`07-plataforma/vantix-platform/tailwind.config.ts`)
- Recharts 2.13.3 - Data visualization charts
- Lucide React 0.460.0 - Icon library

**Testing/Performance:**
- k6 - Load testing and synthetic monitoring runner (`08-k6-framework/vantix-k6/scenarios/`)

**Build/Dev:**
- PostCSS 8.4.49 - CSS processing (`07-plataforma/vantix-platform/postcss.config.js`)
- Autoprefixer 10.4.20 - CSS vendor prefixes
- concurrently 9.1.0 - Parallel dev script execution

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.47.0 - Database and auth client (used in platform and k6 framework)
- `@supabase/ssr` 0.5.2 - Server-side Supabase client for Next.js (`07-plataforma/vantix-platform/src/lib/supabase/`)
- `stripe` 17.4.0 - Payment processing SDK, API version `2024-11-20.acacia` (`07-plataforma/vantix-platform/src/lib/stripe.ts`)

**Infrastructure:**
- `docx` 9.1.1 - Programmatic `.docx` report generation
- `date-fns` 4.1.0 - Date formatting utilities
- `dotenv` 16.4.0 - Environment variable loading (platform and k6 framework)

## Configuration

**TypeScript:**
- Config: `07-plataforma/vantix-platform/tsconfig.json`
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- JSX: `preserve` (delegated to Next.js compiler)

**Next.js:**
- Config: `07-plataforma/vantix-platform/next.config.js`
- Server Actions body size limit: `10mb`

**Tailwind:**
- Config: `07-plataforma/vantix-platform/tailwind.config.ts`
- Custom brand colors: `brand.dark`, `brand.accent`, `brand.green`, `brand.orange`, `brand.red`
- Custom fonts: `DM Sans` (sans), `JetBrains Mono` (mono)
- Content scan: `./src/**/*.{js,ts,jsx,tsx,mdx}`

**Supabase Local:**
- Config: `07-plataforma/vantix-platform/supabase/config.toml`
- Project ID: `vantix-platform`
- PostgreSQL major version: 15
- API port: 54321, DB port: 54322, Studio port: 54323
- JWT expiry: 3600s
- Email confirmations: disabled

**Environment:**
- Example file: `07-plataforma/vantix-platform/.env.local.example`
- Key vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, Stripe price IDs, `NEXT_PUBLIC_GRAFANA_URL`

**Build:**
- ESLint: `eslint-config-next` 14.2.18
- Lint command: `next lint`
- Type check command: `tsc --noEmit`

## Observability Stack (Docker)

**Platform (`07-plataforma/vantix-platform/docker-compose.yml`):**
- Prometheus `prom/prometheus:v2.51.0` — metrics scraping (port 9090)
- Grafana `grafana/grafana:11.0.0` — dashboards (port 3001)

**k6 Framework (`08-k6-framework/vantix-k6/docker/docker-compose.yml`):**
- k6-runner — containerized cron-based test execution
- Prometheus `prom/prometheus:v2.51.0` — 90-day retention (port 9090)
- Prometheus Pushgateway `prom/pushgateway:v1.7.0` — k6 metric ingestion (port 9091)
- Grafana `grafana/grafana:11.0.0` — dashboards (port 3001)
- Alertmanager `prom/alertmanager:v0.27.0` — Slack alert routing (port 9093)

## Platform Requirements

**Development:**
- Docker (for local Supabase, Prometheus, Grafana)
- Node.js + npm
- Stripe CLI (for `stripe:listen` webhook forwarding)
- k6 binary (for test scenario execution)

**Production:**
- Deployment target: Not specified in config (no Vercel/Railway/Fly config detected)
- Database: Supabase (hosted or self-managed)

---

*Stack analysis: 2026-03-20*
