---
title: "Weekly Performance Report"
subtitle: "{{CLIENT_NAME}} — Week {{WEEK_NUMBER}}"
version: "1.0"
date: "{{DATE_RANGE}}"
---

![](assets/logo.png){ width=30% }

\

# WEEKLY PERFORMANCE REPORT

**{{CLIENT_NAME}}** · Week {{WEEK_NUMBER}} · {{DATE_RANGE}}

VANTX · hello@vantx.io

\newpage

# Summary

| Indicator | This Week | Previous Week | Trend |
|---|---|---|---|
| Uptime | {{UPTIME}}% | {{PREV_UPTIME}}% | {{TREND}} |
| Avg Response Time (p50) | {{P50}} | {{PREV_P50}} | {{TREND}} |
| p95 Latency | {{P95}} | {{PREV_P95}} | {{TREND}} |
| Error Rate | {{ERROR_RATE}} | {{PREV_ERROR_RATE}} | {{TREND}} |
| Requests/day (avg) | {{RPD}} | {{PREV_RPD}} | {{TREND}} |

### Status: {{OVERALL_STATUS}}

{{SUMMARY_PARAGRAPH}}

\newpage

# Uptime & Availability

| Endpoint | Uptime | Avg Response | Incidents |
|---|---|---|---|
| {{ENDPOINT}} | {{UPTIME}}% | {{RESPONSE}} | {{INCIDENTS}} |
| {{ENDPOINT}} | {{UPTIME}}% | {{RESPONSE}} | {{INCIDENTS}} |
| {{ENDPOINT}} | {{UPTIME}}% | {{RESPONSE}} | {{INCIDENTS}} |

### Downtime Events

| Date | Duration | Endpoint | Root Cause |
|---|---|---|---|
| {{DATE}} | {{DURATION}} | {{ENDPOINT}} | {{CAUSE}} |

# Synthetic Monitoring

| Flow | p50 | p95 | Error Rate | Status |
|---|---|---|---|---|
| {{FLOW}} | {{P50}} | {{P95}} | {{ERROR_RATE}} | {{STATUS}} |
| {{FLOW}} | {{P50}} | {{P95}} | {{ERROR_RATE}} | {{STATUS}} |
| {{FLOW}} | {{P50}} | {{P95}} | {{ERROR_RATE}} | {{STATUS}} |

# Web Performance (Lighthouse CI)

| Page | LCP | INP | CLS | Score | vs Last Week |
|---|---|---|---|---|---|
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{SCORE}}/100 | {{DELTA}} |
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{SCORE}}/100 | {{DELTA}} |

# RUM — Real User Monitoring

| Metric | Value | Target | Status |
|---|---|---|---|
| Sessions (week) | {{SESSIONS}} | — | — |
| LCP (p75, real users) | {{LCP}} | <2.5s | {{STATUS}} |
| INP (p75, real users) | {{INP}} | <200ms | {{STATUS}} |
| CLS (p75, real users) | {{CLS}} | <0.1 | {{STATUS}} |
| JS Errors | {{JS_ERRORS}} | <{{THRESHOLD}} | {{STATUS}} |

# Findings & Actions

| ID | Priority | Finding | Action | Owner |
|---|---|---|---|---|
| {{ID}} | {{PRIORITY}} | {{FINDING}} | {{ACTION}} | {{OWNER}} |
| {{ID}} | {{PRIORITY}} | {{FINDING}} | {{ACTION}} | {{OWNER}} |

\

> **Grafana Dashboard:** {{DASHBOARD_URL}}
>
> Next report: {{NEXT_DATE}} · hello@vantx.io · vantx.io
