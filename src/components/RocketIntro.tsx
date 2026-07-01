import { useEffect, useState } from "react";
import logoUrl from "@/assets/qcu-msc-logo.png";

// Deterministic pseudo-random — hoisted to module scope so the 18-star
// array isn't re-allocated on every render of RocketIntro.
const rand = (n: number, salt = 1) => {
  const x = Math.sin(n * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
};

const TOP_STARS = Array.from({ length: 18 }, (_, i) => ({
  top: rand(i, 1) * 10,
  left: rand(i, 2) * 100,
  size: 0.6 + rand(i, 3) * 1.4,
  delay: rand(i, 4) * 4,
  duration: 2.5 + rand(i, 5) * 3,
  opacity: 0.35 + rand(i, 6) * 0.5,
}));

export function RocketIntro() {
  const [phase, setPhase] = useState<"idle" | "launch" | "leaving" | "done">("idle");

  useEffect(() => {
    if (sessionStorage.getItem("qcu-msc-intro-played")) {
      setPhase("done");
      return;
    }
    // idle (shake on launchpad) -> launch (ignite + lift off) -> leaving (fade) -> done
    const t0 = setTimeout(() => setPhase("launch"), 1600);
    const t1 = setTimeout(() => setPhase("leaving"), 4600);
    const t2 = setTimeout(() => {
      sessionStorage.setItem("qcu-msc-intro-played", "1");
      setPhase("done");
    }, 5800);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  const launching = phase === "launch" || phase === "leaving";
  const topStars = TOP_STARS;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden transition-opacity duration-700 ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: `linear-gradient(180deg,
          oklch(0.20 0.10 255) 0%,
          oklch(0.28 0.12 252) 5%,
          oklch(0.55 0.16 242) 10%,
          oklch(0.75 0.12 235) 40%,
          oklch(0.88 0.06 235) 70%,
          oklch(0.96 0.02 235) 100%)`,
      }}
      aria-hidden
    >
      {/* Sparse stars — only in the top 10% (space hint) */}
      {topStars.map((s, i) => (
        <span
          key={`ts-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Soft nebula glows at the very top */}
      <div
        className="absolute -top-20 left-1/4 h-[24rem] w-[24rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.18 285 / 0.5), transparent 65%)" }}
      />
      <div
        className="absolute -top-16 right-[5%] h-[20rem] w-[20rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.18 30 / 0.35), transparent 65%)" }}
      />

      {/* Drifting clouds across the sky */}
      <Cloud className="left-[-80px] top-[18%] w-[26rem] opacity-70" drift="drift-slow" />
      <Cloud className="right-[-60px] top-[28%] w-[28rem] opacity-75" drift="drift-slower" delay="2s" />
      <Cloud className="left-[6%] top-[42%] w-[22rem] opacity-80" drift="drift-slow" delay="1.2s" />
      <Cloud className="right-[10%] top-[55%] w-[24rem] opacity-85" drift="drift-slower" delay="3s" />
      <Cloud className="left-[28%] top-[68%] w-[30rem] opacity-90" drift="drift-slow" delay="0.6s" />
      <Cloud className="right-[-70px] top-[78%] w-[32rem] opacity-95" drift="drift-slower" delay="2.4s" />
      <Cloud className="left-[-60px] top-[88%] w-[30rem] opacity-100" drift="drift-slow" delay="1.5s" />

      {/* Ground — slim 10% strip with a gentle hill */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[10%]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="ground-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.10 150)" />
              <stop offset="100%" stopColor="oklch(0.56 0.12 150)" />
            </linearGradient>
            <linearGradient id="ground-near" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.52 0.12 148)" />
              <stop offset="100%" stopColor="oklch(0.32 0.08 145)" />
            </linearGradient>
            <radialGradient id="pad-glow" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="oklch(0.95 0.12 80 / 0.45)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Distant gentle hill */}
          <path
            d="M0,60 C240,30 480,70 720,50 C960,30 1200,65 1440,55 L1440,120 L0,120 Z"
            fill="url(#ground-far)"
            opacity="0.95"
          />
          {/* Foreground ground */}
          <path
            d="M0,85 C300,70 600,90 900,80 C1140,72 1320,88 1440,82 L1440,120 L0,120 Z"
            fill="url(#ground-near)"
          />
          {/* Warm pad glow */}
          <ellipse cx="720" cy="115" rx="200" ry="18" fill="url(#pad-glow)" />
        </svg>

        {/* Launchpad slab */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center">
          <div
            className="w-44 sm:w-56 h-3 rounded-t-md"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.62 0.02 250) 0%, oklch(0.42 0.02 250) 100%)",
            }}
          />
          <div
            className="w-56 sm:w-72 h-4 rounded-sm"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.42 0.02 250) 0%, oklch(0.22 0.02 250) 100%)",
              boxShadow: "0 -2px 14px rgba(0,0,0,0.35)",
            }}
          />
        </div>
      </div>

      {/* Rocket — sits on launchpad, shakes, then launches */}
      <div className="absolute inset-x-0 bottom-[10%] z-[2] flex justify-center pointer-events-none">
        <div className={launching ? "animate-rocket-launch" : ""}>
          <div className="relative w-max animate-shake">
          <img
            src={logoUrl}
            alt=""
            className="h-[clamp(9rem,30vmin,18rem)] w-auto object-contain drop-shadow-[0_8px_30px_rgba(255,140,0,0.55)]"
          />
          {/* Flames — appear only during launch */}
          {launching && (
          <div className="pointer-events-none absolute left-[57%] top-[92%] -translate-x-1/2">
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-2 h-32 w-24 rounded-full blur-2xl opacity-90"
              style={{
                background:
                  "radial-gradient(ellipse at top, #ffb347 0%, #ff5e1f 45%, transparent 75%)",
              }}
            />
            <div
              className="absolute left-1/2 top-0 h-28 w-12 -translate-x-1/2 animate-flame"
              style={{
                background:
                  "linear-gradient(180deg, #fff3a8 0%, #ffb347 25%, #ff7a18 60%, #ff3d00 100%)",
                borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
                filter: "blur(1px)",
              }}
            />
            <div
              className="absolute left-1/2 top-1 h-20 w-6 -translate-x-1/2 animate-flame-inner"
              style={{
                background:
                  "linear-gradient(180deg, #ffffff 0%, #fff3a8 35%, #ffd24a 70%, #ff8a00 100%)",
                borderRadius: "50% 50% 45% 45% / 30% 30% 90% 90%",
              }}
            />
          </div>
          )}
          </div>
        </div>
      </div>

      {/* Smoke — only after ignition */}
      {launching && (
      <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className="animate-smoke-trail w-72 sm:w-96"
          style={{
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.85) 0%, rgba(230,230,235,0.6) 50%, rgba(255,255,255,0) 100%)",
            filter: "blur(20px)",
            borderRadius: "9999px",
            animationDelay: "0.2s",
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0 flex justify-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="absolute bottom-0 left-1/2 animate-smoke-puff rounded-full"
            style={{
              width: `${70 + (i % 4) * 20}px`,
              height: `${70 + (i % 4) * 20}px`,
              background:
                "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.75), rgba(220,220,228,0.45) 55%, rgba(200,200,210,0) 80%)",
              filter: "blur(10px)",
              animationDelay: `${0.2 + i * 0.12}s`,
              ["--dx" as string]: `${(i % 2 === 0 ? -1 : 1) * (40 + (i * 13) % 220)}px`,
            }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 animate-smoke-cover"
        style={{ animationDelay: "0.6s" }}
      />
      </>
      )}
    </div>
  );
}

function Cloud({
  className = "",
  drift = "drift-slow",
  delay,
}: {
  className?: string;
  drift?: "drift-slow" | "drift-slower";
  delay?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 110"
      className={`absolute ${className} ${drift === "drift-slow" ? "animate-drift-slow" : "animate-drift-slower"}`}
      style={delay ? { animationDelay: delay } : undefined}
      aria-hidden
    >
      <defs>
        <radialGradient id="cg-top" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="70%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0.45" />
        </radialGradient>
        <radialGradient id="cg-shadow" cx="50%" cy="80%" r="70%">
          <stop offset="0%" stopColor="oklch(0.78 0.06 250)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.78 0.06 250)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="85" rx="105" ry="20" fill="url(#cg-shadow)" />
      <ellipse cx="55" cy="68" rx="42" ry="26" fill="url(#cg-top)" />
      <ellipse cx="95" cy="50" rx="48" ry="34" fill="url(#cg-top)" />
      <ellipse cx="140" cy="44" rx="44" ry="36" fill="url(#cg-top)" />
      <ellipse cx="180" cy="58" rx="40" ry="28" fill="url(#cg-top)" />
      <ellipse cx="205" cy="72" rx="30" ry="20" fill="url(#cg-top)" />
      <ellipse cx="115" cy="72" rx="70" ry="22" fill="url(#cg-top)" opacity="0.9" />
    </svg>
  );
}
