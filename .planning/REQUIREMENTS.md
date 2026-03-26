# Requirements: Vantix Platform

**Defined:** 2026-03-24
**Core Value:** Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma facil de reservar tiempo, todo lo demas falla.

## v1.2 Requirements

Requirements for Security & Polish milestone. Each maps to roadmap phases.

### Security

- [x] **SEC-04**: API routes are rate-limited via Upstash Redis sliding window
- [x] **SEC-05**: Rate-limited users receive 429 response with retry-after header

### Notifications

- [x] **NOTIF-10**: Client receives weekly Monday email digest of task activity
- [x] **NOTIF-11**: User can toggle notification preferences per type (email, in-app) in portal settings
- [x] **NOTIF-12**: Notification preferences are enforced at send time in notifyTaskEvent

### Admin

- [x] **ADMIN-07**: Admin can invite new users by email with role and client assignment
- [x] **ADMIN-08**: Invited user's public profile row is auto-created via DB trigger on acceptance
- [x] **ADMIN-09**: Admin can change user role
- [x] **ADMIN-10**: Admin can deactivate/reactivate user accounts
- [x] **ADMIN-11**: Admin can view MRR trend chart on billing page (Recharts)

### Auth UX

- [ ] **AUTH-01**: User can reset password via "forgot password" link on login page
- [ ] **AUTH-02**: User can change password from portal settings
- [ ] **AUTH-03**: User can view and edit their profile (name) from portal settings

### Polish UX

- [ ] **UX-01**: Portal pages show loading skeletons during data fetch
- [ ] **UX-02**: New users see onboarding guide on first login
- [ ] **UX-03**: Section-level error boundaries catch and display errors gracefully

### Security Hardening

- [ ] **SECURE-01**: CSP headers configured for all platform routes
- [ ] **SECURE-02**: Admin actions are audit-logged (who, what, when)

### Testing

- [ ] **TEST-10**: Integration tests cover API routes (checkout, billing-portal, webhook) using NTARH + MSW
- [ ] **TEST-11**: Playwright visual regression baselines for portal and admin pages (CI-generated)

### Pre-Launch

- [ ] **LAUNCH-01**: Calendly URL configured with real booking link
- [ ] **LAUNCH-02**: GA4 Measurement ID configured with real ID
- [ ] **LAUNCH-03**: Landing site deployed to Cloudflare Pages with vantx.io domain
- [ ] **LAUNCH-04**: Platform deployed to Vercel with custom domain
- [ ] **LAUNCH-05**: Stripe live keys configured
- [ ] **LAUNCH-06**: Supabase production project provisioned and migrated

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

### Security (v1.3)

- **SEC-01**: User can enable TOTP 2FA via enrollment page with QR code
- **SEC-02**: User sees TOTP challenge page after login when 2FA is enrolled
- **SEC-03**: Admin routes enforce AAL2 (2FA verified) in middleware

### Security (v2+)

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
| SEC-04 | Phase 10 | Complete |
| SEC-05 | Phase 10 | Complete |
| NOTIF-10 | Phase 11 | Complete |
| NOTIF-11 | Phase 11 | Complete |
| NOTIF-12 | Phase 11 | Complete |
| ADMIN-07 | Phase 12 | Complete |
| ADMIN-08 | Phase 12 | Complete |
| ADMIN-09 | Phase 12 | Complete |
| ADMIN-10 | Phase 12 | Complete |
| ADMIN-11 | Phase 12 | Complete |
| AUTH-01 | Phase 13 | Pending |
| AUTH-02 | Phase 13 | Pending |
| AUTH-03 | Phase 13 | Pending |
| UX-01 | Phase 14 | Pending |
| UX-02 | Phase 14 | Pending |
| UX-03 | Phase 14 | Pending |
| SECURE-01 | Phase 15 | Pending |
| SECURE-02 | Phase 15 | Pending |
| TEST-10 | Phase 16 | Pending |
| TEST-11 | Phase 16 | Pending |
| LAUNCH-01 | Phase 17 | Pending |
| LAUNCH-02 | Phase 17 | Pending |
| LAUNCH-03 | Phase 17 | Pending |
| LAUNCH-04 | Phase 17 | Pending |
| LAUNCH-05 | Phase 17 | Pending |
| LAUNCH-06 | Phase 17 | Pending |

**Coverage:**
- v1.2 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-25 after v1.2 scope expansion (auth UX, polish, security hardening, pre-launch)*
