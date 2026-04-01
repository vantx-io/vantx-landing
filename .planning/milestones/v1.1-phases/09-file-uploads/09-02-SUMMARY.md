---
phase: 09-file-uploads
plan: 02
subsystem: ui, storage
tags: [supabase-storage, signed-urls, lightbox, file-preview, file-size, thumbnails]

# Dependency graph
requires:
  - phase: 09-file-uploads
    plan: 01
    provides: CommentForm with file upload, task_comments.attachments storage paths, createClient browser client
provides:
  - AttachmentPreview component rendering images as 120x120 thumbnails with lightbox and non-image file cards with file size
  - Lightbox component for full-size image modal with Escape/click-outside dismiss
  - Signed URL generation at display time (1-hour expiry, no permanent public URLs)
  - File size display fetched from Supabase Storage metadata via list() API
affects: [09-03-file-uploads]

# Tech tracking
tech-stack:
  added: []
  patterns: [signed-url-on-display, file-size-from-storage-metadata, image-vs-nonimage-split, lazy-signed-url-for-downloads]

key-files:
  created:
    - platform/src/app/[locale]/portal/tasks/AttachmentPreview.tsx
    - platform/src/app/[locale]/portal/tasks/Lightbox.tsx
  modified:
    - platform/src/app/[locale]/portal/tasks/page.tsx

key-decisions:
  - "Image signed URLs generated eagerly on mount; non-image signed URLs generated lazily on click (per Pitfall 6)"
  - "File sizes fetched from Supabase Storage metadata via list() API — no schema changes needed (per D-07)"
  - "Lightbox uses div overlay (not dialog element) for simplicity — no showModal() browser quirks"

patterns-established:
  - "Image/non-image split: isImagePath() helper checks extension for rendering decision"
  - "extractFilename() strips storage path prefix ({clientId}/{taskId}/{timestamp}-) to show clean name"
  - "formatFileSize() converts bytes to human-readable (B/KB/MB) for display"
  - "File type badge color map: images #27AE60, docs #2E75B6, archives #8E44AD, data #E67E22, logs #5C5C56, other #999"

requirements-completed: [UPLOAD-05, UPLOAD-06]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 09 Plan 02: Attachment Display Summary

**Image thumbnails with lightbox modal, non-image file cards with file size from Storage metadata, and signed URL downloads in comment thread**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T15:31:25Z
- **Completed:** 2026-03-25T15:34:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Lightbox component for full-size image modal with Escape key, click-outside dismiss, body scroll lock, and ARIA dialog attributes
- AttachmentPreview component rendering 120x120 image thumbnails with signed URLs and non-image file cards with icon, filename, file size (D-07), type badge, and download action
- File sizes fetched from Supabase Storage metadata via list() API — no database schema changes required
- Integrated AttachmentPreview into tasks page comment thread, rendering after comment content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Lightbox component for full-size image modal** - `89f51fc` (feat)
2. **Task 2: Create AttachmentPreview with file size display and integrate into comment thread** - `88986c1` (feat)

## Files Created/Modified
- `platform/src/app/[locale]/portal/tasks/Lightbox.tsx` - Full-size image modal overlay with Escape key, click-outside, body scroll lock, ARIA dialog
- `platform/src/app/[locale]/portal/tasks/AttachmentPreview.tsx` - Attachment rendering in comment thread: image thumbnails, non-image file cards with file size, signed URL downloads
- `platform/src/app/[locale]/portal/tasks/page.tsx` - Added AttachmentPreview import and rendering inside comment cards

## Decisions Made
- Image signed URLs generated eagerly on component mount for instant thumbnail display; non-image signed URLs generated lazily on download click to avoid unnecessary API calls (per Pitfall 6 from research)
- File sizes fetched from Supabase Storage metadata via list() API grouped by folder to minimize API calls — no schema changes needed (per D-07)
- Lightbox uses div overlay rather than dialog element — simpler implementation, no showModal() browser quirks, z-50 matches portal z-index range

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AttachmentPreview and Lightbox are ready for E2E testing in Plan 03
- All attachment display components integrated into comment thread
- TypeScript compiles with zero errors

## Self-Check: PASSED

- All 2 created files verified on disk (Lightbox.tsx 57 lines, AttachmentPreview.tsx 219 lines)
- Both commit hashes (89f51fc, 88986c1) found in git log
- TypeScript compiles with zero errors
- Line count minimums met (Lightbox >= 30, AttachmentPreview >= 80)

---
*Phase: 09-file-uploads*
*Completed: 2026-03-25*
