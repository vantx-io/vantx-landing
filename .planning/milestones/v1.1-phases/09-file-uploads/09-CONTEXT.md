# Phase 9: File Uploads - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Team members and clients can attach files to task comments, view image previews inline, and download files via time-limited signed URLs. Storage is private and scoped per client. Also delivers two E2E tests: login flow (TEST-06) and task CRUD (TEST-07).

</domain>

<decisions>
## Implementation Decisions

### Upload Interaction
- **D-01:** Paperclip/attach button next to send button opens native file picker. Drag-and-drop is supported on the entire comment area (implicit zone — no always-visible dashed border)
- **D-02:** Selected files show as a preview strip between input and send button: image thumbnails for images, file icon + name for non-images
- **D-03:** Per-file progress bars in the preview strip during upload to Supabase Storage
- **D-04:** Invalid files rejected individually with inline error (e.g., "file.exe — executables not allowed") — valid files in the batch are kept

### Attachment Display in Comments
- **D-05:** Image thumbnails at 120×120px — recognizable without bloating the thread
- **D-06:** Click image thumbnail opens lightbox/modal with full-size image (stays in app, no new tab)
- **D-07:** Non-image files render as: file type icon + filename + file size + type badge (e.g., "PDF", "HAR") — click to download via signed URL
- **D-08:** Mixed layout: images in a horizontal row/grid, non-image files as a compact list below the image row. Both below the comment text

### File Validation (locked from Phase 5)
- **D-09:** Max 50 MB per file (enforced client-side + bucket-level)
- **D-10:** Block executables only (.exe, .sh, .bat, .cmd, .ps1, .msi, .dll, .so) — all other types allowed
- **D-11:** No limit on number of files per comment

### Signed URLs
- **D-12:** All file access via time-limited signed URLs — no permanent public URLs stored in DB
- **D-13:** `attachments TEXT[]` stores storage paths (not URLs) — signed URLs generated at display time

### E2E Tests
- **D-14:** TEST-06 (login flow): happy path (email/password → portal redirect) + wrong password shows error message
- **D-15:** TEST-07 (task CRUD): full journey — create task + edit title + change status + add comment with file attachment. Proves entire feature end-to-end
- **D-16:** Cross-tenant file isolation E2E test: User B cannot download User A's attachments via storage RLS. Same dual-context pattern as Phase 7 cross-tenant notification test
- **D-17:** No test data cleanup — test DB resets between runs; no afterEach teardown needed

### Claude's Discretion
- Signed URL expiry duration (reasonable default, e.g., 1 hour)
- Lightbox/modal implementation (simple overlay vs library)
- File type icon selection per MIME category
- Progress bar styling and animation
- Whether to upload files client-side (browser → Supabase Storage) or server-side (browser → API route → Storage)
- Drag-and-drop visual feedback (border highlight color/style during drag-over)
- react-dropzone vs native HTML5 drag-and-drop API
- Comment API route structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Storage & Schema
- `platform/supabase/migrations/003_storage.sql` — Bucket config (private, 50MB limit), RLS policies (client path-scoped upload/read, admin read-all)
- `platform/supabase/migrations/001_schema.sql` — `task_comments` table with `attachments TEXT[]` field, RLS policies
- `platform/supabase/migrations/002_admin_rls.sql` — Admin/engineer/seller cross-client access policies (applies to storage too via 003)
- `platform/src/lib/types.ts` — `TaskComment` type with `attachments: string[] | null`

### Task UI (to extend)
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Current task page with comment form (text input + send), comment display, task list with expand/collapse
- `platform/src/app/api/tasks/route.ts` — Existing POST /api/tasks with `notifyTaskEvent()` pattern

### Supabase Clients
- `platform/src/lib/supabase/client.ts` — Browser client for `.storage.from('task-attachments').upload()` and `.createSignedUrl()`
- `platform/src/lib/supabase/server.ts` — Service client for server-side storage operations

### E2E Test Patterns
- `platform/e2e/auth.setup.ts` — Auth setup with storageState pattern
- `platform/e2e/cross-tenant.spec.ts` — Dual browser context pattern for tenant isolation tests
- `platform/e2e/portal.spec.ts` — Basic authenticated route test
- `platform/playwright.config.ts` — Test project configuration

### Prior Phase Context
- `.planning/phases/05-foundation/05-CONTEXT.md` — D-01 through D-05: storage decisions (size, types, path structure, private bucket)
- `.planning/phases/08-admin-dashboard/08-CONTEXT.md` — Admin layout, cross-client query patterns

### i18n
- `platform/src/messages/en.json` / `es.json` — Add upload-related keys to tasks namespace

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TaskComment.attachments: string[] | null`: Schema field ready — stores storage paths, not URLs
- `task-attachments` bucket: Already created with RLS policies (003_storage.sql)
- `createClient()`: Browser Supabase client supports `.storage.from().upload()` and `.createSignedUrl()` directly
- `notifyTaskEvent()`: Orchestrator pattern for task-related side effects — could extend for comment events if needed
- Cross-tenant E2E pattern from `cross-tenant.spec.ts`: Dual browser contexts + service role insert — reuse for storage isolation test
- Badge component and color maps from portal pages — reuse for file type badges

### Established Patterns
- **Client components**: `"use client"` + useState + useEffect + `createClient()` — task page follows this
- **API routes**: `export async function POST(req)` with try/catch + `NextResponse.json()` — follow for comment creation
- **Fire-and-forget**: Side effects (notifications) don't block API response
- **i18n**: `useTranslations('tasks')` namespace per page
- **Styling**: Tailwind CSS, white cards on light background, consistent with portal

### Integration Points
- `platform/src/app/[locale]/portal/tasks/page.tsx` — Extend comment form with file input, extend comment display with attachment rendering
- `platform/src/app/api/tasks/[taskId]/comments/route.ts` — New: API route for comment creation with file upload
- `platform/src/messages/en.json` / `es.json` — New upload/attachment i18n keys
- `platform/e2e/login.spec.ts` — New: TEST-06 login flow test
- `platform/e2e/task-crud.spec.ts` — New: TEST-07 full task CRUD journey
- `platform/e2e/storage-isolation.spec.ts` — New: cross-tenant file access test

</code_context>

<specifics>
## Specific Ideas

- Paperclip button keeps the comment form clean — drag-and-drop is there for power users but doesn't clutter the default view
- Lightbox for images keeps users in context (B2B portal, not a photo gallery — simple overlay is fine)
- Per-file progress bars give confidence on large files (HAR files, video repros can be 10-50MB)
- Mixed attachment layout (image grid + file list) naturally handles the common case of mixed uploads in performance engineering context

</specifics>

<deferred>
## Deferred Ideas

- Comment editing/deletion (comments are currently immutable — add if requested)
- Attachment deletion after comment is posted
- Admin bulk file management / storage usage dashboard
- File versioning (re-upload same filename)
- Real-time comment updates via Supabase Realtime subscription
- Drag-and-drop reordering of attachments

</deferred>

---

*Phase: 09-file-uploads*
*Context gathered: 2026-03-25*
