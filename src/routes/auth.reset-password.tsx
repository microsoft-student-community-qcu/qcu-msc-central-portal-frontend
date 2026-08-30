import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { Input } from "@/components/ui/input";
import { apiFetch, extractErrorMessage, messageFrom } from "@/lib/api-client";

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: search.token as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset Password · QCU MSC Portal" },
      { name: "description", content: "Set a new password for your QCU MSC account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError("No reset token provided. Please request a new password reset link.");
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      setValidating(true);
      try {
        const res = await apiFetch("/api/v1/auth/validate-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.message || "Invalid or expired reset link. Please request a new one.",
          );
        }

        setAccountEmail(json.data?.email || null);
        setValidationError(null);
      } catch (err: unknown) {
        setValidationError(
          messageFrom(err, "Invalid or expired reset link. Please request a new one."),
        );
      } finally {
        setValidating(false);
      }
    };

    void validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setFormError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(extractErrorMessage(json, "Failed to reset password. Please try again."));
      }

      setResetSuccess(true);
    } catch (err: unknown) {
      setFormError(messageFrom(err, "Failed to reset password. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between" style={{ background: "var(--gradient-space)" }}>
      <SkyBackdrop variant="space" />

      <header className="relative z-30 mx-auto w-full max-w-[1500px] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-10">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src={logoUrl} alt="QCU MSC logo" className="size-9 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-sm font-extrabold tracking-tight text-white drop-shadow sm:text-base">
              Quezon City University
            </div>
            <div className="hidden truncate text-[10px] uppercase tracking-[0.18em] text-white/85 drop-shadow sm:block">
              Microsoft Student Community
            </div>
          </div>
        </Link>
        <Link
          to="/portal/login"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md px-4 py-12">
        <div className="rounded-[28px] glass-strong p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="size-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-brand-blue-deep">Set new password</h2>
              <p className="font-body text-xs text-brand-blue-deep/70">
                Choose a new secure password for your account
              </p>
            </div>
          </div>

          {validating ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="size-8 animate-spin mx-auto text-brand-blue-deep" />
              <p className="font-heading text-xs uppercase tracking-wider text-brand-blue-deep/70 font-semibold">
                Validating reset token…
              </p>
            </div>
          ) : validationError ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 flex items-start gap-3">
                <ShieldAlert className="size-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Link Invalid or Expired</p>
                  <p className="mt-1 text-xs text-red-600/90 leading-relaxed">{validationError}</p>
                </div>
              </div>

              <Link
                to="/portal/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 px-6 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                style={{ background: "var(--gradient-cta)" }}
              >
                Return to Sign In
              </Link>
            </div>
          ) : resetSuccess ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Password Reset Complete!</p>
                  <p className="mt-1 text-xs text-emerald-800/90 leading-relaxed">
                    Your password has been updated successfully. All active sessions have been cleared for security.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void navigate({ to: "/portal/login", replace: true })}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 cursor-pointer"
                style={{ background: "var(--gradient-cta)" }}
              >
                Sign In with New Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {accountEmail && (
                <div className="rounded-xl bg-brand-blue-deep/5 border border-brand-blue-deep/10 p-3 text-xs text-brand-blue-deep">
                  Resetting password for <strong className="font-bold">{accountEmail}</strong>
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/75">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="At least 8 characters"
                  disabled={submitting}
                  className="h-12 bg-white/85 text-brand-blue-deep"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/75">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Re-type new password"
                  disabled={submitting}
                  className="h-12 bg-white/85 text-brand-blue-deep"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2"
                style={{ background: "var(--gradient-cta)" }}
              >
                {submitting ? (
                  <>
                    Updating password… <Loader2 className="size-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Reset Password <Lock className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-white/50">
        Quezon City University · Microsoft Student Community
      </footer>
    </div>
  );
}
