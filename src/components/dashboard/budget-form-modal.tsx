"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, PiggyBank, X } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  budgetToFormValues,
  budgetableCategories,
  buildMonthOptions,
  emptyBudgetForm,
  toBudgetUpdate,
  toNewBudget,
  validateBudgetForm,
  type BudgetFormValues,
} from "@/lib/finance/budget-form";
import { createBudget, updateBudget } from "@/lib/supabase/budgets";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import {
  formatMonthLabel,
  monthKey,
  type YearMonth,
} from "@/lib/finance/period";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string };

type FieldName = "categoryId" | "month" | "limitAmount";

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface BudgetFormModalProps {
  /** The budget being corrected. Omit it to create a new one instead. */
  budget?: Budget;
  categories: Category[];
  /** The month the form defaults to and starts its month options from. */
  period: YearMonth;
  onClose: () => void;
  onSaved: (budget: Budget) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

/** A modal form for setting a monthly budget on an expense category. */
export function BudgetFormModal({
  budget,
  categories,
  period,
  onClose,
  onSaved,
}: BudgetFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const editing = budget !== undefined;
  const id = editing ? "edit-budget" : "set-budget";
  const [values, setValues] = useState<BudgetFormValues>(() =>
    budget
      ? budgetToFormValues(budget)
      : emptyBudgetForm(monthKey(period.year, period.month)),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const limitRef = useRef<HTMLInputElement>(null);
  const expenseCategories = budgetableCategories(categories);
  const monthOptions = useMemo(() => {
    const options = buildMonthOptions(period.year, period.month);
    const saved = budget?.month;
    if (saved && !options.some((option) => option.value === saved)) {
      const [year, month] = saved.split("-").map(Number);
      return [
        { value: saved, label: formatMonthLabel(year, month) },
        ...options,
      ];
    }
    return options;
  }, [period, budget]);

  useEffect(() => {
    if (!isClient) return;

    limitRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClient, onClose]);

  function update(patch: Partial<BudgetFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    setStatus({ type: "idle" });
    if (started) {
      setFieldErrors(validateBudgetForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateBudgetForm(values));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateBudgetForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { data, error } = budget
      ? await updateBudget(budget.id, toBudgetUpdate(values))
      : await createBudget(toNewBudget(values));

    if (error || !data) {
      setStatus({
        type: "error",
        message: error?.message ?? "Could not save the budget. Try again.",
      });
      return;
    }

    onSaved(data);
  }

  if (!isClient) return null;

  return createPortal(
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id={`${id}-title`}
                className="text-lg font-semibold tracking-tight text-text"
              >
                {editing ? "Edit budget" : "Set budget"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Adjust the monthly limit for this category."
                  : "Choose a category, month, and monthly limit."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <motion.span
                initial={reduced ? false : { scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary"
              >
                <PiggyBank className="h-6 w-6" />
              </motion.span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {editing ? "Update budget" : "New budget"}
                </p>
                <p className="text-xs text-text-muted">
                  Track spending against a monthly limit
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-category`} className="text-sm font-medium text-text">
                Category
              </label>
              <select
                id={`${id}-category`}
                value={values.categoryId}
                onChange={(event) => update({ categoryId: event.target.value })}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.categoryId)}
                aria-describedby={
                  fieldErrors.categoryId ? `${id}-category-error` : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.categoryId ? errorInputClassName : ""
                }`}
              >
                <option value="">Select a category...</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FieldError id={`${id}-category-error`} message={fieldErrors.categoryId} />
              {expenseCategories.length === 0 && (
                <p className="text-xs text-text-muted">
                  No expense categories available. Create one first.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-month`} className="text-sm font-medium text-text">
                Month
              </label>
              <select
                id={`${id}-month`}
                value={values.month}
                onChange={(event) => update({ month: event.target.value })}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.month)}
                aria-describedby={
                  fieldErrors.month ? `${id}-month-error` : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.month ? errorInputClassName : ""
                }`}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError id={`${id}-month-error`} message={fieldErrors.month} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-limit`} className="text-sm font-medium text-text">
                Monthly limit
              </label>
              <input
                id={`${id}-limit`}
                ref={limitRef}
                value={values.limitAmount}
                onChange={(event) => update({ limitAmount: event.target.value })}
                onBlur={handleBlur}
                placeholder="e.g. 500.00"
                autoComplete="off"
                inputMode="decimal"
                aria-invalid={Boolean(fieldErrors.limitAmount)}
                aria-describedby={
                  fieldErrors.limitAmount ? `${id}-limit-error` : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.limitAmount ? errorInputClassName : ""
                }`}
              />
              <FieldError id={`${id}-limit-error`} message={fieldErrors.limitAmount} />
            </div>

            <AnimatePresence initial={false}>
              {status.type === "error" && (
                <motion.p
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {status.message}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-medium text-text transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status.type === "loading"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
              >
                {status.type === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editing ? "Save changes" : "Set budget"}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
