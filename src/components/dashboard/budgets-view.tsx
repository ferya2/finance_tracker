"use client";

import { motion } from "framer-motion";
import { PiggyBank, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { DUMMY_BUDGETS, getDummyCategory } from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";

function BudgetCard({
  budget,
  index,
}: {
  budget: (typeof DUMMY_BUDGETS)[number];
  index: number;
}) {
  const reduced = usePrefersReducedMotion();
  const category = getDummyCategory(budget.categoryId);
  const over = budget.percent > 100;
  const remaining = budget.limit - budget.spent;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: category?.color }}
          />
          {category?.name}
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
          animate={{ width: `${Math.min(budget.percent, 100)}%` }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
          className={`h-full rounded-full ${over ? "bg-danger" : "bg-primary"}`}
        />
      </div>

      <p
        className={`mt-2.5 text-xs ${
          over ? "font-medium text-danger" : "text-text-muted"
        }`}
      >
        {over
          ? `Over by ${formatCurrency(Math.abs(remaining))}`
          : `${formatCurrency(remaining)} left this month`}
      </p>
    </motion.div>
  );
}

export function BudgetsView() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Budgets"
          description="Set a monthly limit per category and keep spending on track."
          action={
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Set budget
            </button>
          }
        />

        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary">
            <PiggyBank className="h-3.5 w-3.5 text-primary" />
            {DUMMY_BUDGETS.length} tracked budgets
          </span>
          <span className="text-xs text-text-muted">
            {DUMMY_BUDGETS.filter((budget) => budget.percent > 100).length} need
            attention
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DUMMY_BUDGETS.map((budget, index) => (
            <BudgetCard key={budget.id} budget={budget} index={index} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}