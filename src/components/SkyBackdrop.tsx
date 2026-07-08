import { memo } from "react";
import cloud1Url from "@/assets/cloud1_upscaled.webp";
import cloud2Url from "@/assets/cloud2_upscaled.webp";
import cloud3Url from "@/assets/cloud3_upscaled.webp";
import cloud4Url from "@/assets/cloud4_upscaled.webp";

// Deterministic pseudo-random so SSR + client agree. Round to avoid tiny
// floating-point differences between server and browser JS engines.
const round = (n: number, d = 4) => Number(n.toFixed(d));
const rand = (n: number, salt = 1) => {
  const x = Math.sin(n * 9301 + salt * 49297) * 233280;
  return round(x - Math.floor(x));
};

// Pre-compute star layers once at module load so we don't re-allocate
// objects on every render of every page that mounts the backdrop.
// Counts kept modest — every star is an animated DOM node that paints
// each frame; halving them roughly halves the compositor cost.
const DUST = Array.from({ length: 40 }, (_, i) => ({
  top: round(rand(i, 1) * 55, 2),
  left: round(rand(i, 2) * 100, 2),
  size: round(0.6 + rand(i, 3) * 1.1, 2),
  delay: round(rand(i, 4) * 4, 2),
  duration: round(2.5 + rand(i, 5) * 3, 2),
  opacity: round(0.35 + rand(i, 6) * 0.45, 3),
}));

const STARS = Array.from({ length: 14 }, (_, i) => ({
  top: round(rand(i, 11) * 50 + 1, 2),
  left: round(rand(i, 12) * 98 + 1, 2),
  size: round(1.6 + rand(i, 13) * 1.6, 2),
  delay: round(rand(i, 14) * 5, 2),
  duration: round(2.8 + rand(i, 15) * 2.5, 2),
}));

const HERO_STARS = Array.from({ length: 4 }, (_, i) => ({
  top: round(4 + rand(i, 21) * 38, 2),
  left: round(6 + rand(i, 22) * 88, 2),
  size: round(14 + rand(i, 23) * 10, 2),
  delay: round(rand(i, 24) * 4, 2),
}));

const CLOUDS_CONFIG = [
  { src: cloud1Url, className: "left-[-40px] bottom-[38%] w-[15rem] opacity-70", drift: "drift-slow" as const, delay: "0s" },
  { src: cloud2Url, className: "right-[-30px] bottom-[32%] w-[18rem] opacity-75", drift: "drift-slower" as const, delay: "2s" },
  { src: cloud3Url, className: "left-[6%] bottom-[24%] w-[14rem] opacity-80", drift: "drift-slow" as const, delay: "1.2s" },
  { src: cloud4Url, className: "right-[10%] bottom-[19%] w-[19rem] opacity-85", drift: "drift-slower" as const, delay: "3s" },
  { src: cloud1Url, className: "left-[28%] bottom-[10%] w-[18rem] opacity-90", drift: "drift-slow" as const, delay: "0.6s" },
  { src: cloud2Url, className: "right-[-40px] bottom-[3%] w-[17rem] opacity-95", drift: "drift-slower" as const, delay: "2.4s" },
  { src: cloud3Url, className: "left-[-30px] bottom-[-10px] w-[21rem] opacity-100", drift: "drift-slow" as const, delay: "1.5s" },
];

export const SkyBackdrop = memo(function SkyBackdrop({
  variant = "sky",
}: {
  variant?: "sky" | "space";
}) {
  const dust = DUST;
  const stars = STARS;
  const heroStars = HERO_STARS;
  const isSpace = variant === "space";

  return (
    <div aria-hidden className="sky-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
         className="absolute inset-0"
        style={{ background: isSpace ? "var(--gradient-space)" : "var(--gradient-hero)" }}
      />


      {/* Soft nebula glows */}
      <div
        className="absolute -top-20 left-1/4 h-[40rem] w-[40rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.18 285 / 0.6), transparent 65%)" }}
      />
      <div
        className="absolute -top-32 right-[5%] h-[32rem] w-[32rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.18 30 / 0.45), transparent 65%)" }}
      />
      {isSpace && (
        <div
          className="absolute bottom-[10%] left-[10%] h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.18 250 / 0.55), transparent 65%)" }}
        />
      )}

      {/* Dust stars — spread full-height in space */}
      {dust.map((s, i) => (
        <span
          key={`d-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            top: isSpace ? `${(s.top / 55) * 100}%` : `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Mid stars with subtle glow — drop-shadow is composited, boxShadow would force per-frame repaint */}
      {stars.map((s, i) => (
        <span
          key={`s-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            top: isSpace ? `${(s.top / 50) * 100}%` : `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            filter: `drop-shadow(0 0 ${s.size * 2}px rgba(255,255,255,0.8))`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Hero "sparkle cross" stars — hidden in space to avoid emoji-like appearance */}
      {!isSpace &&
        heroStars.map((s, i) => (
          <SparkleStar
            key={`h-${i}`}
            top={s.top}
            left={s.left}
            size={s.size}
            delay={s.delay}
          />
        ))}

      {/* Shooting stars */}
      <ShootingStar top={10} left={-10} delay={1.5} duration={7} />
      <ShootingStar top={22} left={-15} delay={4.5} duration={10} />
      <ShootingStar top={5} left={15} delay={7} duration={8} />
      <ShootingStar top={32} left={-20} delay={3} duration={9} />
      <ShootingStar top={18} left={5} delay={5.5} duration={11} />
      {isSpace && (
        <>
          <ShootingStar top={48} left={-10} delay={2} duration={6} />
          <ShootingStar top={65} left={-15} delay={4} duration={8} />
        </>
      )}

      {/* Cloud layers — only in atmospheric sky */}
      {!isSpace && (
        <>
          {CLOUDS_CONFIG.map(({ src, className, drift, delay }, idx) => (
            <img
              key={idx}
              src={src}
              alt=""
              className={`absolute ${className} ${drift === "drift-slow" ? "animate-drift-slow" : "animate-drift-slower"}`}
              style={{ animationDelay: delay }}
            />
          ))}
        </>
      )}
    </div>
  );
});


function SparkleStar({ top, left, size, delay }: { top: number; left: number; size: number; delay: number }) {
  return (
    <span
      className="absolute"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        animation: `twinkle-bright 3.6s ease-in-out ${delay}s infinite`,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-full">
        <path
          d="M12 1.5 L13.2 10.8 L22.5 12 L13.2 13.2 L12 22.5 L10.8 13.2 L1.5 12 L10.8 10.8 Z"
          fill="white"
        />
      </svg>
    </span>
  );
}

function ShootingStar({ top, left, delay, duration }: { top: number; left: number; delay: number; duration: number }) {
  return (
    <span
      className="absolute h-[2px] w-32"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        background: "linear-gradient(to right, transparent 0%, rgba(132, 214, 247, 0.6) 75%, #ffffff 100%)",
        filter: "drop-shadow(0 0 8px rgba(132, 214, 247, 0.95))",
        transform: "rotate(45deg)",
        transformOrigin: "left center",
        animation: `meteor-shoot-lr ${duration}s linear ${delay}s infinite`,
        opacity: 0,
        pointerEvents: "none",
        willChange: "transform, opacity",
      }}
    />
  );
}

