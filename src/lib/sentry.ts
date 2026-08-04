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
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/.*\.azurewebsites\.net/,
        /^https:\/\/.*\.msc-qcu\.tech/,
      ],
      enableLogs: true,
    });
    console.log("[Sentry] Main frontend monitoring initialized.");
  }
}
