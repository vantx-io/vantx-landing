---
title: "Fractional SRE — Monthly Report"
subtitle: "NovaPay SpA — March 2026"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# FRACTIONAL SRE — MONTHLY REPORT

**NovaPay SpA** · March 2026

VANTX · hello@vantx.io

\newpage

# Executive Summary

Month 3 of the Fractional SRE engagement. Focus areas this month: completing the incident response framework, running the first chaos engineering experiment, and mentoring two engineers on SRE practices. The team successfully ran their first on-call rotation without escalation. SRE maturity score improved from 2.0 to 2.6/5.

### Engagement Health

| Indicator | Value | Notes |
|---|---|---|
| Month | 3 of engagement | — |
| Requests completed | 8 | via Linear board |
| Avg turnaround | 36h | target: 48h |
| SRE maturity score | 2.6/5 | vs 2.0/5 last month |
| Active incidents | 0 | — |

\newpage

# 1. Reliability Status

### SLO Dashboard

| Service | SLI | Target | Actual | Budget | Status |
|---|---|---|---|---|---|
| Payment API | Availability | 99.9% | 99.97% | 91% remaining | ✅ Healthy |
| Payment API | p95 < 500ms | 99.0% | 99.6% | 82% remaining | ✅ Healthy |
| Checkout | LCP p75 < 2.5s | 95.0% | 96.2% | 74% remaining | ✅ Healthy |
| Settlement | Batch < 30min | 99.5% | 99.8% | 84% remaining | ✅ Healthy |

### Incident Summary

| Date | Severity | Title | MTTD | MTTR | Status |
|---|---|---|---|---|---|
| Mar 5 | P2 | CDN cache invalidation during deploy | 1.5 min | 8 min | Resolved + post-mortem done |
| Mar 12 | P1 | Large batch settlement timeout | 2.1 min | 22 min | Resolved + post-mortem done |
| Mar 19 | P3 | Planned deploy brief 503 | 0.5 min | 3 min | Expected behavior |

### On-Call Health

| Metric | Value | Target |
|---|---|---|
| Pages received | 6 | — |
| Actionable % | 83% | >90% |
| Avg acknowledge time | 3.2 min | <5 min |
| Escalations | 0 | — |

\newpage

# 2. Work Completed

### Board Requests

| Request | Type | Status | Turnaround |
|---|---|---|---|
| Define error budget policy document | Process | ✅ Done | 1 day |
| Set up Grafana IRM on-call rotation | Tooling | ✅ Done | 2 days |
| Write runbook: payment API degradation | Documentation | ✅ Done | 1 day |
| Write runbook: settlement batch failure | Documentation | ✅ Done | 1 day |
| Review deployment pipeline for reliability gaps | Architecture | ✅ Done | 2 days |
| Run chaos experiment: kill Payment Service task | Chaos engineering | ✅ Done | 1 day |
| Mentor session: SLOs with Carlos and Marta | Training | ✅ Done | 2h |
| Review PR: circuit breaker for settlement→payment calls | Code review | ✅ Done | 4h |

### Initiatives & Projects

| Initiative | Progress | Notes |
|---|---|---|
| Incident response framework | 90% complete | Runbooks for top 3 scenarios done. Status page live. Remaining: escalation drill |
| Chaos engineering program | 20% started | First experiment successful (ECS task kill). Next: Redis failover |
| On-call readiness | 75% complete | 3 engineers trained, rotation active. Need 2 more engineers for sustainable rotation |

\newpage

# 3. Post-Mortems

### Completed This Month

| Incident | Date | Root Cause | Action Items | Status |
|---|---|---|---|---|
| CDN cache invalidation | Mar 5 | CloudFront invalidation triggered during deploy flushes cache for all objects | 2 items | 1/2 done |
| Settlement batch timeout | Mar 12 | No query limit on batch endpoint; 120K row query exceeded 30s timeout | 3 items | 2/3 done |

### Open Action Items (all post-mortems)

| Action | Origin | Owner | Due | Status |
|---|---|---|---|---|
| Implement selective CDN invalidation (path-based) | Mar 5 incident | DevOps (Javier) | Mar 28 | In progress |
| Add pagination to settlement export API | Mar 12 incident | Backend (Carlos) | Mar 21 | ✅ Done |
| Add query timeout alert (>10s queries) | Mar 12 incident | VANTX SRE | Mar 25 | ✅ Done |
| Load test settlement export with 200K+ rows | Mar 12 incident | VANTX SRE | Apr 4 | Open |

\newpage

# 4. Capacity & Architecture

### Capacity Status

| Resource | Current Usage | Limit | Headroom | Risk |
|---|---|---|---|---|
| ECS Payment tasks | 4/6 avg (auto-scale) | 12 max | 3x | Low |
| ECS Settlement tasks | 3/4 avg | 8 max | 2.7x | Low |
| RDS connections | 24/30 (HikariCP) | 150 (RDS max) | 6.3x | Low |
| Redis memory | 2.1 GB | 6.4 GB | 3x | Low |
| SQS queue depth | 50 avg, 800 peak | No limit | — | Monitor |

### Architecture Decisions

| ADR | Decision | Rationale | Status |
|---|---|---|---|
| ADR-007 | Add circuit breaker between Settlement → Payment API | Settlement timeout cascade observed in Mar 12 incident | Approved, PR in review |
| ADR-008 | Use PgBouncer for connection pooling at >800 TPS | HikariCP per-service pooling won't scale beyond 800 TPS | Proposed for Q2 |

\newpage

# 5. Team Development

### Knowledge Transfer

| Topic | Format | Attendees | Date |
|---|---|---|---|
| SLOs: why and how | Workshop (2h) | Carlos, Marta, Javier | Mar 8 |
| Writing effective runbooks | Pair programming | Carlos | Mar 14 |
| Reading traces in Grafana | Hands-on session (1h) | Full team (5) | Mar 20 |

### Maturity Progress

![SRE Maturity Progress](assets/charts/sre-maturity.svg)

| Dimension | Start (Jan) | Last Month | This Month | Target |
|---|---|---|---|---|
| SLOs & error budgets | 0 | 1 | 3 | 3 |
| Incident response | 0 | 1 | 3 | 4 |
| Runbooks & docs | 0 | 1 | 2 | 3 |
| On-call | 0 | 1 | 3 | 3 |
| Chaos engineering | 0 | 0 | 1 | 2 |
| Load testing | 1 | 2 | 3 | 3 |

# 6. Next Month Plan

| Priority | Item | Expected Outcome |
|---|---|---|
| P1 | Chaos experiment: Redis failover | Validate cache recovery behavior under ElastiCache failover |
| P1 | Escalation drill with full team | Test end-to-end incident response including CTO escalation |
| P1 | Train 2 more engineers for on-call | Sustainable 5-person rotation |
| P2 | Architecture review for PgBouncer | Decision document for Q2 scaling |
| P2 | Runbooks for remaining 3 incident types | Complete runbook coverage for all known failure modes |

\

> hello@vantx.io · vantx.io
