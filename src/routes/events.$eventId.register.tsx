import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  AlertCircle,
} from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { findEvent, type FullEvent } from "@/lib/events-data";
import { getPortalUser } from "@/lib/portal-auth";
import type { IdSubmission } from "@/components/IdUploadScanner";

// Lazy-load the OCR scanner (~2 MB tesseract.js) so it only downloads when the
// user actually reaches the scan step.
const IdUploadScanner = lazy(() =>
  import("@/components/IdUploadScanner").then((m) => ({ default: m.IdUploadScanner })),
);


export const Route = createFileRoute("/events/$eventId/register")({
  loader: ({ params }) => {
    const event = findEvent(params.eventId);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Register · ${loaderData?.event.title ?? "Event"} — QCU MSC` },
      {
        name: "description",
        content: loaderData?.event
          ? `Board the mission for ${loaderData.event.title} — ${loaderData.event.date}, ${loaderData.event.location}.`
          : "Register for a QCU MSC mission.",
      },
    ],
  }),
  notFoundComponent: EventNotFound,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-brand-blue-deep p-6 text-center text-white">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Something knocked us off course</h1>
        <p className="mt-2 text-sm text-white/70">{(error as Error).message}</p>
        <Link to="/events" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-blue-deep">
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </div>
    </div>
  ),
  component: RegisterPage,
});

function EventNotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-6 text-center" style={{ background: "var(--gradient-space)" }}>
      <SkyBackdrop variant="space" />
      <div className="relative z-10 rounded-[2rem] glass-strong p-10 text-brand-blue-deep">
        <Rocket className="mx-auto size-10 text-brand-orange" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">Mission not found</h1>
        <p className="mt-2 max-w-sm font-body text-sm text-brand-blue-deep/70">
          That orbit doesn't match anything on the manifest. Pick a different mission from the events deck.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-heading text-sm font-bold text-white shadow"
          style={{ background: "var(--gradient-cta)" }}
        >
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </div>
    </div>
  );
}

/* ---------- Types ---------- */

type Step =
  | "scan"
  | "boarding"
  | "launching"
  | "launched"
  | "duplicate";


type ExtractedId = {
  studentNumber: string;
  fullName: string;
  program: string;
};

const MOCK_EXISTING = new Set(["2022-00001", "2021-04567"]);

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/* ---------- Page ---------- */

function RegisterPage() {
  const { event } = Route.useLoaderData();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("scan");

  const [extracted, setExtracted] = useState<ExtractedId | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Member fast-track: signed-in members skip ID scan entirely.
  useEffect(() => {
    const user = getPortalUser();
    if (user && user.role === "member") {
      setExtracted({
        studentNumber: user.studentNumber,
        fullName: user.fullName,
        program: "Verified QCU MSC member",
      });
      setName(user.fullName);
      setEmail(user.email);
      setStep("launching");
      const t = window.setTimeout(() => setStep("launched"), 900);
      return () => window.clearTimeout(t);
    }
  }, []);

  const handleScanComplete = (_payload: IdSubmission) => {
    // TODO: replace with backend OCR result. Template values shown for now.
    const ex: ExtractedId = {
      studentNumber: "2023-08812",
      fullName: "Maya R. Salonga",
      program: "BS Information Technology",
    };
    if (MOCK_EXISTING.has(ex.studentNumber)) {
      setExtracted(ex);
      setStep("duplicate");
      return;
    }
    setExtracted(ex);
    setName(ex.fullName);
    setStep("boarding");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const submitBoarding = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required for your ticket.";
    else if (name.trim().length < 2) next.name = "Use your full name as printed on your ID.";
    if (!email.trim()) next.email = "We need an email to dispatch your QR ticket.";
    else if (!isValidEmail(email)) next.email = "That email address doesn't look right.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStep("launching");
    window.setTimeout(() => setStep("launched"), 1400);
  };

  const stage = stageMeta(step);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-space)" }}>
      <SkyBackdrop variant="space" />

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
          to="/events"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back to Space</span><span className="sm:hidden">Back to Space</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <MissionPanel
            event={event}
            eyebrow={stage.eyebrow}
            title={stage.title}
            subtitle={stage.subtitle}
            stats={[
              { label: "Step", value: stage.stepLabel },
              { label: "Phase", value: stage.phase },
              { label: "Mission", value: event.tag },
            ]}
            progress={stage.progress}
          />

          <div className="lg:pt-6">
            <div
              key={step}
              className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {step === "scan" && (
                <Suspense fallback={<div className="grid place-items-center py-12 text-sm text-brand-blue-deep/70"><Loader2 className="size-5 animate-spin" /></div>}>
                  <IdUploadScanner onSubmit={handleScanComplete} />
                </Suspense>
              )}




              {step === "boarding" && extracted && (
                <BoardingStep
                  event={event}
                  extracted={extracted}
                  name={name}
                  email={email}
                  errors={errors}
                  onName={setName}
                  onEmail={setEmail}
                  onSubmit={submitBoarding}
                  onBack={() => setStep("scan")}
                />
              )}

              {step === "launching" && <LaunchingStep />}

              {step === "launched" && extracted && (
                <LaunchedStep
                  event={event}
                  extracted={extracted}
                  email={email || "you@qcu.edu.ph"}
                  onDone={() => navigate({ to: "/events" })}
                />
              )}

              {step === "duplicate" && extracted && (
                <DuplicateStep event={event} extracted={extracted} onDone={() => navigate({ to: "/events" })} />
              )}
            </div>

            {step !== "launched" && step !== "duplicate" && (
              <p className="mt-4 text-[11px] text-white/75 drop-shadow">
                You can leave any time — your seat isn't locked until lift-off.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- Stage metadata ---------- */

function stageMeta(step: Step): {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  stepLabel: string;
  phase: string;
  progress: number;
} {
  switch (step) {

    case "scan":
      return {
        eyebrow: "Mission clearance",
        title: <>Claim your<br /><span className="text-brand-orange">seat in orbit</span></>,
        subtitle: "Confirm your student status to reserve your spot on this mission. Your ID is verified on-device — no data leaves the ship.",
        stepLabel: "01",
        phase: "Clearance",
        progress: 40,
      };
    case "boarding":
      return {
        eyebrow: "Boarding pass",
        title: <>Tag your<br /><span className="text-brand-orange">manifest entry</span></>,
        subtitle: "Almost cleared for launch. Add the name and email we'll print on your QR boarding pass.",
        stepLabel: "02",
        phase: "Boarding",
        progress: 70,
      };
    case "launching":
      return {
        eyebrow: "Launch sequence",
        title: <>Reserving your<br /><span className="text-brand-orange">seat in orbit</span></>,
        subtitle: "Minting your QR ticket and prepping the dispatch email. Stand by for lift-off.",
        stepLabel: "03",
        phase: "Launching",
        progress: 90,
      };
    case "launched":
      return {
        eyebrow: "Lift-off confirmed",
        title: <>You're cleared for<br /><span className="text-brand-orange">arrival</span></>,
        subtitle: "Your boarding pass is on its way. Show the QR at the door — see you on mission day.",
        stepLabel: "04",
        phase: "Cleared",
        progress: 100,
      };
    case "duplicate":
      return {
        eyebrow: "Orbit already claimed",
        title: <>This crew badge<br /><span className="text-brand-orange">is on the list</span></>,
        subtitle: "That student number already has a seat. Check your email for the original boarding pass.",
        stepLabel: "—",
        phase: "Duplicate",
        progress: 100,
      };
  }
}

/* ---------- Steps ---------- */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="font-display text-xl font-extrabold text-brand-blue-deep sm:text-2xl">{title}</h3>
      <p className="mt-1.5 font-body text-sm text-brand-blue-deep/65">{subtitle}</p>
    </div>
  );
}

function BriefStep({ event, onMember, onGeneral }: { event: FullEvent; onMember: () => void; onGeneral: () => void }) {
  return (
    <div>
      <StepHeader
        title="How will you board?"
        subtitle="QCU MSC members get priority access during the early window. Open admission opens shortly after."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          onClick={onMember}
          className="group relative overflow-hidden rounded-3xl p-6 text-left transition hover:-translate-y-1"
          style={{
            background: "linear-gradient(135deg, var(--brand-blue-deep), var(--brand-blue))",
            boxShadow: "0 20px 40px -20px color-mix(in oklab, var(--brand-blue-deep) 55%, transparent)",
          }}
        >
          <Sparkles className="size-6 text-brand-yellow" />
          <div className="mt-3 font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/80">
            Priority lane
          </div>
          <div className="mt-1 font-display text-lg font-bold text-white">I'm a QCU MSC member</div>
          <p className="mt-1 font-body text-xs text-white/75">
            Skip the queue — your seat is reserved during the priority window.
          </p>
          {event.priorityStartDate && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-white">
              Opens {event.priorityStartDate}
            </div>
          )}
        </button>

        <button
          onClick={onGeneral}
          className="group rounded-3xl border-2 border-brand-blue-light bg-white p-6 text-left transition hover:-translate-y-1 hover:border-brand-blue"
        >
          <IdCard className="size-6 text-brand-orange" />
          <div className="mt-3 font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-blue-deep/60">
            Open admission
          </div>
          <div className="mt-1 font-display text-lg font-bold text-brand-blue-deep">I'll scan my QCU ID</div>
          <p className="mt-1 font-body text-xs text-brand-blue-deep/60">
            No account needed — verify enrollment in seconds, get your ticket by email.
          </p>
          {event.generalStartDate && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-blue-light/60 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue-deep">
              Opens {event.generalStartDate}
            </div>
          )}
        </button>
      </div>

      <div className="mt-7 grid gap-2 rounded-2xl border border-white/60 bg-white/55 p-4 text-sm text-brand-blue-deep/75 sm:grid-cols-3">
        <Meta icon={<Calendar className="size-4" />} label={event.date} />
        <Meta icon={<Clock className="size-4" />} label={event.time} />
        <Meta icon={<MapPin className="size-4" />} label={event.location} />
      </div>
    </div>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.15em] text-brand-blue-deep/65">
      <span className="text-brand-orange">{icon}</span>
      <span className="truncate normal-case tracking-normal text-brand-blue-deep">{label}</span>
    </div>
  );
}

function MemberConfirmStep({ event, onBack, onConfirm }: { event: FullEvent; onBack: () => void; onConfirm: () => void }) {
  return (
    <div>
      <StepHeader
        title="Confirm your priority seat"
        subtitle={`Lock in your seat for ${event.title}. We'll send the QR boarding pass to your QCU email.`}
      />
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-brand-blue-light/60 bg-brand-blue-light/25 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: "var(--brand-blue-deep)" }}>
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-brand-blue-deep/60">Signed in as</div>
          <div className="truncate font-display text-base font-bold text-brand-blue-deep">Maya R. Salonga · 2023-08812</div>
        </div>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/60 pt-5 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-heading text-sm font-bold text-brand-blue-deep hover:bg-brand-blue-light/40"
        >
          <ArrowLeft className="size-4" /> Back to Space
        </button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
          style={{ background: "var(--gradient-cta)" }}
        >
          Confirm seat <Rocket className="size-4" />
        </button>
      </div>
    </div>
  );
}

