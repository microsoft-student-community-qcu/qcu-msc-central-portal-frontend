import { useState } from "react";
import { ArrowRight, ShieldCheck, Lock, FileText, Clock } from "lucide-react";

/**
 * Data Privacy Consent (RA 10173 — Data Privacy Act of 2012).
 * Frontend-only gate: the applicant must tick the checkbox before the
 * OCR ID verification step becomes available. No data leaves the device here.
 */
export function DataPrivacyConsent({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleProceed = () => {
    setTouched(true);
    if (!checked) return;
    onAccept();
  };

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brand-orange/30 bg-brand-orange/10 text-brand-orange">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <h3 className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-brand-orange">
            Data Privacy Consent
          </h3>
          <p className="mt-1 font-display text-lg font-bold text-brand-blue-deep">
            Republic Act No. 10173 — Data Privacy Act of 2012
          </p>
        </div>
      </div>

      <div className="mt-5 max-h-[24rem] space-y-5 overflow-y-auto rounded-2xl border border-brand-blue-deep/10 bg-brand-blue-light/10 p-5 font-body text-sm leading-relaxed text-brand-blue-deep/80">
        <p>
          The <strong className="text-brand-blue-deep">Microsoft Student Community QCU (MSC-QCU)</strong>{" "}
          collects and processes your personal information solely to evaluate and manage your
          membership application to the organization. By continuing, you acknowledge that you have
          read and understood how your data will be handled under RA 10173.
        </p>

        <div>
          <h4 className="flex items-center gap-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
            <FileText className="size-4 text-brand-orange" /> Information we collect
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-brand-blue-deep">Identity &amp; ID image:</strong> a photo of
              your QCU Student ID, your Student Number, full name, date and place of birth, and
              gender.
            </li>
            <li>
              <strong className="text-brand-blue-deep">Contact details:</strong> personal email address, cellphone number, house address, and Facebook profile link.
            </li>
            <li>
              <strong className="text-brand-blue-deep">Academic records:</strong> college, program,
              section, campus, your Certificate of Registration (COR), and Curriculum Vitae (CV).
            </li>
            <li>
              <strong className="text-brand-blue-deep">Application content:</strong> preferred
              office, interests and skills, past organizations, portfolio and project links, and
              previous works or achievements.
            </li>
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
            <Lock className="size-4 text-brand-orange" /> How we use and protect it
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Verifying that you are a bona fide, currently enrolled QCU student.</li>
            <li>Screening, interviewing, and deciding on your application to a preferred office.</li>
            <li>
              Sending you application status updates, resubmission notices, and official
              transmissions through the portal inbox and your registered email.
            </li>
            <li>
              Creating your MSC-QCU portal account, and — once accepted — managing your membership,
              event registrations, and certificates.
            </li>
            <li>
              Producing anonymized, aggregated statistics (e.g. applicants per college) for
              organizational reporting. Such reports never identify you individually.
            </li>
            <li>
              Access is limited to authorized MSC-QCU officers on a need-to-know basis.
              We do not sell, rent, or trade your personal data, and we do not share it with third
              parties except when required by law or by QCU school authorities.
            </li>
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand-blue-deep/75">
            <Clock className="size-4 text-brand-orange" /> Retention &amp; your rights
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Application records are retained only for as long as necessary for the recruitment
              cycle and your active membership, after which they are securely disposed of.
            </li>
            <li>
              Under RA 10173 you have the right to be informed, to access, to object, to rectify, to
              erase or block, to data portability, to damages, and to lodge a complaint with the
              National Privacy Commission.
            </li>
            <li>
              To exercise any of these rights, contact the MSC-QCU officers through our official
              channels. Withdrawing consent may prevent us from processing your application.
            </li>
          </ul>
        </div>

        <p className="text-brand-blue-deep/60">
          Your consent is freely given, specific, and informed. This is a required first step — your
          ID will only be scanned and verified after you agree below.
        </p>
      </div>

      <label
        className={[
          "mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition",
          touched && !checked
            ? "border-red-400 bg-red-500/5"
            : checked
              ? "border-brand-orange/50 bg-brand-orange/5"
              : "border-brand-blue-light bg-brand-blue-light/10 hover:bg-brand-blue-light/20",
        ].join(" ")}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            if (e.target.checked) setTouched(false);
          }}
          className="mt-0.5 size-5 shrink-0 accent-[var(--brand-orange)]"
          aria-describedby="consent-error"
        />
        <span className="font-body text-sm text-brand-blue-deep/85">
          I have read and understood this notice, and I freely give my consent to MSC-QCU to collect
          and process my personal information for the purposes stated above, in accordance with{" "}
          <strong className="text-brand-blue-deep">RA 10173 (Data Privacy Act of 2012)</strong>.
        </span>
      </label>

      {touched && !checked && (
        <p id="consent-error" className="mt-2 font-body text-xs font-semibold text-red-600">
          You must check the consent box before you can continue to ID verification.
        </p>
      )}

      <button
        type="button"
        onClick={handleProceed}
        disabled={!checked}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 font-heading text-sm font-bold text-white shadow-lg transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--brand-blue-deep)" }}
      >
        I Agree — Continue to ID Verification <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
