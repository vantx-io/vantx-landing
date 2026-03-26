# Phase 13: Auth UX - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can recover and manage their accounts without admin intervention. Forgot password flow from login page, password change from portal settings, and profile editing (display name) from portal settings. Extends the existing settings page created in Phase 11.

</domain>

<decisions>
## Implementation Decisions

### Forgot Password Flow (AUTH-01)
- **D-01:** "Forgot password?" link below the password field on the login page — clicking reveals an inline email input within the same card (no navigation to a separate page)
- **D-02:** Submit calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '${origin}/${locale}/reset-password' })` — Supabase sends its default reset email
- **D-03:** No custom email template — use Supabase's built-in password recovery email
- **D-04:** New page at `/[locale]/reset-password/page.tsx` — reads token from URL hash, shows "Set new password" form with two fields (new password + confirm password)
- **D-05:** Reset page calls `supabase.auth.updateUser({ password })` on submit — Supabase handles token validation automatically when the page loads from the email link
- **D-06:** After successful reset, redirect to login page with a success message (e.g., "Password updated. Sign in with your new password.")
- **D-07:** i18n: add `login.forgot_password`, `login.forgot_email_sent`, `reset_password.*` keys to both en.json and es.json

### Password Change in Settings (AUTH-02)
- **D-08:** New "Security" section on the settings page, placed BELOW the existing "Notifications" section
- **D-09:** Two fields: "New password" and "Confirm password" — no "current password" field (Supabase session already proves identity)
- **D-10:** Submit button (not auto-save like notification toggles — password changes should be deliberate)
- **D-11:** Client-side call: `supabase.auth.updateUser({ password })` — same API as reset-password page
- **D-12:** On success: clear fields, show success message that auto-clears after 4 seconds (same pattern as notification preference error)
- **D-13:** Validation: minimum 8 characters, passwords must match — validated client-side before submit

### User Profile in Settings (AUTH-03)
- **D-14:** New "Profile" section at the TOP of the settings page (above "Notifications") — profile is the most accessed setting
- **D-15:** Shows display name in an editable text input, pre-filled from `users.full_name`
- **D-16:** Email shown as read-only text (non-editable) — changing email is out of scope
- **D-17:** Explicit "Save" button for name changes (not auto-save — name edits should be deliberate)
- **D-18:** New API route `PATCH /api/profile` — accepts `{ full_name: string }`, updates `users.full_name` where `id = auth.uid()`, rate-limited at 20 req/min
- **D-19:** No avatar upload — `avatar_url` stays null. Keep it simple at current scale
- **D-20:** i18n: add `settings.profile_heading`, `settings.name_label`, `settings.email_label`, `settings.save`, `settings.saved` keys

### Claude's Discretion
- Reset password page loading/error states
- Form validation UX (inline vs on-submit)
- Exact success/error message styling
- Whether to use the same card component or separate sections
- Test mocking strategy for Supabase auth methods

</decisions>

<specifics>
## Specific Ideas

- Forgot password should feel lightweight — inline reveal on the login card, not a heavy separate page
- Password change success should give the same instant feedback as notification toggles (auto-clearing message)
- Profile section should be the first thing on settings — it's the most personal/identity-oriented

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Login page (add forgot password link + inline form)
- `platform/src/app/[locale]/login/page.tsx` — Current login form structure

### Settings page (extend with profile + security sections)
- `platform/src/app/[locale]/portal/settings/page.tsx` — Current notification preferences UI (Phase 11)

### Auth helpers
- `platform/src/lib/supabase/client.ts` — Browser client for client-side auth calls
- `platform/src/lib/supabase/server.ts` — Server client for API route auth

### Middleware (auth redirect patterns)
- `platform/src/middleware.ts` — Protected route handling, locale integration

### API route patterns
- `platform/src/app/api/preferences/route.ts` — Existing settings API pattern (rate-limited, auth-checked)
- `platform/src/lib/rate-limit.ts` — Rate limit helper

### Types & i18n
- `platform/src/lib/types.ts` — User type with full_name field
- `platform/src/messages/en.json` — English translations (add reset_password + extend settings/login namespaces)
- `platform/src/messages/es.json` — Spanish translations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Login page card layout — extend for inline forgot-password form
- Settings page section pattern (heading + description + controls) — reuse for Profile and Security sections
- `createClient()` browser Supabase — for `resetPasswordForEmail`, `updateUser`
- Rate limit helper — apply to new `/api/profile` route
- Auto-clearing error/success message pattern from notification preferences (4s timeout)

### Established Patterns
- Client-side Supabase auth calls on login page
- `useTranslations()` with namespace pattern for i18n
- Settings page uses `useState` + optimistic updates for toggles
- API routes: rate limit → auth check → operation → NextResponse.json()
- Supabase `auth.getUser()` for session validation in API routes

### Integration Points
- Login page — add forgot password link + inline email form
- Settings page — add Profile section (top) and Security section (bottom)
- New `/[locale]/reset-password/page.tsx` — standalone page outside portal layout
- New `/api/profile` route — PATCH for full_name updates
- i18n files — extend login and settings namespaces, add reset_password namespace

</code_context>

<deferred>
## Deferred Ideas

- Email change functionality — requires verification flow, out of scope
- Avatar upload — uses Storage bucket, separate feature if needed
- Social auth (Google, GitHub) — not in current requirements
- Session management (view/revoke active sessions) — future security feature

</deferred>

---

*Phase: 13-auth-ux*
*Context gathered: 2026-03-26*
