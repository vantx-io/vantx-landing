---
title: "QA Strategy Assessment"
subtitle: "NovaPay SpA — Initial Assessment"
version: "1.0"
date: "March 2026"
---

![](assets/logo.png){ width=30% }

\

# QA STRATEGY ASSESSMENT

**NovaPay SpA — Payment Processing Platform**

March 2026 · VANTX · hello@vantx.io

\newpage

# Executive Summary

NovaPay's QA practices were assessed over 5 business days. The platform has a small engineering team (8 devs, 0 dedicated QA) shipping weekly to production. Testing is developer-driven but inconsistent — unit test coverage varies from 12% to 45% across services, there are no E2E tests, and the CI pipeline runs linting only. An average of 6 production bugs per month are reported by customers before internal detection.

The team is technically strong but lacks QA leadership to define strategy, build frameworks, and create testing habits. The biggest risk is the checkout flow — the most critical path has zero automated tests.

### QA Maturity Assessment

| Dimension | Current Level | Target Level | Gap |
|---|---|---|---|
| Test strategy | 0 None | 3 Standardized | 3 levels |
| Unit testing | 2 Basic | 3 Standardized | 1 level |
| Integration testing | 1 Ad-hoc | 3 Standardized | 2 levels |
| E2E / UI testing | 0 None | 3 Standardized | 3 levels |
| Performance testing | 1 Ad-hoc | 2 Basic | 1 level |
| CI/CD integration | 1 Ad-hoc | 3 Standardized | 2 levels |
| Test data management | 0 None | 2 Basic | 2 levels |
| Bug triage process | 1 Ad-hoc | 2 Basic | 1 level |
| QA documentation | 0 None | 2 Basic | 2 levels |

Levels: **0** None · **1** Ad-hoc · **2** Basic · **3** Standardized · **4** Optimized

\newpage

# 1. Current State

### Team & Process

| Aspect | Current State |
|---|---|
| QA team size | 0 (devs test their own code) |
| QA-to-dev ratio | 0:8 (no dedicated QA) |
| Test strategy doc | None |
| Definition of Done | Informal — "code review + it works on staging" |
| Release process | Weekly deploy, manual smoke test by on-call dev |
| Bug tracking | Linear (labels: bug + severity) |
| Avg bugs in production (monthly) | 6 (3 P2, 2 P1, 1 P0 in last quarter) |

### Test Coverage

| Layer | Framework | Coverage | Quality | Notes |
|---|---|---|---|---|
| Unit tests | JUnit 5 (Java), Jest (Node) | 12-45% | Mixed | Payment Service 45%, Settlement 28%, Notification 12% |
| Integration tests | None | 0% | N/A | Some devs write ad-hoc tests that hit the DB |
| E2E tests | None | 0% | N/A | Critical gap — checkout flow untested |
| API tests | Postman (manual) | ~30% of endpoints | Low | Collections exist but not in CI, not maintained |
| Performance tests | k6 (via VANTX checkup) | One-time | Good | Not yet integrated in CI |
| Visual regression | None | 0% | N/A | — |

### CI/CD Pipeline

| Stage | Tests | Avg Duration | Pass Rate | Blocking? |
|---|---|---|---|---|
| PR checks | ESLint + Checkstyle only | 45s | 98% | Yes (lint) |
| Build | Compile + package | 2 min | 99% | Yes |
| Staging deploy | Manual smoke test | ~15 min (human) | ~95% | No (honor system) |
| Production deploy | None | — | — | No |

\newpage

# 2. Key Problems

| ID | Category | Problem | Business Impact |
|---|---|---|---|
| Q-01 | Coverage | Checkout flow (most critical path) has zero automated tests | Highest-revenue feature is tested manually or not at all |
| Q-02 | Process | No definition of done that includes testing requirements | Quality varies by developer discipline |
| Q-03 | CI/CD | No tests gate production deploys — bugs ship without automated safety net | 6 bugs/month reaching production |
| Q-04 | Data | No test data management — devs test against shared staging DB | Flaky tests, data corruption, unreliable results |
| Q-05 | Regression | No regression test suite — changes to shared code break other services silently | Settlement bug in Feb caused by Payment Service refactor |

\newpage

# 3. Proposed Test Strategy

### Testing Pyramid

| Layer | Tools | Scope | Ownership | Target Coverage |
|---|---|---|---|---|
| Unit | JUnit 5 + Mockito (Java), Jest (Node) | Business logic, validators, mappers | Devs | 70% line coverage |
| Integration | Testcontainers (Postgres + Redis) | Repository layer, service layer with real DB | Devs + QA | Critical queries 100% |
| Contract | Pact | API contracts between services | API owners | All inter-service APIs |
| E2E | Playwright | Critical user flows (checkout, settlement, onboarding) | QA (VANTX) | Top 10 flows |
| Performance | k6 | Load, stress, spike | QA + SRE (VANTX) | Monthly + pre-release |
| Visual | Playwright screenshots | Checkout page, dashboard | QA | Key pages |

### Automation Framework Recommendation

**Recommended stack:** Playwright (E2E) + Testcontainers (integration) + Pact (contract)

**Rationale:** Playwright handles both API and browser testing with a single framework, reducing maintenance overhead. Testcontainers provides ephemeral databases per test run — eliminates shared staging DB issues. Pact catches breaking API changes before deployment.

### CI/CD Integration Plan

| Stage | Gate | Tests | Max Duration |
|---|---|---|---|
| Pre-commit | Lint + unit | All unit tests | <2 min |
| PR | Unit + integration | Full unit + Testcontainers integration | <5 min |
| Staging | E2E + contract | Playwright critical flows + Pact verification | <15 min |
| Pre-production | Full regression + perf | All E2E + k6 baseline | <30 min |

\newpage

# 4. Implementation Roadmap

| Month | Focus | Deliverables |
|---|---|---|
| 1 | Foundation | Test strategy doc, Playwright framework scaffolded, first 3 E2E tests (login, checkout, settlement export), CI pipeline gating PRs with unit tests |
| 2 | Core automation | 10 E2E tests covering top flows, Testcontainers for all repositories, Pact contracts for Payment↔Settlement API, test data factories |
| 3 | Advanced + handoff | Visual regression for checkout, k6 in CI (baseline on every deploy), team training (3h workshop), QA process documentation, handoff |

### Success Criteria

| Metric | Current | 3-Month Target |
|---|---|---|
| Unit test coverage | 12-45% | >65% all services |
| E2E test count | 0 | 10+ critical flows |
| CI pass rate | 98% (lint only) | >95% (full test suite) |
| Bugs in production (monthly) | 6 | <2 |
| Deploy confidence | Low (manual smoke) | High (automated gates) |
| Release cycle time | Weekly (fear-driven) | On-demand (confidence-driven) |

\

> **Next steps:** Approve assessment → Week 1 kickoff → First Playwright tests running in CI within 5 days.
>
> The goal is your team learning — a successful engagement ends when you no longer need us.
>
> hello@vantx.io · vantx.io
