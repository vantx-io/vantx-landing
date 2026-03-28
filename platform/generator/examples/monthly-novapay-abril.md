---
type: monthly
client: NovaPay SpA
client_short: NovaPay
project: Payment Gateway
date: 2026-05-05
month: Abril 2026
period: 1 — 30 de Abril 2026
engineer: José Castillo
loom_link: https://loom.com/share/vantix-novapay-abril2026
previous_month: Marzo 2026
---

## Resumen Ejecutivo

Primer mes completo del retainer. Fixes P0 implementados por NovaPay (índice + HikariCP) tuvieron impacto inmediato. Caché Redis para merchant-validation también completado. Checkout bundle pendiente para mayo.

Un incidente P2 el 18/4 por spike de tráfico no comunicado. Sistema se recuperó solo en 4 min.

## Métricas Clave

| Métrica | Anterior | Actual | Δ | SLO |
|---------|----------|--------|---|-----|
| Uptime | 99.91% | 99.97% | +0.06% | 99.9% |
| Throughput peak | 320 TPS | 510 TPS | +59% | 500 TPS |
| p95 Latency | 380ms | 195ms | -49% | <300ms |
| p99 Latency | 1100ms | 420ms | -62% | <800ms |
| Error Rate | 0.12% | 0.03% | -75% | <0.1% |
| LCP Checkout | 3.8s | 3.6s | -5% | <2.5s |
| Lighthouse | 54 | 58 | +4pts | >80 |

## Evaluación de Performance

### Prueba de Carga
Ejecutada 8 de abril post-fixes:
- Baseline 200 VU: 510 TPS, p95 195ms, errors 0.01% — PASS
- Stress 400 VU: 508 TPS, p95 310ms, errors 0.08% — PASS
- Stress 600 VU: 495 TPS, p95 890ms, errors 2.1% — DEGRADACIÓN

Nuevo punto de quiebre: ~550 VUs (antes: 280 VUs).

### Web Performance
Sin cambios significativos. Bundle sigue en 2.1MB. LCP mejoró marginalmente (3.8→3.6s) por caché backend. Fix real pendiente mayo.

## Capacity Planning

| Escenario | TPS Req | Estado | Acción |
|-----------|---------|--------|--------|
| Actual 1x | ~200 | ✓ Holgado | Ninguna |
| 2x | ~400 | ✓ OK | Monitorear |
| Black Friday 5x | ~1000 | ⚠ Insuficiente | Scale EKS + RDS upgrade |
| Peak 10x | ~2000 | ✕ No soportado | Rediseño settlement + read replicas |

## Incidentes

### Incidente 1 — 18 Abril 14:22 UTC [P2]
- **Duración**: 4 minutos, autoresolución
- **Impacto**: p95 subió a 1200ms, 0.3% requests con timeout
- **Root Cause**: Spike 3x tráfico por campaña email marketing no comunicada. HikariCP pool saturado momentáneamente.
- **Resolución**: EKS autoscaler agregó 2 pods en 90s
- **Acción preventiva**: Canal Slack #novapay-marketing-alerts. Pre-escalado HPA minReplicas 3→4.

## Optimizaciones Realizadas
- Tuning HPA: minReplicas 3→4, targetCPU 70%→60%
- Alerta p95 > 300ms en Datadog (no existía)
- Slow query log PostgreSQL (>100ms)
- Query de reporte nocturno optimizada (bloqueaba settlements 45s/noche)

## Alertas
- Activas: 12
- Añadidas: 4 (p95 latency, pool usage, error rate spike, pod restart)
- Eliminadas: 2 (CPU>80% reemplazada por p95, disk usage EKS)
- Falsos positivos: 1 (3.8%)

## Trending Semanal

| Semana | Uptime | p95 | Errors | Peak TPS | Incidentes |
|--------|--------|-----|--------|----------|------------|
| 31 Mar - 4 Abr | 99.98% | 198ms | 0.03% | 290 | 0 |
| 7 - 11 Abr | 99.99% | 187ms | 0.02% | 312 | 0 |
| 14 - 18 Abr | 99.94% | 210ms | 0.08% | 385 | 1 (P2) |
| 21 - 25 Abr | 99.99% | 192ms | 0.02% | 305 | 0 |
| 28 Abr - 2 May | 99.99% | 189ms | 0.01% | 298 | 0 |

## Recomendaciones Próximo Mes
- PRIORIDAD: Code splitting checkout (P1 original). LCP 3.6s → <2.0s estimado.
- Instrumentar Datadog APM en settlement + merchant-validation
- Evaluar migración PostgreSQL 16
- Definir SLOs formales + error budget tracking
