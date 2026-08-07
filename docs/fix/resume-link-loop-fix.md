# Fix: Resume-application link looped users back to the start

**Date:** 2026-08-07
**Area:** Applicant onboarding — cross-device draft resumption (`/apply?resumeToken=…`)

---

## What this is for

When an applicant scans an ID that already has an unfinished draft, the backend emails a
**secure resume link** (`/apply?resumeToken=<jwt>`, per [`apidocs/ocr.md`](../../apidocs/ocr.md)
and [`apidocs/applicants.md`](../../apidocs/applicants.md)). Opening it should POST
`/api/v1/applicants/draft/resume`, rehydrate every saved field, and drop the applicant on the
next unsaved form step.

The token is **single-use** and expires after **30 minutes**. `400` means invalid/expired/wrong
draft; `404` means the draft no longer exists.

## The bug

Some applicants clicking the resume link were sent back to the very beginning of the flow
(Data Privacy consent / ID scan) instead of their draft — appearing to "loop" through the
application.

Root cause chain:

1. After the resume attempt finished, `navigate({ to: "/apply", replace: true })` was called
   **without `search: {}`**. TanStack Router preserves existing search params when `search` is
   omitted, so `?resumeToken=…` stayed in the address bar even after the token had been spent.
2. The "already redeemed" guard was a `useRef`, which is wiped by any full page load. So a
   refresh, back/forward navigation, or an email client re-opening the tab replayed the **same,
   already-consumed** token.
3. The backend correctly rejected the replay, and the `catch` branch only fired a toast — it
   never set `stage`, so the page fell back to its default `"consent"` stage. To the applicant
   this looked like their progress was gone and the application had restarted.

Aggravating factors: re-scanning the ID hit the `resumePending` path with a 30-minute
one-email-per-draft cooldown, and a missing/non-numeric `currentStep` in the response silently
restarted a partially completed applicant at Step 1.

## The fix

1. **Strip the token from the URL** on both the success and failure paths
   (`search: {}` on every post-resume `navigate`), so a spent token can never be replayed.
2. **Persist the consumed-token record across page loads** in `sessionStorage`, keyed by the
   token string. A reload no longer replays an old token, while a *newly issued* link for the
   same draft still redeems normally.
3. **Added a real failure screen** instead of silently landing on the consent stage. Failures
   are classified from the HTTP status: `400`/`404` → "This resume link has expired" (with
   reassurance that saved progress is intact), `AbortError` → timeout, anything else → generic.
   The single action re-arms the ID scan so a fresh link can be requested.
4. **Clarified the "Unfinished Draft Found" copy** to tell the applicant to open the *most
   recent* email and that a new link can only be sent once every 30 minutes.
5. **Hardened the step restore**: a non-numeric/absent `currentStep` now logs a warning instead
   of quietly resolving to Step 1.

### Is re-scanning after 30 minutes to get a new link safe?

Yes — it is the intended recovery path. The draft is keyed to the student ID, not to the
emailed link, so a fresh link opens the **same** draft at the **same** saved step. Nothing is
duplicated and no progress is lost. Because the consumed-token record is keyed by the token
itself, the new link is never mistaken for the old one.

## Files changed

| File | Change |
|------|--------|
| `src/lib/resume-token.ts` | **New.** `isResumeTokenConsumed` / `markResumeTokenConsumed` — sessionStorage-backed single-use guard that survives reloads. |
| `src/routes/apply.index.tsx` | `search: {}` on all post-resume navigations; sessionStorage replay guard; `resumeError` state + failure modal; status-based error classification; hardened `currentStep` parsing; updated pending-draft copy. |
| `docs/fix/resume-link-loop-fix.md` | This document. |
| `docs/guides/application-flow.md` | Stage 01 rehydration section updated with the new guarantees. |

## How to verify

- Open a valid resume link → lands on the correct form step with fields pre-filled, and the
  address bar no longer contains the token.
- Refresh that page → stays on the restored draft; no second redemption, no bounce to the start.
- Open an already-used or >30-minute-old link → "This resume link has expired" screen.
- Simulate an API timeout → timeout screen with a retry, not a silent restart.
