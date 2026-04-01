# Vantix Kit — Estado Completo del Proyecto

**Fecha:** 2026-03-25
**Milestone actual:** v1.2 Security & Polish (12 requirements, 4 phases)

---

## Lo que tenemos (shipped)

### Landing Site (v1.0 — shipped 2026-03-24)
**Tech:** HTML + CSS Custom Properties + vanilla JS | **Hosting:** Cloudflare Pages (pendiente custom domain)

| Componente | Estado | Notas |
|-----------|--------|-------|
| Main landing page (hero, pain cards, services, pricing, CTA) | Done | Bilingual EN/ES |
| Observability detail page | Done | Bilingual con Calendly CTA |
| Fractional SRE detail page | Done | Bilingual con Calendly CTA |
| Mission/Vision detail page | Done | Bilingual |
| GA4 tracking + Calendly booking event | Done | **Placeholder IDs** — need real GA4 + Calendly URL |
| WCAG 2.1 AA contrast compliance | Done | Verified across all pages |
| Bilingual auto-detect + toggle | Done | localStorage persistence |
| SEO (robots.txt, sitemap.xml, meta tags) | Done | Single-URL toggle, no /es/ routes |

### Platform (v1.1 — shipped 2026-03-25)
**Tech:** Next.js 14.2 + Supabase + Stripe + Resend + Slack | **Hosting:** Vercel (pendiente deploy)

#### Auth & Roles
| Componente | Estado |
|-----------|--------|
| Email/password login | Done |
| 4 roles: admin, engineer, seller, client | Done |
| Middleware route protection (portal + admin) | Done |
| Role-gated admin sidebar | Done |

#### Portal (client-facing)
| Pagina | Estado |
|--------|--------|
| `/portal` — Dashboard con stats + recent tasks | Done |
| `/portal/services` — Service catalog | Done |
| `/portal/reports` — Reports list | Done |
| `/portal/billing` — Subscription + payments | Done |
| `/portal/tasks` — Task list | Done |
| `/portal/tasks/[id]` — Task detail con comments | Done |
| `/portal/tests` — Test results | Done |
| `/portal/tutorials` — Tutorial videos | Done |
| `/portal/grafana` — Grafana embed | Done |

#### Admin
| Pagina | Estado |
|--------|--------|
| `/admin` — Overview (4 stat cards, activity feed) | Done |
| `/admin/clients` — Client list con search + subscription status | Done |
| `/admin/tasks` — Cross-client task view con 3 filters | Done |
| `/admin/billing` — 4 stat cards + payment/subscription tables | Done |

#### Notifications
| Componente | Estado |
|-----------|--------|
| Notifications DB table (RLS + indexes) | Done |
| NotificationBell con Realtime + unread badge | Done |
| Dropdown: list, mark-read, mark-all-read | Done |
| Email: payment success/failure (Resend) | Done |
| Email: task status change | Done |
| Slack: task created (Block Kit) | Done |
| Bell mounted in portal + admin layouts | Done |

#### File Uploads
| Componente | Estado |
|-----------|--------|
| Supabase Storage bucket (private, RLS) | Done |
| Drag-and-drop upload (react-dropzone) | Done |
| Client-side validation (size, types) | Done |
| Image thumbnails + lightbox modal | Done |
| Signed URL downloads (1hr expiry) | Done |

#### Testing
| Componente | Estado |
|-----------|--------|
| Vitest + manual Supabase mocks | Done (6 test files) |
| Playwright E2E (login, task CRUD, admin redirect, cross-tenant, storage isolation) | Done (8 spec files) |
| GitHub Actions CI (4-job pipeline) | Done |
| i18n key parity check | Done |

#### Billing
| Componente | Estado |
|-----------|--------|
| Stripe checkout session creation | Done |
| Stripe billing portal | Done |
| Stripe webhook (4 event branches) | Done |

#### DB Migrations
| Migration | Contenido |
|-----------|-----------|
| 001_schema.sql | Full schema (clients, users, tasks, comments, subscriptions, payments, etc.) |
| 002_admin_rls.sql | Admin/seller cross-client RLS policies |
| 002_notifications.sql | Notifications table + RLS |
| 003_storage.sql | Storage bucket + RLS |
| 004_storage_seller_rls.sql | Seller storage access |

#### Other Assets
| Asset | Estado |
|-------|--------|
| `report-engine/` — DOCX report generation | Exists (build.sh + templates) |
| `docs/` — LLC setup guide, doc builder | Exists |
| `contracts/digital/` — Digital contracts | Exists |
| `brand/logos/` — Brand assets | Exists |
| `platform/generator/` — Code generator | Exists |
| `platform/scripts/` — onboard, seed, stripe setup | Exists |
| `platform/docker-compose.yml` — Grafana + Prometheus | Exists |

---

## Lo que falta (v1.2 roadmap — 12 requirements)

### Phase 10: Rate Limiting (SEC-04, SEC-05)
- [ ] `@upstash/ratelimit` + `@upstash/redis` — new dependencies
- [ ] `lib/rate-limit.ts` — shared limiter module
- [ ] Rate limit on `/api/checkout`, `/api/billing-portal`, `/api/webhooks/stripe`, `/api/tasks/*`
- [ ] HTTP 429 + Retry-After header on limit exceeded
- [ ] Upstash Redis account + env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

