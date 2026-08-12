# Patch: Applications Closed Window

Status: active (recruitment cycle closed)

## What changed

All `/apply/*` routes now render a single "Applications Closed" screen instead of the
live application flow. No application logic was deleted — the flow is gated behind one
boolean so re-opening is a one-line change.

## Switch

`src/lib/application-window.ts`

```ts
export const APPLICATIONS_OPEN = false; // flip to true to re-open
export const APPLICATIONS_CLOSED_NOTE = "...";  // copy shown on the closed screen
```

## Affected routes

| Route | Behaviour while closed |
| :--- | :--- |
| `/apply` | Renders `<ApplicationClosed />` (OCR scan + 3-step form not mounted) |
| `/apply/resume` | No longer redirects into `/apply`; renders `<ApplicationClosed />` |
| `/apply/account` | Renders `<ApplicationClosed />` (password setup paused) |
| `/apply/dashboard` | Renders `<ApplicationClosed />` |

`/auth/setup-password` still redirects to `/apply/account`, so emailed setup links also
land on the closed screen.

## Implementation

- `src/components/ApplicationClosed.tsx` — full-screen layout mirroring the live `/apply`
  page: `gradient-space` background, `SkyBackdrop variant="space"`, the same QCU MSC header
  with "Back to Space" action, a left MissionPanel-style panel (eyebrow, headline, stats
  strip, decorative planet), and a right `glass-strong` card containing the lock icon,
  closed message, and "Back to home" / "Go to portal login" actions.
- Each apply route swaps its `component` with a ternary on `APPLICATIONS_OPEN`. Route
  `head()` metadata, search validation, and page components are untouched.

## Notes

- Existing applicants can still sign in at `/portal/login` and use the portal
  (tracking, inbox, profile) — only the intake surfaces are closed.
- Because account setup is closed too, any applicant who has not yet set a password
  cannot do so until `APPLICATIONS_OPEN` is flipped back. If that becomes a support
  issue, gate `/apply/account` separately from the rest.
- No backend contract changed; the Azure Functions API in `apidocs/` is untouched.

## Re-opening checklist

1. Set `APPLICATIONS_OPEN = true`.
2. Verify `/apply` mounts the scanner and form, and `/apply/resume` redirects again.
3. Update this document's status line.
