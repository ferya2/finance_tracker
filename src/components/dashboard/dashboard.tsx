"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { buildDashboardData } from "@/lib/finance/dashboard";
import { currentPeriod } from "@/lib/finance/period";

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
          : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
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
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <Skeleton className={`w-full ${height}`} />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-3">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
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
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
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
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </motion.div>
  );
}

export function Dashboard() {
  const { status, data, error, reload } = useUserData();
  const period = useMemo(() => currentPeriod(new Date()), []);
  const view = useMemo(
    () => (data ? buildDashboardData(data, period) : null),
    [data, period],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          {view ? view.monthLabel : "This month"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Overview
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          A snapshot of your money this month — updated as you go.
        </p>
      </header>

      {status === "error" ? (
        <DashboardError
          message={error?.message ?? "Something went wrong while loading your data."}
          onRetry={reload}
        />
      ) : !view ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Balance"
              value={view.summary.totalBalance}
              caption="All time"
              icon={Wallet}
              tone="primary"
            />
            <SummaryCard
              label="Income"
              value={view.summary.monthlyIncome}
              caption={view.monthName}
              icon={TrendingUp}
              tone="success"
              delay={0.05}
            />
            <SummaryCard
              label="Expense"
              value={view.summary.monthlyExpense}
              caption={view.monthName}
              icon={TrendingDown}
              tone="danger"
              delay={0.1}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentTransactions transactions={view.recent} />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <BudgetProgress rows={view.budgets} monthName={view.monthName} />
              <CategoryBreakdown rows={view.breakdown} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
