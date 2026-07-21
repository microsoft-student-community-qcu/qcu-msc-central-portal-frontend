import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { IdCard, Mail, ShieldCheck, User } from "lucide-react";
import { InfoTile, PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({ meta: [{ title: "Profile · QCU MSC" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = usePortalUser();
  const navigate = useNavigate();

  if (!user) {
    void navigate({ to: "/portal/login" });
    return null;
  }
  if (user.role !== "member") {
    void navigate({ to: "/portal/tracking" });
    return null;
  }

  return (
    <PortalShell
      requireRole="member"
      title="Crew profile"
      subtitle="Your astronaut record — verified against your QCU identity before launch."

    >
      <PortalCard title="Identity" icon={<User className="size-5 text-brand-blue-deep" />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoTile icon={<User className="size-4" />} label="Full name" value={user.fullName} />
          <InfoTile icon={<IdCard className="size-4" />} label="Student #" value={user.studentNumber} />
          <InfoTile icon={<Mail className="size-4" />} label="QCU email" value={user.email} />
        </div>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
          <ShieldCheck className="size-3.5" />
          {user.role === "member" ? "Verified member" : "Verified applicant"}
        </div>
      </PortalCard>
    </PortalShell>
  );
}
