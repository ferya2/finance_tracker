"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  parseTransactionsCsv,
  type CsvImportResult,
} from "@/lib/finance/import-csv";
import { createTransactions } from "@/lib/supabase/transactions";
import type { Category } from "@/types/category";

/** How many rejected rows are spelled out before the rest are summarised. */
const MAX_VISIBLE_ERRORS = 5;

type Status = "idle" | "parsing" | "importing" | "error";

interface ImportCsvModalProps {
  categories: readonly Category[];
  onClose: () => void;
  /** Called with how many transactions were saved, once the insert succeeds. */
  onImported: (count: number) => void;
}

/**
 * Import transactions from a CSV file. The file is parsed and validated by the
 * pure {@link parseTransactionsCsv} — every valid row is inserted in one batch
 * and every rejected row is listed with its line number, so a mostly-good file
 * can still be imported without fixing it first.
 */
export function ImportCsvModal({
  categories,
  onClose,
  onImported,
}: ImportCsvModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = status === "parsing" || status === "importing";
  const readyCount = result?.transactions.length ?? 0;

  useEffect(() => {
    if (!isClient) return;

    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !busy) {
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
  }, [busy, isClient, onClose]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setStatus("parsing");
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      setResult(parseTransactionsCsv(text, categories));
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Could not read that file. Try a different CSV.");
    }
  }

  async function handleImport() {
    if (!result || result.transactions.length === 0) return;

    setStatus("importing");
    setError(null);

    const { data, error: importError } = await createTransactions(
      result.transactions,
    );

    if (importError || !data) {
      setStatus("error");
      setError(
        importError?.message ?? "Could not import those transactions. Try again.",
      );
      return;
    }

    onImported(data.length);
  }

  if (!isClient) return null;

  const hiddenErrors = (result?.errors.length ?? 0) - MAX_VISIBLE_ERRORS;

  return createPortal(
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={busy ? undefined : onClose}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-csv-title"
          tabIndex={-1}
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 outline-none sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id="import-csv-title"
                className="text-lg font-semibold tracking-tight text-text"
              >
                Import transactions
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Upload a CSV with Date, Type, Category, Note and Amount columns.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                void handleFile(event);
              }}
              className="sr-only"
              aria-label="Choose CSV file"
            />

            <motion.button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              whileHover={reduced || busy ? undefined : { scale: 1.01 }}
              whileTap={reduced || busy ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-8 text-center transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileUp className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-text">
                {fileName ?? "Choose a CSV file"}
              </span>
              <span className="text-xs text-text-muted">
                Nothing is saved until you press Import.
              </span>
            </motion.button>

            <AnimatePresence initial={false} mode="wait">
              {result && (
                <motion.div
                  key={fileName ?? "result"}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex flex-col gap-3"
                >
                  <div
                    className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
                      readyCount > 0
                        ? "bg-success-light text-success"
                        : "bg-surface-subtle text-text-secondary"
                    }`}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {readyCount > 0
                        ? `${readyCount} transaction${readyCount === 1 ? "" : "s"} ready to import`
                        : "No valid rows found"}
                      {result.errors.length > 0 &&
                        ` · ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} skipped`}
                    </span>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="rounded-xl border border-border bg-surface-muted px-3 py-2.5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Rows that need fixing
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {result.errors
                          .slice(0, MAX_VISIBLE_ERRORS)
                          .map((rowError) => (
                            <li
                              key={`${rowError.line}-${rowError.message}`}
                              className="flex items-start gap-2 text-xs text-text-secondary"
                            >
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                              <span>
                                <span className="font-medium text-text">
                                  Line {rowError.line}:
                                </span>{" "}
                                {rowError.message}
                              </span>
                            </li>
                          ))}
                      </ul>
                      {hiddenErrors > 0 && (
                        <p className="mt-2 text-xs text-text-muted">
                          …and {hiddenErrors} more.
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {status === "error" && error && (
                <motion.p
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={() => {
                  void handleImport();
                }}
                disabled={busy || readyCount === 0}
                whileHover={
                  reduced || busy || readyCount === 0
                    ? undefined
                    : { scale: 1.01 }
                }
                whileTap={
                  reduced || busy || readyCount === 0
                    ? undefined
                    : { scale: 0.98 }
                }
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "importing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : status === "parsing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {readyCount > 0 ? readyCount : ""}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
