import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Rocket, Mail, Copy, Check, ArrowRight, Calendar, Sparkles, Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.webp";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { CenteredRocket } from "@/components/ui/CenteredRocket";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Initiatives } from "@/components/Initiatives";
import { WallOfLogos } from "@/components/WallOfLogos";
import { routeForRole, setPortalUser, usePortalUser } from "@/lib/portal-auth";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QCU Microsoft Student Community" },
      { name: "description", content: "Quezon City University Microsoft Student Community Central Portal." },
    ],
  }),
  component: Landing,
});

// Custom eased smooth scroll — slower & more polished than native behavior:smooth.
export function smoothScrollTo(targetY: number, duration = 800) {
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

export function scrollToSection(id: string) {
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

function Landing() {
  return (
    <>
      {/* SiteHeader must be OUTSIDE the overflow-hidden div so position:fixed works */}
      <SiteHeader />
      <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-sky)" }}>
        <SkyBackdrop />

        {/* Moon placed in the background layer */}
        <DistantMoon />

        {/* Background Animated Rocket: sits behind all page content */}
        <CenteredRocket />

        <main className="relative z-10">
          <Hero />
          <About />
          <Initiatives />
          <WallOfLogos />
        </main>
        <SocialFooter />
      </div>
    </>
  );
}

import moonUrl from "@/assets/moon.svg";

function DistantMoon() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[6%] top-[3%] z-0 hidden sm:block"
    >
      {/* Outer halo */}
      <div
        className="absolute -inset-16 rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, rgba(255,250,220,0.55), transparent 65%)" }}
      />
      {/* Moon Image Asset */}
      <img 
        src={moonUrl} 
        className="relative size-64 sm:size-80 md:size-[24rem] lg:size-[28rem] object-contain drop-shadow-[0_0_40px_rgba(255,245,210,0.35)]" 
        alt="Moon" 
      />
    </div>
  );
}

/* ---------- Footer ---------- */
function SocialFooter() {
  const socials = [
    { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
    { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
    { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: Twitter, label: "X / Twitter", href: "https://twitter.com" },
    { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
  ];

  const footerLinks = [
    {
      heading: "Community",
      links: [
        { label: "About Us", href: "#about" },
        { label: "Events", href: "/events" },
        { label: "Initiatives", href: "#initiatives" },
        { label: "Apply", href: "/apply" },
      ],
    },
    {
      heading: "Resources",
      links: [
        { label: "Student Portal", href: "/portal/login" },
        { label: "Microsoft Learn", href: "https://learn.microsoft.com", external: true },
        { label: "Azure for Students", href: "https://azure.microsoft.com/free/students", external: true },
        { label: "GitHub Education", href: "https://education.github.com", external: true },
      ],
    },
    {
      heading: "Connect",
      links: [
        { label: "Instagram", href: "https://instagram.com", external: true },
        { label: "Facebook", href: "https://facebook.com", external: true },
        { label: "LinkedIn", href: "https://linkedin.com", external: true },
        { label: "YouTube", href: "https://youtube.com", external: true },
      ],
    },
  ];

  return (
    <footer id="footer" className="relative z-10 mt-16 bg-[#f2f2f2]">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-16">
        {/* Top section — logo + link columns */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <img src={logoUrl} alt="QCU MSC logo" className="size-8 shrink-0 object-contain" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[#242424]">Quezon City University</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#616161]">
                  Microsoft Student Community
                </div>
              </div>
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-[#616161]">
              Building the next generation of tech leaders — curious students who ship real things and shape what comes next.
            </p>
            {/* Social icons */}
            <div className="mt-1 flex items-center gap-1">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-8 shrink-0 place-items-center text-[#616161] transition hover:text-[#0067b8]"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#616161]">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(({ label, href, external }) => (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-[#424242] transition hover:text-[#0067b8] hover:underline"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-[13px] text-[#424242] transition hover:text-[#0067b8] hover:underline"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col-reverse items-start justify-between gap-3 border-t border-[#d2d2d2] py-5 text-[12px] text-[#616161] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} QCU Microsoft Student Community. All rights reserved.</p>
          <p>Made with curiosity, caffeine, and a little defiance.</p>
        </div>
      </div>
    </footer>
  );
}
