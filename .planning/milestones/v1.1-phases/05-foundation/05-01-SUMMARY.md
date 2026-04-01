---
phase: 05-foundation
plan: 01
subsystem: database
tags: [supabase, migrations, rls, storage, typescript, notifications]

# Dependency graph
requires: []
provides:
  - notifications table with RLS and indexes (002_notifications.sql)
  - task-attachments private storage bucket with client_id-scoped RLS (003_storage.sql)
  - Notification and NotificationType TypeScript types in platform/src/lib/types.ts
affects: [06-notifications, 07-realtime, 09-file-upload]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase RLS policy pattern with auth.uid() for user-scoped access
    - Admin ALL policy using subquery on users.role (consistent with 001_schema.sql)
    - Storage RLS via storage.foldername(name)[1] for client_id path scoping
    - TypeScript types mirror SQL schema exactly (UUID -> string, nullable TEXT -> string | null)

key-files:
  created:
    - platform/supabase/migrations/002_notifications.sql
    - platform/supabase/migrations/003_storage.sql
  modified:
    - platform/src/lib/types.ts

key-decisions:
  - "notifications table typed with CHECK constraint covering payment_success, payment_failed, task_updated, task_created"
  - "task-attachments bucket private=true with 52428800 byte (50MB) file_size_limit"
  - "Storage RLS scoped to client_id via (storage.foldername(name))[1] — matches D-05 canonical path"
  - "NotificationType union and Notification interface placed in types.ts alongside other domain types"

patterns-established:
  - "Migration style: CREATE TABLE -> ALTER TABLE ENABLE RLS -> CREATE POLICY block -> CREATE INDEX block"
  - "Nullable fields in TypeScript: string | null (not undefined) matching Supabase JSON serialization"

requirements-completed: [NOTIF-01, UPLOAD-01, UPLOAD-02]

# Metrics
duration: 1min
completed: 2026-03-24
---

# Phase 5 Plan 01: Foundation — DB Migrations Summary

**Notifications table (RLS + indexes) and private task-attachments storage bucket provisioned as SQL migrations, with matching TypeScript Notification type exported from types.ts**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-24T22:49:47Z
- **Completed:** 2026-03-24T22:51:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `002_notifications.sql` with 8-column notifications table, 3 RLS policies (user SELECT, user UPDATE, admin ALL), and 2 performance indexes (user+created DESC, unread partial index)
- Created `003_storage.sql` with private task-attachments bucket (50MB limit, NULL mime filter per D-02), and 3 storage RLS policies using `storage.foldername` to scope access to client_id path segment
- Added `NotificationType` and `Notification` to `platform/src/lib/types.ts` matching the migration schema exactly; TypeScript compilation passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notifications table migration and storage bucket migration** - `866ef86` (feat)
2. **Task 2: Add Notification type to types.ts** - `39407fc` (feat)

## Files Created/Modified

- `platform/supabase/migrations/002_notifications.sql` - notifications table, RLS policies, unread/user indexes
- `platform/supabase/migrations/003_storage.sql` - task-attachments private bucket, client_id-scoped upload/read/admin policies
- `platform/src/lib/types.ts` - added NotificationType union + Notification interface after Tutorial type

## Decisions Made

- Followed all locked decisions D-01 through D-09 from CONTEXT.md verbatim
- SQL style follows 001_schema.sql patterns exactly (header comments, RLS block structure, index naming)
- TypeScript linter auto-formatted the NotificationType union to multi-line style — content is equivalent and correct

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migrations run when applied to Supabase via CLI or dashboard.

## Next Phase Readiness

- Phase 6 (notifications feature) can now import `Notification` and `NotificationType` from `@/lib/types`
- Phase 7 (realtime) can subscribe to the `notifications` table with `user_id` filter
- Phase 9 (file upload) can use the `task-attachments` bucket with signed URLs for reads
- Supabase Realtime REPLICA IDENTITY FULL must still be enabled in Supabase Dashboard before Phase 7 (existing blocker)

---
*Phase: 05-foundation*
*Completed: 2026-03-24*
