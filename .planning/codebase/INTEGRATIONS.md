# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Payment Processing:**
- Stripe - Subscription billing, checkout sessions, billing portal, invoice management
  - SDK/Client: `stripe` npm package v17.4.0
  - Client file: `07-plataforma/vantix-platform/src/lib/stripe.ts`
  - API version: `2024-11-20.acacia`
  - Auth env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Webhook secret: `STRIPE_WEBHOOK_SECRET`
  - Price ID vars: `STRIPE_PRICE_RETAINER_US`, `STRIPE_PRICE_RETAINER_LATAM`, `STRIPE_PRICE_CHECKUP_US`, `STRIPE_PRICE_CHECKUP_LATAM`
  - Pilot price ID vars: `STRIPE_PRICE_{PLAN}_PILOT_{MARKET}` (dynamic key pattern in `stripe.ts:getPriceId()`)

**Monitoring/Alerts:**
- Slack - Alert routing from Alertmanager
  - Webhook URL env var: `SLACK_WEBHOOK_URL` (k6 framework `.env`)
  - Alert channel: `#vantix-alerts`
  - Config: `08-k6-framework/vantix-k6/docker/alertmanager.yml`

## Data Storage

**Databases:**
- Supabase (PostgreSQL 15)
  - Platform connection (browser): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Platform connection (server admin): `SUPABASE_SERVICE_ROLE_KEY`
  - k6 framework connection: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
  - Browser client: `07-plataforma/vantix-platform/src/lib/supabase/client.ts` (`createBrowserClient`)
  - Server client (user-scoped): `07-plataforma/vantix-platform/src/lib/supabase/server.ts` (`createServerSupabase`)
  - Server client (admin/service role): `07-plataforma/vantix-platform/src/lib/supabase/server.ts` (`createServiceClient`)
  - Schema migration: `07-plataforma/vantix-platform/supabase/migrations/001_schema.sql`
  - Seed data: `07-plataforma/vantix-platform/supabase/seed.sql`
  - ORM: None — raw Supabase query builder used throughout

**Schema Tables:**
- `clients` — Client accounts with market (US/LATAM), stack, Grafana org, Slack channel, Trello board
- `users` — Linked to Supabase Auth (`auth.users`), roles: `admin`, `engineer`, `seller`, `client`
- `subscriptions` — Plans: `checkup`, `retainer`, `retainer_perf`, `oaas_baseline`, `oaas_gestion`, `fractional_2d`, `fractional_4d`, `custom`
- `payments` — Invoice/payment records linked to subscriptions and Stripe
- `test_results` — Load test and web performance test results with JSONB scenario data
- `monthly_metrics` — Trending uptime, latency, TPS, incidents per client per month
- `weekly_metrics` — Weekly health status per client
- `reports` — Downloadable report records (pdf, docx, xlsx, pptx)

**File Storage:**
- Local filesystem for generated reports in k6 framework (`08-k6-framework/vantix-k6/results/`, `logs/`)
- No cloud file storage (S3/GCS) detected

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: Cookie-based sessions via `@supabase/ssr`
  - Middleware: `07-plataforma/vantix-platform/src/middleware.ts` — protects `/portal/*`, redirects unauthenticated users to `/login`
  - Auth check: `supabase.auth.getUser()` on every request
  - Email confirmations: disabled (local config)
  - JWT expiry: 3600s

## Monitoring & Observability

**Metrics Collection:**
- Prometheus `prom/prometheus:v2.51.0`
  - Platform: `07-plataforma/vantix-platform/docker-compose.yml` (port 9090, scrape interval 15s)
  - k6 framework: `08-k6-framework/vantix-k6/docker/docker-compose.yml` (port 9090, 90-day retention)
- Prometheus Pushgateway `prom/pushgateway:v1.7.0`
  - Receives metrics pushed from k6 test runs (port 9091)
  - Config: `08-k6-framework/vantix-k6/docker/docker-compose.yml`

