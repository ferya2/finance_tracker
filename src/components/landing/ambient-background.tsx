"use client";

import dynamic from "next/dynamic";

const BackgroundScene = dynamic(
  () =>
    import("@/components/3d/background-scene").then((m) => m.BackgroundScene),
  { ssr: false },
);

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <BackgroundScene className="absolute inset-0 h-full w-full" />
    </div>
  );
}