import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Lock,
  Mail,
  Orbit,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { Input } from "@/components/ui/input";
import { clearAccountRedirect } from "@/lib/application-flow";
import { setPortalUser } from "@/lib/portal-auth";

export const Route = createFileRoute("/apply/account")({
  head: () => ({
    meta: [
      { title: "Claim your cockpit · QCU MSC" },
      {
        name: "description",
        content:
          "Set your password and unlock your QCU MSC mission control to follow your application across the stars.",
      },
    ],
  }),
  component: ApplyAccountPage,
});

type Applicant = {
  studentId: string;
  fullName: string;
  email: string;
  role: string;
  provisional: boolean;
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
};

function ApplyAccountPage() {
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearAccountRedirect();
    try {
      const raw = sessionStorage.getItem("qcumsc.applicant");
      if (raw) setApplicant(JSON.parse(raw) as Applicant);
    } catch {
      /* ignore */
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!applicant) {
      setError("No applicant data found. Please start over.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const firstName = applicant.firstName || (applicant.fullName.trim().split(" ").slice(1).join(" ") || "");
      const lastName = applicant.lastName || (applicant.fullName.trim().split(" ")[0] || "");
      const middleInitial = applicant.middleInitial || "";

      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) {
        throw new Error("VITE_API_URL environment variable is required");
      }
      const AUTH_URL = API_URL.replace("/api/v1", "/api/auth/sign-up/email");
      
      const payload: Record<string, any> = {
        name: applicant.fullName,
        studentId: applicant.studentId,
        lastName,
        firstName,
        email: applicant.email,
        password
      };
      if (middleInitial) {
        payload.middleInitial = middleInitial;
      }

      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Failed to create account.");
      }

      try {
        sessionStorage.setItem(
          "qcumsc.account",
          JSON.stringify({ createdAt: new Date().toISOString() }),
        );
      } catch {
        /* ignore */
      }
      
      setPortalUser({
        email: applicant.email,
        fullName: applicant.fullName,
        studentNumber: applicant.studentId,
        role: "applicant",
      });

      void navigate({ to: "/portal/tracking" });
    } catch (err: any) {
      setError(err.message || "An error occurred during account creation.");
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = applicant?.fullName?.split(" ")[0] ?? "cadet";

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />
      <DecorPlanets />

      {/* Header */}
      <header className="relative z-20 mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src={logoUrl} alt="QCU MSC logo" className="size-9 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-sm font-extrabold tracking-tight text-white drop-shadow sm:text-base">
              <span className="hidden sm:inline">Quezon City University</span>
              <span className="sm:hidden">QCU · MSC</span>
            </div>
            <div className="hidden truncate text-[10px] uppercase tracking-[0.18em] text-white/85 drop-shadow sm:block">
              Microsoft Student Community
            </div>
          </div>
        </Link>
        <Link
          to="/apply"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Mission panel — continues the story */}
          <div className="relative min-w-0 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85 drop-shadow">
              <Compass className="size-3.5 text-brand-orange" />
              <span>Chapter 8 · Claim your cockpit</span>
            </div>

            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
              Lock in your<br />
              <span className="text-brand-orange">launch codes</span>
            </h1>

            <p className="mt-5 max-w-md font-body text-base text-white/85 drop-shadow">
              Beautiful work, {firstName}. Your application is already drifting toward Mission Control —
              now we just need a key to your cockpit so you can watch its trajectory in real time.
            </p>

            <p className="mt-3 max-w-md font-body text-sm text-white/70 drop-shadow">
              Set a password for your verified QCU email. From the next screen forward, your applicant
              dashboard will show every checkpoint as it lights up.
            </p>

            <div className="relative mt-10 hidden h-64 lg:block">
              <CockpitPlanet />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl glass-strong p-3 sm:gap-3 sm:p-4">
              {[
                { label: "Step", value: "02" },
                { label: "Phase", value: "Account" },
                { label: "Next", value: "Tracking" },
              ].map((s) => (
                <div key={s.label} className="min-w-0 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-blue-deep/60 sm:text-[10px] sm:tracking-[0.18em]">
                    {s.label}
                  </div>
                  <div className="mt-1 break-words font-display text-sm font-extrabold leading-tight text-brand-blue-deep sm:text-lg">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="lg:pt-6">
            <form
              onSubmit={onSubmit}
              className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-10"
            >
              <div className="space-y-1">
                <p className="font-body text-sm italic text-brand-blue-deep/70">
                  Almost ready for liftoff.
                </p>
                <h2 className="font-display text-2xl font-bold leading-tight text-brand-blue-deep sm:text-3xl">
                  Create your cockpit account
                </h2>
                <p className="font-body text-sm text-brand-blue-deep/65">
                  This is the same QCU email we just verified — no need to retype it.
                </p>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70">
                    <Mail className="size-4" /> Verified QCU email
                  </label>
                  <Input
                    type="email"
                    readOnly
                    value={applicant?.email ?? ""}
                    placeholder="—"
                    className="h-12 bg-emerald-50/70 text-base text-brand-blue-deep"
                  />
                  <p className="mt-1.5 inline-flex items-center gap-1 font-body text-[11px] text-emerald-700">
                    <ShieldCheck className="size-3.5" /> Linked to student #
                    {applicant?.studentId || "—"}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70">
                    <Lock className="size-4" /> Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-12 bg-white/85 text-base"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70">
                    <Lock className="size-4" /> Confirm password
                  </label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-12 bg-white/85 text-base"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-red-600">{error}</p>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/60 pt-6">
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 rounded-full glass-strong px-5 py-2.5 font-heading text-sm font-semibold text-brand-blue-deep transition hover:bg-white"
                >
                  <ArrowLeft className="size-4" /> Back to Space
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  Launch my dashboard <Rocket className="size-4" />
                </button>
              </div>
            </form>

            <p className="mt-4 text-[11px] text-white/75 drop-shadow">
              After liftoff you'll land on your applicant tracking deck.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function CockpitPlanet() {
  return (
    <div aria-hidden className="relative size-full">
      <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25 animate-orbit-slow">
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-brand-orange shadow-[0_0_18px_rgba(255,140,60,0.9)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 animate-orbit-rev">
        <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 animate-planet-bob">
        <div
          className="size-full rounded-full shadow-[0_20px_60px_-10px_rgba(80,160,255,0.55)]"
          style={{
            background:
              "radial-gradient(circle at 30% 28%, oklch(0.88 0.08 230), oklch(0.55 0.16 245) 55%, oklch(0.28 0.1 250) 100%)",
          }}
        />
        <span className="absolute left-[22%] top-[35%] size-3 rounded-full bg-black/20" />
        <span className="absolute left-[55%] top-[60%] size-2 rounded-full bg-black/20" />
        <span className="absolute left-[65%] top-[25%] size-1.5 rounded-full bg-black/15" />
      </div>
      
    </div>
  );
}

function DecorPlanets() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden sm:block">
      <div className="absolute right-[6%] top-[14%] size-24 animate-planet-bob">
        <div
          className="size-full rounded-full opacity-90 shadow-[0_0_40px_rgba(80,160,255,0.35)]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.82 0.1 240), oklch(0.5 0.15 250) 70%, oklch(0.25 0.08 250) 100%)",
          }}
        />
      </div>
      <div className="absolute bottom-[12%] right-[16%] size-12 animate-planet-bob" style={{ animationDelay: "2.5s" }}>
        <div
          className="size-full rounded-full opacity-90"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.78 0.14 320), oklch(0.45 0.18 300) 65%, oklch(0.22 0.1 290) 100%)",
          }}
        />
      </div>
      
    </div>
  );
}
