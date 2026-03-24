# Requirements: Vantix Platform

**Defined:** 2026-03-24
**Core Value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma facil de reservar tiempo, todo lo demas falla.

## v1.1 Requirements

Requirements for Platform Hardening & Admin milestone. Each maps to roadmap phases.

### Testing Infrastructure

- [ ] **TEST-01**: Vitest configured with Supabase manual mocks and test helpers
- [ ] **TEST-02**: Unit tests for stripe.ts (getPriceId, formatCurrency, webhook signature)
- [ ] **TEST-03**: Unit tests for slack.ts (channel creation, message posting)
- [ ] **TEST-04**: Unit tests for onboard.ts (orchestration flow)
- [ ] **TEST-05**: Playwright configured against local dev server with auth helpers
- [ ] **TEST-06**: E2E test: login flow (email/password → portal redirect)
- [ ] **TEST-07**: E2E test: task CRUD (create, edit, status change)
- [ ] **TEST-08**: E2E test: admin route redirects client-role users to portal
- [ ] **TEST-09**: CI check: i18n key parity between EN and ES JSON files

### Admin Dashboard

- [ ] **ADMIN-01**: Middleware extended to protect /admin routes (admin/engineer/seller roles only)
- [ ] **ADMIN-02**: Admin layout with role-gated sidebar navigation
- [ ] **ADMIN-03**: Admin overview page with active clients count, MRR, recent activity
- [ ] **ADMIN-04**: Client list page with search, subscription status, plan details
- [ ] **ADMIN-05**: Cross-client task view with filtering by client, priority, status
- [ ] **ADMIN-06**: Billing overview with MRR trend, recent payments, subscription statuses

### Notifications

- [ ] **NOTIF-01**: Notifications DB table with user_id, type, title, body, read status
- [ ] **NOTIF-02**: In-app notification bell component with unread count badge
- [ ] **NOTIF-03**: Notification dropdown with list, mark-as-read, mark-all-read
- [ ] **NOTIF-04**: Supabase Realtime subscription filtered by user_id (cross-tenant safe)
- [ ] **NOTIF-05**: Email notification on successful payment (Resend)
- [ ] **NOTIF-06**: Email notification on failed payment (Resend)
- [ ] **NOTIF-07**: Email notification on task status change
- [ ] **NOTIF-08**: Slack message to client channel on new task created
- [ ] **NOTIF-09**: NotificationBell mounted in both portal and admin layouts

### File Uploads

- [ ] **UPLOAD-01**: Supabase Storage bucket 'task-attachments' with private access
- [ ] **UPLOAD-02**: Storage RLS policies scoped to client_id path structure
- [ ] **UPLOAD-03**: File upload UI in task comment form (drag-and-drop + click)
- [ ] **UPLOAD-04**: Client-side file validation (size limit, allowed types)
- [ ] **UPLOAD-05**: Image preview thumbnails for uploaded images in comments
- [ ] **UPLOAD-06**: Signed URL generation for file downloads (time-limited)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTIF-10**: Weekly email digest to clients (requires cron)
- **NOTIF-11**: User notification preferences (per-type opt-in/out)

### Admin

- **ADMIN-07**: Admin user management (invite, role change, deactivate)
- **ADMIN-08**: Admin MRR trend chart (Recharts)

### Testing

- **TEST-10**: Integration tests for API routes (checkout, billing-portal, webhook)
- **TEST-11**: Playwright visual regression tests

### Security

- **SEC-01**: Two-factor authentication
- **SEC-02**: Rate limiting on API routes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat between client and team | High complexity, Slack already covers async communication |
| Mobile app | Web-first, responsive design sufficient for current scale |
| Drag-and-drop file upload with progress bar | Basic upload first; enhance after usage validates need |
| Notification preferences UI | Over-engineering at current client count (<50) |
| Admin client creation UI | CLI/script workflow sufficient; defer until painful |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | — | Pending |
| TEST-02 | — | Pending |
| TEST-03 | — | Pending |
| TEST-04 | — | Pending |
| TEST-05 | — | Pending |
| TEST-06 | — | Pending |
| TEST-07 | — | Pending |
| TEST-08 | — | Pending |
| TEST-09 | — | Pending |
| ADMIN-01 | — | Pending |
| ADMIN-02 | — | Pending |
| ADMIN-03 | — | Pending |
| ADMIN-04 | — | Pending |
| ADMIN-05 | — | Pending |
| ADMIN-06 | — | Pending |
| NOTIF-01 | — | Pending |
| NOTIF-02 | — | Pending |
| NOTIF-03 | — | Pending |
| NOTIF-04 | — | Pending |
| NOTIF-05 | — | Pending |
| NOTIF-06 | — | Pending |
| NOTIF-07 | — | Pending |
| NOTIF-08 | — | Pending |
| NOTIF-09 | — | Pending |
| UPLOAD-01 | — | Pending |
| UPLOAD-02 | — | Pending |
| UPLOAD-03 | — | Pending |
| UPLOAD-04 | — | Pending |
| UPLOAD-05 | — | Pending |
| UPLOAD-06 | — | Pending |

**Coverage:**
- v1.1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initial definition*
