---
title: "Weekly Performance Report"
subtitle: "NovaPay SpA — Week 12"
version: "1.0"
date: "March 17–21, 2026"
---

![](assets/logo.png){ width=30% }

\

# WEEKLY PERFORMANCE REPORT

**NovaPay SpA** · Week 12 · March 17–21, 2026

VANTX · hello@vantx.io

\newpage

# Summary

| Indicator | This Week | Previous Week | Trend |
|---|---|---|---|
| Uptime | 99.97% | 99.92% | +0.05 |
| Avg Response Time (p50) | 82ms | 95ms | -13ms |
| p95 Latency | 210ms | 245ms | -35ms |
| Error Rate | 0.015% | 0.021% | -0.006 |
| Requests/day (avg) | 1.2M | 1.1M | +9% |

### Status: All systems nominal

Uptime exceeded target (99.9%). Response times improved following last week's HikariCP tuning (F-01 fix deployed Monday). Error rate well below threshold. Traffic growing steadily — projected to hit 1.5M/day by April.

![Uptime — Week 12](assets/charts/uptime-weekly.svg)

\newpage

# Uptime & Availability

| Endpoint | Uptime | Avg Response | Incidents |
|---|---|---|---|
| /api/payments | 99.98% | 78ms | 0 |
| /api/settlements | 99.97% | 92ms | 0 |
| /api/merchants | 99.99% | 45ms | 0 |
| /checkout | 99.95% | 110ms | 1 (planned) |

### Downtime Events

| Date | Duration | Endpoint | Root Cause |
|---|---|---|---|
| Mar 19 02:15 | 3 min | /checkout | Planned deploy v2.14.3 (rolling restart) |

# Synthetic Monitoring

| Flow | p50 | p95 | Error Rate | Status |
|---|---|---|---|---|
| Login → Dashboard | 420ms | 680ms | 0% | ✅ Pass |
| Create Payment | 310ms | 520ms | 0.01% | ✅ Pass |
| Settlement Export | 890ms | 1,400ms | 0% | ✅ Pass |
| Checkout (guest) | 650ms | 980ms | 0.02% | ✅ Pass |

# Web Performance (Lighthouse CI)

| Page | LCP | INP | CLS | Score | vs Last Week |
|---|---|---|---|---|---|
| Homepage | 1.9s | 78ms | 0.04 | 74/100 | +6 |
| Checkout | 2.8s | 110ms | 0.08 | 58/100 | +16 |
| Dashboard | 2.6s | 88ms | 0.06 | 62/100 | +7 |

# RUM — Real User Monitoring

| Metric | Value | Target | Status |
|---|---|---|---|
| Sessions (week) | 38,200 | — | — |
| LCP (p75, real users) | 2.3s | <2.5s | ✅ Pass |
| INP (p75, real users) | 165ms | <200ms | ✅ Pass |
| CLS (p75, real users) | 0.07 | <0.1 | ✅ Pass |
| JS Errors | 142 | <200 | ✅ Pass |

# Findings & Actions

| ID | Priority | Finding | Action | Owner |
|---|---|---|---|---|
| F-04 | P1 | Checkout LCP still 2.8s (lab), improved from 4.2s | Continue JS deferral work; hero image WebP done | NovaPay frontend |
| F-07 | P2 | Settlement export p95 approaching 1.5s | Monitor — if sustained, add pagination to batch query | VANTX |

\

> **Grafana Dashboard:** https://novapay.grafana.net/d/perf-weekly
>
> Next report: March 28 · hello@vantx.io · vantx.io
