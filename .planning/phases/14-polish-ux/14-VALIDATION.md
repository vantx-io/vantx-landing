---
phase: 14
slug: polish-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (no test framework configured yet) |
| **Config file** | none — visual/UX validations |
| **Quick run command** | `npx next build` |
| **Full suite command** | `npx next build && npx next start` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx next build`
- **After every plan wave:** Run `npx next build && npx next start`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | UX-01 | build + grep | `npx next build && grep -r "SkeletonCard\|SkeletonTable\|SkeletonText" platform/src/components/skeletons.tsx` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | UX-01 | grep | `grep -r "Skeleton" platform/src/app/\[locale\]/portal/` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | UX-02 | grep + build | `grep -r "has_onboarded" platform/supabase/migrations/ && npx next build` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | UX-02 | grep | `grep -r "OnboardingCard\|onboarding" platform/src/app/\[locale\]/portal/page.tsx` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 1 | UX-03 | grep + build | `grep -r "SectionErrorBoundary" platform/src/components/SectionErrorBoundary.tsx && npx next build` | ❌ W0 | ⬜ pending |
| 14-03-02 | 03 | 1 | UX-03 | grep | `grep -r "SectionErrorBoundary" platform/src/app/\[locale\]/portal/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `platform/src/components/skeletons.tsx` — skeleton components (SkeletonCard, SkeletonTable, SkeletonText)
- [ ] `platform/src/components/SectionErrorBoundary.tsx` — reusable error boundary
- [ ] `platform/supabase/migrations/007_onboarding.sql` — has_onboarded column

*Existing infrastructure covers build verification. No test framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skeleton matches page content shape | UX-01 | Visual fidelity check | Load each portal page, verify skeleton approximates real content layout |
| Onboarding card appears for new users | UX-02 | Requires fresh user state | Create new user, login, verify card appears on dashboard |
| Onboarding card dismisses permanently | UX-02 | Stateful interaction | Click "Got it", refresh page, verify card does not reappear |
| Error boundary isolates section failures | UX-03 | Requires simulated error | Temporarily break one section's data fetch, verify rest of page loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
