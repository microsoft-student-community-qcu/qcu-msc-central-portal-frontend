# Fix: "Resubmit Application" appeared to do nothing

**Date:** 2026-08-07
**Area:** Applicant Portal → Application Status (`/portal/tracking`)

---

## Symptom

Applicants with status `RESUBMIT` clicked **Resubmit Application** and nothing visibly happened — no confirmation, no error, no status change on screen. The behaviour was intermittent from the user's perspective, which is why it was hard to reproduce.

## Root causes

### 1. The toast layer was never mounted (primary cause)

`src/routes/portal.tracking.tsx` reports every resubmission outcome through `toast.success()` / `toast.error()` from `sonner`, but no `<Toaster />` was rendered anywhere in the app. `src/components/ui/sonner.tsx` existed and was never used.

Every success and every error message — HTTP 200, 400, 401, network failure alike — was silently discarded. The button spun briefly and returned to idle, identical in all cases. The same silence affected the draft-resume toasts in `src/routes/apply.index.tsx`.

### 2. Success wiped the applicant record from state

Per `api docs/applicants.md` §7, `POST /api/v1/applicants/:applicantId/resubmit` returns only a partial record:

```json
{ "id": "...", "status": "PENDING_REVIEW", "adminMessage": null, "updatedAt": "..." }
```

The handler did `setApplicant(apiResponse.data)`, replacing the full applicant with that stub. Names, academic fields, documents and `resubmitFields` disappeared from state, so the form collapsed with no confirmation — visually indistinguishable from "nothing happened".

### 3. No request timeout

COR + CV multipart uploads over campus wifi or mobile data can stall. With no `AbortController`, `submitting` stayed `true` indefinitely: the button read "Resubmitting Trajectory..." forever, with no error and no way to retry short of a reload.

### 4. `res.json()` before `res.ok`

A 401 session expiry, a 502, or an Azure HTML error page made `await res.json()` throw `Unexpected token '<'`. HTTP status was never inspected, so session expiry was indistinguishable from a validation error — and the resulting message was invisible anyway (cause 1).

### 5. Empty payloads were POSTed

If `resubmitFields` was missing/empty, or the admin unlocked a document the applicant never attached, an empty `FormData` was still sent. The backend rejected it, invisibly.

### 6. No double-submit guard, no `applicant.id` guard

`setSubmitting(true)` is asynchronous, so two fast clicks could fire two POSTs. A missing `applicant.id` produced a request to `/api/v1/applicants/undefined/resubmit`.

---

## What changed

### `src/routes/__root.tsx`

- Mounted `<Toaster position="top-center" richColors closeButton />` from `@/components/ui/sonner` inside `RootComponent`. This restores **all** toast feedback app-wide, not just on the tracking page.

### `src/routes/portal.tracking.tsx`

| Change | Purpose |
|---|---|
| `readJsonSafely(res)` helper | Reads the body as text and `JSON.parse`s in a `try`; returns `null` for HTML/empty bodies instead of throwing. Used by both `/applicants/me` and the resubmit call. |
| `RESUBMIT_TIMEOUT_MS = 25_000` + `AbortController` | The resubmit POST aborts after 25s with "Resubmission timed out. Your connection may be slow — please try again." |
| `submitLockRef` | Ref-based lock checked before any work; a second click in the same tick returns immediately. |
| Preflight validation | Blocks the request when: no `applicant.id`; no unlocked fields; an unlocked document has no file attached; or a required unlocked personal field is blank. Each case names the specific problem. |
| Status-code mapping | `400` → backend message + silent resync of `/applicants/me`; `401` → session-expired message then redirect to `/portal/login`; `403` / `404` → ownership / not-found copy; `5xx` → retry copy. Field errors from `apiResponse.errors` are appended. |
| Merge-on-success | `setApplicant(prev => ({ ...prev, ...data, resubmitFields: [] }))` followed by a background refetch of `/applicants/me`, so the page shows authoritative server state. |
| `submitMessage` inline `Alert` | Persistent success/error banner rendered directly above the Resubmit button, so feedback survives a missed or dismissed toast. |
| Button + inputs | Spinner icon, `aria-busy`, and file pickers disabled while a submission is in flight. |
| `fetchApplicant()` / `applyApplicant()` | Extracted from the mount effect so both the initial load and post-submit resync share one code path. |

No backend or API-contract changes were required — the endpoint behaves exactly as documented; the frontend was swallowing its answers.

---

## How to verify

1. As a `RESUBMIT` applicant, click **Resubmit Application** with an unlocked document and no file attached → an inline error appears instantly and no request is sent.
2. Attach the file and submit → success alert + toast, status flips to `PENDING_REVIEW`, the corrections card closes.
3. Force a 400/401 or throttle the network to trigger the 25s abort → each produces a distinct visible message and the button re-arms.

---

## Related files

- `src/routes/__root.tsx`
- `src/routes/portal.tracking.tsx`
- `api docs/applicants.md` §7 (Resubmit Application)
