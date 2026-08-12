import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  IdCard,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { ApplicationClosed } from "@/components/ApplicationClosed";
import { APPLICATIONS_OPEN } from "@/lib/application-window";

export const Route = createFileRoute("/apply/dashboard")({
  head: () => ({
    meta: [
      { title: "Applicant Dashboard · QCU MSC" },
      {
        name: "description",
        content:
          "Track the status of your QCU MSC application from submission to onboarding.",
      },
    ],
  }),
  component: APPLICATIONS_OPEN ? ApplyDashboardPage : ApplicationClosed,
});

type Applicant = {
  studentId: string;
  fullName: string;
  email: string;
  role: string;
  provisional: boolean;
};

type StepKey = "submitted" | "review" | "interview" | "decision" | "onboarding";

const STEPS: { key: StepKey; label: string; hint: string }[] = [
  { key: "submitted", label: "Application Submitted", hint: "We received your application." },
  { key: "review", label: "Under Review", hint: "Management & Development is reviewing your credentials." },
  { key: "interview", label: "Interview Scheduled", hint: "We'll email an interview slot via your QCU address." },
  { key: "decision", label: "Decision", hint: "Acceptance or feedback will arrive here." },
  { key: "onboarding", label: "Onboarding", hint: "Welcome to QCU MSC!" },
];

function ApplyDashboardPage() {
  const [applicant, setApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qcumsc.applicant");
      if (raw) setApplicant(JSON.parse(raw) as Applicant);
    } catch {
      /* ignore */
    }
  }, []);

  // Current status: provisional applicants stay at "submitted" until admin verification;
  // verified applicants progress to "review".
  const currentIdx = applicant?.provisional ? 0 : 1;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-sky)" }}
    >
      <SkyBackdrop variant="space" />
      <header className="relative z-20 mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoUrl} alt="QCU MSC logo" className="size-9 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-base font-extrabold tracking-tight text-white drop-shadow">
              Quezon City University
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/85 drop-shadow">
              Microsoft Student Community
            </div>
          </div>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand-blue-deep shadow-md hover:bg-white"
        >
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow sm:text-4xl">
            Welcome, {applicant?.fullName?.split(" ")[0] || "Applicant"}
          </h1>
          <p className="mx-auto mt-2 max-w-md font-body text-sm text-white/85 drop-shadow">
            Here's the live status of your application.
          </p>
        </div>

        {/* Profile card */}
        <div className="mt-8 grid gap-4 rounded-3xl glass-strong p-6 sm:grid-cols-2 sm:p-8">
          <Info icon={<User className="size-4" />} label="Full name" value={applicant?.fullName} />
          <Info icon={<IdCard className="size-4" />} label="Student #" value={applicant?.studentId || "Pending verification"} />
          <Info icon={<Mail className="size-4" />} label="QCU email" value={applicant?.email} />
          <Info icon={<Sparkles className="size-4" />} label="Preferred role" value={applicant?.role} />
        </div>

        {applicant?.provisional && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50/90 p-4 text-left font-heading text-xs font-bold text-orange-700">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <span>
              Your ID is awaiting manual verification by an admin. Your application will move
              forward once that completes.
            </span>
          </div>
        )}

        {/* Status tracker */}
        <div className="mt-8 rounded-3xl glass-strong p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-brand-blue-deep">
            Application status
          </h2>
          <ol className="mt-5 space-y-4">
            {STEPS.map((step, i) => {
              const state =
                i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {state === "done" ? (
                      <CheckCircle2 className="size-6 text-emerald-600" />
                    ) : state === "current" ? (
                      <span className="grid size-6 place-items-center rounded-full bg-brand-blue-deep text-white">
                        <Clock className="size-3.5" />
                      </span>
                    ) : (
                      <Circle className="size-6 text-brand-blue-deep/30" />
                    )}
                  </div>
                  <div>
                    <div
                      className={[
                        "font-heading text-sm font-bold",
                        state === "upcoming"
                          ? "text-brand-blue-deep/45"
                          : "text-brand-blue-deep",
                      ].join(" ")}
                    >
                      {step.label}
                      {state === "current" && (
                        <span className="ml-2 rounded-full bg-brand-blue-deep/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue-deep">
                          In progress
                        </span>
                      )}
                    </div>
                    <div className="font-body text-xs text-brand-blue-deep/65">
                      {step.hint}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </main>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 p-4">
      <div className="flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/65">
        {icon}
        {label}
      </div>
      <div className="mt-1 break-words font-body text-sm text-brand-blue-deep">
        {value || <span className="text-brand-blue-deep/40">—</span>}
      </div>
    </div>
  );
}
