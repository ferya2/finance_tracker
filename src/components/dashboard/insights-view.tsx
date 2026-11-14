"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  PiggyBank,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { ChartVisual } from "@/components/dashboard/chart-visual";
import {
  EASE,
  staggerDelay,
  WIDGET_CARD_CLASS,
} from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { useCurrency } from "@/components/currency-provider";
import { buildInsights, type Insights } from "@/lib/finance/insights";
import { currentPeriod, formatMonthLabel } from "@/lib/finance/period";

function StatCard({
  label,
  value,
  delta,
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  delta: string;
  icon: ReactNode;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className={WIDGET_CARD_CLASS}
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
      <p className="mt-1 text-xs text-text-muted">{delta}</p>
    </motion.div>
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

function InsightsSkeleton() {
  return (
    <div role="status" aria-label="Loading insights">
      <div className="grid gap-4 sm:grid-cols-3">
        {["average", "savings", "trend"].map((key) => (
          <div key={key} className={WIDGET_CARD_CLASS}>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className={`${WIDGET_CARD_CLASS} lg:col-span-2`}>
          <Skeleton className="h-64 w-full" />
        </div>
        <div className={WIDGET_CARD_CLASS}>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function InsightsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={`${WIDGET_CARD_CLASS} flex flex-col items-start gap-4`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">
            Could not load your insights
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

interface TrendCard {
  value: string;
  delta: string;
  icon: LucideIcon;
}

/** The "vs last month" stat, phrased from the month-over-month expense change. */
function trendCard(insights: Insights): TrendCard {
  const change = insights.expenseChangePercent;

  if (change === null) {
    return {
      value: "—",
      delta: "No spending last month to compare",
      icon: TrendingDown,
    };
  }

  if (change < 0) {
    return {
      value: `−${Math.abs(change)}%`,
      delta: `Spent less than in ${insights.previousMonthName}`,
      icon: TrendingDown,
    };
  }

  if (change > 0) {
    return {
      value: `+${change}%`,
      delta: `Spent more than in ${insights.previousMonthName}`,
      icon: TrendingUp,
    };
  }

  return {
    value: "0%",
    delta: `Same as in ${insights.previousMonthName}`,
    icon: TrendingDown,
  };
}

function InsightsReady({ insights }: { insights: Insights }) {
  const reduced = usePrefersReducedMotion();
  const { format } = useCurrency();
  const trend = trendCard(insights);
  const TrendIcon = trend.icon;
  const maxTopAmount = insights.topCategories[0]?.amount ?? 1;
  const biggest = insights.biggestExpense;

  return (
    <motion.div
      key={`${insights.period.year}-${insights.period.month}`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Daily average"
          icon={<Wallet className="h-4 w-4" />}
          value={format(insights.averageDailySpend)}
          delta={`Spent per day in ${insights.monthName}`}
        />
        <StatCard
          label="Savings rate"
          icon={<PiggyBank className="h-4 w-4" />}
          value={`${insights.savingsRatePercent}%`}
          delta="Kept from everything you earned"
          delay={staggerDelay(1, 0.05, 0)}
        />
        <StatCard
          label="vs last month"
          icon={<TrendIcon className="h-4 w-4" />}
          value={trend.value}
          delta={trend.delta}
          delay={staggerDelay(2, 0.05, 0)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className={`${WIDGET_CARD_CLASS} lg:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text">Top categories</h2>
            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
              By spending
            </span>
          </div>

          {insights.topCategories.length === 0 ? (
            <p className="mt-5 text-sm text-text-muted">
              No spending recorded for {insights.monthName} yet.
            </p>
          ) : (
            <ul className="mt-5 flex flex-col gap-5">
              {insights.topCategories.map((item, index) => (
                <motion.li
                  key={item.categoryId}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: staggerDelay(index, 0.05, 0.05),
                    ease: EASE,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium text-text">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.categoryColor }}
                      />
                      {item.categoryName}
                    </span>
                    <span className="text-text-secondary tabular-nums">
                      {format(item.amount)}
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
                        ease: EASE,
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.categoryColor }}
                    />
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className={`${WIDGET_CARD_CLASS} !p-4`}>
            <ChartVisual className="h-44 w-full" />
            <p className="mt-3 text-center text-xs text-text-muted">
              Spending snapshot
            </p>
          </div>

          <div className={WIDGET_CARD_CLASS}>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Biggest single expense
            </p>
            {biggest === null ? (
              <p className="mt-2 text-sm text-text-muted">
                No expenses recorded for {insights.monthName} yet.
              </p>
            ) : (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-text tabular-nums">
                  {format(biggest.amount)}
                </p>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  {biggest.note}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: biggest.categoryColor }}
                  />
                  {biggest.categoryName} · {biggest.occurredOn}
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      <section className={`${WIDGET_CARD_CLASS} mt-4`}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-text">Notes for you</h2>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {insights.notes.map((note, index) => (
            <motion.li
              key={note}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: staggerDelay(index, 0.06, 0.1),
                ease: EASE,
              }}
              className="flex items-start gap-3 rounded-xl bg-surface-subtle px-4 py-3 text-sm text-text-secondary"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {note}
            </motion.li>
          ))}
        </ul>
      </section>
    </motion.div>
  );
}

export function InsightsView() {
  const { status, data, error, reload } = useUserData();
  const reduced = usePrefersReducedMotion();
  const period = useMemo(() => currentPeriod(new Date()), []);
  const insights = useMemo(
    () => (data ? buildInsights(data, period) : null),
    [data, period],
  );
  const monthLabel =
    insights?.monthLabel ?? formatMonthLabel(period.year, period.month);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={monthLabel}
          title="Insights"
          description="Smart observations about how you spend — from your own history."
        />

        <AnimatePresence mode="wait">
          {status === "error" ? (
            <motion.div
              key="error"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <InsightsError
                message={
                  error?.message ??
                  "Something went wrong while loading your insights."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : insights === null ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <InsightsSkeleton />
            </motion.div>
          ) : (
            <InsightsReady insights={insights} />
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
