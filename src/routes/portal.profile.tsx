import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IdCard, Mail, ShieldCheck, User, GraduationCap, BookOpen, MapPin, Building2, Briefcase } from "lucide-react";
import { InfoTile, PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";
import { apiFetch, messageFrom } from "@/lib/api-client";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({ meta: [{ title: "Profile · QCU MSC" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = usePortalUser();
  const navigate = useNavigate();
  const [applicantData, setApplicantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchApplicantData = async () => {
      try {
        const fetchRes = await apiFetch("/api/v1/applicants/me", {
          credentials: "include",
        });
        const resData = await fetchRes.json();
        if (cancelled) return;
        if (!fetchRes.ok || !resData?.success) {
          throw new Error(resData?.message || "We couldn't load your profile details.");
        }
        setApplicantData(resData.data ?? null);
        setLoadError(null);
      } catch (err: unknown) {
        if (!cancelled) setLoadError(messageFrom(err, "We couldn't load your profile details."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchApplicantData();
    return () => {
      cancelled = true;
    };
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
        {loadError && !loading && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-orange/30 bg-brand-orange/10 px-4 py-3"
          >
            <p className="font-body text-xs text-brand-blue-deep/80">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-brand-blue-deep px-3.5 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-white hover:bg-brand-blue"
            >
              Retry
            </button>
          </div>
        )}
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
