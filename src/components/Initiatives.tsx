import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Sparkles, Instagram, Facebook, Linkedin } from "lucide-react";

export type EventItem = { id: string; title: string; date: string; tag: string; blurb: string; accent: string; image?: string };

// Four most recent upcoming events
export const EVENTS: EventItem[] = [
  {
    id: "ai-launchpad",
    title: "AI Launchpad: Build with Copilot",
    date: "Jul 12, 2026 · 9:00 AM",
    tag: "Hackathon",
    blurb: "A full-day build sprint powered by GitHub Copilot and Azure AI — ship a working prototype before sundown.",
    accent: "var(--brand-orange)",
    // Unsplash: person coding at laptop with orange ambient lighting
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "cloud-clinic",
    title: "Cloud Clinic: Azure Fundamentals",
    date: "Jul 26, 2026 · 1:00 PM",
    tag: "Workshop",
    blurb: "Hands-on lab covering identity, storage, and serverless — leave with a deployable starter and AZ-900 prep notes.",
    accent: "var(--brand-green)",
    // Unsplash: server/cloud infrastructure
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "design-jam",
    title: "Design Jam: Inclusive Interfaces",
    date: "Aug 9, 2026 · 10:00 AM",
    tag: "Community",
    blurb: "Pair up with designers and devs to reimagine campus tools through an accessibility-first lens.",
    accent: "var(--brand-blue)",
    // Unsplash: design/wireframing workspace
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "open-source-sprint",
    title: "Open Source Sprint",
    date: "Aug 23, 2026 · 9:00 AM",
    tag: "Community",
    blurb: "Contribute to real open-source projects with mentors from the QCU MSC — pick an issue, ship a PR, get it merged.",
    accent: "var(--brand-blue-deep)",
    // Unsplash: team collaborating around laptops
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80&auto=format&fit=crop",
  },
];

function SocialPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <a href="#footer" className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-blue-deep hover:bg-white">
      {icon} {label}
    </a>
  );
}

function EmptyEvents() {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl glass-strong p-8 sm:p-12">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="relative grid size-24 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--gradient-cta-alt)" }}>
          <Sparkles className="absolute -right-2 -top-2 size-5 text-brand-yellow animate-sparkle" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold text-brand-blue-deep sm:text-3xl">Initiatives are brewing.</h3>
          <p className="mt-2 max-w-xl font-body text-brand-blue-deep/75">
            Exciting initiatives are brewing for this semester! Follow our socials for the latest announcements.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <SocialPill icon={<Instagram className="size-4" />} label="Instagram" />
            <SocialPill icon={<Facebook className="size-4" />} label="Facebook" />
            <SocialPill icon={<Linkedin className="size-4" />} label="LinkedIn" />
          </div>
        </div>
      </div>
    </div>
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
    <article className="group flex flex-col bg-white border border-gray-200/60 shadow-md transition hover:shadow-xl rounded-none">
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
            className="size-full object-cover"
          />
        ) : (
          <>
            <span
              aria-hidden
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(#f3f3f3 1px, transparent 1px), linear-gradient(90deg, #f3f3f3 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <span className="absolute inset-0 grid place-items-center font-sans text-3xl font-extrabold tracking-tight text-gray-800/90">
              {initials}
            </span>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6 items-start text-left">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-gray-500">
          {event.tag} · {event.date.split(" · ")[0]}
        </span>
        <h3 className="mt-2.5 font-sans text-xl font-bold text-gray-950 hover:text-[#0067b8] transition cursor-pointer leading-tight">
          {event.title}
        </h3>
        <p className="mt-3 font-sans text-sm text-gray-700 leading-relaxed flex-1">
          {event.blurb}
        </p>
        <Link 
          to="/events" 
          className="mt-6 inline-flex items-center justify-center bg-[#0067b8] text-white hover:bg-[#005da6] transition px-5 py-2.5 text-sm font-semibold font-sans rounded-none shadow-none"
        >
          Register now
        </Link>
      </div>
    </article>
  );
}

export function Initiatives() {
  return (
    <section id="initiatives" className="relative mx-auto max-w-[1600px] px-6 py-16 lg:px-16 sm:py-24">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <span className="text-xs uppercase tracking-[0.18em] text-white/80 drop-shadow">Active Initiatives</span>
          <h2 className="mt-1 font-display text-3xl font-bold text-white drop-shadow sm:text-4xl">What's launching next</h2>
        </div>
        <Link to="/events" className="hidden shrink-0 items-center gap-1.5 bg-white/95 px-5 py-2.5 text-sm font-normal text-brand-blue-deep hover:bg-white sm:inline-flex rounded-none shadow-none">
          All events <ArrowRight className="size-4" />
        </Link>
      </div>

      {EVENTS.length === 0 ? (
        <EmptyEvents />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.slice(0, 4).map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </section>
  );
}
