---
phase: 07
slug: notification-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.1 + playwright |
| **Config file** | platform/vitest.config.mts, platform/playwright.config.ts |
| **Quick run command** | `cd platform && npx vitest run` |
| **Full suite command** | `cd platform && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~10 seconds (unit) + ~30 seconds (e2e) |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | NOTIF-02, NOTIF-03 | unit | `npx vitest run __tests__/notification-bell.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | NOTIF-04 | unit | `npx vitest run __tests__/use-notifications.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | NOTIF-09 | unit | `npx vitest run` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | NOTIF-04 | e2e | `npx playwright test e2e/cross-tenant.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/notification-bell.test.tsx` — stubs for NOTIF-02, NOTIF-03
- [ ] `platform/__tests__/use-notifications.test.ts` — stubs for Realtime hook
- [ ] `platform/e2e/cross-tenant.spec.ts` — stub for cross-tenant isolation test
- [ ] `platform/src/components/` — directory creation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time badge update on live insert | NOTIF-04 | Requires live Supabase with REPLICA IDENTITY FULL | Insert notification via Supabase Dashboard, verify badge updates |
| Badge pulse animation | D-09 | Visual CSS behavior | Inspect badge after Realtime event |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
