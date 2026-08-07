import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, Rocket, AlertTriangle, Upload, Lock, Unlock, XCircle } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";
import { usePortalUser } from "@/lib/portal-auth";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  apiFetch,
  extractErrorMessage,
  messageFrom,
  UPLOAD_TIMEOUT_MS,
} from "@/lib/api-client";

export const Route = createFileRoute("/portal/tracking")({
  head: () => ({
    meta: [
      { title: "Application Status · QCU MSC" },
      { name: "description", content: "Track your QCU MSC application status." },
    ],
  }),
  component: TrackingPage,
});

type StepKey = "submitted" | "review" | "interview" | "decision" | "onboarding";

const STEPS: { key: StepKey; label: string; hint: string }[] = [
  { key: "submitted", label: "Application submitted", hint: "We received your application." },
  { key: "review", label: "Under review", hint: "Management & Development is reviewing your credentials." },
  { key: "interview", label: "Interview scheduled", hint: "We'll email a slot via your QCU address." },
  { key: "decision", label: "Decision", hint: "Acceptance or feedback will arrive here." },
  { key: "onboarding", label: "Onboarding", hint: "Welcome to QCU MSC!" },
];

function TrackingPage() {
  const user = usePortalUser();
  const first = user?.fullName.split(" ")[0] ?? "there";

  const [applicant, setApplicant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    middleInitial: "",
    college: "",
    program: "",
    section: "",
    campus: "",
    dateOfBirth: "",
    placeOfBirth: "",
    gender: "",
    houseAddress: "",
    cellphoneNumber: "",
    facebookLink: "",
    interestsSkillsHobbies: "",
    organizationHistory: "",
    portfolio: "",
    githubOrProjectLinks: "",
    previousWorksAchievements: "",
  });

  const [corFile, setCorFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    const loadApplicant = async () => {
      try {
        const fetchRes = await apiFetch("/api/v1/applicants/me", {
          credentials: "include",
        });
        const apiResponse = await fetchRes.json();

        if (!fetchRes.ok || !apiResponse?.success) {
          throw new Error(apiResponse?.message || "Failed to load applicant data.");
        }
        if (apiResponse && apiResponse.success && apiResponse.data) {
          const applicantData = apiResponse.data;
          setApplicant(applicantData);
          setFormData({
            firstName: applicantData.firstName || "",
            lastName: applicantData.lastName || "",
            middleInitial: applicantData.middleInitial || "",
            college: applicantData.college || "",
            program: applicantData.program || "",
            section: applicantData.section || "",
            campus: applicantData.campus || "",
            dateOfBirth: applicantData.dateOfBirth
              ? new Date(applicantData.dateOfBirth).toISOString().split("T")[0]
              : "",
            placeOfBirth: applicantData.placeOfBirth || "",
            gender: applicantData.gender || "",
            houseAddress: applicantData.houseAddress || "",
            cellphoneNumber: applicantData.cellphoneNumber || "",
            facebookLink: applicantData.facebookLink || "",
            interestsSkillsHobbies: applicantData.interestsSkillsHobbies || "",
            organizationHistory: applicantData.organizationHistory || "",
            portfolio: applicantData.portfolio || "",
            githubOrProjectLinks: applicantData.githubOrProjectLinks || "",
            previousWorksAchievements: applicantData.previousWorksAchievements || "",
          });
        }
      } catch (err: unknown) {
        setError(messageFrom(err, "Failed to load applicant data."));
      } finally {
        setLoading(false);
      }
    };
    loadApplicant();
  }, []);

  const getStatusStage = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
      case "RESUBMIT":
        return 1;
      case "FOR_INTERVIEW":
        return 2;
      case "REJECTED":
      case "CANCELLED":
        return 3;
      case "APPROVED":
        return 4;
      default:
        return 0;
    }
  };

  const handleSubmitUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      const unlocked = applicant?.resubmitFields || [];

      if (unlocked.includes("personalInfo")) {
        Object.entries(formData).forEach(([key, val]) => {
          // Skip empty strings for optional fields to avoid backend Zod validation errors (e.g. invalid URL)
          const isOptionalField = [
            "portfolio",
            "githubOrProjectLinks",
            "facebookLink",
            "previousWorksAchievements",
            "middleInitial",
            "interestsSkillsHobbies",
            "organizationHistory"
          ].includes(key);

          if (val === "" && isOptionalField) {
            return;
          }
          fd.append(key, val as string);
        });
      }

      if (unlocked.includes("certificateOfRegistration") && corFile) {
        fd.append("certificateOfRegistration", corFile);
      }

      if (unlocked.includes("curriculumVitae") && cvFile) {
        fd.append("curriculumVitae", cvFile);
      }

      const linkRes = await apiFetch(
        `/api/v1/applicants/${applicant.id}/resubmit`,
        { method: "POST", credentials: "include", body: fd },
        { timeoutMs: UPLOAD_TIMEOUT_MS },
      );
      const apiResponse = await linkRes.json();
      if (!linkRes.ok || !apiResponse?.success) {
        throw new Error(extractErrorMessage(apiResponse, "Failed to resubmit application."));
      }

      toast.success("Application updated successfully", {
        description: "Your details have been resubmitted and are back under review.",
      });

      setApplicant(apiResponse.data);
      setCorFile(null);
      setCvFile(null);
    } catch (err: unknown) {
      toast.error(messageFrom(err, "Something went wrong."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalShell requireRole="applicant" title="Application Status" subtitle="Acquiring trajectory coordinates...">
        <div className="flex h-40 items-center justify-center">
          <div className="text-center space-y-2">
            <Clock className="size-8 animate-spin text-brand-blue-deep mx-auto" />
            <p className="text-sm text-brand-blue-deep/60">Recalibrating trajectory metrics...</p>
          </div>
        </div>
      </PortalShell>
    );
  }

  const currentIdx = applicant ? getStatusStage(applicant.status) : 1;
  const progress = Math.round(((currentIdx + 1) / STEPS.length) * 100);
  const unlocked = applicant?.resubmitFields || [];

  const isPersonalLocked = !unlocked.includes("personalInfo");
  const isCorLocked = !unlocked.includes("certificateOfRegistration");
  const isCvLocked = !unlocked.includes("curriculumVitae");

  return (
    <PortalShell
      requireRole="applicant"
      title="Application Status"
      subtitle={
        applicant?.status === "REJECTED"
          ? "Your trajectory has concluded. Review the decision details below."
          : applicant?.status === "RESUBMIT"
          ? "Please address the requested corrections to proceed."
          : "Here's your current trajectory."
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="size-4" />
          <AlertTitle>Error Loading Trajectory</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Flight status */}
          {applicant?.status !== "RESUBMIT" && applicant?.status !== "REJECTED" && (
            <PortalCard
              title="Flight status"
              icon={<Rocket className="size-5 text-brand-blue-deep" />}
            >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/80">
                Trajectory · Stage {currentIdx + 1} of {STEPS.length}
              </p>
              <span className="rounded-full bg-brand-yellow px-3 py-1 font-heading text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue-deep">
                {progress}% Cleared
              </span>
            </div>

            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-brand-blue-light/60">
              <div
                className="h-full rounded-full bg-brand-blue-deep transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ol className="space-y-4">
              {STEPS.map((step, i) => {
                const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {state === "done" ? (
                        <CheckCircle2 className="size-6 text-emerald-600" />
                      ) : state === "current" ? (
                        <span className="grid size-6 place-items-center rounded-full bg-brand-blue-deep text-white">
                          <Clock className="size-3.5" />
                        </span>
                      ) : (
                        <Circle className="size-6 text-brand-blue-deep/50" />
                      )}
                    </div>
                    <div>
                      <div
                        className={[
                          "font-heading text-sm font-bold",
                          state === "upcoming" ? "text-brand-blue-deep/60" : "text-brand-blue-deep",
                        ].join(" ")}
                      >
                        {step.label}
                        {state === "current" && (
                          <span className="ml-2 rounded-full bg-brand-blue-deep/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue-deep">
                            In progress
                          </span>
                        )}
                      </div>
                      <div className="font-body text-xs text-brand-blue-deep/80">{step.hint}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            </PortalCard>
          )}

          {/* Rejection Notice */}
          {applicant?.status === "REJECTED" && (
            <PortalCard
              title="Application Status"
              icon={<XCircle className="size-5 text-red-500 shrink-0" />}
              className="border-red-500/30 shadow-[0_18px_45px_-15px_rgba(239,68,68,0.2)]"
            >
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold text-red-600">
                  Application Not Approved
                </h3>
                <p className="text-sm text-brand-blue-deep/80 leading-relaxed">
                  We appreciate your interest in the Microsoft Student Community QCU. After carefully reviewing your credentials, we regret to inform you that we are unable to accept your application at this time.
                </p>
                {applicant.adminMessage && (
                  <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-600">HR Feedback</p>
                    <p className="mt-1 text-sm font-medium text-red-800 wrap-break-word whitespace-pre-wrap">{applicant.adminMessage}</p>
                  </div>
                )}
              </div>
            </PortalCard>
          )}

          {/* Resubmit form */}
          {applicant?.status === "RESUBMIT" && (
            <PortalCard
              title="Corrections Required"
              icon={<AlertTriangle className="size-5 text-orange-500 shrink-0" />}
              className="border-orange-500/30 shadow-[0_18px_45px_-15px_rgba(235,100,20,0.2)]"
            >
              <div className="space-y-4">
                <p className="text-sm text-brand-blue-deep/80 leading-relaxed">
                  The admissions team requested updates to your application credentials.
                </p>
                {applicant.adminMessage && (
                  <div className="rounded-xl bg-orange-500/10 p-4 border border-orange-500/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">HR Message</p>
                    <p className="mt-1 text-sm font-medium text-orange-800 wrap-break-word whitespace-pre-wrap">{applicant.adminMessage}</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmitUpdates} className="space-y-6 pt-4 border-t border-brand-blue-deep/10">
                {/* ── Files Resubmission Zone ───────────────────────────── */}
                {(!isCorLocked || !isCvLocked) && (
                  <div className="space-y-4">
                    <h4 className="font-heading text-xs font-black uppercase tracking-wider text-brand-blue-deep/60">
                      Document Attachments
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* COR */}
                      <div className={`p-4 border rounded-2xl transition-all ${isCorLocked ? "bg-brand-blue-light/20 border-border/40 opacity-70" : "bg-white/50 border-orange-500/30 hover:border-orange-500/50"}`}>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="font-bold text-brand-blue-deep">Certificate of Registration</Label>
                          {isCorLocked ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-brand-blue-deep/45"><Lock className="size-3" /> Locked</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-600"><Unlock className="size-3" /> Editable</span>
                          )}
                        </div>
                        <input
                          type="file"
                          id="file-cor"
                          disabled={isCorLocked}
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => setCorFile(e.target.files?.[0] || null)}
                        />
                        <label
                          htmlFor="file-cor"
                          className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isCorLocked ? "border-muted/30 cursor-not-allowed bg-muted/5" : "border-brand-blue-deep/20 hover:border-orange-500 hover:bg-orange-500/5"}`}
                        >
                          <Upload className={`size-6 mb-2 ${isCorLocked ? "text-muted-foreground/30" : "text-brand-blue-deep"}`} />
                          <span className="text-xs font-semibold text-brand-blue-deep">
                            {corFile ? corFile.name : isCorLocked ? "COR File Verified" : "Choose COR File"}
                          </span>
                        </label>
                      </div>

                      {/* CV */}
                      <div className={`p-4 border rounded-2xl transition-all ${isCvLocked ? "bg-brand-blue-light/20 border-border/40 opacity-70" : "bg-white/50 border-orange-500/30 hover:border-orange-500/50"}`}>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="font-bold text-brand-blue-deep">Curriculum Vitae</Label>
                          {isCvLocked ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-brand-blue-deep/45"><Lock className="size-3" /> Locked</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-600"><Unlock className="size-3" /> Editable</span>
                          )}
                        </div>
                        <input
                          type="file"
                          id="file-cv"
                          disabled={isCvLocked}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        />
                        <label
                          htmlFor="file-cv"
                          className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isCvLocked ? "border-muted/30 cursor-not-allowed bg-muted/5" : "border-brand-blue-deep/20 hover:border-orange-500 hover:bg-orange-500/5"}`}
                        >
                          <Upload className={`size-6 mb-2 ${isCvLocked ? "text-muted-foreground/30" : "text-brand-blue-deep"}`} />
                          <span className="text-xs font-semibold text-brand-blue-deep">
                            {cvFile ? cvFile.name : isCvLocked ? "CV File Verified" : "Choose CV File"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Personal Info Resubmission Zone ───────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-xs font-black uppercase tracking-wider text-brand-blue-deep/60">
                      Personal Information
                    </h4>
                    {isPersonalLocked ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-brand-blue-deep/45"><Lock className="size-3" /> Locked</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-600"><Unlock className="size-3" /> Editable</span>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        disabled={isPersonalLocked}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        disabled={isPersonalLocked}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleInitial">Middle Initial</Label>
                      <Input
                        id="middleInitial"
                        disabled={isPersonalLocked}
                        value={formData.middleInitial}
                        onChange={(e) => setFormData({ ...formData, middleInitial: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cellphoneNumber">Cellphone Number</Label>
                      <Input
                        id="cellphoneNumber"
                        disabled={isPersonalLocked}
                        value={formData.cellphoneNumber}
                        onChange={(e) => setFormData({ ...formData, cellphoneNumber: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campus">Campus</Label>
                      <Select
                        disabled={isPersonalLocked}
                        value={formData.campus}
                        onValueChange={(val) => setFormData({ ...formData, campus: val })}
                      >
                        <SelectTrigger className="w-full rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50 h-10">
                          <SelectValue placeholder="Select Campus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAN_BARTOLOME_MAIN">San Bartolome (Main)</SelectItem>
                          <SelectItem value="SAN_FRANCISCO">San Francisco</SelectItem>
                          <SelectItem value="BATASAN">Batasan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        disabled={isPersonalLocked}
                        value={formData.gender}
                        onValueChange={(val) => setFormData({ ...formData, gender: val })}
                      >
                        <SelectTrigger className="w-full rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50 h-10">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="LGBTQIA">LGBTQIA+</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        disabled={isPersonalLocked}
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirth">Place of Birth</Label>
                      <Input
                        id="placeOfBirth"
                        disabled={isPersonalLocked}
                        value={formData.placeOfBirth}
                        onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="college">College</Label>
                      <Input
                        id="college"
                        disabled={isPersonalLocked}
                        value={formData.college}
                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program">Program</Label>
                      <Input
                        id="program"
                        disabled={isPersonalLocked}
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        disabled={isPersonalLocked}
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookLink">Facebook Link</Label>
                      <Input
                        id="facebookLink"
                        disabled={isPersonalLocked}
                        value={formData.facebookLink}
                        onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="houseAddress">House Address</Label>
                      <Input
                        id="houseAddress"
                        disabled={isPersonalLocked}
                        value={formData.houseAddress}
                        onChange={(e) => setFormData({ ...formData, houseAddress: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="interests">Interests, Skills & Hobbies</Label>
                      <Textarea
                        id="interests"
                        disabled={isPersonalLocked}
                        value={formData.interestsSkillsHobbies}
                        onChange={(e) => setFormData({ ...formData, interestsSkillsHobbies: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50 min-h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgHistory">Organization History</Label>
                      <Textarea
                        id="orgHistory"
                        disabled={isPersonalLocked}
                        value={formData.organizationHistory}
                        onChange={(e) => setFormData({ ...formData, organizationHistory: e.target.value })}
                        className="rounded-xl border border-brand-blue-deep/20 focus:border-orange-500 bg-white/50 min-h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-brand-blue-deep/10">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md px-6 py-2 transition-all"
                  >
                    {submitting ? "Resubmitting Trajectory..." : "Resubmit Application"}
                  </Button>
                </div>
              </form>
            </PortalCard>
          )}
        </div>

        <div className="lg:col-span-4">
          <PortalCard
            title="Mission log"
            icon={<Clock className="size-5 text-brand-blue-deep" />}
          >
            <ul className="space-y-4">
              {applicant?.status === "REJECTED" ? (
                <li className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-red-500 animate-ping" />
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-red-500" />
                  <div className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
                    Active
                  </div>
                  <div className="mt-0.5 font-display text-sm font-bold text-brand-blue-deep">
                    Application rejected
                  </div>
                  <div className="mt-1 font-body text-xs leading-relaxed text-brand-blue-deep/85">
                    Your application review has concluded. HR feedback has been provided.
                  </div>
                </li>
              ) : null}
              {applicant?.status === "RESUBMIT" ? (
                <li className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-orange-500 animate-ping" />
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-orange-500" />
                  <div className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">
                    Active
                  </div>
                  <div className="mt-0.5 font-display text-sm font-bold text-brand-blue-deep">
                    Corrections required
                  </div>
                  <div className="mt-1 font-body text-xs leading-relaxed text-brand-blue-deep/85">
                    Your trajectory has experienced minor drift. Update the requested details to realign.
                  </div>
                </li>
              ) : null}
              <li className="relative pl-5">
                <span className="absolute left-0 top-1.5 size-2 rounded-full bg-brand-blue-deep" />
                <div className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue-deep/80">
                  {applicant ? new Date(applicant.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"}
                </div>
                <div className="mt-0.5 font-display text-sm font-bold text-brand-blue-deep">
                  Application received
                </div>
                <div className="mt-1 font-body text-xs leading-relaxed text-brand-blue-deep/85">
                  Your credentials have been logged in the system registry. Trajectory calculations active.
                </div>
              </li>
            </ul>
          </PortalCard>
        </div>
      </div>
    </PortalShell>
  );
}
