import { Link } from "@tanstack/react-router";
import { motion as m } from "framer-motion";
import { ArrowLeft, Compass, LockKeyhole } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { Button } from "@/components/ui/button";
import { APPLICATIONS_CLOSED_NOTE } from "@/lib/application-window";

/**
 * Rendered in place of every /apply/* screen while APPLICATIONS_OPEN is false.
 * Mirrors the layout, typography, and glass-card styling of the live apply page
 * so the closed state feels like part of the same mission instead of a dead end.
 */
export function ApplicationClosed({
  title = "Applications Closed",
  message = APPLICATIONS_CLOSED_NOTE,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />

      {/* Header matches the apply page header exactly. */}
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
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Left panel — same MissionPanel shape as the live apply page. */}
          <div className="relative min-w-0 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85 drop-shadow">
              <Compass className="size-3.5 text-brand-orange" />
              <span>Recruitment paused</span>
            </div>

            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
              {title}
              <br />
              <span className="text-brand-orange">for now</span>
            </h1>

            <p className="mt-5 max-w-md font-body text-base text-white/85 drop-shadow">
              {message}
            </p>

            {/* Decorative planet — keeps the page visually consistent with /apply. */}
            <div className="relative mt-10 hidden h-64 lg:block" aria-hidden>
              <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25 animate-orbit-slow">
                <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-brand-orange shadow-[0_0_18px_rgba(255,140,60,0.9)]" />
              </div>
              <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 animate-orbit-rev">
                <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
              </div>
              <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 animate-planet-bob">
                <div
                  className="size-full rounded-full shadow-[0_20px_60px_-10px_rgba(255,140,60,0.55)]"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 28%, oklch(0.85 0.12 70), oklch(0.62 0.18 35) 55%, oklch(0.32 0.12 28) 100%)",
                  }}
                />
                <div className="absolute left-[-20%] top-1/2 h-[12%] w-[140%] -translate-y-1/2 rounded-full bg-white/20 blur-[2px]" />
              </div>
            </div>

            {/* Stats strip — same glass-strong card as MissionPanel. */}
            <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl glass-strong p-3 sm:gap-3 sm:p-4">
              {[
                { label: "Status", value: "Closed" },
                { label: "Cycle", value: "2026" },
                { label: "Next", value: "TBA" },
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

          {/* Right card — glass-strong container matching the apply form card. */}
          <div className="lg:pt-6">
            <m.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8 lg:p-10"
            >
              <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-brand-orange/10 text-brand-orange border border-brand-orange/20 sm:size-24">
                <LockKeyhole className="size-10 sm:size-12" aria-hidden="true" />
              </div>

              <h2 className="mt-6 text-center font-display text-2xl font-bold text-brand-blue-deep sm:text-3xl">
                {title}
              </h2>

              <p className="mx-auto mt-3 max-w-md text-center font-body text-base text-brand-blue-deep/80">
                {message}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-brand-blue-deep/20 px-8 text-brand-blue-deep shadow-md transition hover:-translate-y-0.5"
                >
                  <Link to="/">Back to home</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 text-white shadow-lg transition hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  <Link to="/portal/login">Go to portal login</Link>
                </Button>
              </div>

              <div className="mt-8 rounded-2xl bg-brand-blue-deep/5 p-4 text-center text-xs text-brand-blue-deep/70 sm:p-5">
                Already submitted? Check your portal for status updates.
              </div>
            </m.div>
          </div>
        </div>
      </main>
    </div>
  );
}
