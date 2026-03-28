---
title: "Web Performance Audit"
subtitle: "NovaPay SpA — Audit Report"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# WEB PERFORMANCE AUDIT

**NovaPay SpA — app.novapay.com**

March 2026 · VANTX · hello@vantx.io

\newpage

# Executive Summary

NovaPay's web application (app.novapay.com) was audited across 4 key pages. The checkout page — the most critical revenue path — scored 42/100 on Lighthouse with a 4.2s LCP, primarily caused by an unoptimized hero image (2.4 MB PNG) and 1.2 MB of render-blocking JavaScript. The dashboard loads 3 analytics libraries synchronously, adding 890ms to first paint. Quick wins on P0 items alone would improve checkout from 42 to ~72 Lighthouse points and bring LCP under 2.5s.

### Overall Scores

| Page | Performance | Accessibility | Best Practices | SEO | Status |
|---|---|---|---|---|---|
| Homepage | 68/100 | 82/100 | 85/100 | 90/100 | ⚠️ Needs work |
| Checkout | 42/100 | 75/100 | 80/100 | 78/100 | ❌ Poor |
| Dashboard | 55/100 | 78/100 | 85/100 | N/A | ⚠️ Needs work |
| API Docs | 89/100 | 92/100 | 95/100 | 95/100 | ✅ Good |

![Lighthouse Scores by Page](assets/charts/lighthouse-scores.svg)

\newpage

# 1. Core Web Vitals

### Lab Data (Lighthouse)

| Page | LCP | INP | CLS | FCP | TTFB | SI |
|---|---|---|---|---|---|---|
| Homepage | 2.1s | 85ms | 0.05 | 1.2s | 180ms | 2.4s |
| Checkout | 4.2s | 120ms | 0.12 | 1.8s | 190ms | 4.8s |
| Dashboard | 3.1s | 95ms | 0.08 | 1.5s | 210ms | 3.5s |
| API Docs | 1.4s | 45ms | 0.02 | 0.8s | 120ms | 1.5s |

### Field Data (CrUX / RUM — Faro)

| Page | LCP (p75) | INP (p75) | CLS (p75) | Status |
|---|---|---|---|---|
| Homepage | 2.4s | 92ms | 0.06 | ⚠️ Needs improvement |
| Checkout | 4.8s | 145ms | 0.15 | ❌ Poor |
| Dashboard | 3.4s | 105ms | 0.09 | ⚠️ Needs improvement |

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
| Homepage | 3.2 MB | 18 KB | 95 KB | 1.1 MB | 1.8 MB | 120 KB | 62 KB |
| Checkout | 4.8 MB | 22 KB | 110 KB | 1.2 MB | 3.3 MB | 120 KB | 48 KB |
| Dashboard | 3.8 MB | 15 KB | 88 KB | 2.4 MB | 1.1 MB | 120 KB | 72 KB |
| API Docs | 980 KB | 45 KB | 32 KB | 420 KB | 360 KB | 120 KB | 3 KB |

![Page Weight Breakdown](assets/charts/page-weight.svg)

### JavaScript Analysis

| Bundle | Size | Parsed | Coverage | Notes |
|---|---|---|---|---|
| `main.js` | 680 KB | 240ms | 38% used | 62% dead code — tree-shaking not configured |
| `vendor.js` | 420 KB | 180ms | 52% used | Includes full lodash, moment.js (both replaceable) |
| `analytics.js` (Segment) | 210 KB | 95ms | 100% | Render-blocking — should be deferred |
| `hotjar.js` | 180 KB | 80ms | 100% | Render-blocking — should be async |
| `intercom.js` | 310 KB | 120ms | 100% | Loaded on all pages — only needed on dashboard |

### Image Analysis

| Image | Format | Size | Optimal Format | Savings |
|---|---|---|---|---|
| checkout-hero.png | PNG | 2.4 MB | WebP | -85% (→ 360 KB) |
| homepage-hero.jpg | JPEG | 1.2 MB | WebP + responsive | -70% (→ 360 KB) |
| trust-badges.png | PNG | 450 KB | SVG | -95% (→ 22 KB) |
| merchant-logos.png | PNG sprite | 680 KB | Individual SVGs | -90% (→ 68 KB) |

### Third-Party Impact

| Script | Size | Block Time | Purpose | Recommendation |
|---|---|---|---|---|
| Segment Analytics | 210 KB | 95ms | Analytics | Defer load, use `analytics.load()` after FCP |
| Hotjar | 180 KB | 80ms | Heatmaps | Async, load only on marketing pages |
| Intercom | 310 KB | 120ms | Chat widget | Lazy-load on dashboard only, remove from checkout |
| Stripe.js | 45 KB | 15ms | Payments | Keep — required for checkout, already optimized |

\newpage

# 3. Loading Sequence

### Critical Rendering Path

