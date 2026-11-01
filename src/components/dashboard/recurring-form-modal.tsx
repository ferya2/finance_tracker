"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CalendarDays, Check, Repeat, Tag, X } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  describeFrequency,
  emptyRecurringForm,
  FREQUENCY_OPTIONS,
  recurringToFormValues,
  toNewRecurring,
  validateRecurringForm,
  type RecurringFormValues,
} from "@/lib/finance/recurring-form";
import { categoriesForType } from "@/lib/finance/transaction-form";
import { MAX_NOTE_LENGTH } from "@/lib/finance/transaction";
import type { Category } from "@/types/category";
import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/types/recurring";
import type { TransactionType } from "@/types/transaction";

type FieldName =
  | "amount"
  | "categoryId"
  | "note"
  | "startOn"
  | "frequency"
  | "interval"
  | "endOn";

const typeOptions: ReadonlyArray<{
  value: TransactionType;
  label: string;
}> = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const fieldClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const iconFieldClassName = `${fieldClassName} pl-11`;

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface RecurringFormModalProps {
  categories: readonly Category[];
  /** Today, as an ISO `YYYY-MM-DD` string — the date a new plan starts on. */
  referenceDate: string;
  /** The recurring transaction being corrected. Omit it to create a new one. */
  recurring?: RecurringTransaction;
  onClose: () => void;
  onSaved: (recurring: NewRecurringTransaction) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

/**
 * A modal form for a repeating income or expense: type, amount, category, note,
 * start day, frequency, interval and an optional end day. Pass a `recurring`
 * entry to correct one that already exists, or omit it to create a new plan.
 * The values are checked by the pure `lib/finance` {@link validateRecurringForm}
 * before the caller stores them.
 */
export function RecurringFormModal({
  categories,
  referenceDate,
  recurring,
  onClose,
  onSaved,
}: RecurringFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const editing = recurring !== undefined;
  const id = editing ? "edit-recurring" : "add-recurring";
  const [values, setValues] = useState<RecurringFormValues>(() =>
    recurring
      ? recurringToFormValues(recurring)
      : emptyRecurringForm(referenceDate),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [started, setStarted] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  const options = useMemo(
    () => categoriesForType(categories, values.type),
    [categories, values.type],
  );

  const interval = Number(values.interval.trim());
  const scheduleLabel = describeFrequency(
    values.frequency,
    Number.isFinite(interval) && interval >= 1 ? interval : 1,
  );

  useEffect(() => {
    if (!isClient) return;

    amountRef.current?.focus();

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

  function update(patch: Partial<RecurringFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    if (started) {
      setFieldErrors(validateRecurringForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateRecurringForm(values));
  }

  function handleTypeChange(type: TransactionType) {
    const available = categoriesForType(categories, type);
    const stillValid = available.some(
      (category) => category.id === values.categoryId,
    );
    update({ type, categoryId: stillValid ? values.categoryId : "" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateRecurringForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    onSaved(toNewRecurring(values));
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
          className="pointer-events-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id={`${id}-title`}
                className="text-lg font-semibold tracking-tight text-text"
              >
                {editing ? "Edit recurring plan" : "New recurring plan"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Adjust the amount or schedule."
                  : "Set up an income or expense that repeats."}
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

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Type</span>
              <SegmentedControl
                name={`${id}-type`}
                ariaLabel="Recurring transaction type"
                options={typeOptions}
                value={values.type}
                onChange={handleTypeChange}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-amount`}
                  className="text-sm font-medium text-text"
                >
                  Amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                    $
                  </span>
                  <input
                    id={`${id}-amount`}
                    ref={amountRef}
                    value={values.amount}
                    onChange={(event) => update({ amount: event.target.value })}
                    onBlur={handleBlur}
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.amount)}
                    aria-describedby={
                      fieldErrors.amount ? `${id}-amount-error` : undefined
                    }
                    className={`${iconFieldClassName} ${
                      fieldErrors.amount ? errorInputClassName : ""
                    }`}
                  />
                </div>
                <FieldError
                  id={`${id}-amount-error`}
                  message={fieldErrors.amount}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-category`}
                  className="text-sm font-medium text-text"
                >
                  Category
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <select
                    id={`${id}-category`}
                    value={values.categoryId}
                    onChange={(event) =>
                      update({ categoryId: event.target.value })
                    }
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.categoryId)}
                    aria-describedby={
                      fieldErrors.categoryId
                        ? `${id}-category-error`
                        : undefined
                    }
                    className={`${iconFieldClassName} appearance-none ${
                      fieldErrors.categoryId ? errorInputClassName : ""
                    }`}
                  >
                    <option value="">Choose a category</option>
                    {options.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldError
                  id={`${id}-category-error`}
                  message={fieldErrors.categoryId}
                />
                {options.length === 0 && (
                  <p className="text-xs text-text-muted">
                    Create a category first to attach this plan.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${id}-note`}
                className="text-sm font-medium text-text"
              >
                Note <span className="text-text-muted">(optional)</span>
              </label>
              <input
                id={`${id}-note`}
                value={values.note}
                onChange={(event) => update({ note: event.target.value })}
                onBlur={handleBlur}
                placeholder="e.g. Rent, Salary, Gym"
                autoComplete="off"
                maxLength={MAX_NOTE_LENGTH}
                aria-invalid={Boolean(fieldErrors.note)}
                aria-describedby={
                  fieldErrors.note ? `${id}-note-error` : undefined
                }
                className={`${fieldClassName} ${
                  fieldErrors.note ? errorInputClassName : ""
                }`}
              />
              <FieldError id={`${id}-note-error`} message={fieldErrors.note} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-start`}
                  className="text-sm font-medium text-text"
                >
                  First occurrence
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id={`${id}-start`}
                    type="date"
                    value={values.startOn}
                    onChange={(event) =>
                      update({ startOn: event.target.value })
                    }
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.startOn)}
                    aria-describedby={
                      fieldErrors.startOn ? `${id}-start-error` : undefined
                    }
                    className={`${iconFieldClassName} ${
                      fieldErrors.startOn ? errorInputClassName : ""
                    }`}
                  />
                </div>
                <FieldError
                  id={`${id}-start-error`}
                  message={fieldErrors.startOn}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-end`}
                  className="text-sm font-medium text-text"
                >
                  End date <span className="text-text-muted">(optional)</span>
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id={`${id}-end`}
                    type="date"
                    value={values.endOn}
                    onChange={(event) => update({ endOn: event.target.value })}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.endOn)}
                    aria-describedby={
                      fieldErrors.endOn ? `${id}-end-error` : undefined
                    }
                    className={`${iconFieldClassName} ${
                      fieldErrors.endOn ? errorInputClassName : ""
                    }`}
                  />
                </div>
                <FieldError id={`${id}-end-error`} message={fieldErrors.endOn} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-frequency`}
                  className="text-sm font-medium text-text"
                >
                  Frequency
                </label>
                <select
                  id={`${id}-frequency`}
                  value={values.frequency}
                  onChange={(event) =>
                    update({
                      frequency: event.target.value as RecurringFormValues["frequency"],
                    })
                  }
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.frequency)}
                  aria-describedby={
                    fieldErrors.frequency ? `${id}-frequency-error` : undefined
                  }
                  className={`${fieldClassName} appearance-none ${
                    fieldErrors.frequency ? errorInputClassName : ""
                  }`}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError
                  id={`${id}-frequency-error`}
                  message={fieldErrors.frequency}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-interval`}
                  className="text-sm font-medium text-text"
                >
                  Repeat every
                </label>
                <input
                  id={`${id}-interval`}
                  type="number"
                  min={1}
                  step={1}
                  value={values.interval}
                  onChange={(event) => update({ interval: event.target.value })}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.interval)}
                  aria-describedby={
                    fieldErrors.interval ? `${id}-interval-error` : undefined
                  }
                  className={`${fieldClassName} ${
                    fieldErrors.interval ? errorInputClassName : ""
                  }`}
                />
                <FieldError
                  id={`${id}-interval-error`}
                  message={fieldErrors.interval}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-surface-subtle px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <Repeat className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{scheduleLabel}</p>
                <p className="text-xs text-text-muted">
                  {values.endOn.trim().length > 0
                    ? `Until ${values.endOn}`
                    : "Repeats until you stop it"}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-medium text-text transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileHover={reduced ? undefined : { scale: 1.01 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity"
              >
                <Check className="h-4 w-4" />
                {editing ? "Save changes" : "Create plan"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
