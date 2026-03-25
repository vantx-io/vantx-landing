---
phase: 08
slug: admin-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + Playwright (E2E) |
| **Config file** | platform/vitest.config.mts, platform/playwright.config.ts |
| **Quick run command** | `cd platform && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd platform && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15 seconds (unit) + ~30 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx tsc --noEmit`
- **After every plan wave:** Run `cd platform && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | ADMIN-01 | E2E | `npx playwright test --project=admin-redirect` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | ADMIN-02 | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | ADMIN-03 | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | ADMIN-04 | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | ADMIN-05 | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | ADMIN-06 | typecheck | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 08-03-03 | 03 | 2 | TEST-08 | E2E | `npx playwright test e2e/admin-redirect.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] RLS migration for admin cross-client access (prerequisite for all admin pages)
- [ ] Admin i18n namespace in en.json (prerequisite for all admin pages)

*Existing Vitest and Playwright infrastructure from Phase 5 covers test framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin layout visual match | ADMIN-02 | Visual rendering cannot be verified by static analysis | Navigate to /admin as admin user, verify dark sidebar, nav items, ADMIN badge |
| Overview stat accuracy | ADMIN-03 | Requires populated DB with known values | Verify MRR matches sum of active subscription prices |
| Search UX responsiveness | ADMIN-04 | Interaction quality is subjective | Type in search input, verify filtered results appear immediately |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
