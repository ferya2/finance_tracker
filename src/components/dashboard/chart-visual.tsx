"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const ChartScene = dynamic(
  () => import("@/components/3d/chart-scene").then((m) => m.ChartScene),
  { ssr: false, loading: () => null },
);

/** Mount the 3D scene only after the browser is idle (keeps LCP clear). */
function useIdleMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const useIdle = typeof window.requestIdleCallback === "function";
    const trigger = () => setReady(true);
    const handle = useIdle
      ? window.requestIdleCallback(trigger, { timeout: 600 })
      : window.setTimeout(trigger, 80);

    return () => {
      if (handle === undefined) return;
      if (useIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return ready;
}

/** Decorative static tile shown before the 3D mounts or with reduced motion. */
function StaticTile() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-3xl border border-border bg-gradient-to-br from-primary-light/60 via-surface to-accent/20 text-primary dark:from-primary-light dark:via-surface dark:to-accent/30">
      <BarChart3 className="h-10 w-10" strokeWidth={1.5} />
    </div>
  );
}

/** Lazy 3D accent for the Reports & Insights heroes, with a static fallback. */
export function ChartVisual({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ready = useIdleMount();

  return (
    <div aria-hidden className={`${className ?? ""}`}>
      {!reduced && ready ? (
        <ChartScene className="h-full w-full" />
      ) : (
        <StaticTile />
      )}
    </div>
  );
}