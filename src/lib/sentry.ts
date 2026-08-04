import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry SDK for client-side exception tracking & performance monitoring.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    });
    console.log("[Sentry] Main frontend monitoring initialized.");
  }
}
