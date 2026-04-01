---
title: "Observability Baseline Report"
subtitle: "NovaPay SpA — Initial Assessment"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# OBSERVABILITY BASELINE

**NovaPay SpA — Payment Processing Platform**

March 2026 · VANTX · hello@vantx.io

\newpage

# Executive Summary

NovaPay's observability posture was assessed over 5 business days. The platform runs on AWS ECS (Fargate) with PostgreSQL (RDS), Redis (ElastiCache), and a React frontend behind CloudFront. The current monitoring setup is minimal — CloudWatch basic metrics, ad-hoc console logging, and no distributed tracing. Alerting is limited to CloudWatch alarms with email notifications, resulting in high noise and slow detection.

The team currently spends an estimated 4-6 hours per incident investigating root causes that proper instrumentation would surface in minutes. There is no SLO framework, no on-call rotation, and no structured incident response process.

### Maturity Assessment

| Dimension | Current Level | Target Level | Gap |
|---|---|---|---|
| Metrics collection | 1 Ad-hoc | 3 Standardized | 2 levels |
| Logging | 1 Ad-hoc | 3 Standardized | 2 levels |
| Tracing | 0 None | 3 Standardized | 3 levels |
| Alerting | 1 Ad-hoc | 3 Standardized | 2 levels |
| Dashboards | 1 Ad-hoc | 3 Standardized | 2 levels |
| Incident response | 0 None | 2 Basic | 2 levels |
| SLOs / error budgets | 0 None | 3 Standardized | 3 levels |
| Cost management | 1 Ad-hoc | 2 Basic | 1 level |

Levels: **0** None · **1** Ad-hoc · **2** Basic · **3** Standardized · **4** Optimized

\newpage

# 1. Current State Assessment

### Infrastructure & Architecture

NovaPay runs a microservices architecture on AWS:

- **API Gateway:** Kong on ECS (3 tasks)
- **Payment Service:** Java/Spring Boot on ECS Fargate (6 tasks, auto-scaling)
- **Settlement Service:** Java/Spring Boot on ECS Fargate (4 tasks)
- **Notification Service:** Node.js on ECS Fargate (2 tasks)
- **Frontend:** React SPA on CloudFront + S3
- **Database:** PostgreSQL 15 on RDS (db.r6g.xlarge, Multi-AZ)
- **Cache:** Redis 7 on ElastiCache (cache.r6g.large)
- **Queue:** SQS for async settlement processing

### Existing Telemetry

| Signal | Tool | Coverage | Quality | Notes |
|---|---|---|---|---|
| Metrics | CloudWatch | Basic (CPU, memory) | Low | No custom business metrics |
| Logs | CloudWatch Logs | All services | Low | Unstructured, no correlation IDs |
| Traces | None | 0% | N/A | No distributed tracing |
| RUM | None | 0% | N/A | No frontend observability |

### Current Alerting

| Alert | Condition | Channel | Actionable? |
|---|---|---|---|
| CPU > 80% | CloudWatch alarm | Email (team) | Rarely — often transient |
| 5xx > 10/min | CloudWatch alarm | Email (team) | Sometimes — too noisy |
| RDS connections > 80% | CloudWatch alarm | Email (team) | Yes — but slow to act on |
| ECS task unhealthy | CloudWatch alarm | Email (team) | Yes |

### Current Dashboards

| Dashboard | Purpose | Users | Quality |
|---|---|---|---|
| CloudWatch default | Basic infra | Ops team | Poor — generic, no business context |
| Custom Grafana (abandoned) | Attempt at custom metrics | Nobody | Dead — credentials lost, data stale |

\newpage

# 2. Key Problems Identified

| ID | Category | Problem | Business Impact |
|---|---|---|---|
| O-01 | Detection | No distributed tracing — 4-6h average to find root cause during incidents | Prolonged outages, lost revenue during investigation |
| O-02 | Alerting | Email-only alerts, no on-call rotation — issues discovered by customers | Customer-reported incidents damage trust |
| O-03 | Logging | Unstructured logs, no correlation IDs — impossible to trace requests across services | Engineers grep through 6 log groups hoping to find the right entry |
| O-04 | Metrics | No business metrics (TPS, payment success rate, settlement latency) | Cannot answer "is the platform performing well?" without checking DB |
| O-05 | SLOs | No SLOs, no error budgets — reliability decisions are ad-hoc | No framework for prioritizing reliability work vs features |

\newpage

# 3. Proposed Observability Architecture

### Signal Collection

