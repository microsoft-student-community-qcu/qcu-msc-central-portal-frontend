import {
  MicrosoftIcon,
  LinkedinIcon,
  CanvaIcon,
  FigmaIcon,
  VercelIcon,
  NotionIcon,
  AmazonAwsIcon,
  GoogleIcon,
  MetaIcon,
  OpenaiIcon,
  SlackIcon,
  GithubIcon,
} from "./ui/partners";

const PARTNERS = [
  "Microsoft", "GitHub", "LinkedIn", "Canva",
  "Figma", "Vercel", "Notion", "AWS",
  "Google", "Meta", "OpenAI", "Slack",
];

const PARTNER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Microsoft: MicrosoftIcon,
  LinkedIn: LinkedinIcon,
  Canva: CanvaIcon,
  Figma: FigmaIcon,
  Vercel: VercelIcon,
  Notion: NotionIcon,
  AWS: AmazonAwsIcon,
  Google: GoogleIcon,
  Meta: MetaIcon,
  OpenAI: OpenaiIcon,
  Slack: SlackIcon,
  GitHub: GithubIcon,
};

function LogoSlideshow({ partners, accents }: { partners: string[]; accents: string[] }) {
  const doubledPartners = [...partners, ...partners];

  return (
    <div className="relative mt-12 w-full overflow-hidden py-4 mask-marquee">
      <div className="animate-marquee gap-8 sm:gap-14">
        {doubledPartners.map((p, idx) => {
          const accent = accents[idx % accents.length];
          const initials = p
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase();
          const Icon = PARTNER_ICONS[p];

          return (
            <div key={`${p}-${idx}`} className="group flex flex-col items-center gap-2 w-20 sm:w-28 flex-shrink-0">
              <div
                className="relative grid size-20 place-items-center rounded-full transition duration-300 group-hover:-translate-y-0.5 sm:size-24"
                style={{
                  background: "rgba(255, 255, 255, 0.8)",
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.04), inset 0 2px 8px rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(255,255,255,0.5)`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full opacity-0 blur-xl transition duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
                  }}
                />
                {Icon ? (
                  <Icon className="relative size-9 text-brand-blue-deep transition duration-300 group-hover:scale-110 sm:size-11" />
                ) : (
                  <span className="relative font-display text-sm font-bold text-brand-blue-deep sm:text-base">
                    {initials}
                  </span>
                )}
              </div>
              <span className="font-heading text-[10px] font-normal uppercase tracking-[0.18em] text-white/90 drop-shadow-sm transition duration-300 group-hover:text-white sm:text-xs">
                {p}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WallOfLogos() {
  const accents = ["var(--brand-orange)", "var(--brand-green)", "var(--brand-blue)", "var(--brand-yellow)"];
  return (
    <section id="partners" className="relative mx-auto max-w-[1600px] px-6 py-16 lg:px-16 sm:py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue-deep/60">Trusted Collaborators</span>
        <h2 className="mt-1 font-display text-3xl font-bold text-brand-blue-deep sm:text-4xl">Backed by the brands shaping the future</h2>
      </div>
      <p className="mx-auto mt-3 max-w-xl text-center font-body text-sm text-brand-blue-deep/65">
        Logo lockups land here soon — placeholders keep the rhythm in the meantime.
      </p>
      <LogoSlideshow partners={PARTNERS} accents={accents} />
    </section>
  );
}
