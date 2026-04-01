---
title: "Fractional QA — Monthly Report"
subtitle: "NovaPay SpA — March 2026"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# FRACTIONAL QA — MONTHLY REPORT

**NovaPay SpA** · March 2026

VANTX · hello@vantx.io

\newpage

# Executive Summary

Month 2 of the Fractional QA engagement. The Playwright framework is running in CI. 7 E2E tests now cover the critical checkout and settlement flows. Testcontainers integration is live for the Payment Service, bringing integration tests from 0 to 18. Production bugs dropped from 6/month to 2 this month — both P3 (cosmetic). The team completed their first workshop on writing effective tests.

### Engagement Health

| Indicator | Value | Notes |
|---|---|---|
| Month | 2 of engagement | — |
| Requests completed | 11 | via Linear board |
| Avg turnaround | 28h | target: 48h |
| QA maturity score | 2.4/5 | vs 1.2/5 last month |

\newpage

# 1. Test Coverage Progress

### Coverage Metrics

| Layer | Start (Jan) | Last Month | This Month | Target |
|---|---|---|---|---|
| Unit tests | 12-45% | 35-52% | 48-62% | >65% |
| Integration tests | 0 | 8 tests | 18 tests | Critical queries 100% |
| E2E tests (count) | 0 | 3 tests | 7 tests | 10+ flows |
| Critical flows covered | 0/10 | 3/10 | 6/10 | 10/10 |

### CI Pipeline Health

| Metric | Value | Target | Status |
|---|---|---|---|
| CI pass rate | 93% | >95% | ⚠️ Close (2 flaky tests under investigation) |
| Avg pipeline duration | 6.2 min | <10 min | ✅ Pass |
| Flaky test rate | 4% | <2% | ⚠️ Needs work (fixing async waits in Playwright) |
| Blocked deploys (test failures) | 3 | — | 2 were real bugs caught pre-prod |

\newpage

# 2. Quality Metrics

![Production Bugs — Monthly Trend](assets/charts/bugs-trend.svg)

### Production Bugs

| Severity | This Month | Last Month | Trend |
|---|---|---|---|
| P0 Critical | 0 | 1 | Improved |
| P1 High | 0 | 1 | Improved |
| P2 Medium | 0 | 2 | Improved |
| P3 Low | 2 | 2 | Stable |
| **Total** | **2** | **6** | **-67%** |

### Bug Escape Rate

| Metric | Value | Target |
|---|---|---|
| Bugs found pre-production | 14 | — |
| Bugs escaped to production | 2 | — |
| Escape rate | 12.5% | <10% |

> **Highlight:** 2 blocked deploys contained real bugs — a payment rounding error and a missing settlement status update. Both would have reached production without the new test gates. Estimated saved incident cost: ~$5K.

\newpage

# 3. Work Completed

### Board Requests

| Request | Type | Status | Turnaround |
|---|---|---|---|
| E2E: settlement export flow | Automation | ✅ Done | 1 day |
| E2E: merchant onboarding flow | Automation | ✅ Done | 1 day |
| E2E: payment refund flow | Automation | ✅ Done | 2 days |
| E2E: checkout with 3DS | Automation | ✅ Done | 1 day |
| Testcontainers: Payment Service repos | Integration | ✅ Done | 2 days |
| Fix flaky test: checkout timeout | Maintenance | ✅ Done | 2h |
| CI: add test gate to staging deploy | Pipeline | ✅ Done | 4h |
| Review PR: unit tests for settlement calculator | Code review | ✅ Done | 1h |
| Test data factory: merchants + settlements | Infrastructure | ✅ Done | 1 day |
| Pact contract: Payment → Settlement API | Contract | ✅ Done | 1 day |
| Workshop: writing effective unit tests | Training | ✅ Done | 3h |

![Test Coverage Progress](assets/charts/qa-coverage-progress.svg)

### Tests Written / Improved

| Suite | New Tests | Improved | Total |
|---|---|---|---|
| E2E (Playwright) | 4 | 1 (flaky fix) | 7 |
| Integration (Testcontainers) | 10 | 2 | 18 |
| Contract (Pact) | 4 | 0 | 4 |
| Unit (team-written, reviewed by VANTX) | 45 | 12 | ~280 |

### Framework & Tooling

| Item | Description | Status |
|---|---|---|
| Playwright config | Multi-browser (Chrome + Firefox), parallel execution, screenshots on failure | ✅ Live |
| Testcontainers setup | PostgreSQL + Redis containers, auto-cleanup, seed data | ✅ Live |
| Pact broker | Hosted Pactflow, integrated in CI | ✅ Live |
| Test data factories | Merchant, payment, settlement factories with realistic data | ✅ Live |

\newpage

# 4. Team Development

### Knowledge Transfer

| Topic | Format | Attendees | Date |
|---|---|---|---|
| Writing effective unit tests | Workshop (3h) | Full team (8 devs) | Mar 12 |
| Testcontainers: how and when | Pair programming | Carlos, Marta | Mar 18 |
| Reading Playwright test failures | 1:1 session | Javier | Mar 22 |

### Maturity Progress

| Dimension | Start (Jan) | Last Month | This Month | Target |
|---|---|---|---|---|
| Test strategy | 0 | 2 | 3 | 3 |
| Automation | 0 | 1 | 2 | 3 |
| CI/CD gates | 1 | 2 | 3 | 3 |
| Test data | 0 | 0 | 2 | 2 |
| QA process | 0 | 1 | 2 | 2 |
| Team skill | 1 | 1 | 2 | 3 |

# 5. Next Month Plan

| Priority | Item | Expected Outcome |
|---|---|---|
| P0 | Reach 10 E2E tests (3 remaining: admin panel, webhook config, multi-currency) | 100% critical flow coverage |
| P1 | Fix remaining 2 flaky tests | CI pass rate >95%, flaky rate <2% |
| P1 | Testcontainers for Settlement + Notification services | Integration tests across all services |
| P1 | k6 baseline in CI (pre-production gate) | Performance regression detected before deploy |
| P2 | Visual regression: checkout + dashboard screenshots | Catch UI regressions automatically |
| P2 | Team workshop: Playwright for devs | Devs writing their own E2E tests |

\

> hello@vantx.io · vantx.io