function BoardingStep({
  event,
  extracted,
  name,
  email,
  errors,
  onName,
  onEmail,
  onSubmit,
  onBack,
}: {
  event: FullEvent;
  extracted: ExtractedId;
  name: string;
  email: string;
  errors: { name?: string; email?: string };
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <StepHeader
        title="Tag your boarding pass"
        subtitle="Your QCU ID checks out. Add the name and email we'll print on the QR ticket."
      />
      <div
        className="mt-5 flex items-start gap-3 rounded-2xl border p-3 sm:p-4"
        style={{
          background: `color-mix(in oklab, ${event.accent} 10%, white)`,
          borderColor: `color-mix(in oklab, ${event.accent} 35%, transparent)`,
        }}
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: event.accent }} />
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue-deep/60 sm:text-[11px]">Verified for mission access</div>
          <div className="mt-0.5 break-words font-display text-[13px] font-bold leading-snug text-brand-blue-deep sm:text-sm">
            {extracted.fullName}
            <span className="text-brand-blue-deep/50"> · </span>
            {extracted.studentNumber}
            <span className="text-brand-blue-deep/50"> · </span>
            <span className="font-semibold text-brand-blue-deep/80">{extracted.program}</span>
          </div>
        </div>
      </div>


      <div className="mt-5 grid gap-4">
        <Field label="Full name" icon={<User className="size-4" />} error={errors.name}>
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="As it should appear on your ticket"
            aria-invalid={Boolean(errors.name)}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>
        <Field label="Email address" icon={<Mail className="size-4" />} error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="you@qcu.edu.ph"
            aria-invalid={Boolean(errors.email)}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/60 pt-5 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-heading text-sm font-bold text-brand-blue-deep hover:bg-brand-blue-light/40"
        >
          <ArrowLeft className="size-4" /> Re-scan
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
          style={{ background: "var(--gradient-cta)" }}
        >
          Lock in my seat <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-2xl border-2 bg-white px-4 py-3.5 font-body text-sm text-brand-blue-deep placeholder:text-brand-blue-deep/35 focus:outline-none transition",
    hasError
      ? "border-red-400 focus:ring-4 focus:ring-red-200"
      : "border-brand-blue-light focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/20",
  ].join(" ");
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div
        className={[
          "mb-1.5 flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em]",
          error ? "text-red-600" : "text-brand-blue-deep/65",
        ].join(" ")}
      >
        {icon}
        {label}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 inline-flex items-center gap-1 font-heading text-xs font-bold text-red-600">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      )}
    </label>
  );
}

