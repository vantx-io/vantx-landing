---
phase: 12-admin-capabilities
plan: 01
subsystem: backend
tags: [user-management, admin, rls, trigger, middleware, rate-limiting]
dependency_graph:
  requires: [10-01 (rate-limit infrastructure), 001_schema.sql (users table)]
  provides: [admin invite endpoint, admin role endpoint, admin status endpoint, handle_new_user trigger, is_active enforcement]
  affects: [platform/src/middleware.ts, platform/src/lib/types.ts]
tech_stack:
  added: []
  patterns: [SECURITY DEFINER trigger, inviteUserByEmail with metadata, ban_duration auth sync, is_active middleware gate]
key_files:
  created:
    - platform/supabase/migrations/005_user_management.sql
    - platform/src/app/api/admin/users/invite/route.ts
    - platform/src/app/api/admin/users/[id]/role/route.ts
    - platform/src/app/api/admin/users/[id]/status/route.ts
    - platform/src/app/[locale]/deactivated/page.tsx
  modified:
    - platform/src/lib/types.ts
    - platform/src/middleware.ts
decisions:
  - "SECURITY DEFINER on handle_new_user trigger: authenticated role lacks INSERT policy on users table; DEFINER runs as owner and bypasses RLS"
  - "NULLIF on client_id metadata: Supabase invite passes empty string for null values; NULLIF converts '' to NULL before UUID cast"
  - "ON CONFLICT (id) DO NOTHING: makes migration idempotent; safe for re-runs and dev resets"
  - "ban_duration=876000h (~100 years) for permanent-style ban; 'none' to unban — matches Supabase Auth admin.updateUserById API"
  - "is_active portal check placed after unauthenticated redirect and before login redirect — deactivated users with valid sessions are caught before they reach portal"
  - "Admin manage policy uses admin/engineer/seller (not admin-only) — consistent with 002_admin_rls.sql pattern"
metrics:
  duration: 2m
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_changed: 7
---

# Phase 12 Plan 01: User Management Backend Summary

User lifecycle management backend: DB migration with is_active column + auth trigger auto-creating public profiles on invite acceptance, three admin API routes (invite/role/status) with rate limiting and auth enforcement, middleware is_active gate for portal and admin routes, and static deactivated account page.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | DB migration + User type extension | 2132653 | 005_user_management.sql, types.ts |
| 2 | Admin API routes + middleware + deactivated page | 30a4d8f | invite/route.ts, [id]/role/route.ts, [id]/status/route.ts, middleware.ts, deactivated/page.tsx |

## What Was Built

### Migration 005_user_management.sql

- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true` — all existing users default to active
- `handle_new_user()` SECURITY DEFINER function: fires on `auth.users` INSERT (invite acceptance), inserts into `public.users` using metadata for role/client_id; NULLIF converts empty string client_id to NULL before UUID cast; ON CONFLICT DO NOTHING for idempotency
- `on_auth_user_created` trigger on `auth.users` AFTER INSERT
- `Users can read own profile` RLS policy (SELECT, `id = auth.uid()`) — required for middleware is_active check
- `Admin roles manage all users` RLS policy (ALL, role IN admin/engineer/seller) — consistent with existing 002_admin_rls.sql pattern

### Admin API Routes

**POST /api/admin/users/invite** (`rl:admin-invite`, 5/min):
- Admin-only gate (403 for non-admin callers)
- Validates role enum (admin/engineer/seller/client), requires client_id when role=client
- 409 on duplicate email (queries public.users before inviting)
- Calls `supabase.auth.admin.inviteUserByEmail` with `data: { role, client_id }` metadata
- Returns 201 with `{ success: true, email }`

**PATCH /api/admin/users/[id]/role** (`rl:admin-role`, 20/min):
- Admin-only gate (403 for non-admin callers)
- Validates role enum; 400 when role=client without client_id
- Only adds client_id to update payload when new role IS client (per D-12)
- Returns updated user row

**PATCH /api/admin/users/[id]/status** (`rl:admin-status`, 20/min):
- Admin-only gate (403 for non-admin callers)
- Fetches current is_active, toggles it, 404 if user not found
- Updates `public.users.is_active`
- Syncs Supabase Auth ban: `ban_duration: "876000h"` (deactivate) or `"none"` (reactivate)

### Middleware is_active Enforcement

- Portal routes: after auth check, queries `select("is_active")` for authenticated user; redirects `is_active === false` to `/${locale}/deactivated`
- Admin routes: changed `select("role")` to `select("role, is_active")`; added `|| !profile.is_active` to redirect condition

### Deactivated Page

Static server component at `/[locale]/deactivated` — no auth required, bilingual (EN/ES) message with lock indicator.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All endpoints are fully wired and functional.

## Self-Check: PASSED

Files created/exist:
- platform/supabase/migrations/005_user_management.sql: FOUND
- platform/src/app/api/admin/users/invite/route.ts: FOUND
- platform/src/app/api/admin/users/[id]/role/route.ts: FOUND
- platform/src/app/api/admin/users/[id]/status/route.ts: FOUND
- platform/src/app/[locale]/deactivated/page.tsx: FOUND

Commits verified:
- 2132653 (Task 1): FOUND
- 30a4d8f (Task 2): FOUND
