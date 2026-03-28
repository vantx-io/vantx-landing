---
title: "Arquitectura de Infraestructura"
subtitle: "Grafana Cloud · k6 Framework · Onboarding Automático"
version: "1.0"
date: "Marzo 2026"
---

![](assets/logo.png){ width=35% }

\

# ARQUITECTURA DE INFRAESTRUCTURA

**Grafana Cloud · k6 Framework · Onboarding Automático**

Versión 1.0 — Marzo 2026 · Interno

\newpage

# 1. Modelo de Infraestructura: 1 Stack por Cliente

Cada cliente recibe su propio Grafana Cloud stack con aislamiento total. No hay multi-tenancy — los datos de un cliente nunca se mezclan con los de otro.

### Stack por cliente

| Componente | Función | Free tier |
|---|---|---|
| Prometheus/Mimir | Métricas de k6 (uptime, synthetic, load test) | 10,000 series |
| Loki | Logs de k6 runs + app logs opcionales | 50 GB/mes |
| Tempo | Traces backend + frontend (end-to-end) | 50 GB/mes |
| Faro | RUM, JS errors, session traces, CWV reales | 50K sessions/mes |
| IRM | On-call, alert routing, incidents, status page | Incluido |
| Alerting | Reglas tiered + routing via IRM | Sin límite |
| Dashboards | 8 pre-configurados + custom | Sin límite |

### Dashboards pre-configurados (8)

1. **RED overview** — Request rate, Error rate, Duration por servicio
2. **USE infra** — Utilization, Saturation, Errors por recurso
3. **PostgreSQL** — Active connections, query time, dead tuples, cache hit
4. **k6 results** — TPS, latencia, errores, thresholds por escenario
5. **Web Vitals (synthetic)** — LCP, FID, CLS, Lighthouse score trending
6. **SLO compliance** — Error budget restante, burn rate, SLO por servicio
7. **Frontend Observability** — RUM real: CWV por página/device/país, JS errors, sessions
8. **Incident Overview** — Incidentes activos, MTTR, on-call schedule, timeline

### Costos por cliente

| Tipo de cliente | Sessions RUM | Costo Grafana Cloud | Costo total infra |
|---|---|---|---|
| Startup / bajo tráfico | ≤50K | $0 (free tier) | ~$0 |
| PyME / medio | 100K | ~$45 | ~$45 |
| Scale-up | 250K | ~$180 | ~$180 |
| Enterprise | 500K+ | ~$405+ | ~$405+ |

> El 80-90% de nuestros clientes caben en el free tier. Costo promedio de infra por cliente: $15-25/mes.

\newpage

# 2. Frontend Observability (Faro) — Detalle

### Qué captura el Faro SDK

- **Web Vitals reales** — LCP, INP, CLS medidos desde el browser del usuario real (no Lighthouse sintético)
- **JS errors** — stack trace completo, browser, OS, URL, user session
- **Session traces** — el journey real del usuario, correlacionado con traces de backend
- **Performance entries** — resource timing, navigation timing, long tasks
- **Custom events** — el cliente puede instrumentar eventos de negocio ("checkout_started", "payment_failed")

### Implementación para el cliente

El cliente solo necesita agregar 2 líneas a su app:

```javascript
import { initializeFaro } from '@grafana/faro-web-sdk';
initializeFaro({
  url: 'https://faro-collector-{region}.grafana.net/collect/{app-key}',
  app: { name: '{client-slug}', version: '1.0.0', environment: 'production' }
});
```

El `app-key` y `url` se generan automáticamente durante el onboarding y se envían al cliente por Slack.

### Tiers comerciales

| Tier | Sessions/mes | Precio al cliente | Costo real | Margen |
|---|---|---|---|---|
| Starter (incluido) | ≤50K | $0 (incluido en base) | $0 | 100% |
| Growth | ≤150K | +$200/mes | ~$90 | 55% |
| Scale | ≤500K | +$450/mes | ~$405 | 10% |
| Enterprise | 500K+ | Custom | Passthrough | Fee gestión |

### Cuándo ofrecer upgrade

- Alertar al cliente cuando llega al 80% del tier actual (40K sessions en Starter)
- El upgrade se hace por Slack: "Hey, tu tráfico subió — ¿activamos Growth?"
- No hay penalidad por exceder momentáneamente — Grafana Cloud cobra por exceso

\newpage

# 3. IRM (Incident Response Management)

### Qué incluye

- **On-call schedules** — rotación configurable, escalation chains
- **Alert routing** — cada alerta va al equipo correcto (backend, frontend, infra)
- **Incident timeline** — desde la alerta hasta la resolución, automático
- **Status pages** — el cliente puede tener una página pública o interna
- **Postmortem templates** — integrados con el workflow

### Configuración por defecto (nuevo cliente)

1. Schedule: José como primary, Sr Engineer como backup
2. Escalation: 5 min → primary, 15 min → backup, 30 min → José
3. Alert routing: todas las alertas del stack del cliente → canal Slack del cliente
4. Status page: desactivada por defecto, activable por request

