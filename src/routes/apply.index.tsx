import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Upload,
  Compass,
  Orbit,
  Sparkles,
} from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hasActiveAccountRedirect, startAccountRedirect } from "@/lib/application-flow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdSubmission } from "@/components/IdUploadScanner";
import { getApiEndpoint } from "@/lib/api-config";

// IdUploadScanner pulls in tesseract.js (~2MB). Lazy-load so the intro
// stage of /apply stays light; the chunk fetches when the user reaches scan.
const IdUploadScanner = lazy(() =>
  import("@/components/IdUploadScanner").then((m) => ({
    default: m.IdUploadScanner,
  })),
);

export const Route = createFileRoute("/apply/")({
  head: () => ({
    meta: [
      { title: "Apply · QCU MSC" },
      {
        name: "description",
        content:
          "Apply to join the Microsoft Student Community at Quezon City University. A friendly, one-question-at-a-time application.",
      },
      { property: "og:title", content: "Apply · QCU MSC" },
      {
        property: "og:description",
        content:
          "Join QCU MSC. A conversational application that gets to know you one step at a time.",
      },
    ],
  }),
  component: ApplyPage,
});

/* ---------- Types ---------- */

type FormState = {
  fullName: string;
  college: string;
  program: string;
  section: string;
  campus: string;
  studentId: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  role: string;
  certificateOfRegistration: string;
  curriculumVitae: string;
  houseAddress: string;
  cellphone: string;
  email: string;
  facebookLink: string;
  interests: string;
  pastOrganizations: string;
  portfolio: string;
  githubOrProjects: string;
  previousWorks: string;
};

const INITIAL: FormState = {
  fullName: "",
  college: "",
  program: "",
  section: "",
  campus: "",
  studentId: "",
  dateOfBirth: "",
  placeOfBirth: "",
  gender: "",
  role: "",
  certificateOfRegistration: "",
  curriculumVitae: "",
  houseAddress: "",
  cellphone: "",
  email: "",
  facebookLink: "",
  interests: "",
  pastOrganizations: "",
  portfolio: "",
  githubOrProjects: "",
  previousWorks: "",
};

type FieldKind = "text" | "email" | "tel" | "date" | "textarea" | "select" | "file";

type Question = {
  key: keyof FormState;
  chapter: string; // "Chapter 1 · The basics"
  greeting?: string; // Optional warm intro line that appears above the prompt
  prompt: string; // The actual question
  helper?: string; // Small helper hint under the input
  placeholder?: string;
  kind: FieldKind;
  options?: string[]; // For select
  optional?: boolean;
  validate?: (value: string) => string | null;
  optionsFor?: (form: FormState) => string[]; // Dynamic options based on form state
};

const required = (v: string) => (v.trim() ? null : "This one's required to continue.");
const validPersonalEmail = (v: string) => {
  if (!v.trim()) return "Please share your personal email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Must be a valid email address (e.g., user@gmail.com).";
  return null;
};
const validCellphone = (v: string) => {
  if (!v.trim()) return "This one's required to continue.";
  if (!/^09\d{9}$/.test(v.trim())) return "Must be 11 digits starting with 09 (e.g., 09123456789).";
  return null;
};
const validUrl = (v: string) => {
  if (!v.trim()) return null;
  try {
    new URL(v.trim());
    return null;
  } catch {
    return "Must be a valid URL (e.g., https://...)";
  }
};
const validFacebookUrl = (v: string) => {
  if (!v.trim()) return null;
  try {
    const url = new URL(v.trim());
    if (!url.hostname.includes("facebook.com") && !url.hostname.includes("fb.com")) {
      return "Must be a valid Facebook profile URL.";
    }
    return null;
  } catch {
    return "Must be a valid URL (e.g.: https://facebook.com/...)";
  }
};
const validGitHubOrDriveUrl = (v: string) => {
  if (!v.trim()) return null;
  try {
    const url = new URL(v.trim());
    if (!url.hostname.includes("github.com") && !url.hostname.includes("drive.google.com")) {
      return "Must be a valid GitHub or Google Drive link.";
    }
    return null;
  } catch {
    return "Must be a valid URL (e.g., https://...)";
  }
};
const requiredUrl = (v: string) => required(v) || validUrl(v);

const MAX_DATE_OF_BIRTH = "2008-12-31";
const validDateOfBirth = (v: string) => {
  if (!v.trim()) return "Please enter your date of birth.";
  const date = new Date(v);
  const maxDate = new Date(MAX_DATE_OF_BIRTH);
  return null;
};

// College -> Programs mapping
const COLLEGE_PROGRAMS: Record<string, string[]> = {
  "College of Computer Studies": [
    "BS Information Technology",
    "BS Computer Science",
    "BS Information Systems",
  ],
  "College of Engineering": ["BS Industrial Engineering", "BS Electronics Engineering", "BS Computer Engineering"],
  "College of Business and Accountancy": ["BS Accountancy", "BS Entrepreneurship"],
  "College of Education": ["BS Early Childhood Education"],
};

