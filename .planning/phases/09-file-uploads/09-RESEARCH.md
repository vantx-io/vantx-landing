# Phase 09: File Uploads - Research

**Researched:** 2026-03-25
**Domain:** Supabase Storage, react-dropzone, Playwright E2E, signed URLs, file validation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Upload Interaction**
- D-01: Paperclip/attach button next to send button opens native file picker. Drag-and-drop is supported on the entire comment area (implicit zone — no always-visible dashed border)
- D-02: Selected files show as a preview strip between input and send button: image thumbnails for images, file icon + name for non-images
- D-03: Per-file progress bars in the preview strip during upload to Supabase Storage
- D-04: Invalid files rejected individually with inline error (e.g., "file.exe — executables not allowed") — valid files in the batch are kept

**Attachment Display in Comments**
- D-05: Image thumbnails at 120x120px
- D-06: Click image thumbnail opens lightbox/modal with full-size image (stays in app, no new tab)
- D-07: Non-image files render as: file type icon + filename + file size + type badge — click to download via signed URL
- D-08: Mixed layout: images in a horizontal row/grid, non-image files as a compact list below the image row

**File Validation (locked from Phase 5)**
- D-09: Max 50 MB per file (enforced client-side + bucket-level)
- D-10: Block executables only (.exe, .sh, .bat, .cmd, .ps1, .msi, .dll, .so) — all other types allowed
- D-11: No limit on number of files per comment

**Signed URLs**
- D-12: All file access via time-limited signed URLs — no permanent public URLs stored in DB
- D-13: `attachments TEXT[]` stores storage paths (not URLs) — signed URLs generated at display time

**E2E Tests**
- D-14: TEST-06 (login flow): happy path (email/password → portal redirect) + wrong password shows error message
- D-15: TEST-07 (task CRUD): full journey — create task + edit title + change status + add comment with file attachment
- D-16: Cross-tenant file isolation E2E test: User B cannot download User A's attachments via storage RLS
- D-17: No test data cleanup — test DB resets between runs; no afterEach teardown needed

### Claude's Discretion
- Signed URL expiry duration (reasonable default, e.g., 1 hour)
- Lightbox/modal implementation (simple overlay vs library)
- File type icon selection per MIME category
- Progress bar styling and animation
- Whether to upload files client-side (browser → Supabase Storage) or server-side (browser → API route → Storage)
- Drag-and-drop visual feedback (border highlight color/style during drag-over)
- react-dropzone vs native HTML5 drag-and-drop API
- Comment API route structure

### Deferred Ideas (OUT OF SCOPE)
- Comment editing/deletion
- Attachment deletion after comment is posted
- Admin bulk file management / storage usage dashboard
- File versioning (re-upload same filename)
- Real-time comment updates via Supabase Realtime subscription
- Drag-and-drop reordering of attachments
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPLOAD-03 | File upload UI in task comment form (drag-and-drop + click) | react-dropzone v15 useDropzone hook, D-01/D-02/D-03/D-04 |
| UPLOAD-04 | Client-side file validation (size limit, allowed types) | react-dropzone accept/maxSize props + custom blocked-extension check |
| UPLOAD-05 | Image preview thumbnails for uploaded images in comments | Object.createObjectURL + img tag at 120x120, signed URL display at render time |
| UPLOAD-06 | Signed URL generation for file downloads (time-limited) | supabase.storage.from().createSignedUrl(path, 3600) |
| TEST-06 | E2E test: login flow (email/password → portal redirect) | New e2e/login.spec.ts — extends auth.setup.ts pattern |
| TEST-07 | E2E test: task CRUD (create, edit, status change, comment with attachment) | New e2e/task-crud.spec.ts — page.setInputFiles() for file attachment |
</phase_requirements>

## Summary

