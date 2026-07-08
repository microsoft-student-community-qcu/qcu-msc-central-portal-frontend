import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, LogOut, ShieldAlert } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.webp";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import {
  routeForRole,
  setPortalUser,
  usePortalUser,
} from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/restricted")({
  head: () => ({
    meta: [
      { title: "Application Update · QCU MSC" },
      { name: "description", content: "Your application status notice." },
    ],
  }),
  component: RestrictedPage,
});

function RestrictedPage() {
  const user = usePortalUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      void navigate({ to: "/portal/login" });
      return;
    }
    if (user.role !== "restricted") {
      void navigate({ to: routeForRole(user.role) });
    }
  }, [user, navigate]);

  if (!user || user.role !== "restricted") return null;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-sky)" }}>
      <SkyBackdrop />
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
        <button
          type="button"
          onClick={() => {
            setPortalUser(null);
            void navigate({ to: "/portal/login" });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-blue-deep shadow-md hover:bg-white"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-xl px-5 pb-20 sm:px-8">
        <div className="mt-8 rounded-3xl border border-brand-blue-light bg-white shadow-md p-8 text-center sm:p-10">
          <div
            className="mx-auto grid size-16 place-items-center rounded-full"
            style={{ background: "var(--brand-orange)" }}
          >
            <ShieldAlert className="size-8 text-white" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-brand-blue-deep sm:text-3xl">
            Application not accepted
          </h1>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-brand-blue-deep/75">
            Hi {user.fullName.split(" ")[0]}, thanks for applying to QCU MSC. After review, the
            M&D team wasn't able to move your application forward this intake period.
          </p>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/90 p-5 text-left">
            <div className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              Rejection notice
            </div>
            <p className="mt-2 font-body text-sm text-orange-900/90">
              We received a strong pool of applicants this cycle. You're welcome to re-apply during
              the next intake period. Until then, your account has limited access — member resources
              and re-application are temporarily disabled.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-left">
            <RestrictedRow label="Resource Vault" />
            <RestrictedRow label="Event fast-pass" />
            <RestrictedRow label="Re-apply" hint="Opens during the next intake period." />
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-blue-deep px-6 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="size-4" /> Back to Space
          </Link>
        </div>
      </main>
    </div>
  );
}

function RestrictedRow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-brand-blue-light bg-white px-4 py-2.5">
      <div>
        <div className="font-display text-sm font-bold text-brand-blue-deep">{label}</div>
        {hint && <div className="font-body text-[11px] text-brand-blue-deep/60">{hint}</div>}
      </div>
      <span className="rounded-full bg-orange-100 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-orange-700">
        Restricted
      </span>
    </div>
  );
}
