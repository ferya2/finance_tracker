"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { EASE, WIDGET_CARD_CLASS, staggerDelay } from "@/components/dashboard/motion";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/dashboard/segmented-control";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import type { DashboardBreakdownRow } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";

/** Which chart the widget shows. */
type BreakdownView = "bars" | "donut";

const VIEWS: ReadonlyArray<SegmentOption<BreakdownView>> = [
  { value: "bars", label: "Bars" },
  { value: "donut", label: "Donut" },
];

interface CategoryBreakdownProps {
  rows: readonly DashboardBreakdownRow[];
}

/** The month's spending per category, as animated bars or a donut. */
export function CategoryBreakdown({ rows }: CategoryBreakdownProps) {
  const reduced = usePrefersReducedMotion();
  const [view, setView] = useState<BreakdownView>("bars");
  const donut = useMemo(() => buildDonutBreakdown(rows), [rows]);

  return (
    <section className={WIDGET_CARD_CLASS}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text">Spending by category</h2>
        {rows.length > 0 && (
          <div className="shrink-0">
            <SegmentedControl
              name="breakdown"
              options={VIEWS}
              value={view}
              onChange={setView}
              ariaLabel="Spending by category chart"
            />
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">
          No spending recorded for this month yet.
        </p>
      ) : (
        <motion.div
          key={view}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {view === "donut" ? (
            <CategoryDonut breakdown={donut} />
          ) : (
            <ul className="mt-5 flex flex-col gap-4">
              {rows.map((row, index) => (
                <motion.li
                  key={row.categoryId}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: staggerDelay(index),
                    ease: EASE,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium text-text">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.categoryColor }}
                      />
                      {row.categoryName}
                    </span>
                    <span className="text-text-secondary">
                      <span className="font-medium text-text tabular-nums">
                        {formatCurrency(row.amount)}
                      </span>
                      <span className="ml-2 text-xs text-text-muted">
                        {row.sharePercent}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <motion.div
                      initial={reduced ? false : { width: 0 }}
                      animate={{ width: `${row.sharePercent}%` }}
                      transition={{
                        duration: 0.8,
                        delay: staggerDelay(index, 0.05, 0.2),
                        ease: EASE,
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: row.categoryColor }}
                    />
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </section>
  );
}
