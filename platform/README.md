# Vantix Platform — Setup Local Completo

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Next.js 14 (App Router)          :3000         │
│  ├── Portal de Cliente (React)                  │
│  ├── API Routes (Stripe webhooks)               │
│  └── Generador de reportes (MD → DOCX/PDF)      │
├─────────────────────────────────────────────────┤
│  Supabase Local                                 │
│  ├── PostgreSQL                   :54322        │
│  ├── Auth (GoTrue)                :54321        │
│  ├── Storage                      :54321        │
│  ├── Edge Functions               :54321        │
│  └── Studio (admin UI)            :54323        │
├─────────────────────────────────────────────────┤
│  Grafana                          :3001         │
│  ├── Dashboards (RED, USE, k6, SLO, Web Vitals)│
│  └── Prometheus datasource                      │
├─────────────────────────────────────────────────┤
│  Prometheus                       :9090         │
│  └── Métricas de demo                           │
├─────────────────────────────────────────────────┤
│  Stripe CLI (test mode)           webhooks      │
│  └── Stripe Test → localhost:3000/api/webhooks  │
└─────────────────────────────────────────────────┘
```

## Requisitos

- Node.js 18+
- Docker & Docker Compose
- Supabase CLI (`npm install -g supabase`)
- Stripe CLI (opcional, para webhooks locales)
- Git

## Quick Start (5 minutos)

```bash
# 1. Clonar e instalar
cd vantix-platform
npm install

# 2. Copiar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus keys de Stripe (test mode)

# 3. Levantar Supabase local
npx supabase start
# Esto imprime las URLs y keys — copiarlas a .env.local

# 4. Aplicar schema + seed data
npx supabase db reset
# Esto ejecuta migrations/ y seed.sql automáticamente

# 5. Crear usuarios demo (auth + profiles)
node scripts/seed-demo.js
# Esto crea 6 usuarios con login/password

# 6. Levantar Grafana + Prometheus
docker compose up -d grafana prometheus

# 7. Levantar Next.js
npm run dev

# 8. Abrir
# Portal:    http://localhost:3000
# Supabase:  http://localhost:54323
# Grafana:   http://localhost:3001 (admin/admin)
```

## Stripe (test mode)

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Crear productos y precios en test mode
node scripts/setup-stripe.js

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copiar el webhook signing secret a .env.local
```

## Estructura del Proyecto

```
vantix-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout + Supabase provider
│   │   ├── page.tsx            # Landing / redirect
│   │   ├── login/page.tsx      # Auth page
│   │   ├── portal/             # Client portal (protected)
│   │   │   ├── layout.tsx      # Portal layout + sidebar
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── tests/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── grafana/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   └── tutorials/page.tsx
│   │   └── api/
│   │       └── webhooks/stripe/route.ts
│   ├── components/             # Shared components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── stripe.ts           # Stripe helpers
│   │   └── types.ts            # TypeScript types from schema
│   └── styles/
│       └── globals.css
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 001_schema.sql      # Full schema
│   └── seed.sql                # Demo data
├── grafana/
│   ├── provisioning/
│   │   ├── dashboards/
│   │   │   └── dashboards.yml
│   │   └── datasources/
│   │       └── datasources.yml
│   └── dashboards/
│       ├── red-overview.json
│       ├── k6-results.json
│       └── web-vitals.json
├── scripts/
│   ├── setup-stripe.js         # Create Stripe products
│   └── seed-demo.js            # Insert demo data via API
├── generator/                  # MD → DOCX/PDF generator
│   ├── SKILL.md
│   ├── generate.js
│   └── examples/
├── docker-compose.yml
├── .env.local.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Usuarios Demo

Después de `supabase db reset`:

| Email | Password | Role | Cliente |
|-------|----------|------|---------|
| admin@vantix.cl | vantix2026 | admin | — |
| jose@vantix.cl | vantix2026 | engineer | — |
| juan@novapay.com | demo2026 | client | NovaPay |
| sarah@scaleapp.io | demo2026 | client | ScaleApp |

## Desarrollo

```bash
# Dev server con hot reload
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Generar reportes desde markdown
node generator/generate.js generator/examples/checkup-novapay.md

# Reset DB (re-aplica schema + seed)
npx supabase db reset

# Ver logs de Supabase
npx supabase logs

# Abrir Supabase Studio
open http://localhost:54323
```

## Deploy a Producción

```bash
# 1. Crear proyecto en supabase.com
# 2. Aplicar migrations
npx supabase db push

# 3. Deploy a Vercel/Cloudflare
vercel deploy
# o
npx wrangler pages deploy

# 4. Configurar Stripe webhooks apuntando a tu dominio
# 5. Configurar Grafana Cloud (o self-hosted)
```
