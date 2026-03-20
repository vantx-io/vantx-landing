# vantix-kit

Vantix monorepo — managed monitoring, load testing, and observability platform.

## Structure

```
vantix-kit/
├── 07-plataforma/vantix-platform/   # Next.js 14 client portal
├── 08-k6-framework/vantix-k6/       # k6 synthetic monitoring + load testing
├── 09-generator/                    # Markdown → DOCX/PDF report generator
├── docker-compose.yml               # Full monitoring stack (Prometheus + Grafana + Pushgateway + Alertmanager)
└── observability/otelcollector.yml  # OTel Collector config (optional)
```

## Prerequisites

- Node.js >= 20
- Docker + Docker Compose
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)
- k6 (for running load tests): `brew install k6`

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo>
cd vantix-kit
npm install   # installs all workspace dependencies
```

### 2. Configure environment

```bash
cp 07-plataforma/vantix-platform/.env.local.example 07-plataforma/vantix-platform/.env.local
# Edit .env.local with your Supabase, Stripe, and Grafana credentials
```

Required env vars (see `.env.local.example` for full list):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` for dev) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password (min 8 chars) |

### 3. Start the monitoring stack

```bash
docker compose up -d
# Prometheus:    http://localhost:9090
# Grafana:       http://localhost:3001  (admin / your GRAFANA_ADMIN_PASSWORD)
# Pushgateway:   http://localhost:9091
# Alertmanager:  http://localhost:9093
```

To also start the OTel Collector (for client APM traces):

```bash
docker compose --profile otel up -d
# OTel Collector OTLP gRPC: localhost:4317
# OTel Collector OTLP HTTP: localhost:4318
```

### 4. Start the local database

```bash
cd 07-plataforma/vantix-platform
npx supabase start
npx supabase db reset   # applies migrations + seed
node scripts/seed-demo.js   # creates auth users
```

### 5. Start the portal

```bash
npm run dev
# Portal: http://localhost:3000
# Login:  juan@novapay.com / demo2026
```

### 6. (Optional) Enable Stripe webhooks

```bash
npm run stripe:setup    # creates products/prices in Stripe test mode
npm run stripe:listen   # forwards webhooks to localhost
```

## Development

### Run all checks

```bash
npm run lint         # ESLint
npm run type-check   # TypeScript (no emit)
npm run build        # Next.js production build
```

### Run k6 tests

```bash
cd 08-k6-framework/vantix-k6

# Synthetic monitoring (critical flow)
CLIENT=novapay npm run synthetic

# Uptime check
CLIENT=novapay npm run uptime

# Load test
CLIENT=novapay npm run load:stress
```

### Generate a report

```bash
cd 09-generator
node generate.js examples/sample-report.md
# Outputs: sample-report.docx (+ .pdf if LibreOffice installed)
```

## Monitoring Stack

| Service | Port | Purpose |
|---|---|---|
| Prometheus | 9090 | Time-series metrics storage (90-day retention) |
| Grafana | 3001 | Dashboards (RED metrics, k6 results, Web Vitals) |
| Pushgateway | 9091 | k6 metrics ingestion endpoint |
| Alertmanager | 9093 | Alert routing → Slack |
| OTel Collector | 4317/4318 | OTLP receiver → Prometheus (optional) |

## CI/CD

GitHub Actions runs on every push to `main` and on PRs:

- **platform**: lint → type-check → build
- **k6-validate**: syntax check on all k6 library files

See `.github/workflows/ci.yml`.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the canonical ADR covering tech stack, data model, multi-tenancy, collector agent design, and integration pipelines.
