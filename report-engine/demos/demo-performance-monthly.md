---
title: "Monthly Performance Report"
subtitle: "NovaPay SpA — March 2026"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# MONTHLY PERFORMANCE REPORT

**NovaPay SpA** · March 2026

VANTX · hello@vantx.io

\newpage

# Executive Summary

March was a strong month for NovaPay's performance posture. The P0 fixes from the February Checkup (HikariCP pool + missing index) were deployed in week 1, resulting in a 52% TPS improvement confirmed by the March load test. Uptime exceeded target at 99.96%. Web performance improved significantly — checkout LCP dropped from 4.2s to 2.8s. Two new P2 findings identified, both non-urgent.

### Month at a Glance

| Indicator | Value | Target | Status |
|---|---|---|---|
| Uptime | 99.96% | ≥99.9% | ✅ Pass |
| p50 Response Time | 85ms | <200ms | ✅ Pass |
| p95 Response Time | 220ms | <500ms | ✅ Pass |
| Error Rate | 0.018% | <1% | ✅ Pass |
| Load Test: Max TPS | 488 | ≥400 | ✅ Pass |
| Lighthouse Score (avg) | 65/100 | ≥70 | ⚠️ Close |
| RUM LCP (p75) | 2.3s | <2.5s | ✅ Pass |
| JS Errors (total) | 580 | <800 | ✅ Pass |

\newpage

# 1. Uptime & Availability

### Monthly Uptime Summary

| Endpoint | Uptime | Avg Response | Max Response | Incidents |
|---|---|---|---|---|
| /api/payments | 99.98% | 75ms | 890ms | 0 |
| /api/settlements | 99.95% | 88ms | 1,200ms | 1 |
| /api/merchants | 99.99% | 42ms | 320ms | 0 |
| /checkout | 99.93% | 105ms | 1,800ms | 2 |

### Incident Log

| Date | Duration | Endpoint | Impact | Root Cause | Resolution |
|---|---|---|---|---|---|
| Mar 5 | 8 min | /checkout | Slow checkouts | CDN cache invalidation during deploy | Rolling deploy policy updated |
| Mar 12 | 12 min | /api/settlements | Export timeouts | Large merchant batch settlement (120K rows) | Added query limit + pagination |
| Mar 19 | 3 min | /checkout | Brief unavailability | Planned deploy v2.14.3 | Expected (rolling restart) |

### Uptime Trend (3 months)

| Month | Uptime | Incidents | MTTR |
|---|---|---|---|
| January | 99.91% | 4 | 18 min |
| February | 99.92% | 3 | 15 min |
| March | 99.96% | 3 | 8 min |

\newpage

# 2. Synthetic Monitoring

### Critical Flows — Monthly Summary

| Flow | p50 | p95 | p99 | Error Rate | Checks | Status |
|---|---|---|---|---|---|---|
| Login → Dashboard | 410ms | 670ms | 890ms | 0.01% | 8,640 | ✅ Pass |
| Create Payment | 305ms | 510ms | 720ms | 0.02% | 8,640 | ✅ Pass |
| Settlement Export | 850ms | 1,350ms | 1,800ms | 0.05% | 8,640 | ✅ Pass |
| Checkout (guest) | 640ms | 960ms | 1,300ms | 0.03% | 8,640 | ✅ Pass |

### Latency Trend (3 months)

![p95 Latency Trend — 3 Months](assets/charts/latency-trend-3m.svg)

| Flow | January p95 | February p95 | March p95 | Trend |
|---|---|---|---|---|
| Login → Dashboard | 720ms | 690ms | 670ms | Improving |
| Create Payment | 580ms | 540ms | 510ms | Improving |
| Settlement Export | 1,600ms | 1,500ms | 1,350ms | Improving |
| Checkout (guest) | 1,100ms | 1,020ms | 960ms | Improving |

\newpage

# 3. Load Test Results

**Test date:** March 15, 2026
**Target:** Validate P0 fix impact, confirm 400+ TPS capacity
**Stack:** k6 + Grafana Cloud

### Baseline (normal traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | 50 | — | — |
| Avg TPS | 245 | ≥150 | ✅ Pass |
| p50 latency | 68ms | <200ms | ✅ Pass |
| p95 latency | 180ms | <500ms | ✅ Pass |
| p99 latency | 380ms | <1000ms | ✅ Pass |
| Error rate | 0.01% | <1% | ✅ Pass |

### Stress (2x traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | 100 | — | — |
| Max TPS | 488 | ≥300 | ✅ Pass |
| p95 latency | 420ms | <1000ms | ✅ Pass |
| Error rate | 0.3% | <2% | ✅ Pass |

### Spike (5x burst)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | 250 (ramp 30s) | — | — |
| Max TPS | 520 (then degradation) | ≥400 | ✅ Pass |
| p95 latency | 1,800ms | <2000ms | ✅ Pass |
| Recovery | 18 seconds | <30s | ✅ Pass |

