"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { BudgetGauge } from "@/components/dashboard/budget-gauge";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  budgetPressure,
  summarizeBudgets,
  type BudgetPressure,
} from "@/lib/finance/budget";
import type { DashboardBudgetRow } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";

/** The house easing curve, matching the rest of the dashboard motion. */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const barClassName: Record<BudgetPressure, string> = {
  onTrack: "bg-primary",
  warning: "bg-warning",
  over: "bg-danger",
};

interface BudgetProgressProps {
  rows: readonly DashboardBudgetRow[];
  /** The month the budgets apply to, e.g. "September". */
  monthName: string;
}

/** The month's budgets: one animated gauge, then a row per budget. */
export function BudgetProgress({ rows, monthName }: BudgetProgressProps) {
  const reduced = usePrefersReducedMotion();
  const totals = useMemo(() => summarizeBudgets(rows), [rows]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Monthly budgets</h2>
        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
          {monthName}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">
          No budgets set for {monthName} yet.
        </p>
      ) : (
        <>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-5 flex items-center gap-4 rounded-2xl bg-surface-subtle p-4"
          >
            <BudgetGauge totals={totals} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-text tabular-nums">
                {formatCurrency(totals.spent)}
              </p>
              <p className="text-xs text-text-muted">
                spent of {formatCurrency(totals.limit)}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${
                  totals.overBudgetCount > 0 ? "text-danger" : "text-text-muted"
                }`}
              >
                {totals.overBudgetCount > 0
                  ? `${totals.overBudgetCount} of ${totals.tracked} over budget`
                  : `${totals.tracked} tracked this month`}
              </p>
            </div>
          </motion.div>

          <ul className="mt-5 flex flex-col gap-4">
            {rows.map((row, index) => {
              const pressure = budgetPressure(row);

              return (
                <motion.li
                  key={row.id}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 + index * 0.05,
                    ease: EASE,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-text">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.categoryColor }}
                      />
                      <span className="truncate">{row.categoryName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-text-secondary tabular-nums">
                      <span className="font-medium text-text">
                        {formatCurrency(row.spent)}
                      </span>
                      <span className="text-text-muted">
                        {" / "}
                        {formatCurrency(row.limit)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <motion.div
                      initial={reduced ? false : { width: 0 }}
                      animate={{ width: `${Math.min(row.percent, 100)}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.25 + index * 0.05,
                        ease: EASE,
                      }}
                      className={`h-full rounded-full ${barClassName[pressure]}`}
                    />
                  </div>
                  <p className="mt-1.5 text-xs tabular-nums">
                    {row.overBudget ? (
                      <>
                        <span className="font-medium text-danger">Over budget</span>
                        <span className="text-text-muted">
                          {" · "}
                          {formatCurrency(Math.abs(row.remaining))} over
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-text-muted">{row.percent}% used</span>
                        <span className="text-text-muted">
                          {" · "}
                          {formatCurrency(row.remaining)} left
                        </span>
                      </>
                    )}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
