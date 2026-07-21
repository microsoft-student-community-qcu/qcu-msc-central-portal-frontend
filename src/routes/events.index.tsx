import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Search, Users, Clock, Rocket } from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { EVENTS, type FullEvent, type EventStatus } from "@/lib/events-data";

export const Route = createFileRoute("/events/")({
  // Reyewsss
  // Route-level guard: runs before the loader/component, so a direct URL
  // visit (or a stale bookmark) never even starts fetching event data —
  // it's redirected before any of this page's work begins.
  beforeLoad: () => {
    throw redirect({ to: "/coming-soon" });
  },
  // ---------------------------------------------------------------------
  head: () => ({
    meta: [
      { title: "Events — QCU MSC" },
      {
        name: "description",
        content:
          "Hackathons, workshops, talks, and community jams from the Microsoft Student Community at Quezon City University.",
      },
      { property: "og:title", content: "Events — QCU MSC" },
      {
        property: "og:description",
        content:
          "Browse upcoming and past events from QCU MSC — hackathons, workshops, talks, and community jams.",
      },
    ],
  }),
  component: EventsPage,
});

const FILTERS: { id: "all" | EventStatus | string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "Hackathon", label: "Hackathons" },
  { id: "Workshop", label: "Workshops" },
  { id: "Talk", label: "Talks" },
  { id: "Community", label: "Community" },
];

function EventsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTS.filter((e) => {
      if (filter === "upcoming" || filter === "past") {
        if (e.status !== filter) return false;
      } else if (filter !== "all") {
        if (e.tag !== filter) return false;
      }
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.blurb.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.tag.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const upcoming = filtered.filter((e) => e.status === "upcoming");
  const past = filtered.filter((e) => e.status === "past");

  const featured = upcoming[0];
  const upcomingRest = upcoming.slice(1);

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-24"
      style={{ background: "var(--gradient-sky)" }}
    >
      <SkyBackdrop />

      <div className="relative z-10">
        <PageNav />

        {/* Hero */}
        <header className="relative px-4 pb-32 pt-10 sm:px-6 sm:pt-16">
          {/* Distant moon — same as landing page */}
          <DistantMoon />

          {/* Floating rocket logo with flames */}
          <div className="absolute right-[10%] top-20 hidden lg:block">
            <div className="relative animate-flight">
              <div className="relative animate-shake">
                <div
                  className="absolute -inset-6 rounded-full blur-2xl opacity-60"
                  style={{
                    background: "radial-gradient(circle, var(--brand-yellow), transparent 65%)",
                  }}
                />
                <img
                  src={logoUrl}
                  alt=""
                  className="relative size-32 rotate-12 object-contain drop-shadow-[0_8px_20px_rgba(255,140,0,0.45)]"
                />
                {/* Flames + smoke, tilted to match the rocket */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-[55%] top-[99%] -translate-x-1/2 rotate-12">
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -top-2 h-24 w-20 rounded-full blur-2xl opacity-80"
                      style={{
                        background:
                          "radial-gradient(ellipse at top, #ffb347 0%, #ff5e1f 45%, transparent 75%)",
                      }}
                    />
                    <div
                      className="absolute left-1/2 top-0 h-20 w-10 -translate-x-1/2 animate-flame"
                      style={{
                        background:
                          "linear-gradient(180deg, #fff3a8 0%, #ffb347 25%, #ff7a18 60%, #ff3d00 100%)",
                        borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
                        filter: "blur(1px)",
                      }}
                    />
                    <div
                      className="absolute left-1/2 top-1 h-14 w-5 -translate-x-1/2 animate-flame-inner"
                      style={{
                        background:
                          "linear-gradient(180deg, #ffffff 0%, #fff3a8 35%, #ffd24a 70%, #ff8a00 100%)",
                        borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
                      }}
                    />
                  </div>
                  {/* Smoke puffs */}
                  <div className="absolute left-[60%] top-[120%] h-16 w-24 -translate-x-1/2 rotate-12">
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
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.25)] sm:text-7xl md:text-8xl">
              Discover{" "}
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, var(--brand-orange), var(--brand-yellow), var(--brand-green), var(--brand-blue))",
                  }}
                >
                  Events
                </span>
                <svg
                  className="absolute -bottom-3 left-0 w-full text-brand-orange"
                  viewBox="0 0 200 20"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M5 15 Q 100 0 195 15"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl font-body text-base leading-relaxed text-white/85 drop-shadow sm:mt-10 sm:text-lg">
              Connecting the QCU MSC community through workshops, hackathons, and stellar
              opportunities — every Saturday, defying the odds.
            </p>
          </div>
        </header>

        {/* Floating search + filter pill */}
        <section className="relative z-20 mx-auto -mt-20 mb-20 max-w-5xl px-4 sm:px-6">
          <div className="glass-strong flex flex-col items-stretch gap-3 rounded-[3rem] p-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-6 top-1/2 size-5 -translate-y-1/2 text-brand-blue-deep/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your next orbit…"
                className="w-full rounded-full border-none bg-brand-blue-light/40 py-4 pl-14 pr-6 font-heading text-sm font-semibold text-brand-blue-deep placeholder:text-brand-blue-deep/40 focus:outline-none focus:ring-4 focus:ring-brand-blue/20"
              />
            </label>
            <div className="flex items-center gap-2 overflow-x-auto px-2 pb-1 md:pb-0">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className="whitespace-nowrap rounded-full px-6 py-3 font-heading text-xs font-bold transition hover:-translate-y-0.5"
                    style={
                      active
                        ? {
                            background: "var(--brand-blue-deep)",
                            color: "white",
                            boxShadow:
                              "0 12px 24px -10px color-mix(in oklab, var(--brand-blue-deep) 55%, transparent)",
                          }
                        : {
                            background: "white",
                            color: "var(--brand-blue-deep)",
                            border:
                              "1px solid color-mix(in oklab, var(--brand-blue-deep) 8%, transparent)",
                          }
                    }
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <main className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {filtered.length === 0 ? (
            <EmptyState
              onReset={() => {
                setFilter("all");
                setQuery("");
              }}
            />
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <SectionHeading title="Upcoming" accent="var(--brand-orange)" />
                  <UpcomingGrid featured={featured} rest={upcomingRest} />
                </>
              )}

              {past.length > 0 && (
                <section className="mt-40">
                  <div className="mb-16 flex items-center gap-6">
                    <div className="h-px flex-grow bg-brand-blue-deep/15" />
                    <h2 className="font-display text-2xl font-bold uppercase tracking-[0.25em] text-brand-blue-deep/45">
                      Past Missions
                    </h2>
                    <div className="h-px flex-grow bg-brand-blue-deep/15" />
                  </div>
                  <PastGrid events={past} />
                </section>
              )}
            </>
          )}

          <CallToAction />
        </main>
      </div>
    </div>
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

