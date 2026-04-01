---
phase: 16-test-coverage
plan: "04"
subsystem: testing
tags: [playwright, visual-regression, ci, github-actions, screenshots]

requires:
  - phase: 16-03
    provides: visual-regression spec (visual-regression.spec.ts) and playwright.config.ts with snapshotPathTemplate

provides:
  - CI workflow configured with --update-snapshots to generate Linux-canonical baseline PNGs
  - visual-baselines artifact upload step for downloading generated PNGs
  - Pending: 6 baseline PNG files in platform/e2e/screenshots/ (awaiting human CI run + download)

affects: [production-deploy, ci, visual-regression]

tech-stack:
  added: []
  patterns:
    - "Visual baselines generated in CI (Linux) only — macOS font rendering diffs cause false failures"
    - "--update-snapshots used on first CI run to generate baselines; reverted to comparison mode after PNGs committed"
    - "upload-artifact with if: always() ensures PNGs are captured even if other test steps have issues"

key-files:
  created: []
  modified:
    - ".github/workflows/test.yml"

key-decisions:
  - "Temporary --update-snapshots in CI workflow to generate Linux-canonical baselines before committing to repo"
  - "upload-artifact with if: always() captures generated PNGs regardless of test outcome"
  - "After PNGs committed, workflow reverted to standard npx playwright test --project=visual (no --update-snapshots)"

patterns-established:
  - "Baseline PNG generation pattern: CI --update-snapshots run → download artifact → commit PNGs → revert workflow to comparison mode"

requirements-completed: []

duration: partial (checkpoint at Task 2)
completed: 2026-03-27
---

# Phase 16 Plan 04: Visual Regression Baseline Generation Summary

**CI workflow updated with --update-snapshots and visual-baselines artifact upload; human must trigger CI, download 6 PNG baselines, commit them, and revert workflow to close the final Phase 16 verification gap**

## Performance

- **Duration:** ~5 min (Task 1 only; paused at Task 2 checkpoint)
- **Started:** 2026-03-27T16:32:31Z
- **Completed:** 2026-03-27T16:37:00Z (partial — checkpoint)
- **Tasks:** 1 of 2 completed
- **Files modified:** 1

## Accomplishments

- Modified `.github/workflows/test.yml` to run `--update-snapshots` on next CI push, generating Linux-canonical baseline PNGs
- Added `visual-baselines` upload-artifact step (`if: always()`) so PNGs are available for download from GitHub Actions UI
- Kept `visual-regression-diffs` failure artifact and `integration` job unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Modify CI workflow to generate baselines and upload as artifact** - `8a1594e` (chore)
2. **Task 2: Trigger CI, download baselines, commit PNGs, revert workflow** - PENDING (human-action checkpoint)

## Files Created/Modified

- `.github/workflows/test.yml` - Added `--update-snapshots` flag and `visual-baselines` artifact upload step

## Decisions Made

- Used `--update-snapshots` temporarily in CI rather than generating baselines on macOS, because macOS font rendering differs from Linux CI and would cause false failures on every CI run.
- `if: always()` on the artifact upload ensures PNGs are captured even if Playwright exits with a non-zero code (e.g., due to other test failures during baseline generation).
- Kept workflow change minimal and reversible — only 2 lines changed, easy to revert after PNGs are committed.

## Deviations from Plan

None - plan executed exactly as written for Task 1.

## Issues Encountered

None - `platform/e2e/screenshots/` directory does not exist yet (expected; will be created by CI run).

## User Setup Required

**Task 2 requires manual human steps (blocking checkpoint):**

1. Push the modified `test.yml` to trigger the CI workflow on GitHub:
   ```bash
   git push origin main
   ```

2. Go to the GitHub Actions page for the repository and wait for the `visual-regression` job to complete.

3. Download the `visual-baselines` artifact ZIP from the workflow run page (available under "Artifacts" section).

4. Extract the 6 PNG files into the repo:
   ```bash
   mkdir -p platform/e2e/screenshots
   unzip ~/Downloads/visual-baselines.zip -d platform/e2e/screenshots/
   ```

5. Verify all 6 PNG files exist and are valid (each > 1KB):
   ```bash
   ls -la platform/e2e/screenshots/*.png
   # Expected: portal-dashboard.png, task-list.png, settings.png,
   #           admin-overview.png, admin-billing.png, admin-users.png
   ```

6. Revert `test.yml` to standard comparison mode (2 changes):
   - Change `npx playwright test --project=visual --update-snapshots` back to `npx playwright test --project=visual`
   - Remove the entire `visual-baselines` upload-artifact step (lines 45-50)

7. Commit everything:
   ```bash
   git add platform/e2e/screenshots/*.png .github/workflows/test.yml
   git commit --no-verify -m "test(16): add visual regression baselines from CI Linux environment"
   git push origin main
   ```

8. Confirm both CI jobs (`integration` and `visual-regression`) pass green on the new push.

## Known Stubs

None — the workflow modification is complete and functional. The PNG files are the only missing artifacts, and they will be generated by the CI run triggered in Task 2.

## Next Phase Readiness

- After Task 2 completes: TEST-10 and TEST-11 requirements are both satisfied, Phase 16 is complete
- Phase 17 (production deploy) can proceed once both CI jobs pass green
- The visual regression baseline is a one-time setup — future CI runs compare against committed PNGs without --update-snapshots

## Self-Check: PASSED

- FOUND: `.github/workflows/test.yml` (modified)
- FOUND: `16-04-SUMMARY.md` (created)
- FOUND: commit `8a1594e` (chore(16-04): update CI workflow)

---
*Phase: 16-test-coverage*
*Completed: 2026-03-27 (partial — awaiting human-action checkpoint)*
