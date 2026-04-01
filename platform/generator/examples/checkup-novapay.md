---
type: checkup
client: NovaPay SpA
client_short: NovaPay
project: Payment Gateway
date: 2026-03-14
period: 10 — 14 de Marzo 2026
engineer: José Castillo
stack: Java 17 / Spring Boot 3.2 / PostgreSQL 15 / Redis 7
infra: AWS EKS 1.28 — 3x m5.xlarge, RDS r6g.xlarge, ElastiCache
services:
  - payment-gateway
  - settlement-service
  - merchant-validation
  - checkout-web
environment: Staging (réplica 1:1 de producción)
loom_link: https://loom.com/share/vantix-novapay-checkup-marzo2026
---

## Resumen Ejecutivo

Arquitectura moderna en microservicios sobre EKS. Buen diseño general pero tres hallazgos críticos limitan capacidad real a ~320 TPS, un 42% por debajo de los 550 esperados.

Principal bottleneck: settlement-service con queries sin índice que generan table locks bajo carga. Combinado con connection pool subdimensionado y falta de caché en merchant-validation.

Web performance del checkout también problemática: LCP 3.8s por bundle de 2.1MB.

## Hallazgos

### Hallazgo 1: Queries sin índice en settlement-service [CRÍTICO]
- **Componente**: settlement-service → PostgreSQL
- **Problema**: SELECT con filtro en (merchant_id, status, created_at) sin índice compuesto. Sequential scan de 2.3M filas.
- **Evidencia**: Query avg 340ms, debería ser <5ms con índice. Table locks bloquean escrituras concurrentes.
- **Impacto**: Limita throughput a 320 TPS
- **Acción**: CREATE INDEX idx_settlements_merchant_status_date ON settlements(merchant_id, status, created_at DESC);

### Hallazgo 2: HikariCP subdimensionado [CRÍTICO]
- **Componente**: HikariCP Connection Pool
- **Problema**: maximumPoolSize=10, connectionTimeout=30000ms (default). 3 pods x 10 = 30 conexiones. PG max_connections=100.
- **Evidencia**: A 200+ VUs los threads esperan conexión y timeout a 30s.
- **Impacto**: Cascading timeouts sobre 280 VUs
- **Acción**: maximumPoolSize=30, connectionTimeout=5000, agregar métricas de pool a CloudWatch.

### Hallazgo 3: merchant-validation sin caché [ALTO]
- **Componente**: merchant-validation → PostgreSQL
- **Problema**: 8,000 queries/min para validar merchant_id. Datos cambian ~1x/día. Redis ya desplegado pero solo para sesiones.
- **Impacto**: 30% de carga innecesaria a BD
- **Acción**: Caché read-through en Redis, TTL 1h, invalidar en webhook de update.

### Hallazgo 4: Bundle checkout monolítico [ALTO]
- **Componente**: checkout-web
- **Problema**: 2.1 MB JS en un chunk. Incluye moment.js (300KB), lodash completo (70KB), componentes de admin.
- **Impacto**: LCP 3.8s, Lighthouse 54/100
- **Acción**: Code splitting por ruta, reemplazar moment.js con date-fns, lazy load no-críticos.

### Hallazgo 5: Sin circuit breaker [MEDIO]
- **Componente**: payment-gateway → settlement-service
- **Problema**: Sin timeout ni circuit breaker. Si settlement se degrada, payment-gateway se bloquea indefinidamente.
- **Impacto**: Cascading failure risk
- **Acción**: Resilience4j con CircuitBreaker (failureRateThreshold=50, slowCallRateThreshold=80, waitDuration=10s).

## Prueba de Carga

| Escenario | VUs | Duración | TPS | p50 | p95 | p99 | Errors |
|-----------|-----|----------|-----|-----|-----|-----|--------|
| Smoke     | 10  | 2m       | 45  | 89ms | 156ms | 210ms | 0.00% |
| Ramp-up   | 10→200 | 10m  | 320 | 142ms | 380ms | 1100ms | 0.12% |
| Stress    | 200→500 | 15m | 318 | 890ms | 4200ms | 12400ms | 8.7% |
| Spike     | 50→400→50 | 5m | 395 | 210ms | 980ms | 3200ms | 1.2% |

**Punto de quiebre**: 280 VUs (~320 TPS). A partir de este punto, connection timeouts se acumulan exponencialmente.

## Web Performance

| Métrica | Valor | Target | Estado |
|---------|-------|--------|--------|
| LCP     | 3.8s  | <2.5s  | FALLA  |
| FID     | 120ms | <100ms | NECESITA MEJORA |
| CLS     | 0.05  | <0.1   | OK     |
| Lighthouse | 54 | >80    | FALLA  |
| Bundle JS | 2.1MB | <500KB | CRÍTICO |
| TTI     | 5.2s  | <3.0s  | FALLA  |

**Causa principal**: Bundle monolítico React sin code splitting ni lazy loading.

## Monitoreo

### Herramientas Actuales
| Herramienta | Uso | Cobertura |
|-------------|-----|-----------|
| CloudWatch  | Métricas infra (CPU, mem, red) | ✓ Bien configurado |
| Datadog APM | Traces distribuidos | ⚠ Solo payment-gateway |
| CloudWatch Logs | Logs centralizados | ✕ Sin parsing estructurado |

### Gaps
- Datadog APM solo en 1 de 4 servicios — no se puede correlacionar e2e
- Sin métricas de connection pool (HikariCP)
- Sin alertas de latencia p95
- Sin SLOs definidos
- Logs sin formato estructurado — debugging lento

## Roadmap

| # | Acción | Esfuerzo | Impacto | Prioridad |
|---|--------|----------|---------|-----------|
| 1 | Índice compuesto en settlements | S (1 día) | +60% TPS | P0 |
| 2 | HikariCP pool 10→30 + timeout 5s | S (2 horas) | Elimina timeouts | P0 |
| 3 | Caché Redis merchant-validation | M (3 días) | -70% carga BD | P1 |
| 4 | Code splitting + tree shaking checkout | M (5 días) | LCP -50% | P1 |
| 5 | Circuit breaker Resilience4j | M (3 días) | Resiliencia | P2 |
| 6 | APM en 3 servicios faltantes | S (1 día) | Observabilidad e2e | P2 |
| 7 | Logs JSON + alertas p95 | M (2 días) | Debugging | P2 |
| 8 | SLOs + error budget | S (1 día) | Governance | P3 |
