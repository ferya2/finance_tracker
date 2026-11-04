"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Wallet, X } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  ACCOUNT_COLOR_PALETTE,
  ACCOUNT_KIND_OPTIONS,
  accountToFormValues,
  emptyAccountForm,
  MAX_ACCOUNT_NAME_LENGTH,
  toNewAccount,
  validateAccountForm,
  type AccountFormValues,
} from "@/lib/finance/account-form";
import { createAccount, updateAccount } from "@/lib/supabase/accounts";
import type { Account, AccountKind } from "@/types/account";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string };

type FieldName = "name" | "kind" | "openingBalance" | "color";

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface AccountFormModalProps {
  account?: Account;
  onClose: () => void;
  onSaved: (account: Account) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function AccountFormModal({
  account,
  onClose,
  onSaved,
}: AccountFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const editing = account !== undefined;
  const id = editing ? "edit-account" : "add-account";
  const [values, setValues] = useState<AccountFormValues>(() =>
    account ? accountToFormValues(account) : emptyAccountForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const nameRef = useRef<HTMLInputElement>(null);

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

  function update(patch: Partial<AccountFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    setStatus({ type: "idle" });
    if (started) {
      setFieldErrors(validateAccountForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateAccountForm(values));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateAccountForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { data, error } = account
      ? await updateAccount(account.id, toNewAccount(values))
      : await createAccount(toNewAccount(values));

    if (error || !data) {
      setStatus({
        type: "error",
        message: error?.message ?? "Could not save the account. Try again.",
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
                {editing ? "Edit account" : "New account"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Update the name, type, starting balance or colour."
                  : "Add a wallet, bank account or card to track."}
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
                key={values.color}
                initial={reduced ? false : { scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                style={{ backgroundColor: `${values.color}22`, color: values.color }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              >
                <Wallet className="h-6 w-6" />
              </motion.span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {values.name.trim() || "Your account"}
                </p>
                <p className="text-xs text-text-muted">
                  {
                    ACCOUNT_KIND_OPTIONS.find(
                      (option) => option.value === values.kind,
                    )?.label
                  }
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
                placeholder="e.g. Everyday checking"
                autoComplete="off"
                maxLength={MAX_ACCOUNT_NAME_LENGTH}
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
              <label htmlFor={`${id}-kind`} className="text-sm font-medium text-text">
                Type
              </label>
              <select
                id={`${id}-kind`}
                value={values.kind}
                onChange={(event) =>
                  update({ kind: event.target.value as AccountKind })
                }
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.kind)}
                aria-describedby={
                  fieldErrors.kind ? `${id}-kind-error` : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.kind ? errorInputClassName : ""
                }`}
              >
                {ACCOUNT_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError id={`${id}-kind-error`} message={fieldErrors.kind} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${id}-opening`}
                className="text-sm font-medium text-text"
              >
                Opening balance
              </label>
              <input
                id={`${id}-opening`}
                value={values.openingBalance}
                onChange={(event) =>
                  update({ openingBalance: event.target.value })
                }
                onBlur={handleBlur}
                placeholder="e.g. 2500.00"
                autoComplete="off"
                inputMode="decimal"
                aria-invalid={Boolean(fieldErrors.openingBalance)}
                aria-describedby={
                  fieldErrors.openingBalance
                    ? `${id}-opening-error`
                    : undefined
                }
                className={`${inputClassName} ${
                  fieldErrors.openingBalance ? errorInputClassName : ""
                }`}
              />
              <FieldError
                id={`${id}-opening-error`}
                message={fieldErrors.openingBalance}
              />
              <p className="text-xs text-text-muted">
                The balance before any tracked transactions.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Colour</span>
              <div
                role="group"
                aria-label="Account colour"
                className="flex flex-wrap gap-2"
              >
                {ACCOUNT_COLOR_PALETTE.map((swatch) => {
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
                    Saving...
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Create account"
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
