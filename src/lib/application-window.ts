/**
 * Single switch that controls whether the recruitment application is open.
 *
 * When `false`, every `/apply/*` route renders <ApplicationClosed /> instead of
 * the live flow. The flow code is left untouched so re-opening is a one-line
 * flip back to `true`.
 */
export const APPLICATIONS_OPEN = false;

/** Shown on the closed screen so applicants know what happens next. */
export const APPLICATIONS_CLOSED_NOTE =
  "Applications for this recruitment cycle are now closed. Follow our socials for the next batch announcement.";
