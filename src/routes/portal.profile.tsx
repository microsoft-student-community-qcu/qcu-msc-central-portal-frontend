import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IdCard, Mail, ShieldCheck, User, GraduationCap, BookOpen, MapPin, Building2, Briefcase } from "lucide-react";
import { InfoTile, PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";
import { getApiEndpoint } from "@/lib/api-config";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({ meta: [{ title: "Profile · QCU MSC" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = usePortalUser();
  const navigate = useNavigate();
  const [applicantData, setApplicantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const roleLabel =
    user.role === "member"
      ? "Verified Member"
      : user.role === "applicant"
      ? "Verified Applicant"
      : "Restricted";

  const formatCampusName = (campus?: string) => {
    if (!campus) return undefined;
    if (campus === "SAN_BARTOLOME_MAIN") return "San Bartolome (Main)";
    if (campus === "SAN_FRANCISCO") return "San Francisco";
    if (campus === "BATASAN") return "Batasan";
    return campus;
  };

  return (
    <PortalShell
      requireRole={user.role}
      title="Crew Profile"
      subtitle="Your astronaut record — verified against your QCU identity before launch."
    >
      <div className="space-y-6">
        <PortalCard title="Identity & Orbit" icon={<User className="size-5 text-brand-blue-deep" />}>
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoTile icon={<User className="size-4" />} label="Full name" value={user.fullName} />
            <InfoTile icon={<IdCard className="size-4" />} label="Student #" value={user.studentNumber} />
            <InfoTile icon={<Mail className="size-4" />} label="QCU email" value={user.email} />
          </div>
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            <ShieldCheck className="size-3.5" />
            {roleLabel}
          </div>
        </PortalCard>

        <PortalCard title="Academic Credentials" icon={<GraduationCap className="size-5 text-brand-blue-deep" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoTile icon={<Building2 className="size-4" />} label="College" value={applicantData?.college} />
            <InfoTile icon={<BookOpen className="size-4" />} label="Program" value={applicantData?.program} />
            <InfoTile icon={<GraduationCap className="size-4" />} label="Section" value={applicantData?.section} />
            <InfoTile icon={<MapPin className="size-4" />} label="Campus" value={formatCampusName(applicantData?.campus)} />
            <InfoTile icon={<Briefcase className="size-4" />} label="Preferred Office" value={applicantData?.office?.replace(/_/g, " ")} />
          </div>
        </PortalCard>
      </div>
    </PortalShell>
  );
}
