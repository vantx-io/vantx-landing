---
phase: 12
slug: admin-capabilities
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 12 — Validation Strategy

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
| 12-01-01 | 01 | 1 | ADMIN-07, ADMIN-08 | unit | `npx vitest run platform/__tests__/admin-invite.test.ts` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | ADMIN-09, ADMIN-10 | unit | `npx vitest run platform/__tests__/admin-users.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | ADMIN-07..10 | unit | `npx vitest run platform/__tests__/admin-users-page.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | ADMIN-10 | unit | `npx vitest run platform/__tests__/middleware-deactivation.test.ts` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 2 | ADMIN-11 | unit | `npx vitest run platform/__tests__/mrr-chart.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/admin-invite.test.ts` — stubs for ADMIN-07, ADMIN-08
- [ ] `platform/__tests__/admin-users.test.ts` — stubs for ADMIN-09, ADMIN-10
- [ ] `platform/__tests__/admin-users-page.test.ts` — stubs for user management page
- [ ] `platform/__tests__/middleware-deactivation.test.ts` — stubs for is_active middleware check
- [ ] `platform/__tests__/mrr-chart.test.ts` — stubs for ADMIN-11

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase invite email delivery | ADMIN-07 | External email service | Invite a user, check email inbox for magic link |
| DB trigger fires on invite acceptance | ADMIN-08 | Requires Supabase auth flow | Accept invite link, verify `users` row created |
| Ban prevents login after deactivation | ADMIN-10 | Requires full auth flow | Deactivate user, attempt login from incognito |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
