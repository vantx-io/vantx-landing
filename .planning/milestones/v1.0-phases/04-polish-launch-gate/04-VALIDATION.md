---
phase: 4
slug: polish-launch-gate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser audit (axe DevTools, impeccable.style commands, iOS Safari) |
| **Config file** | none — static HTML site, no build system |
| **Quick run command** | `open landing/index.html` + axe DevTools scan |
| **Full suite command** | axe DevTools scan on all public pages (index, 4 services, mission, welcome, 2 legal) |
| **Estimated runtime** | ~120 seconds per page (manual) |

---

## Sampling Rate

- **After every task commit:** Visual diff check on affected pages
- **After every plan wave:** axe DevTools scan on modified pages
- **Before `/gsd:verify-work`:** Full axe scan on all pages, both light and dark mode
- **Max feedback latency:** Manual — immediate visual verification

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DSNG-02 | manual | axe DevTools contrast scan | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | DSNG-02 | manual | keyboard tab-through all pages | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | DSNG-02 | visual | impeccable.style /audit command | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | DSNG-02 | visual | check credibility bar animation timing | N/A | ⬜ pending |
| 04-03-01 | 03 | 2 | DSNG-02 | manual | localStorage persistence in incognito | N/A | ⬜ pending |
| 04-03-02 | 03 | 2 | DSNG-02 | manual | iOS Safari real device rendering | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — Phase 4 is audit/fix work on a static site with no test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WCAG AA contrast (light + dark) | DSNG-02 | Requires axe DevTools browser extension | Open each page → run axe scan → verify 0 contrast violations |
| impeccable.style audit | DSNG-02 | Claude slash command, not automatable | Run /audit and /critique on each page screenshot |
| iOS Safari rendering | DSNG-02 | Requires real iOS device | Load each page on iPhone Safari, check layout/fonts/nav |
| localStorage persistence in incognito | DSNG-02 | Browser-specific behavior | Open incognito → set language → hard reload → verify persists |
| Calendly popup focus trap | DSNG-02 | Third-party embed | Tab into Calendly popup → verify focus doesn't escape to background |
| Mobile nav drawer focus trap | DSNG-02 | Requires mobile viewport | Open hamburger → Tab → verify focus cycles within drawer |

---

## Validation Sign-Off

- [ ] All tasks have manual verification instructions
- [ ] Sampling continuity: visual check after every CSS/HTML change
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s (manual page load + scan)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
