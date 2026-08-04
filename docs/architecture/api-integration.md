# API Integration & Endpoint Resolution

The frontend interacts with the backend server via `src/lib/api-config.ts`. This module dynamically resolves API URLs across local development and multi-tenant hosted environments (such as Azure App Services).

---

## 🌐 Dynamic Base URL Resolution

`getApiBaseURL()` checks for environment overrides and window hostnames:

```typescript
export const getApiBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Development Stage
    if (
      host.includes("stsamscqcufrontenddev") ||
      host.includes("dev.msc-qcu.tech") ||
      host.includes("dev-admin.msc-qcu.tech") ||
      host.startsWith("dev-") ||
      host.startsWith("dev.")
    ) {
      return "https://func-msc-qcu-backend-dev.azurewebsites.net/api/v1";
    }
    // Release / Staging Stage
    if (
      host.includes("stsamscqcufrontendrel") ||
      host.includes("rel.msc-qcu.tech") ||
      host.includes("rel-admin.msc-qcu.tech") ||
      host.startsWith("rel-") ||
      host.startsWith("rel.")
    ) {
      return "https://func-msc-qcu-backend-rel.azurewebsites.net/api/v1";
    }
    // Production Stage
    if (
      host === "msc-qcu.tech" ||
      host === "admin.msc-qcu.tech" ||
      host.includes("stsamscqcufrontendprod")
    ) {
      return "https://func-msc-qcu-backend.azurewebsites.net/api/v1";
    }
  }
  return "";
};
```

---

## 🔀 Path Deduplication (`getApiEndpoint`)

To prevent 404 errors caused by duplicated `/api/v1/api/v1` path segments when `VITE_API_URL` already ends with `/api/v1`, `getApiEndpoint(path)` applies automatic path deduplication:

```typescript
export const getApiEndpoint = (path: string): string => {
  const baseUrl = getApiBaseURL();
  let cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!cleanBase) {
    if (cleanPath.startsWith("/api/v1")) return cleanPath;
    if (cleanPath.startsWith("/api")) return cleanPath;
    return `/api/v1${cleanPath}`;
  }

  if (cleanBase.endsWith("/api/v1")) {
    if (cleanPath.startsWith("/api/v1/")) {
      cleanPath = cleanPath.slice(7); // Strip duplicate /api/v1
    } else if (cleanPath === "/api/v1") {
      cleanPath = "";
    } else if (cleanPath.startsWith("/api/")) {
      cleanPath = cleanPath.slice(4);
    }
  } else if (cleanBase.endsWith("/api")) {
    if (cleanPath.startsWith("/api/")) {
      cleanPath = cleanPath.slice(4);
    }
  } else {
    if (!cleanPath.startsWith("/api/") && cleanPath !== "/api") {
      cleanPath = `/api/v1${cleanPath}`;
    }
  }

  return `${cleanBase}${cleanPath}`;
};
```

---

## 📡 Key API Endpoint Usages

| Action | Endpoint Path | Method | Payload / Format |
| :--- | :--- | :--- | :--- |
| OCR Verification | `getApiEndpoint("/ocr/verify")` | `POST` | `FormData` (`image`: File) |
| Applicant Submission | `getApiEndpoint("/applicants")` | `POST` | `FormData` (Text fields + `certificateOfRegistration` + `curriculumVitae`) |
| Account Linking | `getApiEndpoint("/api/v1/users/link-applicant")` | `POST` | JSON (`{ applicantId }`) + `credentials: "include"` — **authenticated**; a session must exist before calling |
| Fetch Current Applicant | `getApiEndpoint("/api/v1/applicants/me")` | `GET` | Cookie / Credentials (`credentials: "include"`) |
| Resubmit Application | `getApiEndpoint("/api/v1/applicants/:id/resubmit")` | `POST` | `FormData` |

---

## ⚡ Better-Auth `$fetch` vs Native `fetch` Guidelines

> [!IMPORTANT]
> **Do not use `authClient.$fetch` for custom backend API endpoints.**

- **Better-Auth Client (`authClient.$fetch`)**:
  - Automatically prepends the Better-Auth base path (`/api/auth`) to any relative path.
  - Reserved **exclusively** for Better-Auth framework calls (sign-in, sign-up, sign-out, session checks).
- **Native `fetch` Requirement for Custom APIs**:
  - Endpoints such as `/api/v1/applicants/me`, `/api/v1/inbox`, and `/api/v1/applicants/:id/resubmit` **must** be invoked using native `fetch(getApiEndpoint(...), { credentials: "include" })`.
  - Using `authClient.$fetch` on custom endpoints corrupts the request path (e.g. `http://localhost:8080/api/auth/api/v1/applicants/me`) resulting in `404 Not Found` errors.

---

## 🔒 OCR Error Handling & Field Lockout Rules

When integrating with `POST /api/v1/ocr/verify` on frontend registration or application forms:

1. **OCR Success (`200 OK`, `success: true`)**:
   - `ocrSessionId` is stored in state.
   - Form fields (`lastName`, `firstName`, `middleInitial`) are pre-filled and remain editable for manual typos/corrections.
   - `studentId` is locked (`read-only`) as derived authoritative value from server Zonal OCR.

2. **OCR Failure / Error (`422 Unprocessable Entity` / API Failure)**:
   - **Fields Disabled**: All input fields (`studentId`, `lastName`, `firstName`, `middleInitial`, `email`) are **disabled**.
   - **Continue Button Disabled**: The primary form submission / continuation button is **disabled**.
   - **Re-scan Required**: The **only** active option presented to the user is **Re-scan** (`onBack`), which clears the error and returns to the scanner overlay.
   - **Manual Fallback Exception (`manualRequired: true`)**: If consecutive OCR failures exceed the backend threshold, `manualRequired: true` unlocks full manual entry mode, enabling all fields (including `studentId`).
