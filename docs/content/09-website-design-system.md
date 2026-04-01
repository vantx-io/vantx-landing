---
title: "Website & Design System"
subtitle: "Architecture, Pages, and Technical Reference"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# WEBSITE & DESIGN SYSTEM

**vantx.io — Architecture & Technical Reference**

Version 1.0 — March 2026 · Internal

\newpage

# 1. Site Architecture

The website lives in the `landing/` directory of the repository. Static HTML + CSS + JS, no build step, deployed via Cloudflare Pages.

### Page inventory

| Page | Path | Purpose |
|---|---|---|
| Landing / Home | `index.html` | Main conversion page — hero, pain points, services, comparison, FAQ, CTA |
| Performance as a Service | `services/performance.html` | Full detail page — features, deliverables, pricing, Stripe checkout |
| Observability as a Service | `services/observability.html` | Full detail page — features, deliverables, Calendly booking |
| Fractional SRE | `services/fractional-sre.html` | Full detail page — features, deliverables, Calendly booking |
| Fractional QA Tech Lead | `services/qa-tech-lead.html` | Full detail page — features, deliverables, Calendly booking |
| Mission & Values | `about/mission.html` | Mission, vision, purpose, 6 values, manifesto |
| Brand Style Guide | `brand/style-guide.html` | Visual reference for documents, presentations, branded materials |
| Welcome | `welcome.html` | Post-purchase onboarding |
| Privacy Policy | `legal/privacy.html` | GDPR/CCPA compliant |
| Terms of Service | `legal/terms.html` | Service terms |

### Supporting files

| File | Purpose |
|---|---|
| `llms.txt` | AI-readable company info (services, model, contact) |
| `sitemap.xml` | SEO sitemap for all pages |
| `robots.txt` | Crawl directives |
| `partials/nav.html` | Shared navigation bar |
| `partials/footer.html` | Shared footer |

\newpage

# 2. Design System

The visual system is documented in full at `brand/style-guide.html`. This is the source of truth for all brand materials.

### CSS Architecture

```
css/
├── fonts.css       ← @font-face declarations (self-hosted woff2)
├── tokens.css      ← Design tokens (colors, spacing, typography as CSS variables)
├── base.css        ← Reset, global styles, shared components (buttons, nav, footer)
├── landing.css     ← Landing page-specific styles
└── detail.css      ← Service detail + about page styles
```

### Color Palette

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `--color-primary` | `#1B6B4A` | `#259B6E` | CTAs, links, accents |
| `--color-primary-hover` | `#155A3E` | `#2EB07E` | Button hover |
| `--color-bg` | `#F8F7F4` | `#1A1917` | Page background |
| `--color-surface` | `#FDFCFA` | `#242320` | Cards, panels |
| `--color-text` | `#1A1A17` | `#EDECE7` | Headings, primary text |
| `--color-text-muted` | `#5C5C56` | `#A8A89F` | Body text, descriptions |

The palette is warm throughout. Never use cool grays, blue-grays, or pure black/white.

### Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Primary | DM Sans | 400, 500, 600, 700 | All text, headings, UI |
| Mono | JetBrains Mono | 400, 700 | Prices, metrics, code, badges |

Fonts are **self-hosted** in `fonts/` (woff2). No Google Fonts CDN dependency. Preloaded with `fetchpriority="high"`.

### Service Colors

Each service line has a dedicated accent for differentiation:

| Service | Light | Dark |
|---|---|---|
| Performance | `#2563EB` (blue) | `#60A5FA` |
| Observability | `#0D9488` (teal) | `#14B8A6` |
| Fractional SRE | `#D97706` (amber) | `#F59E0B` |
| QA Tech Lead | `#7C3AED` (purple) | `#A78BFA` |

### Spacing

4px base grid. All spacing uses multiples of 4: 4, 8, 12, 16, 24, 32, 48, 64, 96px.

### Dark Mode

Automatic via `prefers-color-scheme: dark`. All tokens adapt. Implemented at the CSS variable level — no JS theme toggle.

\newpage

