"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

type SummaryTone = "primary" | "success" | "danger";

interface SummaryCardProps {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  tone: SummaryTone;
  delay?: number;
}

const toneClassName: Record<SummaryTone, string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  danger: "bg-danger-light text-danger",
};

export function SummaryCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  delay = 0,
}: SummaryCardProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClassName[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <AnimatedNumber
        value={value}
        className="mt-5 block text-2xl font-semibold tracking-tight text-text sm:text-3xl"
      />
      <p className="mt-1 text-xs text-text-muted">{caption}</p>
    </motion.div>
  );
}