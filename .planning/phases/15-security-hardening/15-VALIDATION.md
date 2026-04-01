---
phase: 15
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in platform/) |
| **Config file** | `platform/vitest.config.ts` or `platform/package.json` |
| **Quick run command** | `cd platform && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd platform && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd platform && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | SECURE-01 | integration | `curl -sI localhost:3000 \| grep -i content-security-policy` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | SECURE-01 | integration | `curl -sI localhost:3000 \| grep -i x-content-type-options` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | SECURE-02 | unit | `cd platform && npx vitest run audit` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | SECURE-02 | integration | Manual: invoke admin endpoint, check audit_logs table | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 2 | SECURE-02 | manual | Visual: admin dashboard shows audit log section | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework already exists (vitest) — no install needed
- [ ] `platform/src/lib/__tests__/audit.test.ts` — stubs for audit helper unit tests
- [ ] CSP header verification via curl after dev server starts

*Existing infrastructure covers most phase requirements. Audit helper needs new test file.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSP headers present on all responses | SECURE-01 | Requires running Next.js server | Start dev server, `curl -sI localhost:3000`, verify all security headers present |
| Audit log entries appear in admin dashboard | SECURE-02 | Requires browser rendering + Supabase | Perform admin action, navigate to admin page, verify audit row appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
