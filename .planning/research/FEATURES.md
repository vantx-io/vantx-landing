# Feature Research

**Domain:** B2B technical consulting landing page — SRE/performance consulting (SaaS mid-market ICP)
**Researched:** 2026-03-20
**Confidence:** HIGH (multiple sources corroborated; existing page content reviewed)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the ICP (CTOs, engineering managers) assume exist. Missing any of these = page feels broken or amateur.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero with outcome-first headline | Visitors give <5 seconds; headline must answer "what's in it for me" before scroll | LOW | Headline under 44 chars, outcome not feature. Existing page has strong copy: "Tu equipo no necesita más herramientas. Necesita que funcionen." |
| Single primary CTA above the fold | Pages with one CTA convert at 13.5% vs 10.5% for multi-CTA pages | LOW | CTA must be Calendly link or inline embed — "Agendar Checkup" is already validated copy |
| Service/offering explanation | B2B buyers need to understand what they're buying before committing | MEDIUM | Three-service grid (PaaS, OaaS, Fractional) already exists; needs clear outcome framing per service |
| Transparent pricing (at minimum ranges) | 96% of high-converting pages show pricing; opaque pricing sends B2B buyers to competitors | LOW | Existing pages show real pricing ($2,800/mo LATAM etc.) — keep and display prominently |
| Social proof — client logos | Company-name recognition reduces perceived risk immediately; B2B buyers expect proof | LOW | LATAM Airlines, British Airways, Mercado Libre, Falabella, BCP Peru already exist in content |
| "How it works" / process section | Technical buyers need to know the engagement model before committing | LOW | 4-step process already exists; critical for async-first consulting model |
| Mobile-responsive layout | Many B2B researchers browse on phones even for high-value purchases | MEDIUM | Existing pages have basic responsive breakpoints but need audit |
| Fast page load (<3 seconds) | 1-second delay = 7% conversion drop; technical ICP will notice slow pages | LOW | Static HTML/CSS/JS should be fast; no heavy frameworks |
| Navigation with service links | Visitors should find service detail pages without friction | LOW | Navbar needed across all pages with EN/ES toggle |
| Footer with contact info and legal | Expected on any professional B2B site | LOW | Already exists minimally; needs email + location |

### Differentiators (Competitive Advantage)

