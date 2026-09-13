"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  DUMMY_CATEGORIES,
  DUMMY_CATEGORY_TOTALS,
  type DummyCategory,
} from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";

function totalFor(categoryId: string): number {
  return (
    DUMMY_CATEGORY_TOTALS.find((item) => item.categoryId === categoryId)
      ?.amount ?? 0
  );
}

function CategoryCard({
  category,
  index,
}: {
  category: DummyCategory;
  index: number;
}) {
  const reduced = usePrefersReducedMotion();
  const income = category.kind === "income";
  const total = totalFor(category.id);

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
        {formatCurrency(total)}{" "}
        <span className="text-xs text-text-muted">this month</span>
      </p>
    </motion.div>
  );
}

export function CategoriesView() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Categories"
          description="Organize every income and expense into clear, colorful categories."
          action={
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              New category
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DUMMY_CATEGORIES.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}