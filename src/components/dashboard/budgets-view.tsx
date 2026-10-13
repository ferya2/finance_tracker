"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, PiggyBank, Plus, RefreshCw } from "lucide-react";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import {
  buildBudgetSummaries,
  type BudgetSummaryRow,
} from "@/lib/finance/budget-summary";
import { formatCurrency } from "@/lib/finance/format";
import { currentPeriod, formatMonthLabel } from "@/lib/finance/period";

/** How many shimmering placeholder cards stand in for the grid while loading. */
const SKELETON_CARDS = 6;

function Skeleton({ className }: { className: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: EASE }
      }
      className={`block rounded-full bg-surface-subtle ${className}`}
    />
  );
}

function BudgetsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading budgets"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className={WIDGET_CARD_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="mt-3 h-3.5 w-2/3" />
          <Skeleton className="mt-3 h-2.5 w-full" />
          <Skeleton className="mt-3 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function BudgetsError({
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
            Could not load your budgets
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

function BudgetCard({
  budget,
  index,
}: {
  budget: BudgetSummaryRow;
  index: number;
}) {
  const reduced = usePrefersReducedMotion();
  const over = budget.overBudget;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: EASE,
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: budget.categoryColor }}
          />
          {budget.categoryName}
        </span>
        {over && (
          <span className="rounded-full bg-danger-subtle px-2.5 py-1 text-xs font-medium text-danger">
            Over budget
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-text-secondary tabular-nums">
          <span className="font-medium text-text">
            {formatCurrency(budget.spent)}
          </span>
          <span className="text-text-muted"> / {formatCurrency(budget.limit)}</span>
        </span>
        <span className="text-xs text-text-muted">{budget.percent}%</span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-subtle">
        <motion.div
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${Math.min(Math.max(budget.percent, 0), 100)}%` }}
          transition={{
            duration: 0.8,
            delay: 0.2 + index * 0.05,
            ease: EASE,
          }}
          className={`h-full rounded-full ${over ? "bg-danger" : "bg-primary"}`}
        />
      </div>

      <p
        className={`mt-2.5 text-xs ${
          over ? "font-medium text-danger" : "text-text-muted"
        }`}
      >
        {over
          ? `Over by ${formatCurrency(Math.abs(budget.remaining))}`
          : `${formatCurrency(budget.remaining)} left this month`}
      </p>
    </motion.div>
  );
}

export function BudgetsView() {
  const { status, data, error, reload } = useUserData();
  const reduced = usePrefersReducedMotion();
  const period = useMemo(() => currentPeriod(new Date()), []);
  const monthLabel = useMemo(
    () => formatMonthLabel(period.year, period.month),
    [period],
  );
  const budgets = useMemo(
    () =>
      data
        ? buildBudgetSummaries(
            data.budgets,
            data.transactions,
            data.categories,
            period,
          )
        : null,
    [data, period],
  );
  const overCount = budgets?.filter((budget) => budget.overBudget).length ?? 0;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={monthLabel}
          title="Budgets"
          description="Set a monthly limit per category and keep spending on track."
          action={
            <button
              type="button"
              disabled={data === null}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            >
              <Plus className="h-4 w-4" />
              Set budget
            </button>
          }
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
              <BudgetsError
                message={
                  error?.message ??
                  "Something went wrong while loading your budgets."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : budgets === null ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <BudgetsSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {budgets.length === 0 ? (
                <div className={`${WIDGET_CARD_CLASS} text-center`}>
                  <p className="text-sm font-medium text-text">
                    No budgets for {monthLabel}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Set a monthly limit per category to track your spending.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary">
                      <PiggyBank className="h-3.5 w-3.5 text-primary" />
                      {budgets.length} tracked budgets
                    </span>
                    <span className="text-xs text-text-muted">
                      {overCount} need attention
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {budgets.map((budget, index) => (
                      <BudgetCard
                        key={budget.id}
                        budget={budget}
                        index={index}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
