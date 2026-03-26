---
phase: 13-auth-ux
verified: 2026-03-26T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
human_verification:
  - test: "Forgot password full flow"
    expected: "User clicks Forgot password?, enters email, clicks Send reset link, receives email, clicks link, lands on /[locale]/reset-password, sets new password, gets redirected to login with success banner"
    why_human: "Requires live Supabase email delivery and browser navigation to confirm end-to-end flow"
  - test: "Password reset page 3-second fallback redirect"
    expected: "If user navigates directly to /[locale]/reset-password without a valid recovery token, the page shows 'Verifying reset link...' for ~3 seconds then redirects to /[locale]/login"
    why_human: "Depends on Supabase session state at runtime; cannot verify redirect timing or absence of PASSWORD_RECOVERY event programmatically"
  - test: "Profile name persists after reload"
    expected: "User edits display name, clicks Save, sees 'Saved' confirmation, then refreshes the page — the updated name re-appears in the input"
    why_human: "Requires live Supabase DB with RLS migration applied; GET /api/profile must read the row written by PATCH"
  - test: "AUTH-01 noted Pending in REQUIREMENTS.md"
    expected: "AUTH-01 checkbox in REQUIREMENTS.md is marked [ ] (pending), not [x]. Verify this reflects intentional tracking state — the code is fully implemented"
    why_human: "REQUIREMENTS.md shows [ ] for AUTH-01 vs [x] for AUTH-02/03. This is a documentation discrepancy; code is complete but the requirements file needs manual update"
---

# Phase 13: Auth UX Verification Report

**Phase Goal:** Users can recover and manage their accounts without admin intervention
**Verified:** 2026-03-26
**Status:** human_needed (all automated checks passed; 4 items need runtime/human confirmation)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees a "Forgot password?" link below the password field on the login page | VERIFIED | `login/page.tsx` line 125: `{t("forgot_password")}` rendered in a button; `showForgot` state gates login vs forgot view |
| 2 | Clicking "Forgot password?" reveals an inline email input within the login card | VERIFIED | `login/page.tsx` lines 160-190: `!showForgot` conditional shows login form; `showForgot && !forgotSent` shows inline forgot-password form with email input |
| 3 | After submitting the forgot-password form, user sees confirmation message regardless of whether the email exists | VERIFIED | `handleForgotPassword` (lines 48-58): always calls `setForgotSent(true)` — no branch on success/error; `forgotSent` renders `{t("forgot_email_sent")}` |
| 4 | User who clicks the reset link lands on /[locale]/reset-password with a "Set new password" form | VERIFIED | `reset-password/page.tsx` exists; `onAuthStateChange` detects `PASSWORD_RECOVERY` event (line 24), sets `ready=true`; form renders when `ready && !success` |
| 5 | After setting a new password, user is redirected to login with a success message | VERIFIED | `handleReset` (lines 62-65): on success sets `success=true`, then `router.push(\`/\${locale}/login?reset=success\`)` after 1500ms; login page reads `?reset=success` param and shows green banner (lines 74-78) |
| 6 | Logged-in user can edit their display name and save it | VERIFIED | `settings/page.tsx` lines 99-119: `handleProfileSave` fetches `PATCH /api/profile` with `{ full_name: profileName }`; `api/profile/route.ts` PATCH handler updates `users` table; success shows `t("saved")` for 4s |
| 7 | Logged-in user can change their password from portal settings with validation | VERIFIED | `settings/page.tsx` lines 121-144: `handlePasswordChange` validates `newPw.length < 8` and `newPw !== confirmPw` before calling `supabase.auth.updateUser({ password: newPw })`; success auto-clears after 4s |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `platform/src/app/[locale]/login/page.tsx` | Inline forgot-password widget with email input | VERIFIED | Contains `resetPasswordForEmail`, `showForgot`, `forgotSent`, `forgot_password`, `reset=success`; 199 lines, substantive implementation |
| `platform/src/app/[locale]/reset-password/page.tsx` | Password reset form with two fields | VERIFIED | Contains `PASSWORD_RECOVERY`, `updateUser`, `useTranslations("reset_password")`, `error_min_length`, `error_mismatch`; 134 lines, fully wired |
| `platform/src/app/api/profile/route.ts` | GET and PATCH handlers for user profile | VERIFIED | Exports `GET` and `PATCH`; GET selects `full_name, email`; PATCH updates `full_name` with rate limiting (`api:profile`, 20 req/min), auth guard (401), and input validation (400); 65 lines |
| `platform/supabase/migrations/006_user_self_update.sql` | RLS UPDATE policy for users to update their own profile | VERIFIED | `CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid())` |
| `platform/src/app/[locale]/portal/settings/page.tsx` | Profile section (top), Notifications (middle), Security (bottom) | VERIFIED | Three distinct card sections in correct order; Profile loads from GET `/api/profile` on mount; Security calls `supabase.auth.updateUser`; 351 lines |
| `platform/src/messages/en.json` | i18n keys for forgot-password, reset-password, profile, security | VERIFIED | `login.forgot_password`, `login.reset_success`, `reset_password` namespace (12 keys), `settings.profile_heading`, `settings.security_heading`, `settings.error_pw_min` all present |
| `platform/src/messages/es.json` | Spanish i18n keys matching en.json | VERIFIED | All parallel keys present: `login.forgot_password`, `reset_password` namespace, `settings.profile_heading`, `settings.security_heading` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `login/page.tsx` | `supabase.auth.resetPasswordForEmail` | `handleForgotPassword` | WIRED | Line 52: `await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: \`\${origin}/\${locale}/reset-password\` })` |
| `reset-password/page.tsx` | `supabase.auth.onAuthStateChange` | `useEffect` detecting `PASSWORD_RECOVERY` | WIRED | Lines 22-28: `onAuthStateChange` callback checks `event === "PASSWORD_RECOVERY"`, sets `ready=true` and `readyRef.current=true` |
| `reset-password/page.tsx` | `supabase.auth.updateUser` | `handleReset` function | WIRED | Line 54: `supabase.auth.updateUser({ password: newPassword })`; error and success paths handled |
| `settings/page.tsx` | `/api/profile` | `useEffect` (GET) and `handleProfileSave` (PATCH) | WIRED | Line 64: `fetch("/api/profile")` on mount; line 105: `fetch("/api/profile", { method: "PATCH", ... })` on save |
| `settings/page.tsx` | `supabase.auth.updateUser` | `handlePasswordChange` | WIRED | Line 134: `supabase.auth.updateUser({ password: newPw })` with client-side validation gating |
| `api/profile/route.ts` | `supabase.from('users')` | `select` and `update` queries | WIRED | GET line 26-30: `.from("users").select("full_name, email").eq("id", user.id).single()`; PATCH line 56-59: `.from("users").update({ full_name }).eq("id", user.id)` |
| `api/profile/route.ts` | `rateLimit` | Rate limit check before PATCH operation | WIRED | Line 46: `rateLimit(getRateLimitIdentifier(req, user.id), RL_CONFIG)` called before body parsing; `rateLimitHeaders` applied to 200 response |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 13-01-PLAN.md | User can reset password via "forgot password" link on login page | SATISFIED (code) / PENDING (REQUIREMENTS.md) | Full flow implemented: `resetPasswordForEmail` wired in `login/page.tsx`; `reset-password/page.tsx` handles `PASSWORD_RECOVERY` and `updateUser`. REQUIREMENTS.md still shows `[ ]` — doc discrepancy only |
| AUTH-02 | 13-02-PLAN.md | User can change password from portal settings | SATISFIED | `settings/page.tsx` Security section with client-side validation + `updateUser` call + 4s auto-clear success |
| AUTH-03 | 13-02-PLAN.md | User can view and edit their profile (name) from portal settings | SATISFIED | `settings/page.tsx` Profile section loads name+email from GET `/api/profile`, editable name field, PATCH on save |

