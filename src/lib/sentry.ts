import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry SDK for client-side exception tracking & performance monitoring.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENV || import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || "unknown",
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/.*\.azurewebsites\.net/,
        /^https:\/\/.*\.msc-qcu\.tech/,
      ],
      enableLogs: true,
    });
  }
}
