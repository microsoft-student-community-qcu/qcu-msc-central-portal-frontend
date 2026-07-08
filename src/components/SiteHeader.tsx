import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutDashboard, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.webp";
import { routeForRole, setPortalUser, usePortalUser } from "@/lib/portal-auth";

/* ---------- Apply button (guest only) ---------- */
function ApplyButton() {
  const user = usePortalUser();
  if (user) return null;
  return (
    <Link
      to="/apply"
      className="inline-flex items-center justify-center bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] px-6 py-2 text-center text-sm font-normal text-white transition-colors duration-150 rounded-none shadow-sm"
    >
      Apply
    </Link>
  );
}

/* ---------- Auth action (login link or user avatar) ---------- */
function AuthAction({ scrolled }: { scrolled: boolean }) {
  const user = usePortalUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted || !user) {
    return (
      <Link
        to="/portal/login"
        className="rounded-full px-4 py-2 text-sm font-normal shadow-none transition-colors duration-500 hover:underline"
        style={{ color: scrolled ? "rgba(255,255,255,0.85)" : "rgba(26,40,80,0.8)" }}
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
        className="group flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
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

/* ---------- Main SiteHeader component ---------- */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  // scrolled = true once user has scrolled past 60px
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    // Run once immediately to handle page reload at a scrolled position
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // createPortal mounts the header as a direct child of <body>,
  // escaping every stacking-context ancestor (transform, overflow:hidden, will-change, etc.)
  // that would otherwise break position:fixed.
  const headerJsx = (
    <header
      className="fixed top-0 left-0 right-0 z-[9999] py-4 transition-all duration-500 ease-in-out"
      style={{
        backgroundColor: scrolled ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 1)",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        borderBottom: scrolled
          ? "1px solid transparent"
          : "1px solid rgba(200,210,230,0.4)",
        boxShadow: scrolled ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-6 lg:px-16">
        {/* Logo + name */}
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={logoUrl} alt="QCU MSC logo" className="size-9 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div
              className="truncate font-display text-sm font-extrabold tracking-tight sm:text-base transition-colors duration-500"
              style={{ color: scrolled ? "rgba(255,255,255,0.95)" : "var(--brand-blue-deep)" }}
            >
              <span className="hidden sm:inline">Quezon City University</span>
              <span className="sm:hidden">QCU · MSC</span>
            </div>
            <div
              className="hidden truncate text-[10px] uppercase tracking-[0.18em] sm:block transition-colors duration-500"
              style={{ color: scrolled ? "rgba(255,255,255,0.65)" : "rgba(26,40,80,0.75)" }}
            >
              Microsoft Student Community
            </div>
          </div>
        </div>

        {/* Desktop nav actions */}
        <div className="hidden items-center gap-2 md:flex">
          <AuthAction scrolled={scrolled} />
          <ApplyButton />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="grid size-10 shrink-0 place-items-center rounded-full shadow-sm md:hidden transition-colors duration-500"
          style={{
            backgroundColor: scrolled ? "rgba(255,255,255,0.15)" : "rgb(241,245,249)",
            color: scrolled ? "white" : "var(--brand-blue-deep)",
          }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mx-auto max-w-[1600px] px-6 lg:px-16">
          <div className="mt-2 flex flex-col gap-1 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 p-3 text-sm md:hidden">
            <div className="mt-1 flex flex-col items-stretch gap-2 pt-1 [&>*]:w-full [&_a]:justify-center [&_button]:justify-center">
              <AuthAction scrolled={false} />
              <div onClick={() => setMenuOpen(false)} className="w-full [&>a]:w-full">
                <ApplyButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );

  return createPortal(headerJsx, document.body);
}
