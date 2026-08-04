import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "qcumsc.chunkReloadAt";
const RELOAD_COOLDOWN_MS = 30_000;

function shouldHardReload() {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (Number.isFinite(last) && Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * React.lazy that survives transient chunk-load failures
 * ("Importing a module script failed." / "Failed to fetch dynamically imported module").
 * Retries with backoff, then reloads once to pick up a newer deployment.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  { retries = 2, delayMs = 400 }: { retries?: number; delayMs?: number } = {},
) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error;
        if (attempt < retries) await sleep(delayMs * (attempt + 1));
      }
    }
    // Most likely a stale chunk reference after a redeploy — reload once.
    if (shouldHardReload()) {
      window.location.reload();
      // Keep the promise pending while the page unloads.
      await new Promise(() => {});
    }
    throw lastError;
  });
}