const QUESTIONS: Question[] = [
  // Chapter 1 — Getting to know you
  {
    key: "fullName",
    chapter: "Chapter 1 · Getting to know you",
    greeting: "Hi there. We're excited you're here.",
    prompt: "What's your full name?",
    helper: "First, middle, last — whatever you go by officially.",
    placeholder: "Juan Dela Cruz",
    kind: "text",
    validate: required,
  },
  {
    key: "dateOfBirth",
    chapter: "Chapter 1 · Getting to know you",
    prompt: "When's your birthday?",
    kind: "date",
    validate: validDateOfBirth,
  },
  {
    key: "placeOfBirth",
    chapter: "Chapter 1 · Getting to know you",
    prompt: "And where were you born?",
    placeholder: "Quezon City",
    kind: "text",
    validate: required,
  },
  {
    key: "gender",
    chapter: "Chapter 1 · Getting to know you",
    prompt: "How do you identify?",
    helper: "Totally up to you to share.",
    kind: "select",
    options: ["Male", "Female", "LGBTQIA+", "Prefer not to say"],
    validate: required,
  },

  // Chapter 2 — Your academic life
  {
    key: "college",
    chapter: "Chapter 2 · Your academic life",
    greeting: "Awesome. Let's talk school for a sec.",
    prompt: "Which college are you in?",
    placeholder: "College of Computer Studies",
    kind: "select",
    options: Object.keys(COLLEGE_PROGRAMS),
    validate: required,
  },
  {
    key: "program",
    chapter: "Chapter 2 · Your academic life",
    prompt: "What program are you taking?",
    placeholder: "BS Information Technology",
    kind: "select",
    optionsFor: (form: FormState) => {
      return COLLEGE_PROGRAMS[form.college] || ["Select a college first"];
    },
    validate: required,
  },
  {
    key: "section",
    chapter: "Chapter 2 · Your academic life",
    prompt: "What section are you in?",
    placeholder: "3A",
    kind: "text",
    validate: required,
  },
  {
    key: "campus",
    chapter: "Chapter 2 · Your academic life",
    prompt: "Which QCU campus?",
    kind: "select",
    options: ["San Bartolome (Main)", "San Francisco", "Batasan"],
    validate: required,
  },
  // studentId is captured via Zonal OCR before the form starts.

  // Chapter 3 — Your role with us
  {
    key: "role",
    chapter: "Chapter 3 · Your role with us",
    greeting: "Now the fun part — let's figure out where you'd shine.",
    prompt: "Which department feels most like you?",
    helper: "You can always grow into other roles later.",
    kind: "select",
    options: [
      "Engineering / Development",
      "Design & Creatives",
      "Marketing & Communications",
      "Operations & Logistics",
      "Research & Curriculum",
      "General Member",
    ],
    validate: required,
  },

  // Chapter 4 — Documents
  {
    key: "certificateOfRegistration",
    chapter: "Chapter 4 · A couple of documents",
    greeting: "Almost there. Just two quick files.",
    prompt: "Can you upload your Certificate of Registration?",
    helper: "Your current semester COR — PDF, DOCX, JPG, or PNG.",
    kind: "file",
    validate: required,
  },
  {
    key: "curriculumVitae",
    chapter: "Chapter 4 · A couple of documents",
    prompt: "And your Curriculum Vitae?",
    helper: "PDF preferred. Nothing fancy needed.",
    kind: "file",
    validate: required,
  },

  // Chapter 5 — How to reach you
  {
    key: "email",
    chapter: "Chapter 5 · How we'll reach you",
    greeting: "Great, switching gears — how do we get in touch?",
    prompt: "What's your personal email address?",
    helper: "For account setup links & notifications (e.g., Gmail, Yahoo, Outlook)",
    placeholder: "you@gmail.com",
    kind: "email",
    validate: validPersonalEmail,
  },
  {
    key: "cellphone",
    chapter: "Chapter 5 · How we'll reach you",
    prompt: "Your cellphone number?",
    helper: "For faster updates.",
    placeholder: "09123456789",
    kind: "tel",
    validate: validCellphone,
  },
  {
    key: "houseAddress",
    chapter: "Chapter 5 · How we'll reach you",
    prompt: "Where do you currently live?",
    helper: "Block / Lot, Street, Barangay, City.",
    placeholder: "e.g. 123 Mabuhay St, Barangay Holy Spirit, Quezon City",
    kind: "textarea",
    validate: required,
  },
  {
    key: "facebookLink",
    chapter: "Chapter 5 · How we'll reach you",
    prompt: "What's your Facebook profile link?",
    placeholder: "https://facebook.com/your.profile",
    kind: "text",
    validate: validFacebookUrl,
  },

  // Chapter 6 — A little more about you
  {
    key: "interests",
    chapter: "Chapter 6 · A little more about you",
    greeting: "Last stretch — we'd love to know what makes you, you.",
    prompt: "What are your interests, skills, and hobbies?",
    placeholder: "e.g. Web development, UI design, photography, debate club…",
    kind: "textarea",
    validate: required,
  },
  {
    key: "pastOrganizations",
    chapter: "Chapter 6 · A little more about you",
    prompt: "Have you joined an organization, club, or community before?",
    helper: "If yes, tell us about it. If not, just type N/A — totally okay.",
    placeholder: "Org name, your role, what you did…",
    kind: "textarea",
    validate: required,
  },

  // Chapter 7 — Optional bonus
  {
    key: "portfolio",
    chapter: "Chapter 7 · Anything else? (optional)",
    greeting: "These last three are completely optional.",
    prompt: "Got a portfolio you'd like to share?",
    placeholder: "https://your-portfolio.com",
    kind: "text",
    optional: true,
    validate: validUrl,
  },
  {
    key: "githubOrProjects",
    chapter: "Chapter 7 · Anything else? (optional)",
    prompt: "GitHub or project links?",
    placeholder: "https://github.com/yourhandle",
    kind: "text",
    optional: true,
    validate: validGitHubOrDriveUrl,
  },
  {
    key: "previousWorks",
    chapter: "Chapter 7 · Anything else? (optional)",
    prompt: "Any previous works or achievements you're proud of?",
    placeholder: "Hackathon wins, published projects, leadership roles…",
    kind: "textarea",
    optional: true,
  },
];

