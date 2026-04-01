---
phase: 06
slug: server-side-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.1 |
| **Config file** | platform/vitest.config.mts |
| **Quick run command** | `cd platform && npx vitest run` |
| **Full suite command** | `cd platform && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run`
- **After every plan wave:** Run `cd platform && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | NOTIF-05, NOTIF-06 | unit | `cd platform && npx vitest run __tests__/email.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | NOTIF-05, NOTIF-06 | unit | `cd platform && npx vitest run __tests__/webhook.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | NOTIF-07 | unit | `cd platform && npx vitest run __tests__/notifications.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | NOTIF-08 | unit | `cd platform && npx vitest run __tests__/slack.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/email.test.ts` — stubs for NOTIF-05, NOTIF-06
- [ ] `platform/__tests__/webhook.test.ts` — stubs for extended webhook handlers
- [ ] `platform/__tests__/notifications.test.ts` — stubs for NOTIF-07 task notification orchestrator

*Existing slack.test.ts covers base Slack patterns; extend for NOTIF-08.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email appears in Resend dashboard | NOTIF-05, NOTIF-06 | Requires live Resend API key | Trigger test payment in Stripe test mode, check Resend logs |
| Slack message appears in channel | NOTIF-08 | Requires live Slack workspace | Create task via portal, check client Slack channel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
