import { createFileRoute } from "@tanstack/react-router";
import { Award, Download } from "lucide-react";
import { PortalCard, PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/portal/certificates")({
  head: () => ({ meta: [{ title: "Certificates · QCU MSC" }] }),
  component: CertificatesPage,
});

const CERTS = [
  { id: "c1", title: "Hack the Campus — Finalist", date: "May 2026", issuer: "QCU MSC" },
  { id: "c2", title: "Intro to Power Platform — Completion", date: "Apr 2026", issuer: "Microsoft Learn" },
  { id: "c3", title: "Azure Foundations Workshop", date: "Mar 2026", issuer: "QCU MSC" },
];

function CertificatesPage() {
  return (
    <PortalShell requireRole="member" title="Mission badges" subtitle="Proof of every expedition you've completed beyond the atmosphere.">
      <PortalCard title="Issued to you" icon={<Award className="size-5 text-brand-blue-deep" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {CERTS.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-brand-blue-light/70 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-bold text-brand-blue-deep">{c.title}</div>
                <div className="font-body text-[11px] text-brand-blue-deep/60">
                  {c.issuer} · {c.date}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-blue-deep px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-brand-blue"
              >
                <Download className="size-3.5" /> PDF
              </button>
            </div>
          ))}
        </div>
      </PortalCard>
    </PortalShell>
  );
}