/* ---------- Page ---------- */

function ApplyPage() {
  const navigate = useNavigate();
  const [clientReady, setClientReady] = useState(false);
  const [redirectingToAccount, setRedirectingToAccount] = useState(() =>
    hasActiveAccountRedirect(),
  );
  const [stage, setStage] = useState<"scan" | "confirm" | "form">("scan");
  const [provisionalIdFile, setProvisionalIdFile] = useState<File | null>(null);
  const [provisionalIdPreview, setProvisionalIdPreview] = useState<string | null>(null);
  const [ocrSessionId, setOcrSessionId] = useState<string | null>(null);
  const [manualRequired, setManualRequired] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [confirmStudentId, setConfirmStudentId] = useState("");
  const [confirmLastName, setConfirmLastName] = useState("");
  const [confirmFirstName, setConfirmFirstName] = useState("");
  const [confirmMiddleInitial, setConfirmMiddleInitial] = useState("");
  const [digitCorrectedInName, setDigitCorrectedInName] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [idx, setIdx] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // QUESTIONS minus the fields the OCR confirmation step collects.
  const flowQuestions = useMemo(
    () => QUESTIONS.filter((q) => q.key !== "fullName" && q.key !== "email"),
    [],
  );

  useEffect(() => {
    if (hasActiveAccountRedirect()) {
      setRedirectingToAccount(true);
      void navigate({ to: "/apply/account", search: {}, replace: true }).catch(() => {
        setRedirectingToAccount(false);
      });
    }
    setClientReady(true);
  }, [navigate]);

  const handleScanComplete = async (payload: IdSubmission) => {
    setProvisionalIdFile(payload.fullIdImageFile);
    if (provisionalIdPreview) URL.revokeObjectURL(provisionalIdPreview);
    setProvisionalIdPreview(URL.createObjectURL(payload.fullIdImageFile));
    setStage("confirm");
    setOcrError(null);
    setOcrLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", payload.fullIdImageFile);

      const res = await fetch(getApiEndpoint("/ocr/verify"), { method: "POST", body: fd });
      const json = await res.json();

      if (res.ok && json.success) {
        setOcrSessionId(json.data.ocrSessionId);
        setManualRequired(json.data.manualRequired);

        // Pre-fill
        setConfirmStudentId(json.data.studentId || "");

        const lastName = json.data.lastName || "";
        const firstName = json.data.firstName || "";
        const middleInitial = json.data.middleInitial || "";

        setConfirmLastName(lastName);
        setConfirmFirstName(firstName);
        setConfirmMiddleInitial(middleInitial);
        setDigitCorrectedInName(!!json.data.digitCorrectedInName);

        let cleanMI = middleInitial.trim().replace(/\.+$/, "");
        if (cleanMI) {
          cleanMI = cleanMI + ".";
        }
        const formattedName = `${lastName}, ${firstName}${cleanMI ? " " + cleanMI : ""}`
          .trim()
          .replace(/\s+/g, " ");
        setForm((f) => ({ ...f, fullName: formattedName }));
      } else {
        if (json.data && json.data.manualRequired) {
          setOcrSessionId(json.data.ocrSessionId);
          setManualRequired(true);
          setConfirmStudentId("");
          setConfirmLastName("");
          setConfirmFirstName("");
          setConfirmMiddleInitial("");
          setDigitCorrectedInName(false);
          setOcrError(json.message || "Unable to read Student ID. Manual entry required.");
        } else {
          throw new Error(json.message || "Could not read ID.");
        }
      }
    } catch (err) {
      setOcrError(
        err instanceof Error
          ? err.message
          : "We couldn't read your ID automatically. You can type the details in.",
      );
      setManualRequired(true); // Fallback to manual if API is down
    } finally {
      setOcrLoading(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmAndStart = () => {
    if (!confirmStudentId.trim() || !confirmLastName.trim() || !confirmFirstName.trim()) {
      setOcrError("Please complete your student number, last name, and first name.");
      return;
    }
    if (!/^\d{2}-\d{4}$/.test(confirmStudentId.trim())) {
      setOcrError("Student number must be in YY-NNNN format (e.g., 23-1234).");
      return;
    }
    const emailMsg = validPersonalEmail(confirmEmail);
    if (emailMsg) {
      setOcrError(emailMsg);
      return;
    }
    setOcrError(null);
    let cleanMI = confirmMiddleInitial.trim().replace(/\.+$/, "");
    if (cleanMI) {
      cleanMI = cleanMI + ".";
    }
    const formattedName =
      `${confirmLastName.trim()}, ${confirmFirstName.trim()}${cleanMI ? " " + cleanMI : ""}`
        .trim()
        .replace(/\s+/g, " ");
    setForm((f) => ({
      ...f,
      studentId: confirmStudentId.trim(),
      fullName: formattedName,
      email: confirmEmail.trim(),
    }));
    setStage("form");
    setIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const total = flowQuestions.length;
  const onReview = false;
  const q = flowQuestions[Math.min(idx, total - 1)];
  const progress = useMemo(
    () => (submitted ? 100 : Math.round((idx / total) * 100)),
    [idx, total, submitted],
  );

  useEffect(() => {
    if (
      q &&
      (q.kind === "text" || q.kind === "email" || q.kind === "tel" || q.kind === "textarea")
    ) {
      inputRef.current?.focus();
    }
  }, [idx, q]);

  const update = (key: keyof FormState, value: string, file?: File) => {
    // If college changes, clear program
    if (key === "college") {
      setForm((f) => ({ ...f, [key]: value, program: "" }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
    if (file) setFiles((prev) => ({ ...prev, [key]: file }));
    setError(null);
  };

  const goNext = () => {
    if (!q) return;
    const v = String(form[q.key] ?? "");

    if (q.optional && !v.trim()) {
      // Optional and empty is fine
    } else if (q.validate) {
      const msg = q.validate(v);
      if (msg) {
        setError(msg);
        return;
      }
    }
    setError(null);
    if (idx === total - 1) {
      submit();
      return;
    }
    setIdx((i) => Math.min(total - 1, i + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError(null);
    setIdx((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setError(null);
    try {
      const fd = new FormData();

      let cleanMI = confirmMiddleInitial.trim().replace(/\.+$/, "");
      if (cleanMI) {
        cleanMI = cleanMI + ".";
      }

      fd.append("firstName", confirmFirstName.trim());
      fd.append("lastName", confirmLastName.trim());
      if (cleanMI) {
        fd.append("middleInitial", cleanMI);
      }
      fd.append("email", form.email);
      fd.append("college", form.college);
      fd.append("program", form.program);
      fd.append("section", form.section);

      let backendCampus = "SAN_BARTOLOME_MAIN";
      if (form.campus.toUpperCase().includes("SAN FRANCISCO")) backendCampus = "SAN_FRANCISCO";
      if (form.campus.toUpperCase().includes("BATASAN")) backendCampus = "BATASAN";
      fd.append("campus", backendCampus);

      if (form.dateOfBirth) fd.append("dateOfBirth", form.dateOfBirth);
      fd.append("placeOfBirth", form.placeOfBirth);

      let backendGender = "PREFER_NOT_TO_SAY";
      const g = form.gender.toUpperCase();
      if (g.includes("MALE") && !g.includes("FEMALE")) backendGender = "MALE";
      else if (g.includes("FEMALE")) backendGender = "FEMALE";
      else if (g.includes("LGBTQ")) backendGender = "LGBTQIA";
      fd.append("gender", backendGender);

      fd.append("membershipRole", form.role);
      fd.append("houseAddress", form.houseAddress);
      fd.append("cellphoneNumber", form.cellphone);
      fd.append("qcuMscEmail", form.email);
      fd.append("facebookLink", form.facebookLink);
      fd.append("interestsSkillsHobbies", form.interests);
      fd.append("organizationHistory", form.pastOrganizations || "N/A");

      if (form.portfolio) fd.append("portfolio", form.portfolio);
      if (form.githubOrProjects) fd.append("githubOrProjectLinks", form.githubOrProjects);
      if (form.previousWorks) fd.append("previousWorksAchievements", form.previousWorks);

      if (ocrSessionId) fd.append("ocrSessionId", ocrSessionId);
      if (manualRequired) fd.append("studentId", form.studentId);

      if (!files.certificateOfRegistration)
        throw new Error(
          `Please re-select your Certificate of Registration file. Debug memory: ${Object.keys(files).join(", ") || "none"}`,
        );
      if (!files.curriculumVitae)
        throw new Error(
          `Please re-select your Curriculum Vitae file. Debug memory: ${Object.keys(files).join(", ") || "none"}`,
        );
      fd.append("certificateOfRegistration", files.certificateOfRegistration);
      fd.append("curriculumVitae", files.curriculumVitae);

      const res = await fetch(getApiEndpoint("/applicants"), {
        method: "POST",
        body: fd,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        let errorMsg = json.message || "Submission failed.";
        if (json.errors) {
          const detailErrs = Object.values(json.errors).flat().join(" | ");
          errorMsg = `${errorMsg}: ${detailErrs}`;
        }
        throw new Error(errorMsg);
      }

      startAccountRedirect();
      setRedirectingToAccount(true);
      try {
        let cleanMI = confirmMiddleInitial.trim().replace(/\.+$/, "");
        if (cleanMI) {
          cleanMI = cleanMI + ".";
        }
        sessionStorage.setItem(
          "qcumsc.applicant",
          JSON.stringify({
            applicantId: json.data?.id || json.data?.applicantId,
            studentId: manualRequired ? form.studentId : json.data?.studentId || form.studentId,
            fullName: form.fullName,
            email: form.email,
            role: form.role,
            provisional: manualRequired,
            firstName: confirmFirstName.trim(),
            lastName: confirmLastName.trim(),
            middleInitial: cleanMI,
          }),
        );
      } catch {
        /* ignore */
      }
      void navigate({ to: "/apply/account", replace: true }).catch(() => {
        setRedirectingToAccount(false);
      });
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
      setIdx(total - 1);
      setSubmitted(false);
    }
  };

  const reset = () => {
    setForm(INITIAL);
    setError(null);
    setIdx(0);
    setSubmitted(false);
    setProvisionalIdFile(null);
    if (provisionalIdPreview) URL.revokeObjectURL(provisionalIdPreview);
    setProvisionalIdPreview(null);
    setConfirmStudentId("");
    setConfirmLastName("");
    setConfirmFirstName("");
    setConfirmMiddleInitial("");
    setDigitCorrectedInName(false);
    setConfirmEmail("");
    setStage("scan");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && q && q.kind !== "textarea") {
      e.preventDefault();
      goNext();
    }
  };

  // Chapter intro: show greeting only on the first question of a chapter
  const isChapterStart = q !== null && (idx === 0 || flowQuestions[idx - 1].chapter !== q.chapter);

  if (!clientReady) {
    return <ApplyBootScreen />;
  }

  if (redirectingToAccount) {
    return <AccountRedirectScreen />;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />
      <PlanetsField />

      {/* Header */}
      <header className="relative z-20 mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src={logoUrl} alt="QCU MSC logo" className="size-9 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-sm font-extrabold tracking-tight text-white drop-shadow sm:text-base">
              <span className="hidden sm:inline">Quezon City University</span>
              <span className="sm:hidden">QCU · MSC</span>
            </div>
            <div className="hidden truncate text-[10px] uppercase tracking-[0.18em] text-white/85 drop-shadow sm:block">
              Microsoft Student Community
            </div>
          </div>
        </Link>
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        {stage === "scan" ? (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MissionPanel
              eyebrow="Pre-flight check"
              title={
                <>
                  Verify your
                  <br />
                  <span className="text-brand-orange">student orbit</span>
                </>
              }
              subtitle="Scan your QCU Student ID using the guided frame. Everything stays on your device — we just need to confirm you're a real cadet."
              stats={[
                { label: "Step", value: "00" },
                { label: "Phase", value: "ID Scan" },
                { label: "Range", value: "On-device" },
              ]}
            />
            <div className="lg:pt-6">
              <div className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
                <Suspense
                  fallback={
                    <div className="grid h-72 place-items-center text-sm text-white/70">
                      Preparing on-device scanner…
                    </div>
                  }
                >
                  <IdUploadScanner onSubmit={handleScanComplete} />
                </Suspense>
              </div>
            </div>
          </div>
        ) : stage === "confirm" ? (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MissionPanel
              eyebrow="Confirm identity"
              title={
                <>
                  Double-check your
                  <br />
                  <span className="text-brand-orange">ID details</span>
                </>
              }
              subtitle="Our OCR engine reads your captured ID and pre-fills these fields. Adjust anything that looks off, then add your QCU email."
              stats={[
                { label: "Step", value: "01" },
                { label: "Phase", value: "Verify" },
                { label: "OCR", value: ocrLoading ? "Reading…" : "Ready" },
              ]}
            />
            <div className="lg:pt-6">
              <div className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
                <ConfirmIdStep
                  preview={provisionalIdPreview}
                  loading={ocrLoading}
                  error={ocrError}
                  studentId={confirmStudentId}
                  lastName={confirmLastName}
                  firstName={confirmFirstName}
                  middleInitial={confirmMiddleInitial}
                  digitCorrected={digitCorrectedInName}
                  email={confirmEmail}
                  onStudentId={setConfirmStudentId}
                  onLastName={setConfirmLastName}
                  onFirstName={setConfirmFirstName}
                  onMiddleInitial={setConfirmMiddleInitial}
                  onEmail={setConfirmEmail}
                  isManual={manualRequired}
                  onBack={() => {
                    setStage("scan");
                  }}
                  onContinue={confirmAndStart}
                />
              </div>
            </div>
          </div>
        ) : submitted ? (
          <SuccessCard onReset={reset} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MissionPanel
              eyebrow={onReview ? "Final review" : q!.chapter}
              title={
                onReview ? (
                  <>
                    One last
                    <br />
                    <span className="text-brand-orange">orbital check</span>
                  </>
                ) : (
                  <>
                    Travel the
                    <br />
                    <span className="text-brand-orange">QCU MSC</span>
                  </>
                )
              }
              subtitle={
                onReview
                  ? "Scan every coordinate before we launch your application toward Mission Control."
                  : "One quick question at a time. We're charting your route across the constellation — no pressure."
              }
              stats={[
                {
                  label: "Question",
                  value: onReview ? `${total}/${total}` : `${idx + 1}/${total}`,
                },
                { label: "Progress", value: `${progress}%` },
                { label: "Heading", value: onReview ? "Review" : "Forward" },
              ]}
              progress={progress}
            />

            <div className="lg:pt-6">
              <div
                key={idx}
                className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {onReview ? (
                  <ReviewStep
                    form={form}
                    onEdit={(key) => {
                      const i = flowQuestions.findIndex((x) => x.key === key);
                      if (i >= 0) setIdx(i);
                    }}
                  />
                ) : (
                  <div className="space-y-6" onKeyDown={onKeyDown}>
                    {isChapterStart && q!.greeting && (
                      <p className="font-body text-sm italic text-brand-blue-deep/70">
                        {q!.greeting}
                      </p>
                    )}
                    <h2 className="font-display text-2xl font-bold leading-tight text-brand-blue-deep sm:text-3xl">
                      {q!.prompt}
                      {q!.optional && (
                        <span className="ml-2 align-middle text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue-deep/50">
                          optional
                        </span>
                      )}
                    </h2>

                    <QuestionInput
                      q={q!}
                      value={String(form[q!.key] ?? "")}
                      onChange={(v, f) => update(q!.key, v, f)}
                      inputRef={inputRef}
                      form={form}
                    />

                    {q!.helper && !error && (
                      <p className="text-xs text-brand-blue-deep/60">{q!.helper}</p>
                    )}
                    {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                  </div>
                )}

                {/* Nav */}
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/60 pt-6">
                  {idx > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex items-center gap-2 rounded-full glass-strong px-5 py-2.5 font-heading text-sm font-semibold text-brand-blue-deep transition hover:bg-white"
                    >
                      <ArrowLeft className="size-4" /> Back to Space
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    {onReview ? (
                      <button
                        type="button"
                        onClick={submit}
                        className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                        style={{ background: "var(--gradient-cta)" }}
                      >
                        Submit Application <Rocket className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                        style={{ background: "var(--gradient-cta)" }}
                      >
                        {idx === total - 1 ? (
                          <>
                            Submit Application <Rocket className="size-4" />
                          </>
                        ) : (
                          <>
                            Continue <ArrowRight className="size-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!onReview && (
                <p className="mt-4 hidden text-[11px] text-white/75 drop-shadow [@media(hover:hover)]:block">
                  Press{" "}
                  <kbd className="rounded bg-white/30 px-1.5 py-0.5 font-mono text-[10px]">
                    Enter
                  </kbd>{" "}
                  to continue
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ApplyBootScreen() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />
      <PlanetsField />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-[2rem] glass-strong p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-orange text-white shadow-lg animate-planet-bob">
            <Compass className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold leading-tight text-brand-blue-deep sm:text-3xl">
            Preparing pre-flight
          </h1>
          <p className="mt-2 font-body text-sm text-brand-blue-deep/70">
            Setting up the application deck.
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountRedirectScreen() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />
      <PlanetsField />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-[2rem] glass-strong p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-orange text-white shadow-lg animate-planet-bob">
            <Rocket className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold leading-tight text-brand-blue-deep sm:text-3xl">
            Preparing your cockpit
          </h1>
          <p className="mt-2 font-body text-sm text-brand-blue-deep/70">
            Your application is locked in. Opening account creation now.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Input renderer ---------- */

function QuestionInput({
  q,
  value,
  onChange,
  inputRef,
  form,
}: {
  q: Question;
  value: string;
  onChange: (v: string, file?: File) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  form?: FormState;
}) {
  const base = "bg-white/85 text-base";

  if (q.kind === "textarea") {
    return (
      <Textarea
        ref={(el) => {
          inputRef.current = el;
        }}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder}
        className={base}
      />
    );
  }

  if (q.kind === "select") {
    // Get options - either static or dynamic
    let options: string[] = [];
    if (q.optionsFor && form) {
      options = q.optionsFor(form);
    } else if (q.options) {
      options = q.options;
    }

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-14 w-full whitespace-normal bg-white/85 px-4 text-left text-base [&>span]:line-clamp-2 [&>span]:text-left">
          <SelectValue placeholder="Choose one…" />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-2rem)]">
          {options.map((o) => (
            <SelectItem key={o} value={o} className="py-3 text-base">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (q.kind === "file") {
    return (
      <label className="grid min-h-14 w-full max-w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-md border border-input bg-white/85 px-3 py-3 text-sm shadow-sm transition hover:bg-white sm:px-4">
        <span className="flex min-w-0 items-center gap-2 text-brand-blue-deep">
          <Upload className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {value || "Choose a file (PDF, DOCX, JPG, PNG)"}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-brand-blue-deep px-3 py-1.5 text-[11px] font-semibold text-white">
          Browse
        </span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f.name, f);
          }}
        />
      </label>
    );
  }

  if (q.kind === "date") {
    return <BirthdayCalendarPicker value={value} onChange={onChange} inputRef={inputRef} />;
  }

  return (
    <Input
      ref={(el) => {
        inputRef.current = el;
      }}
      type={q.kind}
      value={value}
      onChange={(e) => {
        const val = q.kind === "tel" ? e.target.value.replace(/\D/g, "") : e.target.value;
        onChange(val);
      }}
      placeholder={q.placeholder}
      className={`h-12 ${base}`}
      maxLength={q.kind === "tel" ? 11 : undefined}
    />
  );
}

/* ---------- Birthday Calendar Picker ---------- */

function BirthdayCalendarPicker({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    // If there's a selected value, use that year/month
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.getFullYear();
      }
    }
    // Otherwise default to December 2008
    return 2008;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    // If there's a selected value, use that year/month
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.getMonth();
      }
    }
    // Otherwise default to December (11)
    return 11;
  });

  const selectedDate = value ? new Date(value) : null;
  const maxDate = new Date(MAX_DATE_OF_BIRTH);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (date > maxDate) {
      return; // Don't select dates after max
    }
    const formatted = date.toISOString().split("T")[0];
    onChange(formatted);
    setShowCalendar(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    return date > maxDate;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day);
      const selected = isDateSelected(day);
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={disabled}
          className={`h-10 rounded-lg text-sm font-medium transition-colors ${
            selected
              ? "bg-brand-orange text-white hover:bg-brand-orange/90"
              : disabled
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-brand-blue-light/20 text-brand-blue-deep"
          }`}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  // Format the display value
  const displayValue = value ? new Date(value) : null;
  const isValidDisplay = displayValue && !isNaN(displayValue.getTime());

  return (
    <div className="relative">
      <div
        className="flex h-12 w-full cursor-pointer items-center rounded-md border border-input bg-white/85 px-3 text-base shadow-sm transition hover:bg-white"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <span className={value && isValidDisplay ? "text-brand-blue-deep" : "text-gray-400"}>
          {value && isValidDisplay
            ? displayValue.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Select your birthday"}
        </span>
      </div>

      {showCalendar && (
        <div className="absolute z-50 mt-2 w-full min-w-[280px] rounded-xl border border-brand-blue-light/20 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (viewMonth === 0) {
                  setViewYear(viewYear - 1);
                  setViewMonth(11);
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              className="rounded-lg p-1 hover:bg-brand-blue-light/20 transition-colors"
            >
              <ArrowLeft className="size-5 text-brand-blue-deep" />
            </button>
            <span className="font-display font-bold text-brand-blue-deep">
              {months[viewMonth]} {viewYear}
            </span>
            <button
              onClick={() => {
                if (viewMonth === 11) {
                  setViewYear(viewYear + 1);
                  setViewMonth(0);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              className="rounded-lg p-1 hover:bg-brand-blue-light/20 transition-colors"
            >
              <ArrowRight className="size-5 text-brand-blue-deep" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-brand-blue-deep/60">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Confirm OCR Step ---------- */

function ConfirmIdStep({
  preview,
  loading,
  error,
  studentId,
  lastName,
  firstName,
  middleInitial,
  digitCorrected,
  email,
  onStudentId,
  onLastName,
  onFirstName,
  onMiddleInitial,
  onEmail,
  isManual,
  onBack,
  onContinue,
}: {
  preview: string | null;
  loading: boolean;
  error: string | null;
  studentId: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  digitCorrected?: boolean;
  email: string;
  onStudentId: (v: string) => void;
  onLastName: (v: string) => void;
  onFirstName: (v: string) => void;
  onMiddleInitial: (v: string) => void;
  onEmail: (v: string) => void;
  isManual?: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold text-brand-blue-deep">
          Confirm your ID details
        </h3>
        <p className="mt-1 font-body text-sm text-brand-blue-deep/70">
          We read your captured ID. Review the auto-filled fields and add your QCU email.
        </p>
      </div>

      {preview && (
        <div className="overflow-hidden rounded-2xl border-2 border-brand-blue-light bg-white">
          <img
            src={preview}
            alt="Captured QCU ID"
            className="mx-auto block aspect-[3/4] w-full max-w-[240px] object-cover"
          />
        </div>
      )}

      <div className="grid gap-4">
        <label className="block">
          <div className="mb-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70">
            Student Number{" "}
            {loading && (
              <span className="ml-1 normal-case text-brand-blue-deep/50">(reading…)</span>
            )}
          </div>
          <Input
            value={studentId}
            onChange={(e) => onStudentId(e.target.value)}
            placeholder={loading ? "Auto-filling…" : "e.g. 23-1234"}
            disabled={loading || !isManual}
            className="h-12 bg-white/85 text-base disabled:opacity-80"
          />
        </label>

        <div className="grid grid-cols-[1fr_1fr_0.6fr] gap-3">
          <label className="block">
            <div className="mb-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70 whitespace-nowrap">
              Last Name{" "}
              {loading && (
                <span className="ml-1 normal-case text-brand-blue-deep/50">(reading…)</span>
              )}
            </div>
            <Input
              value={lastName}
              onChange={(e) => onLastName(e.target.value)}
              placeholder={loading ? "Auto-filling…" : "Dela Cruz"}
              disabled={loading}
              className="h-12 bg-white/85 text-base"
            />
          </label>

          <label className="block">
            <div className="mb-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70 whitespace-nowrap">
              First Name{" "}
              {loading && (
                <span className="ml-1 normal-case text-brand-blue-deep/50">(reading…)</span>
              )}
            </div>
            <Input
              value={firstName}
              onChange={(e) => onFirstName(e.target.value)}
              placeholder={loading ? "Auto-filling…" : "Juan"}
              disabled={loading}
              className="h-12 bg-white/85 text-base"
            />
          </label>

          <label className="block">
            <div className="mb-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70 whitespace-nowrap">
              M.I.{" "}
              {loading && (
                <span className="ml-1 normal-case text-brand-blue-deep/50">(reading…)</span>
              )}
            </div>
            <Input
              value={middleInitial}
              onChange={(e) => onMiddleInitial(e.target.value)}
              placeholder={loading ? "…" : "S"}
              disabled={loading}
              maxLength={2}
              className="h-12 bg-white/85 text-base text-center min-w-[3.5rem]"
            />
          </label>
        </div>

        {digitCorrected && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-500/90 font-medium">
            Suspected numbers in name fields were automatically corrected. Please verify they are
            correct.
          </div>
        )}

        <label className="block">
          <div className="mb-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70">
            Personal Email (for notifications & password setup)
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="h-12 bg-white/85 text-base"
          />
          <p className="mt-1 text-[11px] text-brand-blue-deep/60">
            Account password setup link and notifications will be delivered to this address.
          </p>
        </label>
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue-light bg-white px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-brand-blue-deep"
        >
          <ArrowLeft className="size-4" /> Re-scan
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--gradient-cta)" }}
        >
          Continue <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Review ---------- */

function ReviewStep({ form, onEdit }: { form: FormState; onEdit: (key: keyof FormState) => void }) {
  // Group by chapter, in original order
  const chapters = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of QUESTIONS) {
      const arr = map.get(q.chapter) ?? [];
      arr.push(q);
      map.set(q.chapter, arr);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-blue-deep sm:text-3xl">
          One last look
        </h2>
        <p className="mt-1 text-sm text-brand-blue-deep/70">
          Tap any answer to edit. When you're ready, hit submit.
        </p>
      </div>

      {chapters.map(([chapter, qs]) => (
        <div key={chapter} className="rounded-2xl border border-white/60 bg-white/55 p-5">
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-deep/70">
            {chapter}
          </div>
          <div className="space-y-2">
            {qs.map((qq) => {
              const v = String(form[qq.key] ?? "");
              const display = v.length > 80 ? `${v.slice(0, 80).trimEnd()}…` : v;
              return (
                <button
                  key={qq.key}
                  type="button"
                  onClick={() => onEdit(qq.key)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-white/80 hover:bg-white/70"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-blue-deep/60">
                      {qq.prompt}
                    </div>
                    <div
                      className="mt-0.5 overflow-hidden text-sm text-brand-blue-deep"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-word",
                      }}
                      title={v || undefined}
                    >
                      {display || <span className="text-brand-blue-deep/40">—</span>}
                    </div>
                  </div>
                  <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-brand-orange">
                    Edit
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Success ---------- */

function SuccessCard({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="mt-10 rounded-3xl glass-strong p-8 text-center sm:p-12">
      <div
        className="mx-auto grid size-20 place-items-center rounded-full"
        style={{ background: "var(--gradient-cta)" }}
      >
        <CheckCircle2 className="size-10 text-white" />
      </div>
      <h2 className="mt-6 font-display text-3xl font-extrabold text-brand-blue-deep sm:text-4xl">
        Launch successful!
      </h2>
      <p className="mx-auto mt-3 max-w-md font-body text-brand-blue-deep/75">
        Your application is now orbiting Mission Control. Sit tight — our team will beam back a
        message through your QCU email soon.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg"
          style={{ background: "var(--gradient-cta)" }}
        >
          Back to home <ArrowRight className="size-4" />
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full glass-strong px-6 py-2.5 font-heading text-sm font-semibold text-brand-blue-deep"
        >
          Submit another application
        </button>
      </div>
    </div>
  );
}

/* ---------- Mission decoration ---------- */

function MissionPanel({
  eyebrow,
  title,
  subtitle,
  stats,
  progress,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  stats: { label: string; value: string }[];
  progress?: number;
}) {
  return (
    <div className="relative min-w-0 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85 drop-shadow">
        <Compass className="size-3.5 text-brand-orange" />
        <span>{eyebrow}</span>
      </div>

      <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.0] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
        {title}
      </h1>

      <p className="mt-5 max-w-md font-body text-base text-white/85 drop-shadow">{subtitle}</p>

      {/* Destination planet illustration */}
      <div className="relative mt-10 hidden h-64 lg:block">
        <DestinationPlanet />
      </div>

      {/* Stats strip */}
      <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl glass-strong p-3 sm:gap-3 sm:p-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-blue-deep/60 sm:text-[10px] sm:tracking-[0.18em]">
              {s.label}
            </div>
            <div className="mt-1 break-words font-display text-sm font-extrabold leading-tight text-brand-blue-deep sm:text-lg">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {typeof progress === "number" && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--gradient-cta)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DestinationPlanet() {
  return (
    <div aria-hidden className="relative size-full">
      {/* Orbit rings */}
      <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25 animate-orbit-slow">
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-brand-orange shadow-[0_0_18px_rgba(255,140,60,0.9)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 animate-orbit-rev">
        <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      </div>

      {/* Main planet */}
      <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 animate-planet-bob">
        <div
          className="size-full rounded-full shadow-[0_20px_60px_-10px_rgba(255,140,60,0.55)]"
          style={{
            background:
              "radial-gradient(circle at 30% 28%, oklch(0.85 0.12 70), oklch(0.62 0.18 35) 55%, oklch(0.32 0.12 28) 100%)",
          }}
        />
        {/* Ring */}
        <div
          className="absolute left-1/2 top-1/2 h-3 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full opacity-80"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.1 60 / 0.6), oklch(0.92 0.05 80 / 0.85), oklch(0.78 0.1 60 / 0.6), transparent)",
          }}
        />
        {/* Craters */}
        <span className="absolute left-[22%] top-[35%] size-3 rounded-full bg-black/20" />
        <span className="absolute left-[55%] top-[60%] size-2 rounded-full bg-black/20" />
        <span className="absolute left-[65%] top-[25%] size-1.5 rounded-full bg-black/15" />
      </div>
    </div>
  );
}

function PlanetsField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden sm:block"
    >
      {/* Blue moon, top-right */}
      <div
        className="absolute right-[6%] top-[14%] size-24 animate-planet-bob"
        style={{ animationDelay: "0s" }}
      >
        <div
          className="size-full rounded-full opacity-90 shadow-[0_0_40px_rgba(80,160,255,0.35)]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.82 0.1 240), oklch(0.5 0.15 250) 70%, oklch(0.25 0.08 250) 100%)",
          }}
        />
      </div>

      {/* Tiny ringed planet, mid-left */}
      <div
        className="absolute left-[4%] top-[55%] size-16 animate-planet-bob"
        style={{ animationDelay: "1.5s" }}
      >
        <div
          className="size-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, oklch(0.85 0.12 90), oklch(0.6 0.16 60) 60%, oklch(0.3 0.1 40) 100%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-1.5 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[-22deg] rounded-full opacity-70"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,200,140,0.85), transparent)",
          }}
        />
      </div>

      {/* Small purple planet bottom-right */}
      <div
        className="absolute bottom-[12%] right-[16%] size-12 animate-planet-bob"
        style={{ animationDelay: "2.5s" }}
      >
        <div
          className="size-full rounded-full opacity-90"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.78 0.14 320), oklch(0.45 0.18 300) 65%, oklch(0.22 0.1 290) 100%)",
          }}
        />
      </div>

      {/* Dot planet top-left */}
      <div
        className="absolute left-[18%] top-[8%] size-8 animate-planet-bob"
        style={{ animationDelay: "3.2s" }}
      >
        <div
          className="size-full rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.85 0.08 160), oklch(0.5 0.14 170) 70%)",
          }}
        />
      </div>

      {/* Faint orbit arc, right side */}
      <svg
        className="absolute -right-32 top-1/3 size-[36rem] opacity-20"
        viewBox="0 0 400 400"
        fill="none"
      >
        <ellipse
          cx="200"
          cy="200"
          rx="180"
          ry="120"
          stroke="white"
          strokeDasharray="4 8"
          strokeWidth="1"
          transform="rotate(-18 200 200)"
        />
      </svg>
    </div>
  );
}