function LaunchingStep() {
  return (
    <div className="py-12 text-center">
      <div className="relative mx-auto size-16">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-orange/30" />
        <div className="absolute inset-2 grid place-items-center rounded-full text-white" style={{ background: "var(--gradient-cta)" }}>
          <Rocket className="size-6" />
        </div>
      </div>
      <p className="mt-6 font-display text-xl font-extrabold text-brand-blue-deep">Initiating launch sequence…</p>
      <p className="mt-1 font-body text-sm text-brand-blue-deep/55">Reserving your seat and minting the QR boarding pass.</p>
      <div className="mx-auto mt-6 flex items-center justify-center gap-2 text-brand-blue-deep/50">
        <Loader2 className="size-4 animate-spin" />
        <span className="font-heading text-xs uppercase tracking-[0.2em]">T-minus a few seconds</span>
      </div>
    </div>
  );
}

function LaunchedStep({
  event,
  extracted,
  email,
  onDone,
}: {
  event: FullEvent;
  extracted: ExtractedId;
  email: string;
  onDone: () => void;
}) {
  const payload = useMemo(
    () => `QCUMSC:${event.id}:${extracted.studentNumber}:${Date.now().toString(36)}`,
    [event.id, extracted.studentNumber],
  );
  const firstName = extracted.fullName.split(" ")[0];

  const handleDownload = async () => {
    try {
      // Dynamic-import jsPDF (~200 KB) only when the user actually clicks download.
      const { buildTicketPDF } = await import("@/lib/boarding-pass-pdf");
      const blob = await buildTicketPDF({ event, extracted, email, payload });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qcumsc-${event.id}-${extracted.studentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Boarding pass download failed", err);
    }
  };

  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl text-white" style={{ background: "var(--gradient-cta)" }}>
        <CheckCircle2 className="size-8" />
      </div>
      <h3 className="mt-4 font-display text-2xl font-extrabold text-brand-blue-deep">
        Cleared for arrival, {firstName}!
      </h3>
      <p className="mx-auto mt-1 max-w-md font-body text-sm text-brand-blue-deep/60">
        Your QR boarding pass just shipped to{" "}
        <span className="font-bold text-brand-blue-deep">{email}</span>. Show this code at the gate.
      </p>

      <div
        className="mx-auto mt-6 max-w-sm rounded-[2rem] border border-brand-blue-light bg-white p-5 text-left"
        style={{ boxShadow: "0 25px 50px -25px color-mix(in oklab, var(--brand-blue-deep) 35%, transparent)" }}
      >
        <FakeQR seed={payload} accent={event.accent} />
        <div className="mt-4">
          <div className="font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-blue-deep/55">
            {event.tag} · {event.date}
          </div>
          <div className="mt-0.5 font-display text-base font-bold text-brand-blue-deep">{event.title}</div>
          <div className="mt-1 font-body text-xs text-brand-blue-deep/60">
            {extracted.fullName} · {extracted.studentNumber}
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-heading text-sm font-bold text-brand-blue-deep hover:bg-brand-blue-light/40"
        >
          <ArrowLeft className="size-4" /> Back to Space
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
          style={{ background: "var(--gradient-cta)" }}
        >
          <Download className="size-4" /> Save boarding pass
        </button>
      </div>
    </div>
  );
}

