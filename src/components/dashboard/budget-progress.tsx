"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import type { DashboardBudgetRow } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";

interface BudgetProgressProps {
  rows: readonly DashboardBudgetRow[];
  /** The month the budgets apply to, e.g. "September". */
  monthName: string;
}

export function BudgetProgress({ rows, monthName }: BudgetProgressProps) {
  const reduced = usePrefersReducedMotion();

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
        <ul className="mt-5 flex flex-col gap-4">
          {rows.map((row, index) => (
            <motion.li
              key={row.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.05 + index * 0.05,
                ease: [0.25, 0.1, 0.25, 1],
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
                <span className="text-xs text-text-secondary">
                  <span className="font-medium text-text tabular-nums">
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
                    delay: 0.2 + index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className={`h-full rounded-full ${
                    row.overBudget ? "bg-danger" : "bg-primary"
                  }`}
                />
              </div>
              <p
                className={`mt-1.5 text-xs ${
                  row.overBudget ? "font-medium text-danger" : "text-text-muted"
                }`}
              >
                {row.overBudget ? "Over budget" : `${row.percent}% used`}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
