"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  emptyTransferForm,
  MAX_TRANSFER_NOTE_LENGTH,
  toNewTransfer,
  validateTransferForm,
  type TransferFormValues,
} from "@/lib/finance/transfer-form";
import { useCurrency } from "@/components/currency-provider";
import { parseAmount } from "@/lib/finance/format";
import type { Account } from "@/types/account";
import type { NewTransfer } from "@/types/transfer";

type FieldName =
  | "fromAccountId"
  | "toAccountId"
  | "amount"
  | "note"
  | "occurredOn";

const fieldClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface TransferFormModalProps {
  accounts: readonly Account[];
  referenceDate: string;
  onClose: () => void;
  onSaved: (transfer: NewTransfer) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function TransferFormModal({
  accounts,
  referenceDate,
  onClose,
  onSaved,
}: TransferFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const { format } = useCurrency();
  const [values, setValues] = useState<TransferFormValues>(() => {
    const base = emptyTransferForm(referenceDate);
    return {
      ...base,
      fromAccountId: accounts[0]?.id ?? "",
      toAccountId: accounts[1]?.id ?? "",
    };
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [started, setStarted] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const accountIds = accounts.map((account) => account.id);
  const from = accounts.find((account) => account.id === values.fromAccountId);
  const to = accounts.find((account) => account.id === values.toAccountId);
  const amount = parseAmount(values.amount);

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

  function update(patch: Partial<TransferFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    if (started) {
      setFieldErrors(validateTransferForm(next, accountIds));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateTransferForm(values, accountIds));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateTransferForm(values, accountIds);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    onSaved(toNewTransfer(values));
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
          aria-labelledby="transfer-title"
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id="transfer-title"
                className="text-lg font-semibold tracking-tight text-text"
              >
                Transfer money
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Move funds between two of your accounts.
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="transfer-from"
                  className="text-sm font-medium text-text"
                >
                  From
                </label>
                <select
                  id="transfer-from"
                  value={values.fromAccountId}
                  onChange={(event) =>
                    update({ fromAccountId: event.target.value })
                  }
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.fromAccountId)}
                  aria-describedby={
                    fieldErrors.fromAccountId
                      ? "transfer-from-error"
                      : undefined
                  }
                  className={`${fieldClassName} ${
                    fieldErrors.fromAccountId ? errorInputClassName : ""
                  }`}
                >
                  <option value="">Choose an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="transfer-from-error"
                  message={fieldErrors.fromAccountId}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="transfer-to"
                  className="text-sm font-medium text-text"
                >
                  To
                </label>
                <select
                  id="transfer-to"
                  value={values.toAccountId}
                  onChange={(event) =>
                    update({ toAccountId: event.target.value })
                  }
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.toAccountId)}
                  aria-describedby={
                    fieldErrors.toAccountId ? "transfer-to-error" : undefined
                  }
                  className={`${fieldClassName} ${
                    fieldErrors.toAccountId ? errorInputClassName : ""
                  }`}
                >
                  <option value="">Choose an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="transfer-to-error"
                  message={fieldErrors.toAccountId}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="transfer-amount"
                  className="text-sm font-medium text-text"
                >
                  Amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                    $
                  </span>
                  <input
                    id="transfer-amount"
                    ref={amountRef}
                    value={values.amount}
                    onChange={(event) => update({ amount: event.target.value })}
                    onBlur={handleBlur}
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.amount)}
                    aria-describedby={
                      fieldErrors.amount ? "transfer-amount-error" : undefined
                    }
                    className={`${fieldClassName} pl-9 ${
                      fieldErrors.amount ? errorInputClassName : ""
                    }`}
                  />
                </div>
                <FieldError
                  id="transfer-amount-error"
                  message={fieldErrors.amount}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="transfer-date"
                  className="text-sm font-medium text-text"
                >
                  Date
                </label>
                <input
                  id="transfer-date"
                  type="date"
                  value={values.occurredOn}
                  onChange={(event) =>
                    update({ occurredOn: event.target.value })
                  }
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.occurredOn)}
                  aria-describedby={
                    fieldErrors.occurredOn
                      ? "transfer-date-error"
                      : undefined
                  }
                  className={`${fieldClassName} ${
                    fieldErrors.occurredOn ? errorInputClassName : ""
                  }`}
                />
                <FieldError
                  id="transfer-date-error"
                  message={fieldErrors.occurredOn}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="transfer-note"
                className="text-sm font-medium text-text"
              >
                Note <span className="text-text-muted">(optional)</span>
              </label>
              <input
                id="transfer-note"
                value={values.note}
                onChange={(event) => update({ note: event.target.value })}
                onBlur={handleBlur}
                placeholder="e.g. Monthly savings"
                autoComplete="off"
                maxLength={MAX_TRANSFER_NOTE_LENGTH}
                aria-invalid={Boolean(fieldErrors.note)}
                aria-describedby={
                  fieldErrors.note ? "transfer-note-error" : undefined
                }
                className={`${fieldClassName} ${
                  fieldErrors.note ? errorInputClassName : ""
                }`}
              />
              <FieldError id="transfer-note-error" message={fieldErrors.note} />
            </div>

            {from && to && amount !== null && amount > 0 && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex items-center gap-3 rounded-2xl bg-surface-subtle px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                  <ArrowLeftRight className="h-4 w-4" />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-text">
                    {format(amount)} from {from.name} to {to.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {values.occurredOn}
                  </p>
                </div>
              </motion.div>
            )}

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
                Transfer
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
