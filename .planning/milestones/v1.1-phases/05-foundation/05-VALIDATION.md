---
phase: 5
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x + @playwright/test 1.x |
| **Config file** | platform/vitest.config.ts + platform/playwright.config.ts (created in this phase) |
| **Quick run command** | `cd platform && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd platform && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15 seconds (unit) + ~30 seconds (e2e) |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TEST-01 | config | `npx vitest run --reporter=verbose` exits 0 | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | TEST-02 | unit | `npx vitest run src/lib/__tests__/stripe.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | TEST-03 | unit | `npx vitest run src/lib/__tests__/slack.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | TEST-04 | unit | `npx vitest run src/lib/__tests__/onboard.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | TEST-05 | config | `npx playwright test --reporter=list` exits 0 | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | TEST-09 | script | `node scripts/check-i18n-parity.js` exits 0 | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTIF-01 | migration | `supabase db reset` succeeds with 002_notifications.sql | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UPLOAD-01 | migration | `supabase db reset` succeeds with 003_storage.sql | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UPLOAD-02 | migration | Storage RLS policies applied in 003_storage.sql | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/vitest.config.ts` — Vitest configuration with path aliases
- [ ] `platform/playwright.config.ts` — Playwright configuration with auth setup
- [ ] `platform/src/lib/supabase/__mocks__/client.ts` — Supabase client mock
- [ ] vitest + @testing-library/react + @playwright/test installed as devDependencies

*This phase IS the Wave 0 for the entire milestone — it creates the test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Playwright auth with real Supabase | TEST-05 | Requires running local Supabase instance | `supabase start && npx playwright test` |
| Storage bucket creation | UPLOAD-01 | Requires Supabase Dashboard or CLI verification | `supabase db reset && check bucket exists` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
