# Fix: attachments "disappeared" during long application sessions

**Date:** 2026-08-07
**Area:** Applicant onboarding — Step 2 documents (`/apply`, `PATCH /api/v1/applicants/draft/:id/batch-2`)

---

## The report

An applicant who takes a while on the form finds their COR / CV attachment gone, is told
"Certificate of Registration (COR) is required", cannot submit, and is bounced back to Step 2.
It happened on **fresh, non-resumed** applications.

## Root causes

1. **The picked `File` handle goes stale.** `files` held the raw `File` objects from the picker.
   Those point at an OS-managed temp copy, not data the page owns. During a long session (phone
   locks, file moved/renamed/synced, OS reclaims the cache) the handle becomes unreadable — and
   on iOS Safari the input's `files` list can be emptied outright. The upload then failed with an
   opaque error, or Step 2 reported the document as missing.
2. **Attachment state lived only in React memory.** Any full page load — refresh, tab eviction,
   router remount — wiped `files` (and the answers). Even when the documents were already stored
   on the backend, the form had no record of that, so `validateStep2()` failed and the stepper
   sent the user back to Step 2.
3. **Re-attaching could not recover.** `batch-2` requires the draft to be at step 1
   ([`apidocs/applicants.md`](../../apidocs/applicants.md) § 6.3). Once saved, the draft is at
   step 2, so a re-upload returned `400 draft is at wrong step` — the dead end.
4. **Resume ignored stored documents.** The resume payload (§ 6.5) returns
   `certificateOfRegistration` / `curriculumVitae` paths, but rehydration dropped both, producing
   the same false "missing attachment" state.

## The fix

1. **Server-side truth is tracked.** New `savedStep` (batches the backend has stored) and
   `savedDocs` (`{ cor, cv }` names), set after a successful `batch-2` and from the resume
   payload. `validateStep2()` accepts a document present in either `files` or `savedDocs`.
2. **Stale handles are detected early.** `isFileStillReadable()` reads one byte
   (`file.slice(0, 1).arrayBuffer()`). It runs on a 30s interval while Step 2 is open and again
   immediately before upload. A dead handle clears only that field and shows
   "…no longer available on this device — please choose it again", keeping every other answer.
3. **No redundant PATCH.** When the draft is already past step 1, Step 2 advances without calling
   `batch-2`, eliminating the `wrong step` 400. If the user re-picks a file at that point, a
   toast explains the saved copies were kept.
4. **Non-file progress persists** in `sessionStorage` (24h TTL): answers, `formStep`, `draftId`,
   `ocrSessionId`, `savedStep`, saved doc names, confirmed identity fields. A reload resumes in
   place instead of restarting. `File` objects are deliberately not persisted — the server copy
   is the source of truth. Progress is cleared on successful submission and on `reset()`.
5. **Resume restores document names**, shown as "Already saved: <name> — choose a file only if
   you want to replace it."

## Files changed

| File | Change |
|------|--------|
| `src/lib/apply-progress.ts` | **New.** sessionStorage progress persistence + `isFileStillReadable()` liveness probe. |
| `src/routes/apply.index.tsx` | `savedStep` / `savedDocs` state, restore + persist effects, stale-file probe and notice, batch-2 skip when already saved, resume restores doc names, progress cleared on submit/reset. |
| `docs/fix/stale-attachment-fix.md` | This document. |
| `docs/guides/application-flow.md` | Step 2 documents & persistence behaviour documented. |

## How to verify

- Attach both documents, leave Step 2 idle for several minutes on a phone, then continue → either
  the upload succeeds, or a clear "choose it again" notice appears with all other answers intact.
- Save Step 2, reload the page → the form returns to the same step with answers intact and the
  documents shown as already saved; submission completes without a `wrong step` error.
- Advance past Step 2, click back to Step 2, then Continue → advances without re-uploading and
  without a 400.
- Open a resume link for a draft at step 2 → documents show as "Already saved", not missing.
