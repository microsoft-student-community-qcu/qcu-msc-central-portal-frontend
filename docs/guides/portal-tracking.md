# Application Status Tracking & Resubmission Guide

This guide documents the real-time application tracking portal located in `src/routes/portal.tracking.tsx`.

---

## 📊 Application Status States

| Status | Badge / Styling | Description |
| :--- | :--- | :--- |
| `PENDING_REVIEW` | Yellow / Orange | Application received and undergoing review by Management & Development. Flagged for manual review if `manual_application: true`. |
| `RESUBMIT` | Amber / Warning Alert | Action required. Admin requested corrections. Displays admin remarks and opens resubmission form fields. |
| `APPROVED` | Emerald / Green | Application approved by Base Command. Welcome onboarding notice displayed. |
| `REJECTED` | Slate / Red | Decision finalized notice with admin remark. |

---

## 🌐 API & Authentication Requirements

- **Applicant Data Fetching**: `GET /api/v1/applicants/me`
- **Resubmission Endpoint**: `POST /api/v1/applicants/:id/resubmit` (FormData multipart)
- **Authentication Rule**: Custom backend endpoints (outside `/api/auth/*`) **must use native `fetch(getApiEndpoint(...), { credentials: "include" })`** instead of `authClient.$fetch` to prevent path corruption (`/api/auth/api/v1/...`).

---

## ✏️ Resubmission Handling (`RESUBMIT` Status)

When an admin sets an applicant's status to `RESUBMIT`:

1. An alert banner displays the **Admin Remark** (e.g., *"Please upload a clearer copy of your COR"*).
2. Editable fields open for requested updates:
   - Certificate of Registration upload
   - Curriculum Vitae upload
   - Section / Campus / Contact information updates
3. Submitting sends a `POST` FormData request to `getApiEndpoint("/api/v1/applicants/:id/resubmit")` via native `fetch`.
4. Status automatically returns to `PENDING_REVIEW`.
