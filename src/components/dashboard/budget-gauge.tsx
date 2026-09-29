"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import type { BudgetPressure, BudgetTotals } from "@/lib/finance/budget";

const VIEW_SIZE = 64;
const STROKE_WIDTH = 7;
const CENTER = VIEW_SIZE / 2;
const RADIUS = (VIEW_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The house easing curve, matching the rest of the dashboard motion. */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const strokeClassName: Record<BudgetPressure, string> = {
  onTrack: "stroke-primary",
  warning: "stroke-warning",
  over: "stroke-danger",
};

/** How much of the ring the arc covers, capped so it can never overflow. */
function sweepOf(percent: number): number {
  return Math.min(Math.max(percent, 0), 100) / 100;
}

interface BudgetGaugeProps {
  totals: BudgetTotals;
}

/**
 * A small ring showing how much of the month's total limits is spent, with the
 * percentage in the middle. The arc sweeps into place on mount and is coloured
 * by how close the month is to its limits.
 */
export function BudgetGauge({ totals }: BudgetGaugeProps) {
  const reduced = usePrefersReducedMotion();
  const dash = sweepOf(totals.percent) * CIRCUMFERENCE;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative h-16 w-16 shrink-0"
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="h-full w-full -rotate-90"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-surface-subtle"
        />
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="butt"
          strokeDasharray={`${dash.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`}
          initial={reduced ? false : { strokeDashoffset: dash }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className={strokeClassName[totals.pressure]}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-text">
        {totals.percent}%
      </span>
    </motion.div>
  );
}