# 3. Integrations

### Stripe (payments)

Two payment links are live:

- **Performance subscription:** `buy.stripe.com/test_00wfZi8Pu4th2AFcqpgEg00` ($5,995/mo)
- **Performance Checkup:** `buy.stripe.com/test_7sY14o3va5xl6QV765gEg01` ($2,995 one-time)

The "Start Today" CTA links directly to Stripe checkout. No intermediary form.

### Calendly (booking)

Popup modal integrated via `js/calendly.js`. Any element with `.js-calendly-trigger` opens the Calendly popup for `calendly.com/hello-vantx/15min`.

Used as CTA for services that require a call (Observability, SRE, QA).

### Google Analytics 4

Measurement ID: `G-VMTZXQG4HX`. Loaded on all pages. Custom event tracking via `js/analytics.js`.

### Cloudflare Geo-Detection

On the landing page, a script fetches `/cdn-cgi/trace` to detect the visitor's country. If they're in LATAM or Spain (AR, BO, BR, CL, CO, CR, CU, DO, EC, ES, SV, GT, HN, MX, NI, PA, PY, PE, PR, UY, VE), the LATAM discount banner is shown.

### SEO Structured Data

JSON-LD on all pages:

- **Landing:** `ProfessionalService` (org info + OfferCatalog) + `FAQPage` (5 items)
- **Service pages:** `Service` schema with pricing + service-specific `FAQPage`
- **Mission:** No structured data (informational page)

### i18n

Translations in `i18n/en.json` and `i18n/es.json`. Runtime swap via `js/i18n.js`. Translations cached in `sessionStorage`. Language detection: browser locale → manual toggle (nav flag button).

\newpage

# 4. Performance Optimizations

| Optimization | Impact |
|---|---|
| Self-hosted fonts (woff2) | Eliminates 2 cross-origin roundtrips to Google Fonts |
| Font preload with `fetchpriority="high"` | Reduces CLS and FOIT |
| Logo optimized (2.1 MB → 5 KB webp) | Eliminates LCP bottleneck |
| Scripts deferred (`defer` attribute) | Non-blocking DOM parse |
| Calendly CSS loaded lazily | Only loads when popup is triggered |
| i18n cached in sessionStorage | Avoids re-fetching translations on page navigation |
| No framework / JS bundle | Zero JS build step, minimal payload |

### Image assets

- Logo: `img/vantx-logo-horizontal-white.webp` (5 KB) + PNG fallbacks
- Favicons: `img/favicon.ico`, `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png`
- OG image: `img/og-image.png` (for social sharing)

\newpage

# 5. Content Sections (Landing Page)

The landing page follows a conversion-oriented structure:

1. **Hero** — Headline ("Your systems are slow. Your team doesn't know why. We do."), pill badge, primary CTA (Stripe) + secondary CTA (Calendly)
2. **Credibility bar** — One-line summary: "10+ years in performance engineering and SRE. 100% open-source stack."
3. **Pain points** — 4 cards: Alerts at 3 AM, Load tests that don't exist, No SRE/no budget, Every release is a guess
4. **Services** — Performance card (full, with Stripe CTA + Checkup upsell) + 3 "Also available" compact rows (Observability, SRE, QA)
5. **Comparison table** — Vantx vs. hiring full-time (cost, time, expertise, risk)
6. **FAQ** — 5 questions (subscription, contracts, speed, team, communication)
7. **CTA section** — Closing push with LATAM discount banner (geo-detected)

### Voice & Tone

Vantx sounds like a senior engineer who happens to be good at explaining things. Technical, direct, specific — never condescending. Key rules:

- Be specific: the SQL, the config, the exact change
- Use data: "p95 dropped from 1.2s to 340ms"
- Never use hourly language — flat monthly subscription model
- Never use corporate filler: "leverage", "synergy", "best-in-class"
- Every claim needs a number, an example, or a deliverable

Full voice guidelines in the Brand Style Guide (`brand/style-guide.html`).

\

> vantx.io · hello@vantx.io · 2026
