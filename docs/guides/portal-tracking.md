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

## ✏️ Resubmission Handling (`RESUBMIT` Status)

When an admin sets an applicant's status to `RESUBMIT`:

1. An alert banner displays the **Admin Remark** (e.g., *"Please upload a clearer copy of your COR"*).
2. Editable fields open for requested updates:
   - Certificate of Registration upload
   - Curriculum Vitae upload
   - Section / Campus / Contact information updates
3. Submitting sends a `PATCH` request to `getApiEndpoint("/applicants/me/resubmit")`.
4. Status automatically returns to `PENDING_REVIEW`.
