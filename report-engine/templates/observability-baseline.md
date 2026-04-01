---
title: "Observability Baseline Report"
subtitle: "{{CLIENT_NAME}} — Initial Assessment"
version: "1.0"
date: "{{MONTH}} {{YEAR}}"
---

![](assets/logo.png){ width=30% }

\

# OBSERVABILITY BASELINE

**{{CLIENT_NAME}} — {{PLATFORM_DESCRIPTION}}**

{{MONTH}} {{YEAR}} · VANTX · hello@vantx.io

\newpage

# Executive Summary

{{EXECUTIVE_SUMMARY}}

### Maturity Assessment

| Dimension | Current Level | Target Level | Gap |
|---|---|---|---|
| Metrics collection | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| Logging | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| Tracing | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| Alerting | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| Dashboards | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| Incident response | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| SLOs / error budgets | {{LEVEL}} | {{TARGET}} | {{GAP}} |
| Cost management | {{LEVEL}} | {{TARGET}} | {{GAP}} |

Levels: **0** None · **1** Ad-hoc · **2** Basic · **3** Standardized · **4** Optimized

\newpage

# 1. Current State Assessment

### Infrastructure & Architecture

{{ARCHITECTURE_DESCRIPTION}}

### Existing Telemetry

| Signal | Tool | Coverage | Quality | Notes |
|---|---|---|---|---|
| Metrics | {{TOOL}} | {{COVERAGE}} | {{QUALITY}} | {{NOTES}} |
| Logs | {{TOOL}} | {{COVERAGE}} | {{QUALITY}} | {{NOTES}} |
| Traces | {{TOOL}} | {{COVERAGE}} | {{QUALITY}} | {{NOTES}} |
| RUM | {{TOOL}} | {{COVERAGE}} | {{QUALITY}} | {{NOTES}} |

### Current Alerting

| Alert | Condition | Channel | Actionable? |
|---|---|---|---|
| {{ALERT}} | {{CONDITION}} | {{CHANNEL}} | {{ACTIONABLE}} |

### Current Dashboards

| Dashboard | Purpose | Users | Quality |
|---|---|---|---|
| {{DASHBOARD}} | {{PURPOSE}} | {{USERS}} | {{QUALITY}} |

\newpage

# 2. Key Problems Identified

| ID | Category | Problem | Business Impact |
|---|---|---|---|
| O-01 | {{CATEGORY}} | {{PROBLEM}} | {{IMPACT}} |
| O-02 | {{CATEGORY}} | {{PROBLEM}} | {{IMPACT}} |
| O-03 | {{CATEGORY}} | {{PROBLEM}} | {{IMPACT}} |
| O-04 | {{CATEGORY}} | {{PROBLEM}} | {{IMPACT}} |
| O-05 | {{CATEGORY}} | {{PROBLEM}} | {{IMPACT}} |

\newpage

# 3. Proposed Observability Architecture

### Signal Collection

| Signal | Source | Collector | Destination | Retention |
|---|---|---|---|---|
| Metrics | {{SOURCE}} | OTel Collector | Prometheus/Mimir | {{RETENTION}} |
| Logs | {{SOURCE}} | OTel Collector | Loki | {{RETENTION}} |
| Traces | {{SOURCE}} | OTel SDK | Tempo | {{RETENTION}} |
| RUM/Frontend | {{SOURCE}} | Faro SDK | Grafana Cloud | {{RETENTION}} |

### SLOs

| Service | SLI | Target | Window | Error Budget |
|---|---|---|---|---|
| {{SERVICE}} | {{SLI}} | {{TARGET}} | 30 days | {{BUDGET}} |
| {{SERVICE}} | {{SLI}} | {{TARGET}} | 30 days | {{BUDGET}} |

### Alert Strategy

| Alert | SLO/SLI | Condition | Burn Rate | Channel |
|---|---|---|---|---|
| {{ALERT}} | {{SLO}} | {{CONDITION}} | {{BURN_RATE}} | {{CHANNEL}} |

### Dashboard Plan

| Dashboard | Audience | Key Questions Answered |
|---|---|---|
| {{DASHBOARD}} | {{AUDIENCE}} | {{QUESTIONS}} |

\newpage

# 4. IRM (Incident Response Management)

### Proposed Setup

- **On-call rotation:** {{ROTATION_DESCRIPTION}}
- **Escalation path:** {{ESCALATION_PATH}}
- **Alert routing:** {{ROUTING_DESCRIPTION}}
- **Status page:** {{STATUS_PAGE}}
- **Incident timeline:** Auto-captured in Grafana IRM

\newpage

# 5. Implementation Plan

| Week | Phase | Deliverables |
|---|---|---|
| 1 | Instrumentation | {{DELIVERABLES}} |
| 2 | Dashboards & SLOs | {{DELIVERABLES}} |
| 3 | Alerting & IRM | {{DELIVERABLES}} |
| 4 | Validation & handoff | {{DELIVERABLES}} |

### Estimated Cost (Grafana Cloud)

| Component | Included | Overage Estimate |
|---|---|---|
| Metrics (Prometheus) | 10K series | {{ESTIMATE}} |
| Logs (Loki) | 50GB/mo | {{ESTIMATE}} |
| Traces (Tempo) | 50GB/mo | {{ESTIMATE}} |
| RUM (Faro) | 50K sessions/mo | {{ESTIMATE}} |
| IRM | Included | $0 |

\

> **Next steps:** Approve baseline → Week 1 kickoff → First dashboards live within 5 days.
>
> Stack: OpenTelemetry + Grafana Cloud. Open-source, vendor-neutral, zero lock-in.
>
> hello@vantx.io · vantx.io
