"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: ReactNode;
}

/** Animated placeholder used by not-yet-built app areas (Days 19+). */
export function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-16">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-10 text-center shadow-sm"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
          {icon}
        </span>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-text">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        <span className="mt-6 inline-block rounded-full bg-surface-subtle px-3 py-1 text-xs font-medium text-text-muted">
          Coming soon
        </span>
      </motion.div>
    </section>
  );
}