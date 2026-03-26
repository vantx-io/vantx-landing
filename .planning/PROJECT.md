# Vantix Platform

## What This Is

Plataforma SaaS bilingüe (EN/ES) para Vantix — firma de SRE fraccional que ofrece Performance as a Service, Observability as a Service y Fractional Perf & SRE. Dos módulos: (1) sitio de marketing estático que convierte visitantes en demos via Calendly, y (2) plataforma Next.js con portal de cliente, dashboard admin interno, notificaciones in-app + email, y gestión de tareas con file uploads.

## Core Value

Convertir visitantes en demos agendadas — si alguien llega al sitio y no hay forma fácil de reservar tiempo, todo lo demás falla.

## Requirements

### Validated

- ✓ Landing page principal con hero, servicios, pricing teaser y CTA Calendly — v1.0
- ✓ Páginas de detalle: Observability, Fractional SRE, Misión/Visión — v1.0
- ✓ Sistema bilingüe (EN/ES) con auto-detect + toggle — v1.0
- ✓ Calendly embed como mecanismo de contacto/demos — v1.0
- ✓ Diseño dark & techy auditado con impeccable.style — v1.0
- ✓ GA4 tracking + Calendly booking event listener — v1.0
- ✓ WCAG 2.1 AA contrast compliance — v1.0
- ✓ Test infrastructure (Vitest + Playwright + CI + i18n parity) — v1.1
- ✓ Notification system (email via Resend, Slack, in-app Realtime bell) — v1.1
- ✓ Admin dashboard (overview, clients, tasks, billing + role-gated middleware) — v1.1
- ✓ File uploads (drag-and-drop, image thumbnails + lightbox, signed URL downloads) — v1.1
- ✓ E2E tests (login, task CRUD, admin redirect, cross-tenant isolation) — v1.1

### Active

- ✓ Rate limiting on API routes (SEC-04, SEC-05) — Validated in Phase 10: Rate Limiting
- ✓ Weekly email digest to clients (NOTIF-10) — Validated in Phase 11: Notification Polish
- ✓ User notification preferences (NOTIF-11, NOTIF-12) — Validated in Phase 11: Notification Polish
- ✓ Admin user management — invite, role change, deactivate (ADMIN-07..10) — Validated in Phase 12: Admin Capabilities
- ✓ Admin MRR trend chart (ADMIN-11) — Validated in Phase 12: Admin Capabilities
- [ ] Forgot password + password change + user profile (AUTH-01..03)
- [ ] Loading skeletons, onboarding guide, error boundaries (UX-01..03)
- [ ] CSP headers + audit logging (SECURE-01..02)
- [ ] Integration tests for API routes (TEST-10)
- [ ] Playwright visual regression tests (TEST-11)
- [ ] Production deploy — Cloudflare, Vercel, Supabase, Stripe, Calendly, GA4 (LAUNCH-01..06)

### Out of Scope

- Blog — defer to v2
- SEO con URLs `/es/` separadas — tradeoff aceptado en v1 (single-URL toggle)
- Real-time chat — Slack covers async communication
- Mobile app — responsive web sufficient at current scale
- ~~Admin user management UI — promoted to v1.2 (ADMIN-07)~~ → Delivered in Phase 12
- ~~Notification preferences UI — promoted to v1.2 (NOTIF-11)~~ → Delivered in Phase 11
- Two-factor authentication (TOTP) — deferred to v1.3 (SEC-01, SEC-02, SEC-03)

## Context

**Shipped v1.0 MVP** on 2026-03-24. Static marketing site in `landing/`.
Tech: HTML + CSS Custom Properties + vanilla JS. ~8,779 LOC.

**Shipped v1.1 Platform Hardening & Admin** on 2026-03-25. Full-stack platform in `platform/`.
Tech: Next.js 14.2, Supabase (Postgres + Auth + Storage + Realtime), Stripe, Resend, Slack.
~6,143 LOC TypeScript + 380 LOC E2E tests. 5 DB migrations. 13 plans across 5 phases.

**Pre-launch blockers (manual):**
- Replace Calendly URL placeholder with real link
- Replace GA4 Measurement ID placeholder with real ID
- Social proof section has placeholder content

## Constraints

- **Landing:** HTML estático + CSS + vanilla JS — no frameworks, no build step
- **Platform:** Next.js 14.2 + Supabase + Stripe + Resend + Slack
- **Hosting:** Static files on Cloudflare Pages (landing), Vercel (platform)
- **Idiomas:** English default, Spanish alternative; next-intl for platform, auto-detect for landing
- **Auth:** Supabase Auth with email/password, role-based (admin/engineer/seller/client)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid landing (main + detail pages) | Main page converts, detail pages educate | ✓ Good |
| Calendly embed (no custom form) | Direct booking, zero friction | ✓ Good |
| Dark & techy visual identity | Technical credibility, differentiation | ✓ Good |
| Single-URL bilingual toggle (no `/es/`) | Simplicity over SEO in v1 | ⚠️ Revisit in v2 |
| Google Fonts CDN | v1 simplicity; self-host for perf later | ⚠️ Revisit |
| Supabase manual mocks for Vitest | No live DB dependency in CI | ✓ Good |
| Resend + React Email for transactional email | Simple API, bilingual templates | ✓ Good |
| Supabase Realtime for notifications | Native Postgres integration, row-level security | ✓ Good |
| Signed URLs for file downloads (1hr expiry) | No permanent public URLs, security by default | ✓ Good |
| react-dropzone for file uploads | Small bundle, composable, well-maintained | ✓ Good |
| Storage RLS scoped by client_id path | Cross-tenant isolation at infrastructure level | ✓ Good |
| Opt-out notification model (no row = all ON) | Zero-config onboarding, progressive preference setting | ✓ Good |
| Vercel Cron for weekly digest (Mon 9am UTC) | Free tier covers schedule, no external scheduler needed | ✓ Good |
| DB trigger for user profile creation on invite | Auto-creates users row on auth.users INSERT, no app code needed | ✓ Good |
| Supabase Auth ban for deactivation (876000h) | Immediate login prevention without session invalidation | ✓ Good |

## Current Milestone: v1.2 Security & Polish

**Goal:** Harden the platform with rate limiting, notification preferences, admin user management, MRR chart, and comprehensive test coverage (integration + visual regression). 2FA deferred to v1.3.

**Target features:**
- Rate limiting on API routes (Upstash Redis)
- Weekly email digest + notification preferences
- Admin user management (invite, role change, deactivate)
- Admin MRR trend chart (Recharts)
- Auth UX (forgot password, password change, user profile)
- Polish UX (loading skeletons, onboarding, error boundaries)
- Security hardening (CSP headers, audit logging)
- Integration tests + visual regression tests
- Production deploy (Cloudflare, Vercel, Supabase, Stripe live)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after Phase 12 (admin-capabilities) completed*
