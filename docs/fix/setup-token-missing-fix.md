# Fix: "Setup token is missing" after submitting the application

**Date:** 2026-08-07
**Area:** Applicant onboarding — Stage 3 (portal account setup)
**Symptom:** After completing the 3-step application form the applicant is redirected to `/apply/account`, fills in a password, and only on submit gets:

> Setup token is missing. Please click the setup link in your email to create your account.

The account is never created, and the applicant has no obvious next action.

---

## What this flow is for

`/apply/account` is the last stage of onboarding. It creates the applicant's **portal login** so they can track their application at `/portal/tracking`. Account creation requires a single-use, server-signed **`setupToken`**: `POST /api/auth/sign-up/email` rejects any request without one (`"setupToken": ["Setup token is required"]`, see [`apidocs/setup-token.md`](../../apidocs/setup-token.md)).

---

## Root cause

Two different endpoints can finish an application, and **only one of them returns a setup token**:

| Endpoint | Returns `setupToken`? | Reference |
|---|---|---|
| `POST /api/v1/applicants` (one-shot fallback) | Yes — `data.setupToken` | `apidocs/applicants.md` § 1 |
| `POST /api/v1/applicants/draft/:draftId/submit` (the real flow) | **No** — response is `{ id, status }` only | `apidocs/applicants.md` § 6.4 |

Every real applicant goes through the **draft** flow, because each batch of the form auto-saves and a `draftId` always exists by Step 3. That produced this chain:

1. `src/routes/apply.index.tsx` read `json.data?.setupToken` from the draft-submit response → always `undefined`.
2. It persisted `setupToken: undefined` in `sessionStorage` (`qcumsc.applicant`) and navigated to `/apply/account` **with no `?token=`**.
3. `/apply/account` rendered the password form regardless — the token was only checked *inside* the submit handler.
4. Submit threw "Setup token is missing".

For the draft flow the token exists **only in the emailed link** (`${FRONTEND_URL}/auth/setup-password?token=...`). The backend behaved exactly as documented; the frontend was presenting a form it could not complete.

---

## The fix

### 1. Never render a form that cannot be submitted

`/apply/account` now branches on token availability *before* rendering:

- **Token present** (`?token=` from the email, or a stored one from the fallback endpoint) → validate, then show the password form. Unchanged behaviour.
- **No token** → render the new `SetupLinkSent` hand-off screen instead of the password form.

The failure mode is removed rather than reworded — there is no longer a path where the applicant types a password and is rejected at the end.

### 2. New `SetupLinkSent` screen — `src/components/SetupLinkSent.tsx`

- Confirms the application was submitted and saved (no further form action needed).
- Shows the exact email address the setup link went to.
- Notes the spam/promotions folder and the 48-hour, single-use validity of the link.
- **Resend setup link** button → `POST /api/v1/applicants/resend-setup-link` with `{ email }` (`apidocs/applicants.md` § 2).
- Secondary link to `/portal/login` for applicants who already created their account.

### 3. Efficiency guards (this page is hit by every applicant)

- **Resend:** a ref-based in-flight lock (one request per click, no double-fire) plus a **60-second cooldown with a visible countdown**, so the documented rate limit is respected client-side instead of being discovered as a `429`. A real `429` is surfaced as a wait message and starts the cooldown.
- **Token validation:** a `validatedTokenRef` guard means one `POST /validate-setup-token` per token — remounts, HMR and React double-effect runs no longer re-hit the backend. Previously each mount issued a fresh request.
- **Cancellation:** validation and resend both use `AbortController` with a 20s timeout and abort on unmount, so abandoned tabs do not hold server connections. A timeout is reported as a timeout (and clears the guard so a retry is possible) rather than surfacing as a generic failure.
- No polling and no automatic retries anywhere in the flow.

### 4. Cleaner submit hand-off — `src/routes/apply.index.tsx`

- Dropped the phantom `json.data?.setupToken` read and the conditional `search: { token }` on the draft path; it now navigates with `search: {}` and stores only what the confirmation screen needs.
- Added the missing `startAccountRedirect()` / `setRedirectingToAccount(true)` calls (the one-shot fallback path already had them), so `/apply` cannot flash the data-privacy consent screen while `/apply/account` loads.

---

## Files changed

| File | Change |
|---|---|
| `src/components/SetupLinkSent.tsx` | **New** — "check your email" screen with rate-limit-aware resend. |
| `src/routes/apply.account.tsx` | No-token branch renders `SetupLinkSent`; token validation is once-only, abortable and timeout-guarded. |
| `src/routes/apply.index.tsx` | Draft-submit path: no phantom `setupToken`, `search: {}`, redirect marker set before navigating. |
| `docs/fix/setup-token-missing-fix.md` | **New** — this document. |
| `docs/guides/application-flow.md` | Stage 3 rewritten around the email-driven setup path. |

---

## Verification

- **Draft flow (the common path):** submit Step 3 → `/apply/account` shows "Check your email" with the registered address, no password form, no error.
- **Resend:** one request per click; button locks for 60s with a countdown; `429` shows the wait copy instead of an error dump.
- **Emailed link:** `/auth/setup-password?token=…` and `/apply/account?token=…` validate once, show the password form, and create + link the account as before.
- **Expired / already-used token:** existing "Setup Link Expired" / "Account Already Created" states, unchanged.
- Typecheck clean.

---

## Notes for future changes

If the backend later starts returning `setupToken` from `POST /api/v1/applicants/draft/:draftId/submit`, the frontend needs no structural change: store it on the `qcumsc.applicant` record (or pass it as `?token=`) and `/apply/account` will show the password form again automatically. Update `apidocs/setup-token.md`'s "token returned in response?" table at the same time.
