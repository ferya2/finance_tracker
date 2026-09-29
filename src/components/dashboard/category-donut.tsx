"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import type { DonutBreakdown, DonutSlice } from "@/lib/finance/donut";
import { formatCurrency } from "@/lib/finance/format";

const VIEW_SIZE = 168;
const STROKE_WIDTH = 18;
const CENTER = VIEW_SIZE / 2;
const RADIUS = (VIEW_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Share of the ring left as a gap between two neighbouring slices, in percent. */
const SLICE_GAP_PERCENT = 1.5;

/** The house easing curve, matching the rest of the dashboard motion. */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

interface DonutArc {
  slice: DonutSlice;
  /** Drawn length of the arc, in circumference units. */
  dash: number;
  /** Where the arc starts, as a negative circumference offset. */
  offset: number;
}

/**
 * Lay the slices out around the ring, starting at the top. Arcs are sized from
 * the amounts rather than the rounded percents, so the ring always closes
 * exactly, and a small gap is left between slices so neighbouring categories
 * stay readable.
 */
function donutArcs(breakdown: DonutBreakdown): DonutArc[] {
  const { total, slices } = breakdown;
  const gapped = slices.length > 1;
  let cursor = 0;

  return slices.map((slice) => {
    const sweep = total > 0 ? (slice.amount / total) * 100 : 0;
    const arc: DonutArc = {
      slice,
      dash: gapped ? Math.max(sweep - SLICE_GAP_PERCENT, 0) : sweep,
      offset: -(cursor + (gapped ? SLICE_GAP_PERCENT / 2 : 0)),
    };
    cursor += sweep;
    return arc;
  });
}

/** A circumference length rounded to the hundredth, to keep the DOM tidy. */
function toUnits(percent: number): number {
  return Number(((percent / 100) * CIRCUMFERENCE).toFixed(2));
}

interface CategoryDonutProps {
  breakdown: DonutBreakdown;
}

/** An animated donut of a month's spending, with a total in the middle. */
export function CategoryDonut({ breakdown }: CategoryDonutProps) {
  const reduced = usePrefersReducedMotion();
  const arcs = donutArcs(breakdown);

  return (
    <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <motion.div
        initial={
          reduced ? false : { opacity: 0, scale: 0.9, rotate: -24 }
        }
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44"
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
          {arcs.map(({ slice, dash, offset }, index) => (
            <motion.circle
              key={slice.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="butt"
              strokeDasharray={`${toUnits(dash)} ${CIRCUMFERENCE.toFixed(2)}`}
              initial={reduced ? false : { strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: toUnits(offset) }}
              transition={{
                duration: 0.7,
                delay: 0.1 + index * 0.08,
                ease: EASE,
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-surface text-center">
          <span className="text-base font-semibold text-text tabular-nums">
            {formatCurrency(breakdown.total)}
          </span>
          <span className="mt-0.5 text-[11px] leading-tight text-text-muted">
            spent this month
          </span>
        </div>
      </motion.div>

      <ul className="flex w-full flex-col gap-2.5">
        {arcs.map(({ slice }, index) => (
          <motion.li
            key={slice.key}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.05, ease: EASE }}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 font-medium text-text">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="shrink-0 text-text-secondary tabular-nums">
              <span className="font-medium text-text">
                {formatCurrency(slice.amount)}
              </span>
              <span className="ml-2 text-xs text-text-muted">
                {slice.percent}%
              </span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
