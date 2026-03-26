# Phase 13: Auth UX - Research

**Researched:** 2026-03-26
**Domain:** Supabase Auth password reset + user profile management in Next.js App Router
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**AUTH-01 — Forgot Password:**
- D-01: "Forgot password?" link below password field — clicking reveals inline email input within the same card (no separate page navigation)
- D-02: Submit calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '${origin}/${locale}/reset-password' })`
- D-03: No custom email template — use Supabase's built-in password recovery email
- D-04: New page at `/[locale]/reset-password/page.tsx` — reads token from URL hash, shows "Set new password" form with two fields (new password + confirm password)
- D-05: Reset page calls `supabase.auth.updateUser({ password })` on submit — Supabase handles token validation automatically
- D-06: After successful reset, redirect to login with success message ("Password updated. Sign in with your new password.")
- D-07: i18n: add `login.forgot_password`, `login.forgot_email_sent`, `reset_password.*` keys to en.json and es.json

**AUTH-02 — Password Change in Settings:**
- D-08: New "Security" section on settings page, placed BELOW existing "Notifications" section
- D-09: Two fields: "New password" + "Confirm password" — no "current password" field
- D-10: Explicit Submit button (not auto-save)
- D-11: Client-side call: `supabase.auth.updateUser({ password })`
- D-12: On success: clear fields, show success message that auto-clears after 4 seconds
- D-13: Validation: minimum 8 characters, passwords must match — client-side before submit

**AUTH-03 — User Profile in Settings:**
- D-14: New "Profile" section at TOP of settings page (above "Notifications")
- D-15: Shows display name in editable text input, pre-filled from `users.full_name`
- D-16: Email shown as read-only text (non-editable)
- D-17: Explicit "Save" button for name changes
- D-18: New API route `PATCH /api/profile` — accepts `{ full_name: string }`, updates `users.full_name` where `id = auth.uid()`, rate-limited at 20 req/min
- D-19: No avatar upload — `avatar_url` stays null
- D-20: i18n: add `settings.profile_heading`, `settings.name_label`, `settings.email_label`, `settings.save`, `settings.saved` keys

### Claude's Discretion
- Reset password page loading/error states
- Form validation UX (inline vs on-submit)
- Exact success/error message styling
- Whether to use the same card component or separate sections
- Test mocking strategy for Supabase auth methods

### Deferred Ideas (OUT OF SCOPE)
- Email change functionality
- Avatar upload
- Social auth (Google, GitHub)
- Session management (view/revoke active sessions)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can reset password via "forgot password" link on login page | Supabase `resetPasswordForEmail` + `updateUser` verified. Reset page outside portal layout — no auth guard needed. URL hash token pattern confirmed. |
| AUTH-02 | User can change password from portal settings | `supabase.auth.updateUser({ password })` is the same API used on reset page. Client-side call from portal settings ("Security" section). |
| AUTH-03 | User can view and edit their profile (name) from portal settings | New `PATCH /api/profile` route updates `users.full_name`. Follows existing preferences API pattern verbatim. RLS policy "Users can read own profile" already covers SELECT; UPDATE policy needed. |
</phase_requirements>

---

## Summary

Phase 13 extends two existing surfaces — the login page and the portal settings page — plus adds one new page (`/[locale]/reset-password`). All three requirements rely on Supabase Auth client-side APIs (`resetPasswordForEmail`, `updateUser`) and an existing pattern for API routes (`/api/preferences`). No new libraries are needed.

The most technically subtle piece is the reset-password page: Supabase delivers the token in the URL hash fragment (`#access_token=...&type=recovery`), not a query parameter. The browser-side Supabase client automatically detects the `type=recovery` hash on page load and establishes a short-lived session, after which `updateUser({ password })` works normally. The page must be a Client Component to access the hash.

The `/api/profile` route is the only new server-side endpoint. It follows the `/api/preferences` pattern exactly: `createServerSupabase()` for auth context, rate-limit check, field allowlist, then a Supabase update. The one addition is a new DB migration to add an UPDATE RLS policy on `users` so authenticated users can update their own `full_name`.

