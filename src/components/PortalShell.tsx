import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";

import {
  getPortalUser,
  routeForRole,
  setPortalUser,
  usePortalUser,
  type PortalRole,
} from "@/lib/portal-auth";
import { authClient } from "@/lib/auth-client";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MEMBER_NAV: NavItem[] = [
  { to: "/portal/dashboard", label: "Workspace", icon: LayoutDashboard },
  { to: "/portal/inbox", label: "M&D Inbox", icon: Bell },
  { to: "/portal/profile", label: "Profile", icon: UserIcon },
];

const APPLICANT_NAV: NavItem[] = [
  { to: "/portal/tracking", label: "Status", icon: ListChecks },
  { to: "/portal/inbox", label: "M&D Inbox", icon: Bell },
  { to: "/portal/profile", label: "Profile", icon: UserIcon },
];

function navForRole(role: PortalRole): NavItem[] {
  if (role === "member") return MEMBER_NAV;
  if (role === "applicant") return APPLICANT_NAV;
  return [];
}

export function PortalShell({
  requireRole,
  title,
  subtitle,
  children,
}: {
  requireRole: PortalRole;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const user = usePortalUser();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // "checking" until the backend session has been resolved at least once.
  // Never bounce to /portal/login while this is true — that race is what made
  // fresh sign-ups land back on the login screen.
  const [sessionState, setSessionState] = useState<"checking" | "valid" | "invalid">("checking");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    const bounce = () => {
      if (cancelled) return;
      setPortalUser(null);
      setSessionState("invalid");
      void navigate({ to: "/portal/login", replace: true });
    };

    const syncSession = async () => {
      // Cold Azure Function starts and slow Set-Cookie propagation can make the
      // first getSession() miss. Retry a few times before treating the user as
      // signed out; only a definitive "no user" after all attempts bounces.
      const MAX_ATTEMPTS = 3;
      const RETRY_DELAY_MS = 600;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        if (cancelled) return;
        try {
          const { data, error } = await authClient.getSession();

          if (!error && data?.user) {
            const backendUser = data.user as any;

            if (backendUser.role === "ADMIN_HR" || backendUser.role === "ADMIN_LOGISTICS") {
              // Admin accounts are forbidden in the Student Portal.
              bounce();
              return;
            }

            let backendPortalRole: PortalRole = "restricted";
            if (backendUser.role === "APPLICANT") {
              backendPortalRole = "applicant";
            } else if (backendUser.role === "MEMBER") {
              backendPortalRole = "member";
            }

            if (cancelled) return;

            // The backend session is the source of truth for identity and role.
            // Always overwrite the localStorage copy so a tampered/stale entry
            // can never grant access to a portal area.
            const cachedUser = getPortalUser();
            const resolved = {
              email: backendUser.email,
              fullName:
                backendUser.name ||
                `${backendUser.firstName || ""} ${backendUser.lastName || ""}`.trim() ||
                "User",
              studentNumber: backendUser.studentId || "",
              role: backendPortalRole,
            };
            if (
              !cachedUser ||
              cachedUser.role !== resolved.role ||
              cachedUser.email !== resolved.email ||
              cachedUser.studentNumber !== resolved.studentNumber ||
              cachedUser.fullName !== resolved.fullName
            ) {
              setPortalUser(resolved);
            }

            setSessionState("valid");
            return;
          }
        } catch (err) {
          console.error(`Session sync attempt ${attempt} failed:`, err);
        }

        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }

      bounce();
    };

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, [mounted, navigate]);

  useEffect(() => {
    if (!mounted || sessionState !== "valid") return;
    if (!user) {
      void navigate({ to: "/portal/login", replace: true });
      return;
    }
    if (user.role !== requireRole) {
      void navigate({ to: routeForRole(user.role) });
    }
  }, [mounted, sessionState, user, requireRole, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!mounted || sessionState !== "valid" || !user || user.role !== requireRole) {
    return <div className="min-h-screen" style={{ background: "var(--gradient-space)" }} />;
  }




  const nav = navForRole(user.role);
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOut = () => {
    // Kill the backend session first — clearing localStorage alone leaves a
    // live session cookie that anyone on the device could resume.
    void (async () => {
      try {
        await authClient.signOut();
      } catch (err) {
        console.error("Sign out failed:", err);
      } finally {
        setPortalUser(null);
        void navigate({ to: "/portal/login", replace: true });
      }
    })();
  };

  const firstName = user.fullName.split(" ")[0];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />




      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* Moon dashboard monolith */}
        <div className="relative flex min-h-[calc(100vh-4rem)] overflow-hidden rounded-[3rem] border border-white/15 bg-dashboard-surface moon-surface text-brand-blue-deep shadow-[0_0_80px_-10px_rgba(255,255,255,0.18),0_30px_80px_-20px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
          <aside className="moon-sidebar-face relative z-10 hidden w-72 shrink-0 flex-col border-r border-brand-blue-deep/10 lg:flex">
            <SidebarBody
              user={user}
              nav={nav}
              pathname={pathname}
              onSignOut={signOut}
              initials={initials}
            />
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-brand-blue-deep/20 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="moon-sidebar-face absolute left-0 top-0 flex h-full w-72 flex-col border-r border-brand-blue-deep/10 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-3 z-10 rounded-full p-2 text-brand-blue-deep/60 hover:bg-brand-blue-deep/10"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
                <SidebarBody
                  user={user}
                  nav={nav}
                  pathname={pathname}
                  onSignOut={signOut}
                  initials={initials}
                />
              </aside>
            </div>
          )}

          {/* Main column */}
          <main className="moon-content-face relative z-10 flex min-w-0 flex-1 flex-col">

            {/* Topbar */}
            <header className="flex h-16 items-center justify-between border-b border-brand-blue-deep/10 px-5 sm:h-20 sm:px-10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-full p-2 text-brand-blue-deep/70 hover:bg-brand-blue-deep/10 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </button>
                <Link
                  to="/"
                  className="group hidden items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/85 transition-colors hover:text-brand-blue-deep sm:inline-flex"
                >
                  <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                  Back to Space
                </Link>

              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Active Session
                </span>
              </div>
            </header>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-10">
              {/* Page header */}
              {user.role === "member" && (
                <div className="mb-10 sm:mb-12">
                  <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-blue-deep sm:text-6xl">
                    {title.includes(",") ? (
                      <>
                        {title.split(",")[0]},
                        <br />
                        <span className="text-brand-blue">
                          {title.split(",").slice(1).join(",").trim() || firstName}
                        </span>
                      </>
                    ) : (
                      title
                    )}
                  </h1>
                  {subtitle && (
                    <p className="mt-4 max-w-lg font-body text-base text-brand-blue-deep/90 sm:text-lg">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarBody({
  user,
  nav,
  pathname,
  onSignOut,
  initials,
}: {
  user: { fullName: string; email: string; role: PortalRole };
  nav: NavItem[];
  pathname: string;
  onSignOut: () => void;
  initials: string;
}) {
  return (
    <>
      <div className="p-8">
        <Link to="/" className="mb-12 flex items-center gap-3">
          <img src={logoUrl} alt="QCU MSC logo" className="size-10 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-sm font-extrabold tracking-tight text-brand-blue-deep">
              QCU&nbsp;·&nbsp;MSC
            </div>
            <div className="font-heading text-[9px] uppercase tracking-[0.2em] text-brand-blue-deep/75">
              Member Portal
            </div>
          </div>
        </Link>

        <nav className="space-y-6">
          <div className="space-y-1">
            <p className="mb-4 px-3 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/70">
              Main Menu
            </p>
            {nav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2 font-body text-sm transition-colors",
                    active
                      ? "bg-brand-blue-deep/10 font-semibold text-brand-blue-deep"
                      : "text-brand-blue-deep/85 hover:bg-brand-blue-deep/5 hover:text-brand-blue-deep",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "size-1.5 rounded-full transition-colors",
                      active ? "bg-brand-blue" : "bg-transparent",
                    ].join(" ")}
                  />
                  <Icon className="size-4 opacity-90" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="mt-auto border-t border-brand-blue-deep/10 p-8">
        <Link
          to="/portal/profile"
          className="mb-6 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-brand-blue-deep/5"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-brand-blue-deep/15 bg-brand-blue-deep/5 font-display text-xs font-extrabold text-brand-blue-deep">
            {initials || "·"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-brand-blue-deep">
              {user.fullName}
            </p>
            <p className="truncate font-mono text-[10px] text-brand-blue-deep/75">
              {user.email}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-blue-deep/10 bg-transparent px-4 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep transition-all hover:bg-brand-blue-deep hover:text-white"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </>
  );
}

export function PortalCard({
  title,
  icon,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-3xl border border-white bg-white p-6 shadow-[0_18px_45px_-15px_rgba(20,30,60,0.45)] ring-1 ring-brand-blue-deep/10 sm:p-7",
        className ?? "",
      ].join(" ")}
    >

      {title && (
        <div className="mb-4 flex items-center gap-2">
          {icon}
          <h2 className="font-display text-lg font-bold text-brand-blue-deep">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

export function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white p-4 shadow-[0_10px_25px_-12px_rgba(20,30,60,0.35)] ring-1 ring-brand-blue-deep/10">
      <div className="flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/80">
        {icon}
        {label}
      </div>
      <div className="mt-1 break-words font-body text-sm font-medium text-brand-blue-deep">
        {value || <span className="text-brand-blue-deep/55">—</span>}
      </div>
    </div>
  );
}
