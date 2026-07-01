import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Library } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/portal/resources")({
  head: () => ({ meta: [{ title: "Resource Vault · QCU MSC" }] }),
  component: ResourcesPage,
});

const RESOURCES = [
  { id: "r1", title: "Internal Resource Vault", desc: "Templates, recordings, and exclusive learning paths.", href: "#" },
  { id: "r2", title: "Azure Sandbox Access", desc: "Member-only cloud sandbox credentials.", href: "#" },
  { id: "r3", title: "Mentorship Roster", desc: "Connect with senior members for 1:1 mentorship.", href: "#" },
  { id: "r4", title: "Microsoft Learn Collections", desc: "Curated tracks endorsed by MSC officers.", href: "#" },
];

function ResourcesPage() {
  return (
    <PortalShell
      requireRole="member"
      title="Lunar archive"
      subtitle="Supplies and field manuals stored at the base. Crew access only."

    >
      <PortalCard title="Available to you" icon={<Library className="size-5 text-brand-blue-deep" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <a
              key={r.id}
              href={r.href}
              className="group rounded-2xl border border-brand-blue-light bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-blue"
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-bold text-brand-blue-deep">{r.title}</div>
                <ExternalLink className="size-4 text-brand-blue-deep/55 group-hover:text-brand-blue-deep" />
              </div>
              <div className="mt-1 font-body text-xs text-brand-blue-deep/65">{r.desc}</div>
            </a>
          ))}
        </div>
      </PortalCard>
    </PortalShell>
  );
}
