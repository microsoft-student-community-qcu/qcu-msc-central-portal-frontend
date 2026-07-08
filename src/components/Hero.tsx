import { Link } from "@tanstack/react-router";
import { usePortalUser, routeForRole } from "@/lib/portal-auth";

const COLLAB_EMAIL = "msc.collaborate@qcu.edu.ph";

function HeroApplyCTA() {
  const user = usePortalUser();
  if (!user) {
    return (
      <Link
        to="/apply"
        className="group inline-flex items-center justify-center rounded-none px-8 py-4 font-heading text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5"
        style={{ background: "var(--gradient-cta)" }}
      >
        Apply to the Community
      </Link>
    );
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const dashboardRoute = routeForRole(user.role);

  return (
    <Link
      to={dashboardRoute}
      className="group inline-flex items-center justify-center gap-3 rounded-full bg-white/95 px-8 py-4 font-heading text-base font-semibold text-brand-blue-deep shadow-xl transition hover:-translate-y-0.5 hover:bg-white"
    >
      <span className="grid size-8 place-items-center rounded-full bg-brand-blue-deep font-display text-xs font-extrabold text-white shadow-inner">
        {initials || "·"}
      </span>
      <span className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-brand-blue-deep">
        Go to Dashboard
      </span>
    </Link>
  );
}

export function Hero() {
  return (
    <section className="relative mx-auto max-w-[1600px] px-6 lg:px-16 min-h-screen flex flex-col justify-center">
      {/* Hero text — sits on top of the rocket (z-20) */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center max-w-6xl mx-auto">
        {/* Copy */}
        <div className="relative flex flex-col items-center">
          <h1 className="mt-5 font-display font-extrabold leading-[0.9] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
            <span className="block text-5xl sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
              Building Tomorrow's
            </span>
            <span
              className="mt-2 block bg-clip-text text-6xl text-transparent sm:text-8xl lg:text-[7.5rem] xl:text-[8.5rem]"
              style={{ backgroundImage: "linear-gradient(to right, var(--brand-yellow), var(--brand-orange), var(--brand-green), var(--brand-blue))" }}
            >
              CHANGEMAKERS
            </span>
          </h1>

          <p className="mt-6 max-w-2xl font-body text-base text-white/85 drop-shadow sm:text-lg text-center">
            The Microsoft Student Community at Quezon City University — strap in, we're charting a course past the clouds toward Moon HQ, where curious students ship real things and shape what comes next.
          </p>

          {/* Dual CTAs */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row justify-center items-center" id="apply">
            <HeroApplyCTA />
            <a
              href={`mailto:${COLLAB_EMAIL}?subject=Collaboration%20with%20QCU%20MSC`}
              className="inline-flex items-center justify-center rounded-none border border-white/20 bg-white/10 px-8 py-4 font-heading text-base font-semibold text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              Collaborate With Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
