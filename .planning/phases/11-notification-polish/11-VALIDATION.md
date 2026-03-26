---
phase: 11
slug: notification-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `platform/vitest.config.mts` |
| **Quick run command** | `cd platform && npx vitest run __tests__/notification-preferences.test.ts __tests__/weekly-digest.test.ts` |
| **Full suite command** | `cd platform && npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command (preference + digest tests)
- **After every plan wave:** Run `cd platform && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | NOTIF-11 | unit | `npx vitest run __tests__/notification-preferences.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | NOTIF-12 | unit | `npx vitest run __tests__/notification-preferences.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 2 | NOTIF-10 | unit | `npx vitest run __tests__/weekly-digest.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | NOTIF-11 | unit | `npx vitest run __tests__/settings-page.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/notification-preferences.test.ts` — stubs for NOTIF-11, NOTIF-12
- [ ] `platform/__tests__/weekly-digest.test.ts` — stubs for NOTIF-10
- [ ] Existing vitest infrastructure covers framework needs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel Cron fires Monday 9am UTC | NOTIF-10 | Requires deployed Vercel with cron schedule | Deploy to preview, wait for Monday cron trigger, verify email received |
| Digest skips zero-activity weeks | NOTIF-10 | Time-dependent + external email service | Confirm no email sent when no tasks changed in 7-day window |
| Toggle UI gives instant feedback | NOTIF-11 | Visual/UX verification | Open /portal/settings, toggle switches, verify immediate visual state change |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 8s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
