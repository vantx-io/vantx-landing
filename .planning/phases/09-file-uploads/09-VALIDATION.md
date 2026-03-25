---
phase: 9
slug: file-uploads
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (unit) + Playwright 1.58 (E2E) |
| **Config file** | `platform/vitest.config.mts` / `platform/playwright.config.ts` |
| **Quick run command** | `cd platform && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd platform && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds (unit) + ~45 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd platform && npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 75 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | UPLOAD-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | UPLOAD-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | UPLOAD-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | UPLOAD-06 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 2 | TEST-06 | E2E | `npx playwright test login` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 2 | TEST-07 | E2E | `npx playwright test task-crud` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/src/lib/__tests__/upload-validation.test.ts` — stubs for UPLOAD-04 validation
- [ ] `platform/e2e/login.spec.ts` — stub for TEST-06
- [ ] `platform/e2e/task-crud.spec.ts` — stub for TEST-07
- [ ] `npm install react-dropzone` — dependency not yet installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop visual feedback | UPLOAD-03 | CSS visual state not testable in unit tests | Drag file over comment area, verify border highlight appears |
| Image lightbox keyboard dismiss | UPLOAD-05 | Complex DOM interaction | Open lightbox, press Escape, verify closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 75s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
