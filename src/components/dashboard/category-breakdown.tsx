"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";
import {
  DUMMY_CATEGORY_BREAKDOWN,
  getDummyCategory,
} from "@/lib/finance/dummy";

export function CategoryBreakdown() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-base font-semibold text-text">Spending by category</h2>

      <ul className="mt-5 flex flex-col gap-4">
        {DUMMY_CATEGORY_BREAKDOWN.map((item, index) => {
          const category = getDummyCategory(item.categoryId);
          return (
            <motion.li
              key={item.categoryId}
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
                <span className="text-text-secondary">
                  <span className="font-medium text-text tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="ml-2 text-xs text-text-muted">
                    {item.sharePercent}%
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
                <motion.div
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${item.sharePercent}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: category?.color }}
                />
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}