function PageNav() {
  return (
    <header className="relative z-30 mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-6 sm:py-6">
      <Link to="/" className="flex min-w-0 items-center gap-2.5">
        <img
          src={logoUrl}
          alt="QCU MSC logo"
          className="size-9 shrink-0 object-contain sm:size-10"
        />
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
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 font-heading text-xs font-semibold text-brand-blue-deep shadow-sm transition hover:-translate-y-0.5 sm:px-5 sm:py-2.5 sm:text-sm"
      >
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">Back to Space</span>
        <span className="sm:hidden">Back to Space</span>
      </Link>
    </header>
  );
}

function SectionHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="mb-12 flex items-center gap-4">
      <h2 className="font-display text-4xl font-extrabold tracking-tight text-white drop-shadow">
        {title}
      </h2>
      <div className="h-1.5 w-12 rounded-full" style={{ background: accent }} />
    </div>
  );
}

function UpcomingGrid({ featured, rest }: { featured?: FullEvent; rest: FullEvent[] }) {
  if (!featured) return null;

  // One upcoming event: featured takes the full width.
  if (rest.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-10">
        <FeaturedCard event={featured} className="md:col-span-12" />
      </div>
    );
  }

  const [first, ...remaining] = rest;

  return (
    <div className="space-y-10">
      {/* Top row: large featured card + one square card */}
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12">
        <FeaturedCard event={featured} className="md:col-span-8" />
        <SquareCard event={first} className="md:col-span-4" />
      </div>

      {/* Remaining events: clean, responsive grid that works for any count. */}
      {remaining.length > 0 && (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {remaining.map((e) => (
            <SquareCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventArt({ event, rounded = "rounded-[2.5rem]" }: { event: FullEvent; rounded?: string }) {
  const initials = event.title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`relative size-full overflow-hidden ${rounded}`}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${event.accent} 80%, white) 0%, color-mix(in oklab, ${event.accent} 35%, white) 100%)`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden
        className="absolute -right-10 -top-10 size-40 rounded-full opacity-50 blur-2xl"
        style={{ background: event.accent }}
      />
      <span className="absolute inset-0 grid place-items-center font-display text-5xl font-extrabold tracking-tight text-brand-blue-deep/85 drop-shadow-sm">
        {initials}
      </span>
    </div>
  );
}

function FeaturedCard({ event, className = "" }: { event: FullEvent; className?: string }) {
  return (
    <article className={`group relative ${className}`}>
      <div
        className="overflow-hidden rounded-[3.5rem] border border-white bg-white transition-all duration-500"
        style={{
          boxShadow: "0 30px 60px -25px color-mix(in oklab, var(--brand-blue) 35%, transparent)",
        }}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <div className="size-full transition-transform duration-700 group-hover:scale-105">
            <EventArt event={event} rounded="" />
          </div>
          <div className="absolute left-8 top-8 flex flex-wrap gap-3">
            <span
              className="rounded-full px-5 py-2 font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
              style={{ background: "var(--brand-blue-deep)" }}
            >
              Featured
            </span>
            <span className="rounded-full glass-strong px-5 py-2 font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-blue-deep">
              {event.date}
            </span>
          </div>
        </div>
        <div className="p-10 sm:p-12">
          <span
            className="font-heading text-xs font-extrabold uppercase tracking-[0.2em]"
            style={{ color: event.accent }}
          >
            {event.tag}
          </span>
          <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-blue-deep transition-colors group-hover:text-brand-blue sm:text-4xl">
            {event.title}
          </h3>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-brand-blue-deep/65 sm:text-lg">
            {event.blurb}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              to="/events/$eventId/register"
              params={{ eventId: event.id }}
              className="rounded-full px-8 py-3.5 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ background: "var(--brand-blue-deep)" }}
            >
              Claim your seat
            </Link>

            <div className="flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/50">
              <MapPin className="size-4" /> {event.location}
            </div>
            <div className="flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/50">
              <Clock className="size-4" /> {event.time}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SquareCard({ event, className = "" }: { event: FullEvent; className?: string }) {
  return (
    <article className={`group ${className}`}>
      <div
        className="rounded-[3rem] border border-brand-blue-light/40 bg-white p-8 transition-all duration-500 hover:-translate-y-2"
        style={{
          boxShadow: "0 20px 40px -20px color-mix(in oklab, var(--brand-blue) 25%, transparent)",
        }}
      >
        <div className="mb-7 aspect-square w-full overflow-hidden rounded-[2.5rem]">
          <div className="size-full transition-transform duration-500 group-hover:scale-110">
            <EventArt event={event} rounded="" />
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span
            className="font-heading text-[10px] font-extrabold uppercase tracking-[0.15em]"
            style={{ color: event.accent }}
          >
            {event.tag}
          </span>
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-brand-blue-deep/40">
            {event.date}
          </span>
        </div>
        <h4 className="mb-3 font-display text-2xl font-bold tracking-tight text-brand-blue-deep">
          {event.title}
        </h4>
        <p className="mb-7 line-clamp-3 font-body text-sm leading-relaxed text-brand-blue-deep/60">
          {event.blurb}
        </p>
        <Link
          to="/events/$eventId/register"
          params={{ eventId: event.id }}
          className="block w-full rounded-2xl border-2 border-brand-blue-light/60 py-3.5 text-center font-heading text-sm font-bold text-brand-blue-deep transition-all hover:bg-brand-blue-light/30"
        >
          Register
        </Link>
      </div>
    </article>
  );
}

function PastGrid({ events }: { events: FullEvent[] }) {
  const rotations = ["rotate-3", "-rotate-6", "rotate-12", "-rotate-2", "rotate-6", "-rotate-3"];
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
      {events.map((e, i) => (
        <div key={e.id} className="group cursor-pointer text-center">
          <div
            className={`mx-auto mb-5 grid size-28 place-items-center rounded-[2rem] bg-white shadow-sm transition-all group-hover:rotate-0 group-hover:shadow-xl ${rotations[i % rotations.length]}`}
          >
            <div
              className="grid size-14 place-items-center rounded-2xl font-display text-base font-extrabold text-white"
              style={{
                background: `linear-gradient(135deg, ${e.accent}, color-mix(in oklab, ${e.accent} 50%, white))`,
              }}
            >
              {e.title
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          </div>
          <p className="font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-blue-deep/40">
            {e.date}
          </p>
          <h5 className="mt-1 font-display text-sm font-bold text-brand-blue-deep">{e.title}</h5>
          {typeof e.attendees === "number" && (
            <p className="mt-1 inline-flex items-center gap-1 font-body text-[11px] text-brand-blue-deep/50">
              <Users className="size-3" /> {e.attendees}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-12 rounded-[3rem] glass-strong p-12 text-center">
      <div
        className="mx-auto grid size-16 place-items-center rounded-2xl"
        style={{ background: "var(--gradient-cta)" }}
      >
        <Rocket className="size-7 text-white" />
      </div>
      <h3 className="mt-4 font-display text-2xl font-bold text-brand-blue-deep">
        No events match that filter
      </h3>
      <p className="mt-2 font-body text-sm text-brand-blue-deep/60">
        Try a different category or clear your search.
      </p>
      <button
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full px-6 py-3 font-heading text-sm font-bold text-white shadow"
        style={{ background: "var(--brand-blue-deep)" }}
      >
        Reset filters
      </button>
    </div>
  );
}

function CallToAction() {
  return (
    <section
      className="mt-32 overflow-hidden rounded-[3.5rem] p-10 sm:p-14"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--brand-orange) 85%, white), color-mix(in oklab, var(--brand-yellow) 70%, white))",
        boxShadow: "0 30px 60px -25px color-mix(in oklab, var(--brand-orange) 50%, transparent)",
      }}
    >
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <span className="inline-block rounded-full bg-white/40 px-4 py-1.5 font-heading text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-blue-deep">
            For collaborators
          </span>
          <h3 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-brand-blue-deep sm:text-4xl">
            Have an event idea?
          </h3>
          <p className="mt-2 max-w-lg font-body text-base text-brand-blue-deep/75">
            Talks, hackathons, workshops — if it helps students ship, we want to hear it.
          </p>
        </div>
        <a
          href="/#collaborate"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue-deep px-8 py-4 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
        >
          Pitch us <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}