### Load Test Trend (3 months)

![Load Test: February vs March](assets/charts/load-test-comparison.svg)

| Month | Max TPS | Breakpoint | p95 (stress) | Trend |
|---|---|---|---|---|
| January | N/A | N/A | N/A | — |
| February (Checkup) | 320 | 380 | 890ms | Baseline |
| March | 488 | 560 | 420ms | +52% TPS |

> **Impact of P0 fixes confirmed:** Max TPS improved from 320 → 488 (+52%). Breakpoint moved from 380 → 560 TPS. The system now handles 5x spike without exceeding thresholds.

\newpage

# 4. Web Performance

### Lighthouse CI (weekly runs)

| Page | LCP | INP | CLS | Score | vs Last Month |
|---|---|---|---|---|---|
| Homepage | 1.9s | 78ms | 0.04 | 74/100 | +6 |
| Checkout | 2.8s | 110ms | 0.08 | 58/100 | +16 |
| Dashboard | 2.6s | 88ms | 0.06 | 62/100 | +7 |
| API Docs | 1.3s | 42ms | 0.02 | 91/100 | +2 |

### RUM — Real User Monitoring

| Metric | Value | Target | Status |
|---|---|---|---|
| Total Sessions | 152,800 | — | — |
| LCP (p75) | 2.3s | <2.5s | ✅ Pass |
| INP (p75) | 165ms | <200ms | ✅ Pass |
| CLS (p75) | 0.07 | <0.1 | ✅ Pass |
| JS Errors (unique) | 12 | — | — |
| JS Errors (total) | 580 | <800 | ✅ Pass |

### Top JS Errors

| Error | Count | Page | Impact |
|---|---|---|---|
| `TypeError: Cannot read property 'id' of null` | 210 | /dashboard | Low — edge case with expired sessions |
| `ResizeObserver loop limit exceeded` | 185 | /checkout | None — browser noise, can be silenced |
| `NetworkError: Failed to fetch` | 95 | /api/* | Low — transient, correlates with poor mobile connections |

\newpage

# 5. Capacity Planning

| Scenario | Required TPS | Current Max | Headroom | Status |
|---|---|---|---|---|
| Current traffic (180 TPS avg) | 180 | 488 | 171% | ✅ Comfortable |
| 2x growth | 360 | 488 | 36% | ✅ OK |
| 5x growth | 900 | 488 | -46% | ❌ Not ready |
| 10x growth | 1,800 | 488 | -73% | ❌ Not ready |

![Capacity Planning](assets/charts/capacity-planning.svg)

### Recommendation

NovaPay is comfortable for current traffic and 2x growth. For 5x+ growth (projected Q4 if partnership deals close), the main bottleneck will be the PostgreSQL connection layer. Recommendations: (1) introduce read replicas for settlement queries, (2) add Redis caching for merchant config (F-03, already planned), (3) consider connection pooler (PgBouncer) for >800 TPS target.

\newpage

# 6. Findings & Remediation

### New Findings

| ID | Severity | Finding | Recommended Action | Estimated Impact |
|---|---|---|---|---|
| F-07 | P2 | Settlement export p95 approaching 1.5s for large merchants | Add pagination to batch query (LIMIT 10K per page) | Export latency -60% |
| F-08 | P2 | 3 noisy JS errors account for 84% of error volume | Silence ResizeObserver, fix null check, add retry for fetch | Cleaner error signal |

### Previously Reported — Status Update

| ID | Finding | Status | Notes |
|---|---|---|---|
| F-01 | HikariCP pool at default (10) | ✅ Resolved | Deployed Mar 3 — pool set to 30 |
| F-02 | Missing index on settlements | ✅ Resolved | Deployed Mar 3 — query from 200ms to 12ms |
| F-03 | No cache on merchant config | In progress | Redis cache PR in review, expected next week |
| F-04 | LCP 4.2s on checkout | In progress | Now 2.8s. JS deferral done, image optimization WIP |
| F-05 | No Redis connection pooling | Open | Scheduled for April sprint |
| F-06 | Health endpoint queries DB | ✅ Resolved | Fixed Mar 10 — static 200 response |

### Remediation Summary

| Priority | Open | Resolved This Month | Total Resolved |
|---|---|---|---|
| P0 Critical | 0 | 2 | 2 |
| P1 High | 2 | 0 | 0 |
| P2 Medium | 3 | 1 | 1 |

\

> **Grafana Dashboard:** https://novapay.grafana.net/d/perf-monthly
>
> **Loom video walkthrough:** https://loom.com/share/novapay-march-2026
>
> **XLSX data:** attached
>
> Next report: April 2026 · hello@vantx.io · vantx.io
