---
phase: 16
slug: test-coverage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x + playwright 1.x |
| **Config file** | `platform/vitest.config.ts` / `platform/playwright.config.ts` |
| **Quick run command** | `cd platform && npx vitest run __tests__/api/` |
| **Full suite command** | `cd platform && npx vitest run && npx playwright test visual-regression` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run __tests__/api/`
- **After every plan wave:** Run `cd platform && npx vitest run && npx playwright test visual-regression`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | TEST-10 | integration | `cd platform && npx vitest run __tests__/api/checkout.test.ts` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | TEST-10 | integration | `cd platform && npx vitest run __tests__/api/billing-portal.test.ts` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | TEST-10 | integration | `cd platform && npx vitest run __tests__/api/webhook-stripe.test.ts` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 2 | TEST-11 | visual | `cd platform && npx playwright test visual-regression` | ❌ W0 | ⬜ pending |
| 16-03-01 | 03 | 2 | TEST-10,TEST-11 | ci | `gh workflow run test.yml` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/api/` — directory for API route integration tests
- [ ] `msw` + `next-test-api-route-handler` — devDependency install
- [ ] `platform/e2e/visual-regression.spec.ts` — Playwright visual regression spec stub

*Existing vitest and playwright infrastructure covers base framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual diff image on CSS change | TEST-11 SC#4 | Requires deliberate CSS mutation + human review of diff output | 1. Modify a portal page CSS property 2. Run `npx playwright test visual-regression` 3. Verify test fails with diff image in test-results/ |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
