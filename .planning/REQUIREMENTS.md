# Requirements: Vantix Platform

**Defined:** 2026-03-24
**Core Value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma facil de reservar tiempo, todo lo demas falla.

## v1.1 Requirements

Requirements for Platform Hardening & Admin milestone. Each maps to roadmap phases.

### Testing Infrastructure

- [x] **TEST-01**: Vitest configured with Supabase manual mocks and test helpers
- [x] **TEST-02**: Unit tests for stripe.ts (getPriceId, formatCurrency, webhook signature)
- [x] **TEST-03**: Unit tests for slack.ts (channel creation, message posting)
- [x] **TEST-04**: Unit tests for onboard.ts (orchestration flow)
- [x] **TEST-05**: Playwright configured against local dev server with auth helpers
- [ ] **TEST-06**: E2E test: login flow (email/password → portal redirect)
- [ ] **TEST-07**: E2E test: task CRUD (create, edit, status change)
- [x] **TEST-08**: E2E test: admin route redirects client-role users to portal
- [x] **TEST-09**: CI check: i18n key parity between EN and ES JSON files

### Admin Dashboard

- [x] **ADMIN-01**: Middleware extended to protect /admin routes (admin/engineer/seller roles only)
- [x] **ADMIN-02**: Admin layout with role-gated sidebar navigation
- [x] **ADMIN-03**: Admin overview page with active clients count, MRR, recent activity
- [x] **ADMIN-04**: Client list page with search, subscription status, plan details
- [x] **ADMIN-05**: Cross-client task view with filtering by client, priority, status
- [x] **ADMIN-06**: Billing overview with MRR trend, recent payments, subscription statuses

### Notifications

- [ ] **NOTIF-01**: Notifications DB table with user_id, type, title, body, read status
- [x] **NOTIF-02**: In-app notification bell component with unread count badge
- [x] **NOTIF-03**: Notification dropdown with list, mark-as-read, mark-all-read
- [x] **NOTIF-04**: Supabase Realtime subscription filtered by user_id (cross-tenant safe)
- [x] **NOTIF-05**: Email notification on successful payment (Resend)
- [x] **NOTIF-06**: Email notification on failed payment (Resend)
- [x] **NOTIF-07**: Email notification on task status change
- [x] **NOTIF-08**: Slack message to client channel on new task created
- [x] **NOTIF-09**: NotificationBell mounted in both portal and admin layouts

### File Uploads

- [ ] **UPLOAD-01**: Supabase Storage bucket 'task-attachments' with private access
- [ ] **UPLOAD-02**: Storage RLS policies scoped to client_id path structure
- [x] **UPLOAD-03**: File upload UI in task comment form (drag-and-drop + click)
- [x] **UPLOAD-04**: Client-side file validation (size limit, allowed types)
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
| TEST-01 | Phase 5 | Complete |
| TEST-02 | Phase 5 | Complete |
| TEST-03 | Phase 5 | Complete |
| TEST-04 | Phase 5 | Complete |
| TEST-05 | Phase 5 | Complete |
| TEST-06 | Phase 9 | Pending |
| TEST-07 | Phase 9 | Pending |
| TEST-08 | Phase 8 | Complete |
| TEST-09 | Phase 5 | Complete |
| ADMIN-01 | Phase 8 | Complete |
| ADMIN-02 | Phase 8 | Complete |
| ADMIN-03 | Phase 8 | Complete |
| ADMIN-04 | Phase 8 | Complete |
| ADMIN-05 | Phase 8 | Complete |
| ADMIN-06 | Phase 8 | Complete |
| NOTIF-01 | Phase 5 | Pending |
| NOTIF-02 | Phase 7 | Complete |
| NOTIF-03 | Phase 7 | Complete |
| NOTIF-04 | Phase 7 | Complete |
| NOTIF-05 | Phase 6 | Complete |
| NOTIF-06 | Phase 6 | Complete |
| NOTIF-07 | Phase 6 | Complete |
| NOTIF-08 | Phase 6 | Complete |
| NOTIF-09 | Phase 7 | Complete |
| UPLOAD-01 | Phase 5 | Pending |
| UPLOAD-02 | Phase 5 | Pending |
| UPLOAD-03 | Phase 9 | Complete |
| UPLOAD-04 | Phase 9 | Complete |
| UPLOAD-05 | Phase 9 | Pending |
| UPLOAD-06 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
