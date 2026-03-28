---
title: "Web Performance Audit"
subtitle: "{{CLIENT_NAME}} — Audit Report"
version: "1.0"
date: "{{MONTH}} {{YEAR}}"
---

![](assets/logo.png){ width=30% }

\

# WEB PERFORMANCE AUDIT

**{{CLIENT_NAME}} — {{SITE_URL}}**

{{MONTH}} {{YEAR}} · VANTX · hello@vantx.io

\newpage

# Executive Summary

{{EXECUTIVE_SUMMARY}}

### Overall Scores

| Page | Performance | Accessibility | Best Practices | SEO | Status |
|---|---|---|---|---|---|
| {{PAGE}} | {{PERF}}/100 | {{A11Y}}/100 | {{BP}}/100 | {{SEO}}/100 | {{STATUS}} |
| {{PAGE}} | {{PERF}}/100 | {{A11Y}}/100 | {{BP}}/100 | {{SEO}}/100 | {{STATUS}} |
| {{PAGE}} | {{PERF}}/100 | {{A11Y}}/100 | {{BP}}/100 | {{SEO}}/100 | {{STATUS}} |
| {{PAGE}} | {{PERF}}/100 | {{A11Y}}/100 | {{BP}}/100 | {{SEO}}/100 | {{STATUS}} |

\newpage

# 1. Core Web Vitals

### Lab Data (Lighthouse)

| Page | LCP | INP | CLS | FCP | TTFB | SI |
|---|---|---|---|---|---|---|
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{FCP}} | {{TTFB}} | {{SI}} |
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{FCP}} | {{TTFB}} | {{SI}} |
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{FCP}} | {{TTFB}} | {{SI}} |

### Field Data (CrUX / RUM)

| Page | LCP (p75) | INP (p75) | CLS (p75) | Status |
|---|---|---|---|---|
| {{PAGE}} | {{LCP}} | {{INP}} | {{CLS}} | {{STATUS}} |

### Targets

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | ≤2.5s | 2.5–4.0s | >4.0s |
| INP | ≤200ms | 200–500ms | >500ms |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 |

\newpage

# 2. Resource Analysis

### Page Weight

| Page | Total | HTML | CSS | JS | Images | Fonts | Other |
|---|---|---|---|---|---|---|---|
| {{PAGE}} | {{TOTAL}} | {{HTML}} | {{CSS}} | {{JS}} | {{IMAGES}} | {{FONTS}} | {{OTHER}} |
| {{PAGE}} | {{TOTAL}} | {{HTML}} | {{CSS}} | {{JS}} | {{IMAGES}} | {{FONTS}} | {{OTHER}} |

### JavaScript Analysis

| Bundle | Size | Parsed | Coverage | Notes |
|---|---|---|---|---|
| {{BUNDLE}} | {{SIZE}} | {{PARSED}} | {{COVERAGE}} | {{NOTES}} |
| {{BUNDLE}} | {{SIZE}} | {{PARSED}} | {{COVERAGE}} | {{NOTES}} |

### Image Analysis

| Image | Format | Size | Optimal Format | Savings |
|---|---|---|---|---|
| {{IMAGE}} | {{FORMAT}} | {{SIZE}} | {{OPTIMAL}} | {{SAVINGS}} |

### Third-Party Impact

| Script | Size | Block Time | Purpose | Recommendation |
|---|---|---|---|---|
| {{SCRIPT}} | {{SIZE}} | {{BLOCK}} | {{PURPOSE}} | {{RECOMMENDATION}} |

\newpage

# 3. Loading Sequence

### Critical Rendering Path

| Resource | Type | Size | Priority | Timing | Issue |
|---|---|---|---|---|---|
| {{RESOURCE}} | {{TYPE}} | {{SIZE}} | {{PRIORITY}} | {{TIMING}} | {{ISSUE}} |

### Render-Blocking Resources

| Resource | Type | Size | Fix |
|---|---|---|---|
| {{RESOURCE}} | {{TYPE}} | {{SIZE}} | {{FIX}} |

\newpage

# 4. Findings & Recommendations

| ID | Severity | Category | Finding | Fix | Impact |
|---|---|---|---|---|---|
| WP-01 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-02 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-03 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-04 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-05 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-06 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-07 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |
| WP-08 | {{SEVERITY}} | {{CATEGORY}} | {{FINDING}} | {{FIX}} | {{IMPACT}} |

\newpage

# 5. Remediation Roadmap

### P0 — Immediate (estimated: +{{POINTS}} Lighthouse points)

{{P0_REMEDIATION}}

### P1 — This sprint

{{P1_REMEDIATION}}

### P2 — This quarter

{{P2_REMEDIATION}}

### Projected Improvement

| Page | Current Score | After P0 | After P1 | Target |
|---|---|---|---|---|
| {{PAGE}} | {{CURRENT}} | {{AFTER_P0}} | {{AFTER_P1}} | {{TARGET}} |

\

> **Next steps:** Implement P0 fixes → VANTX re-audits for free (included) → Validate improvement.
>
> hello@vantx.io · vantx.io
