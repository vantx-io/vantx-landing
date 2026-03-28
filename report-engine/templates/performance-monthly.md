---
title: "Monthly Performance Report"
subtitle: "{{CLIENT_NAME}} — {{MONTH}} {{YEAR}}"
version: "1.0"
date: "{{MONTH}} {{YEAR}}"
---

![](assets/logo.png){ width=30% }

\

# MONTHLY PERFORMANCE REPORT

**{{CLIENT_NAME}}** · {{MONTH}} {{YEAR}}

VANTX · hello@vantx.io

\newpage

# Executive Summary

{{EXECUTIVE_SUMMARY}}

### Month at a Glance

| Indicator | Value | Target | Status |
|---|---|---|---|
| Uptime | {{UPTIME}}% | ≥99.9% | {{STATUS}} |
| p50 Response Time | {{P50}} | <{{TARGET}} | {{STATUS}} |
| p95 Response Time | {{P95}} | <{{TARGET}} | {{STATUS}} |
| Error Rate | {{ERROR_RATE}} | <{{TARGET}} | {{STATUS}} |
| Load Test: Max TPS | {{MAX_TPS}} | ≥{{TARGET}} | {{STATUS}} |
| Lighthouse Score (avg) | {{SCORE}}/100 | ≥{{TARGET}} | {{STATUS}} |
| RUM LCP (p75) | {{LCP}} | <2.5s | {{STATUS}} |
| JS Errors (total) | {{JS_ERRORS}} | <{{TARGET}} | {{STATUS}} |

\newpage

# 1. Uptime & Availability

### Monthly Uptime Summary

| Endpoint | Uptime | Avg Response | Max Response | Incidents |
|---|---|---|---|---|
| {{ENDPOINT}} | {{UPTIME}}% | {{AVG}} | {{MAX}} | {{COUNT}} |
| {{ENDPOINT}} | {{UPTIME}}% | {{AVG}} | {{MAX}} | {{COUNT}} |
| {{ENDPOINT}} | {{UPTIME}}% | {{AVG}} | {{MAX}} | {{COUNT}} |

### Incident Log

| Date | Duration | Endpoint | Impact | Root Cause | Resolution |
|---|---|---|---|---|---|
| {{DATE}} | {{DURATION}} | {{ENDPOINT}} | {{IMPACT}} | {{CAUSE}} | {{RESOLUTION}} |

### Uptime Trend (3 months)

| Month | Uptime | Incidents | MTTR |
|---|---|---|---|
| {{MONTH_1}} | {{UPTIME}}% | {{INCIDENTS}} | {{MTTR}} |
| {{MONTH_2}} | {{UPTIME}}% | {{INCIDENTS}} | {{MTTR}} |
| {{MONTH_3}} | {{UPTIME}}% | {{INCIDENTS}} | {{MTTR}} |

\newpage

# 2. Synthetic Monitoring

### Critical Flows — Monthly Summary

| Flow | p50 | p95 | p99 | Error Rate | Checks | Status |
|---|---|---|---|---|---|---|
| {{FLOW}} | {{P50}} | {{P95}} | {{P99}} | {{ERROR_RATE}} | {{CHECKS}} | {{STATUS}} |
| {{FLOW}} | {{P50}} | {{P95}} | {{P99}} | {{ERROR_RATE}} | {{CHECKS}} | {{STATUS}} |
| {{FLOW}} | {{P50}} | {{P95}} | {{P99}} | {{ERROR_RATE}} | {{CHECKS}} | {{STATUS}} |

### Latency Trend (3 months)

| Flow | {{MONTH_1}} p95 | {{MONTH_2}} p95 | {{MONTH_3}} p95 | Trend |
|---|---|---|---|---|
| {{FLOW}} | {{P95}} | {{P95}} | {{P95}} | {{TREND}} |

\newpage

# 3. Load Test Results

**Test date:** {{TEST_DATE}}
**Target:** {{TARGET_DESCRIPTION}}
**Stack:** k6 + Grafana Cloud

### Baseline (normal traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | {{VU}} | — | — |
| Avg TPS | {{TPS}} | ≥{{THRESHOLD}} | {{STATUS}} |
| p50 latency | {{P50}} | <{{THRESHOLD}} | {{STATUS}} |
| p95 latency | {{P95}} | <{{THRESHOLD}} | {{STATUS}} |
| p99 latency | {{P99}} | <{{THRESHOLD}} | {{STATUS}} |
| Error rate | {{ERROR_RATE}} | <{{THRESHOLD}} | {{STATUS}} |