function qrCellsFor(seed: string, size: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out.push(((h >>> 0) % 100) < 48);
  }
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderCell = (r: number, c: number) => {
    const localR = r < 7 ? r : r - (size - 7);
    const localC = c < 7 ? c : c - (size - 7);
    const ring = localR === 0 || localR === 6 || localC === 0 || localC === 6;
    const inner = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
    return ring || inner;
  };
  return { out, isFinder, finderCell };
}

function buildTicketSVG({
  event,
  extracted,
  email,
  payload,
}: {
  event: FullEvent;
  extracted: ExtractedId;
  email: string;
  payload: string;
}) {
  const W = 640;
  const H = 980;
  const size = 25;
  const qrPx = 360;
  const qrX = (W - qrPx) / 2;
  const qrY = 230;
  const cell = qrPx / size;
  const { out, isFinder, finderCell } = qrCellsFor(payload, size);
  const rects: string[] = [];
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const onFinder = isFinder(r, c);
    const filled = onFinder ? finderCell(r, c) : out[i];
    if (!filled) continue;
    const x = qrX + c * cell;
    const y = qrY + r * cell;
    rects.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#0b1f4d"/>`);
  }
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, system-ui, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1f4d"/>
      <stop offset="100%" stop-color="#142a66"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="36" fill="url(#bg)"/>
  <rect x="32" y="32" width="${W - 64}" height="160" rx="24" fill="#ffffff" fill-opacity="0.08"/>
  <text x="56" y="78" fill="#ffffff" opacity="0.7" font-size="13" letter-spacing="3" font-weight="700">QCU · MSC BOARDING PASS</text>
  <text x="56" y="118" fill="#ffffff" font-size="26" font-weight="800">${esc(event.title)}</text>
  <text x="56" y="150" fill="#ffffff" opacity="0.85" font-size="16">${esc(event.tag)} · ${esc(event.date)}</text>
  <text x="56" y="174" fill="#ffffff" opacity="0.7" font-size="14">${esc(event.location)}</text>

  <rect x="${qrX - 18}" y="${qrY - 18}" width="${qrPx + 36}" height="${qrPx + 36}" rx="24" fill="#ffffff"/>
  ${rects.join("")}

  <text x="${W / 2}" y="${qrY + qrPx + 70}" text-anchor="middle" fill="#ffffff" opacity="0.65" font-size="12" letter-spacing="2" font-weight="700">PASSENGER</text>
  <text x="${W / 2}" y="${qrY + qrPx + 100}" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="800">${esc(extracted.fullName)}</text>
  <text x="${W / 2}" y="${qrY + qrPx + 126}" text-anchor="middle" fill="#ffffff" opacity="0.8" font-size="14">${esc(extracted.studentNumber)} · ${esc(extracted.program)}</text>
  <text x="${W / 2}" y="${qrY + qrPx + 150}" text-anchor="middle" fill="#ffffff" opacity="0.6" font-size="12">${esc(email)}</text>

  <text x="${W / 2}" y="${H - 36}" text-anchor="middle" fill="#ffffff" opacity="0.45" font-size="11" letter-spacing="2">${esc(payload)}</text>
