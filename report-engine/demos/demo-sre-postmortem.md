---
title: "Incident Post-Mortem"
subtitle: "NovaPay SpA — INC-2026-0312"
version: "1.0"
date: "March 14, 2026"
---

![](assets/logo.png){ width=30% }

\

# INCIDENT POST-MORTEM

**INC-2026-0312: Settlement batch timeout causing export failures**

NovaPay SpA · March 14, 2026

VANTX · hello@vantx.io

\newpage

# Incident Summary

| Field | Detail |
|---|---|
| Incident ID | INC-2026-0312 |
| Severity | P1 — High |
| Date | March 12, 2026 |
| Duration | 22 minutes (10:03–10:25 UTC) |
| Time to Detect (MTTD) | 2.1 minutes |
| Time to Resolve (MTTR) | 22 minutes |
| Impacted services | Settlement Service, partially Payment API |
| Customer impact | 3 merchants unable to export settlements; 2 merchants experienced slow payment processing |
| Business impact | ~$12K in delayed settlement processing (resolved same day); 0 lost transactions |
| Status page updated | Yes — at 10:08 UTC (5 min after detection) |

\newpage

# Timeline

| Time (UTC) | Event |
|---|---|
| 10:00 | Nightly cron triggers settlement batch for MerchantX (120K rows — largest merchant) |
| 10:03 | SLO alert fires: Settlement batch p95 > 30s (14.4x burn rate) |
| 10:05 | On-call engineer (Carlos) acknowledges alert, opens Grafana |
| 10:06 | Trace shows settlement query running for 28s — full table scan on 120K rows |
| 10:08 | Status page updated: "Settlement exports degraded" |
| 10:10 | Carlos identifies query: `SELECT * FROM settlements WHERE merchant_id = ? AND status = ? ORDER BY created_at DESC` — no LIMIT clause |
| 10:12 | Cascading effect: Settlement Service connection pool saturated → Payment API settlement lookups start timing out |
| 10:15 | Carlos applies emergency fix: `SET statement_timeout = '10s'` on settlement DB role to prevent runaway queries |
| 10:18 | Payment API recovers as settlement connections free up |
| 10:20 | Carlos deploys hotfix: adds `LIMIT 10000` to settlement export query with pagination |
| 10:25 | All systems nominal. Settlement export completes for MerchantX via pagination (12 pages). |
| 10:30 | Status page updated: "Resolved" |
| 10:45 | Incident channel closed. Post-mortem scheduled for Mar 14 |

\newpage

# Root Cause Analysis

### What happened

MerchantX, NovaPay's largest merchant, accumulated 120K settlement records in March. The settlement export endpoint had no pagination — it attempted to load all 120K rows into memory in a single query. This query took >30 seconds, saturating the Settlement Service's HikariCP connection pool (30 connections). Because the Payment API also queries the settlement table for real-time lookups, the pool exhaustion cascaded to payment processing.

### Contributing factors

1. **No query pagination:** The settlement export endpoint was designed for small merchants (<5K rows) and never updated for growth
2. **Shared connection pool:** Payment API and Settlement Service share the same PostgreSQL database and connection pool
3. **No query timeout:** PostgreSQL had no `statement_timeout` configured — long queries could run indefinitely

### Why wasn't it caught earlier?

- The largest merchant had 40K rows last month — the query completed in ~8s, below alert thresholds
- No load test scenario covered the "large merchant export" path — previous tests used synthetic data with uniform merchant sizes
- The SLO alert did catch it within 2.1 minutes — this is the first incident detected by the new observability stack

\newpage

# Impact

### User impact

3 merchants were unable to export settlements for 12 minutes. 2 additional merchants experienced payment processing delays (p95 increased from 500ms to 3.2s for ~10 minutes). No transactions were lost — all payments were eventually processed.

### Revenue impact

~$12K in settlement processing was delayed by approximately 1 hour (until the paginated export completed). No revenue was lost. No SLA breach (NovaPay's settlement SLA is same-day processing).

### Data integrity

No data integrity issues. All settlement records were preserved. The paginated export produced identical results to the previous single-query approach.

\newpage

# What Went Well

- New SLO-based alert detected the issue in 2.1 minutes (vs estimated 15+ minutes with old CloudWatch setup)
- Carlos found the root cause via distributed trace in under 5 minutes
- Status page was updated within 5 minutes of detection
- Emergency `statement_timeout` prevented further cascading while hotfix was prepared
- Hotfix deployed and validated within 20 minutes

# What Went Wrong

- No pagination on settlement export — technical debt from v1 design
- Shared connection pool between read-heavy export and write-heavy payments
- No load test scenario for large merchant data volumes
- On-call runbook didn't cover "settlement degradation" specifically (added post-incident)

# Where We Got Lucky

- MerchantX's export ran at 10:00 UTC (low traffic) — during peak hours, the cascading impact on payments would have been significantly worse
- The hotfix (adding LIMIT + pagination) was a simple change that didn't require schema migration

\newpage

# Action Items

| ID | Action | Owner | Priority | Due Date | Status |
|---|---|---|---|---|---|
| AI-01 | Add pagination to all export endpoints (settlements, transactions, merchants) | Carlos (Backend) | P0 | Mar 18 | ✅ Done |
| AI-02 | Configure `statement_timeout = 30s` on all PostgreSQL roles | Javier (DevOps) | P0 | Mar 18 | ✅ Done |
| AI-03 | Load test settlement export with 200K+ rows | VANTX SRE | P1 | Apr 4 | Open |
| AI-04 | Evaluate read replica for export queries (separate from payment writes) | VANTX SRE | P2 | Apr 15 | Open |
| AI-05 | Write runbook for "settlement degradation" scenario | VANTX SRE | P1 | Mar 25 | ✅ Done |

\

> **This is a blameless post-mortem.** The goal is to understand what happened and prevent recurrence, not to assign blame. Systems fail — we fix the systems.
>
> hello@vantx.io · vantx.io
