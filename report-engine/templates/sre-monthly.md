---
title: "Fractional SRE — Monthly Report"
subtitle: "{{CLIENT_NAME}} — {{MONTH}} {{YEAR}}"
version: "1.0"
date: "{{MONTH}} {{YEAR}}"
---

![](assets/logo.png){ width=30% }

\

# FRACTIONAL SRE — MONTHLY REPORT

**{{CLIENT_NAME}}** · {{MONTH}} {{YEAR}}

VANTX · hello@vantx.io

\newpage

# Executive Summary

{{EXECUTIVE_SUMMARY}}

### Engagement Health

| Indicator | Value | Notes |
|---|---|---|
| Month | {{MONTH_NUMBER}} of engagement | — |
| Requests completed | {{COMPLETED}} | via board |
| Avg turnaround | {{TURNAROUND}} | target: 48h |
| SRE maturity score | {{SCORE}}/5 | vs {{PREV_SCORE}}/5 last month |
| Active incidents | {{ACTIVE}} | — |

\newpage

# 1. Reliability Status

### SLO Dashboard

| Service | SLI | Target | Actual | Budget | Status |
|---|---|---|---|---|---|
| {{SERVICE}} | {{SLI}} | {{TARGET}} | {{ACTUAL}} | {{BUDGET}} | {{STATUS}} |
| {{SERVICE}} | {{SLI}} | {{TARGET}} | {{ACTUAL}} | {{BUDGET}} | {{STATUS}} |

### Incident Summary

| Date | Severity | Title | MTTD | MTTR | Status |
|---|---|---|---|---|---|
| {{DATE}} | {{SEVERITY}} | {{TITLE}} | {{MTTD}} | {{MTTR}} | {{STATUS}} |

### On-Call Health

| Metric | Value | Target |
|---|---|---|
| Pages received | {{PAGES}} | — |
| Actionable % | {{ACTIONABLE}}% | >90% |
| Avg acknowledge time | {{ACK_TIME}} | <5 min |
| Escalations | {{ESCALATIONS}} | — |

\newpage

# 2. Work Completed

### Board Requests

| Request | Type | Status | Turnaround |
|---|---|---|---|
| {{REQUEST}} | {{TYPE}} | {{STATUS}} | {{TIME}} |
| {{REQUEST}} | {{TYPE}} | {{STATUS}} | {{TIME}} |
| {{REQUEST}} | {{TYPE}} | {{STATUS}} | {{TIME}} |

### Initiatives & Projects

| Initiative | Progress | Notes |
|---|---|---|
| {{INITIATIVE}} | {{PROGRESS}} | {{NOTES}} |
| {{INITIATIVE}} | {{PROGRESS}} | {{NOTES}} |

\newpage

# 3. Post-Mortems

### Completed This Month

| Incident | Date | Root Cause | Action Items | Status |
|---|---|---|---|---|
| {{INCIDENT}} | {{DATE}} | {{ROOT_CAUSE}} | {{ACTIONS}} | {{STATUS}} |

### Open Action Items (all post-mortems)

| Action | Origin | Owner | Due | Status |
|---|---|---|---|---|
| {{ACTION}} | {{INCIDENT}} | {{OWNER}} | {{DUE}} | {{STATUS}} |

\newpage

# 4. Capacity & Architecture

### Capacity Status

| Resource | Current Usage | Limit | Headroom | Risk |
|---|---|---|---|---|
| {{RESOURCE}} | {{USAGE}} | {{LIMIT}} | {{HEADROOM}} | {{RISK}} |

### Architecture Decisions

| ADR | Decision | Rationale | Status |
|---|---|---|---|
| {{ADR}} | {{DECISION}} | {{RATIONALE}} | {{STATUS}} |

\newpage

# 5. Team Development

### Knowledge Transfer

| Topic | Format | Attendees | Date |
|---|---|---|---|
| {{TOPIC}} | {{FORMAT}} | {{ATTENDEES}} | {{DATE}} |

### Maturity Progress

| Dimension | Start | Last Month | This Month | Target |
|---|---|---|---|---|
| SLOs & error budgets | {{START}} | {{PREV}} | {{CURRENT}} | {{TARGET}} |
| Incident response | {{START}} | {{PREV}} | {{CURRENT}} | {{TARGET}} |
| Runbooks & docs | {{START}} | {{PREV}} | {{CURRENT}} | {{TARGET}} |
| On-call | {{START}} | {{PREV}} | {{CURRENT}} | {{TARGET}} |
| Chaos engineering | {{START}} | {{PREV}} | {{CURRENT}} | {{TARGET}} |
| Load testing | {{START}} | {{PREV}} | {{CURRENT}} | {{TARGET}} |

# 6. Next Month Plan

| Priority | Item | Expected Outcome |
|---|---|---|
| {{PRIORITY}} | {{ITEM}} | {{OUTCOME}} |
| {{PRIORITY}} | {{ITEM}} | {{OUTCOME}} |

\

> hello@vantx.io · vantx.io
