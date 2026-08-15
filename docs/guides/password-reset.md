# Password Reset & Account Recovery Workflow Guide

This guide documents the end-to-end Password Reset and Forgot Password workflow implemented on the frontend across [`src/routes/portal.login.tsx`](../../src/routes/portal.login.tsx) and [`src/routes/auth.reset-password.tsx`](../../src/routes/auth.reset-password.tsx).

---

## 🔄 Workflow Overview

```mermaid
sequenceDiagram
    autonumber
    actor User as Member / Applicant
    participant Login as /portal/login
    participant Backend as Backend API
    participant Email as Email Inbox
    participant ResetPage as /auth/reset-password

    User->>Login: 1. Click "Forgot password?" link on sign-in form
    Login->>User: Renders ForgotPasswordModal dialog
    User->>Login: 2. Enter email address & submit
    Login->>Backend: POST /api/v1/auth/student/forgot-password ({ email })
    Backend-->>Login: 200 OK ("If an account exists, link sent")
    Login->>User: Displays anti-enumeration confirmation modal

    Backend->>Email: Emails reset link (<FRONTEND_URL>/auth/reset-password?token=...)
    User->>Email: 3. Click reset link in email
    Email->>ResetPage: Navigates to /auth/reset-password?token=...
    ResetPage->>Backend: POST /api/v1/auth/validate-reset-token ({ token })
    Backend-->>ResetPage: 200 OK (data: { email })
    ResetPage->>User: Validated! Displays email & new password form
    User->>ResetPage: 4. Type new password & submit
    ResetPage->>Backend: POST /api/v1/auth/reset-password ({ token, newPassword })
    Backend-->>ResetPage: 200 OK ("Password has been reset")
    ResetPage->>User: Displays success card with "Sign In with New Password" CTA
```

---

## 🔑 Key Features & Design System

### 1. Anti-Enumeration Security
- On request submit (`POST /api/v1/auth/student/forgot-password`), the frontend displays the exact generic message returned by the server:
  > *"If an account exists, a password reset link has been sent."*
- This prevents callers from guessing which email addresses are registered in the portal.

### 2. Token Validation & Expiry
- Moving to `/auth/reset-password?token=...` automatically triggers `POST /api/v1/auth/validate-reset-token` on mount.
- If the token is invalid, expired, or already consumed, an error card is presented prompting the user to request a fresh link.

### 3. Session Invalidation
- When a new password is set via `POST /api/v1/auth/reset-password`, the backend invalidates all existing sessions.
- The user must sign in again using their new password on `/portal/login`.

---

## 🎨 UI Interaction Rules

- The **Forgot password?** trigger link is positioned immediately below the Password input field (aligned right) on the sign-in form ([`src/routes/portal.login.tsx`](../../src/routes/portal.login.tsx)).
- The password visibility eye toggle dynamically renders inside the password input field when text is entered into the field (displaying `EyeOff` slashed eye when hidden, and `Eye` open eye when revealed).
- All interactive buttons (**Forgot password?**, **Close**, **Cancel**, **Send reset link**, **Sign In with New Password**) feature explicit `cursor-pointer` styles on hover.
- While async requests are pending, buttons enter a disabled loading state (`submittingStep || sending || submitting`), displaying an animated spinner (`Loader2`) and `cursor-not-allowed`.
