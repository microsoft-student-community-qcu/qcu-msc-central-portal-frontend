# Mission Control Inbox System Guide

This guide documents the dynamic communication transmission system located in `src/routes/portal.inbox.tsx`.

---

## 📬 Dynamic Notification Transmissions

The inbox generates live notifications dynamically based on the applicant's profile data fetched from `GET /api/v1/applicants/me` via native `fetch(getApiEndpoint(...), { credentials: "include" })`:

### 1. Welcome & Submission Transmission
- **Sender**: `"QCU MSC Mission Control"`
- **Subject**: `"Welcome & Thank You for Submitting Your Application!"`
- **Body**: Personalized thank you greeting containing applicant's first name and submission timestamp.

### 2. Live Status Transmissions
- **`PENDING_REVIEW`**: `"Application Status: Under Review"` notice.
- **`RESUBMIT`**: `"Action Required: Application Resubmission Request"` notice containing exact admin remark.
- **`APPROVED`**: `"Official Notice: Application Approved!"` notice welcoming cadet aboard.
- **`REJECTED`**: `"Application Decision Notice"` decision summary.

---

## 💾 LocalStorage Persistence

Read and dismissed states are stored locally in the browser to maintain state across sessions:

- `localStorage.setItem("qcumsc.inbox.read", JSON.stringify(readIds))`
- `localStorage.setItem("qcumsc.inbox.dismissed", JSON.stringify(dismissedIds))`
