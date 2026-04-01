---
title: "Performance Checkup Report"
subtitle: "{{CLIENT_NAME}} — {{ENGAGEMENT_TYPE}}"
version: "1.0"
date: "{{MONTH}} {{YEAR}}"
---

![](assets/logo.png){ width=30% }

\

# PERFORMANCE CHECKUP

**{{CLIENT_NAME}} — {{PLATFORM_DESCRIPTION}}**

{{MONTH}} {{YEAR}} · VANTX · hello@vantx.io

\newpage

# Executive Summary

{{CLIENT_NAME}}'s {{PLATFORM_DESCRIPTION}} was evaluated over {{DURATION}} business days. The evaluation included architecture review, load testing (baseline + stress + spike), web performance audit (Core Web Vitals + Lighthouse), and monitoring assessment.

**Current capacity:** {{CURRENT_TPS}} TPS before degradation.
**Breakpoint:** {{BREAKPOINT_TPS}} TPS — latency exceeds {{LATENCY_THRESHOLD}}, error rate >{{ERROR_THRESHOLD}}.
**Target capacity:** {{TARGET_TPS}} TPS to support {{GROWTH_CONTEXT}}.

### Key Findings

| ID | Severity | Finding | Impact |
|---|---|---|---|
| F-01 | {{SEVERITY}} | {{FINDING_DESCRIPTION}} | {{IMPACT_DESCRIPTION}} |
| F-02 | {{SEVERITY}} | {{FINDING_DESCRIPTION}} | {{IMPACT_DESCRIPTION}} |
| F-03 | {{SEVERITY}} | {{FINDING_DESCRIPTION}} | {{IMPACT_DESCRIPTION}} |
| F-04 | {{SEVERITY}} | {{FINDING_DESCRIPTION}} | {{IMPACT_DESCRIPTION}} |
| F-05 | {{SEVERITY}} | {{FINDING_DESCRIPTION}} | {{IMPACT_DESCRIPTION}} |
| F-06 | {{SEVERITY}} | {{FINDING_DESCRIPTION}} | {{IMPACT_DESCRIPTION}} |

\newpage

# Load Test Results

### Baseline Scenario (normal traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | {{VU}} | — | — |
| Avg TPS | {{TPS}} | ≥{{THRESHOLD}} | {{STATUS}} |
| p50 latency | {{P50}} | <{{THRESHOLD}} | {{STATUS}} |
| p95 latency | {{P95}} | <{{THRESHOLD}} | {{STATUS}} |
| p99 latency | {{P99}} | <{{THRESHOLD}} | {{STATUS}} |
| Error rate | {{ERROR_RATE}} | <{{THRESHOLD}} | {{STATUS}} |

### Stress Scenario ({{STRESS_MULTIPLIER}}x traffic)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | {{VU}} | — | — |
| Max TPS | {{TPS}} | ≥{{THRESHOLD}} | {{STATUS}} |
| p50 latency | {{P50}} | <{{THRESHOLD}} | {{STATUS}} |
| p95 latency | {{P95}} | <{{THRESHOLD}} | {{STATUS}} |
| p99 latency | {{P99}} | <{{THRESHOLD}} | {{STATUS}} |
| Error rate | {{ERROR_RATE}} | <{{THRESHOLD}} | {{STATUS}} |

### Spike Scenario ({{SPIKE_MULTIPLIER}}x traffic burst)

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Virtual Users | {{VU}} (ramp {{RAMP_TIME}}) | — | — |
| Max TPS | {{TPS}} | ≥{{THRESHOLD}} | {{STATUS}} |
| p95 latency | {{P95}} | <{{THRESHOLD}} | {{STATUS}} |
| Error rate | {{ERROR_RATE}} | <{{THRESHOLD}} | {{STATUS}} |
| Recovery time | {{RECOVERY}} | <{{THRESHOLD}} | {{STATUS}} |

> **Breakpoint identified at {{BREAKPOINT_TPS}} TPS.** {{BREAKPOINT_EXPLANATION}}

# Web Performance

| Page | LCP | FID | CLS | Lighthouse | Status |
|---|---|---|---|---|---|
| {{PAGE}} | {{LCP}} | {{FID}} | {{CLS}} | {{SCORE}}/100 | {{STATUS}} |
| {{PAGE}} | {{LCP}} | {{FID}} | {{CLS}} | {{SCORE}}/100 | {{STATUS}} |
| {{PAGE}} | {{LCP}} | {{FID}} | {{CLS}} | {{SCORE}}/100 | {{STATUS}} |

\newpage

# Remediation Roadmap

### P0 — Fix this week (estimated impact: {{ESTIMATED_IMPACT}})

**F-01: {{FIX_TITLE}}**
```{{LANGUAGE}}
{{CODE_SNIPPET}}
```
{{FIX_EXPLANATION}}

**F-02: {{FIX_TITLE}}**
```{{LANGUAGE}}
{{CODE_SNIPPET}}
```
{{FIX_EXPLANATION}}

### P1 — Fix this sprint

**F-03:** {{FIX_DESCRIPTION}}

**F-04:** {{FIX_DESCRIPTION}}

### P2 — Fix this quarter

**F-05:** {{FIX_DESCRIPTION}} **F-06:** {{FIX_DESCRIPTION}}

\

> **Next steps:** Implement P0 fixes → VANTX re-tests for free (included) → Validate improvement with data. Estimated result: {{CURRENT_TPS}} → {{PROJECTED_TPS}} TPS.
>
> Interested in continuous monitoring? Our Performance subscription ($5,995/mo) includes 24/7 synthetic monitoring, monthly load tests, and weekly reports.
>
> hello@vantx.io · vantx.io
