import * as Sentry from "@sentry/react";
import { Bug } from "lucide-react";

export function openSentryFeedback(): void {
  const feedback = Sentry.getFeedback();
  if (feedback) {
    feedback.openWidget();
  } else {
    console.warn("[Sentry] Feedback integration not active.");
  }
}

interface SentryFeedbackButtonProps {
  variant?: "desktop" | "mobile" | "shell";
  className?: string;
}

export function SentryFeedbackButton({ variant = "desktop", className = "" }: SentryFeedbackButtonProps) {
  if (variant === "shell") {
    return (
      <button
        type="button"
        onClick={openSentryFeedback}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-sky-200/90 transition hover:bg-white/10 hover:text-white ${className}`}
        title="Report a Bug"
      >
        <Bug className="size-4 shrink-0 text-sky-400" />
        <span>Report Bug</span>
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={openSentryFeedback}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-950/40 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-900/50 ${className}`}
      >
        <Bug className="size-4 shrink-0 text-sky-400" />
        <span>Report Bug</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSentryFeedback}
      className={`inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 glass-strong px-3 py-1.5 text-xs font-semibold text-sky-200 shadow-sm transition hover:border-sky-400/60 hover:bg-white/10 hover:text-white ${className}`}
      title="Report a Bug"
    >
      <Bug className="size-3.5 shrink-0 text-sky-400" />
      <span>Report Bug</span>
    </button>
  );
}