**Primary recommendation:** Build in three isolated units: (1) login page inline forgot-password widget, (2) `/[locale]/reset-password` page, (3) settings page with Profile + Security sections plus the `/api/profile` API route. Each unit touches different files with no cross-dependencies.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | Already installed | Browser and server Supabase clients | Project-established; `createClient()` and `createServerSupabase()` already in use |
| `next-intl` | Already installed | i18n translations | `useTranslations()` pattern established on all pages |
| `@upstash/ratelimit` + `@upstash/redis` | Already installed | Rate limiting on `/api/profile` | Established pattern from Phase 10; `rate-limit.ts` helper ready |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React `useState` | Built-in | Form state for inline forgot-password, security section | Client Components only — matches login page and settings page patterns |
| `useLocale` (next-intl) | Already installed | Build redirect URL for `resetPasswordForEmail` | Needed on login page to construct `/${locale}/reset-password` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `supabase.auth.updateUser` (client-side) | Server-side API route | Client-side is correct here — user has active session; server route adds unnecessary complexity for in-session operations |
| Inline forgot-password form on login page | Separate `/forgot-password` page | Locked by D-01; inline is lighter UX |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### File Structure for This Phase
```
platform/src/
├── app/
│   ├── [locale]/
│   │   ├── login/
│   │   │   └── page.tsx                  MODIFY — add inline forgot-password widget
│   │   ├── reset-password/
│   │   │   └── page.tsx                  CREATE — new page (outside portal layout)
│   │   └── portal/
│   │       └── settings/
│   │           └── page.tsx              MODIFY — add Profile (top) + Security (bottom) sections
│   └── api/
│       └── profile/
│           └── route.ts                  CREATE — PATCH handler for full_name update
├── messages/
│   ├── en.json                           MODIFY — add login.forgot_*, reset_password.*, settings.profile_*, settings.security_*
│   └── es.json                           MODIFY — same keys in Spanish
└── supabase/
    └── migrations/
        └── 006_user_self_update.sql      CREATE — RLS UPDATE policy on users table
```

### Pattern 1: Inline Forgot-Password Widget (Login Page)

**What:** The login page is a Client Component with `useState`. Add `showForgot` boolean state. When true, show email input + "Send reset link" button in place of the password field area. After submit, show confirmation text (D-07: `login.forgot_email_sent`).

**When to use:** Any inline form reveal within an existing card layout.

**Key state:**
```typescript
// Extends existing login page state
const [showForgot, setShowForgot] = useState(false);
const [forgotEmail, setForgotEmail] = useState("");
const [forgotSent, setForgotSent] = useState(false);
const [forgotLoading, setForgotLoading] = useState(false);

async function handleForgotPassword(e: React.FormEvent) {
  e.preventDefault();
  setForgotLoading(true);
  const origin = window.location.origin;
  await supabase.auth.resetPasswordForEmail(forgotEmail, {
    redirectTo: `${origin}/${locale}/reset-password`,
  });
  // Always show success — don't leak whether email exists
  setForgotSent(true);
  setForgotLoading(false);
}
```

**Security note:** Always show the "email sent" message even if the email doesn't exist — this prevents user enumeration. Supabase returns no error for unknown emails; the behavior is correct by default.

### Pattern 2: Reset Password Page (New)

**What:** A standalone `"use client"` page at `platform/src/app/[locale]/reset-password/page.tsx`. Supabase places the recovery token in the URL hash. The browser Supabase client detects `#type=recovery` automatically when `onAuthStateChange` fires or when any auth call is made.

**Critical implementation detail — hash token session:**
Supabase SSR client (`@supabase/ssr` via `createBrowserClient`) automatically exchanges the hash token for a session on the first auth call. The page should call `supabase.auth.getSession()` on mount to confirm the recovery session is active before showing the form. If no session with type `recovery`, show an error or redirect to login.

```typescript
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("reset_password");

  const [ready, setReady] = useState(false);   // session confirmed
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase exchanges hash token for session automatically;
    // verify recovery session is present before showing form.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        // No valid recovery session — redirect to login
        router.replace(`/${locale}/login`);
      }
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("error_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("error_min_length"));
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push(`/${locale}/login?reset=success`);
    }, 1500);
  }
  // ...render
}
```

**Middleware consideration:** The middleware currently skips auth check for everything except `/portal`, `/admin`, and `/login`. The `/reset-password` route falls through the middleware's early return (`return response;`), so no change to middleware is needed. The page itself handles its own session validation.

### Pattern 3: Settings Page — Profile + Security Sections

**What:** The settings page is a single Client Component. Add Profile section state (name, saving, saved) and Security section state (newPassword, confirmPassword, securityError, securitySuccess) alongside existing prefs state. Use the same auto-clearing timeout pattern for success messages (already established with `setSaveError`).

**Profile section state:**
```typescript
const [profileName, setProfileName] = useState("");
const [profileEmail, setProfileEmail] = useState("");
const [profileSaving, setProfileSaving] = useState(false);
const [profileSaved, setProfileSaved] = useState(false);

// Load on mount alongside prefs — fetch /api/profile GET or use Supabase directly
```

