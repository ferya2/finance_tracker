"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import type { SummaryTrend, SummaryTrendDirection } from "@/lib/finance/summary";

export type SummaryTone = "primary" | "success" | "danger";

interface SummaryCardProps {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  tone: SummaryTone;
  /** Month-over-month change; omitted when there is nothing to compare. */
  trend?: SummaryTrend | null;
  delay?: number;
}

const toneClassName: Record<SummaryTone, string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  danger: "bg-danger-light text-danger",
};

const trendIcon: Record<SummaryTrendDirection, LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

/** Colors a trend by whether moving in that direction is good news. */
function trendClassName(trend: SummaryTrend, tone: SummaryTone): string {
  if (trend.direction === "flat") return "text-text-muted";
  const rising = trend.direction === "up";
  const good = tone === "danger" ? !rising : rising;
  return good ? "text-success" : "text-danger";
}

function TrendBadge({ trend, tone }: { trend: SummaryTrend; tone: SummaryTone }) {
  const reduced = usePrefersReducedMotion();
  const Icon = trendIcon[trend.direction];

  return (
    <motion.p
      initial={reduced ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={`mt-3 flex items-center gap-1 text-xs font-medium ${trendClassName(trend, tone)}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {Math.abs(trend.percent)}% vs {trend.previousMonthName}
    </motion.p>
  );
}

export function SummaryCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  trend,
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
      {trend && <TrendBadge trend={trend} tone={tone} />}
    </motion.div>
  );
}
