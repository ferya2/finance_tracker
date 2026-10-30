"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  EASE,
  staggerDelay,
  WIDGET_CARD_CLASS,
} from "@/components/dashboard/motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";
import {
  buildIncomeExpenseSeries,
  INCOME_EXPENSE_MONTHS,
} from "@/lib/finance/income-expense";
import { isoDate } from "@/lib/finance/period";
import type { Transaction } from "@/types/transaction";

interface IncomeExpenseChartProps {
  /** The user's transactions; every one of them may be placed on the chart. */
  transactions: readonly Transaction[];
  /** Whether the transactions are still on their way. */
  loading?: boolean;
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
 * Income against expenses over the last six months, drawn as grouped bars.
 * The monthly bucketing and totals come from the pure helpers in
 * `lib/finance/income-expense`, so the chart only has to draw them.
 */
export function IncomeExpenseChart({
  transactions,
  loading = false,
}: IncomeExpenseChartProps) {
  const reduced = usePrefersReducedMotion();
  const today = useMemo(() => isoDate(new Date()), []);
  const series = useMemo(
    () => buildIncomeExpenseSeries(transactions, { end: today }),
    [transactions, today],
  );

  return (
    <section className={WIDGET_CARD_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Income vs expenses</h2>
          <p className="mt-1 text-xs text-text-muted">
            Last {INCOME_EXPENSE_MONTHS} months
          </p>
        </div>
        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
          Monthly
        </span>
      </div>

      {loading ? (
        <div
          className="mt-6 space-y-4"
          role="status"
          aria-label="Loading income vs expenses"
        >
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : series.max === 0 ? (
        <p className="mt-6 text-sm text-text-muted">
          No income or expenses recorded in this period yet.
        </p>
      ) : (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <div className="mt-6 flex items-end gap-2 sm:gap-4">
            {series.points.map((point, index) => (
              <div
                key={point.key}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-40 w-full items-end justify-center gap-1 sm:gap-1.5">
                  {[
                    { name: "Income", value: point.income, tone: "bg-primary" },
                    { name: "Expenses", value: point.expense, tone: "bg-danger" },
                  ].map((bar, barIndex) => (
                    <motion.div
                      key={bar.name}
                      role="img"
                      aria-label={`${bar.name} in ${point.label}: ${formatCurrency(bar.value)}`}
                      title={`${bar.name}: ${formatCurrency(bar.value)}`}
                      initial={reduced ? false : { height: 0 }}
                      animate={{
                        height:
                          bar.value > 0
                            ? `${Math.max((bar.value / series.max) * 100, 3)}%`
                            : "0%",
                      }}
                      transition={{
                        duration: 0.6,
                        delay:
                          staggerDelay(index, 0.06, 0.1) + barIndex * 0.04,
                        ease: EASE,
                      }}
                      className={`w-2.5 rounded-t-md transition-opacity hover:opacity-80 motion-reduce:transition-none ${bar.tone} sm:w-3.5`}
                    />
                  ))}
                </div>
                <span className="w-full truncate text-center text-[11px] font-medium text-text-muted">
                  {point.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-5 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary" />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-danger" />
              Expenses
            </span>
          </div>

          <table className="sr-only">
            <caption>Income vs expenses over the last {INCOME_EXPENSE_MONTHS} months</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Income</th>
                <th scope="col">Expenses</th>
                <th scope="col">Balance</th>
              </tr>
            </thead>
            <tbody>
              {series.points.map((point) => (
                <tr key={point.key}>
                  <th scope="row">{point.label}</th>
                  <td>{formatCurrency(point.income)}</td>
                  <td>{formatCurrency(point.expense)}</td>
                  <td>{formatCurrency(point.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </section>
  );
}
