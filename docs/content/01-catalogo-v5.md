---
title: "Service Catalog"
subtitle: "Subscribe. Request. Receive. Pause or cancel anytime."
version: "5.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# SERVICE CATALOG

**Productized Engineering Services**

Version 5.0 — March 2026

\

> Subscribe to a plan. Add requests to your board. Receive deliverables in 48h avg. Pause or cancel anytime.

VANTX replaces unreliable freelancers and expensive agencies with a flat monthly subscription, delivering so fast you won't want to go anywhere else.

\newpage

# 1. How It Works

### Subscribe

Pick a plan at vantx.io and subscribe via Stripe. No contracts, no proposals, no scoping calls. Pay monthly, cancel anytime.

### Request

Add tasks to your dedicated Trello/Linear board. "Run load test on checkout", "Review our alerting setup", "Build Playwright framework for login flow", "Train the team on k6". Whatever you need.

### Receive

One request at a time, 48-hour average turnaround. Managed services (Performance/Observability) run automatically 24/7 on top of board requests.

### Pause or Cancel

Don't need us anymore? Pause your subscription. Unused days roll over. Come back anytime. No penalty, no questions.

| Traditional consulting | VANTX productized |
|---|---|
| Send an email for a quote | Pricing on the website, subscribe via Stripe |
| 10-page proposal | Subscribe → onboarding in 1 hour |
| 1-hour scoping call | Add a card to the board |
| 3-6 month contract | Pause or cancel anytime |
| Variable monthly invoice | Fixed monthly rate |
| "We'll get back to you in 48h" | Board ready in 1 hour |
| Weekly 1-hour meetings | Async by default, 15 min call when needed |

\newpage

# 2. Performance as a Service

**MANAGED SERVICE — $5,995/month**

Your system monitored 24/7. Every minute we know if it's alive. Every 5 minutes we measure real latency. Every week we check web performance. Every month we run a full load test. You receive reports, dashboards, and exact recommendations on what to fix — without asking.

### What runs automatically (24/7)

- Uptime check — health endpoint every 1 minute → uptime %
- Synthetic monitoring — critical flow every 5 minutes → p50/p95/p99, error rate
- Real-time alerts → Slack when something degrades
- Lighthouse CI — Core Web Vitals + Lighthouse score weekly
- Monthly full load test — baseline + stress + spike → Max TPS, breakpoint, capacity
- **Real User Monitoring (RUM)** — CWV measured from real user browsers (50K sessions/mo included)
- **JS error tracking** — captures JavaScript errors in production before users report them

### What you receive without asking

- Real-time Grafana dashboard (embedded in your portal)
- Frontend Observability dashboard — RUM, JS errors, real sessions
- Weekly report → Slack every Monday
- Monthly report → PDF + XLSX + Loom video
- Prioritized findings P0-P3 with specific actions (the SQL, the config, the exact change)
- Capacity planning — can you handle 2x, 5x, 10x current load?

### Your infrastructure (dedicated Grafana Cloud stack)

- Prometheus/Mimir — k6 metrics (uptime, synthetic, load test)
- Loki — k6 run logs + optional app logs
- Tempo — backend + frontend traces (end-to-end)
- Faro — RUM, JS errors, session traces, real CWV
- IRM — on-call routing, incident timeline, status page
- 8 pre-configured dashboards

### Pricing

| Plan | Price |
|---|---|
| Performance subscription (managed, everything included) | $5,995/month |
| Performance Checkup (one-shot entry point) | $2,995 |

Pause or cancel anytime. Infrastructure included. Stack: k6 + Grafana Cloud + Faro. Open-source, zero lock-in.

### RUM Tiers (Frontend Observability)

Base service includes RUM up to 50K sessions/month (Grafana Cloud free tier). For higher traffic clients:

| Tier | Sessions/month | Add-on |
|---|---|---|
| Starter (included) | ≤50K | $0 |
| Growth | ≤150K | +$200/month |
| Scale | ≤500K | +$450/month |
| Enterprise | 500K+ | Custom |

> For reference: Datadog RUM charges $87/mo for 50K sessions. VANTX includes it free.

\newpage

# 3. Observability as a Service

**MANAGED SERVICE — $6,995/month**

Your observability stack implemented and managed. Not a tool. Not a one-off project. A managed capability — designed to keep your signals useful, your costs controlled, and your team confident when something breaks.

### What we deliver

1. **Observability baseline** — what to collect, what to discard, and why
2. **Practical SLOs and alerts** — aligned to how the business experiences downtime
3. **Lean, opinionated dashboards** — the questions your team actually asks during an incident
4. **Continuous instrumentation improvement** — not quarterly fire drills
5. **Optimized telemetry and controlled costs** — cardinality and volume reduction
6. **IRM (Incident Response Management)** — on-call schedules, alert routing, incident timeline, status pages

### Pricing

| Plan | Price |
|---|---|
| Observability Baseline (one-shot setup, 3-4 weeks) | Included in first month |
| Ongoing management (monthly) | $6,995/month |