Features that set Vantix apart from generic consultancies. These reinforce the "enterprise expertise, startup price" positioning.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bilingual EN/ES auto-detect with toggle | 76% of B2B buyers prefer native-language content; LATAM market differentiation vs US-only competitors | MEDIUM | `navigator.language` auto-detect + visible toggle in navbar. Must be JS-only (no server, no separate URLs). All copy must exist in both languages |
| Calendly inline embed (not just link) | Inline calendar eliminates click-away friction that kills conversions; direct booking without intermediaries | LOW | Inline embed in final CTA section or as modal. Calendly inline widget loads in same page — no redirect. Key to core value: "convert visitors to demos" |
| Problem-first narrative section | Most consultancies lead with "we offer X" — problem-first resonates with ICP who already feel the pain | LOW | 6 pain cards already validated: alert fatigue, useless dashboards, uncontrolled telemetry costs, no load testing, reliability ownership gap, ignored web performance |
| Positioning vs FTE hire (not vs tools) | "Alternative to $150K+ SRE hire" is a clear, comparative value frame that quantifies savings | LOW | Already present in content; needs prominent placement near pricing |
| Concrete metrics in social proof | Generic "great to work with" testimonials vs "enterprise clients in finance and aviation" with named logos | LOW | Named client logos + stats (15+ years, 100% async, open-source k6 framework) already exist |
| Add-on / one-shot services section | Reduces commitment barrier — prospects who won't commit to retainer can start with $2K audit | LOW | Sprint, Web Perf Audit, Training offerings already exist; create entry ramp to retainer |
| Service detail pages (not just anchor links) | Technical buyers research deeply; detail pages satisfy evaluation-mode visitors without cluttering main page | MEDIUM | Three HTML files already exist (PaaS, OaaS, Fractional); need consistent navigation and cross-linking |
| Dark & techy visual design | Signals "built by engineers for engineers" without stating it; Linear/Vercel aesthetic builds implicit trust with technical ICP | MEDIUM | Dark blue (#1B2A4A) palette + JetBrains Mono for code/numbers already established — extend consistently |
| "100% async" positioned as feature | Engineering managers who are burned out on Zoom-heavy vendors value zero-meeting overhead explicitly | LOW | Already in stats section; elevate to hero subtext or services |
| Open-source k6 framework as trust signal | Public work creates technical credibility that copy alone cannot; verifiable by ICP | LOW | Mentioned in stats; could link to GitHub repo for validation |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Custom contact form (instead of Calendly) | "More control", "capture leads before demo" | Adds backend requirement (violates static constraint), introduces delivery/spam risk, adds friction vs direct booking, requires form validation logic | Keep Calendly inline embed as primary. If email capture needed, use a minimal 1-field email-only pre-Calendly gate (low friction, no backend needed with a third-party like Formspree) |
| Blog / thought leadership section | "Content marketing drives SEO" | Explicitly out of scope for v1; requires ongoing content production, CMS, or at minimum file management; adds maintenance burden that slows launch | Defer to v2; placeholder "Resources coming soon" is acceptable but not required |
| Chat widget (Intercom, Drift, etc.) | "Real-time engagement" | Not async-first; contradicts brand positioning of "0 meetings / 100% async"; adds JS payload; creates expectation of live support | Calendly + visible email achieves same goal without expectation mismatch |
| Animations / scroll-triggered effects | "Makes the page feel premium" | Can hurt performance (LCP, CLS); technical ICP is not the target for wow-factor animations; creates maintenance complexity | Subtle CSS transitions on hover (already in existing code) + monospace font aesthetic achieves "technical premium" feel without animation overhead |
| Cookie consent / GDPR banner | "Legal compliance" | For a static page with only Calendly (no own analytics cookies), GDPR banner is often unnecessary; adds UX friction | If adding GA4 or similar: use privacy-respecting analytics (Plausible, Fathom) that don't require consent banners in most jurisdictions |
| Separate language URL routes (/es/, /en/) | "Better SEO" | Requires either a server or a build system; contradicts static HTML constraint; doubles maintenance burden | Single HTML file per page with JS-toggled content blocks achieves bilingual without routing complexity. SEO impact is minimal at v1 scale |
| Pricing calculator / ROI tool | "Helps sell the value" | High complexity for v1; requires JS state management; can confuse instead of clarify at early funnel stage | The "$150K+ FTE vs $4K/mo retainer" comparison is a mental calculator already — state it explicitly in copy near pricing |
| Video autoplay in hero | "Higher engagement" | Autoplay is universally disliked by users, penalized by browsers, and hurts LCP; creates accessibility issues | Static hero image or subtle CSS background if any visual; save video for a Loom link inside the CTA section ("Ver 3-min overview") |

---

## Feature Dependencies

```
[Bilingual EN/ES toggle]
    └──requires──> [All copy available in both languages]
                       └──requires──> [Hero copy EN+ES]
                       └──requires──> [Services copy EN+ES]
                       └──requires──> [Pricing copy EN+ES]
                       └──requires──> [CTA copy EN+ES]

[Calendly inline embed]
    └──requires──> [Active Calendly account with scheduling link]

[Service detail pages]
    └──requires──> [Navigation component shared across pages]
    └──requires──> [Consistent dark theme CSS shared across pages]

[Social proof — client logos]
    └──enhances──> [Pricing section] (logos near pricing reduce purchase anxiety)
    └──enhances──> [Final CTA section] (logos near CTA reduce action anxiety)

[Problem-first narrative]
    └──sets up──> [Services section] (problem → solution narrative arc)

[Add-on services section]
    └──enhances──> [Pricing/services section] (lowers entry commitment)

[Mobile responsive layout]
    └──requires──> [CSS media queries on all grid layouts]
    └──conflicts-if-ignored──> [Calendly inline embed] (Calendly widget needs mobile sizing)
```

### Dependency Notes

- **Bilingual requires full copy in both languages:** Cannot ship language toggle with partial content — unfinished translations look broken. Either ship EN-only (simpler) or ship both complete.
- **Calendly inline requires active account:** If no Calendly account is active at build time, use pop-up text link as fallback — both work from static HTML.
- **Service detail pages require shared CSS:** Without a shared stylesheet or copied consistent styles, detail pages will drift visually from main page. This is the most common maintenance pitfall for multi-page static sites.
- **Social proof enhances CTA:** Best practice is to place logos/stats immediately before or adjacent to the booking CTA — reduces the final moment of hesitation.

---

## MVP Definition

### Launch With (v1)

Minimum viable product to validate demo booking conversions.

- [ ] Hero section — outcome-first headline, subtitle, single CTA to Calendly — **core value delivery**
- [ ] Problem/pain section — 6 pain cards (existing copy) — **qualification filter, confirms ICP recognition**
- [ ] Services section (3 cards) — name, description, bullet deliverables, price — **table stakes for B2B evaluation**
- [ ] How it works — 4-step process — **reduces friction for async model skeptics**
- [ ] Social proof — client logos + 4 stats — **trust before commitment**
- [ ] Pricing (transparent, shown inline) — LATAM and US pricing visible — **eliminates discovery call just to learn price**
- [ ] Final CTA section — Calendly inline embed or prominent link — **the conversion moment**
- [ ] Bilingual EN/ES with auto-detect + toggle — **LATAM market access, differentiator**
- [ ] Mobile-responsive layout — **non-negotiable for any 2026 page**
- [ ] Service detail pages (3) linked from nav — **deep-evaluation buyers need this before booking**

### Add After Validation (v1.x)

- [ ] Testimonial quotes (named, with title/company) — add when first 2-3 client testimonials are available
- [ ] Add-on services section — add when the one-shot entry ramp starts converting; already in existing HTML
- [ ] Open-source k6 GitHub link in social proof — add when repo is public/polished

### Future Consideration (v2+)

- [ ] Blog / resources section — defer until content production workflow exists
- [ ] Case studies with metrics — defer until engagements complete and clients approve
- [ ] SEO optimization (meta tags, structured data) — meaningful after domain and content are stable
- [ ] Analytics dashboard (Plausible or similar) — after v1 ships, need data to optimize

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Calendly inline embed | HIGH | LOW | P1 |
| Hero — outcome-first headline + CTA | HIGH | LOW | P1 |
| Bilingual EN/ES auto-detect + toggle | HIGH | MEDIUM | P1 |
| Transparent pricing display | HIGH | LOW | P1 |
| Social proof — client logos + stats | HIGH | LOW | P1 |
| Service cards (3) with deliverables | HIGH | LOW | P1 |
| Problem/pain section | HIGH | LOW | P1 |
| How it works — 4-step process | MEDIUM | LOW | P1 |
| Mobile-responsive layout | HIGH | MEDIUM | P1 |
| Service detail pages (3) | HIGH | MEDIUM | P1 |
| Add-on services section | MEDIUM | LOW | P2 |
| Testimonial quotes (named) | HIGH | LOW | P2 |
| Open-source k6 GitHub link | MEDIUM | LOW | P2 |
| Blog / resources | LOW | HIGH | P3 |
| Case studies | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Generic IT Consultancy | Datadog/Grafana (tool vendors) | Vantix Approach |
|---------|----------------------|-------------------------------|-----------------|
| Pricing display | "Contact us for quote" — opaque | Freemium + public tiers | Show real pricing (LATAM/US split) — radical transparency |
| Target audience | CTO + CFO + procurement | Developers + DevOps | CTO/EM who already has tools but no one to run them |
| Engagement model | Projects / statements of work | Self-serve tool subscription | Managed capacity: retainer + async |
| Social proof | Case study PDFs gated behind form | G2/Capterra reviews | Named enterprise logos + specific years of experience |
| CTA | "Schedule a call" (generic) | "Start free trial" | "Agenda un Performance Checkup" (specific deliverable with outcome) |
| Language | English-only or inconsistent translation | English-primary | Native EN/ES with auto-detect |
| Technical credibility | Logos / certifications | Product itself | Open-source k6 framework + named enterprise clients |

---

## Sources

- [9 B2B Landing Page Lessons From 2025 to Drive More Conversions in 2026 — Instapage](https://instapage.com/blog/b2b-landing-page-best-practices)
- [We studied 100 devtool landing pages — Evil Martians (2025)](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025)
- [Landing Page Conversion Rates — 40 Statistics — Genesys Growth (2026)](https://genesysgrowth.com/blog/landing-page-conversion-stats-for-marketing-leaders)
- [Social Proof Impact on Conversions — Genesys Growth (2026)](https://genesysgrowth.com/blog/social-proof-conversion-stats-for-marketing-leaders)
- [25 High-Converting B2B SaaS Landing Pages — SaaS Hero](https://www.saashero.net/design/high-converting-landing-page-examples/)
- [18 B2B SaaS Landing Page Best Practices That Convert — SaaS Hero](https://www.saashero.net/design/saas-landing-page-best-practices/)
- [Calendly Embed Options Overview](https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview)
- [Calendly: Add scheduling to your website](https://calendly.com/blog/embed-scheduling-website)
- [Localization for B2B SaaS Landing Pages — OCNJ Daily (Feb 2026)](https://ocnjdaily.com/news/2026/feb/18/localization-for-b2b-saas-landing-pages-messaging-adaptation-that-improves-conversions/)
- [B2B SaaS Aesthetic Design: Boost Trust & Conversions — Influencers Time (2025)](https://www.influencers-time.com/b2b-saas-how-aesthetic-design-boosts-trust-and-conversions/)
- Existing Vantix landing page content reviewed: `06-landing-pages/vantix-landing-v3.html`, `06-landing-pages/vantix-performance-as-a-service.html`

---
*Feature research for: B2B technical consulting landing page (SRE / performance consulting, LATAM + US markets)*
*Researched: 2026-03-20*
