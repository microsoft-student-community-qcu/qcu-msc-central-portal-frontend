import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Upload,
  Compass,
  Orbit,
  Sparkles,
  RefreshCw,
  Loader2,
  Mail,
} from "lucide-react";
import logoUrl from "@/assets/qcu-msc-logo.png";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { ApplicationClosed } from "@/components/ApplicationClosed";
import { APPLICATIONS_OPEN } from "@/lib/application-window";
import { CosmicLoader } from "@/components/CosmicLoader";
import { DataPrivacyConsent } from "@/components/DataPrivacyConsent";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clearAccountRedirect, hasActiveAccountRedirect, startAccountRedirect } from "@/lib/application-flow";
import { isResumeTokenConsumed, markResumeTokenConsumed } from "@/lib/resume-token";
import {
  clearApplyProgress,
  isFileStillReadable,
  loadApplyProgress,
  saveApplyProgress,
  type SavedDocs,
} from "@/lib/apply-progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdSubmission } from "@/components/IdUploadScanner";
import { getApiEndpoint } from "@/lib/api-config";
import {
  apiFetch,
  extractErrorMessage,
  messageFrom,
  UPLOAD_TIMEOUT_MS,
} from "@/lib/api-client";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { OFFICES } from "@/constants/offices";
import { toast } from "sonner";

// IdUploadScanner pulls in tesseract.js (~2MB). Lazy-load so the intro
// stage of /apply stays light; the chunk fetches when the user reaches scan.
const IdUploadScanner = lazyWithRetry(() =>
  import("@/components/IdUploadScanner").then((m) => ({
    default: m.IdUploadScanner,
  })),
);

function sanitizeOcrMessage(message: string | undefined | null): string {
  if (!message) return "Could not read Student ID. Please re-scan your ID card.";
  const normalized = message.toLowerCase();
  // Backend copy for an expired OCR session varies ("OCR session expired",
  // "Session expired, please re-verify"); match the stable part.
  if (normalized.includes("session expired") || normalized.includes("re-verify")) {
    return "Your ID verification session expired. Please re-scan your student ID to verify it again.";
  }
  // Never surface raw endpoint/stack details to applicants.
  if (/\/api\/v\d/i.test(message) || /https?:\/\//i.test(message)) {
    return "We couldn't verify your ID right now. Please re-scan your student ID and try again.";
  }
  return message;
}