**Security section state:**
```typescript
const [newPw, setNewPw] = useState("");
const [confirmPw, setConfirmPw] = useState("");
const [pwError, setPwError] = useState<string | null>(null);
const [pwSuccess, setPwSuccess] = useState(false);
const [pwLoading, setPwLoading] = useState(false);

async function handlePasswordChange(e: React.FormEvent) {
  e.preventDefault();
  if (newPw.length < 8) { setPwError(t("error_pw_min")); return; }
  if (newPw !== confirmPw) { setPwError(t("error_pw_mismatch")); return; }
  setPwLoading(true);
  setPwError(null);
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPw });
  setPwLoading(false);
  if (error) { setPwError(error.message); return; }
  setNewPw(""); setConfirmPw("");
  setPwSuccess(true);
  setTimeout(() => setPwSuccess(false), 4000); // matches notification prefs pattern
}
```

### Pattern 4: /api/profile Route

**What:** Follows `/api/preferences` pattern exactly. GET returns full_name + email. PATCH updates full_name with allowlist validation.

```typescript
// platform/src/app/api/profile/route.ts
import { createServerSupabase } from "@/lib/supabase/server";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { Duration } from "@upstash/ratelimit";

const RL_CONFIG = {
  requests: 20,
  window: "1 m" as Duration,
  prefix: "api:profile",
};

export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await (supabase as any)
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ full_name: data?.full_name ?? "", email: data?.email ?? "" });
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(getRateLimitIdentifier(req, user.id), RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : null;
  if (!full_name || full_name.length === 0) {
    return NextResponse.json({ error: "full_name required" }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from("users")
    .update({ full_name })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl) });
}
```

### Pattern 5: DB Migration for User Self-Update

**What:** The existing `005_user_management.sql` only creates SELECT policies for self and ALL policies for admin roles. `updateUser` on the profile route touches `users.full_name` — this requires an explicit UPDATE RLS policy for the authenticated user's own row.

