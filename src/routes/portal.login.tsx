import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { Input } from "@/components/ui/input";
import {
  routeForRole,
  setPortalUser,
  type PortalUser,
  type PortalRole,
} from "@/lib/portal-auth";
import { authClient } from "@/lib/auth-client";

import { getApiEndpoint } from "@/lib/api-config";

export const Route = createFileRoute("/portal/login")({
  head: () => ({
    meta: [
      { title: "Sign in · QCU MSC Portal" },
      { name: "description", content: "Sign in to your QCU MSC applicant or member portal." },
    ],
  }),
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      const res = await fetch(getApiEndpoint("/api/v1/auth/student/sign-in"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        credentials: "include",
      });

      const resData = await res.json();

      if (!res.ok) {
        setError(resData.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      if (resData?.user) {
        const user = resData.user as any;
        let portalRole: PortalRole = "restricted";
        if (user.role === "APPLICANT") {
          portalRole = "applicant";
        } else if (user.role === "MEMBER") {
          portalRole = "member";
        }

        const backendUser: PortalUser = {
          email: user.email,
          fullName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          studentNumber: user.studentId || "",
          role: portalRole,
        };

        setPortalUser(backendUser);
        void navigate({ to: routeForRole(portalRole) });
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-space)" }}>
      <SkyBackdrop variant="space" />

      <header className="relative z-30 mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-10">
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
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to Space</span>
          <span className="sm:hidden">Back to Space</span>
        </Link>
      </header>

      {/* Asymmetric split: cinematic stage on the left, docked form on the right */}
      <main className="relative z-10 mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-4 pb-24 pt-4 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pt-6">
        {/* LEFT — flight stage */}
        <section className="relative min-h-[460px] lg:min-h-[640px]">
          {/* Diagonal trajectory line */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 600 600"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trail" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,180,90,0)" />
                <stop offset="35%" stopColor="rgba(255,180,90,0.55)" />
                <stop offset="100%" stopColor="rgba(255,245,210,0.9)" />
              </linearGradient>
            </defs>
            <path
              d="M 40 560 Q 260 380 540 80"
              fill="none"
              stroke="url(#trail)"
              strokeWidth="2"
              strokeDasharray="6 10"
              className="animate-trail-pulse"
            />
          </svg>

          {/* Approaching moon — top right of the stage */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 sm:-right-4 sm:-top-4"
            style={{ animation: "float-slow 14s ease-in-out infinite" }}
          >
            <div
              className="absolute -inset-16 rounded-full blur-3xl opacity-70"
              style={{ background: "radial-gradient(circle, rgba(255,250,220,0.55), transparent 65%)" }}
            />
            <div
              className="relative size-[14rem] rounded-full shadow-[0_0_120px_rgba(255,245,210,0.45)] sm:size-[22rem] lg:size-[26rem]"
              style={{
                background:
                  "radial-gradient(circle at 30% 28%, #fdf6e3 0%, #ece6d8 35%, #c9c2b1 70%, #8c8d92 100%)",
              }}
            >
              <span className="absolute left-[22%] top-[28%] size-7 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-60" />
              <span className="absolute left-[55%] top-[18%] size-4 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-55" />
              <span className="absolute left-[62%] top-[52%] size-10 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-60" />
              <span className="absolute left-[30%] top-[68%] size-5 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-55" />
              <span className="absolute left-[12%] top-[55%] size-3 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-55" />
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle at 80% 75%, rgba(40,40,55,0.4), transparent 55%)" }}
              />
            </div>
          </div>

          {/* Rocket flying diagonally toward the moon */}
          <FlyingRocketToMoon />

          {/* Oversized typographic statement, anchored bottom-left (NOT centered) */}
          <div className="absolute bottom-0 left-0 z-20 max-w-xl pr-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-blue-deep shadow-sm">
              Mission control · re-entry channel open
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white drop-shadow sm:text-6xl lg:text-7xl">
              Re-dock<br />
              <span className="italic font-light">at</span>{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-cta)" }}
              >
                Moon HQ.
              </span>
            </h1>
            <p className="mt-4 max-w-sm font-body text-sm text-white/80 drop-shadow">
              Your rocket is on final approach. Authenticate to dock and rejoin the crew already in orbit.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-white/70">
              <div>
                <div className="font-display text-xl font-extrabold text-white sm:text-2xl">02:14</div>
                <div className="text-[10px] uppercase tracking-[0.2em]">to dock</div>
              </div>
              <div className="hidden h-8 w-px bg-white/25 sm:block" />
              <div>
                <div className="font-display text-xl font-extrabold text-white sm:text-2xl">384k</div>
                <div className="text-[10px] uppercase tracking-[0.2em]">km traveled</div>
              </div>
              <div className="hidden h-8 w-px bg-white/25 sm:block" />
              <div>
                <div className="font-display text-xl font-extrabold text-white sm:text-2xl">98%</div>
                <div className="text-[10px] uppercase tracking-[0.2em]">fuel</div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — docked form column, top-aligned (not centered) */}
        <section className="relative lg:pt-8">
          <div className="lg:sticky lg:top-8">
            <div className="mb-4 flex items-center gap-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/80">
              <span className="size-1.5 rounded-full bg-brand-green animate-pulse" />
              Docking sequence · step 01
            </div>

            <form onSubmit={onSubmit} className="space-y-5 rounded-[28px] glass-strong p-6 sm:p-8">
              <div>
                <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/65">
                  QCU email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@qcu.edu.ph"
                  className="h-12 bg-white/85"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/65">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="h-12 bg-white/85"
                />
              </div>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                style={{ background: "var(--gradient-cta)" }}
              >
                <LogIn className="size-4" /> Sign in & dock
              </button>
              <p className="text-center font-body text-xs text-brand-blue-deep/60">
                New here?{" "}
                <Link to="/apply" className="font-bold text-brand-blue-deep underline">
                  Apply for membership
                </Link>
              </p>
            </form>

          </div>
        </section>
      </main>
    </div>
  );
}

function FlyingRocketToMoon() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[6%] top-[14%] z-10 sm:left-[10%] sm:top-[22%]"
    >
      <div className="animate-rocket-cruise">
        <div className="relative animate-shake">
          <img
            src={logoUrl}
            alt=""
            className="h-16 w-auto object-contain drop-shadow-[0_8px_24px_rgba(255,140,0,0.55)] sm:h-20"
          />

          {/* Exhaust flames behind the rocket (opposite of flight direction) */}
          <div className="pointer-events-none absolute left-1/2 top-[92%] -translate-x-1/2">
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-2 h-20 w-16 rounded-full blur-2xl opacity-80"
              style={{ background: "radial-gradient(ellipse at top, #ffb347 0%, #ff5e1f 45%, transparent 75%)" }}
            />
            <div
              className="absolute left-1/2 top-0 h-16 w-8 animate-flame"
              style={{
                background: "linear-gradient(180deg, #fff3a8 0%, #ffb347 25%, #ff7a18 60%, #ff3d00 100%)",
                borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
                filter: "blur(1px)",
              }}
            />
            <div
              className="absolute left-1/2 top-1 h-11 w-4 animate-flame-inner"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #fff3a8 35%, #ffd24a 70%, #ff8a00 100%)",
                borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