export const Route = createFileRoute("/apply/")({
  // The resume email may arrive as ?resumeToken=... or ?token=...; accept both.
  validateSearch: (search: Record<string, unknown>): { resumeToken?: string } => ({
    resumeToken:
      (search.resumeToken as string | undefined) ?? (search.token as string | undefined),
  }),
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
  component: APPLICATIONS_OPEN ? ApplyPage : ApplicationClosed,
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
  if (Number.isNaN(date.getTime())) return "Please enter a valid date of birth.";
  if (date > maxDate) {
    return "You must be born on or before December 31, 2008 to apply.";
  }
  const minDate = new Date("1950-01-01");
  if (date < minDate) return "Please enter a valid date of birth.";
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
    options: OFFICES.map((o) => o.label),
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
  const [stage, setStage] = useState<"consent" | "scan" | "confirm" | "form">("consent");
  const [provisionalIdFile, setProvisionalIdFile] = useState<File | null>(null);
  const [provisionalIdPreview, setProvisionalIdPreview] = useState<string | null>(null);
  const [ocrSessionId, setOcrSessionId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(false);
  const [manualRequired, setManualRequired] = useState(false);
  const [alreadySubmittedToken, setAlreadySubmittedToken] = useState<string | null>(null);
  const [draftResumePending, setDraftResumePending] = useState(false);
  const [rehydratingDraft, setRehydratingDraft] = useState(false);
  const [resumeError, setResumeError] = useState<{
    kind: "expired" | "timeout" | "generic";
    message: string;
  } | null>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [scanAttemptsRemaining, setScanAttemptsRemaining] = useState<number | null>(null);
  const [confirmStudentId, setConfirmStudentId] = useState("");
  const [confirmLastName, setConfirmLastName] = useState("");
  const [confirmFirstName, setConfirmFirstName] = useState("");
  const [confirmMiddleInitial, setConfirmMiddleInitial] = useState("");
  const [digitCorrectedInName, setDigitCorrectedInName] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [idx, setIdx] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<Record<string, File>>({});
  // How many batches the backend has already stored (0 = only Batch 0), plus the
  // document names it holds. Without this the form treats server-side documents
  // as missing whenever the in-memory File objects are gone.
  const [savedStep, setSavedStep] = useState(0);
  const [savedDocs, setSavedDocs] = useState<SavedDocs>({});
  const [staleFileNotice, setStaleFileNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  // Holds "<draftId|new>:<step>" while a step advance is in flight.
  const stepLockRef = useRef<string | null>(null);
  const consumedResumeTokenRef = useRef<string | null>(null);

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

  const search = Route.useSearch();

  useEffect(() => {
    const token = search.resumeToken;
    if (!token) return;
    // The resume token is single-use on the backend: a second POST with the same
    // token fails. The ref guards re-entry within this mount (HMR / effect re-run);
    // sessionStorage guards replay across full page loads (refresh, back button,
    // an email client re-opening the tab) — that replay is what used to bounce the
    // applicant back to the start of the application.
    if (consumedResumeTokenRef.current === token) return;
    consumedResumeTokenRef.current = token;
    if (isResumeTokenConsumed(token)) {
      // Already redeemed earlier in this tab: just strip the token and stay put.
      void navigate({ to: "/apply", search: {}, replace: true });
      return;
    }
    markResumeTokenConsumed(token);


    const resumeDraft = async () => {
      setRehydratingDraft(true);

      // Never let a hanging network call leave the applicant on an endless loader.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25_000);

      try {
        const res = await fetch(getApiEndpoint("/api/v1/applicants/draft/resume"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        const json = await res.json();

        if (!res.ok || !json.success || !json.data) {
          const failure = new Error(json.message || "Invalid or expired draft resume link.");
          // 400 = token invalid/expired/wrong draft, 404 = draft gone (per apidocs).
          (failure as any).kind = res.status === 400 || res.status === 404 ? "expired" : "generic";
          throw failure;
        }


        // The API wraps the record: { success, data: { draft: {...} } }.
        // Older/alternate shapes returned the draft directly under data.
        const draftData = json.data.draft ?? json.data;

        const GENDER_LABELS: Record<string, string> = {
          MALE: "Male",
          FEMALE: "Female",
          LGBTQIA: "LGBTQIA+",
          PREFER_NOT_TO_SAY: "Prefer not to say",
        };
        const CAMPUS_LABELS: Record<string, string> = {
          SAN_BARTOLOME_MAIN: "San Bartolome (Main)",
          SAN_FRANCISCO: "San Francisco",
          BATASAN: "Batasan",
        };
        const officeLabel = OFFICES.find((o) => o.value === draftData.office)?.label;
        const dob =
          typeof draftData.dateOfBirth === "string" ? draftData.dateOfBirth.slice(0, 10) : "";

        const cleanMI = (draftData.middleInitial || "").trim().replace(/\.+$/, "");
        const rehydratedName = `${draftData.lastName || ""}, ${draftData.firstName || ""}${
          cleanMI ? " " + cleanMI + "." : ""
        }`
          .trim()
          .replace(/\s+/g, " ");

        if (draftData.id) setDraftId(draftData.id);
        if (draftData.studentId) setConfirmStudentId(draftData.studentId);
        if (draftData.lastName) setConfirmLastName(draftData.lastName);
        if (draftData.firstName) setConfirmFirstName(draftData.firstName);
        if (draftData.middleInitial) setConfirmMiddleInitial(draftData.middleInitial);
        if (draftData.email) setConfirmEmail(draftData.email);

        setForm((f) => ({
          ...f,
          studentId: draftData.studentId || f.studentId,
          fullName: rehydratedName || f.fullName,
          email: draftData.email || f.email,
          college: draftData.college || f.college,
          program: draftData.program || f.program,
          section: draftData.section || f.section,
          campus: CAMPUS_LABELS[draftData.campus] || draftData.campus || f.campus,
          role: officeLabel || draftData.office || f.role,
          dateOfBirth: dob || f.dateOfBirth,
          placeOfBirth: draftData.placeOfBirth || f.placeOfBirth,
          gender: GENDER_LABELS[draftData.gender] || draftData.gender || f.gender,
          houseAddress: draftData.houseAddress || f.houseAddress,
          cellphone: draftData.cellphoneNumber || f.cellphone,
          facebookLink: draftData.facebookLink || f.facebookLink,
          interests: draftData.interestsSkillsHobbies || f.interests,
          pastOrganizations: draftData.organizationHistory || f.pastOrganizations,
          portfolio: draftData.portfolio || f.portfolio,
          githubOrProjects: draftData.githubOrProjectLinks || f.githubOrProjects,
          previousWorks: draftData.previousWorksAchievements || f.previousWorks,
        }));

        if (draftData.ocrSessionId) setOcrSessionId(draftData.ocrSessionId);

        setStage("form");
        // Backend currentStep counts *saved* batches (0 = only Batch 0 done), so the
        // next form step is currentStep + 1. Landing on the already-saved step would
        // make the batch PATCH fail with "draft is at wrong step".
        const rawStep = Number(draftData.currentStep);
        if (!Number.isFinite(rawStep)) {
          // Absent/non-numeric currentStep would silently restart a partially
          // completed applicant at Step 1 — surface it instead of hiding it.
          console.warn("[resume] draft has no usable currentStep", draftData.currentStep);
        }
        const savedStep = Number.isFinite(rawStep) ? rawStep : 0;
        setSavedStep(savedStep);
        // The draft carries the stored document paths (apidocs § 6.5) — surface
        // them so a resumed applicant is not told their files are missing.
        setSavedDocs({
          cor: draftData.certificateOfRegistration
            ? String(draftData.certificateOfRegistration).split("/").pop()
            : undefined,
          cv: draftData.curriculumVitae
            ? String(draftData.curriculumVitae).split("/").pop()
            : undefined,
        });
        const nextStep = Math.min(Math.max(savedStep + 1, 1), 3) as 1 | 2 | 3;
        setFormStep(nextStep);
        setResumeError(null);
        toast.success("Welcome back! Your application draft has been resumed.");

        // Must clear `search` — omitting it preserves ?resumeToken=, leaving a spent
        // single-use token in the URL that a later reload would replay and fail on.
        void navigate({ to: "/apply", search: {}, replace: true });
      } catch (err: any) {
        const expired = err?.kind === "expired";
        const timedOut = err?.name === "AbortError";
        setResumeError({
          kind: timedOut ? "timeout" : expired ? "expired" : "generic",
          message: timedOut
            ? "Resuming your draft timed out. Please open the link again."
            : err?.message || "We couldn't resume your application draft.",
        });
        void navigate({ to: "/apply", search: {}, replace: true });

      } finally {
        clearTimeout(timeoutId);
        setRehydratingDraft(false);
      }
    };

    void resumeDraft();
  }, [search.resumeToken, navigate]);

  const handleScanComplete = async (payload: IdSubmission) => {
    setProvisionalIdFile(payload.fullIdImageFile);
    if (provisionalIdPreview) URL.revokeObjectURL(provisionalIdPreview);
    setProvisionalIdPreview(URL.createObjectURL(payload.fullIdImageFile));
    setOcrError(null);
    setScanAttemptsRemaining(null);
    setOcrLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", payload.fullIdImageFile);

      const res = await apiFetch(
        "/ocr/verify",
        { method: "POST", body: fd },
        { timeoutMs: UPLOAD_TIMEOUT_MS },
      );
      const json = await res.json();

      if (res.ok && json.success) {
        if (json.data?.resumePending) {
          setDraftResumePending(true);
          setOcrError(null);
          return;
        }
        if (json.data?.alreadySubmitted && json.data?.setupToken) {
          setAlreadySubmittedToken(json.data.setupToken);
          setOcrError(null);
          return;
        }

        setStage("confirm");
        setOcrSessionId(json.data.ocrSessionId);
        setManualRequired(false);

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
        const sessionId: string | null = json.data?.ocrSessionId || null;
        setOcrError(sanitizeOcrMessage(json.message));

        // No session means the backend created nothing (retries remain).
        // Never show the confirm/manual form without an ocrSessionId.
        if (!sessionId) {
          const remaining = json.data?.attemptsRemaining;
          setScanAttemptsRemaining(typeof remaining === "number" ? remaining : null);
          setStage("scan");
          setOcrSessionId(null);
          setManualRequired(false);
          return;
        }

        setStage("confirm");
        setScanAttemptsRemaining(null);
        setOcrSessionId(sessionId);
        setManualRequired(!!json.data?.manualRequired);
        setConfirmStudentId(json.data?.studentId || "");
        setConfirmLastName(json.data?.lastName || "");
        setConfirmFirstName(json.data?.firstName || "");
        setConfirmMiddleInitial(json.data?.middleInitial || "");
        setDigitCorrectedInName(false);
      }
    } catch (err) {
      // Network/parse failure: no session was established, stay on the scan step.
      setStage("scan");
      setOcrSessionId(null);
      setManualRequired(false);
      setScanAttemptsRemaining(null);
      setOcrError(
        sanitizeOcrMessage(
          err instanceof Error ? err.message : "We couldn't process your ID image. Please re-scan your ID card.",
        ),
      );
    } finally {
      setOcrLoading(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmAndStart = async () => {
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

    setSubmittingDraft(true);
    try {
      if (ocrSessionId) {
        const payload: Record<string, any> = {
          lastName: confirmLastName.trim(),
          firstName: confirmFirstName.trim(),
          email: confirmEmail.trim(),
          ocrSessionId,
        };
        if (cleanMI) {
          payload.middleInitial = cleanMI;
        }

        const res = await apiFetch("/api/v1/applicants/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(extractErrorMessage(json, "Failed to create application draft."));
        }

        if (json.data?.draftId) {
          setDraftId(json.data.draftId);
        }
      }

      setForm((f) => ({
        ...f,
        studentId: confirmStudentId.trim(),
        fullName: formattedName,
        email: confirmEmail.trim(),
      }));
      setStage("form");
      setFormStep(1);
      setStepErrors({});
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setOcrError(messageFrom(err, "Failed to save application draft."));
    } finally {
      setSubmittingDraft(false);
    }
  };

  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const progressRestoredRef = useRef(false);

  // Restore a long-running session after a reload / tab eviction. Files are not
  // restorable, but everything else is — so the applicant lands back where they
  // were instead of at the start of the flow.
  useEffect(() => {
    if (progressRestoredRef.current) return;
    progressRestoredRef.current = true;
    if (search.resumeToken) return;
    const saved = loadApplyProgress();
    if (!saved) return;
    setDraftId(saved.draftId);
    setOcrSessionId(saved.ocrSessionId);
    setSavedStep(saved.savedStep);
    setSavedDocs(saved.savedDocs ?? {});
    setForm((f) => ({ ...f, ...(saved.form as Partial<FormState>) }));
    setConfirmStudentId(saved.confirm.studentId);
    setConfirmLastName(saved.confirm.lastName);
    setConfirmFirstName(saved.confirm.firstName);
    setConfirmMiddleInitial(saved.confirm.middleInitial);
    setConfirmEmail(saved.confirm.email);
    setFormStep(saved.formStep);
    setStage("form");
  }, [search.resumeToken]);

  // Persist progress continuously so nothing depends on the tab staying alive.
  useEffect(() => {
    if (stage !== "form" || !draftId || submitted) return;
    saveApplyProgress({
      draftId,
      ocrSessionId,
      savedStep,
      savedDocs,
      formStep,
      form: form as unknown as Record<string, string>,
      confirm: {
        studentId: confirmStudentId,
        lastName: confirmLastName,
        firstName: confirmFirstName,
        middleInitial: confirmMiddleInitial,
        email: confirmEmail,
      },
    });
  }, [
    stage,
    draftId,
    ocrSessionId,
    savedStep,
    savedDocs,
    formStep,
    form,
    submitted,
    confirmStudentId,
    confirmLastName,
    confirmFirstName,
    confirmMiddleInitial,
    confirmEmail,
  ]);

  const dropStaleFile = (key: "certificateOfRegistration" | "curriculumVitae") => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setForm((f) => ({ ...f, [key]: "" }) as FormState);
    setStaleFileNotice(
      `Your selected ${
        key === "curriculumVitae" ? "Curriculum Vitae" : "Certificate of Registration"
      } is no longer available on this device — please choose the file again. All your other answers are safe.`,
    );
  };

  // A picked File is an OS-managed handle that can silently die during a long
  // session (phone locks, file moved/synced, OS reclaims the temp copy). Probe
  // it while Step 2 is open so the applicant is told early, not at upload time.
  useEffect(() => {
    if (stage !== "form" || formStep !== 2) return;
    let cancelled = false;
    const probe = async () => {
      for (const key of ["certificateOfRegistration", "curriculumVitae"] as const) {
        const file = files[key];
        if (!file) continue;
        const ok = await isFileStillReadable(file);
        if (!ok && !cancelled) dropStaleFile(key);
      }
    };
    const id = window.setInterval(() => void probe(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stage, formStep, files]);

  const progress = useMemo(() => {
    if (submitted) return 100;
    if (stage !== "form") return 0;
    return Math.round((formStep / 3) * 100);
  }, [stage, formStep, submitted]);

  const update = (key: keyof FormState, value: string, file?: File) => {
    if (key === "college") {
      setForm((f) => ({ ...f, [key]: value, program: "" }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
    if (file) setFiles((prev) => ({ ...prev, [key]: file }));
    setError(null);
    if (file) setStaleFileNotice(null);
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.dateOfBirth) errs.dateOfBirth = "Please select your date of birth.";
    if (!form.placeOfBirth.trim()) errs.placeOfBirth = "Place of birth is required.";
    if (!form.gender) errs.gender = "Please select your gender identification.";
    const cellErr = validCellphone(form.cellphone);
    if (cellErr) errs.cellphone = cellErr;
    if (!form.houseAddress.trim()) errs.houseAddress = "House address is required.";
    const fbErr = validFacebookUrl(form.facebookLink);
    if (fbErr) errs.facebookLink = fbErr;
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.college) errs.college = "Please select your college.";
    if (!form.program) errs.program = "Please select your program.";
    if (!form.section.trim()) errs.section = "Section is required (e.g. 3A).";
    if (!form.campus) errs.campus = "Please select your campus.";
    if (!form.role) errs.role = "Please select your preferred office.";

    if (!files.certificateOfRegistration && !savedDocs.cor)
      errs.certificateOfRegistration = "Certificate of Registration (COR) is required.";
    if (!files.curriculumVitae && !savedDocs.cv)
      errs.curriculumVitae = "Curriculum Vitae (CV) is required.";
    return errs;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!form.interests.trim()) errs.interests = "Please share your interests and skills.";
    if (!form.pastOrganizations.trim()) errs.pastOrganizations = "Please specify past organizations (or N/A).";
    if (form.portfolio.trim()) {
      const pErr = validUrl(form.portfolio);
      if (pErr) errs.portfolio = pErr;
    }
    if (form.githubOrProjects.trim()) {
      const gErr = validGitHubOrDriveUrl(form.githubOrProjects);
      if (gErr) errs.githubOrProjects = gErr;
    }
    return errs;
  };

  const goToStep = (targetStep: 1 | 2 | 3) => {
    if (targetStep === formStep) return;
    if (targetStep < formStep) {
      setStepErrors({});
      setError(null);
      setFormStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (formStep === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        setError("Please complete all required fields in Step 1 before advancing.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    } else if (formStep === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        setError("Please complete all required fields in Step 2 before advancing.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setStepErrors({});
    setError(null);
    setFormStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runNextStep = async () => {
    if (formStep === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        setError("Please complete all required fields in Step 1.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setStepErrors({});
      setError(null);

      // `batch-2` requires the draft to still be at step 1 (apidocs/applicants.md
      // § 6.3). Re-sending it after the documents were stored returns
      // "draft is at wrong step" — the dead end applicants got stuck in. If the
      // server already has this batch and no new file was picked, just advance.
      if (draftId && savedStep >= 2) {
        // The API exposes no re-upload once the batch is stored; the saved copies
        // stand, and we say so rather than failing the applicant.
        if (files.certificateOfRegistration || files.curriculumVitae) {
          toast.info("Your documents were already saved earlier — we kept those copies.");
        }
        setFormStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (draftId) {
        setSubmittingStep(true);
        try {
          let backendGender = "PREFER_NOT_TO_SAY";
          const g = form.gender.toUpperCase();
          if (g.includes("MALE") && !g.includes("FEMALE")) backendGender = "MALE";
          else if (g.includes("FEMALE")) backendGender = "FEMALE";
          else if (g.includes("LGBTQ")) backendGender = "LGBTQIA";

          const payload = {
            dateOfBirth: form.dateOfBirth,
            placeOfBirth: form.placeOfBirth,
            gender: backendGender,
            cellphoneNumber: form.cellphone,
            houseAddress: form.houseAddress,
            facebookLink: form.facebookLink,
          };

          const res = await apiFetch(`/api/v1/applicants/draft/${draftId}/batch-1`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(extractErrorMessage(json, "Failed to save personal information."));
          }
          setSavedStep((s) => Math.max(s, 1));
        } catch (err: unknown) {
          setError(messageFrom(err, "Failed to save Step 1 details."));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        } finally {
          setSubmittingStep(false);
        }
      }

      setFormStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (formStep === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        setError("Please complete all required academic, document, and background fields in Step 2.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setStepErrors({});
      setError(null);

      if (draftId) {
        setSubmittingStep(true);
        try {
          let backendCampus = "SAN_BARTOLOME_MAIN";
          if (form.campus.toUpperCase().includes("SAN FRANCISCO")) backendCampus = "SAN_FRANCISCO";
          if (form.campus.toUpperCase().includes("BATASAN")) backendCampus = "BATASAN";

          const targetOffice =
            OFFICES.find((o) => o.value === form.role || o.label === form.role)?.value ??
            "SECRETARIAT_OFFICE";

          const fd = new FormData();
          fd.append("college", form.college);
          fd.append("program", form.program);
          fd.append("section", form.section);
          fd.append("campus", backendCampus);
          fd.append("office", targetOffice);

          if (!files.certificateOfRegistration) {
            throw new Error("Please select your Certificate of Registration file.");
          }
          if (!files.curriculumVitae) {
            throw new Error("Please select your Curriculum Vitae file.");
          }

          // Confirm both handles are still readable before uploading, so a stale
          // file surfaces as a clear "choose it again" prompt instead of an
          // opaque network failure.
          for (const key of ["certificateOfRegistration", "curriculumVitae"] as const) {
            if (!(await isFileStillReadable(files[key]!))) {
              dropStaleFile(key);
              throw new Error(
                "One of your attached files is no longer available on this device. Please choose it again — the rest of your answers are saved.",
              );
            }
          }

          fd.append("certificateOfRegistration", files.certificateOfRegistration);
          fd.append("curriculumVitae", files.curriculumVitae);

          const res = await apiFetch(
            `/api/v1/applicants/draft/${draftId}/batch-2`,
            { method: "PATCH", body: fd },
            { timeoutMs: UPLOAD_TIMEOUT_MS },
          );
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(
              extractErrorMessage(json, "Failed to save academic details and files."),
            );
          }

          // Remember that the backend now holds these documents.
          setSavedStep((s) => Math.max(s, 2));
          setSavedDocs({
            cor: files.certificateOfRegistration.name,
            cv: files.curriculumVitae.name,
          });
          setStaleFileNotice(null);
        } catch (err: unknown) {
          setError(messageFrom(err, "Failed to save Step 2 details."));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        } finally {
          setSubmittingStep(false);
        }
      }

      setFormStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (formStep === 3) {
      const errs = validateStep3();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        setError("Please fix the invalid links before submitting.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setStepErrors({});
      setError(null);
      void submit();
    }
  };

  /**
   * Synchronous double-submit guard. The ref flips before any await, so a
   * second click (or a duplicate tab advancing the same draft step) is
   * dropped even before React re-renders the disabled button state.
   */
  const goNextStep = async () => {
    if (submitLockRef.current || submittingStep || isSubmitting) return;
    const lockKey = `${draftId ?? "new"}:${formStep}`;
    if (stepLockRef.current) return;
    stepLockRef.current = lockKey;
    try {
      await runNextStep();
    } finally {
      if (stepLockRef.current === lockKey) stepLockRef.current = null;
    }
  };

  const goBackStep = () => {
    if (stepLockRef.current) return;
    if (submitLockRef.current) return;
    setStepErrors({});
    setError(null);
    if (formStep > 1) {
      setFormStep((s) => (s - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submit = async () => {
    if (submitLockRef.current || submittingStep || isSubmitting) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setSubmittingStep(true);

    try {
      if (draftId) {
        const payload: Record<string, any> = {
          interestsSkillsHobbies: form.interests || "N/A",
          organizationHistory: form.pastOrganizations || "N/A",
        };
        if (form.portfolio) payload.portfolio = form.portfolio;
        if (form.githubOrProjects) payload.githubOrProjectLinks = form.githubOrProjects;
        if (form.previousWorks) payload.previousWorksAchievements = form.previousWorks;

        const res = await apiFetch(`/api/v1/applicants/draft/${draftId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(extractErrorMessage(json, "Submission failed."));
        }

        try {
          let cleanMI = confirmMiddleInitial.trim().replace(/\.+$/, "");
          if (cleanMI) cleanMI = cleanMI + ".";
          sessionStorage.setItem(
            "qcumsc.applicant",
            JSON.stringify({
              applicantId: json.data?.id,
              email: form.email,
              studentId: form.studentId,
              fullName: form.fullName,
              firstName: confirmFirstName.trim(),
              lastName: confirmLastName.trim(),
              middleInitial: cleanMI,
              // No setupToken here on purpose: the draft-submit endpoint only
              // emails the password-setup link (apidocs/applicants.md § 6.4).
            }),
          );
        } catch {
          /* ignore */
        }

        // Mark the hand-off BEFORE navigating so a re-mount of /apply cannot
        // flash the data-privacy consent screen during the redirect.
        startAccountRedirect();
        clearApplyProgress();
        setRedirectingToAccount(true);

        await navigate({ to: "/apply/account", search: {}, replace: true });
        return;

      }

      // Fallback single endpoint if draftId is not available
      const fd = new FormData();

      let cleanMI = confirmMiddleInitial.trim().replace(/\.+$/, "");
      if (cleanMI) cleanMI = cleanMI + ".";

      fd.append("firstName", confirmFirstName.trim());
      fd.append("lastName", confirmLastName.trim());
      if (cleanMI) fd.append("middleInitial", cleanMI);
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

      const targetOffice =
        OFFICES.find((o) => o.value === form.role || o.label === form.role)?.value ??
        "SECRETARIAT_OFFICE";
      fd.append("office", targetOffice);
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
        throw new Error("Please re-select your Certificate of Registration file.");
      if (!files.curriculumVitae)
        throw new Error("Please re-select your Curriculum Vitae file.");
      fd.append("certificateOfRegistration", files.certificateOfRegistration);
      fd.append("curriculumVitae", files.curriculumVitae);

      const res = await apiFetch(
        "/applicants",
        { method: "POST", body: fd },
        { timeoutMs: UPLOAD_TIMEOUT_MS },
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(extractErrorMessage(json, "Submission failed."));
      }

      try {
        let cleanMI = confirmMiddleInitial.trim().replace(/\.+$/, "");
        if (cleanMI) cleanMI = cleanMI + ".";
        sessionStorage.setItem(
          "qcumsc.applicant",
          JSON.stringify({
            applicantId: json.data?.id,
            email: form.email,
            studentId: form.studentId,
            fullName: form.fullName,
            firstName: confirmFirstName.trim(),
            lastName: confirmLastName.trim(),
            middleInitial: cleanMI,
            setupToken: json.data?.setupToken,
          }),
        );
      } catch {
        /* ignore */
      }

      // Mark the hand-off BEFORE navigating. If this page re-mounts while the
      // account route is loading, its fresh state would otherwise default to
      // stage "consent" and flash the privacy screen for a frame.
      startAccountRedirect();
      clearApplyProgress();
      setRedirectingToAccount(true);

      await navigate({
        to: "/apply/account",
        search: json.data?.setupToken ? { token: json.data.setupToken } : {},
        replace: true,
      });
    } catch (err: any) {
      clearAccountRedirect();
      setRedirectingToAccount(false);
      setError(err.message || "An error occurred during submission.");
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmittingStep(false);
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setForm(INITIAL);
    setError(null);
    setStepErrors({});
    setFormStep(1);
    setSubmitted(false);
    setFiles({});
    setSavedStep(0);
    setSavedDocs({});
    setStaleFileNotice(null);
    clearApplyProgress();
    submitLockRef.current = false;
    stepLockRef.current = null;
    setIsSubmitting(false);
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

  if (!clientReady) return <ApplyBootScreen />;
  if (redirectingToAccount) return <AccountRedirectScreen />;
  if (rehydratingDraft) return <CosmicLoader label="Resuming your application draft" />;
  if (ocrLoading) return <CosmicLoader label="Reading your ID" />;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-space)" }}>
      <SkyBackdrop variant="space" />
      <PlanetsField />
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
        <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-brand-blue-deep shadow-md hover:bg-white sm:px-4 sm:text-sm">
          <ArrowLeft className="size-4" /> Back to Space
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        {alreadySubmittedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-brand-orange/30 p-6 sm:p-8 shadow-2xl space-y-6 text-center text-white">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-xl font-bold">
                  Application Already Submitted
                </h3>
                <p className="font-body text-sm text-slate-300 leading-relaxed">
                  An active application for this Student ID has already been submitted. Please check your personal or QCU email address for account setup instructions and status updates.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAlreadySubmittedToken(null)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  <RefreshCw className="size-4" /> Scan a Different ID
                </button>
              </div>
            </div>
          </div>
        )}

        {resumeError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-brand-orange/30 p-6 sm:p-8 shadow-2xl space-y-6 text-center text-white">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Mail className="size-8" />
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-xl font-bold">
                  {resumeError.kind === "timeout"
                    ? "Resuming took too long"
                    : resumeError.kind === "expired"
                      ? "This resume link has expired"
                      : "We couldn't resume your draft"}
                </h3>
                <p className="font-body text-sm text-slate-300 leading-relaxed">
                  {resumeError.kind === "expired"
                    ? "Resume links are single-use and valid for 30 minutes. Your saved progress is safe — scan your Student ID again and we'll email you a fresh link."
                    : resumeError.message}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-400 border border-white/10">
                💡 Always open the most recent resume email. Nothing you've filled in has been lost.
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResumeError(null);
                    setStage("scan");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  <RefreshCw className="size-4" /> Scan your ID to continue
                </button>
              </div>
            </div>
          </div>
        )}

        {draftResumePending && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-brand-orange/30 p-6 sm:p-8 shadow-2xl space-y-6 text-center text-white">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Mail className="size-8 animate-bounce" />
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-xl font-bold">
                  Unfinished Draft Found!
                </h3>
                <p className="font-body text-sm text-slate-300 leading-relaxed">
                  An active application draft for this Student ID is pending completion. We've sent a secure link to your registered email address to resume your application.
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-400 border border-white/10">
                💡 Check your inbox (and spam folder) and open the <strong>most recent</strong> resume email — older links stop working. A new link can only be sent once every 30 minutes.
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDraftResumePending(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  <RefreshCw className="size-4" /> Scan a Different ID
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "consent" ? (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MissionPanel eyebrow="Privacy clearance" title={<>Consent to<br /><span className="text-brand-orange">data processing</span></>} subtitle="Before we scan your ID, review how QCU MSC collects and protects your personal information under RA 10173, the Data Privacy Act of 2012." stats={[{ label: "Step", value: "00" }, { label: "Phase", value: "Consent" }, { label: "Law", value: "RA 10173" }]} />
            <div className="lg:pt-6">
              <div className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
                <DataPrivacyConsent onAccept={() => setStage("scan")} />
              </div>
            </div>
          </div>
        ) : stage === "scan" ? (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MissionPanel eyebrow="Pre-flight check" title={<>Verify your<br /><span className="text-brand-orange">student orbit</span></>} subtitle="Scan your QCU Student ID using the guided frame. Everything stays on your device — we just need to confirm you're a real cadet." stats={[{ label: "Step", value: "01" }, { label: "Phase", value: "ID Scan" }, { label: "Range", value: "On-device" }]} />
            <div className="lg:pt-6">
              <div className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
                <Suspense fallback={<div className="grid h-72 place-items-center text-sm text-white/70">Preparing on-device scanner…</div>}>
                  <IdUploadScanner
                    onSubmit={handleScanComplete}
                    busy={ocrLoading}
                    error={
                      ocrError
                        ? `${ocrError}${
                            scanAttemptsRemaining !== null
                              ? ` You have ${scanAttemptsRemaining} attempt${scanAttemptsRemaining === 1 ? "" : "s"} left.`
                              : ""
                          }`
                        : null
                    }
                  />
                </Suspense>
              </div>
            </div>
          </div>
        ) : stage === "confirm" ? (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <MissionPanel eyebrow="Confirm identity" title={<>Double-check your<br /><span className="text-brand-orange">ID details</span></>} subtitle="Our OCR engine reads your captured ID and pre-fills these fields. Adjust anything that looks off, then add your QCU email." stats={[{ label: "Step", value: "02" }, { label: "Phase", value: "Verify" }, { label: "OCR", value: ocrLoading ? "Reading…" : "Ready" }]} />
            <div className="lg:pt-6">
              <div className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
                <ConfirmIdStep preview={provisionalIdPreview} loading={ocrLoading || submittingDraft} error={ocrError} studentId={confirmStudentId} lastName={confirmLastName} firstName={confirmFirstName} middleInitial={confirmMiddleInitial} digitCorrected={digitCorrectedInName} email={confirmEmail} onStudentId={setConfirmStudentId} onLastName={setConfirmLastName} onFirstName={setConfirmFirstName} onMiddleInitial={setConfirmMiddleInitial} onEmail={setConfirmEmail} isManual={manualRequired} onBack={() => { setOcrError(null); setStage("scan"); }} onContinue={confirmAndStart} />
              </div>
            </div>
          </div>
        ) : submitted ? (
          <SuccessCard onReset={reset} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
            <MissionPanel
              eyebrow={
                formStep === 1
                  ? "Step 1 of 3 · Personal & Academic"
                  : formStep === 2
                  ? "Step 2 of 3 · Documents & Experience"
                  : "Step 3 of 3 · Portfolio & Achievements"
              }
              title={
                formStep === 1 ? (
                  <>
                    Personal &amp;<br />
                    <span className="text-brand-orange">Academic Profile</span>
                  </>
                ) : formStep === 2 ? (
                  <>
                    Documents &amp;<br />
                    <span className="text-brand-orange">Background</span>
                  </>
                ) : (
                  <>
                    Showcase &amp;<br />
                    <span className="text-brand-orange">Optional Links</span>
                  </>
                )
              }
              subtitle={
                formStep === 1
                  ? "Provide your contact information, address, academic details, and preferred department role."
                  : formStep === 2
                  ? "Upload your current Certificate of Registration and CV, and share your skills and background."
                  : "Include your portfolio or GitHub links if you have any. This step is completely optional."
              }
              stats={[
                { label: "Step", value: `0${formStep}/03` },
                { label: "Progress", value: `${progress}%` },
                {
                  label: "Phase",
                  value: formStep === 1 ? "Profile" : formStep === 2 ? "Documents" : "Showcase",
                },
              ]}
              progress={progress}
            />

            <div className="lg:pt-4">
              <div className="rounded-[2rem] glass-strong p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Section Navigation Header Tabs */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-brand-blue-deep/10 pb-4">
                  {[
                    { step: 1, label: "1. Personal & Contact" },
                    { step: 2, label: "2. Academics" },
                    { step: 3, label: "3. Experience & Showcase" },
                  ].map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => goToStep(s.step as 1 | 2 | 3)}
                      className={[
                        "flex-1 min-w-[120px] rounded-xl py-2 px-3 text-center font-heading text-xs font-bold transition-all",
                        formStep === s.step
                          ? "bg-brand-blue-deep text-white shadow-md ring-2 ring-brand-orange/40"
                          : "bg-brand-blue-deep/10 text-brand-blue-deep hover:bg-brand-blue-deep/20 cursor-pointer",
                      ].join(" ")}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}

                {/* Step 1: Personal & Contact Info */}
                {formStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-brand-orange">
                        Personal &amp; Contact Info
                      </h3>
                      <p className="mt-1 font-display text-lg font-bold text-brand-blue-deep">
                        Basic details to get in touch
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Date of Birth *
                        </label>
                        <Input
                          type="date"
                          max="2008-12-31"
                          value={form.dateOfBirth}
                          onChange={(e) => update("dateOfBirth", e.target.value)}
                        />
                        {stepErrors.dateOfBirth && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.dateOfBirth}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Place of Birth *
                        </label>
                        <Input
                          placeholder="e.g. Quezon City"
                          value={form.placeOfBirth}
                          onChange={(e) => update("placeOfBirth", e.target.value)}
                        />
                        {stepErrors.placeOfBirth && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.placeOfBirth}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Gender *
                        </label>
                        <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                          <SelectTrigger className="w-full bg-white/80">
                            <SelectValue placeholder="Select gender identification" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Male", "Female", "LGBTQIA+", "Prefer not to say"].map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stepErrors.gender && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.gender}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Cellphone Number (11 digits) *
                        </label>
                        <Input
                          type="tel"
                          maxLength={11}
                          placeholder="09123456789"
                          value={form.cellphone}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
                            update("cellphone", digitsOnly);
                          }}
                        />
                        {stepErrors.cellphone && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.cellphone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        House Address *
                      </label>
                      <Textarea
                        rows={2}
                        placeholder="Block / Lot, Street, Barangay, City"
                        value={form.houseAddress}
                        onChange={(e) => update("houseAddress", e.target.value)}
                      />
                      {stepErrors.houseAddress && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.houseAddress}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        Facebook Profile Link *
                      </label>
                      <Input
                        placeholder="https://facebook.com/your.profile"
                        value={form.facebookLink}
                        onChange={(e) => update("facebookLink", e.target.value)}
                      />
                      {stepErrors.facebookLink && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.facebookLink}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Academics, Documents & Experience */}
                {formStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-brand-orange">
                        Academics &amp; Preferred Office
                      </h3>
                      <p className="mt-1 font-display text-lg font-bold text-brand-blue-deep">
                        School program &amp; team preference
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          College *
                        </label>
                        <Select value={form.college} onValueChange={(v) => update("college", v)}>
                          <SelectTrigger className="w-full bg-white/80">
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(COLLEGE_PROGRAMS).map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stepErrors.college && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.college}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Program *
                        </label>
                        <Select
                          disabled={!form.college}
                          value={form.program}
                          onValueChange={(v) => update("program", v)}
                        >
                          <SelectTrigger className="w-full bg-white/80">
                            <SelectValue placeholder={form.college ? "Select program" : "Select college first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {(COLLEGE_PROGRAMS[form.college] || []).map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stepErrors.program && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.program}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Section *
                        </label>
                        <Input
                          placeholder="e.g. 3A"
                          value={form.section}
                          onChange={(e) => update("section", e.target.value)}
                        />
                        {stepErrors.section && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.section}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Campus *
                        </label>
                        <Select value={form.campus} onValueChange={(v) => update("campus", v)}>
                          <SelectTrigger className="w-full bg-white/80">
                            <SelectValue placeholder="Select QCU campus" />
                          </SelectTrigger>
                          <SelectContent>
                            {["San Bartolome (Main)", "San Francisco", "Batasan"].map((camp) => (
                              <SelectItem key={camp} value={camp}>
                                {camp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stepErrors.campus && (
                          <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.campus}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        Preferred Office *
                      </label>
                      <Select value={form.role} onValueChange={(v) => update("role", v)}>
                        <SelectTrigger className="w-full bg-white/80">
                          <SelectValue placeholder="Select preferred office" />
                        </SelectTrigger>
                        <SelectContent>
                          {OFFICES.map((office) => (
                            <SelectItem key={office.value} value={office.value}>
                              {office.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {stepErrors.role && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.role}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-brand-blue-deep/10">
                      <h3 className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-brand-orange">
                        Required Documents
                      </h3>
                      <p className="mt-1 font-display text-lg font-bold text-brand-blue-deep">
                        Upload your verification files
                      </p>
                    </div>

                    {staleFileNotice && (
                      <div
                        role="alert"
                        className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 font-body text-sm text-amber-900"
                      >
                        {staleFileNotice}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Certificate of Registration (COR) *
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) update("certificateOfRegistration", f.name, f);
                          }}
                        />
                        {files.certificateOfRegistration && (
                          <p className="mt-1 text-xs text-emerald-600 font-medium">
                            Uploaded: {files.certificateOfRegistration.name}
                          </p>
                        )}
                        {!files.certificateOfRegistration && savedDocs.cor && (
                          <p className="mt-1 text-xs text-emerald-600 font-medium">
                            Already saved: {savedDocs.cor} — choose a file only if you want to replace it.
                          </p>
                        )}
                        {stepErrors.certificateOfRegistration && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {stepErrors.certificateOfRegistration}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                          Curriculum Vitae (CV) *
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) update("curriculumVitae", f.name, f);
                          }}
                        />
                        {files.curriculumVitae && (
                          <p className="mt-1 text-xs text-emerald-600 font-medium">
                            Uploaded: {files.curriculumVitae.name}
                          </p>
                        )}
                        {!files.curriculumVitae && savedDocs.cv && (
                          <p className="mt-1 text-xs text-emerald-600 font-medium">
                            Already saved: {savedDocs.cv} — choose a file only if you want to replace it.
                          </p>
                        )}
                        {stepErrors.curriculumVitae && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {stepErrors.curriculumVitae}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Background Experience & Showcase */}
                {formStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-brand-orange">
                        Background &amp; Experience
                      </h3>
                      <p className="mt-1 font-display text-lg font-bold text-brand-blue-deep">
                        Skills and community involvement
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        Interests, Skills &amp; Hobbies *
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="e.g. Web development, UI design, photography, debate club…"
                        value={form.interests}
                        onChange={(e) => update("interests", e.target.value)}
                      />
                      {stepErrors.interests && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.interests}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        Past Organizations or Community Experience *
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Org name, your role, what you did… (type N/A if none)"
                        value={form.pastOrganizations}
                        onChange={(e) => update("pastOrganizations", e.target.value)}
                      />
                      {stepErrors.pastOrganizations && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.pastOrganizations}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-brand-blue-deep/10">
                      <h3 className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-brand-orange">
                        Showcase &amp; Links (Optional)
                      </h3>
                      <p className="mt-1 font-display text-lg font-bold text-brand-blue-deep">
                        Highlight your achievements
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        Portfolio Website Link (Optional)
                      </label>
                      <Input
                        placeholder="https://your-portfolio.com"
                        value={form.portfolio}
                        onChange={(e) => update("portfolio", e.target.value)}
                      />
                      {stepErrors.portfolio && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.portfolio}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        GitHub or Project Links (Optional)
                      </label>
                      <Input
                        placeholder="https://github.com/yourhandle"
                        value={form.githubOrProjects}
                        onChange={(e) => update("githubOrProjects", e.target.value)}
                      />
                      {stepErrors.githubOrProjects && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{stepErrors.githubOrProjects}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
                        Previous Works &amp; Achievements (Optional)
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Hackathon wins, published projects, leadership achievements…"
                        value={form.previousWorks}
                        onChange={(e) => update("previousWorks", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-brand-blue-deep/10 pt-6">
                  {formStep > 1 ? (
                    <button
                      type="button"
                      onClick={goBackStep}
                      disabled={submittingStep || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-full glass-strong px-5 py-2.5 font-heading text-sm font-semibold text-brand-blue-deep transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                      <ArrowLeft className="size-4" /> Previous Step
                    </button>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onClick={goNextStep}
                    disabled={submittingStep || isSubmitting}
                    aria-busy={submittingStep || isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{ background: "var(--gradient-cta)" }}
                  >
                    {submittingStep || isSubmitting ? (
                      <>
                        {formStep === 3 ? "Submitting…" : "Saving…"} <Loader2 className="size-4 animate-spin" />
                      </>
                    ) : formStep === 3 ? (
                      <>
                        Submit Application <Rocket className="size-4" />
                      </>
                    ) : (
                      <>
                        Next Step <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
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
            Preparing account setup...
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
  const accountExists =
    !!error &&
    (error.toLowerCase().includes("already exists") || error.toLowerCase().includes("sign in"));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <h3 className="font-display text-lg font-bold text-brand-blue-deep">
          Confirm your ID details
        </h3>
        <p className="mt-1 font-body text-sm text-brand-blue-deep/70">
          We read your captured ID. Review the auto-filled fields and add your QCU email.
        </p>
      </div>

      {preview && (
        <div className="relative overflow-hidden rounded-xl border border-white/50 bg-black/40 shadow-inner">
          <img
            src={preview}
            alt="Uploaded QCU Student ID preview"
            className="h-44 w-full object-contain"
          />
        </div>
      )}

      <div className="grid gap-4">
        <label className="block">
          <div className="mb-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue-deep/70">
            Student Number{" "}
            {loading ? (
              <span className="ml-1 normal-case text-brand-blue-deep/50">(reading…)</span>
            ) : accountExists ? (
              <span className="ml-1 normal-case text-red-600 font-semibold">(Account Exists)</span>
            ) : !isManual ? (
              <span className="ml-1 normal-case text-emerald-600 font-semibold">(Verified from ID)</span>
            ) : (
              <span className="ml-1 normal-case text-amber-600 font-semibold">(Manual entry)</span>
            )}
          </div>
          <Input
            value={studentId}
            onChange={(e) => onStudentId(e.target.value)}
            placeholder={loading ? "Auto-filling…" : "e.g. 23-1234"}
            disabled={loading || !isManual || accountExists}
            className="h-12 bg-white/85 text-base disabled:opacity-80 disabled:cursor-not-allowed"
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
              disabled={loading || accountExists}
              className="h-12 bg-white/85 text-base disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={loading || accountExists}
              className="h-12 bg-white/85 text-base disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={loading || accountExists}
              maxLength={2}
              className="h-12 bg-white/85 text-base text-center min-w-[3.5rem] disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={loading || accountExists}
            className="h-12 bg-white/85 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-[11px] text-brand-blue-deep/60">
            Account password setup link and notifications will be delivered to this address.
          </p>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-600 space-y-3">
          <div>{error}</div>
          {accountExists && (
            <div>
              <Link
                to="/portal/login"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-heading text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5"
                style={{ background: "var(--gradient-cta)" }}
              >
                Sign In <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue-light bg-white px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-brand-blue-deep hover:bg-brand-blue-light/10 transition"
        >
          <ArrowLeft className="size-4" /> Re-scan
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={loading || accountExists}
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
