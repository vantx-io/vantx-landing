---
title: "Performance Checkup Report"
subtitle: "NovaPay SpA — Demo"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# PERFORMANCE CHECKUP

**NovaPay SpA — Payment Processing Platform**

March 2026 · VANTX · hello@vantx.io

\newpage

# Executive Summary

NovaPay's payment processing platform was evaluated over 5 business days. The evaluation included architecture review, load testing (baseline + stress + spike), web performance audit (Core Web Vitals + Lighthouse), and monitoring assessment.

**Current capacity:** 320 TPS (transactions per second) before degradation.
**Breakpoint:** 380 TPS — latency exceeds 2 seconds, error rate >5%.
**Target capacity:** 500+ TPS to support projected Q3 growth.

### Key Findings

| ID | Severity | Finding | Impact |
|---|---|---|---|
| F-01 | P0 Critical | HikariCP connection pool at default (10). Bottleneck under load. | Limits TPS to 320. Fix: set to 30 → estimated +40-60% TPS. |
| F-02 | P0 Critical | Missing index on `settlements(merchant_id, status, created_at)` | Full table scan on settlement queries. Fix: `CREATE INDEX` → ~200ms → ~15ms. |
| F-03 | P1 High | No caching on merchant config lookups (~200 calls/sec identical) | 15% of DB load is redundant reads. Fix: Redis cache with 60s TTL. |
| F-04 | P1 High | LCP 4.2s on checkout page (target: <2.5s) | Poor Lighthouse score (42/100). Fix: defer non-critical JS, optimize hero image. |
| F-05 | P2 Medium | No connection pooling for Redis | New TCP connection per request. Fix: use ioredis pool. |
| F-06 | P2 Medium | Health endpoint queries DB (not a true health check) | Uptime monitoring unreliable. Fix: return static 200 for health. |

\newpage

# Load Test Results

### Baseline Scenario (normal traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | 50 | — | — |
| Avg TPS | 180 | ≥150 | ✅ Pass |
| p50 latency | 95ms | <200ms | ✅ Pass |
| p95 latency | 245ms | <500ms | ✅ Pass |
| p99 latency | 520ms | <1000ms | ✅ Pass |
| Error rate | 0.02% | <1% | ✅ Pass |

### Stress Scenario (2x traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | 100 | — | — |
| Max TPS | 320 | ≥300 | ✅ Pass |
| p50 latency | 180ms | <300ms | ✅ Pass |
| p95 latency | 890ms | <1000ms | ✅ Pass |
| p99 latency | 2,100ms | <2000ms | ❌ Fail |
| Error rate | 0.8% | <2% | ✅ Pass |

### Spike Scenario (5x traffic burst)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | 250 (ramp 30s) | — | — |
| Max TPS | 380 (then degradation) | ≥400 | ❌ Fail |
| p95 latency | 3,200ms | <2000ms | ❌ Fail |
| Error rate | 5.2% | <5% | ❌ Fail |
| Recovery time | 45 seconds | <30s | ❌ Fail |

> **Breakpoint identified at 380 TPS.** Beyond this point, HikariCP pool exhaustion causes cascading latency. The system does not degrade gracefully — it cliff-dives.

# Web Performance

| Page | LCP | FID | CLS | Lighthouse | Status |
|---|---|---|---|---|---|
| Homepage | 2.1s | 85ms | 0.05 | 68/100 | ⚠️ Needs work |
| Checkout | 4.2s | 120ms | 0.12 | 42/100 | ❌ Poor |
| Dashboard | 3.1s | 95ms | 0.08 | 55/100 | ⚠️ Needs work |
| API Docs | 1.4s | 45ms | 0.02 | 89/100 | ✅ Good |

\newpage

# Remediation Roadmap

### P0 — Fix this week (estimated impact: +60% TPS)

**F-01: Increase HikariCP pool size**
```yaml
spring.datasource.hikari.maximum-pool-size: 30
spring.datasource.hikari.minimum-idle: 10
spring.datasource.hikari.connection-timeout: 5000
```
Estimated improvement: 320 → 480+ TPS. 30 minutes to implement.

**F-02: Add missing index**
```sql
CREATE INDEX CONCURRENTLY idx_settlements_merchant_status_date
ON settlements(merchant_id, status, created_at DESC);
```
Estimated improvement: settlement queries from ~200ms to ~15ms. 5 minutes.

### P1 — Fix this sprint

**F-03:** Implement Redis cache for merchant config. TTL 60s. Expected: -15% DB load.

**F-04:** Checkout page LCP optimization. Defer non-critical JS, lazy-load below-fold images, preconnect to payment CDN. Target: LCP <2.5s.

### P2 — Fix this quarter

**F-05:** Redis connection pooling with ioredis. **F-06:** Fix health endpoint.

\

> **Next steps:** Implement P0 fixes → VANTX re-tests for free (included) → Validate improvement with data. Estimated result: 320 → 510+ TPS.
>
> Interested in continuous monitoring? Our Performance subscription ($5,995/mo) includes 24/7 synthetic monitoring, monthly load tests, and weekly reports — so you catch the next bottleneck before your users do.
>
> hello@vantx.io · vantx.io
