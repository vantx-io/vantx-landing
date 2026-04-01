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
| **Quick run command** | `cd platform && npx vitest run __tests__/notifications.test.ts __tests__/webhook-email.test.ts __tests__/digest.test.ts` |
| **Full suite command** | `cd platform && npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command (notification + webhook + digest tests)
- **After every plan wave:** Run `cd platform && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | NOTIF-11 | grep | `cd platform && grep -q "CREATE TABLE notification_preferences" supabase/migrations/003_notification_preferences.sql && grep -q "export async function PATCH" src/app/api/preferences/route.ts && echo PASS` | n/a | ⬜ pending |
| 11-01-02 | 01 | 1 | NOTIF-11 | grep+tsc | `cd platform && SETTINGS_PAGE='src/app/[locale]/portal/settings/page.tsx' && grep -q 'role="switch"' "$SETTINGS_PAGE" && npx tsc --noEmit --project tsconfig.json 2>&1 \| head -5 && echo PASS` | n/a | ⬜ pending |
| 11-02-01 | 02 | 2 | NOTIF-12 | unit | `cd platform && npx vitest run __tests__/notifications.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 2 | NOTIF-12 | unit | `cd platform && npx vitest run __tests__/webhook-email.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | NOTIF-10 | grep | `cd platform && grep -q "WeeklyDigestEmail" src/lib/emails/WeeklyDigestEmail.tsx && grep -q "0 9" vercel.json && echo PASS` | n/a | ⬜ pending |
| 11-03-02 | 03 | 2 | NOTIF-10 | unit | `cd platform && npx vitest run __tests__/digest.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/__tests__/notifications.test.ts` — already exists from Phase 7; Plan 02 Task 1 extends it with preference enforcement tests
- [ ] `platform/__tests__/webhook-email.test.ts` — created by Plan 02 Task 2 (Stripe webhook preference tests)
- [ ] `platform/__tests__/digest.test.ts` — created by Plan 03 Task 2 (digest cron handler tests)
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