| Signal | Source | Collector | Destination | Retention |
|---|---|---|---|---|
| Metrics | Spring Boot + Node.js (OTel SDK) | OTel Collector (sidecar) | Prometheus/Mimir | 13 months |
| Logs | All ECS services (structured JSON) | OTel Collector | Loki | 30 days |
| Traces | All services (OTel SDK) | OTel Collector | Tempo | 14 days |
| RUM/Frontend | React app (Faro SDK) | Faro → Grafana Cloud | Grafana Cloud | 30 days |
| Synthetics | k6 scripts (5 min interval) | k6 Cloud | Prometheus/Mimir | 13 months |

### SLOs

| Service | SLI | Target | Window | Error Budget |
|---|---|---|---|---|
| Payment API | Successful responses (non-5xx) / total | 99.9% | 30 days | 43.2 min downtime |
| Payment API | p95 latency < 500ms | 99.0% | 30 days | 432 min slow |
| Checkout | LCP (p75) < 2.5s | 95.0% | 30 days | 36h slow loads |
| Settlement | Batch completion < 30min | 99.5% | 30 days | 216 min delayed |

### Alert Strategy

| Alert | SLO/SLI | Condition | Burn Rate | Channel |
|---|---|---|---|---|
| Payment API availability | 99.9% availability | 14.4x burn rate in 5min | Fast burn | Slack + PagerDuty |
| Payment API availability | 99.9% availability | 1x burn rate in 6h | Slow burn | Slack |
| Payment API latency | 99% p95 < 500ms | 14.4x burn rate in 5min | Fast burn | Slack + PagerDuty |
| Checkout LCP | 95% p75 < 2.5s | 6x burn rate in 1h | Medium burn | Slack |

### Dashboard Plan

| Dashboard | Audience | Key Questions Answered |
|---|---|---|
| Service Overview | Everyone | Is the platform healthy right now? |
| Payment Flow | Engineering | How are payments performing? Where are errors? |
| SLO Status | Engineering + Management | Are we meeting our reliability targets? |
| Infrastructure | Ops | CPU, memory, connections, queue depth |
| Frontend / RUM | Frontend team | How are real users experiencing the site? |
| Cost & Volume | Management | How much telemetry are we generating? |
| Incident Timeline | On-call | What happened during this incident? |
| Business KPIs | Management | TPS, success rate, settlement time, revenue impact |

\newpage

# 4. IRM (Incident Response Management)

### Proposed Setup

- **On-call rotation:** 2-person rotation (primary + secondary), weekly shifts, starting with 3 senior engineers
- **Escalation path:** Primary (5 min) → Secondary (10 min) → Engineering Manager (20 min) → CTO (30 min)
- **Alert routing:** Critical → PagerDuty (phone + push) + Slack #incidents. Warning → Slack #incidents only
- **Status page:** Public status page at status.novapay.com, auto-updated by Grafana IRM
- **Incident timeline:** Auto-captured in Grafana IRM — every alert, every annotation, every responder action

\newpage

# 5. Implementation Plan

| Week | Phase | Deliverables |
|---|---|---|
| 1 | Instrumentation | OTel SDK in Payment + Settlement services, structured logging, correlation IDs, OTel Collector deployed |
| 2 | Dashboards & SLOs | 8 dashboards configured, 4 SLOs defined, Faro SDK in React app, synthetic monitoring live |
| 3 | Alerting & IRM | SLO-based alerts configured, PagerDuty integration, on-call rotation set up, status page live, runbooks for top 3 scenarios |
| 4 | Validation & handoff | End-to-end trace validation, alert fire drill, team training (2h workshop), documentation handoff |

### Estimated Cost (Grafana Cloud)

| Component | Included | Overage Estimate |
|---|---|---|
| Metrics (Prometheus) | 10K active series | $0 — NovaPay estimated at ~8K series |
| Logs (Loki) | 50GB/mo | $0 — estimated 30-40GB/mo with filtering |
| Traces (Tempo) | 50GB/mo | $0 — estimated 20-30GB/mo |
| RUM (Faro) | 50K sessions/mo | $0 — NovaPay currently ~38K sessions/mo |
| IRM | Included | $0 |
| **Total estimated overage** | — | **$0/mo** (within included tiers) |

\

> **Next steps:** Approve baseline → Week 1 kickoff → First dashboards live within 5 days.
>
> Stack: OpenTelemetry + Grafana Cloud. Open-source, vendor-neutral, zero lock-in.
>
> hello@vantx.io · vantx.io
