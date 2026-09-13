"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

/** Subtle decorative background for app pages — soft blooms + dotted texture. */
function PageMotif() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(5,150,105,0.12),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(52,211,153,0.09),transparent_65%)]" />
      <div className="absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.1),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(45,212,191,0.07),transparent_65%)]" />
      <div className="absolute inset-0 [background-image:radial-gradient(rgba(9,9,11,0.09)_1px,transparent_1px)] [background-size:26px_26px] dark:[background-image:radial-gradient(rgba(244,244,245,0.05)_1px,transparent_1px)]" />
    </div>
  );
}

/** Wraps a dashboard page: decorative motif behind a smooth entrance. */
export function PageShell({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative flex flex-1">
      <PageMotif />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}