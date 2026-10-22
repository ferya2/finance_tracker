"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/dashboard/segmented-control";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";
import { isoDate } from "@/lib/finance/period";
import {
  buildSpendingTrend,
  TREND_WINDOW_SIZES,
  trendAverage,
  trendPeak,
  trendTotals,
  trendWindow,
  type TrendGranularity,
} from "@/lib/finance/trend";
import type { Transaction } from "@/types/transaction";

const GRANULARITIES: ReadonlyArray<SegmentOption<TrendGranularity>> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

/** What one bucket of the trend is called, e.g. "day". */
const BUCKET_NAMES: Record<TrendGranularity, string> = {
  day: "day",
  week: "week",
  month: "month",
};

interface SpendingTrendProps {
  /** The user's transactions; every one of them may be placed on the trend. */
  transactions: readonly Transaction[];
  /** Whether the transactions are still on their way. */
  loading?: boolean;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text tabular-nums">{value}</p>
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced ? { duration: 0 } : { duration: 1.4, repeat: Infinity, ease: EASE }
      }
      className={`rounded-xl bg-surface-subtle ${className}`}
    />
  );
}

/**
 * Spending over time: a line chart of the user's expenses across the last
 * 30 days, 12 weeks or 12 months. The bucketing and totals come from the pure
 * helpers in `lib/finance/trend`, so the chart only has to draw them.
 */
export function SpendingTrend({ transactions, loading = false }: SpendingTrendProps) {
  const reduced = usePrefersReducedMotion();
  const [granularity, setGranularity] = useState<TrendGranularity>("day");
  const today = useMemo(() => isoDate(new Date()), []);

  const points = useMemo(() => {
    const window = trendWindow(granularity, today);
    return buildSpendingTrend(transactions, {
      granularity,
      start: window.start,
      end: window.end,
    });
  }, [transactions, granularity, today]);

  const totals = useMemo(() => trendTotals(points), [points]);
  const average = useMemo(() => trendAverage(points), [points]);
  const peak = useMemo(() => trendPeak(points), [points]);

  const bucket = BUCKET_NAMES[granularity];
  const rangeLabel = `Last ${TREND_WINDOW_SIZES[granularity]} ${bucket}s`;

  return (
    <section className={WIDGET_CARD_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Spending over time</h2>
          <p className="mt-1 text-xs text-text-muted">{rangeLabel}</p>
        </div>
        <div className="shrink-0">
          <SegmentedControl
            name="trend-granularity"
            options={GRANULARITIES}
            value={granularity}
            onChange={setGranularity}
            ariaLabel="Spending trend range"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4" role="status" aria-label="Loading spending trend">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : totals.expense === 0 ? (
        <p className="mt-6 text-sm text-text-muted">
          No spending recorded in this period yet.
        </p>
      ) : (
        <motion.div
          key={granularity}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <TrendLineChart points={points} className="mt-6" />

          <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <Stat label="Spent" value={formatCurrency(totals.expense)} />
            <Stat
              label={`Average per ${bucket}`}
              value={formatCurrency(average)}
            />
            <Stat
              label={`Biggest ${bucket}`}
              value={
                peak === null
                  ? "—"
                  : `${formatCurrency(peak.expense)} · ${peak.label}`
              }
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
