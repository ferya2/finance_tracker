"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import type { DashboardTransactionRow } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/finance/format";

const cardClassName = "rounded-2xl border border-border bg-surface p-6 shadow-sm";

interface RecentTransactionsProps {
  transactions: readonly DashboardTransactionRow[];
  /** How many transactions the user has in total, before the list was capped. */
  total?: number;
}

/** "6 of 24" once the list is capped, otherwise "6 latest". */
function countLabel(shown: number, total: number): string {
  return total > shown ? `${shown} of ${total}` : `${shown} latest`;
}

export function RecentTransactions({
  transactions,
  total = transactions.length,
}: RecentTransactionsProps) {
  const reduced = usePrefersReducedMotion();
  const hasMore = total > transactions.length;

  return (
    <section className={cardClassName}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Recent transactions</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary tabular-nums">
            {countLabel(transactions.length, total)}
          </span>
          {hasMore && (
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">
          No transactions yet — add one to see it here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {transactions.map((transaction, index) => {
            const income = transaction.type === "income";
            return (
              <motion.li
                key={transaction.id}
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
                  style={{
                    backgroundColor: `${transaction.categoryColor}1f`,
                    color: transaction.categoryColor,
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                >
                  {income ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {transaction.note}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {transaction.categoryName} · {transaction.dateLabel}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    income ? "text-success" : "text-text"
                  }`}
                >
                  {income ? "+" : "−"}
                  {formatCurrency(transaction.amount)}
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
