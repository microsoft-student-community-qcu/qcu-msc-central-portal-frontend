# Routing & Page Hierarchy Architecture

The application uses `@tanstack/react-router` with file-based routing. All route components are located in `src/routes/`.

---

## 🗺️ Route Map

| Route Path | File Location | Purpose & Description | Access Level |
| :--- | :--- | :--- | :--- |
| `/` | `src/routes/index.tsx` | Landing page, community overview, mission vision, and apply CTA. | Public |
| `/apply` | `src/routes/apply.index.tsx` | **CLOSED** (see docs/guides/applications-closed-patch.md) — Onboarding flow: OCR Student ID verification + 3-Step Batch Application Form. Accepts `?resumeToken=` (or `?token=`) from the resume email. | Public |
| `/apply/resume` | `src/routes/apply.resume.tsx` | Alias for the emailed resume link; redirects `?token=` / `?resumeToken=` to `/apply?resumeToken=…`. | Public / Redirect |
| `/apply/account` | `src/routes/apply.account.tsx` | Post-submission Cockpit Account creation for applicants. | Public / Redirect |
| `/portal/login` | `src/routes/portal.login.tsx` | Portal authentication page for registered applicants and admins. | Public |
| `/portal/tracking` | `src/routes/portal.tracking.tsx` | Real-time application status tracking, decision display, and resubmission form. | Authenticated (Applicant) |
| `/portal/inbox` | `src/routes/portal.inbox.tsx` | Mission Control Inbox displaying submission greetings and admin transmissions. | Authenticated (Applicant / Member) |
| `/portal/profile` | `src/routes/portal.profile.tsx` | Crew Profile displaying identity details and academic credentials (college, program, section, campus). | Authenticated (Applicant / Member) |

---

## 🔒 Route Validation & Guards

### 1. `apply.account.tsx` Search Validation
The `/apply/account` route accepts optional search parameters (such as `token`):

```typescript
export const Route = createFileRoute("/apply/account")({
  validateSearch: (search: Record<string, unknown>): { token?: string } => {
    return {
      token: search.token as string | undefined,
    };
  },
});
```

### 2. Session Redirect Guard
If an applicant completes the `/apply` form, `startAccountRedirect()` sets a temporary session flag. If the user navigates back to `/apply` while an active account setup is pending, the route automatically redirects them to `/apply/account`.

### 3. Portal Authentication Guard
Portal routes (`/portal/tracking`, `/portal/inbox`) verify user authentication via `usePortalUser()`. Unauthenticated visitors are navigated to `/portal/login`.


---

## Application Window

All `/apply/*` routes are gated by `APPLICATIONS_OPEN` in `src/lib/application-window.ts`. While it is `false`, `/apply`, `/apply/resume`, `/apply/account`, and `/apply/dashboard` all render `<ApplicationClosed />`. See `docs/guides/applications-closed-patch.md`.