### Phase 11: Notification Polish (NOTIF-10, NOTIF-11, NOTIF-12)
- [ ] New DB migration: `user_notification_prefs` table (opt-out model)
- [ ] Portal `/settings` page con notification toggles per type
- [ ] Update `notifyTaskEvent()` to check preferences before sending
- [ ] Vercel Cron (`vercel.json`) — weekly Monday digest at 09:00 UTC
- [ ] `/api/cron/digest` route + `lib/digest.ts`
- [ ] React Email template for weekly digest (bilingual)

### Phase 12: Admin Capabilities (ADMIN-07..10, ADMIN-11)
- [ ] New DB migration: `user_invitations` tracking table
- [ ] DB trigger on `auth.users` INSERT → auto-create public profile row
- [ ] `/admin/users` page — invite, role change, deactivate
- [ ] Admin API routes: `/api/admin/users/invite`, `/api/admin/users/[id]/role`, `/api/admin/users/[id]/deactivate`
- [ ] MRR trend chart (Recharts `"use client"` component) on admin billing page
- [ ] `cancel_at_period_end` column in subscriptions (for accurate MRR)

### Phase 13: Test Coverage (TEST-10, TEST-11)
- [ ] `next-test-api-route-handler` + `msw` — new dev dependencies
- [ ] Integration tests for checkout, billing-portal, webhook (4 branches)
- [ ] Playwright visual regression baselines (portal dashboard, task list, admin overview, admin billing)
- [ ] CI-generated baselines (not local macOS)

---

## Lo que falta FUERA del roadmap (gaps y pre-launch blockers)

### Pre-Launch Blockers (manual, zero code)
| Item | Tipo | Prioridad |
|------|------|-----------|
| Replace Calendly URL placeholder with real link | Config | **CRITICO** |
| Replace GA4 Measurement ID placeholder with real ID | Config | **CRITICO** |
| Cloudflare Pages custom domain (vantx.io) | Infra | **CRITICO** |
| Vercel deploy + custom domain (platform.vantx.io o app.vantx.io) | Infra | **CRITICO** |
| Social proof section — at least 1 testimonial or case study | Content | **ALTO** |
| Stripe live keys (replace test) | Config | **ALTO** |
| Supabase production project (not local) | Infra | **ALTO** |
| Upstash Redis account (for rate limiting) | Infra | MEDIO |

### Landing Page Gaps (from `landing/todo.md`)
| Item | Tipo |
|------|------|
| Service-specific FAQs for Observability page | Copy |
| Service-specific FAQs for Fractional SRE page | Copy |
| Service-specific FAQs for QA Tech Lead page | Copy |
| Social proof section (testimonials, logos, case studies) | Content |
| Detail pages are text walls — need visual breaks | Design |
| LATAM banner alignment (centered vs left-aligned) | Design |
| Hero empty space on desktop | Design |
| Dashed border inconsistency on service cards | Design |
| Credibility bar animation pop-in (700ms delay) | Design |
| "Also available" per-row CTAs — 3 identical buttons | CTA |
| Stripe checkout tonal shift | CTA |
| `content-visibility: auto` layout jumps | Perf |

### Platform Gaps (mi assessment)
| Item | Tipo | Notas |
|------|------|-------|
| No `/portal/settings` page | Feature | Needed for Phase 11 (notification prefs) — build there |
| No password change UI | Feature | Users can't change password from portal |
| No forgot password flow | Feature | No reset link on login page |
| No user profile page | Feature | Users can't see/edit their own info |
| No `/admin/users` page | Feature | Covered in Phase 12 |
| No onboarding flow for new users | UX | First login drops to empty dashboard |
| No loading skeletons | UX | Pages flash empty → loaded |
| No error boundaries per section | UX | Single global error handler |
| No offline/connectivity handling | UX | Low priority at current scale |
| Stripe test mode still active | Config | Need live keys before launch |
| `next` is 14.2.18, not 15 | Tech | PROJECT.md says "Next.js 15" but package.json shows 14.2.18 |
| No rate limiting on any route | Security | Covered in Phase 10 |
| No CSP headers | Security | Consider for v1.3 |
| No audit logging | Compliance | Who did what, when — deferred |
| Resend free tier (3,000/mo) | Ops | Monitor — sufficient for now |
| No monitoring/alerting for platform | Ops | Grafana is for client observability, not self-monitoring |

### Deferred to v1.3+
| Item | Milestone |
|------|-----------|
| TOTP 2FA (SEC-01, SEC-02, SEC-03) | v1.3 |
| Admin-assisted 2FA unenrollment UI | v1.3 |
| SMS/phone 2FA | v2+ |
| Recovery codes for 2FA | v2+ |
| Per-user digest schedule (timezone-aware) | v2+ |
| MRR chart subscription overlay | v2+ |
| Blog | v2 |
| SEO con URLs `/es/` separadas | v2 |
| Real-time chat | Out of scope |
| Mobile app | Out of scope |

---

## Resumen de numeros

| Metric | Valor |
|--------|-------|
| Total commits | ~50 |
| Landing pages | 4 (main + 3 detail) |
| Platform pages | 13 (9 portal + 4 admin) |
| API routes | 4 (checkout, billing-portal, webhooks/stripe, tasks) |
| DB migrations | 5 |
| Unit test files | 6 |
| E2E spec files | 8 |
| Dependencies | 16 prod + 15 dev |
| Milestones shipped | 2 (v1.0, v1.1) |
| v1.2 phases remaining | 4 (10-13) |
| v1.2 requirements | 12 |

---

*Generated: 2026-03-25*
