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
import { CalendarDays, Check, Target, X } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useCurrency } from "@/components/currency-provider";
import { parseAmount } from "@/lib/finance/format";
import {
  GOAL_COLOR_PALETTE,
  MAX_GOAL_NAME_LENGTH,
  emptyGoalForm,
  goalToFormValues,
  toNewGoal,
  validateGoalForm,
  type GoalFormValues,
} from "@/lib/finance/goal-form";
import { goalProgress } from "@/lib/finance/goals";
import type { NewSavingsGoal, SavingsGoal } from "@/types/goal";

type FieldName =
  | "name"
  | "savedAmount"
  | "targetAmount"
  | "targetDate"
  | "color";

const fieldClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const iconFieldClassName = `${fieldClassName} pl-11`;

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface SavingsGoalFormModalProps {
  goal?: SavingsGoal;
  onClose: () => void;
  onSaved: (goal: NewSavingsGoal) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function SavingsGoalFormModal({
  goal,
  onClose,
  onSaved,
}: SavingsGoalFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const { format } = useCurrency();
  const editing = goal !== undefined;
  const id = editing ? "edit-goal" : "add-goal";
  const [values, setValues] = useState<GoalFormValues>(() =>
    goal ? goalToFormValues(goal) : emptyGoalForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [started, setStarted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(
    () =>
      goalProgress({
        savedAmount: parseAmount(values.savedAmount) ?? 0,
        targetAmount: parseAmount(values.targetAmount) ?? 0,
      }),
    [values.savedAmount, values.targetAmount],
  );

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

  function update(patch: Partial<GoalFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    if (started) {
      setFieldErrors(validateGoalForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateGoalForm(values));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateGoalForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    onSaved(toNewGoal(values));
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
                {editing ? "Edit savings goal" : "New savings goal"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Update how much you have saved or the target."
                  : "Set aside money for something that matters."}
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
              <label
                htmlFor={`${id}-name`}
                className="text-sm font-medium text-text"
              >
                Name
              </label>
              <div className="relative">
                <Target className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id={`${id}-name`}
                  ref={nameRef}
                  value={values.name}
                  onChange={(event) => update({ name: event.target.value })}
                  onBlur={handleBlur}
                  placeholder="Holiday, New laptop, Emergency fund…"
                  autoComplete="off"
                  maxLength={MAX_GOAL_NAME_LENGTH}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? `${id}-name-error` : undefined
                  }
                  className={`${iconFieldClassName} ${
                    fieldErrors.name ? errorInputClassName : ""
                  }`}
                />
              </div>
              <FieldError id={`${id}-name-error`} message={fieldErrors.name} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-target`}
                  className="text-sm font-medium text-text"
                >
                  Target amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                    $
                  </span>
                  <input
                    id={`${id}-target`}
                    value={values.targetAmount}
                    onChange={(event) =>
                      update({ targetAmount: event.target.value })
                    }
                    onBlur={handleBlur}
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.targetAmount)}
                    aria-describedby={
                      fieldErrors.targetAmount
                        ? `${id}-target-error`
                        : undefined
                    }
                    className={`${iconFieldClassName} ${
                      fieldErrors.targetAmount ? errorInputClassName : ""
                    }`}
                  />
                </div>
                <FieldError
                  id={`${id}-target-error`}
                  message={fieldErrors.targetAmount}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${id}-saved`}
                  className="text-sm font-medium text-text"
                >
                  Saved so far
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                    $
                  </span>
                  <input
                    id={`${id}-saved`}
                    value={values.savedAmount}
                    onChange={(event) =>
                      update({ savedAmount: event.target.value })
                    }
                    onBlur={handleBlur}
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.savedAmount)}
                    aria-describedby={
                      fieldErrors.savedAmount
                        ? `${id}-saved-error`
                        : undefined
                    }
                    className={`${iconFieldClassName} ${
                      fieldErrors.savedAmount ? errorInputClassName : ""
                    }`}
                  />
                </div>
                <FieldError
                  id={`${id}-saved-error`}
                  message={fieldErrors.savedAmount}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${id}-date`}
                className="text-sm font-medium text-text"
              >
                Target date <span className="text-text-muted">(optional)</span>
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id={`${id}-date`}
                  type="date"
                  value={values.targetDate}
                  onChange={(event) =>
                    update({ targetDate: event.target.value })
                  }
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.targetDate)}
                  aria-describedby={
                    fieldErrors.targetDate ? `${id}-date-error` : undefined
                  }
                  className={`${iconFieldClassName} ${
                    fieldErrors.targetDate ? errorInputClassName : ""
                  }`}
                />
              </div>
              <FieldError
                id={`${id}-date-error`}
                message={fieldErrors.targetDate}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Colour</span>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLOR_PALETTE.map((color) => {
                  const selected = values.color === color;
                  return (
                    <motion.button
                      key={color}
                      type="button"
                      onClick={() => update({ color })}
                      aria-label={`Use colour ${color}`}
                      aria-pressed={selected}
                      whileHover={reduced ? undefined : { scale: 1.1 }}
                      whileTap={reduced ? undefined : { scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      style={{ backgroundColor: color }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition-shadow ${
                        selected ? "ring-text" : "ring-transparent"
                      }`}
                    >
                      {selected && <Check className="h-4 w-4 text-white" />}
                    </motion.button>
                  );
                })}
              </div>
              <FieldError id={`${id}-color-error`} message={fieldErrors.color} />
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-surface-subtle px-4 py-3">
              <span
                style={{
                  backgroundColor: `${values.color}22`,
                  color: values.color,
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              >
                <Target className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text tabular-nums">
                  {format(preview.saved)} of{" "}
                  {format(preview.target)}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                  <motion.div
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${preview.percent}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                    style={{ backgroundColor: values.color }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-text tabular-nums">
                {preview.percent}%
              </span>
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
                {editing ? "Save changes" : "Create goal"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
