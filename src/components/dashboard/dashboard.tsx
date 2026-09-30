"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { buildDashboardData } from "@/lib/finance/dashboard";
import { currentPeriod, isoDate } from "@/lib/finance/period";

function Skeleton({ className }: { className: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: EASE }
      }
      className={`rounded-xl bg-surface-subtle ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {["h-32", "h-32", "h-32"].map((height) => (
          <div
            key={height}
            className={WIDGET_CARD_CLASS}
          >
            <Skeleton className={`w-full ${height}`} />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className={WIDGET_CARD_CLASS + " lg:col-span-3"}>
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className={WIDGET_CARD_CLASS}>
            <Skeleton className="h-40 w-full" />
          </div>
          <div className={WIDGET_CARD_CLASS}>
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`${WIDGET_CARD_CLASS} flex flex-col items-start gap-4`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">
            Could not load your dashboard
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
    </motion.div>
  );
}

export function Dashboard() {
  const { status, data, error, reload } = useUserData();
  const referenceDate = useMemo(() => isoDate(new Date()), []);
  const period = useMemo(() => currentPeriod(new Date()), []);
  const view = useMemo(
    () => (data ? buildDashboardData(data, period, referenceDate) : null),
    [data, period, referenceDate],
  );
  const reduced = usePrefersReducedMotion();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-8 space-y-2 sm:space-y-3">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0, ease: EASE }}
          className="text-xs font-semibold uppercase tracking-widest text-text-muted"
        >
          {view ? view.monthLabel : "This month"}
        </motion.p>
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
          className="text-2xl font-semibold tracking-tight text-text sm:text-3xl"
        >
          Overview
        </motion.h1>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
          className="max-w-2xl text-sm leading-6 text-text-secondary"
        >
          A snapshot of your money this month — updated as you go.
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        {status === "error" ? (
        <motion.div
          key="error"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <DashboardError
            message={error?.message ?? "Something went wrong while loading your data."}
            onRetry={reload}
          />
        </motion.div>
      ) : !view ? (
        <motion.div
          key="loading"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <DashboardSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="ready"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <SummaryCards cards={view.summaryCards} />

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentTransactions
                transactions={view.recent}
                total={view.recentTotal}
              />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <BudgetProgress rows={view.budgets} monthName={view.monthName} />
              <CategoryBreakdown rows={view.breakdown} />
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
