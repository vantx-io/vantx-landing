# Requirements: Vantix Platform

**Defined:** 2026-03-24
**Core Value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma facil de reservar tiempo, todo lo demas falla.

## v1.2 Requirements

Requirements for Security & Polish milestone. Each maps to roadmap phases.

### Security

- [ ] **SEC-01**: User can enable TOTP 2FA via enrollment page with QR code
- [ ] **SEC-02**: User sees TOTP challenge page after login when 2FA is enrolled
- [ ] **SEC-03**: Admin routes enforce AAL2 (2FA verified) in middleware
- [ ] **SEC-04**: API routes are rate-limited via Upstash Redis sliding window
- [ ] **SEC-05**: Rate-limited users receive 429 response with retry-after header

### Notifications

- [ ] **NOTIF-10**: Client receives weekly Monday email digest of task activity
- [ ] **NOTIF-11**: User can toggle notification preferences per type (email, in-app) in portal settings
- [ ] **NOTIF-12**: Notification preferences are enforced at send time in notifyTaskEvent

### Admin

- [ ] **ADMIN-07**: Admin can invite new users by email with role and client assignment
- [ ] **ADMIN-08**: Invited user's public profile row is auto-created via DB trigger on acceptance
- [ ] **ADMIN-09**: Admin can change user role
- [ ] **ADMIN-10**: Admin can deactivate/reactivate user accounts
- [ ] **ADMIN-11**: Admin can view MRR trend chart on billing page (Recharts)

### Testing

- [ ] **TEST-10**: Integration tests cover API routes (checkout, billing-portal, webhook) using NTARH + MSW
- [ ] **TEST-11**: Playwright visual regression baselines for portal and admin pages (CI-generated)

## v1.1 Requirements (Complete)

All 30 requirements shipped and verified. See `.planning/milestones/v1.1-REQUIREMENTS.md` for details.

### Testing Infrastructure

- [x] **TEST-01** through **TEST-09**: Vitest + Playwright + CI infrastructure (9/9 complete)

### Admin Dashboard

- [x] **ADMIN-01** through **ADMIN-06**: Middleware, layout, overview, clients, tasks, billing (6/6 complete)

### Notifications

- [x] **NOTIF-01** through **NOTIF-09**: DB table, bell, dropdown, Realtime, email, Slack (9/9 complete)

### File Uploads

- [x] **UPLOAD-01** through **UPLOAD-06**: Storage bucket, RLS, upload UI, validation, thumbnails, signed URLs (6/6 complete)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTIF-13**: Per-user digest schedule (timezone-aware weekly/daily toggle)

### Admin

- **ADMIN-12**: MRR chart subscription overlay (new/cancelled markers)
- **ADMIN-13**: Admin-assisted 2FA unenrollment UI

### Security

- **SEC-06**: SMS/phone 2FA (only if enterprise client mandates)
- **SEC-07**: Recovery codes for 2FA

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat between client and team | High complexity, Slack already covers async communication |
| Mobile app | Web-first, responsive design sufficient for current scale |
| In-memory rate limiting | Broken by design on Vercel serverless; Upstash mandatory |
| `speakeasy`/`otplib` for TOTP | Supabase handles full MFA lifecycle natively |
| `node-cron`/`agenda`/`bull` for scheduling | Require persistent workers incompatible with Vercel |
| Visual regression against external iframes | Mask or skip; test first-party UI only |
| Notification CMS (templates, scheduling) | Only if portal is white-labeled |
| Blog | Defer to v2 |
| SEO con URLs `/es/` separadas | Tradeoff accepted in v1 (single-URL toggle) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| SEC-04 | TBD | Pending |
| SEC-05 | TBD | Pending |
| NOTIF-10 | TBD | Pending |
| NOTIF-11 | TBD | Pending |
| NOTIF-12 | TBD | Pending |
| ADMIN-07 | TBD | Pending |
| ADMIN-08 | TBD | Pending |
| ADMIN-09 | TBD | Pending |
| ADMIN-10 | TBD | Pending |
| ADMIN-11 | TBD | Pending |
| TEST-10 | TBD | Pending |
| TEST-11 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-25 after v1.2 milestone requirements definition*
