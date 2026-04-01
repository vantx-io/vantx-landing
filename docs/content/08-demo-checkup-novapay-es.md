---
title: "Reporte de Performance Checkup"
subtitle: "NovaPay SpA — Demo"
version: "1.0"
date: "Marzo 2026"
---

![](assets/logo.png){ width=30% }

\

# PERFORMANCE CHECKUP

**NovaPay SpA — Plataforma de Procesamiento de Pagos**

Marzo 2026 · VANTX · hello@vantx.io

\newpage

# Resumen Ejecutivo

La plataforma de procesamiento de pagos de NovaPay fue evaluada durante 5 días hábiles. La evaluación incluyó revisión de arquitectura, prueba de carga (baseline + stress + spike), auditoría de web performance (Core Web Vitals + Lighthouse), y evaluación de monitoreo.

**Capacidad actual:** 320 TPS (transacciones por segundo) antes de degradación.
**Punto de quiebre:** 380 TPS — latencia excede 2 segundos, tasa de error >5%.
**Capacidad objetivo:** 500+ TPS para soportar el crecimiento proyectado de Q3.

### Hallazgos Principales

| ID | Severidad | Hallazgo | Impacto |
|---|---|---|---|
| F-01 | P0 Crítico | Pool de conexiones HikariCP en default (10). Cuello de botella bajo carga. | Limita TPS a 320. Fix: subir a 30 → estimado +40-60% TPS. |
| F-02 | P0 Crítico | Índice faltante en `settlements(merchant_id, status, created_at)` | Full table scan en consultas de liquidación. Fix: `CREATE INDEX` → ~200ms → ~15ms. |
| F-03 | P1 Alto | Sin caché en lookups de config de merchant (~200 calls/sec idénticos) | 15% de carga de BD es lecturas redundantes. Fix: Redis cache con TTL 60s. |
| F-04 | P1 Alto | LCP 4.2s en página de checkout (objetivo: <2.5s) | Score Lighthouse pobre (42/100). Fix: diferir JS no crítico, optimizar imagen hero. |
| F-05 | P2 Medio | Sin connection pooling para Redis | Nueva conexión TCP por request. Fix: usar pool de ioredis. |
| F-06 | P2 Medio | Endpoint de health consulta BD (no es un health check real) | Monitoreo de uptime no confiable. Fix: retornar 200 estático. |

\newpage

# Resultados de Prueba de Carga

### Escenario Baseline (tráfico normal)

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Usuarios virtuales | 50 | — | — |
| TPS promedio | 180 | ≥150 | ✅ Pasa |
| Latencia p50 | 95ms | <200ms | ✅ Pasa |
| Latencia p95 | 245ms | <500ms | ✅ Pasa |
| Latencia p99 | 520ms | <1000ms | ✅ Pasa |
| Tasa de error | 0.02% | <1% | ✅ Pasa |

### Escenario Stress (2x tráfico)

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Usuarios virtuales | 100 | — | — |
| TPS máximo | 320 | ≥300 | ✅ Pasa |
| Latencia p50 | 180ms | <300ms | ✅ Pasa |
| Latencia p95 | 890ms | <1000ms | ✅ Pasa |
| Latencia p99 | 2,100ms | <2000ms | ❌ Falla |
| Tasa de error | 0.8% | <2% | ✅ Pasa |

### Escenario Spike (ráfaga 5x tráfico)

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Usuarios virtuales | 250 (ramp 30s) | — | — |
| TPS máximo | 380 (luego degradación) | ≥400 | ❌ Falla |
| Latencia p95 | 3,200ms | <2000ms | ❌ Falla |
| Tasa de error | 5.2% | <5% | ❌ Falla |
| Tiempo de recuperación | 45 segundos | <30s | ❌ Falla |

> **Punto de quiebre identificado en 380 TPS.** Más allá de este punto, el agotamiento del pool HikariCP causa latencia en cascada. El sistema no degrada gradualmente — colapsa abruptamente.

# Web Performance

| Página | LCP | FID | CLS | Lighthouse | Estado |
|---|---|---|---|---|---|
| Homepage | 2.1s | 85ms | 0.05 | 68/100 | ⚠️ Mejorable |
| Checkout | 4.2s | 120ms | 0.12 | 42/100 | ❌ Pobre |
| Dashboard | 3.1s | 95ms | 0.08 | 55/100 | ⚠️ Mejorable |
| API Docs | 1.4s | 45ms | 0.02 | 89/100 | ✅ Bien |

\newpage

# Roadmap de Remediación

### P0 — Arreglar esta semana (impacto estimado: +60% TPS)

**F-01: Aumentar pool size de HikariCP**
```yaml
spring.datasource.hikari.maximum-pool-size: 30
spring.datasource.hikari.minimum-idle: 10
spring.datasource.hikari.connection-timeout: 5000
```
Mejora estimada: 320 → 480+ TPS. 30 minutos de implementación.

**F-02: Agregar índice faltante**
```sql
CREATE INDEX CONCURRENTLY idx_settlements_merchant_status_date
ON settlements(merchant_id, status, created_at DESC);
```
Mejora estimada: consultas de liquidación de ~200ms a ~15ms. 5 minutos.

### P1 — Arreglar este sprint

**F-03:** Implementar Redis cache para config de merchant. TTL 60s. Esperado: -15% carga de BD.

**F-04:** Optimización de LCP en checkout. Diferir JS no crítico, lazy-load de imágenes bajo el fold, preconnect al CDN de pagos. Objetivo: LCP <2.5s.

### P2 — Arreglar este trimestre

**F-05:** Connection pooling de Redis con ioredis. **F-06:** Arreglar endpoint de health.

\

> **Próximos pasos:** Implementar fixes P0 → VANTX re-testea gratis (incluido) → Validar mejora con datos. Resultado estimado: 320 → 510+ TPS.
>
> ¿Interesado en monitoreo continuo? Nuestra suscripción Performance ($5,995/mes, descuento LATAM disponible) incluye monitoreo sintético 24/7, load tests mensuales, y reportes semanales — para que detectes el próximo bottleneck antes que tus usuarios.
>
> hello@vantx.io · vantx.io
