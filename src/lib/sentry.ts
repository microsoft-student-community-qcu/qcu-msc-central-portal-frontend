import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry SDK for client-side exception tracking & performance monitoring.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN || "https://04082457bdb0cb53e3d75c9b8abca1f8@o4511774729764864.ingest.us.sentry.io/4511774802313221";
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      integrations: [
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],
      enableLogs: true,
    });
    console.log("[Sentry] Main frontend monitoring initialized.");
  }
}
