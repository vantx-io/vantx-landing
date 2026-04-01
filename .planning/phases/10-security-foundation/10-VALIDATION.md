---
phase: 10
slug: security-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `platform/vitest.config.mts` |
| **Quick run command** | `cd platform && npx vitest run src/lib/__tests__/rate-limit.test.ts` |
| **Full suite command** | `cd platform && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run src/lib/__tests__/rate-limit.test.ts`
- **After every plan wave:** Run `cd platform && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SEC-04 | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | SEC-05 | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | SEC-04 | integration | `npx vitest run src/app/api/__tests__/rate-limit-integration.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/src/lib/__tests__/rate-limit.test.ts` — stubs for SEC-04, SEC-05 (rate limit utility tests)
- [ ] Test infrastructure already exists (vitest configured in v1.1)

*Existing vitest infrastructure covers framework needs. Only test files are missing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-instance enforcement | SEC-04 | Requires deployed Vercel + real Upstash Redis | Deploy to preview, call API route >limit from two different clients, verify 429 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