### Para clientes con Fractional SRE

El Fractional SRE configura IRM para el equipo del cliente:

- Diseña la rotación de on-call del equipo del cliente
- Configura escalation policies propias del cliente
- Entrena al equipo en incident response usando IRM
- Status page activada y mantenida

\newpage

# 4. Onboarding Automático

### Flujo completo (~5 minutos)

```
Cliente paga en Stripe
    ↓
Stripe webhook → Node.js script
    ↓
1. Grafana Cloud API → crear stack "{client-slug}"
2. Provisionar datasources (Prometheus remote write, Loki, Tempo)
3. Activar Faro → generar SDK snippet + app-key
4. Activar IRM → crear schedule + escalation default
5. Importar 8 dashboard JSONs (vía Grafana API)
6. Configurar alert rules (uptime, latency, error rate, CWV)
7. Crear API keys (push métricas + Faro collector)
    ↓
k6 framework:
8. Crear config en clients/{client-slug}.js
9. Remote write apunta al Prometheus del stack
10. Agregar a crontab (uptime 1min, synthetic 5min)
    ↓
Supabase:
11. Crear registro de cliente con grafana_url, api_keys
12. Activar portal de cliente
    ↓
Slack:
13. Crear canal #vantix-{client}
14. Enviar mensaje de bienvenida con:
    - URL de su dashboard portal
    - Faro SDK snippet para pegar en su app
    - IRM invite link (si aplica)
    - Board de Trello/Linear con instrucciones
```

### Variables por cliente

| Variable | Fuente | Ejemplo |
|---|---|---|
| `{client-slug}` | Stripe metadata | `novapay` |
| `{grafana-stack-url}` | Grafana Cloud API response | `https://novapay.grafana.net` |
| `{remote-write-url}` | Stack provisioning | `https://prometheus-us-central1.grafana.net/api/prom/push` |
| `{faro-collector-url}` | Faro activation | `https://faro-collector-us-central1.grafana.net/collect/abc123` |
| `{api-key-push}` | API key creation | `glc_xxx...` |

### Script de onboarding

El script `scripts/onboard-client.js` en el repositorio de la plataforma hace todo esto. Requiere:

- `GRAFANA_CLOUD_API_KEY` — API key de la org VANTX en Grafana Cloud
- `SUPABASE_SERVICE_KEY` — para crear registros de cliente
- `SLACK_BOT_TOKEN` — para crear canales y enviar mensajes

Uso: `node scripts/onboard-client.js --slug=novapay --name="NovaPay SpA" --plan=retainer_perf --market=latam`

\newpage

# 5. Monitoreo de costos

### Dashboard de costos VANTX (interno)

Un dashboard en la org VANTX de Grafana Cloud que agrega los costos de todos los stacks de clientes:

- Costo por cliente por mes
- Sessions RUM por cliente (trending)
- Clientes cerca del límite de free tier (>40K sessions)
- Margen por cliente (revenue - costo Grafana)

### Alertas de costos

- **80% free tier** → notificación interna "Cliente X está en 40K sessions, evaluar upgrade a Growth"
- **Exceso de free tier** → alerta al PM "Cliente X excedió 50K sessions, contactar para upgrade"
- **Costo total >$500/mes** → revisión mensual de telemetry optimization

### Optimización de telemetría

Para clientes que exceden tiers, ofrecer como parte del servicio de Observability:

- Sampling de sessions (bajar de 100% a 50% — la mitad del costo, 90% de la visibilidad)
- Drop de métricas no usadas (reducir series activas)
- Log level filtering (solo errores + warnings, no debug)
- Trace sampling head-based (solo 10% de traces, capturar 100% de errores)

\newpage

# 6. Acceso del cliente

### Modelo por defecto: solo portal

El cliente accede a sus dashboards via el portal VANTX (iframe de Grafana). No necesita cuenta de Grafana Cloud. Ventajas: más control, UX consistente, efecto plataforma.

### Upgrade: acceso directo a Grafana

Para clientes enterprise o Fractional SRE que lo pidan, se puede dar un viewer login directo a su stack de Grafana Cloud. El cliente puede:

- Explorar dashboards
- Crear sus propios dashboards
- Configurar alertas adicionales
- Exportar datos

Esto es un upgrade de servicio — no cambia el pricing base pero aumenta el valor percibido.

### Exit strategy

Si el cliente cancela:

1. Los dashboards se exportan como JSON (automático, incluido en el servicio)
2. Las métricas históricas se exportan como CSV si el cliente lo pide
3. El stack de Grafana Cloud se archiva 30 días, luego se elimina
4. El Faro SDK snippet deja de funcionar (no envía datos a un collector que no existe)
5. El cliente conserva los reportes PDF/DOCX generados durante el servicio

> Sin lock-in: todo open-source, todo exportable, todo tuyo si te vas.
