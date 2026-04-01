---
type: weekly
client: NovaPay SpA
client_short: NovaPay
project: Payment Gateway
date: 2026-04-14
week: 7 — 11 de Abril 2026
engineer: José Castillo
status: SALUDABLE
---

## Estado General
Sin incidentes. Todas las métricas dentro de SLOs.

## Métricas

| Métrica | Valor | Tendencia | SLO |
|---------|-------|-----------|-----|
| Uptime | 99.99% | ↑ vs anterior | ✓ 99.9% |
| p95 Latency | 187ms | ↓ -4% | ✓ <300ms |
| Error Rate | 0.02% | → Estable | ✓ <0.1% |
| Peak TPS | 312 | → Normal | ✓ <510 cap |

## Anomalías
- Martes 8/4: Slow query settlement-service reporte nocturno. 890ms. No impacta users. Monitoreando.
- Jueves 10/4: Redis hit rate bajó a 87% (normal: 94%). Expiración masiva TTLs por cambio de hora. Normalizado en 30 min.

## Optimizaciones
- Slow query nocturna optimizada: 890ms → 45ms con índice parcial
- Redis TTL merchant-validation: 1h → 2h (datos cambian <1x/día)

## Pendientes
- Code splitting checkout — equipo NovaPay planifica semana 14/4
- Instrumentación Datadog settlement-service — ticket creado, sin asignar

## Próxima Semana
Evaluación de performance mensual agendada para 8/4. Prueba de carga + Lighthouse.
