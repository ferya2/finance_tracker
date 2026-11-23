"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

const BackgroundScene = dynamic(
  () =>
    import("@/components/3d/background-scene").then((m) => m.BackgroundScene),
  { ssr: false, loading: () => null },
);

/** Mount the 3D scene only after the browser is idle (keeps LCP clear). */
function useIdleMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const useIdle = typeof window.requestIdleCallback === "function";
    const trigger = () => setReady(true);
    const handle = useIdle
      ? window.requestIdleCallback(trigger, { timeout: 500 })
      : window.setTimeout(trigger, 60);

    return () => {
      if (handle === undefined) return;
      if (useIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return ready;
}

function AmbientGlow() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, var(--color-primary-light), transparent 70%)",
      }}
    />
  );
}

export function AmbientBackground() {
  const reduced = usePrefersReducedMotion();
  const ready = useIdleMount();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <AmbientGlow />
      {!reduced && ready && (
        <BackgroundScene className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}