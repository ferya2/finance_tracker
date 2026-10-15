"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Pencil, PiggyBank, Plus, RefreshCw } from "lucide-react";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { Snackbar } from "@/components/dashboard/snackbar";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { BudgetFormModal } from "@/components/dashboard/budget-form-modal";
import { useUserData } from "@/components/use-user-data";
import {
  budgetAlertMessage,
  budgetAlerts,
} from "@/lib/finance/budget-alert";
import { budgetPressure, type BudgetPressure } from "@/lib/finance/budget";
import {
  buildBudgetSummaries,
  type BudgetSummaryRow,
} from "@/lib/finance/budget-summary";
import type { Budget } from "@/types/budget";
import { formatCurrency } from "@/lib/finance/format";
import { currentPeriod, formatMonthLabel } from "@/lib/finance/period";

/** How many shimmering placeholder cards stand in for the grid while loading. */
const SKELETON_CARDS = 6;

/** The chip and bar colour for a budget that is running out or already over. */
const pressureBarClass: Record<BudgetPressure, string> = {
  onTrack: "bg-primary",
  warning: "bg-warning",
  over: "bg-danger",
};

const pressureBadge: Record<
  Exclude<BudgetPressure, "onTrack">,
  { label: string; className: string }
> = {
  warning: { label: "Near limit", className: "bg-warning-light text-warning" },
  over: { label: "Over budget", className: "bg-danger-subtle text-danger" },
};

const pressureFooterClass: Record<BudgetPressure, string> = {
  onTrack: "text-text-muted",
  warning: "font-medium text-warning",
  over: "font-medium text-danger",
};

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
  onEdit,
}: {
  budget: BudgetSummaryRow;
  index: number;
  onEdit: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const over = budget.overBudget;
  const pressure = budgetPressure(budget);
  const badge = over ? pressureBadge.over : pressureBadge.warning;

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
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: budget.categoryColor }}
          />
          {budget.categoryName}
        </span>
        <div className="flex items-center gap-1.5">
          {pressure !== "onTrack" && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
          <motion.button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${budget.categoryName} budget`}
            title="Edit budget"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </motion.button>
        </div>
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
          className={`h-full rounded-full ${pressureBarClass[pressure]}`}
        />
      </div>

      <p
        className={`mt-2.5 text-xs ${pressureFooterClass[pressure]}`}
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
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const overCount = budgets?.filter((budget) => budget.overBudget).length ?? 0;

  const alerts = useMemo(
    () => (budgets ? budgetAlerts(budgets) : []),
    [budgets],
  );
  const alertMessage = budgetAlertMessage(alerts);
  // Remember the message that was waved away so a reload only re-raises the
  // alert when the month's numbers actually change.
  const [dismissedAlert, setDismissedAlert] = useState<string | null>(null);

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
              onClick={() => setAdding(true)}
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
                        onEdit={() => {
                          const original = data?.budgets.find((x) => x.id === budget.id);
                          if (original) setEditing(original);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {adding && data !== null && (
            <BudgetFormModal
              categories={data.categories}
              period={period}
              onClose={() => setAdding(false)}
              onSaved={() => {
                setAdding(false);
                reload();
              }}
            />
          )}
          {editing && data !== null && (
            <BudgetFormModal
              budget={editing}
              categories={data.categories}
              period={period}
              onClose={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                reload();
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {alertMessage !== null && alertMessage !== dismissedAlert && (
            <Snackbar
              key={alertMessage}
              message={alertMessage}
              tone="danger"
              onDismiss={() => setDismissedAlert(alertMessage)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
