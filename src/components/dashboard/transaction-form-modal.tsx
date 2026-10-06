"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { MAX_NOTE_LENGTH } from "@/lib/finance/transaction";
import {
  categoriesForType,
  emptyTransactionForm,
  toNewTransaction,
  toTransactionUpdate,
  transactionToFormValues,
  validateTransactionForm,
  type TransactionFormValues,
} from "@/lib/finance/transaction-form";
import { createTransaction, updateTransaction } from "@/lib/supabase/transactions";
import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string };

type FieldName = "amount" | "categoryId" | "occurredOn" | "note";

const typeOptions: ReadonlyArray<{
  value: TransactionType;
  label: string;
}> = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 pl-11 pr-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface TransactionFormModalProps {
  categories: readonly Category[];
  /** Today, as an ISO `YYYY-MM-DD` string — the date a new transaction starts on. */
  referenceDate: string;
  /** The transaction being corrected. Omit it to record a new one instead. */
  transaction?: Transaction;
  onClose: () => void;
  onSaved: (transaction: Transaction) => void;
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
 * A modal form for one income or expense: amount, category, day and an optional
 * note. Pass a `transaction` to correct one that is already saved — the form
 * opens prefilled and the change is written back over it — or omit it to record
 * a new one. Either way the values are checked by the pure `lib/finance`
 * {@link validateTransactionForm} before the row is written, and the saved
 * transaction is handed back so the caller can refresh its list.
 */
export function TransactionFormModal({
  categories,
  referenceDate,
  transaction,
  onClose,
  onSaved,
}: TransactionFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const editing = transaction !== undefined;
  /** Element ids are namespaced per mode so the two forms never collide. */
  const id = editing ? "edit-transaction" : "add-transaction";
  const [values, setValues] = useState<TransactionFormValues>(() =>
    transaction
      ? transactionToFormValues(transaction, categories)
      : emptyTransactionForm(referenceDate),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  /** Once the user has left a field or pressed save, messages stay live. */
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const amountRef = useRef<HTMLInputElement>(null);

  const options = useMemo(
    () => categoriesForType(categories, values.type),
    [categories, values.type],
  );

  // The portal body only exists once the client has hydrated, so the focus, the
  // scroll lock and the Escape key all wait for it.
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

  function update(patch: Partial<TransactionFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    setStatus({ type: "idle" });
    if (started) {
      setFieldErrors(validateTransactionForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateTransactionForm(values));
  }

  function handleTypeChange(type: TransactionType) {
    const available = categoriesForType(categories, type);
    const stillValid = available.some(
      (category) => category.id === values.categoryId,
    );
    update({ type, categoryId: stillValid ? values.categoryId : "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateTransactionForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { data, error } = transaction
      ? await updateTransaction(transaction.id, toTransactionUpdate(values))
      : await createTransaction(toNewTransaction(values));

    if (error || !data) {
      setStatus({
        type: "error",
        message: error?.message ?? "Could not save the transaction. Try again.",
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
                {editing ? "Edit transaction" : "Add transaction"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Correct the saved transaction."
                  : "Record an income or an expense."}
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
                ariaLabel="Transaction type"
                options={typeOptions}
                value={values.type}
                onChange={handleTypeChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-amount`} className="text-sm font-medium text-text">
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
                  className={`${inputClassName} ${
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
              <label htmlFor={`${id}-category`} className="text-sm font-medium text-text">
                Category
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <select
                  id={`${id}-category`}
                  value={values.categoryId}
                  onChange={(event) => update({ categoryId: event.target.value })}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.categoryId)}
                  aria-describedby={
                    fieldErrors.categoryId
                      ? `${id}-category-error`
                      : undefined
                  }
                  className={`${inputClassName} appearance-none ${
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
                  You have no categories yet — create one on the Categories page first.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-date`} className="text-sm font-medium text-text">
                Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id={`${id}-date`}
                  type="date"
                  value={values.occurredOn}
                  onChange={(event) => update({ occurredOn: event.target.value })}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.occurredOn)}
                  aria-describedby={
                    fieldErrors.occurredOn ? `${id}-date-error` : undefined
                  }
                  className={`${inputClassName} ${
                    fieldErrors.occurredOn ? errorInputClassName : ""
                  }`}
                />
              </div>
              <FieldError
                id={`${id}-date-error`}
                message={fieldErrors.occurredOn}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor={`${id}-note`}
                  className="text-sm font-medium text-text"
                >
                  Note
                </label>
                <span className="text-xs text-text-muted">optional</span>
              </div>
              <input
                id={`${id}-note`}
                value={values.note}
                onChange={(event) => update({ note: event.target.value })}
                onBlur={handleBlur}
                placeholder="What was it for?"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.note)}
                aria-describedby={
                  fieldErrors.note ? `${id}-note-error` : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.note ? errorInputClassName : ""
                }`}
              />
              <FieldError
                id={`${id}-note-error`}
                message={fieldErrors.note}
              />
              <p className="text-right text-xs text-text-muted tabular-nums">
                {values.note.length}/{MAX_NOTE_LENGTH}
              </p>
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

            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={status.type === "loading"}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={status.type === "loading"}
                whileHover={reduced ? undefined : { scale: 1.01 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:opacity-70"
              >
                {status.type === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Save transaction"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}