| Resource | Type | Size | Priority | Timing | Issue |
|---|---|---|---|---|---|
| `index.html` | Document | 22 KB | Highest | 0-190ms | OK |
| `main.css` | Stylesheet | 110 KB | Highest | 190-310ms | OK — critical CSS needed |
| `vendor.js` | Script | 420 KB | High | 190-480ms | **Render-blocking** |
| `main.js` | Script | 680 KB | High | 190-620ms | **Render-blocking** |
| `analytics.js` | Script | 210 KB | High | 190-520ms | **Render-blocking — should be deferred** |
| `checkout-hero.png` | Image | 2.4 MB | Low | 620-2800ms | **LCP element — delayed by JS** |
| Fonts (DM Sans) | Font | 120 KB | High | 310-450ms | OK — preloaded |

### Render-Blocking Resources

| Resource | Type | Size | Fix |
|---|---|---|---|
| `vendor.js` | Script | 420 KB | Add `defer` attribute, move to bottom of `<body>` |
| `main.js` | Script | 680 KB | Add `defer`, implement code-splitting (route-based) |
| `analytics.js` | Script | 210 KB | Add `defer` + load asynchronously after FCP |
| `hotjar.js` | Script | 180 KB | Add `async`, conditionally load |

\newpage

# 4. Findings & Recommendations

| ID | Severity | Category | Finding | Fix | Impact |
|---|---|---|---|---|---|
| WP-01 | P0 | Images | Checkout hero is 2.4 MB PNG | Convert to WebP, add srcset for responsive sizes | LCP -1.5s, page weight -2 MB |
| WP-02 | P0 | JavaScript | 1.2 MB of render-blocking JS on checkout | Add `defer` to all non-critical scripts | FCP -400ms, LCP -800ms |
| WP-03 | P0 | Third-party | Analytics + Hotjar block rendering on all pages | Defer analytics, async Hotjar, conditionally load Intercom | FCP -300ms |
| WP-04 | P1 | JavaScript | 62% dead code in main.js (tree-shaking disabled) | Enable tree-shaking, replace lodash with lodash-es, drop moment.js for date-fns | JS size -350 KB |
| WP-05 | P1 | Images | All images served as PNG/JPEG — no modern formats | Implement `<picture>` with WebP/AVIF + fallback | Total image savings -75% |
| WP-06 | P1 | CLS | Checkout images have no explicit dimensions | Add width/height to all `<img>` tags, use aspect-ratio CSS | CLS from 0.12 to <0.05 |
| WP-07 | P2 | Caching | Static assets served with 1-hour cache | Set `Cache-Control: public, max-age=31536000, immutable` for hashed assets | Repeat visits -60% faster |
| WP-08 | P2 | Fonts | Font loaded from Google Fonts (external) | Self-host fonts, add `font-display: swap`, preload critical variant | FOUT eliminated, -50ms TTFB |

\newpage

# 5. Remediation Roadmap

### P0 — Immediate (estimated: +30 Lighthouse points)

**WP-01:** Convert checkout-hero.png to WebP. Generate responsive sizes (480w, 768w, 1200w). Use `<picture>` element with WebP + JPEG fallback. Expected: LCP from 4.2s to ~2.7s.

**WP-02:** Add `defer` attribute to `vendor.js` and `main.js`. Move `<script>` tags to end of `<body>`. Implement route-based code splitting for `/checkout` vs `/dashboard`. Expected: FCP from 1.8s to ~1.1s.

**WP-03:** Replace synchronous Segment load with `analytics.load()` called after `DOMContentLoaded`. Add `async` to Hotjar. Remove Intercom from checkout page entirely. Expected: -300ms FCP across all pages.

### P1 — This sprint

**WP-04:** Enable tree-shaking in Webpack config. Replace `lodash` with `lodash-es` (enables per-function imports). Replace `moment.js` with `date-fns`. Run `webpack-bundle-analyzer` to find remaining dead code.

**WP-05:** Set up image pipeline: source → WebP + AVIF + original. Use `<picture>` for all above-fold images. Lazy-load below-fold images with `loading="lazy"`.

**WP-06:** Audit all `<img>` tags. Add explicit `width` and `height`. Add `aspect-ratio` CSS for responsive images.

### P2 — This quarter

**WP-07:** Update CDN config for immutable asset caching. **WP-08:** Self-host fonts with `font-display: swap`.

### Projected Improvement

| Page | Current Score | After P0 | After P1 | Target |
|---|---|---|---|---|
| Homepage | 68/100 | 82/100 | 90/100 | 90+ |
| Checkout | 42/100 | 72/100 | 85/100 | 85+ |
| Dashboard | 55/100 | 70/100 | 82/100 | 80+ |
| API Docs | 89/100 | 89/100 | 92/100 | 90+ |

\

> **Next steps:** Implement P0 fixes → VANTX re-audits for free (included) → Validate improvement with before/after Lighthouse comparison.
>
> hello@vantx.io · vantx.io