Phase 9 adds file upload capability to the existing task comment form, plus two E2E tests. The infrastructure is largely pre-built: the `task-attachments` Supabase Storage bucket exists (private, 50MB limit) with RLS policies scoped by `client_id` path prefix. The `task_comments.attachments TEXT[]` column already stores paths. The code gap is entirely in the UI layer — the comment form needs an attach button, preview strip, progress bars, and the comment display needs to render attachments (image thumbnails with lightbox, non-image file cards with signed-URL download).

The most important architectural decision is **client-side direct upload** (browser → Supabase Storage using the browser client's anon key + user session). This avoids Next.js API route body size limits (1MB default) which would be fatal for 50MB HAR files. The RLS policies in `003_storage.sql` already enforce client-scoping server-side, so no additional API layer is needed for storage writes.

The most significant technical gap is **upload progress**: the Supabase JS SDK (`supabase.storage.from().upload()`) does not emit native progress events. The options are: (a) simulate progress with a fake ticker, (b) use raw `XMLHttpRequest` with `xhr.upload.onprogress` and manually constructed storage URL + auth token. The XHR approach provides real progress but uses semi-private API internals. Given files up to 50MB, a simulated ticker (0%→90% during upload, 100% on resolve) is the pragmatic choice unless the planner chooses XHR.

The two E2E tests (TEST-06, TEST-07) follow established project patterns: `storageState`-based auth setup, `page.setInputFiles()` for file attachment simulation, and the dual-context cross-tenant pattern for storage isolation (D-16).

**Primary recommendation:** Use client-side direct upload (browser → Supabase). Use react-dropzone v15 with `useDropzone`. Simulate progress with a fake ticker. Use `createSignedUrl(path, 3600)` (1-hour expiry) at display time.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-dropzone | ^15.0.0 | Drag-and-drop + file picker hook | Already flagged in STATE.md; hooks API, no headless component overhead |
| @supabase/ssr | ^0.9.0 (already installed) | Browser client for Storage upload and signed URL | Already in use; `createClient()` supports `.storage.from().upload()` directly |
| lucide-react | ^1.6.0 (already installed) | File type icons (FileText, FileArchive, File, etc.) | Already in dependencies; consistent with portal icon usage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| native URL.createObjectURL | Browser built-in | Local image preview thumbnail before/after upload | For showing preview strip thumbnails without re-fetching |
| native XMLHttpRequest | Browser built-in | Real upload progress events | Only if simulated progress is insufficient for UX |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Native HTML5 drag-and-drop API | More code, no built-in file validation, same behavior |
| react-dropzone | Uppy + Tus | Resumable uploads, real progress, but heavy (~100KB) — overkill for B2B portal |
| Simulated progress ticker | XHR + `xhr.upload.onprogress` | Real progress but uses `supabase._getAuthHeaders()` (private API, may break on SDK upgrades) |
| Simple overlay lightbox | `yet-another-react-lightbox` | Full-featured but another dep; simple `<dialog>` overlay is sufficient for B2B portal |

**Installation:**
```bash
cd platform && npm install react-dropzone
```

**Version verification:** react-dropzone current version on npm registry as of 2026-03-25 is `15.0.0`.

Note: `react-dropzone` is NOT currently in `platform/package.json` — it must be installed. All other required packages are already present.

## Architecture Patterns

### Recommended Project Structure
```
platform/src/app/[locale]/portal/tasks/
├── page.tsx                      # Extend: comment form with upload + attachment display
├── CommentForm.tsx               # New component (extract from page.tsx): text + attach + preview strip
├── AttachmentPreview.tsx         # New component: renders attachments in comment thread
└── Lightbox.tsx                  # New component: full-size image overlay modal

platform/src/app/api/tasks/
├── route.ts                      # Existing: POST /api/tasks (no changes needed)
└── [taskId]/comments/
    └── route.ts                  # New: POST /api/tasks/:taskId/comments

platform/e2e/
├── login.spec.ts                 # New: TEST-06 login flow
├── task-crud.spec.ts             # New: TEST-07 task CRUD with attachment
└── storage-isolation.spec.ts     # New: D-16 cross-tenant storage RLS
```

### Pattern 1: Client-Side Direct Upload to Supabase Storage
**What:** Browser uploads file directly to Supabase Storage using the browser Supabase client. No intermediate API route needed.
**When to use:** When files may exceed 1MB (Next.js API route body limit). RLS policies enforce authorization server-side.
**Storage path format:** `{client_id}/{task_id}/{timestamp}-{filename}` — matches 003_storage.sql RLS that checks `(storage.foldername(name))[1] = client_id::text`

```typescript
// Source: Supabase JS SDK + project client.ts pattern
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const path = `${clientId}/${taskId}/${Date.now()}-${file.name}`;

const { data, error } = await supabase.storage
  .from("task-attachments")
  .upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

if (error) throw error;
// data.path is the storage path — store in attachments[]
```

### Pattern 2: Signed URL Generation at Display Time
**What:** Storage paths saved in DB. When rendering comments, call `createSignedUrl` per path to get a time-limited URL.
**When to use:** All attachment display. No permanent public URLs stored.

```typescript
// Source: Supabase JS SDK docs
const { data, error } = await supabase.storage
  .from("task-attachments")
  .createSignedUrl(storagePath, 3600); // 1 hour expiry

if (data?.signedUrl) {
  // Use data.signedUrl for img src or download href
}
```

### Pattern 3: react-dropzone v15 useDropzone
**What:** Hook-based drag-and-drop with built-in validation. v15 breaking change: `isDragReject` only reflects active drag — use `fileRejections` for post-drop rejection state.
**When to use:** Comment form attach functionality.

```typescript
// Source: react-dropzone official docs
import { useDropzone } from "react-dropzone";

const BLOCKED_EXTENSIONS = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".msi", ".dll", ".so"];

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  maxSize: 52_428_800, // 50MB — matches bucket limit
  noClick: true,       // paperclip button triggers click separately
  onDrop: (acceptedFiles, fileRejections) => {
    // fileRejections: files that failed maxSize check
    // Custom extension check for acceptedFiles:
    const { valid, blocked } = acceptedFiles.reduce(...)
    handleFilesSelected(valid);
    handleRejections([...fileRejections, ...blocked]);
  },
});
```

**Note on `accept` prop:** D-10 blocks only specific extensions, not MIME categories. react-dropzone's `accept` prop works by MIME type (not extension). Since we allow all MIME types except a short blocklist of extensions, the cleaner approach is to NOT use the `accept` prop and instead validate file extensions manually in `onDrop` against `BLOCKED_EXTENSIONS`. This avoids platform-specific MIME detection issues (CSV reported differently on macOS vs Windows).

### Pattern 4: Comment Submission with Attachments
**What:** Files uploaded to storage first, then paths saved with comment insert.
**When to use:** All comment submission with attachments.

```typescript
// API route: POST /api/tasks/[taskId]/comments
// Body: { user_id, content, attachments: string[] }
// Uses createServiceClient() — consistent with existing route.ts pattern

const { data: comment, error } = await supabase
  .from("task_comments")
  .insert({
    task_id: taskId,
    user_id: body.user_id,
    content: body.content,
    attachments: body.attachments ?? null,
  })
  .select()
  .single();
```

### Pattern 5: Playwright File Upload Testing
**What:** `page.setInputFiles()` sets files on a hidden or visible `<input type="file">`. Works even on hidden inputs.
**When to use:** TEST-07 task CRUD E2E test to simulate attachment.

```typescript
// Source: Playwright docs
// For hidden input triggered by button:
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.getByRole("button", { name: /attach/i }).click(),
]);
await fileChooser.setFiles(path.join(__dirname, "fixtures/test-file.txt"));

// OR direct setInputFiles if input is accessible:
await page.locator('input[type="file"]').setInputFiles(
  path.join(__dirname, "fixtures/test-file.txt")
);
```

### Anti-Patterns to Avoid
- **Storing signed URLs in DB:** Only store storage paths. Signed URLs expire — if stored, they become stale. (D-12, D-13)
- **Uploading via API route:** Files up to 50MB will fail — Next.js API routes default to 1MB body limit. Upload client-side directly to Supabase Storage.
- **Using `accept` prop for extension blocking:** react-dropzone `accept` works on MIME types. Extension-based blocklist must be implemented in `onDrop` callback, not via `accept` prop.
- **Generating signed URLs server-side and caching:** Signed URLs should be generated fresh per page render/request. Do not cache in state between sessions.
- **Inline progress with Supabase SDK native calls:** The SDK `.upload()` method does not emit progress events. Plan for simulated progress or XHR-based tracking.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop zone | Custom dragover/drop event handlers | react-dropzone `useDropzone` | Cross-browser edge cases (Firefox MIME detection, dropEffect, dataTransfer) |
| File type icons | Custom SVG per extension | `lucide-react` (already installed): `FileText`, `Archive`, `Code`, `File` | Already a dependency; consistent icon style |
| Storage path construction | Ad-hoc string concatenation | Explicit pattern: `${clientId}/${taskId}/${Date.now()}-${filename}` | Must match `(storage.foldername(name))[1]` RLS check in 003_storage.sql |
| Image lightbox | Complex custom portal + scroll lock | Simple `<dialog>` element with `showModal()` + `::backdrop` | B2B portal, not a photo gallery; native dialog handles focus trap and backdrop |

**Key insight:** The RLS policy in `003_storage.sql` uses `(storage.foldername(name))[1]` to extract the first path segment. If the upload path doesn't start with `{clientId}/`, the upload will be silently rejected with a 403. The path construction must be exact.

## Common Pitfalls

### Pitfall 1: Storage RLS Path Mismatch
**What goes wrong:** Upload silently fails with "new row violates row-level security policy" or a 403 error.
**Why it happens:** `003_storage.sql` requires `(storage.foldername(name))[1] = client_id::text`. If the path is `{taskId}/{filename}` instead of `{clientId}/{taskId}/{filename}`, the first segment is `taskId`, not `clientId`, and RLS rejects the insert.
**How to avoid:** Always construct paths as `${clientId}/${taskId}/${timestamp}-${filename}`. Verify `clientId` is loaded (non-null) before upload.
**Warning signs:** Upload returns `{ error: { message: "new row violates row-level security policy" } }` or HTTP 403.

### Pitfall 2: react-dropzone v15 isDragReject Behavior Change
**What goes wrong:** Post-drop rejection UI (inline errors per file) never appears.
**Why it happens:** In v15, `isDragReject` only reflects active drag state and is cleared after drop. Code that relied on `isDragReject` persisting will miss rejections.
**How to avoid:** Use `fileRejections` array from `onDrop` callback for post-drop error display, not `isDragReject`.
**Warning signs:** Files appear to be accepted in UI despite exceeding size limit.

### Pitfall 3: Upload Progress Illusion
**What goes wrong:** Progress bar jumps to 100% instantly for large files, or never updates during upload.
**Why it happens:** `supabase.storage.from().upload()` is a single fetch call — no progress events. A simulated ticker using `setInterval` at fixed increments stops at 90% and resolves to 100% on promise settle.
**How to avoid:** Use the simulated ticker pattern. Set progress to 90% max during upload, then to 100% on `data` return. Never leave at 100% while awaiting `insert`.
**Warning signs:** User sees no feedback during 30+ second uploads of large HAR files.

### Pitfall 4: Signed URL Staleness in Long Sessions
**What goes wrong:** Image thumbnails stop loading or download links 403 after 1 hour in a long session.
**Why it happens:** Signed URLs expire (1 hour). If rendered once on comment load and never refreshed, they expire.
**How to avoid:** Generate signed URLs on each render of the comment thread (re-fetch on expand/re-open). Alternatively generate on user action (click to download) rather than on load for non-image files. For image thumbnails, regenerate on page load.
**Warning signs:** `<img>` tags return 403 after extended session.

### Pitfall 5: Next.js API Route Body Limit for Server-Side Upload
**What goes wrong:** File uploads >1MB fail with "request entity too large" if routed through an API route.
**Why it happens:** Next.js App Router API routes default to 1MB body size limit. Increasing `bodyParser` limit to 50MB adds significant memory pressure per concurrent upload.
**How to avoid:** Upload client-side directly to Supabase Storage (browser → Supabase). The comment API route only receives `{ content, attachments: string[] }` (paths, not file data).
**Warning signs:** Error occurs only on files >1MB.

### Pitfall 6: Multiple Comments State Issue
**What goes wrong:** Signed URLs are loaded for all comments at once, causing O(N×M) storage calls on comment expand.
**Why it happens:** If `attachments` are resolved eagerly for all comments, expanding a task with many comments triggers many `createSignedUrl` calls simultaneously.
**How to avoid:** Lazy-generate signed URLs only for visible/expanded comments. For images, generate on component mount. For non-images, generate on click (download action).
**Warning signs:** Network tab shows many simultaneous storage requests on task expand.

### Pitfall 7: Cross-Tenant Storage RLS Gap (seller role)
**What goes wrong:** Seller role cannot read client attachments for support purposes.
**Why it happens:** `003_storage.sql` admin read policy only includes `('admin', 'engineer')` — does not include `seller`. The `002_admin_rls.sql` pattern added seller to table policies but 003 was created independently.
**How to avoid:** Check 003_storage.sql admin policy — it currently only has `('admin', 'engineer')`. If seller needs storage read access, add a migration patch. This must be decided before implementation.
**Warning signs:** Seller role gets 403 when viewing client attachments in admin view.

## Code Examples

Verified patterns from official sources and project codebase:

### Storage Upload (client-side)
```typescript
// Source: Supabase JS SDK / project createClient() pattern
const supabase = createClient(); // from "@/lib/supabase/client"

async function uploadFile(file: File, clientId: string, taskId: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${clientId}/${taskId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from("task-attachments")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;
  return data.path; // Store this path in attachments[]
}
```

### Signed URL for Download
```typescript
// Source: Supabase JS SDK docs (supalaunch.com verified)
async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("task-attachments")
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
```

### File Validation Logic
```typescript
// Source: react-dropzone docs + project decision D-10
const BLOCKED_EXTENSIONS = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".msi", ".dll", ".so"];

function isBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

// In onDrop callback:
const valid: File[] = [];
const blocked: { file: File; reason: string }[] = [];

for (const file of acceptedFiles) {
  if (isBlockedExtension(file.name)) {
    blocked.push({ file, reason: "executables not allowed" });
  } else {
    valid.push(file);
  }
}
```

### react-dropzone Hook Setup
```typescript
// Source: react-dropzone v15 API
import { useDropzone } from "react-dropzone";

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  maxSize: 52_428_800,          // 50MB — matches 003_storage.sql bucket limit
  noClick: true,                // paperclip button handles click separately
  multiple: true,               // D-11: no limit on file count
  onDrop: (accepted, rejections) => {
    // rejections: exceeded maxSize (fileRejections in v15 post-drop)
    // also run custom extension check on accepted
  },
});
```

### Simulated Progress Ticker
```typescript
// Source: community pattern (Supabase SDK has no native upload progress)
function uploadWithProgress(
  file: File,
  path: string,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let pct = 0;
    const ticker = setInterval(() => {
      pct = Math.min(pct + 8, 90);
      onProgress(pct);
    }, 300);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .upload(path, file, { upsert: false });
      clearInterval(ticker);
      if (error) { onProgress(0); reject(error); return; }
      onProgress(100);
      resolve(data.path);
    } catch (err) {
      clearInterval(ticker);
      onProgress(0);
      reject(err);
    }
  });
}
```

### Playwright File Upload (filechooser pattern)
```typescript
// Source: Playwright docs — for hidden input triggered by button click
test("can attach file to comment", async ({ page }) => {
  // Navigate to task with comments
  await page.goto("/en/portal/tasks");
  // Expand a task
  await page.locator(".task-row").first().click();

  // Trigger filechooser via paperclip button
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /attach/i }).click(),
  ]);
  await fileChooser.setFiles(path.join(__dirname, "fixtures/test.txt"));

  // Type comment content and submit
  await page.getByPlaceholder(/write a comment/i).fill("See attached file");
  await page.getByRole("button", { name: /send/i }).click();

  // Verify attachment appears in comment thread
  await expect(page.getByText("test.txt")).toBeVisible();
});
```

### Cross-Tenant Storage Isolation E2E (D-16)
```typescript
// Source: cross-tenant.spec.ts pattern (already in project)
// Use dual browser contexts + service role insert
// Upload file as User A via service role, attempt signed URL as User B
// Expect: User B's createSignedUrl call returns error or 403

test("User B cannot access User A attachments", async ({ browser }) => {
  // 1. Admin inserts a task_comment row with attachments for User A's client
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  // 2. User A context: can load signed URL — expect HTTP 200
  // 3. User B context: cannot load signed URL — expect HTTP 400/403
  // RLS: storage.objects SELECT policy checks client_id path segment
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate file upload page | Inline upload in comment form | Industry standard | UX — no context switch |
| `fileRejections` via `isDragReject` | `fileRejections` via `onDrop` callback | react-dropzone v15 | Must use callback, not state |
| Permanent public URLs in DB | Signed URLs generated at display time | Supabase RLS-first design | No URL leakage across tenants |
| Server-side file relay (API route) | Direct browser → Supabase upload | Next.js 13+ App Router | Bypasses 1MB body limit |

**Deprecated/outdated:**
- `accept` prop as string (e.g., `accept="image/*"`): react-dropzone v6+ requires object format `{ 'image/*': [] }`
- `supabase._getAuthHeaders()`: Private API, not documented. Use `supabase.auth.getSession()` to get `access_token` if XHR approach is chosen.

## Open Questions

1. **Seller role storage access gap**
   - What we know: `003_storage.sql` admin policy includes only `('admin', 'engineer')`, not `seller`. `002_admin_rls.sql` added seller to table policies.
   - What's unclear: Does the seller role need to read client attachments (e.g., for support/admin views in Phase 8)?
   - Recommendation: Add a migration `004_storage_seller_rls.sql` that adds `seller` to the storage admin policy, consistent with `002_admin_rls.sql` pattern. Low risk.

2. **Comment API route: authenticated user identity**
   - What we know: The current `addComment` in `page.tsx` inserts directly from the browser client using `user_id` from state. The CONTEXT.md mentions a new `/api/tasks/[taskId]/comments/route.ts`.
   - What's unclear: Should the comment API route use the service client (and trust `user_id` from body) or the SSR client (and extract user from session)?
   - Recommendation: Use the SSR server client (`createServerClient`) to extract the authenticated `user.id` from the request cookie — do not trust `user_id` from the request body. This is more secure and consistent with the admin dashboard patterns from Phase 8.

3. **react-dropzone v15 peer dependency compatibility**
   - What we know: react-dropzone v15 peer dep is `react >= 16.8 || 18.0.0`. Project uses Next.js 14 with React 18.
   - What's unclear: Whether `^15.0.0` resolves to 15.0.0 at install time (no newer minor/patch releases yet).
   - Recommendation: Verified npm registry shows 15.0.0 as current version. Install `react-dropzone@^15.0.0`. STATE.md concern about `^14.x` is now moot — install v15 directly.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (E2E) + Vitest (unit) |
| Config file | `platform/playwright.config.ts` |
| Quick run command | `cd platform && npx playwright test e2e/login.spec.ts e2e/task-crud.spec.ts --project=chromium` |
| Full suite command | `cd platform && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPLOAD-03 | File attach button opens file picker, drag-drop supported | E2E | `npx playwright test e2e/task-crud.spec.ts --project=chromium` | No — Wave 0 |
| UPLOAD-04 | .exe file rejected with inline error; valid file accepted | E2E | `npx playwright test e2e/task-crud.spec.ts --project=chromium` | No — Wave 0 |
| UPLOAD-05 | Image attachment renders as 120x120 thumbnail in comment | E2E | `npx playwright test e2e/task-crud.spec.ts --project=chromium` | No — Wave 0 |
| UPLOAD-06 | Non-image click generates signed URL; no public URL in DB | E2E | `npx playwright test e2e/task-crud.spec.ts --project=chromium` | No — Wave 0 |
| TEST-06 | Login happy path redirects to portal; wrong password shows error | E2E | `npx playwright test e2e/login.spec.ts --project=chromium` | No — Wave 0 |
| TEST-07 | Full task CRUD: create + edit + status change + comment with attachment | E2E | `npx playwright test e2e/task-crud.spec.ts --project=chromium` | No — Wave 0 |
| D-16 | User B cannot access User A storage attachments | E2E | `npx playwright test e2e/storage-isolation.spec.ts --project=cross-tenant` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd platform && npx playwright test e2e/login.spec.ts --project=chromium`
- **Per wave merge:** `cd platform && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/e2e/login.spec.ts` — covers TEST-06 login happy path + wrong password error
- [ ] `platform/e2e/task-crud.spec.ts` — covers TEST-07 + UPLOAD-03/04/05/06
- [ ] `platform/e2e/storage-isolation.spec.ts` — covers D-16 cross-tenant storage RLS
- [ ] `platform/e2e/fixtures/test.txt` — minimal fixture file for attachment tests
- [ ] `platform/e2e/fixtures/test.jpg` or `test.png` — image fixture for thumbnail test
- [ ] `platform/playwright.config.ts` — add `storage-isolation` project (follows cross-tenant pattern)

## Sources

### Primary (HIGH confidence)
- Project codebase: `platform/supabase/migrations/003_storage.sql` — bucket config, RLS policies verified
- Project codebase: `platform/src/lib/types.ts` — `TaskComment.attachments: string[] | null` confirmed
- Project codebase: `platform/src/app/[locale]/portal/tasks/page.tsx` — current comment form state confirmed (no file support)
- Project codebase: `platform/playwright.config.ts` — project structure, auth patterns
- Project codebase: `platform/e2e/cross-tenant.spec.ts` — dual context pattern for storage isolation test
- npm registry: react-dropzone@15.0.0 — current version verified 2026-03-25
- npm registry: react-dropzone peerDependencies — `react >= 16.8 || 18.0.0` (compatible with React 18)

### Secondary (MEDIUM confidence)
- [Supabase Storage upload docs](https://supabase.com/docs/reference/javascript/storage-from-upload) — `upload(path, file, options)` API confirmed
- [supalaunch.com file upload guide](https://supalaunch.com/blog/file-upload-nextjs-supabase) — `createSignedUrl(path, seconds)` pattern verified; confirmed no native progress
- [react-dropzone GitHub releases](https://github.com/react-dropzone/react-dropzone/releases) — v15 breaking change: `isDragReject` cleared after drop, use `fileRejections`
- [Playwright filechooser docs](https://www.checklyhq.com/docs/learn/playwright/testing-file-uploads/) — `page.waitForEvent("filechooser")` + `fileChooser.setFiles()` pattern

### Tertiary (LOW confidence)
- [Supabase storage issue #23](https://github.com/supabase/storage/issues/23) — XHR progress approach with `supabase._getAuthHeaders()` (private API, use with caution)
- [Storage Progress Bar discussion](https://github.com/orgs/supabase/discussions/6879) — confirms no official progress support as of 2026

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-dropzone version npm-verified; Supabase SDK already in project
- Architecture: HIGH — storage bucket + RLS + schema all exist; upload path format directly verified from 003_storage.sql
- Pitfalls: HIGH — RLS path mismatch verified from SQL source; progress limitation verified from multiple sources
- E2E patterns: HIGH — cross-tenant pattern exists in codebase; Playwright setInputFiles verified from official docs

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable libraries; Supabase Storage API is stable)
