const ACCOUNT_REDIRECT_KEY = "qcumsc.accountRedirectStartedAt";
const ACCOUNT_REDIRECT_TTL_MS = 15_000;

export function startAccountRedirect() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ACCOUNT_REDIRECT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function hasActiveAccountRedirect() {
  if (typeof window === "undefined") return false;
  try {
    const startedAt = Number(sessionStorage.getItem(ACCOUNT_REDIRECT_KEY));
    return Number.isFinite(startedAt) && Date.now() - startedAt < ACCOUNT_REDIRECT_TTL_MS;
  } catch {
    return false;
  }
}

export function clearAccountRedirect() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACCOUNT_REDIRECT_KEY);
  } catch {
    /* ignore */
  }
}