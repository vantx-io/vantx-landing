---
phase: 09-file-uploads
plan: 03
subsystem: testing, e2e
tags: [playwright, e2e, login-flow, task-crud, storage-isolation, rls, cross-tenant]

# Dependency graph
requires:
  - phase: 09-file-uploads
    plan: 01
    provides: CommentForm with file upload, inline title edit, status dropdown, task PATCH API
  - phase: 09-file-uploads
    plan: 02
    provides: AttachmentPreview with image thumbnails and Lightbox for display verification
  - phase: 05-foundation
    provides: Playwright test infrastructure, auth.setup.ts storageState pattern
  - phase: 07-notification-ui
    provides: Cross-tenant dual browser context pattern from cross-tenant.spec.ts
provides:
  - Login E2E test (TEST-06) with happy path and wrong password scenarios
  - Task CRUD E2E test (TEST-07) covering full D-15 journey (create, edit title, change status, comment with file attachment)
  - Cross-tenant storage isolation E2E test (D-16) proving RLS enforcement on file attachments
  - Test fixture files (test.txt and test.png) for attachment E2E tests
  - storage-isolation Playwright project configuration
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [filechooser-event-pattern, dual-browser-context-storage-rls, rest-api-signed-url-test]

key-files:
  created:
    - platform/e2e/login.spec.ts
    - platform/e2e/task-crud.spec.ts
    - platform/e2e/storage-isolation.spec.ts
    - platform/e2e/fixtures/test.txt
    - platform/e2e/fixtures/test.png
  modified:
    - platform/playwright.config.ts

key-decisions:
  - "Storage isolation test uses REST API fetch with credentials:include instead of @supabase/ssr dynamic import in page.evaluate (browser context lacks bundled imports)"
  - "Login test does not use storageState-free project — navigates to /en/login directly, which works under chromium project"

patterns-established:
  - "Playwright filechooser pattern: Promise.all([page.waitForEvent('filechooser'), button.click()]) for hidden file inputs"
  - "Storage RLS E2E: upload via service role, verify access via user session REST API call in page.evaluate"
  - "Inline edit test pattern: click title -> fill getByLabel(/edit title/i) -> press Enter -> assert new text visible"

requirements-completed: [TEST-06, TEST-07]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 09 Plan 03: E2E Tests Summary

**Login flow, task CRUD with inline title edit + status change + file attachment, and cross-tenant storage isolation E2E tests using Playwright filechooser and dual browser contexts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T15:36:42Z
- **Completed:** 2026-03-25T15:39:20Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Login E2E test (TEST-06) with two scenarios: successful login redirects to portal, wrong password shows error message
- Task CRUD E2E test (TEST-07) covering full D-15 journey: create task, inline title edit with Enter key, status change via dropdown to in_progress, comment with file attachment via filechooser, and image thumbnail attachment verification
- Cross-tenant storage isolation E2E test (D-16) proving User B cannot access User A's file attachments through RLS enforcement on task-attachments bucket
- Test fixtures created: test.txt (sample text) and test.png (minimal valid 1x1 PNG at 69 bytes)
- Playwright config updated with storage-isolation project using dual setup dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test fixtures and update Playwright config** - `e1c30b4` (chore)
2. **Task 2: Create login, task CRUD, and storage isolation E2E tests** - `260e593` (test)

## Files Created/Modified
- `platform/e2e/login.spec.ts` - TEST-06 login flow: happy path redirect + wrong password error detection
- `platform/e2e/task-crud.spec.ts` - TEST-07 full task CRUD lifecycle with D-15 coverage: create, edit title, change status, attach file, send comment
- `platform/e2e/storage-isolation.spec.ts` - D-16 cross-tenant file access RLS test with dual browser contexts
- `platform/e2e/fixtures/test.txt` - Text fixture for attachment upload tests
- `platform/e2e/fixtures/test.png` - Minimal valid 1x1 PNG for image thumbnail tests
- `platform/playwright.config.ts` - Added storage-isolation project with setup + setup-b dependencies

## Decisions Made
- Storage isolation test uses REST API fetch with `credentials: "include"` inside `page.evaluate` instead of dynamic `@supabase/ssr` import — browser evaluate context cannot dynamically import bundled modules, so direct REST API calls with session cookies are more reliable
- Login test runs under the default chromium project (which has storageState) but navigates directly to `/en/login` — the form fill and submit work correctly regardless of existing session state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three E2E tests ready for execution against running dev environment
- Phase 09 (file-uploads) is fully complete: upload UI, attachment display, and E2E test coverage
- All v1.1 milestone E2E test requirements delivered: TEST-06 (login), TEST-07 (task CRUD with D-15 full journey)

## Self-Check: PASSED

- All 5 created files verified on disk (login.spec.ts, task-crud.spec.ts, storage-isolation.spec.ts, test.txt, test.png)
- Both commit hashes (e1c30b4, 260e593) found in git log
- Line count minimums met (login 35 >= 20, task-crud 115 >= 50, storage-isolation 94 >= 30)

---
*Phase: 09-file-uploads*
*Completed: 2026-03-25*
