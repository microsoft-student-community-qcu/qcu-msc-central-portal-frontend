import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Bell, MailOpen, X, Satellite } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";
import { getApiEndpoint } from "@/lib/api-config";

export const Route = createFileRoute("/portal/inbox")({
  head: () => ({ meta: [{ title: "M&D Inbox · QCU MSC" }] }),
  component: InboxPage,
});

type Filter = "all" | "unread";

const LOCAL_STORAGE_READ_KEY = "qcumsc.inbox.read";
const LOCAL_STORAGE_DISMISSED_KEY = "qcumsc.inbox.dismissed";

function InboxPage() {
  const user = usePortalUser();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applicantData, setApplicantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize read and dismissed message IDs after client mount to prevent SSR hydration mismatch
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedRead = localStorage.getItem(LOCAL_STORAGE_READ_KEY);
      if (storedRead) setReadIds(JSON.parse(storedRead));

      const storedDismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
      if (storedDismissed) setDismissedIds(JSON.parse(storedDismissed));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const fetchApplicantData = async () => {
      try {
        const fetchRes = await fetch(getApiEndpoint("/api/v1/applicants/me"), {
          credentials: "include",
        });
        const resData = await fetchRes.json();
        if (resData?.success && resData.data) {
          setApplicantData(resData.data);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchApplicantData();
  }, []);

  if (!user) {
    void navigate({ to: "/portal/login" });
    return null;
  }

  // Purely dynamic notifications based on applicant submission and live admin status
  const dynamicNotifications = useMemo(() => {
    if (!applicantData) return [];
    const list = [];

    const submissionDateStr = applicantData.createdAt
      ? new Date(applicantData.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Today";

    const updateDateStr = applicantData.updatedAt
      ? new Date(applicantData.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : submissionDateStr;

    // Notification 1: Automatic Greetings & Thank You for Submitting Notification
    list.push({
      id: `app-greeting-${applicantData.id}`,
      from: "QCU MSC Mission Control",
      subject: "Welcome & Thank You for Submitting Your Application!",
      preview: `Hello ${
        applicantData.firstName || "Applicant"
      }! Thank you for applying to Quezon City University Microsoft Student Community. We have successfully registered your application details in our database.`,
      date: submissionDateStr,
      unread: true,
    });

    // Notification 2: Application Status Update / Under Review Notification
    if (applicantData.status === "PENDING_REVIEW") {
      list.push({
        id: `app-status-review-${applicantData.id}`,
        from: "Management & Development",
        subject: "Application Status: Under Review",
        preview: applicantData.manual_application
          ? "Your application materials were received and flagged for manual review by our Management & Development team. We are currently verifying your credentials."
          : "Your application is currently undergoing evaluation by our Management & Development team. We will transmit updates here as review progresses.",
        date: submissionDateStr,
        unread: true,
      });
    } else if (applicantData.status === "FOR_INTERVIEW") {
      list.push({
        id: `app-status-interview-${applicantData.id}-${applicantData.updatedAt || "1"}`,
        from: "Management & Development",
        subject: "Notice: Interview Scheduled",
        preview: applicantData.adminMessage
          ? `Admin remark: "${applicantData.adminMessage}". We will transmit interview details to your registered QCU email.`
          : "Your application has advanced! Our Management & Development team is scheduling an interview with you.",
        date: updateDateStr,
        unread: true,
      });
    } else if (applicantData.status === "RESUBMIT") {
      list.push({
        id: `app-status-resubmit-${applicantData.id}-${applicantData.updatedAt || "1"}`,
        from: "Management & Development",
        subject: "Action Required: Application Resubmission Request",
        preview: applicantData.adminMessage
          ? `Admin remark: "${applicantData.adminMessage}". Please update the requested fields in your Application Status page.`
          : "Management & Development has requested corrections on your application. Please review the Tracking tab to resubmit.",
        date: updateDateStr,
        unread: true,
      });
    } else if (applicantData.status === "APPROVED") {
      list.push({
        id: `app-status-approved-${applicantData.id}-${applicantData.updatedAt || "1"}`,
        from: "QCU MSC Base Command",
        subject: "Official Notice: Application Approved!",
        preview: applicantData.adminMessage
          ? `Admin remark: "${applicantData.adminMessage}". Welcome aboard to the QCU MSC crew!`
          : "Congratulations! Your application to Quezon City University Microsoft Student Community has been reviewed and approved.",
        date: updateDateStr,
        unread: true,
      });
    } else if (applicantData.status === "REJECTED") {
      list.push({
        id: `app-status-rejected-${applicantData.id}-${applicantData.updatedAt || "1"}`,
        from: "Management & Development",
        subject: "Application Decision Notice",
        preview: applicantData.adminMessage
          ? `Admin remark: "${applicantData.adminMessage}"`
          : "Thank you for applying. Your application decision status has been updated.",
        date: updateDateStr,
        unread: true,
      });
    }

    return list;
  }, [applicantData]);

  // Derive message list with dynamic unread status based on readIds and dismissedIds
  const items = dynamicNotifications
    .filter((m) => !dismissedIds.includes(m.id))
    .map((m) => ({
      ...m,
      unread: readIds.includes(m.id) ? false : m.unread,
    }));

  const unreadCount = items.filter((m) => m.unread).length;

  const visible = items.filter((m) => {
    if (filter === "unread") return m.unread;
    return true;
  });

  const markAllRead = () => {
    const allIds = Array.from(
      new Set([...readIds, ...dynamicNotifications.map((m) => m.id)]),
    );
    setReadIds(allIds);
    try {
      localStorage.setItem(LOCAL_STORAGE_READ_KEY, JSON.stringify(allIds));
    } catch {
      /* ignore */
    }
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_READ_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
    }
  };

  const toggleSelect = (id: string) => {
    markAsRead(id);
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const dismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <PortalShell
      requireRole={user.role}
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

        {/* List content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-6 animate-spin rounded-full border-2 border-brand-blue-deep border-t-transparent mx-auto" />
            <p className="mt-3 font-body text-xs text-brand-blue-deep/60">
              Retrieving transmissions...
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Satellite className="size-10 text-brand-blue-deep/25" />
            <p className="mt-3 font-display text-sm font-bold text-brand-blue-deep/60">
              No transmissions in this channel.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-brand-blue-deep/[0.08]">
            {visible.map((m) => {
              const isExpanded = selectedId === m.id;
              return (
                <li
                  key={m.id}
                  onClick={() => toggleSelect(m.id)}
                  className={[
                    "group cursor-pointer py-3.5 transition hover:bg-brand-blue-deep/[0.02] sm:py-3",
                    m.unread ? "" : "opacity-75",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
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
                              ? "text-brand-blue-deep/70 font-semibold"
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
                          "mt-0.5 font-display text-sm",
                          m.unread
                            ? "font-bold text-brand-blue-deep"
                            : "font-medium text-brand-blue-deep/70",
                        ].join(" ")}
                      >
                        {m.subject}
                      </div>
                      <div className="mt-0.5 font-body text-xs text-brand-blue-deep/65">
                        {isExpanded ? (
                          m.preview
                        ) : (
                          <span className="truncate block">{m.preview}</span>
                        )}
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      type="button"
                      onClick={(e) => dismiss(e, m.id)}
                      title="Dismiss transmission"
                      className="mt-1 shrink-0 rounded-full p-1.5 text-brand-blue-deep/30 opacity-0 transition hover:bg-brand-blue-deep/10 hover:text-brand-blue-deep/70 group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PortalCard>
    </PortalShell>
  );
}
