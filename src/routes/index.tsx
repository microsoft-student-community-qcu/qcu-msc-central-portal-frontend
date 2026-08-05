import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Rocket,
  Mail,
  Copy,
  Check,
  ArrowRight,
  Calendar,
  Sparkles,
  Instagram,
  Linkedin,
  Facebook,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import azureCommunityLogo from "../assets/images/partners/microsoft-azure-community-philippines.svg";
import bitsLogo from "../assets/images/partners/bits.svg";
import mscPupLogo from "../assets/images/partners/msc-pup.svg";
import dataEngineeringPilipinasLogo from "../assets/images/partners/data-engineering-pilipinas.svg";
import datacampDonatesLogo from "../assets/images/partners/datacamp-donates.svg";
import mscBulsuLogo from "../assets/images/partners/msc-bulsu.svg";
import mscLpubLogo from "../assets/images/partners/msc-lpub.svg";
import mscNudLogo from "../assets/images/partners/msc-nud.svg";
import mscNulLogo from "../assets/images/partners/msc-nul.svg";
import mscPlmLogo from "../assets/images/partners/msc-plm.svg";
import mscApcLogo from "../assets/images/partners/msc-apc.svg";
import mscDlsuLogo from "../assets/images/partners/msc-dlsu.svg";
import powerBiLogo from "../assets/images/partners/power-bi.svg";
import devconManilaLogo from "../assets/images/partners/devcon-manila.svg";
import mscPhilippinesLogo from "../assets/images/partners/msc-philippines.svg";


import { routeForRole, setPortalUser, usePortalUser } from "@/lib/portal-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QCU MSC — Defying the Odds" },
      {
        name: "description",
        content:
          "Quezon City University Microsoft Student Community — events, initiatives, and collaborations defying the odds.",
      },
      { property: "og:title", content: "QCU MSC — Defying the Odds" },
      {
        property: "og:description",
        content:
          "Join the Microsoft Student Community at QCU. Active initiatives, partner collaborations, and a community defying the odds.",
      },
    ],
  }),
  component: Landing,
});

const COLLAB_EMAIL = "msc-qcu@outlook.com"; // General collaboration email
const PARTNERSHIP_EMAIL = "mscqcurelations@outlook.com";

type EventItem = {
  id: string;
  title: string;
  date: string;
  tag: string;
  blurb: string;
  accent: string;
  image?: string;
};

// Set this to true to show "Coming Soon" design, false to show actual events
const SHOW_COMING_SOON = true;

// Static event data.
const EVENTS: EventItem[] = [
  {
    id: "ai-launchpad",
    title: "AI Launchpad: Build with Copilot",
    date: "Jul 12, 2026 · 9:00 AM",
    tag: "Hackathon",
    blurb:
      "A full-day build sprint powered by GitHub Copilot and Azure AI — ship a working prototype before sundown.",
    accent: "var(--brand-orange)",
  },
  {
    id: "cloud-clinic",
    title: "Cloud Clinic: Azure Fundamentals",
    date: "Jul 26, 2026 · 1:00 PM",
    tag: "Workshop",
    blurb:
      "Hands-on lab covering identity, storage, and serverless — leave with a deployable starter and AZ-900 prep notes.",
    accent: "var(--brand-green)",
  },
  {
    id: "design-jam",
    title: "Design Jam: Inclusive Interfaces",
    date: "Aug 9, 2026 · 10:00 AM",
    tag: "Community",
    blurb:
      "Pair up with designers and devs to reimagine campus tools through an accessibility-first lens.",
    accent: "var(--brand-blue)",
  },
];

type Partner = { name: string; logo: string };

