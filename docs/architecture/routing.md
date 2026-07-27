# Routing & Page Hierarchy Architecture

The application uses `@tanstack/react-router` with file-based routing. All route components are located in `src/routes/`.

---

## 🗺️ Route Map

| Route Path | File Location | Purpose & Description | Access Level |
| :--- | :--- | :--- | :--- |
| `/` | `src/routes/index.tsx` | Landing page, community overview, mission vision, and apply CTA. | Public |
| `/apply` | `src/routes/apply.index.tsx` | Onboarding flow: OCR Student ID verification + 3-Step Batch Application Form. | Public |
| `/apply/account` | `src/routes/apply.account.tsx` | Post-submission Cockpit Account creation for applicants. | Public / Redirect |
| `/portal/login` | `src/routes/portal.login.tsx` | Portal authentication page for registered applicants and admins. | Public |
| `/portal/tracking` | `src/routes/portal.tracking.tsx` | Real-time application status tracking, decision display, and resubmission form. | Authenticated |
| `/portal/inbox` | `src/routes/portal.inbox.tsx` | Mission Control Inbox displaying submission greetings and admin transmissions. | Authenticated |

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
