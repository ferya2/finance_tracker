"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { type ReactNode } from "react";
import { ChartVisual } from "@/components/dashboard/chart-visual";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  DUMMY_CATEGORY_BREAKDOWN,
  DUMMY_INSIGHTS,
  getDummyCategory,
} from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";

function StatCard({
  label,
  value,
  delta,
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-text tabular-nums">
        {value}
      </p>
      {delta && <p className="mt-1 text-xs text-text-muted">{delta}</p>}
    </motion.div>
  );
}

const topBreakdown = [...DUMMY_CATEGORY_BREAKDOWN]
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 4);

export function InsightsView() {
  const reduced = usePrefersReducedMotion();
  const maxTopAmount = topBreakdown[0]?.amount ?? 1;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Insights"
          description="Smart observations about how you spend — from your own history."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Daily average"
            icon={<Wallet className="h-4 w-4" />}
            value={formatCurrency(DUMMY_INSIGHTS.averageDailySpend)}
            delta="Spent per day across the month"
          />
          <StatCard
            label="Savings rate"
            icon={<PiggyBank className="h-4 w-4" />}
            value={`${DUMMY_INSIGHTS.savingsRatePercent}%`}
            delta="Kept from everything you earned"
            delay={0.05}
          />
          <StatCard
            label="vs last month"
            icon={<TrendingDown className="h-4 w-4" />}
            value={`−${DUMMY_INSIGHTS.spendingTrendPercent}%`}
            delta="Spent less than in August"
            delay={0.1}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-text">Top categories</h2>
              <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
                By spending
              </span>
            </div>

            <ul className="mt-5 flex flex-col gap-5">
              {topBreakdown.map((item, index) => {
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
                      <span className="text-text-secondary tabular-nums">
                        {formatCurrency(item.amount)}
                        <span className="ml-2 text-xs text-text-muted">
                          {item.sharePercent}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
                      <motion.div
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${(item.amount / maxTopAmount) * 100}%` }}
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

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <ChartVisual className="h-44 w-full" />
              <p className="mt-3 text-center text-xs text-text-muted">
                Spending snapshot
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Biggest single expense
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-text tabular-nums">
                {formatCurrency(DUMMY_INSIGHTS.biggestExpenseAmount)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {DUMMY_INSIGHTS.biggestExpenseNote}
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-text">Notes for you</h2>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {DUMMY_INSIGHTS.tips.map((tip, index) => (
              <motion.li
                key={tip}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + index * 0.06,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="flex items-start gap-3 rounded-xl bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {tip}
              </motion.li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}