const PARTNERS: Partner[] = [
  { name: "Microsoft Azure Community Philippines", logo: azureCommunityLogo },
  { name: "BITS", logo: bitsLogo },
  { name: "MSC PUP", logo: mscPupLogo },
  { name: "Data Engineering Pilipinas", logo: dataEngineeringPilipinasLogo },
  { name: "DataCamp Donates", logo: datacampDonatesLogo },
  { name: "Power BI Pilipinas", logo: powerBiLogo },
  { name: "DEVCON Manila", logo: devconManilaLogo },
  { name: "MSC Philippines", logo: mscPhilippinesLogo },

  { name: "MSC BULSU", logo: mscBulsuLogo },
  { name: "MSC LPUB", logo: mscLpubLogo },
  { name: "MSC NUD", logo: mscNudLogo },
  { name: "MSC NUL", logo: mscNulLogo },
  { name: "MSC PLM", logo: mscPlmLogo },
  { name: "MSC APC", logo: mscApcLogo },
  { name: "MSC DLSU", logo: mscDlsuLogo },
];

// Social media links
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/mscqcu?igsh=OGNiYWxzMTduZ2F4&utm_source=qr",
  facebook: "https://www.facebook.com/share/1cMFPEUjRo/?mibextid=wwXIfr",
  linkedin: "https://www.linkedin.com/company/microsoft-student-community-quezon-city-university/",
  tiktok: "https://www.tiktok.com/@mscqcu?_r=1&_t=ZS-982xD8IfXj6",
};

function Landing() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-sky)" }}
    >
      <SkyBackdrop />
      <SiteHeader />
      <main className="relative z-10">
        <Hero />
        <Initiatives />
        <WallOfLogos />
      </main>
      <SocialFooter />
    </div>
  );
}

/* ---------- Background ---------- */

