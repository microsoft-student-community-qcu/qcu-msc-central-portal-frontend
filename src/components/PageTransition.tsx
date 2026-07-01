import { type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Wraps route content with a subtle fade + lift transition on every
 * pathname change. Keying the wrapper on pathname re-mounts it so the
 * CSS animation replays — no state/effect needed (which would cause a
 * second remount on every navigation).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div key={pathname} className="page-transition-in motion-reduce:animate-none">
      {children}
    </div>
  );
}
