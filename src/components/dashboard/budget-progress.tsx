"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";
import { DUMMY_BUDGETS, getDummyCategory } from "@/lib/finance/dummy";

export function BudgetProgress() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Monthly budgets</h2>
        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
          September
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {DUMMY_BUDGETS.map((budget, index) => {
          const category = getDummyCategory(budget.categoryId);
          const over = budget.percent > 100;
          return (
            <motion.li
              key={budget.id}
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
                    style={{ backgroundColor: category?.color }}
                  />
                  {category?.name}
                </span>
                <span className="text-xs text-text-secondary">
                  <span className="font-medium text-text tabular-nums">
                    {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-text-muted">
                    {" / "}
                    {formatCurrency(budget.limit)}
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
                <motion.div
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${Math.min(budget.percent, 100)}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className={`h-full rounded-full ${
                    over ? "bg-danger" : "bg-primary"
                  }`}
                />
              </div>
              <p
                className={`mt-1.5 text-xs ${
                  over ? "font-medium text-danger" : "text-text-muted"
                }`}
              >
                {over ? "Over budget" : `${budget.percent}% used`}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}