```sql
-- 006_user_self_update.sql
-- Allow users to update their own profile (full_name only — enforced in API layer)
CREATE POLICY "Users can update own profile" ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

**Important:** The existing "Admin roles manage all users" policy uses `FOR ALL` which already covers UPDATE for admin/engineer/seller. This new policy only adds self-service update for `client` role users (and all roles, but it's additive with the existing admin policy).

### Anti-Patterns to Avoid

- **Using URL query params instead of hash for token reading:** The Supabase recovery link puts the token in the hash fragment. Never try to parse `searchParams.get('access_token')` — it won't exist. The Supabase client handles the hash automatically.
- **Server Component for reset-password page:** The hash fragment is never sent to the server (browser strips it). The reset-password page must be `"use client"` to access hash-based token exchange.
- **Checking `params.locale` with `await` on reset-password page:** The existing `[locale]/layout.tsx` does not `await params`. The locale pages in this project use `params: { locale: string }` synchronously in layouts. However, for the reset-password page, use `useLocale()` (client hook) rather than params, to stay consistent with the login page pattern.
- **Forgetting to add `reset-password` to i18n messages:** The `check-i18n` script enforces parity between en.json and es.json. Missing the new `reset_password` namespace in either file will fail the i18n check.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token validation on reset-password page | Custom JWT decode + verify | `supabase.auth.getSession()` after page load | Supabase client automatically exchanges hash token for session; manual token handling is error-prone and duplicates Supabase internals |
| Email delivery for password reset | Custom transactional email | Supabase built-in password recovery email (D-03) | Supabase handles delivery, rate limiting, token expiry (1 hour default) |
| Rate limiting on `/api/profile` | In-memory Map | Existing `rateLimit()` from `rate-limit.ts` | In-memory is broken on Vercel serverless (Phase 10 established decision) |
| RLS enforcement for profile updates | Application-layer user_id check | PostgreSQL RLS `USING (id = auth.uid())` | Defense-in-depth; app-layer `eq("id", user.id)` is correct but DB policy prevents any SQL injection bypass |

**Key insight:** The Supabase auth client absorbs all token lifecycle complexity. The application code only calls `resetPasswordForEmail` once and `updateUser` once — Supabase owns everything in between.

---

## Common Pitfalls

### Pitfall 1: Reset Page Shows "Invalid Link" on Valid Token
**What goes wrong:** The reset-password page mounts, calls `getSession()`, gets null, and redirects the user away before the Supabase client has processed the hash.
**Why it happens:** `getSession()` in SSR mode may return null before the hash is processed client-side. The hash exchange is asynchronous.
**How to avoid:** Use `onAuthStateChange` to listen for the `PASSWORD_RECOVERY` event instead of (or in addition to) a one-shot `getSession()`. Show a loading spinner until the auth event fires.
**Warning signs:** Users complain reset links say "invalid" immediately; works on retry.

Better pattern:
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setReady(true);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

### Pitfall 2: Rate Limit Block Outside try/catch Pattern
**What goes wrong:** Rate limit check placed inside try/catch — if Upstash is down and `rateLimit()` throws, the catch block returns before `rl` is defined, and `rateLimitHeaders(rl)` in the success response fails.
**Why it happens:** Phase 10 research identified this exact trap.
**How to avoid:** Match the established pattern in the codebase — rate-limit helper already fails open (`return { success: true, ... }` on exception), so it's safe outside try/catch.

### Pitfall 3: Supabase TypeScript Inference on users Table Update
**What goes wrong:** `supabase.from("users").update(...)` produces TypeScript `never` inference errors.
**Why it happens:** Same issue seen with `notification_preferences` in Phase 11.
**How to avoid:** Use `(supabase as any)` cast on the `from()` call — established pattern throughout the codebase.

### Pitfall 4: Missing UPDATE RLS Policy Blocks Profile Save
**What goes wrong:** PATCH `/api/profile` returns 200 but `full_name` never updates in the database.
**Why it happens:** `005_user_management.sql` only creates SELECT (self) and ALL (admin roles) policies. Client-role users have no UPDATE policy.
**How to avoid:** `006_user_self_update.sql` migration must be applied before testing profile saves with a client-role user.
**Warning signs:** Admin users can update their name but client users cannot; no error returned from Supabase (RLS silently no-ops UPDATE for unauthorized rows).

### Pitfall 5: Forgot Password Email Enumeration
**What goes wrong:** Showing different UI for "email not found" vs "email sent" reveals which emails are registered.
**Why it happens:** Developer adds error handling for empty/not-found case.
**How to avoid:** Always show the same success message regardless of whether Supabase found the email. Supabase itself does not return an error for unknown emails — don't add one.

### Pitfall 6: i18n Key Parity Failure
**What goes wrong:** CI `check-i18n` step fails after adding keys to en.json but not es.json.
**Why it happens:** The project enforces parity via `scripts/check-i18n.js`.
**How to avoid:** Always update both `en.json` and `es.json` together. The new keys are: `login.forgot_password`, `login.forgot_email_sent`, `reset_password.*` (full namespace), `settings.profile_heading`, `settings.name_label`, `settings.email_label`, `settings.save`, `settings.saved`.

---

## Code Examples

Verified patterns from existing codebase:

### Auto-Clearing Success Message (4s)
```typescript
// Source: platform/src/app/[locale]/portal/settings/page.tsx (lines 61-63)
setSaveError(t("error_save"));
setTimeout(() => setSaveError(null), 4000);
// Same pattern for security section success in Phase 13
```

### API Route: Rate Limit + Auth + Operation
```typescript
// Source: platform/src/app/api/preferences/route.ts
const supabase = createServerSupabase();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// ... operation
```

### Rate Limit Config (Duration brand literal)
```typescript
// Source: platform/src/app/api/preferences/... + Phase 10 decision
// window must use `as Duration` — TypeScript infers string from object literals
const RL_CONFIG = {
  requests: 20,
  window: "1 m" as Duration,
  prefix: "api:profile",
};
```

### Supabase TypeScript Cast for users Table
```typescript
// Source: Phase 11 + Phase 12 established pattern
const { error } = await (supabase as any)
  .from("users")
  .update({ full_name })
  .eq("id", user.id);
```

### useTranslations Namespace Pattern
```typescript
// Source: platform/src/app/[locale]/portal/settings/page.tsx (line 20)
const t = useTranslations("settings");
// Reset page uses its own namespace:
const t = useTranslations("reset_password");
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom password reset flow with magic links | `supabase.auth.resetPasswordForEmail` + `updateUser` | Supabase v2 (2023) | No server-side token storage needed; Supabase manages token lifecycle |
| Separate forgot-password page | Inline form reveal on login card | D-01 decision | Lighter UX; single-card experience |

**No deprecated patterns in scope for this phase.**

---

## Open Questions

1. **`/reset-password` middleware exemption — is it already handled?**
   - What we know: Middleware early-returns for paths that don't start with `/portal`, `/admin`, or `/login`. Reset-password path is `/reset-password` (without `/portal`).
   - What's clear: No middleware change needed — the route falls through to the early return on line 29 of middleware.ts.
   - Recommendation: Verified — no middleware change required.