**Note on AUTH-01:** REQUIREMENTS.md line 31 shows `- [ ] **AUTH-01**` (unchecked) while lines 135-136 show AUTH-02 and AUTH-03 as `Complete`. The implementation is fully present in code. The requirements file checkbox needs to be updated to `[x]` and the tracking table on line 134 updated from `Pending` to `Complete`.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `reset-password/page.tsx` | 30-34 | 3-second timeout fallback redirect | Info | Hardcoded 3s delay is a deliberate design decision (per RESEARCH.md Pitfall 1) — not a stub. The `readyRef` guard correctly prevents stale closure. |
| `login/page.tsx` | 13-17 | `resetSuccess` state (not `reset_success` naming) | Info | Minor naming inconsistency vs i18n key name — no functional issue |

No blockers or warnings found. All state variables flow to rendered output; no orphaned state detected.

---

### Human Verification Required

#### 1. Forgot password end-to-end flow

**Test:** Log out, go to `/en/login`, click "Forgot password?", enter a registered email, click "Send reset link". Check email inbox for reset link. Click the link. Verify landing on `/en/reset-password`. Enter a new password (8+ chars) in both fields. Click "Update password". Verify redirect to `/en/login` with green "Password updated" banner. Sign in with the new password.

**Expected:** Each step completes without error; new password works for login.

**Why human:** Requires live Supabase email delivery (SMTP configured), valid registered account, and browser-level session handling for the `PASSWORD_RECOVERY` event.

#### 2. Invalid reset link redirect

**Test:** Navigate directly to `/en/reset-password` in a browser without clicking a real reset email link (i.e., no recovery token in the URL).

**Expected:** Page shows "Verifying reset link..." for approximately 3 seconds, then redirects to `/en/login`.

**Why human:** Depends on absence of the `PASSWORD_RECOVERY` event in a real browser runtime; cannot replicate Supabase auth state machine programmatically.

#### 3. Profile name persistence across reload

**Test:** Log in as a portal user. Go to Settings. Edit the display name. Click Save. See "Saved" confirmation. Hard-reload the page (Cmd+Shift+R). Verify the updated name is pre-filled in the input.

**Expected:** Name persists — GET `/api/profile` returns the updated value after the PATCH was applied.

**Why human:** Requires live Supabase DB with migration 006 applied; cannot verify data persistence without running infrastructure.

#### 4. AUTH-01 requirements checkbox

**Test:** Open `.planning/REQUIREMENTS.md` and update `- [ ] **AUTH-01**` to `- [x] **AUTH-01**` and change the tracking table entry from `Pending` to `Complete`.

**Expected:** REQUIREMENTS.md accurately reflects that all three AUTH requirements are complete.

**Why human:** The file needs a manual edit — it is a documentation correction, not a code change.

---

### Gaps Summary

No code gaps. All seven observable truths are verified. All artifacts exist, are substantive, and are fully wired to their dependencies. The single actionable item is a documentation discrepancy: REQUIREMENTS.md still marks AUTH-01 as `[ ] Pending` despite the implementation being complete.

---

_Verified: 2026-03-26_
_Verifier: Claude (gsd-verifier)_
