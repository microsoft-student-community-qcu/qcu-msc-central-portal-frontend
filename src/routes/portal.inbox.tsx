import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Bell, MailOpen, X, Satellite } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/portal/inbox")({
  head: () => ({ meta: [{ title: "M&D Inbox · QCU MSC" }] }),
  component: InboxPage,
});

const INBOX = [
  {
    id: "m1",
    from: "M&D Team",
    subject: "Welcome — what to expect next",
    preview: "Hi! Thanks for applying to QCU MSC. Here's a quick look at the steps ahead…",
    date: "Jun 22, 2026",
    unread: true,
  },
  {
    id: "m2",
    from: "QCU MSC",
    subject: "Tips for a great application",
    preview: "A few pointers that help applications stand out during review.",
    date: "Jun 22, 2026",
    unread: false,
  },
  {
    id: "m3",
    from: "M&D Team",
    subject: "Your documents are under review",
    preview: "We've received your application materials and are scanning them now.",
    date: "Jun 23, 2026",
    unread: true,
  },
  {
    id: "m4",
    from: "QCU MSC",
    subject: "Interview scheduling is now open",
    preview: "Select your preferred slot for the next phase of the mission selection process.",
    date: "Jun 24, 2026",
    unread: true,
  },
  {
    id: "m5",
    from: "M&D Team",
    subject: "Mission briefing packet attached",
    preview: "Review the attached protocol before your scheduled orientation session.",
    date: "Jun 25, 2026",
    unread: false,
  },
  {
    id: "m6",
    from: "QCU MSC",
    subject: "Final selection results incoming",
    preview: "Stay tuned — the crew roster will be transmitted within 48 hours.",
    date: "Jun 26, 2026",
    unread: true,
  },
  {
    id: "m7",
    from: "M&D Team",
    subject: "Crew clearance — next steps",
    preview: "Congratulations! Here is everything you need to prepare for lift-off.",
    date: "Jun 27, 2026",
    unread: false,
  },
  {
    id: "m8",
    from: "QCU MSC",
    subject: "Equipment checklist due",
    preview: "Please confirm your gear manifest before the deadline this Friday.",
    date: "Jun 28, 2026",
    unread: true,
  },
  {
    id: "m9",
    from: "M&D Team",
    subject: "Launch pad orientation invite",
    preview: "You're invited to the pre-launch walkthrough at the campus grounds.",
    date: "Jun 29, 2026",
    unread: false,
  },
  {
    id: "m10",
    from: "QCU MSC",
    subject: "Emergency contact form reminder",
    preview: "Don't forget to update your next-of-kin details in the portal.",
    date: "Jun 29, 2026",
    unread: true,
  },
  {
    id: "m11",
    from: "M&D Team",
    subject: "Weather advisory for launch week",
    preview: "Current forecasts look stable — standby for daily updates from mission control.",
    date: "Jun 29, 2026",
    unread: false,
  },
  {
    id: "m12",
    from: "QCU MSC",
    subject: "Post-mission survey now live",
    preview: "Help us improve future missions by sharing your experience feedback.",
    date: "Jun 30, 2026",
    unread: false,
  },
];

type Filter = "all" | "unread";

function InboxPage() {
  const [items, setItems] = useState(INBOX);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = items.filter((m) => m.unread).length;

  const visible = useMemo(() => {
    if (filter === "unread") return items.filter((m) => m.unread);
    return items;
  }, [items, filter]);

  const markAllRead = () => {
    setItems((prev) => prev.map((m) => ({ ...m, unread: false })));
  };

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <PortalShell
      requireRole="applicant"
      title="Mission control"
      subtitle="Transmissions from Management & Development at base."
    >
      <PortalCard
        title="Messages"
        icon={<Bell className="size-5 text-brand-blue-deep" />}
      >
        {/* Filter tabs + actions */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-brand-blue-deep/10 bg-brand-blue-deep/[0.03] p-1">
            {(["all", "unread"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  "relative rounded-full px-3.5 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                  filter === f
                    ? "bg-white text-brand-blue-deep shadow-sm ring-1 ring-brand-blue-deep/10"
                    : "text-brand-blue-deep/60 hover:text-brand-blue-deep",
                ].join(" ")}
              >
                {f === "all" ? "All" : "Unread"}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-brand-orange px-1.5 py-0.5 font-heading text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue-deep px-3.5 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-white hover:bg-brand-blue"
            >
              <MailOpen className="size-3.5" /> Mark all as read
            </button>
          )}
        </div>

        {/* Compact list */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Satellite className="size-10 text-brand-blue-deep/25" />
            <p className="mt-3 font-display text-sm font-bold text-brand-blue-deep/60">
              No transmissions in this channel.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-brand-blue-deep/[0.08]">
            {visible.map((m) => (
              <li
                key={m.id}
                className={[
                  "group flex items-start gap-3 py-3.5 transition hover:bg-brand-blue-deep/[0.02] sm:gap-4 sm:py-3",
                  m.unread ? "" : "opacity-70",
                ].join(" ")}
              >
                {/* Status dot */}
                <div className="mt-1.5 shrink-0">
                  {m.unread ? (
                    <span className="block size-2 rounded-full bg-brand-orange" />
                  ) : (
                    <span className="block size-2 rounded-full bg-brand-blue-deep/20" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span
                      className={[
                        "font-heading text-[11px] uppercase tracking-[0.15em]",
                        m.unread
                          ? "text-brand-blue-deep/70"
                          : "text-brand-blue-deep/45",
                      ].join(" ")}
                    >
                      {m.from}
                    </span>
                    <span className="font-body text-[10px] text-brand-blue-deep/35">
                      {m.date}
                    </span>
                  </div>
                  <div
                    className={[
                      "mt-0.5 truncate font-display text-sm",
                      m.unread
                        ? "font-bold text-brand-blue-deep"
                        : "font-medium text-brand-blue-deep/60",
                    ].join(" ")}
                  >
                    {m.subject}
                  </div>
                  <div className="mt-0.5 truncate font-body text-xs text-brand-blue-deep/55">
                    {m.preview}
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => dismiss(m.id)}
                  title="Dismiss transmission"
                  className="mt-1 shrink-0 rounded-full p-1.5 text-brand-blue-deep/30 opacity-0 transition hover:bg-brand-blue-deep/10 hover:text-brand-blue-deep/70 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
    </PortalShell>
  );
}
