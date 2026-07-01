import { SkyBackdrop } from "@/components/SkyBackdrop";

/**
 * Full-screen pending state shown while a route's data resolves.
 * Reuses the cosmic backdrop so transitions never break visual continuity.
 */
export function CosmicLoader({ label = "Charting a course" }: { label?: string }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "var(--gradient-space)" }}
    >
      <SkyBackdrop variant="space" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Orbiting planet loader */}
        <div className="relative size-28">
          {/* Outer dashed orbit */}
          <div
            className="absolute inset-0 rounded-full border border-dashed border-white/30 animate-orbit-slow"
            style={{ borderWidth: 1 }}
          />
          {/* Inner orbit + satellite */}
          <div className="absolute inset-3 animate-orbit-rev">
            <span
              className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-white"
              style={{ boxShadow: "0 0 12px rgba(255,255,255,0.9)" }}
            />
          </div>
          {/* Central planet */}
          <div
            className="absolute inset-6 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, oklch(0.82 0.16 60), oklch(0.55 0.18 30) 60%, oklch(0.3 0.12 280) 100%)",
              boxShadow:
                "0 0 30px -5px oklch(0.75 0.18 32 / 0.6), inset -6px -8px 16px rgba(0,0,0,0.35)",
            }}
          />
          {/* Tiny orbiting spark */}
          <div className="absolute inset-0 animate-orbit-slow">
            <span
              className="absolute top-1/2 -right-1 size-1.5 -translate-y-1/2 rounded-full bg-brand-yellow"
              style={{ boxShadow: "0 0 10px oklch(0.85 0.18 88)" }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-display text-sm font-bold uppercase tracking-[0.32em] text-white/90">
            {label}
          </p>
          <div className="flex items-center justify-center gap-1.5" aria-hidden>
            <span className="size-1.5 rounded-full bg-white/80 animate-loader-dot" style={{ animationDelay: "0s" }} />
            <span className="size-1.5 rounded-full bg-white/80 animate-loader-dot" style={{ animationDelay: "0.15s" }} />
            <span className="size-1.5 rounded-full bg-white/80 animate-loader-dot" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
        <span className="sr-only" role="status" aria-live="polite">Loading…</span>
      </div>
    </div>
  );
}