</svg>`;
}


function DuplicateStep({
  event,
  extracted,
  onDone,
}: {
  event: FullEvent;
  extracted: ExtractedId;
  onDone: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-red-600">
        <AlertCircle className="size-7" />
      </div>
      <h3 className="mt-4 font-display text-xl font-extrabold text-brand-blue-deep">This crew badge is already manifested</h3>
      <p className="mx-auto mt-2 max-w-md font-body text-sm text-brand-blue-deep/65">
        Student number <span className="font-bold text-brand-blue-deep">{extracted.studentNumber}</span> already holds a seat for{" "}
        <span className="font-bold text-brand-blue-deep">{event.title}</span>. Check your email for the original boarding pass, or reach out to the MSC team.
      </p>
      <button
        onClick={onDone}
        className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
        style={{ background: "var(--brand-blue-deep)" }}
      >
        <ArrowLeft className="size-4" /> Back to Space
      </button>
    </div>
  );
}

/* ---------- Mission panel (matches /apply) ---------- */

function MissionPanel({
  event,
  eyebrow,
  title,
  subtitle,
  stats,
  progress,
}: {
  event: FullEvent;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  stats: { label: string; value: string }[];
  progress?: number;
}) {
  return (
    <div className="relative min-w-0 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85 drop-shadow">
        <Compass className="size-3.5 text-brand-orange" />
        <span>{eyebrow}</span>
      </div>

      <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
        {title}
      </h1>

      <p className="mt-5 max-w-md font-body text-base text-white/85 drop-shadow">{subtitle}</p>

      <div
        className="mt-7 flex w-full max-w-full items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-left backdrop-blur"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl font-heading text-[10px] font-extrabold uppercase tracking-[0.15em] text-white"
          style={{ background: event.accent }}
        >
          <Ticket className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
            {event.tag} · {event.date}
          </div>
          <div className="truncate font-display text-base font-bold text-white">{event.title}</div>
          <div className="truncate text-[11px] text-white/75">{event.location}</div>
        </div>
      </div>

      <div className="relative mt-10 hidden h-64 lg:block">
        <DestinationPlanet accent={event.accent} />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl glass-strong p-3 sm:gap-3 sm:p-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-blue-deep/60 sm:text-[10px] sm:tracking-[0.18em]">{s.label}</div>
            <div className="mt-1 break-words font-display text-sm font-extrabold leading-tight text-brand-blue-deep sm:text-lg">{s.value}</div>
          </div>
        ))}
      </div>

      {typeof progress === "number" && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--gradient-cta)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DestinationPlanet({ accent }: { accent: string }) {
  return (
    <div aria-hidden className="relative size-full">
      <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25 animate-orbit-slow">
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.6)]" style={{ background: accent }} />
      </div>
      <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 animate-orbit-rev">
        <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 animate-planet-bob">
        <div
          className="size-full rounded-full shadow-[0_20px_60px_-10px_rgba(255,140,60,0.55)]"
          style={{
            background:
              "radial-gradient(circle at 30% 28%, oklch(0.88 0.1 230), oklch(0.55 0.16 250) 55%, oklch(0.25 0.12 270) 100%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-3 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full opacity-80"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.1 60 / 0.6), oklch(0.92 0.05 80 / 0.85), oklch(0.78 0.1 60 / 0.6), transparent)",
          }}
        />
      </div>
      
    </div>
  );
}


/* ---------- QR ---------- */

function FakeQR({ seed, accent }: { seed: string; accent: string }) {
  const size = 21;
  const cells = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const out: boolean[] = [];
    for (let i = 0; i < size * size; i++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      out.push(((h >>> 0) % 100) < 48);
    }
    return out;
  }, [seed]);

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderCell = (r: number, c: number) => {
    const localR = r < 7 ? r : r - (size - 7);
    const localC = c < 7 ? c : c - (size - 7);
    const ring = localR === 0 || localR === 6 || localC === 0 || localC === 6;
    const inner = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
    return ring || inner;
  };

  return (
    <div
      className="grid aspect-square w-full overflow-hidden rounded-2xl p-3"
      style={{ background: "white", border: "1px solid color-mix(in oklab, var(--brand-blue-deep) 8%, transparent)" }}
    >
      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gap: "2px" }}>
        {Array.from({ length: size * size }).map((_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const onFinder = isFinder(r, c);
          const filled = onFinder ? finderCell(r, c) : cells[i];
          return (
            <span
              key={i}
              className="block rounded-[2px]"
              style={{
                background: filled
                  ? onFinder
                    ? "var(--brand-blue-deep)"
                    : `color-mix(in oklab, ${accent} 75%, var(--brand-blue-deep))`
                  : "transparent",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
