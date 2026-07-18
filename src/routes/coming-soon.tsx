import { createFileRoute, Link } from "@tanstack/react-router";
import { motion as m } from "framer-motion";
import { SkyBackdrop } from "../components/SkyBackdrop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/coming-soon")({
  component: ComingSoon,
});
interface ComingSoonProps {
  title?: string;
  message?: string;
}

function PaperPlane({
  color,
  size = 56,
  rotate = 0,
  duration = 4,
  delay = 0,
}: {
  color: string;
  size?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <div style={{ transform: `rotate(${rotate}deg)` }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-flight drop-shadow-lg"
        style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
      >
        <path
          d="M22 2 11 13"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 2 15 22 11 13 2 9 22 2Z"
          fill={color}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ComingSoon({
  title = "COMING SOON",
  message = "We're still fueling this one up. Check back shortly.",
}: ComingSoonProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 sky-backdrop" style={{ background: "var(--gradient-sky)" }}>
        <SkyBackdrop />
      </div>

      {/* Content card */}
      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg rounded-3xl px-8 py-12 text-center sm:px-12"
      >
        <span className="text-tagline text-white inline-block rounded-full px-4 py-1.5 text-xs uppercase tracking-wide">
          In progress
        </span>

        <h1 className="mt-6 font-display text-4xl text-white font-bold sm:text-5xl">{title}</h1>

        <p className="mt-4 font-body text-base text-white sm:text-lg">{message}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="shadow-xl transition hover:-translate-y-0.5"
          >
            <Link to="/">Back to home</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="text-white shadow-xl transition hover:-translate-y-0.5"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Link to="/apply">Start your application</Link>
          </Button>
        </div>
      </m.div>

      {/* Flying paper planes */}
      <div className="absolute left-[8%] top-[42%] z-[1]" aria-hidden="true">
        <PaperPlane color="var(--brand-orange)" size={72} rotate={-18} duration={4.5} />
      </div>
      <div className="absolute right-[10%] top-[30%] z-[1]" aria-hidden="true">
        <PaperPlane color="var(--brand-blue)" size={56} rotate={24} duration={3.8} delay={-1.2} />
      </div>
      <div className="absolute right-[22%] top-[58%] z-[1]" aria-hidden="true">
        <PaperPlane color="var(--brand-yellow)" size={38} rotate={-8} duration={4.2} delay={-2.4} />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 animate-float"
        style={{ animationDuration: "14s" }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="block w-full h-[140px] sm:h-[180px]"
        >
          <path
            d="M0,140 C120,80 260,180 400,120 C540,60 640,160 780,110 C920,60 1040,150 1180,110 C1300,80 1380,150 1440,120 L1440,220 L0,220 Z"
            fill="var(--brand-blue-light)"
            opacity="0.55"
          />
        </svg>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 animate-float"
        style={{ animationDuration: "10s", animationDelay: "-3s" }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="block w-full h-[110px] sm:h-[150px]"
        >
          <path
            d="M0,150 C140,100 220,170 360,130 C500,90 600,170 740,130 C880,90 980,170 1120,130 C1240,100 1340,160 1440,140 L1440,200 L0,200 Z"
            fill="var(--brand-blue-light)"
            opacity="0.8"
          />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" aria-hidden="true">
        <svg
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          className="block w-full h-[90px] sm:h-[120px]"
        >
          <path
            d="M0,120 C100,70 180,140 300,110 C420,80 500,150 620,120 C740,90 820,150 940,120 C1060,90 1140,150 1260,120 C1340,100 1400,130 1440,120 L1440,180 L0,180 Z"
            fill="var(--background)"
          />
        </svg>
      </div>
    </section>
  );
}
