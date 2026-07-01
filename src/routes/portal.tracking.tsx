import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, Rocket } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/tracking")({
  head: () => ({
    meta: [
      { title: "Application Status · QCU MSC" },
      { name: "description", content: "Track your QCU MSC application status." },
    ],
  }),
  component: TrackingPage,
});

type StepKey = "submitted" | "review" | "interview" | "decision" | "onboarding";

const STEPS: { key: StepKey; label: string; hint: string }[] = [
  { key: "submitted", label: "Application submitted", hint: "We received your application." },
  { key: "review", label: "Under review", hint: "Management & Development is reviewing your credentials." },
  { key: "interview", label: "Interview scheduled", hint: "We'll email a slot via your QCU address." },
  { key: "decision", label: "Decision", hint: "Acceptance or feedback will arrive here." },
  { key: "onboarding", label: "Onboarding", hint: "Welcome to QCU MSC!" },
];

const UPDATES = [
  { date: "Jun 24, 2026", title: "Moved to Under Review", body: "Your credentials are being reviewed by M&D." },
  { date: "Jun 22, 2026", title: "Application submitted", body: "Thanks for applying. We'll be in touch within 5 business days." },
];

function TrackingPage() {
  const user = usePortalUser();
  const first = user?.fullName.split(" ")[0] ?? "there";
  const currentIdx = 1;
  const progress = Math.round(((currentIdx + 1) / STEPS.length) * 100);

  return (
    <PortalShell
      requireRole="applicant"
      title={`Hi, ${first}`}
      subtitle="Your flight to the lunar base is still being cleared. Here's your current trajectory."

    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PortalCard
            title="Flight status"
            icon={<Rocket className="size-5 text-brand-blue-deep" />}
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/80">
                Trajectory · Stage {currentIdx + 1} of {STEPS.length}
              </p>
              <span className="rounded-full bg-brand-yellow px-3 py-1 font-heading text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue-deep">
                {progress}% Cleared
              </span>
            </div>

            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-brand-blue-light/60">
              <div
                className="h-full rounded-full bg-brand-blue-deep transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ol className="space-y-4">
              {STEPS.map((step, i) => {
                const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
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
                        <Circle className="size-6 text-brand-blue-deep/50" />
                      )}
                    </div>
                    <div>
                      <div
                        className={[
                          "font-heading text-sm font-bold",
                          state === "upcoming" ? "text-brand-blue-deep/60" : "text-brand-blue-deep",
                        ].join(" ")}
                      >
                        {step.label}
                        {state === "current" && (
                          <span className="ml-2 rounded-full bg-brand-blue-deep/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue-deep">
                            In progress
                          </span>
                        )}
                      </div>
                      <div className="font-body text-xs text-brand-blue-deep/80">{step.hint}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </PortalCard>
        </div>

        <div className="lg:col-span-4">
          <PortalCard
            title="Mission log"
            icon={<Clock className="size-5 text-brand-blue-deep" />}
          >
            <ul className="space-y-4">
              {UPDATES.map((u, i) => (
                <li key={i} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-brand-blue-deep" />
                  <div className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/80">
                    {u.date}
                  </div>
                  <div className="mt-0.5 font-display text-sm font-bold text-brand-blue-deep">
                    {u.title}
                  </div>
                  <div className="mt-1 font-body text-xs leading-relaxed text-brand-blue-deep/85">
                    {u.body}
                  </div>
                </li>
              ))}
            </ul>
          </PortalCard>
        </div>
      </div>
    </PortalShell>
  );
}

