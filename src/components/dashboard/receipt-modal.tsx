"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  FileImage,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  formatReceiptSize,
  RECEIPT_ACCEPT,
  validateReceiptFile,
} from "@/lib/finance/receipt";
import {
  deleteReceipt,
  getReceiptUrls,
  listReceipts,
  uploadReceipt,
} from "@/lib/supabase/receipts";
import type { Receipt } from "@/types/receipt";
import type { Transaction } from "@/types/transaction";

interface ReceiptView extends Receipt {
  url?: string;
}

type Status = "loading" | "ready" | "error";

interface ReceiptModalProps {
  transaction: Transaction;
  userId: string;
  onClose: () => void;
  onChanged?: (message: string, tone?: "neutral" | "danger") => void;
}

function ReceiptPreview({
  receipt,
  busy,
  reduced,
  onRemove,
}: {
  receipt: ReceiptView;
  busy: boolean;
  reduced: boolean;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted"
    >
      {receipt.url ? (
        <div className="relative aspect-[4/3] w-full bg-surface-subtle">
          <Image
            src={receipt.url}
            alt={`Receipt: ${receipt.fileName}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 90vw, 380px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface-subtle text-text-muted">
          <FileImage className="h-8 w-8" />
        </div>
      )}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileImage className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">
            {receipt.fileName}
          </p>
          <p className="text-xs text-text-muted">
            {formatReceiptSize(receipt.size)}
          </p>
        </div>
        {receipt.url && (
          <a
            href={receipt.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            View
          </a>
        )}
      </div>
      <motion.button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label={`Remove ${receipt.fileName}`}
        title="Remove receipt"
        whileHover={reduced || busy ? undefined : { scale: 1.08 }}
        whileTap={reduced || busy ? undefined : { scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-text-muted shadow-sm backdrop-blur transition-colors hover:bg-danger-subtle hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

/**
 * Upload, preview and remove image receipts for one transaction. Receipts live
 * in the `receipts` Storage bucket under `<user>/<transaction>/`, so they are
 * attached to the transaction without needing a schema change.
 */
export function ReceiptModal({
  transaction,
  userId,
  onClose,
  onChanged,
}: ReceiptModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<ReceiptView[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    void listReceipts(userId, transaction.id).then(async (result) => {
      if (!active) return;

      if (result.error || !result.data) {
        setStatus("error");
        setError(result.error?.message ?? "Could not load receipts.");
        return;
      }

      const paths = result.data.map((receipt) => receipt.path);
      const urls =
        paths.length > 0
          ? await getReceiptUrls(paths)
          : { data: {}, error: null };

      if (!active) return;

      setReceipts(
        result.data.map((receipt) => ({
          ...receipt,
          url: urls.data?.[receipt.path],
        })),
      );
      setStatus("ready");
    });

    return () => {
      active = false;
    };
  }, [reloadKey, transaction.id, userId]);

  function refresh() {
    setStatus("loading");
    setError(null);
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!isClient) return;

    panelRef.current?.focus();

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

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validateReceiptFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.valid) {
      setError(validation.errors[0] ?? "That file cannot be used.");
      return;
    }

    setBusy(true);
    setError(null);

    const { data, error: uploadError } = await uploadReceipt({
      userId,
      transactionId: transaction.id,
      file,
      timestamp: Date.now(),
    });

    if (uploadError || !data) {
      setBusy(false);
      setError(uploadError?.message ?? "Could not upload the receipt.");
      return;
    }

    setBusy(false);
    setReloadKey((key) => key + 1);
    onChanged?.("Receipt uploaded.");
  }

  async function handleRemove(receipt: ReceiptView) {
    setBusy(true);
    setError(null);

    const { error: removeError } = await deleteReceipt(receipt.path);

    if (removeError) {
      setBusy(false);
      setError(removeError.message || "Could not remove the receipt.");
      return;
    }

    setBusy(false);
    setReloadKey((key) => key + 1);
    onChanged?.("Receipt removed.");
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
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
          tabIndex={-1}
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 outline-none sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="receipt-modal-title"
                className="text-lg font-semibold tracking-tight text-text"
              >
                Receipts
              </h2>
              <p className="mt-1 truncate text-sm text-text-secondary">
                {transaction.note?.trim() || "This transaction"}
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

          <div className="flex flex-col gap-3">
            {status === "loading" && (
              <div
                role="status"
                aria-label="Loading receipts"
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-10 text-sm text-text-muted"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading receipts…
              </div>
            )}

            {status === "error" && (
              <div className="rounded-2xl border border-danger/30 bg-danger-subtle px-4 py-4">
                <p className="flex items-start gap-2 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    refresh();
                  }}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            )}

            {status === "ready" && (
              <>
                <AnimatePresence initial={false} mode="popLayout">
                  {receipts.map((receipt) => (
                    <ReceiptPreview
                      key={receipt.path}
                      receipt={receipt}
                      busy={busy}
                      reduced={reduced}
                      onRemove={() => {
                        void handleRemove(receipt);
                      }}
                    />
                  ))}
                </AnimatePresence>

                {receipts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                      <FileImage className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-text">
                      No receipt yet
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      Attach a photo of the receipt for your records.
                    </p>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept={RECEIPT_ACCEPT}
                  onChange={(event) => {
                    void handleFile(event);
                  }}
                  className="sr-only"
                  aria-label="Upload receipt image"
                />
                <motion.button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  whileHover={reduced || busy ? undefined : { scale: 1.01 }}
                  whileTap={reduced || busy ? undefined : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload receipt
                    </>
                  )}
                </motion.button>
              </>
            )}

            <AnimatePresence initial={false}>
              {status === "ready" && error && (
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

            <p className="text-center text-xs text-text-muted">
              JPG, PNG, WebP, HEIC or HEIF · up to 5 MB
            </p>
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