function Cloud({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 80" className={`absolute ${className}`} style={style} aria-hidden>
      <defs>
        <radialGradient id="cg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="100%" stopColor="white" stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="50" rx="50" ry="28" fill="url(#cg)" />
      <ellipse cx="110" cy="40" rx="45" ry="32" fill="url(#cg)" />
      <ellipse cx="150" cy="55" rx="38" ry="22" fill="url(#cg)" />
    </svg>
  );
}

function LoggedInApplyReplacement() {
  const user = usePortalUser();
  if (user) return null;
  return (
    <Link
      to="/apply"
      className="inline-flex items-center justify-center rounded-full px-4 py-2 text-center text-sm font-semibold text-white shadow-lg"
      style={{ background: "var(--gradient-cta)" }}
    >
      Apply
    </Link>
  );
}

/* ---------- Header ---------- */
function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header className="relative z-20 mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-8 md:flex md:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={logoUrl} alt="QCU MSC logo" className="size-9 shrink-0 object-contain" />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-sm font-extrabold tracking-tight text-white drop-shadow sm:text-base">
            <span className="hidden sm:inline">Quezon City University</span>
            <span className="sm:hidden">QCU · MSC</span>
          </div>
          <div className="hidden truncate text-[10px] uppercase tracking-[0.18em] text-white/80 drop-shadow sm:block">
            Microsoft Student Community
          </div>
        </div>
      </div>
      <nav className="hidden items-center gap-1 rounded-full glass-strong px-2 py-1.5 text-sm md:flex">
        <a
          href="#initiatives"
          onClick={(e) => handleNavClick(e, "initiatives")}
          className="rounded-full px-3 py-1.5 font-semibold text-brand-blue-deep transition hover:bg-white/70"
        >
          Initiatives
        </a>
        <a
          href="#partners"
          onClick={(e) => handleNavClick(e, "partners")}
          className="rounded-full px-3 py-1.5 font-semibold text-brand-blue-deep transition hover:bg-white/70"
        >
          Partners
        </a>
        <a
          href="#collaborate"
          onClick={(e) => handleNavClick(e, "collaborate")}
          className="rounded-full px-3 py-1.5 font-semibold text-brand-blue-deep transition hover:bg-white/70"
        >
          Collaborate
        </a>
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        <AuthHeaderAction variant="desktop" />
        <LoggedInApplyReplacement />
      </div>

      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/90 text-brand-blue-deep shadow-md md:hidden"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {menuOpen && (
        <div className="col-span-2 mt-2 flex flex-col gap-1 rounded-3xl glass-strong p-3 text-sm md:hidden">
          <a
            href="#initiatives"
            onClick={(e) => handleNavClick(e, "initiatives")}
            className="rounded-2xl px-4 py-3 font-semibold text-brand-blue-deep transition hover:bg-white/70"
          >
            Initiatives
          </a>
          <a
            href="#partners"
            onClick={(e) => handleNavClick(e, "partners")}
            className="rounded-2xl px-4 py-3 font-semibold text-brand-blue-deep transition hover:bg-white/70"
          >
            Partners
          </a>
          <a
            href="#collaborate"
            onClick={(e) => handleNavClick(e, "collaborate")}
            className="rounded-2xl px-4 py-3 font-semibold text-brand-blue-deep transition hover:bg-white/70"
          >
            Collaborate
          </a>
          <div className="mt-1 flex flex-col items-stretch gap-2 border-t border-white/40 pt-3 [&>*]:w-full [&_a]:justify-center [&_button]:justify-center">
            <AuthHeaderAction variant="mobile" />
            <div onClick={() => setMenuOpen(false)} className="w-full [&>a]:w-full">
              <LoggedInApplyReplacement />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function AuthHeaderAction({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const user = usePortalUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted || !user) {
    return variant === "mobile" ? (
      <Link
        to="/portal/login"
        onClick={() => setOpen(false)}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand-blue-deep px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        Log In
      </Link>
    ) : (
      <Link
        to="/portal/login"
        className="rounded-full px-4 py-2 text-sm font-semibold text-white/90 shadow-none transition hover:text-white hover:underline"
      >
        Log In
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
  const roleLabel =
    user.role === "member" ? "Member" : user.role === "applicant" ? "Applicant" : "Restricted";

  const signOut = () => {
    setPortalUser(null);
    setOpen(false);
    void navigate({ to: "/" });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-full bg-white/90 py-1 pl-1 pr-3 shadow-md ring-1 ring-white/60 transition hover:bg-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-blue-deep font-display text-xs font-extrabold text-white shadow-inner">
          {initials || "·"}
        </span>
        <span className="hidden font-heading text-xs font-bold uppercase tracking-[0.14em] text-brand-blue-deep md:inline">
          {user.fullName.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-brand-blue-light bg-white shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-brand-blue-light/60 bg-gradient-to-br from-white to-brand-blue-light/40 p-4">
            <span className="grid size-11 place-items-center rounded-full bg-brand-blue-deep font-display text-sm font-extrabold text-white shadow-inner">
              {initials || "·"}
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-bold text-brand-blue-deep">
                {user.fullName}
              </div>
              <div className="truncate font-body text-[11px] text-brand-blue-deep/60">
                {user.email}
              </div>
              <div className="mt-1 inline-flex items-center rounded-full bg-brand-blue-deep/10 px-2 py-0.5 font-heading text-[9px] font-bold uppercase tracking-[0.18em] text-brand-blue-deep">
                {roleLabel}
              </div>
            </div>
          </div>
          <div className="flex flex-col p-2">
            <Link
              to={dashboardRoute}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-heading text-sm font-semibold text-brand-blue-deep transition hover:bg-brand-blue-light/40"
            >
              <LayoutDashboard className="size-4 text-brand-blue-deep/70" />
              Go to dashboard
            </Link>
            <Link
              to="/portal/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-heading text-sm font-semibold text-brand-blue-deep transition hover:bg-brand-blue-light/40"
            >
              <UserIcon className="size-4 text-brand-blue-deep/70" />
              Profile
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 font-heading text-sm font-semibold text-brand-orange transition hover:bg-brand-orange/10"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom eased smooth scroll — slower & more polished than native behavior:smooth.
function smoothScrollTo(targetY: number, duration = 800) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (Math.abs(diff) < 2) return;
  const startTime = performance.now();
  // easeInOutCubic
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    window.scrollTo(0, startY + diff * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector("header");
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
  smoothScrollTo(Math.max(0, top), 900);
  el.classList.remove("section-target");
  void el.offsetWidth;
  el.classList.add("section-target");
  history.replaceState(null, "", `#${id}`);
}

function HeroApplyCTA() {
  const user = usePortalUser();
  if (!user) {
    return (
      <Link
        to="/apply"
        className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-heading text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5"
        style={{ background: "var(--gradient-cta)" }}
      >
        Apply to the Community
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
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
      className="group inline-flex items-center justify-center gap-3 rounded-full bg-white/95 px-6 py-3.5 font-heading text-sm font-semibold text-brand-blue-deep shadow-xl transition hover:-translate-y-0.5 hover:bg-white"
    >
      <span className="grid size-8 place-items-center rounded-full bg-brand-blue-deep font-display text-xs font-extrabold text-white shadow-inner">
        {initials || "·"}
      </span>
      <span>Go to Dashboard</span>
      <ArrowRight className="size-4 transition group-hover:translate-x-0.5 text-brand-blue-deep/70" />
    </Link>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-8 sm:pt-14 sm:pb-28">
      {/* Distant moon — the destination, glimmering through the sky */}
      <DistantMoon />

      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: copy */}
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-blue-deep shadow-sm">
            <span className="size-1.5 rounded-full bg-brand-green animate-pulse" />
            Now boarding · Destination: Moon HQ
          </span>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.25)] sm:text-6xl lg:text-7xl">
            Building tomorrow's
            <br />
            <span className="relative inline-block">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, var(--brand-orange), var(--brand-yellow), var(--brand-green), var(--brand-blue))",
                }}
              >
                changemakers
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-xl font-body text-base text-white/85 drop-shadow sm:text-lg">
            The Microsoft Student Community at Quezon City University — strap in, we're charting a
            course past the clouds toward Moon HQ, where curious students ship real things and shape
            what comes next.
          </p>

          {/* Tagline in Inter Semibold */}
          <div className="mt-8 flex items-center gap-3">
            <p className="text-tagline text-2xl text-white drop-shadow sm:text-3xl">
              "Defying the Odds"
            </p>
          </div>

          {/* Dual CTAs */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row" id="apply">
            <HeroApplyCTA />
            <a
              href={`mailto:${COLLAB_EMAIL}?subject=Collaboration%20with%20QCU%20MSC`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/95 px-6 py-3.5 font-heading text-sm font-semibold text-brand-blue-deep shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
            >
              Collaborate With Us
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        {/* Right: rocket visual */}
        <RocketVisual />
      </div>

      {/* Collaborate panel */}
      <CollaborateCard />
    </section>
  );
}

function DistantMoon() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[4%] top-[2%] z-0 hidden sm:block"
      style={{ animation: "float-slow 12s ease-in-out infinite" }}
    >
      {/* Outer halo */}
      <div
        className="absolute -inset-16 rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, rgba(255,250,220,0.55), transparent 65%)" }}
      />
      {/* Moon body */}
      <div
        className="relative size-32 rounded-full shadow-[0_0_60px_rgba(255,245,210,0.35)] sm:size-40 lg:size-48"
        style={{
          background:
            "radial-gradient(circle at 30% 28%, #fdf6e3 0%, #ece6d8 35%, #c9c2b1 70%, #8c8d92 100%)",
        }}
      >
        {/* craters */}
        <span className="absolute left-[22%] top-[28%] size-3 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-70" />
        <span className="absolute left-[55%] top-[18%] size-2 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-60" />
        <span className="absolute left-[62%] top-[52%] size-5 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-70" />
        <span className="absolute left-[30%] top-[68%] size-2.5 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-65" />
        <span className="absolute left-[44%] top-[44%] size-1.5 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-60" />
        {/* terminator shadow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 80% 70%, rgba(40,40,55,0.35), transparent 55%)",
          }}
        />
      </div>
    </div>
  );
}

function RocketVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* Glow */}
      <div
        className="absolute inset-6 rounded-full blur-3xl opacity-70"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--brand-yellow) 60%, transparent), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 rounded-[2rem] glass-strong p-6">
        <div
          className="relative h-full w-full overflow-hidden rounded-2xl"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.18 0.08 255 / 0.95) 0%, oklch(0.32 0.12 248 / 0.85) 40%, oklch(0.72 0.10 235 / 0.55) 78%, oklch(0.95 0.03 235 / 0.45) 100%)",
          }}
        >
          {/* Stars — keep count low; parent is a backdrop-filter card so each animation tick is expensive */}
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/90 animate-sparkle"
              style={{
                top: `${(i * 17) % 65}%`,
                left: `${(i * 31) % 95}%`,
                width: `${(i % 2) + 1}px`,
                height: `${(i % 2) + 1}px`,
                animationDelay: `${(i % 5) * 0.3}s`,
              }}
            />
          ))}

          {/* Destination moon at the top of the scene */}
          <div className="pointer-events-none absolute right-5 top-5">
            <div
              className="absolute -inset-6 rounded-full blur-2xl opacity-70"
              style={{
                background: "radial-gradient(circle, rgba(255,245,210,0.7), transparent 65%)",
              }}
            />
            <div
              className="relative size-16 rounded-full shadow-[0_0_30px_rgba(255,245,210,0.45)]"
              style={{
                background:
                  "radial-gradient(circle at 30% 28%, #fdf6e3 0%, #ece6d8 40%, #c9c2b1 75%, #8c8d92 100%)",
              }}
            >
              <span className="absolute left-[24%] top-[30%] size-1.5 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-70" />
              <span className="absolute left-[60%] top-[50%] size-2 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-70" />
              <span className="absolute left-[40%] top-[66%] size-1 rounded-full bg-[color:var(--moon-cream-shadow)] opacity-65" />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 78% 72%, rgba(40,40,55,0.4), transparent 55%)",
                }}
              />
            </div>
          </div>

          {/* Logo with rocket flight + flames */}
          <div className="absolute left-1/2 top-[45%] h-[68%] -translate-x-1/2 -translate-y-1/2 animate-flight">
            <div className="relative h-full animate-shake">
              <img
                src={logoUrl}
                alt="QCU MSC rocket logo"
                className="h-full w-auto object-contain drop-shadow-[0_8px_20px_rgba(255,140,0,0.45)]"
              />
              {/* Flames */}
              <div className="pointer-events-none absolute left-1/2 top-[92%] -translate-x-1/2">
                {/* Outer glow */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-2 h-24 w-20 rounded-full blur-2xl opacity-80"
                  style={{
                    background:
                      "radial-gradient(ellipse at top, #ffb347 0%, #ff5e1f 45%, transparent 75%)",
                  }}
                />
                {/* Outer flame */}
                <div
                  className="absolute left-1/2 top-0 h-20 w-10 animate-flame"
                  style={{
                    background:
                      "linear-gradient(180deg, #fff3a8 0%, #ffb347 25%, #ff7a18 60%, #ff3d00 100%)",
                    borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
                    filter: "blur(1px)",
                  }}
                />
                {/* Inner flame */}
                <div
                  className="absolute left-1/2 top-1 h-14 w-5 animate-flame-inner"
                  style={{
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #fff3a8 35%, #ffd24a 70%, #ff8a00 100%)",
                    borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
                  }}
                />
              </div>
              {/* Smoke puffs */}
              <div className="pointer-events-none absolute left-1/2 top-[112%] h-16 w-24 -translate-x-1/2">
                {[
                  { delay: "0s", dx: "-18px", size: 10 },
                  { delay: "0.6s", dx: "14px", size: 12 },
                  { delay: "1.1s", dx: "-6px", size: 9 },
                  { delay: "1.6s", dx: "20px", size: 11 },
                ].map((p, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-0 rounded-full bg-white/70 blur-md animate-smoke"
                    style={{
                      width: p.size * 2,
                      height: p.size * 2,
                      animationDelay: p.delay,
                      // @ts-expect-error css var
                      "--dx": p.dx,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cloud layer at the bottom (rocket is leaving the clouds behind) */}
          <Cloud className="-left-10 -bottom-8 w-56 opacity-95" />
          <Cloud
            className="left-1/2 -bottom-10 w-72 opacity-90"
            style={{ transform: "translateX(-50%)" }}
          />
          <Cloud className="-right-8 -bottom-6 w-60 opacity-90" />


        </div>
      </div>
    </div>
  );
}

function CollaborateCard() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PARTNERSHIP_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      id="collaborate"
      className="mt-14 grid gap-4 rounded-3xl glass-strong p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
          <span className="size-1.5 rounded-full bg-brand-orange" /> For Corporate Partners
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold text-brand-blue-deep sm:text-3xl">
          Let's build something the industry will remember.
        </h3>
        <p className="mt-1.5 font-body text-sm text-brand-blue-deep/70">
          Sponsorships, talks, hackathons, recruitment drives — pitch us your idea.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={`mailto:${PARTNERSHIP_EMAIL}?subject=Partnership%20with%20QCU%20MSC`}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-heading text-sm font-semibold text-white shadow-lg"
          style={{ background: "var(--gradient-cta-alt)" }}
        >
          <Mail className="size-4" /> Email us
        </a>
        <button
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-blue-deep/15 bg-white/70 px-5 py-3 font-heading text-sm font-semibold text-brand-blue-deep transition hover:bg-white"
        >
          {copied ? (
            <>
              <Check className="size-4 text-brand-green" /> Copied!
            </>
          ) : (
            <>
              <Copy className="size-4" /> Copy email
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Initiatives ---------- */
function Initiatives() {
  // If SHOW_COMING_SOON is true OR EVENTS array is empty, show the coming soon design
  const showComingSoon = SHOW_COMING_SOON || EVENTS.length === 0;

  return (
    <section id="initiatives" className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80 drop-shadow">
            Active Initiatives
          </span>
          <h2 className="mt-1 font-display text-3xl font-bold text-white drop-shadow sm:text-4xl">
            What's launching next
          </h2>
        </div>
        <Link
          to="/coming-soon"
          className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:inline-flex"
        >
          All events <ArrowRight className="size-4" />
        </Link>
      </div>

      {showComingSoon ? (
        <ComingSoonEvents />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.slice(0, 3).map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const initials = event.title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase();
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl glass-strong transition hover:-translate-y-1">
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{
          background: event.image
            ? undefined
            : `linear-gradient(135deg, color-mix(in oklab, ${event.accent} 70%, white) 0%, color-mix(in oklab, ${event.accent} 30%, white) 100%)`,
        }}
      >
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <>
            <span
              aria-hidden
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <Sparkles className="absolute right-3 top-3 size-4 text-white/80 animate-sparkle" />
            <span className="absolute inset-0 grid place-items-center font-display text-4xl font-extrabold tracking-tight text-brand-blue-deep/85 drop-shadow-sm">
              {initials}
            </span>
            <span className="absolute bottom-2 left-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue-deep/70">
              Event photo
            </span>
          </>
        )}
        <span className="absolute right-3 bottom-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-brand-blue-deep shadow-sm">
          {event.tag}
        </span>
      </div>
      <div className="relative flex flex-1 flex-col p-5">
        <div
          className="absolute -right-10 -top-10 size-40 rounded-full opacity-30 blur-2xl"
          style={{ background: event.accent }}
        />
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue-deep/70">
          <Calendar className="size-3.5" /> {event.date}
        </div>
        <h3 className="mt-2 font-display text-xl font-bold text-brand-blue-deep">{event.title}</h3>
        <p className="mt-1.5 font-body text-sm text-brand-blue-deep/70">{event.blurb}</p>
        <div className="mt-5 flex items-center justify-end">
          <Link
            to="/coming-soon"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow"
            style={{ background: "var(--gradient-cta)" }}
          >
            Register Now <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- Coming Soon Events Layer ---------- */
function ComingSoonEvents() {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl glass-strong p-8 sm:p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative">
          <div
            className="absolute -inset-8 rounded-full blur-3xl opacity-30"
            style={{ background: "var(--brand-orange)" }}
          />
          <div className="relative">
            <h3 className="font-display text-3xl font-bold text-brand-blue-deep sm:text-4xl">
              Coming Soon
            </h3>
            <div
              className="mt-2 h-1 w-20 rounded-full mx-auto"
              style={{ background: "var(--gradient-cta)" }}
            />
            <p className="mt-4 max-w-lg font-body text-sm text-brand-blue-deep/70">
              Exciting initiatives are brewing for this semester! Follow our socials to be the first
              to know when we launch.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <SocialPill
                icon={<Instagram className="size-4" />}
                label="Instagram"
                href={SOCIAL_LINKS.instagram}
              />
              <SocialPill
                icon={<Facebook className="size-4" />}
                label="Facebook"
                href={SOCIAL_LINKS.facebook}
              />
              <SocialPill
                icon={<Linkedin className="size-4" />}
                label="LinkedIn"
                href={SOCIAL_LINKS.linkedin}
              />
              <SocialPill
                icon={<FaTiktok className="size-4" />}
                label="TikTok"
                href={SOCIAL_LINKS.tiktok}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyEvents() {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl glass-strong p-8 sm:p-12">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div
          className="relative grid size-24 shrink-0 place-items-center rounded-2xl"
          style={{ background: "var(--gradient-cta-alt)" }}
        >
          <Rocket className="size-10 text-white" />
          <Sparkles className="absolute -right-2 -top-2 size-5 text-brand-yellow animate-sparkle" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold text-brand-blue-deep sm:text-3xl">
            Initiatives are brewing.
          </h3>
          <p className="mt-2 max-w-xl font-body text-brand-blue-deep/75">
            Exciting initiatives are brewing for this semester! Follow our socials for the latest
            announcements.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <SocialPill
              icon={<Instagram className="size-4" />}
              label="Instagram"
              href={SOCIAL_LINKS.instagram}
            />
            <SocialPill
              icon={<Facebook className="size-4" />}
              label="Facebook"
              href={SOCIAL_LINKS.facebook}
            />
            <SocialPill
              icon={<Linkedin className="size-4" />}
              label="LinkedIn"
              href={SOCIAL_LINKS.linkedin}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialPill({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  return (
    <a
      href={href || "#footer"}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-blue-deep hover:bg-white"
    >
      {icon} {label}
    </a>
  );
}

/* ---------- Wall of Logos ---------- */
function WallOfLogos() {
  const accents = [
    "var(--brand-orange)",
    "var(--brand-green)",
    "var(--brand-blue)",
    "var(--brand-yellow)",
  ];
  return (
    <section id="partners" className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue-deep/60">
          Trusted Collaborators
        </span>
        <h2 className="mt-1 font-display text-3xl font-bold text-brand-blue-deep sm:text-4xl">
          Backed by the brands shaping the future
        </h2>
      </div>
      <p className="mx-auto mt-3 max-w-xl text-center font-body text-sm text-brand-blue-deep/65">
        Communities and organizations we've built, learned, and shipped alongside.
      </p>
      <LogoSlideshow partners={PARTNERS} accents={accents} />
    </section>
  );
}

function LogoSlideshow({ partners, accents }: { partners: Partner[]; accents: string[] }) {
  const perSlide = 5;
  const slides: Partner[][] = [];
  for (let i = 0; i < partners.length; i += perSlide) {
    slides.push(partners.slice(i, i + perSlide));
  }
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <div className="mt-10">
      <div className="relative grid items-start">
        {slides.map((group, sIdx) => (
          <div
            key={sIdx}
            className="col-start-1 row-start-1 grid grid-cols-2 place-items-start justify-items-center gap-x-4 gap-y-8 transition-opacity duration-700 ease-out sm:flex sm:flex-wrap sm:items-start sm:justify-center sm:gap-10"

            style={{
              opacity: sIdx === index ? 1 : 0,
              pointerEvents: sIdx === index ? "auto" : "none",
            }}
            aria-hidden={sIdx !== index}
          >
            {group.map((p, i) => {
              const accent = accents[(sIdx * perSlide + i) % accents.length];
              return (
                <div
                  key={p.name}
                  className="group flex w-full min-w-0 max-w-[9rem] flex-col items-center gap-2 sm:w-28 sm:max-w-none"
                >
                  <div
                    className="relative grid aspect-square w-20 shrink-0 place-items-center overflow-hidden rounded-full p-3 transition duration-300 group-hover:-translate-y-0.5 sm:w-24"

                    style={{
                      background:
                        "radial-gradient(circle at 30% 25%, color-mix(in oklab, white 95%, transparent), color-mix(in oklab, white 60%, transparent))",
                      boxShadow: `0 10px 25px -12px color-mix(in oklab, ${accent} 55%, transparent), inset 0 0 0 1px color-mix(in oklab, white 70%, transparent)`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 140deg, ${accent}, transparent 35%, transparent 65%, ${accent})`,
                        WebkitMask: "radial-gradient(circle, transparent 58%, black 60%)",
                        mask: "radial-gradient(circle, transparent 58%, black 60%)",
                        opacity: 0.55,
                      }}
                    />
                    <img
                      src={p.logo}
                      alt={`${p.name} logo`}
                      loading="lazy"
                      decoding="async"
                      className="relative h-full w-full object-cover"
                    />
                  </div>
                  <span className="w-full text-balance break-words text-center font-heading text-xs font-semibold leading-snug tracking-tight text-brand-blue-deep/80 sm:text-sm">
                    {p.name}
                  </span>

                </div>
              );
            })}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {slides.map((_, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => setIndex(sIdx)}
              aria-label={`Show partner set ${sIdx + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: sIdx === index ? 24 : 8,
                background:
                  sIdx === index
                    ? "var(--brand-blue-deep)"
                    : "color-mix(in oklab, var(--brand-blue-deep) 25%, transparent)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Footer ---------- */
function SocialFooter() {
  const socials = [
    {
      icon: Instagram,
      label: "Instagram",
      href: SOCIAL_LINKS.instagram,
    },
    {
      icon: Facebook,
      label: "Facebook",
      href: SOCIAL_LINKS.facebook,
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: SOCIAL_LINKS.linkedin,
    },
    {
      icon: FaTiktok,
      label: "TikTok",
      href: SOCIAL_LINKS.tiktok,
    },
  ];

  return (
    <footer id="footer" className="relative z-10 mt-10 px-4 pb-10 sm:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl glass-strong p-5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logoUrl} alt="QCU MSC logo" className="size-10 shrink-0 object-contain" />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-sm font-extrabold text-brand-blue-deep sm:text-base">
                Quezon City University
              </div>
              <div className="truncate text-[11px] text-brand-blue-deep/70">
                Microsoft Student Community
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/70 text-brand-blue-deep transition hover:bg-white hover:text-brand-orange"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse items-start justify-between gap-2 border-t border-white/60 pt-4 text-[11px] text-brand-blue-deep/70 sm:mt-6 sm:flex-row sm:items-center sm:gap-3 sm:text-xs">
          <p>© {new Date().getFullYear()} Microsoft Student Community · Quezon City University</p>
          <p>Made with curiosity, caffeine, and a little defiance.</p>
        </div>
      </div>
    </footer>
  );
}
