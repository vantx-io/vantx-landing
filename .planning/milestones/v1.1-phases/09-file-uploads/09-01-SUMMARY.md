---
phase: 09-file-uploads
plan: 01
subsystem: ui, api, storage
tags: [react-dropzone, supabase-storage, file-upload, drag-and-drop, rls]

# Dependency graph
requires:
  - phase: 05-foundation
    provides: Vitest test infrastructure, CI pipeline
  - phase: 06-server-side-integration
    provides: notification orchestrator pattern, createServiceClient usage
provides:
  - CommentForm component with file upload, drag-and-drop, validation, preview strip, progress bars
  - POST /api/tasks/[taskId]/comments route for comment creation with attachments
  - PATCH /api/tasks/[taskId] route for task title and status updates
  - Seller role storage RLS migration (004_storage_seller_rls.sql)
  - Inline task title editing and status change dropdown on tasks page
  - 14 i18n keys for upload and edit UI in both en/es locales
affects: [09-02-file-uploads, 09-03-file-uploads]

# Tech tracking
tech-stack:
  added: [react-dropzone ^15.0.0]
  patterns: [simulated-progress-ticker, file-validation-client-side, storage-path-convention]

key-files:
  created:
    - platform/src/app/[locale]/portal/tasks/CommentForm.tsx
    - platform/src/app/api/tasks/[taskId]/comments/route.ts
    - platform/src/app/api/tasks/[taskId]/route.ts
    - platform/supabase/migrations/004_storage_seller_rls.sql
  modified:
    - platform/package.json
    - platform/src/app/[locale]/portal/tasks/page.tsx
    - platform/src/messages/en.json
    - platform/src/messages/es.json

key-decisions:
  - "react-dropzone v15 installed (was v14 in blocker notes, v15 resolved cleanly)"
  - "Simulated progress ticker at 300ms intervals since Supabase SDK lacks native upload progress events"
  - "reloadComments helper added to avoid toggle-off behavior when CommentForm callback fires"

patterns-established:
  - "Storage path format: {clientId}/{taskId}/{timestamp}-{safeFilename} for all task attachments"
  - "Client-side file validation before upload: blocked extensions + size limit"
  - "Simulated progress ticker pattern for Supabase Storage uploads"

requirements-completed: [UPLOAD-03, UPLOAD-04]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 09 Plan 01: Upload UI & Comment API Summary

**CommentForm with react-dropzone drag-and-drop, client-side validation (executables + 50MB), simulated progress bars, Supabase Storage upload, plus inline task title editing and status dropdown**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T15:23:28Z
- **Completed:** 2026-03-25T15:27:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- CommentForm component with full file upload workflow: drag-and-drop, paperclip button, extension/size validation, preview strip with image thumbnails, simulated progress bars, and Supabase Storage upload
- Comment API route (POST) accepts content and attachments array, inserts into task_comments with storage paths
- Task PATCH route supports title and status updates per D-15 for TEST-07 E2E coverage
- Seller RLS migration adds seller role to storage admin policy
- Inline task title editing on click with Enter/Escape keyboard support
- Status change dropdown in expanded task section
- 14 i18n keys added to both en.json and es.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-dropzone, create comment API route, task PATCH route, seller RLS migration, add i18n keys** - `059acf3` (feat)
2. **Task 2: Create CommentForm component with file upload, drag-and-drop, validation, and progress -- refactor tasks page with inline edit and status change** - `0378c97` (feat)

## Files Created/Modified
- `platform/src/app/[locale]/portal/tasks/CommentForm.tsx` - Full file upload comment form with drag-and-drop, validation, progress, preview strip
- `platform/src/app/api/tasks/[taskId]/comments/route.ts` - POST route for comment creation with attachments
- `platform/src/app/api/tasks/[taskId]/route.ts` - PATCH route for task title and status updates
- `platform/supabase/migrations/004_storage_seller_rls.sql` - Seller role added to storage admin policy
- `platform/package.json` - Added react-dropzone ^15.0.0
- `platform/src/app/[locale]/portal/tasks/page.tsx` - Refactored with CommentForm, inline title edit, status dropdown
- `platform/src/messages/en.json` - 14 new upload/edit i18n keys
- `platform/src/messages/es.json` - 14 new upload/edit i18n keys (Spanish)

## Decisions Made
- react-dropzone v15 installed (blocker notes mentioned v14 but v15 resolved cleanly at npm install time)
- Simulated progress ticker at 300ms intervals (8% increments capped at 90%) since Supabase JS SDK does not expose native upload progress events
- Added `reloadComments` helper function separate from `loadComments` to avoid the toggle-off behavior when the CommentForm `onCommentAdded` callback fires (loadComments toggles selected state, reloadComments just refreshes data)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added reloadComments helper to avoid toggle-off on comment submit**
- **Found during:** Task 2 (page.tsx refactor)
- **Issue:** The existing `loadComments` function toggles `selected` state, so using it as the `onCommentAdded` callback would collapse the expanded task after submitting a comment
- **Fix:** Added a dedicated `reloadComments(taskId)` function that only refreshes comment data without toggling the selected state
- **Files modified:** platform/src/app/[locale]/portal/tasks/page.tsx
- **Verification:** TypeScript compiles, callback wired correctly
- **Committed in:** 0378c97 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for correct UX behavior. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CommentForm is ready for Plan 02 (attachment display) to render stored attachments inline in the comment thread
- Storage path convention established: `{clientId}/{taskId}/{timestamp}-{safeFilename}`
- PATCH route ready for E2E test coverage in Plan 03
- Seller RLS migration ready for deployment

## Self-Check: PASSED

- All 4 created files verified on disk
- Both commit hashes (059acf3, 0378c97) found in git log
- TypeScript compiles with no errors

---
*Phase: 09-file-uploads*
*Completed: 2026-03-25*