**Dashboards:**
- Grafana `grafana/grafana:11.0.0`
  - Platform instance: port 3001, dashboards at `07-plataforma/vantix-platform/grafana/dashboards/`
  - k6 instance: port 3001, dashboards at `08-k6-framework/vantix-k6/grafana/dashboards/`
  - Embedded in client portal via iframe (`NEXT_PUBLIC_GRAFANA_URL`)
  - Anonymous viewer access enabled

**Alerting:**
- Alertmanager `prom/alertmanager:v0.27.0`
  - Routes to Slack `#vantix-alerts` channel
  - Config: `08-k6-framework/vantix-k6/docker/alertmanager.yml`
  - Alert rules: `08-k6-framework/vantix-k6/docker/alert_rules.yml`
  - Group repeat interval: 4h

**Error Tracking:**
- None detected

**Logs:**
- k6 run logs written to `08-k6-framework/vantix-k6/logs/` directory
- Application logs: Next.js default console logging

## Performance Testing

**k6:**
- Synthetic monitoring: `08-k6-framework/vantix-k6/scenarios/synthetic.js`
- Uptime checks: `08-k6-framework/vantix-k6/scenarios/uptime.js`
- Load/stress/spike tests: `08-k6-framework/vantix-k6/scenarios/load-stress.js`
- Client configs: `08-k6-framework/vantix-k6/clients/novapay.js`, `_template.js`
- Metrics helpers: `08-k6-framework/vantix-k6/lib/metrics.js`, `checks.js`, `config.js`
- Scheduled via cron inside `k6-runner` Docker container (`08-k6-framework/vantix-k6/crontab`)
- Client target env vars: `NOVAPAY_BASE_URL`, `NOVAPAY_WEB_URL`, `NOVAPAY_SYNTHETIC_USER`, `NOVAPAY_SYNTHETIC_PASS`

**Lighthouse:**
- Web performance audits via `bash scripts/lighthouse.sh` (`08-k6-framework/vantix-k6/scripts/`)

## CI/CD & Deployment

**Hosting:**
- Not detected (no Vercel, Railway, Fly, or Render config found)

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI, or similar config found)

## Webhooks & Callbacks

**Incoming:**
- Stripe webhooks at `/api/webhooks/stripe` (`07-plataforma/vantix-platform/src/app/api/webhooks/stripe/route.ts`)
  - `checkout.session.completed` — creates/updates subscription record
  - `invoice.paid` — inserts payment record
  - `customer.subscription.deleted` — marks subscription cancelled
  - `invoice.payment_failed` — inserts failed payment record
  - Signature verification: `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`

**Outgoing:**
- Stripe Billing Portal sessions created at `/api/billing-portal` (`07-plataforma/vantix-platform/src/app/api/billing-portal/route.ts`)
- Stripe Checkout sessions created at `/api/checkout` (`07-plataforma/vantix-platform/src/app/api/checkout/route.ts`)
- Slack webhook calls from Alertmanager (outgoing alerts on infrastructure events)

## Environment Configuration

**Platform required env vars (`07-plataforma/vantix-platform/.env.local.example`):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_RETAINER_US`, `STRIPE_PRICE_RETAINER_LATAM`
- `STRIPE_PRICE_CHECKUP_US`, `STRIPE_PRICE_CHECKUP_LATAM`
- `NEXT_PUBLIC_GRAFANA_URL`
- `GRAFANA_ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

**k6 framework required env vars (`08-k6-framework/vantix-k6/.env.example`):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SLACK_WEBHOOK_URL`
- `GRAFANA_ADMIN_PASSWORD`
- `NOVAPAY_BASE_URL`, `NOVAPAY_WEB_URL`, `NOVAPAY_SYNTHETIC_USER`, `NOVAPAY_SYNTHETIC_PASS`

**Secrets location:**
- `.env.local` at `07-plataforma/vantix-platform/` (gitignored)
- `.env` at `08-k6-framework/vantix-k6/` (gitignored)

---

*Integration audit: 2026-03-20*
