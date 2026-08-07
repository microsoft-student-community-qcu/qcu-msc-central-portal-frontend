import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Inbox, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { getApiEndpoint } from "@/lib/api-config";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Shown after a draft application is submitted.
 *
 * `POST /api/v1/applicants/draft/:draftId/submit` does NOT return a setup
 * token (see apidocs/applicants.md § 6.4) — the token only reaches the
 * applicant through the password-setup email. So instead of rendering a
 * password form that can never be submitted, we confirm the submission and
 * point the applicant at their inbox.
 */
export function SetupLinkSent({ email, firstName }: { email?: string; firstName?: string }) {
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    // One request at a time, and never more than one per cooldown window —
    // the endpoint is rate limited and this page is hit by every applicant.
    if (inFlightRef.current || cooldown > 0 || !email) return;
    inFlightRef.current = true;
    setSending(true);
    setNotice(null);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch(getApiEndpoint("/api/v1/applicants/resend-setup-link"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a minute before asking for another link.");
        setCooldown(RESEND_COOLDOWN_SECONDS);
        return;
      }

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message || "We couldn't send a new link right now. Please try again shortly.");
        return;
      }

      setNotice("A fresh setup link is on its way. It can take a minute to arrive.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setError(
        err?.name === "AbortError"
          ? "The request timed out. Please try again."
          : "Network error. Please check your connection and try again.",
      );
    } finally {
      clearTimeout(timeout);
      setSending(false);
      inFlightRef.current = false;
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center py-16"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />
      <div className="relative z-10 mx-4 w-full max-w-lg space-y-6 rounded-[2rem] glass-strong p-8 shadow-2xl sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <MailCheck className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-deep/60">
              Application received
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight text-brand-blue-deep sm:text-3xl">
              Check your email{firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
        </div>

        <p className="font-body text-sm leading-relaxed text-brand-blue-deep/80">
          Your application is submitted and saved — nothing else is needed from the form. To finish
          creating your portal account, open the <strong>password setup link</strong> we sent to:
        </p>

        <p className="rounded-2xl bg-white/85 px-4 py-3 text-center font-heading text-sm font-bold break-all text-brand-blue-deep">
          {email || "your registered email address"}
        </p>

        <ul className="space-y-2 font-body text-sm text-brand-blue-deep/75">
          <li className="flex gap-2">
            <Inbox className="mt-0.5 size-4 shrink-0 text-brand-orange" />
            Check your spam or promotions folder if it isn't in your inbox.
          </li>
          <li className="flex gap-2">
            <RefreshCw className="mt-0.5 size-4 shrink-0 text-brand-orange" />
            The link is valid for 48 hours and can only be used once.
          </li>
        </ul>

        {notice && (
          <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 font-body text-sm text-emerald-700">
            {notice}
          </p>
        )}
        {error && (
          <p className="rounded-2xl bg-red-500/10 px-4 py-3 font-body text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            onClick={resend}
            disabled={sending || cooldown > 0 || !email}
            aria-busy={sending}
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: "var(--gradient-cta)" }}
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending…
              </>
            ) : cooldown > 0 ? (
              <>Resend available in {cooldown}s</>
            ) : (
              <>
                <RefreshCw className="size-4" /> Resend setup link
              </>
            )}
          </button>

          <Link
            to="/portal/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/85 px-6 py-3 font-heading text-sm font-semibold text-brand-blue-deep shadow-md transition hover:bg-white"
          >
            I already created my account · Sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