### Stress ({{STRESS_MULTIPLIER}}x traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | {{VU}} | — | — |
| Max TPS | {{TPS}} | ≥{{THRESHOLD}} | {{STATUS}} |
| p95 latency | {{P95}} | <{{THRESHOLD}} | {{STATUS}} |
| Error rate | {{ERROR_RATE}} | <{{THRESHOLD}} | {{STATUS}} |

### Spike ({{SPIKE_MULTIPLIER}}x burst)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | {{VU}} | — | — |
| Max TPS | {{TPS}} | ≥{{THRESHOLD}} | {{STATUS}} |
| p95 latency | {{P95}} | <{{THRESHOLD}} | {{STATUS}} |
| Recovery | {{RECOVERY}} | <{{THRESHOLD}} | {{STATUS}} |

### Load Test Trend (3 months)

| Month | Max TPS | Breakpoint | p95 (stress) | Trend |
|---|---|---|---|---|
| {{MONTH_1}} | {{TPS}} | {{BP}} | {{P95}} | — |
| {{MONTH_2}} | {{TPS}} | {{BP}} | {{P95}} | {{TREND}} |
| {{MONTH_3}} | {{TPS}} | {{BP}} | {{P95}} | {{TREND}} |

\newpage

# 4. Web Performance

### Lighthouse CI (weekly runs)

| Page | LCP | INP | CLS | Score | vs Last Month |
|---|---|---|---|---|---|
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{SCORE}}/100 | {{DELTA}} |
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{SCORE}}/100 | {{DELTA}} |
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{SCORE}}/100 | {{DELTA}} |

### RUM — Real User Monitoring

| Metric | Value | Target | Status |
|---|---|---|---|
| Total Sessions | {{SESSIONS}} | — | — |
| LCP (p75) | {{LCP}} | <2.5s | {{STATUS}} |
| INP (p75) | {{INP}} | <200ms | {{STATUS}} |
| CLS (p75) | {{CLS}} | <0.1 | {{STATUS}} |
| JS Errors (unique) | {{UNIQUE_ERRORS}} | — | — |
| JS Errors (total) | {{TOTAL_ERRORS}} | <{{THRESHOLD}} | {{STATUS}} |

### Top JS Errors

| Error | Count | Page | Impact |
|---|---|---|---|
| {{ERROR}} | {{COUNT}} | {{PAGE}} | {{IMPACT}} |
| {{ERROR}} | {{COUNT}} | {{PAGE}} | {{IMPACT}} |

\newpage

# 5. Capacity Planning

| Scenario | Required TPS | Current Max | Headroom | Status |
|---|---|---|---|---|
| Current traffic | {{TPS}} | {{MAX_TPS}} | {{HEADROOM}} | {{STATUS}} |
| 2x growth | {{TPS}} | {{MAX_TPS}} | {{HEADROOM}} | {{STATUS}} |
| 5x growth | {{TPS}} | {{MAX_TPS}} | {{HEADROOM}} | {{STATUS}} |
| 10x growth | {{TPS}} | {{MAX_TPS}} | {{HEADROOM}} | {{STATUS}} |

### Recommendation

{{CAPACITY_RECOMMENDATION}}

\newpage

# 6. Findings & Remediation

### New Findings

| ID | Severity | Finding | Recommended Action | Estimated Impact |
|---|---|---|---|---|
| {{ID}} | {{SEVERITY}} | {{FINDING}} | {{ACTION}} | {{IMPACT}} |
| {{ID}} | {{SEVERITY}} | {{FINDING}} | {{ACTION}} | {{IMPACT}} |

### Previously Reported — Status Update

| ID | Finding | Status | Notes |
|---|---|---|---|
| {{ID}} | {{FINDING}} | {{STATUS}} | {{NOTES}} |

### Remediation Summary

| Priority | Open | Resolved This Month | Total Resolved |
|---|---|---|---|
| P0 Critical | {{COUNT}} | {{RESOLVED}} | {{TOTAL}} |
| P1 High | {{COUNT}} | {{RESOLVED}} | {{TOTAL}} |
| P2 Medium | {{COUNT}} | {{RESOLVED}} | {{TOTAL}} |

\

> **Grafana Dashboard:** {{DASHBOARD_URL}}
>
> **Loom video walkthrough:** {{LOOM_URL}}
>
> **XLSX data:** attached
>
> Next report: {{NEXT_DATE}} · hello@vantx.io · vantx.io
