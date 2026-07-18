import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Ticket } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/portal/events")({
  head: () => ({
    meta: [{ title: "My Events · QCU MSC" }],
  }),
  component: MemberEventsPage,
});

const EVENTS = [
  {
    id: "e1",
    title: "AI x Cloud Bootcamp 2026",
    date: "Jul 12, 2026",
    venue: "QCU Main Hall",
    status: "Registered" as const,
  },
  {
    id: "e2",
    title: "Hack the Campus",
    date: "May 03, 2026",
    venue: "Innovation Lab",
    status: "Attended" as const,
  },
  {
    id: "e3",
    title: "Intro to Power Platform",
    date: "Apr 18, 2026",
    venue: "Online",
    status: "Attended" as const,
  },
  {
    id: "e4",
    title: "Azure Foundations Workshop",
    date: "Mar 09, 2026",
    venue: "Room 412",
    status: "Attended" as const,
  },
];

function MemberEventsPage() {
  return (
    <PortalShell
      requireRole="member"
      title="Missions"
      subtitle="Every expedition you've joined or signed up for from the lunar base."
    >
      <PortalCard
        title="Upcoming & past"
        icon={<CalendarCheck className="size-5 text-brand-blue-deep" />}
      >
        <ul className="divide-y divide-brand-blue-light/60">
          {EVENTS.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="font-display text-sm font-bold text-brand-blue-deep">
                  {ev.title}
                </div>
                <div className="font-body text-[12px] text-brand-blue-deep/60">
                  {ev.date} · {ev.venue}
                </div>
              </div>
              <span
                className={[
                  "rounded-full px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.15em]",
                  ev.status === "Registered"
                    ? "bg-brand-blue-deep text-white"
                    : "bg-emerald-100 text-emerald-700",
                ].join(" ")}
              >
                {ev.status}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link
            to="/coming-soon"
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue-deep px-4 py-2 font-heading text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-brand-blue"
          >
            <Ticket className="size-3.5" /> Browse events
          </Link>
        </div>
      </PortalCard>
    </PortalShell>
  );
}
