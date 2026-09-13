"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { formatCurrency } from "@/lib/finance/format";
import {
  DUMMY_RECENT_TRANSACTIONS,
  getDummyCategory,
} from "@/lib/finance/dummy";

const cardClassName = "rounded-2xl border border-border bg-surface p-6 shadow-sm";

export function RecentTransactions() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className={cardClassName}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Recent transactions</h2>
        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
          Last 7 days
        </span>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {DUMMY_RECENT_TRANSACTIONS.map((txn, index) => {
          const category = getDummyCategory(txn.categoryId);
          const income = txn.type === "income";
          return (
            <motion.li
              key={txn.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.05 + index * 0.05,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="flex items-center gap-3 py-3"
            >
              <span
                style={{ backgroundColor: `${category?.color}1f`, color: category?.color }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              >
                {income ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{txn.note}</p>
                <p className="text-xs text-text-muted">{category?.name}</p>
              </div>
              <p
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  income ? "text-success" : "text-text"
                }`}
              >
                {income ? "+" : "−"}
                {formatCurrency(txn.amount)}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}