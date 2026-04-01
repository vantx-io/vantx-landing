# Vantx — ProductHunt Launch Plan

## What We're Launching

**Performance as a Service** — Managed performance engineering for tech teams. k6-based monitoring running 24/7, monthly load testing, web performance tracking, and prioritized findings delivered async.

**Tagline**: "Your performance team, without the headcount. k6 monitoring 24/7, monthly load tests, and a roadmap of exactly what to fix."

**One-liner**: We run performance monitoring and testing against your system 24/7 and tell you what's broken, what to fix, and in what order — 100% async.

## ProductHunt Strategy

### Product to Launch
Launch the **Performance Checkup** as the hero product — it's the lowest barrier to entry ($2,995), has a concrete deliverable, and converts to MRR.

**Do NOT launch the retainer** — PH audience wants to try before committing to monthly.

### PH-Specific Offer
- **PH exclusive: 30% off first Performance Checkup** ($2,095 instead of $2,995)
- Limited to first 10 companies that sign up from PH
- Includes everything: load test, web perf audit, bottleneck heat map, prioritized roadmap, PDF report + video Loom
- Time-limited: 48 hours post-launch

### Positioning for PH Audience
PH users are startup founders, CTOs, and engineers. They care about:
- Speed of getting value (5 days from sign-up to deliverable)
- No vendor lock-in (we use k6, Grafana, OpenTelemetry — all open-source)
- Async-first (no mandatory meetings, no sales calls, no demos required)
- Transparent pricing (pricing on the page, no "contact us" BS)

### Assets Already Built

The website is live at **vantx.io** with everything needed for the PH launch:

- **Landing page:** Hero + pain points + services + comparison + FAQ + CTA
- **Performance detail page:** Full feature list, pricing, Stripe checkout link (`vantx.io/services/performance.html`)
- **Demo deliverable:** NovaPay Performance Checkup report (EN + ES) in `docs/content/07-demo-checkup-novapay-*.md`
- **Brand Style Guide:** Visual reference for all marketing materials (`vantx.io/brand/style-guide.html`)
- **Stripe payment links:** Already live for Performance subscription + Checkup one-time
- **Calendly integration:** Popup booking built into all pages
- **LATAM geo-banner:** Auto-detected via Cloudflare for visitors from LATAM/Spain
- **Analytics:** GA4 (G-VMTZXQG4HX) tracking all pages + custom events
- **SEO:** Structured data (Organization + Services + FAQ), sitemap, robots.txt, OG tags
- **i18n:** Full EN + ES translations across all pages

### Content Still Needed

**Hero image (1270x760)**:
- Split screen: left = messy Grafana dashboard with red alerts; right = clean Vantx report with prioritized findings
- Headline overlay: "From chaos to clarity in 5 days"

**Gallery images (5 images)**:
1. Dashboard view — metric cards showing real data (uptime 99.97%, p95 195ms, etc.)
2. Load test results table — scenarios with TPS/latency/errors
3. Heat map of bottlenecks — severity coded, prioritized
4. Before/after metrics — delta showing improvement
5. Slack weekly report — what async delivery looks like

**Demo video (2-3 min)**:
- Problem: "Most teams don't know their real capacity until production breaks"
- Show: Real NovaPay checkup flow (anonymized) — the 5 steps, the deliverables
- Result: "320 TPS → 510 TPS with 2 fixes we identified in the checkup"
- CTA: "Get your checkup for 30% off — PH exclusive, 10 slots"

**Maker comment (first comment)**:
```
Hey PH! I'm José, and I've spent 15 years doing performance engineering for companies like LATAM Airlines, British Airways, and Mercado Libre.

Here's what I learned: most teams don't lack tools. They lack someone to actually run the testing and monitoring consistently, interpret the results, and tell them exactly what to fix.

That's what Vantx does. We monitor your system 24/7 with k6 and Grafana, run monthly load tests, and deliver weekly/monthly reports with prioritized findings.

No meetings. No sales calls. 100% async. Slack + Loom + dashboards.

For the PH launch, we're offering 30% off our Performance Checkup (5-day evaluation) to the first 10 teams.

Happy to answer any questions about performance testing, SRE, or observability! 🚀
```

### Launch Day Timeline

**2 weeks before:**
- [ ] Finalize PH listing (tagline, description, images, video)
- [x] Landing page live at vantx.io with Stripe checkout + Calendly booking
- [x] Service detail pages live (Performance, Observability, SRE, QA)
- [ ] Prepare social posts (LinkedIn, Twitter/X) scheduled for launch day
- [ ] DM 20-30 people who upvoted similar products (performance tools, SRE tools)
- [ ] Ask 10 friends/network to be ready to upvote + comment at launch

**1 week before:**
- [ ] Submit PH listing as "upcoming" to collect followers
- [ ] Post teaser on LinkedIn: "Something we've been building for months goes live next week"
- [ ] Send email to existing contacts: "We're launching on PH — would love your support"

**Launch day (Tuesday or Wednesday, 12:01 AM PT):**
- [ ] Go live at 12:01 AM Pacific Time (best window for PH)
- [ ] Post maker comment immediately
- [ ] Share on LinkedIn, Twitter/X, relevant Slack communities
- [ ] Respond to every comment within 30 minutes
- [ ] Post updates throughout the day (new sign-ups, interesting questions, etc.)

**Day 2-3:**
- [ ] Follow up with everyone who signed up
- [ ] Thank upvoters individually
- [ ] Write a recap post on LinkedIn: "We launched on PH — here's what happened"

### Success Metrics
- **Top 5** of the day → good visibility, generates 50-100 visits/day for weeks
- **#1 of the day** → 500+ upvotes, 2,000+ visits, likely 10-20 qualified leads
- **10 PH checkup sign-ups** → $24,500 revenue from launch alone
- **3 of those convert to retainer** → $8,400-$13,500 MRR added

### Where Else to Launch
After PH, cross-post to:
- **HackerNews** ("Show HN: We built Performance as a Service — k6 monitoring 24/7 for $2,800/mo")
- **Dev.to** (technical article: "How we run 24/7 synthetic monitoring with k6 for our clients")
- **Indie Hackers** (story: "From enterprise performance engineer to consulting business doing $X/mo")
- **LinkedIn** (José's network: "Why I quit big company consulting to build VANTX")
- **Reddit** (r/devops, r/sre, r/webdev — share value, not promotion)

### Tools
- **ProductHunt listing**: https://www.producthunt.com/posts/new
- **PH Ship**: Collect "upcoming" followers → https://www.producthunt.com/ship
- **PH API**: Track upvotes/comments programmatically if needed
- **Social scheduling**: Buffer or Typefully for coordinated posts

## Budget
- Hero image design: $0 (generate with existing demo data + Canva/Figma)
- Video: $0 (Loom recording, edited in CapCut)
- PH listing: Free
- Total: $0

## Expected ROI
- Cost: $0 + 2-3 days of José's time
- Best case: #1 Product of the Day → 10 checkup sign-ups ($24,500) + 3 retainers ($8,400/mo MRR)
- Worst case: 50 upvotes, 5 sign-ups → still $12,250 in checkups
- Either way: permanent PH page as social proof + SEO backlink
