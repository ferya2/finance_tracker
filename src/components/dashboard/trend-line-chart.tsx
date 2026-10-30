"use client";

import { motion } from "framer-motion";
import { useId, useState, type PointerEvent } from "react";
import { EASE, staggerDelay } from "@/components/dashboard/motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";
import type { TrendPoint } from "@/lib/finance/trend";

/** Which measure of a trend the line shows. */
export type TrendMeasure = "expense" | "income";

interface TrendLineChartProps {
  points: readonly TrendPoint[];
  /** Which measure the line shows; spending by default. */
  measure?: TrendMeasure;
  /** Extra classes for the chart's frame. */
  className?: string;
}

/** How many x-axis labels the chart shows at most. */
const MAX_AXIS_LABELS = 6;

/** The measure a point contributes to the line. */
function valueOf(point: TrendPoint, measure: TrendMeasure): number {
  return measure === "expense" ? point.expense : point.income;
}

/**
 * The indexes of the points that get an x-axis label, spread evenly across the
 * chart with the first and the last point always labelled.
 */
function labelIndexes(count: number): number[] {
  if (count <= MAX_AXIS_LABELS) {
    return Array.from({ length: count }, (_, index) => index);
  }

  const step = (count - 1) / (MAX_AXIS_LABELS - 1);
  return Array.from(
    { length: MAX_AXIS_LABELS },
    (_, index) => Math.round(index * step),
  );
}

/**
 * A line chart of a trend: the line draws itself in, the area under it fades
 * up, and the points pop in one after another. Hovering the plot reveals the
 * value of the nearest point. The chart is laid out in percentages so it fills
 * any width without measuring itself.
 */
export function TrendLineChart({
  points,
  measure = "expense",
  className = "",
}: TrendLineChartProps) {
  const reduced = usePrefersReducedMotion();
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const peak = Math.max(...points.map((point) => valueOf(point, measure)), 0);
  const scale = peak > 0 ? peak : 1;

  const coordinates = points.map((point, index) => ({
    x: points.length <= 1 ? 50 : (index / (points.length - 1)) * 100,
    y: 100 - (valueOf(point, measure) / scale) * 100,
  }));

  const line = coordinates
    .map(
      (coordinate, index) =>
        `${index === 0 ? "M" : "L"} ${coordinate.x.toFixed(2)} ${coordinate.y.toFixed(2)}`,
    )
    .join(" ");

  const area =
    coordinates.length > 0
      ? `${line} L ${coordinates[coordinates.length - 1].x.toFixed(2)} 100 L ${coordinates[0].x.toFixed(2)} 100 Z`
      : "";

  const labels = labelIndexes(points.length);
  // Remount the plot whenever the underlying values change so the line redraws
  // itself instead of snapping to the new shape. The parent often remounts the
  // whole chart, but this also covers live data and measure updates.
  const signature = `${measure}:${points
    .map((point) => `${point.key}:${valueOf(point, measure)}`)
    .join("|")}`;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (points.length === 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;

    const ratio = (event.clientX - bounds.left) / bounds.width;
    const index = Math.round(ratio * (points.length - 1));
    setActiveIndex(Math.min(Math.max(index, 0), points.length - 1));
  }

  const active =
    activeIndex !== null && coordinates[activeIndex] !== undefined
      ? { index: activeIndex, ...coordinates[activeIndex] }
      : null;

  return (
    <div className={className}>
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
        className="relative h-56 w-full touch-pan-y"
      >
        {[25, 50, 75].map((offset) => (
          <span
            key={offset}
            aria-hidden
            className="absolute inset-x-0 h-px bg-border/70"
            style={{ top: `${offset}%` }}
          />
        ))}

        {coordinates.length > 0 && (
          <svg
            key={signature}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-0 h-full w-full text-primary"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <motion.path
              d={area}
              fill={`url(#${gradientId})`}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            />
            <motion.path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={5}
              strokeOpacity={0.16}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: EASE }}
            />
            <motion.path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: EASE }}
            />
          </svg>
        )}

        {coordinates.map((coordinate, index) => (
          <span
            key={points[index].key}
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${coordinate.x}%`, top: `${coordinate.y}%` }}
          >
            <motion.span
              className="block h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary"
              initial={reduced ? false : { opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: staggerDelay(index, 0.03, 0.35),
                ease: EASE,
              }}
            />
          </span>
        ))}

        {active !== null && points[active.index] !== undefined && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-surface/80"
              style={{ left: `${active.x}%`, top: `${active.y}%` }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg"
              style={{
                left: `${active.x}%`,
                top: `${active.y}%`,
                transform:
                  active.x > 80
                    ? "translate(-90%, -135%)"
                    : active.x < 20
                      ? "translate(-10%, -135%)"
                      : "translate(-50%, -135%)",
              }}
            >
              <span className="block font-medium text-text">
                {points[active.index].label}
              </span>
              <span className="block text-text-secondary tabular-nums">
                {formatCurrency(valueOf(points[active.index], measure))}
              </span>
            </span>
          </>
        )}
      </div>

      <div className="relative mt-2 h-4 text-[11px] text-text-muted">
        {labels.map((index) => (
          <span
            key={points[index].key}
            aria-hidden
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${coordinates[index].x}%` }}
          >
            {points[index].label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>
          {measure === "expense" ? "Spending" : "Income"} over time
        </caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <th scope="row">{point.label}</th>
              <td>{formatCurrency(valueOf(point, measure))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
