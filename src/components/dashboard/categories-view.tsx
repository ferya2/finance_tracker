"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import {
  buildCategorySummaries,
  type CategorySummaryRow,
} from "@/lib/finance/category-summary";
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

function CategoriesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading categories"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className={WIDGET_CARD_CLASS}>
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="mt-4 h-3.5 w-1/2" />
          <Skeleton className="mt-3 h-3.5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function CategoriesError({
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
            Could not load your categories
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

function CategoryCard({
  category,
  index,
}: {
  category: CategorySummaryRow;
  index: number;
}) {
  const reduced = usePrefersReducedMotion();
  const income = category.kind === "income";

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
      whileHover={reduced ? undefined : { y: -3 }}
      className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          style={{ backgroundColor: `${category.color}22` }}
          className="flex h-11 w-11 items-center justify-center rounded-xl"
        >
          {income ? (
            <ArrowDownLeft style={{ color: category.color }} className="h-5 w-5" />
          ) : (
            <ArrowUpRight style={{ color: category.color }} className="h-5 w-5" />
          )}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            income
              ? "bg-success-light text-success"
              : "bg-surface-subtle text-text-secondary"
          }`}
        >
          {income ? "Income" : "Expense"}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text">{category.name}</h3>
      <p className="mt-1 text-sm text-text-secondary tabular-nums">
        {formatCurrency(category.total)}{" "}
        <span className="text-xs text-text-muted">this month</span>
      </p>
    </motion.div>
  );
}

export function CategoriesView() {
  const { status, data, error, reload } = useUserData();
  const reduced = usePrefersReducedMotion();
  const period = useMemo(() => currentPeriod(new Date()), []);
  const monthLabel = useMemo(
    () => formatMonthLabel(period.year, period.month),
    [period],
  );
  const categories = useMemo(
    () =>
      data
        ? buildCategorySummaries(data.transactions, data.categories, period)
        : null,
    [data, period],
  );

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={monthLabel}
          title="Categories"
          description="Organize every income and expense into clear, colorful categories."
          action={
            <button
              type="button"
              disabled={data === null}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            >
              <Plus className="h-4 w-4" />
              New category
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
              <CategoriesError
                message={
                  error?.message ??
                  "Something went wrong while loading your categories."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : categories === null ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <CategoriesSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {categories.length === 0 ? (
                <div className={`${WIDGET_CARD_CLASS} text-center`}>
                  <p className="text-sm font-medium text-text">
                    No categories yet
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Add your first category to start organizing your money.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category, index) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
