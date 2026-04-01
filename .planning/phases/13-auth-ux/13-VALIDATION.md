---
phase: 13
slug: auth-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.0.5 |
| **Config file** | `platform/vitest.config.mts` |
| **Quick run command** | `cd platform && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd platform && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd platform && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run platform/__tests__/reset-password.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | AUTH-02, AUTH-03 | unit | `npx vitest run platform/__tests__/settings-auth.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/reset-password.test.ts` — stubs for AUTH-01
- [ ] `platform/__tests__/settings-auth.test.ts` — stubs for AUTH-02, AUTH-03

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase recovery email delivery | AUTH-01 | External email service | Click forgot password, check inbox for reset link |
| Reset link token validation | AUTH-01 | Requires Supabase auth flow with real token | Open reset link from email, verify form appears |
| Password change persists across sessions | AUTH-02 | Requires full login/logout cycle | Change password, logout, login with new password |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
