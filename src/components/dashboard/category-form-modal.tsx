"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  CATEGORY_COLOR_PALETTE,
  categoryToFormValues,
  emptyCategoryForm,
  MAX_CATEGORY_NAME_LENGTH,
  toNewCategory,
  validateCategoryForm,
  type CategoryFormValues,
} from "@/lib/finance/category-form";
import { createCategory, updateCategory } from "@/lib/supabase/categories";
import type { Category } from "@/types/category";
import type { TransactionType } from "@/types/transaction";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string };

type FieldName = "name" | "color";

const kindOptions: ReadonlyArray<{ value: TransactionType; label: string }> = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface CategoryFormModalProps {
  /** The category being corrected. Omit it to create a new one instead. */
  category?: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
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
 * A modal form for one category: its name, whether it is income or expense, and
 * a colour picked from {@link CATEGORY_COLOR_PALETTE}. Pass a `category` to edit
 * one that is already saved — the form opens prefilled and the change is written
 * back over it — or omit it to create a new one. Either way the values are
 * checked by the pure `lib/finance` {@link validateCategoryForm} before the row
 * is written, and the saved category is handed back so the caller can refresh.
 */
export function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: CategoryFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const editing = category !== undefined;
  /** Element ids are namespaced per mode so the two forms never collide. */
  const id = editing ? "edit-category" : "add-category";
  const [values, setValues] = useState<CategoryFormValues>(() =>
    category ? categoryToFormValues(category) : emptyCategoryForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  /** Once the user has left a field or pressed save, messages stay live. */
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const nameRef = useRef<HTMLInputElement>(null);
  const income = values.kind === "income";

  // The portal body only exists once the client has hydrated, so the focus, the
  // scroll lock and the Escape key all wait for it.
  useEffect(() => {
    if (!isClient) return;

    nameRef.current?.focus();

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

  function update(patch: Partial<CategoryFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    setStatus({ type: "idle" });
    if (started) {
      setFieldErrors(validateCategoryForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateCategoryForm(values));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateCategoryForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { data, error } = category
      ? await updateCategory(category.id, toNewCategory(values))
      : await createCategory(toNewCategory(values));

    if (error || !data) {
      setStatus({
        type: "error",
        message: error?.message ?? "Could not save the category. Try again.",
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
                {editing ? "Edit category" : "New category"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Rename it or give it a fresh look."
                  : "Give it a name, a type and a colour."}
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
                key={`${values.color}-${values.kind}`}
                initial={reduced ? false : { scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                style={{ backgroundColor: `${values.color}22`, color: values.color }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              >
                {income ? (
                  <ArrowDownLeft className="h-6 w-6" />
                ) : (
                  <ArrowUpRight className="h-6 w-6" />
                )}
              </motion.span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {values.name.trim() || "Your category"}
                </p>
                <p className="text-xs text-text-muted">
                  {income ? "Income" : "Expense"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-name`} className="text-sm font-medium text-text">
                Name
              </label>
              <input
                id={`${id}-name`}
                ref={nameRef}
                value={values.name}
                onChange={(event) => update({ name: event.target.value })}
                onBlur={handleBlur}
                placeholder="e.g. Groceries"
                autoComplete="off"
                maxLength={MAX_CATEGORY_NAME_LENGTH}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={
                  fieldErrors.name ? `${id}-name-error` : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.name ? errorInputClassName : ""
                }`}
              />
              <FieldError id={`${id}-name-error`} message={fieldErrors.name} />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Type</span>
              <SegmentedControl
                name={`${id}-kind`}
                ariaLabel="Category type"
                options={kindOptions}
                value={values.kind}
                onChange={(kind) => update({ kind })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Colour</span>
              <div
                role="group"
                aria-label="Category colour"
                className="flex flex-wrap gap-2"
              >
                {CATEGORY_COLOR_PALETTE.map((swatch) => {
                  const selected =
                    swatch.toLowerCase() === values.color.toLowerCase();
                  return (
                    <motion.button
                      key={swatch}
                      type="button"
                      onClick={() => update({ color: swatch })}
                      aria-label={`Colour ${swatch}`}
                      aria-pressed={selected}
                      whileHover={reduced ? undefined : { scale: 1.12 }}
                      whileTap={reduced ? undefined : { scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      style={{ backgroundColor: swatch }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {selected && (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <FieldError id={`${id}-color-error`} message={fieldErrors.color} />
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

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  "Create category"
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
