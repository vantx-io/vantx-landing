---
phase: 3
slug: detail-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Static HTML — no build step. Validation via file inspection + browser open |
| **Config file** | none |
| **Quick run command** | `open 06-landing-pages/services/observability.html` |
| **Full suite command** | Open all 3 pages in browser, toggle language, click Calendly CTA |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Grep acceptance criteria (exact strings) in modified files
- **After every plan wave:** Open all pages in browser, verify dark theme + nav + footer render
- **Before `/gsd:verify-work`:** Full manual checklist must be green
- **Max feedback latency:** ~60 seconds (grep) / ~3 minutes (browser)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | PAGE-01 | grep | `grep "data-partial=\"nav\"" 06-landing-pages/services/observability.html` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | PAGE-01 | grep | `grep "VANTIX_BASE = '\.\.'" 06-landing-pages/services/observability.html` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | PAGE-01 | grep | `grep "js-calendly-trigger" 06-landing-pages/services/observability.html` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | PAGE-02 | grep | `grep "data-partial=\"nav\"" 06-landing-pages/services/fractional-sre.html` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | PAGE-02 | grep | `grep "js-calendly-trigger" 06-landing-pages/services/fractional-sre.html` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | PAGE-03 | grep | `grep "data-partial=\"nav\"" 06-landing-pages/about/mission.html` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | PAGE-01,02,03 | grep | `grep -c "\"obs_page\." 06-landing-pages/i18n/en.json` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `06-landing-pages/services/` directory exists (already confirmed by research)
- [ ] `06-landing-pages/about/` directory exists (already confirmed by research)

*Existing infrastructure covers all phase requirements. No test framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark theme renders correctly (no white flash) | PAGE-01, 02, 03 | Requires browser render | Open each page, verify `#09090b` background |
| Language toggle switches content without reload | PAGE-01, 02, 03 | Requires JS execution | Click EN/ES toggle, verify text changes in place |
| Calendly popup opens on CTA click | PAGE-01, 02, 03 | Requires Calendly widget JS | Click "Agendar" CTA, verify popup overlay appears |
| Nav links resolve correctly from subdirectory | PAGE-01, 02, 03 | Requires browser navigation | Click nav items from `services/` page, verify no 404s |
| Language persists across page navigation | PAGE-01, 02, 03 | Requires localStorage check | Set ES on index.html, navigate to detail page, verify ES shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
