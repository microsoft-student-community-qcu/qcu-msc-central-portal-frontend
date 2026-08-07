/**
 * Cross-reload guard for the single-use draft-resume token.
 *
 * The emailed resume link carries a short-lived (30 min) single-use JWT. The
 * previous implementation tracked "already redeemed" in a React ref, which is
 * wiped by any full page load — so a refresh, back/forward navigation, or an
 * email client re-opening the tab replayed the *same* token, the backend
 * rejected it, and the applicant was dumped back at the start of the flow.
 *
 * Recording consumed tokens in sessionStorage (keyed by the token itself)
 * survives reloads within the tab, while still letting a *newly issued* token
 * for the same draft be redeemed normally.
 */

const KEY = "qcumsc.consumedResumeTokens";
const MAX_TRACKED = 10;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function isResumeTokenConsumed(token: string): boolean {
  return read().includes(token);
}

export function markResumeTokenConsumed(token: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [token, ...read().filter((t) => t !== token)].slice(0, MAX_TRACKED);
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode / quota) — ref guard still applies */
  }
}
