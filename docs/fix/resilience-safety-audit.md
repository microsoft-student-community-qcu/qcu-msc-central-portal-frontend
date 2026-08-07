# Resilience & Safety Audit — Phases 1-3

Frontend-only remediation. The backend (Azure Functions, documented in `apidocs/`)
is treated as a fixed contract; every change below makes the client more resilient
to slow or failing responses without altering any request shape.

## Phase 1 — Correctness bugs

| Issue | Location | Fix |
| --- | --- | --- |
| `validDateOfBirth` always returned `null`, so future dates and out-of-range years passed validation | `src/routes/apply.index.tsx` | Rejects unparseable dates, dates after the `MAX_DATE_OF_BIRTH` cutoff (2008-12-31), and dates before 1950-01-01 |
| Rules-of-Hooks violation: `if (!user) return null` sat above `useMemo` calls, so hook order changed between renders | `src/routes/portal.inbox.tsx` | Redirect moved into a `useEffect`; the `null` render guard now sits below every hook |
| Raw API endpoints and internal wording leaked through OCR failures | `src/routes/apply.index.tsx` | `sanitizeOcrMessage` matches broader session-expiry wording and strips URLs |
| Applicant PII logged to the browser console | `src/routes/portal.tracking.tsx` | `console.log`/`console.error` of the applicant payload removed; errors surface in the UI instead |
| Silent `catch {}` left Profile and Inbox showing empty state on failure | `src/routes/portal.profile.tsx`, `src/routes/portal.inbox.tsx` | Errors are captured into state and rendered with a retry affordance; effects are cancellation-guarded |

## Phase 2 — Shared network layer

`src/lib/api-client.ts` centralises every outbound call:

- `apiFetch(path, init, { timeoutMs, signal })` resolves the endpoint via
  `getApiEndpoint`, attaches an `AbortController`, and clears the timer in
  `finally`. Defaults: `DEFAULT_TIMEOUT_MS = 25s`, `UPLOAD_TIMEOUT_MS = 60s`
  for multipart submissions.
- Timeouts and transport failures are normalised into `ApiError` with
  `isTimeout` / `isNetwork` flags and user-readable copy, so a hung request can
  never leave a spinner running forever.
- `extractErrorMessage` / `extractFieldErrors` handle both documented backend
  error shapes: the nested `errors` object (validation) and the `errors` array
  of strings (setup tokens).
- `messageFrom(err, fallback)` gives every `catch` a safe user-facing string.

Migrated call sites: `apply.index.tsx` (all draft/upload calls),
`apply.account.tsx` (link-applicant), `portal.login.tsx` (sign-in),
`portal.tracking.tsx` (applicant fetch + resubmit),
`portal.profile.tsx` and `portal.inbox.tsx` (applicant fetch).

Call sites that already carry their own `AbortController` and timeout
(`validate-setup-token`, `draft/resume`, `resend-setup-link`) were left as-is —
they are already bounded and have bespoke error-kind handling.

## Phase 3 — Submission safety

- `stepLockRef` in `src/routes/apply.index.tsx` is a synchronous ref keyed by
  `` `${draftId}:${formStep}` ``. `goNextStep` claims the lock *before* any
  `await`, so rapid double-clicks are dropped rather than queued — the previous
  state-based guard could not close the gap between click and first render.
- The lock is released in `finally`, and only when the current key still owns it,
  so a step transition that happened mid-flight cannot clear a newer lock.
- Resubmission (`portal.tracking.tsx`) keeps its `submitting` guard and now runs
  under the 60s upload timeout, so a stalled multipart POST resolves instead of
  wedging the form.

## Verification

- `tsgo --noEmit` clean.
- No remaining bare `fetch` without a timeout in `src/`.
- Hook order in `portal.inbox.tsx` is now stable across authenticated and
  unauthenticated renders.