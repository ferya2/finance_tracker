"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { CategoryFormModal } from "@/components/dashboard/category-form-modal";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { Snackbar } from "@/components/dashboard/snackbar";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import {
  canDeleteCategory,
  describeCategoryDelete,
  describeDeletedCategory,
  planCategoryDelete,
} from "@/lib/finance/category-delete";
import {
  buildCategorySummaries,
  type CategorySummaryRow,
} from "@/lib/finance/category-summary";
import { formatCurrency } from "@/lib/finance/format";
import { currentPeriod, formatMonthLabel } from "@/lib/finance/period";
import { deleteCategory } from "@/lib/supabase/categories";
import { reassignTransactions } from "@/lib/supabase/transactions";
import type { Category } from "@/types/category";

/** How many shimmering placeholder cards stand in for the grid while loading. */
const SKELETON_CARDS = 6;

/** How long a notice stays up, with no action to offer. */
const NOTICE_DURATION_MS = 6_000;

/** What the snackbar at the foot of the page is currently saying. */
interface Notice {
  message: string;
  tone: "neutral" | "danger";
}

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
  onEdit,
  onDelete,
}: {
  category: CategorySummaryRow;
  index: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
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
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              income
                ? "bg-success-light text-success"
                : "bg-surface-subtle text-text-secondary"
            }`}
          >
            {income ? "Income" : "Expense"}
          </span>
          <motion.button
            type="button"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.name}`}
            title="Edit category"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onDelete(category)}
            aria-label={`Delete ${category.name}`}
            title="Delete category"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
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
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  /** The category waiting to be confirmed, then deleted. */
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
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

  /** What removing the chosen category involves — its rows and their new home. */
  const deletePlan = useMemo(
    () =>
      deleting === null || data === null
        ? null
        : planCategoryDelete(deleting, data.categories, data.transactions),
    [deleting, data],
  );

  function requestDelete(category: Category) {
    const plan =
      data === null
        ? null
        : planCategoryDelete(category, data.categories, data.transactions);

    if (plan === null || !canDeleteCategory(plan)) {
      setNotice({
        message: plan
          ? describeCategoryDelete(plan)
          : "Your categories are still loading. Try again in a moment.",
        tone: "danger",
      });
      return;
    }

    setDeleteError(null);
    setDeleting(category);
  }

  async function handleConfirmDelete() {
    if (deleting === null || deletePlan === null) return;

    const plan = deletePlan;
    setDeleteBusy(true);

    let failure: string | null = null;

    if (plan.linkedCount > 0 && plan.target) {
      const { error: reassignError } = await reassignTransactions(
        plan.category.id,
        plan.target.id,
      );
      if (reassignError) {
        failure = reassignError.message;
      }
    }

    if (failure === null) {
      const { error: deleteErr } = await deleteCategory(plan.category.id);
      if (deleteErr) {
        failure = deleteErr.message;
      }
    }

    setDeleteBusy(false);

    if (failure !== null) {
      setDeleteError(failure);
      return;
    }

    setDeleteError(null);
    setDeleting(null);
    setNotice({ message: describeDeletedCategory(plan), tone: "neutral" });
    reload();
  }

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
              onClick={() => setAdding(true)}
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
                      onEdit={(target) => setEditing(target)}
                      onDelete={requestDelete}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <CategoryFormModal
            onClose={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              reload();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing !== null && (
          <CategoryFormModal
            key={editing.id}
            category={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting !== null && deletePlan !== null && (
          <ConfirmDialog
            title="Delete this category?"
            description={describeCategoryDelete(deletePlan)}
            confirmLabel="Delete"
            cancelLabel="Keep it"
            tone="danger"
            busy={deleteBusy}
            busyLabel="Deleting…"
            error={deleteError}
            onConfirm={() => {
              void handleConfirmDelete();
            }}
            onCancel={() => {
              setDeleting(null);
              setDeleteError(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice !== null && (
          <Snackbar
            key={notice.message}
            message={notice.message}
            tone={notice.tone}
            duration={NOTICE_DURATION_MS}
            onDismiss={() => setNotice(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
