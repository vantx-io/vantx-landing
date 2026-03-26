---
phase: 13-auth-ux
plan: "01"
subsystem: platform/auth
tags: [auth, forgot-password, reset-password, i18n, supabase]
dependency_graph:
  requires: []
  provides: [forgot-password-flow, reset-password-page]
  affects: [platform/src/app/[locale]/login, platform/src/app/[locale]/reset-password]
tech_stack:
  added: []
  patterns: [onAuthStateChange PASSWORD_RECOVERY, resetPasswordForEmail, updateUser, useSearchParams]
key_files:
  created:
    - platform/src/app/[locale]/reset-password/page.tsx
  modified:
    - platform/src/app/[locale]/login/page.tsx
    - platform/src/messages/en.json
    - platform/src/messages/es.json
decisions:
  - "showForgot state toggles inline forgot-password form within login card — no separate route needed"
  - "forgotSent always true after submit regardless of email existence — prevents user enumeration"
  - "readyRef (useRef) guards 3s fallback redirect to avoid stale closure on ready state"
  - "forgot_email pre-filled with login email state when toggling to forgot view — reduces friction"
metrics:
  duration: 5m
  completed: "2026-03-26"
  tasks: 2
  files: 4
---

# Phase 13 Plan 01: Forgot Password & Reset Password Flow Summary

Inline forgot-password widget on login page plus /[locale]/reset-password page using Supabase onAuthStateChange PASSWORD_RECOVERY, with full EN/ES i18n coverage.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add inline forgot-password widget to login page and create reset-password page | e8f9ecf | login/page.tsx, reset-password/page.tsx |
| 2 | Add i18n keys for forgot-password and reset-password flows | f0805a6 | en.json, es.json |

## What Was Built

**Login page changes:**
- Added `showForgot`, `forgotEmail`, `forgotSent`, `forgotLoading`, `resetSuccess` state
- "Forgot password?" button below password field pre-fills `forgotEmail` with current login email
- Inline forgot-password form replaces password+submit area when `showForgot=true`
- Always shows confirmation message after submit (no user enumeration)
- Reads `?reset=success` param via `useSearchParams`, shows green banner, auto-clears after 5s

**Reset-password page (`/[locale]/reset-password`):**
- `onAuthStateChange` detects `PASSWORD_RECOVERY` event and sets `ready=true`
- `readyRef` (useRef) prevents stale closure in 3s fallback redirect to login
- Validates min 8 chars and password match before calling `supabase.auth.updateUser`
- On success: sets `success=true`, waits 1.5s, redirects to `/[locale]/login?reset=success`
- Same visual card style as login page

**i18n:**
- 7 new keys in `login` namespace (both en/es)
- New `reset_password` namespace with 12 keys (both en/es)
- `check-i18n.js` parity: 281 keys, all passing

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all flows fully wired to Supabase Auth.

## Verification

- TypeScript: 0 errors in new files (pre-existing errors in stripe webhook unrelated to this plan)
- JSON valid: both en.json and es.json parse without errors
- i18n parity: check-i18n.js passes (281 keys)
- login/page.tsx contains: `resetPasswordForEmail`, `showForgot`, `forgotSent`, `t("forgot_password")`, `reset=success`
- reset-password/page.tsx contains: `"use client"`, `PASSWORD_RECOVERY`, `updateUser`, `useTranslations("reset_password")`, `error_min_length`, `error_mismatch`

## Self-Check: PASSED