Stack: OpenTelemetry + Prometheus + Grafana + Loki + Tempo + Faro + IRM. Vendor-neutral. Pause or cancel anytime.

RUM tiers apply same as Performance (Starter included, Growth/Scale as add-on).

\newpage

# 4. Fractional SRE

**EXPERT SUBSCRIPTION — $7,995/month**

A Senior SRE embedded in your team. Defines your reliability strategy, implements tooling, trains your people, and leads incident response. Without the cost of a full-time hire, active in 1 week.

> Hiring a Senior SRE full-time: $150K-200K/year + equity + 3-6 months recruiting. VANTX Fractional SRE: $7,995/month, active in 1 week.

### What your Fractional SRE does

- SLOs / SLIs / error budgets — definition and implementation
- Incident response framework — runbooks, playbooks, escalation paths
- IRM setup — configure on-call, routing, status pages
- Blameless post-mortems — lead and train the team
- On-call design — rotation, training, compensation
- Chaos engineering — Litmus, Gremlin (if maturity allows)
- Capacity planning — model growth, plan scaling
- Load testing + performance profiling (k6 framework)
- Architecture decision records + operational documentation
- Pair programming and code reviews focused on reliability
- 1:1 mentoring for engineers growing into SRE

### Pricing

| Plan | Price |
|---|---|
| Fractional SRE (full embedded) | $7,995/month |

Pause or cancel anytime. Onboarding: 1 week. Direct Slack access.

\newpage

# 5. Fractional QA Tech Lead

**EXPERT SUBSCRIPTION — From $6,995/month**

A Senior QA/Automation Expert embedded in your team. Defines your test strategy, builds the automation framework, integrates tests into CI/CD, and trains your team to maintain quality autonomously.

### Who it's for

- Startups without a QA lead — devs test "when there's time" (there's never time)
- Companies with a QA team but no technical direction — manual testers wanting to automate
- Teams wanting testing in the pipeline but lacking expertise
- Scale-ups needing a QA strategy before hiring a full team

### What your Fractional QA Tech Lead does

- Test strategy — what to test, where, when, with which tools
- Test architecture — testing pyramid, layers, ownership
- Automation framework — Playwright, Cypress, Selenium, from scratch or improve existing
- CI/CD integration — tests in GitHub Actions, GitLab CI, Jenkins, CircleCI
- Contract testing — Pact for APIs, schema validation
- Performance testing — k6 integrated in pipeline (shift-left)
- Visual regression testing — Chromatic, Percy, Playwright screenshots
- Test data management — factories, fixtures, database seeding
- QA process design — definition of done, bug triage, release gates
- Training and mentoring — hands-on workshops, pair programming, code reviews

### Pricing

| Plan | Price |
|---|---|
| Fractional QA Tech Lead | From $6,995/month |

Pause or cancel anytime. The goal is your team learning — a successful engagement ends when you no longer need us.

\newpage

# 6. Add-ons (one-shot)

| Service | Price | Delivery |
|---|---|---|
| Performance Checkup | $2,995 | 5 days |
| Load Testing Sprint (2-3 weeks) | $4,995 | 15 days |
| Web Performance Audit | $1,995 | 5 days |
| Training: k6 (3h hands-on) | $1,495 | 1 day |
| Training: SRE Practices (3h) | $1,995 | 1 day |
| Training: Grafana + OTel (4h) | $2,495 | 1 day |
| Training: Test Automation (3h) | $1,495 | 1 day |

Add-ons can be purchased without a subscription. The Checkup is the natural entry point.

\newpage

# 7. Pricing Summary

| Product | US Price | Model |
|---|---|---|
| Performance (managed) | $5,995/month | Subscription |
| Observability (managed) | $6,995/month | Subscription |
| Fractional SRE | $7,995/month | Subscription |
| Fractional QA Tech Lead | From $6,995/month | Subscription |
| Performance Checkup | $2,995 | One-shot |

All plans: pause or cancel anytime. Pricing on the website. Subscribe via Stripe.

### LATAM & Spain

Companies and startups in Latin America and Spain receive **40% discount** on all plans. Book a call to learn more.

### AI Startups

Early-stage teams building with AI receive **25% discount** on all plans. Book a call to learn more.

| Product | US | LATAM/Spain (-40%) | AI Startup (-25%) |
|---|---|---|---|
| Performance | $5,995/mo | $3,595/mo | $4,495/mo |
| Observability | $6,995/mo | $4,195/mo | $5,245/mo |
| Fractional SRE | $7,995/mo | $4,795/mo | $5,995/mo |
| Fractional QA TL | $6,995/mo | $4,195/mo | $5,245/mo |
| Checkup | $2,995 | $1,795 | $2,245 |

### Not sure which one you need?

Start with a Performance Checkup ($2,995). In 5 days you'll know exactly what problems you have and which of our services solves them. No commitment.

> Book 15 min: calendly.com/hello-vantx/15min · hello@vantx.io · vantx.io
