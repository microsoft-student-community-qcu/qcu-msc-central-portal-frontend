import { createFileRoute } from "@tanstack/react-router";
import { Mail, Rocket, ShieldCheck } from "lucide-react";
import { InfoTile, PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/dashboard")({
  head: () => ({
    meta: [
      { title: "Member Workspace · QCU MSC" },
      {
        name: "description",
        content:
          "Status 200: OK. Your QCU MSC member workspace is initialized — new tools are shipping soon.",
      },
    ],
  }),
  component: MemberOverviewPage,
});

const UPDATES = [
  {
    accent: "bg-brand-blue",
    body: "Member workspace authenticated. New tools landing in V1.",
  },
  {
    accent: "bg-brand-yellow",
    body: "Identity & access protocols active across the portal.",
  },
];

function MemberOverviewPage() {
  const user = usePortalUser();
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Member";

  return (
    <PortalShell
      requireRole="member"
      title={`Touchdown, ${user?.fullName.split(" ")[0] ?? "Member"}`}
      subtitle="The eagle has landed. You're now standing on the lunar base — your home among the stars."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PortalCard
            title="Crew identity"
            icon={<ShieldCheck className="size-5 text-brand-blue-deep" />}
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/80">
                Authorized · Tier 01
              </p>
              <span className="rounded-full bg-brand-yellow px-3 py-1 font-heading text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue-deep">
                v2 launching soon
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<Mail className="size-3.5" />}
                label="QCU Email"
                value={user?.email}
              />
              <InfoTile
                icon={<ShieldCheck className="size-3.5" />}
                label="Role"
                value={roleLabel}
              />
              <InfoTile
                icon={<Rocket className="size-3.5" />}
                label="Status"
                value="Verified"
              />
            </div>
          </PortalCard>
        </div>

        <div className="lg:col-span-4">
          <PortalCard
            title="Mission log"
            icon={<Rocket className="size-5 text-brand-blue-deep" />}
          >
            <ul className="space-y-4">
              {UPDATES.map((u, i) => (
                <li key={i} className="flex gap-3">
                  <div className={`h-8 w-1 shrink-0 rounded-full ${u.accent}`} />
                  <p className="font-body text-xs leading-relaxed text-brand-blue-deep/80">
                    {u.body}
                  </p>
                </li>
              ))}
            </ul>
          </PortalCard>
        </div>
      </div>
    </PortalShell>
  );
}
