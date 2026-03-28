---
title: "Incident Post-Mortem"
subtitle: "{{CLIENT_NAME}} — {{INCIDENT_ID}}"
version: "1.0"
date: "{{DATE}}"
---

![](assets/logo.png){ width=30% }

\

# INCIDENT POST-MORTEM

**{{INCIDENT_ID}}: {{INCIDENT_TITLE}}**

{{CLIENT_NAME}} · {{DATE}}

VANTX · hello@vantx.io

\newpage

# Incident Summary

| Field | Detail |
|---|---|
| Incident ID | {{INCIDENT_ID}} |
| Severity | {{SEVERITY}} |
| Date | {{DATE}} |
| Duration | {{DURATION}} |
| Time to Detect (MTTD) | {{MTTD}} |
| Time to Resolve (MTTR) | {{MTTR}} |
| Impacted services | {{SERVICES}} |
| Customer impact | {{CUSTOMER_IMPACT}} |
| Business impact | {{BUSINESS_IMPACT}} |
| Status page updated | {{YES_NO}} |

\newpage

# Timeline

| Time (UTC) | Event |
|---|---|
| {{TIME}} | {{EVENT}} |
| {{TIME}} | {{EVENT}} |
| {{TIME}} | {{EVENT}} |
| {{TIME}} | {{EVENT}} |
| {{TIME}} | {{EVENT}} |
| {{TIME}} | {{EVENT}} |
| {{TIME}} | {{EVENT}} |

\newpage

# Root Cause Analysis

### What happened

{{ROOT_CAUSE_DESCRIPTION}}

### Contributing factors

1. {{CONTRIBUTING_FACTOR_1}}
2. {{CONTRIBUTING_FACTOR_2}}
3. {{CONTRIBUTING_FACTOR_3}}

### Why wasn't it caught earlier?

{{DETECTION_GAP_ANALYSIS}}

\newpage

# Impact

### User impact

{{USER_IMPACT_DESCRIPTION}}

### Revenue impact

{{REVENUE_IMPACT_DESCRIPTION}}

### Data integrity

{{DATA_INTEGRITY_ASSESSMENT}}

\newpage

# What Went Well

- {{POSITIVE_1}}
- {{POSITIVE_2}}
- {{POSITIVE_3}}

# What Went Wrong

- {{NEGATIVE_1}}
- {{NEGATIVE_2}}
- {{NEGATIVE_3}}

# Where We Got Lucky

- {{LUCKY_1}}
- {{LUCKY_2}}

\newpage

# Action Items

| ID | Action | Owner | Priority | Due Date | Status |
|---|---|---|---|---|---|
| AI-01 | {{ACTION}} | {{OWNER}} | {{PRIORITY}} | {{DUE}} | {{STATUS}} |
| AI-02 | {{ACTION}} | {{OWNER}} | {{PRIORITY}} | {{DUE}} | {{STATUS}} |
| AI-03 | {{ACTION}} | {{OWNER}} | {{PRIORITY}} | {{DUE}} | {{STATUS}} |
| AI-04 | {{ACTION}} | {{OWNER}} | {{PRIORITY}} | {{DUE}} | {{STATUS}} |
| AI-05 | {{ACTION}} | {{OWNER}} | {{PRIORITY}} | {{DUE}} | {{STATUS}} |

\

> **This is a blameless post-mortem.** The goal is to understand what happened and prevent recurrence, not to assign blame. Systems fail — we fix the systems.
>
> hello@vantx.io · vantx.io
