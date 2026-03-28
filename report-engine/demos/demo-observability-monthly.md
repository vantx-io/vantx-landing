---
title: "Monthly Observability Report"
subtitle: "NovaPay SpA — March 2026"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# MONTHLY OBSERVABILITY REPORT

**NovaPay SpA** · March 2026

VANTX · hello@vantx.io

\newpage

# Executive Summary

March marks Month 2 of NovaPay's managed observability engagement. The OTel instrumentation rollout completed in February — all 4 services now emit structured metrics, logs, and traces. This month focused on tuning alerts (noise ratio dropped from 35% to 8%), defining the first SLOs, and onboarding the team to the on-call rotation. One P1 incident occurred (settlement delay on Mar 12, 22 min MTTR) — detected by the new SLO-based alert 14 minutes faster than the old CloudWatch setup would have caught it.

### Month at a Glance

| Indicator | Value | Target | Status |
|---|---|---|---|
| SLO compliance | 100% (4/4 SLOs met) | 100% | ✅ Pass |
| Error budget remaining | 82% avg | >30% | ✅ Healthy |
| Alert noise ratio | 8% | <10% | ✅ Pass |
| MTTD (mean time to detect) | 2.1 min | <5 min | ✅ Pass |
| MTTR (mean time to resolve) | 18 min | <30 min | ✅ Pass |
| Incidents (total) | 3 | — | — |
| Telemetry cost | $0 overage | <$200 | ✅ Pass |

\newpage

# 1. SLO Status

| Service | SLI | Target | Actual | Budget Remaining | Status |
|---|---|---|---|---|---|
| Payment API | Availability (non-5xx) | 99.9% | 99.97% | 91% | ✅ Healthy |
| Payment API | p95 latency < 500ms | 99.0% | 99.6% | 82% | ✅ Healthy |
| Checkout | LCP (p75) < 2.5s | 95.0% | 96.2% | 74% | ✅ Healthy |
| Settlement | Batch < 30min | 99.5% | 99.8% | 84% | ✅ Healthy |

### Error Budget Burn

| Service | Budget (30d) | Consumed | Rate | Projected Exhaustion |
|---|---|---|---|---|
| Payment API (avail) | 43.2 min | 3.9 min | 0.09x | Never (at current rate) |
| Payment API (latency) | 432 min | 78 min | 0.18x | Never |
| Checkout (LCP) | 36h | 9.4h | 0.26x | Never |
| Settlement (batch) | 216 min | 34 min | 0.16x | Never |

\newpage

# 2. Alerting Health

### Alert Summary

| Category | Fired | Actionable | Noise | Noise % |
|---|---|---|---|---|
| Availability | 4 | 4 | 0 | 0% |
| Latency | 8 | 6 | 2 | 25% |
| Infrastructure | 12 | 11 | 1 | 8% |
| Frontend | 3 | 3 | 0 | 0% |
| **Total** | **27** | **24** | **3** | **8%** |

### Noisy Alerts (to review)

| Alert | Fires | False Positives | Recommendation |
|---|---|---|---|
| Settlement p95 > 2s | 2 | 2 | Increase threshold to 3s — batch settlements naturally spike during nightly cron |
| Redis memory > 70% | 1 | 1 | Adjust to 85% — normal cache fill behavior |

### Missing Alerts (gaps detected)

| Scenario | Current Coverage | Recommendation |
|---|---|---|
| SQS queue depth growing | No alert | Add alert: queue depth > 1000 for 5 min |
| RDS replication lag | No alert | Add alert: lag > 30s |

\newpage

# 3. Incident Review

| Date | Severity | Service | MTTD | MTTR | Impact | Root Cause |
|---|---|---|---|---|---|---|
| Mar 5 | P2 | Checkout | 1.5 min | 8 min | Slow checkouts (3 min) | CDN cache invalidation during deploy |
| Mar 12 | P1 | Settlement | 2.1 min | 22 min | Export timeouts (12 min) | 120K row batch exceeded query timeout |
| Mar 19 | P3 | Checkout | 0.5 min | 3 min | Brief 503s during deploy | Planned rolling restart |

### Incident Trends (3 months)

| Month | Total | P0 | P1 | P2 | Avg MTTR |
|---|---|---|---|---|---|
| January | 4 | 0 | 1 | 3 | 45 min (pre-OTel) |
| February | 3 | 0 | 1 | 2 | 28 min (partial OTel) |
| March | 3 | 0 | 1 | 2 | 11 min |

![MTTR Trend — Impact of Observability](assets/charts/mttr-trend.svg)

> **Trend:** MTTR dropped from 45 min → 11 min (-76%) since OTel rollout. Distributed tracing is the single biggest contributor — engineers now find root cause in the trace instead of grepping logs.

\newpage

# 4. Telemetry & Cost

### Volume

| Signal | Volume | Limit | Usage | Trend |
|---|---|---|---|---|
| Metrics (active series) | 7,800 | 10,000 | 78% | Stable |
| Logs (GB/month) | 34 GB | 50 GB | 68% | +5% (new structured fields) |
| Traces (GB/month) | 22 GB | 50 GB | 44% | Stable |
| RUM (sessions/month) | 38,200 | 50,000 | 76% | +8% (traffic growth) |

### Cost

| Component | This Month | Last Month | Budget | Status |
|---|---|---|---|---|
| Grafana Cloud | $0 overage | $0 overage | $200 | ✅ Within |

### Optimization Actions

| Action | Signal | Estimated Savings |
|---|---|---|
| Drop debug-level logs in production | Logs | -8 GB/mo (~24% reduction) |
| Reduce trace sampling for health checks | Traces | -3 GB/mo (~14% reduction) |

\newpage

# 5. Improvements Delivered

| Item | Description | Impact |
|---|---|---|
| SLO dashboards live | 4 SLOs with burn-rate visualization | Team can see reliability status at a glance |
| On-call rotation active | 3-person weekly rotation via Grafana IRM | Incidents routed to the right person in <2 min |
| Status page launched | status.novapay.com auto-updated | Customers see incident status without contacting support |
| Alert tuning round 1 | Removed 5 noisy CloudWatch alarms, replaced with SLO-based alerts | Noise ratio: 35% → 8% |

# 6. Recommendations & Next Month

| Priority | Recommendation | Expected Impact |
|---|---|---|
| P1 | Add SQS queue depth alert | Catch settlement processing delays before they cascade |
| P1 | Instrument Notification Service (last un-instrumented service) | Complete end-to-end trace coverage |
| P2 | Add RDS replication lag alert | Detect read replica drift before it impacts queries |
| P2 | Build runbook for top 3 incident types | Reduce MTTR further by standardizing response |

\

> **Grafana Dashboard:** https://novapay.grafana.net/d/obs-monthly
>
> Next report: April 2026 · hello@vantx.io · vantx.io
