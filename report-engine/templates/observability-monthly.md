---
title: "Monthly Observability Report"
subtitle: "{{CLIENT_NAME}} — {{MONTH}} {{YEAR}}"
version: "1.0"
date: "{{MONTH}} {{YEAR}}"
---

![](assets/logo.png){ width=30% }

\

# MONTHLY OBSERVABILITY REPORT

**{{CLIENT_NAME}}** · {{MONTH}} {{YEAR}}

VANTX · hello@vantx.io

\newpage

# Executive Summary

{{EXECUTIVE_SUMMARY}}

### Month at a Glance

| Indicator | Value | Target | Status |
|---|---|---|---|
| SLO compliance | {{SLO_COMPLIANCE}} | 100% | {{STATUS}} |
| Error budget remaining | {{ERROR_BUDGET}} | >30% | {{STATUS}} |
| Alert noise ratio | {{NOISE_RATIO}} | <10% | {{STATUS}} |
| MTTD (mean time to detect) | {{MTTD}} | <{{TARGET}} | {{STATUS}} |
| MTTR (mean time to resolve) | {{MTTR}} | <{{TARGET}} | {{STATUS}} |
| Incidents (total) | {{INCIDENTS}} | — | — |
| Telemetry cost | {{COST}} | <{{BUDGET}} | {{STATUS}} |

\newpage

# 1. SLO Status

| Service | SLI | Target | Actual | Budget Remaining | Status |
|---|---|---|---|---|---|
| {{SERVICE}} | {{SLI}} | {{TARGET}} | {{ACTUAL}} | {{BUDGET}} | {{STATUS}} |
| {{SERVICE}} | {{SLI}} | {{TARGET}} | {{ACTUAL}} | {{BUDGET}} | {{STATUS}} |
| {{SERVICE}} | {{SLI}} | {{TARGET}} | {{ACTUAL}} | {{BUDGET}} | {{STATUS}} |

### Error Budget Burn

| Service | Budget (30d) | Consumed | Rate | Projected Exhaustion |
|---|---|---|---|---|
| {{SERVICE}} | {{BUDGET}} | {{CONSUMED}} | {{RATE}} | {{PROJECTION}} |

\newpage

# 2. Alerting Health

### Alert Summary

| Category | Fired | Actionable | Noise | Noise % |
|---|---|---|---|---|
| {{CATEGORY}} | {{FIRED}} | {{ACTIONABLE}} | {{NOISE}} | {{NOISE_PCT}} |
| {{CATEGORY}} | {{FIRED}} | {{ACTIONABLE}} | {{NOISE}} | {{NOISE_PCT}} |
| Total | {{TOTAL}} | {{TOTAL_ACTION}} | {{TOTAL_NOISE}} | {{AVG_NOISE}} |

### Noisy Alerts (to review)

| Alert | Fires | False Positives | Recommendation |
|---|---|---|---|
| {{ALERT}} | {{FIRES}} | {{FP}} | {{RECOMMENDATION}} |

### Missing Alerts (gaps detected)

| Scenario | Current Coverage | Recommendation |
|---|---|---|
| {{SCENARIO}} | {{COVERAGE}} | {{RECOMMENDATION}} |

\newpage

# 3. Incident Review

| Date | Severity | Service | MTTD | MTTR | Impact | Root Cause |
|---|---|---|---|---|---|---|
| {{DATE}} | {{SEVERITY}} | {{SERVICE}} | {{MTTD}} | {{MTTR}} | {{IMPACT}} | {{ROOT_CAUSE}} |

### Incident Trends (3 months)

| Month | Total | P0 | P1 | P2 | Avg MTTR |
|---|---|---|---|---|---|
| {{MONTH_1}} | {{TOTAL}} | {{P0}} | {{P1}} | {{P2}} | {{MTTR}} |
| {{MONTH_2}} | {{TOTAL}} | {{P0}} | {{P1}} | {{P2}} | {{MTTR}} |
| {{MONTH_3}} | {{TOTAL}} | {{P0}} | {{P1}} | {{P2}} | {{MTTR}} |

\newpage

# 4. Telemetry & Cost

### Volume

| Signal | Volume | Limit | Usage | Trend |
|---|---|---|---|---|
| Metrics (active series) | {{SERIES}} | {{LIMIT}} | {{USAGE}}% | {{TREND}} |
| Logs (GB/month) | {{GB}} | {{LIMIT}} | {{USAGE}}% | {{TREND}} |
| Traces (GB/month) | {{GB}} | {{LIMIT}} | {{USAGE}}% | {{TREND}} |
| RUM (sessions/month) | {{SESSIONS}} | {{LIMIT}} | {{USAGE}}% | {{TREND}} |

### Cost

| Component | This Month | Last Month | Budget | Status |
|---|---|---|---|---|
| Grafana Cloud | ${{COST}} | ${{PREV}} | ${{BUDGET}} | {{STATUS}} |

### Optimization Actions

| Action | Signal | Estimated Savings |
|---|---|---|
| {{ACTION}} | {{SIGNAL}} | {{SAVINGS}} |

\newpage

# 5. Improvements Delivered

| Item | Description | Impact |
|---|---|---|
| {{ITEM}} | {{DESCRIPTION}} | {{IMPACT}} |

# 6. Recommendations & Next Month

| Priority | Recommendation | Expected Impact |
|---|---|---|
| {{PRIORITY}} | {{RECOMMENDATION}} | {{IMPACT}} |

\

> **Grafana Dashboard:** {{DASHBOARD_URL}}
>
> Next report: {{NEXT_DATE}} · hello@vantx.io · vantx.io