2. **Does `onAuthStateChange` fire reliably before user interacts with the form?**
   - What we know: The `PASSWORD_RECOVERY` event fires asynchronously when the Supabase client exchanges the hash token. This typically takes < 500ms on a warm connection.
   - What's unclear: Edge cases on slow connections or if the user navigates directly to the page without the hash (e.g., old link).
   - Recommendation: Show loading state until `ready = true`; if `PASSWORD_RECOVERY` event never fires within a timeout (or `getSession()` shows no session), show "This link is invalid or expired" with a link back to login.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (globals: true, jsdom environment) |
| Config file | `platform/vitest.config.mts` |
| Quick run command | `npm run test:run -- --reporter=verbose` (from `platform/`) |
| Full suite command | `npm run test:run` (from `platform/`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `resetPasswordForEmail` called with correct email + redirectTo | unit | `npm run test:run -- __tests__/auth-ux.test.ts` | No — Wave 0 |
| AUTH-01 | Success: forgotSent state true after submit | unit | `npm run test:run -- __tests__/auth-ux.test.ts` | No — Wave 0 |
| AUTH-02 | `updateUser({ password })` called on Security section submit | unit | `npm run test:run -- __tests__/auth-ux.test.ts` | No — Wave 0 |
| AUTH-02 | Client-side validation: rejects < 8 chars, rejects mismatch | unit | `npm run test:run -- __tests__/auth-ux.test.ts` | No — Wave 0 |
| AUTH-03 | `PATCH /api/profile` returns 200 with valid full_name | unit | `npm run test:run -- __tests__/profile-route.test.ts` | No — Wave 0 |
| AUTH-03 | `PATCH /api/profile` returns 401 when unauthenticated | unit | `npm run test:run -- __tests__/profile-route.test.ts` | No — Wave 0 |
| AUTH-03 | `PATCH /api/profile` returns 429 when rate limit exceeded | unit | `npm run test:run -- __tests__/profile-route.test.ts` | No — Wave 0 |
| AUTH-03 | `PATCH /api/profile` returns 400 for empty full_name | unit | `npm run test:run -- __tests__/profile-route.test.ts` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd platform && npm run test:run -- __tests__/auth-ux.test.ts __tests__/profile-route.test.ts`
- **Per wave merge:** `cd platform && npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `platform/__tests__/auth-ux.test.ts` — unit tests for forgot-password handler + security section password change (mock `@supabase/ssr` browser client)
- [ ] `platform/__tests__/profile-route.test.ts` — unit tests for `/api/profile` GET and PATCH (mock `@supabase/ssr` server client + Upstash following `rate-limit.test.ts` pattern)

**Mocking strategy for Supabase auth methods:**
Follow `rate-limit.test.ts` pattern — use `vi.hoisted()` for mock function variables, `vi.mock('@supabase/ssr', ...)` to mock the module. The browser client mock needs `auth.resetPasswordForEmail`, `auth.updateUser`, `auth.onAuthStateChange`, and `auth.getSession` as vi.fn() stubs.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `platform/src/lib/supabase/client.ts`, `server.ts` — confirmed `createClient()` and `createServerSupabase()` APIs
- Direct codebase inspection: `platform/src/app/api/preferences/route.ts` — confirmed exact API route pattern to replicate
- Direct codebase inspection: `platform/src/lib/rate-limit.ts` — confirmed `rateLimit()`, `rateLimitResponse()`, `rateLimitHeaders()`, `getRateLimitIdentifier()` signatures
- Direct codebase inspection: `platform/src/app/[locale]/login/page.tsx` — confirmed login card structure for inline widget
- Direct codebase inspection: `platform/src/app/[locale]/portal/settings/page.tsx` — confirmed section pattern and 4s auto-clear pattern
- Direct codebase inspection: `platform/src/middleware.ts` — confirmed reset-password exempt from auth check
- Direct codebase inspection: `platform/src/messages/en.json` + `es.json` — confirmed existing i18n key structure
- Direct codebase inspection: `platform/supabase/migrations/005_user_management.sql` — confirmed RLS gap: no UPDATE policy for self

### Secondary (MEDIUM confidence)
- Supabase Auth password reset flow: `onAuthStateChange` + `PASSWORD_RECOVERY` event pattern — standard Supabase SSR integration pattern, consistent with `@supabase/ssr` documentation

### Tertiary (LOW confidence)
- None — all claims verified against codebase or established project decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, APIs verified in existing code
- Architecture: HIGH — directly derived from existing patterns in codebase
- Pitfalls: HIGH — pitfalls 2, 3, 4 directly from Phase 10/11/12 decisions in STATE.md; pitfall 1 from Supabase SSR known async behavior

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (Supabase auth APIs are stable; project dependencies not changing)
