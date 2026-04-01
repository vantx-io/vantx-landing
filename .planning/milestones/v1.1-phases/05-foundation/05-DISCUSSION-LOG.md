# Phase 5: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 05-foundation
**Areas discussed:** File upload limits, Notification schema, CI pipeline

---

## File Upload Limits

### Max file size
| Option | Description | Selected |
|--------|-------------|----------|
| 10 MB (Recommended) | Covers docs, screenshots, logs — standard for B2B portals | |
| 25 MB | Allows HAR files and heavy performance reports | |
| 50 MB | For short bug reproduction videos | ✓ |

**User's choice:** 50 MB
**Notes:** User wants to support video bug reproductions and large HAR files.

### Allowed file types
| Option | Description | Selected |
|--------|-------------|----------|
| Docs + images + logs | .pdf, .docx, .xlsx, .csv, .png, .jpg, .gif, .svg, .txt, .log, .json, .har | |
| Everything except executables | Block .exe, .sh, .bat, .cmd — allow everything else | ✓ |
| Only images and PDFs | Minimum risk, maximum security | |

**User's choice:** Everything except executables
**Notes:** Broad allowance — block only executable formats.

### Max files per comment
| Option | Description | Selected |
|--------|-------------|----------|
| 5 files | Enough for screenshots + context | |
| 10 files | For more complete reports with multiple attachments | |
| No limit | Leave free — trust total size | ✓ |

**User's choice:** No limit
**Notes:** Trust the 50 MB per-file constraint to manage storage.

---

## Notification Schema

### Notification types
| Option | Description | Selected |
|--------|-------------|----------|
| payment_success | Payment processed correctly | ✓ |
| payment_failed | Payment failed — action required | ✓ |
| task_updated | Status change on a client task | ✓ |
| task_created | New task created (for Vantix team) | ✓ |

**User's choice:** All four types
**Notes:** Multi-select — all types included.

### Action links
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, link to resource | Each notification links to relevant page (billing, task, etc.) | |
| Only informational | No direct navigation — user searches manually | |
| You decide | Claude decides per notification type | ✓ |

**User's choice:** Claude's discretion
**Notes:** Claude will determine per-type whether to include action links.

### Retention
| Option | Description | Selected |
|--------|-------------|----------|
| 90 days | Auto-cleanup of old notifications | ✓ |
| Indefinite | Keep everything — clean manually if needed | |
| 30 days | Aggressive rotation — only recent | |

**User's choice:** 90 days
**Notes:** Automatic cleanup cycle.

---

## CI Pipeline

### CI platform
| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions (Recommended) | Already on GitHub — native workflow, no extra setup | ✓ |
| Local only for now | npm test manual — CI later | |
| You decide | Claude chooses best option | |

**User's choice:** GitHub Actions
**Notes:** Repo already on GitHub.

### Test gating
| Option | Description | Selected |
|--------|-------------|----------|
| PR checks | Tests run on every PR — block merge on failure | ✓ |
| PR + push to main | Tests on PR and also when merging to main | |
| Manual only | Only npm test when dev wants | |

**User's choice:** PR checks
**Notes:** Gate merges at PR level.

### Playwright in CI
| Option | Description | Selected |
|--------|-------------|----------|
| CI + local | E2E runs in GitHub Actions too — slower but safer | ✓ |
| Local only | E2E only local — CI only runs unit + lint + type-check | |
| You decide | Claude decides based on setup complexity | |

**User's choice:** CI + local
**Notes:** Full e2e coverage in CI.

---

## Claude's Discretion

- Action links on notifications (per-type decision)
- Test file organization (co-located vs top-level)
- Vitest configuration details
- Playwright auth helper implementation
- GitHub Actions workflow structure

## Deferred Ideas

None — discussion stayed within phase scope.
