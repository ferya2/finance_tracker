"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

export interface ConfirmDialogProps {
  /** The question being asked — what is about to happen. */
  title: string;
  /** Supporting detail, e.g. which record the action affects. */
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` for anything destructive; `primary` for everything else. */
  tone?: "danger" | "primary";
  /** Shows a spinner, locks the buttons and blocks Escape while the action runs. */
  busy?: boolean;
  /** The label shown while `busy`. */
  busyLabel?: string;
  /** A failure to explain in place — the dialog stays open so the user can retry. */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A yes/no dialog for an action worth a second thought. It renders into a
 * portal so it floats above the page, locks the page behind it, closes on
 * Escape or a click on the backdrop, and keeps its answer on screen while the
 * action runs — `busy` then `error` mean a failure explains itself in place
 * instead of the dialog vanishing under the user.
 *
 * Render it inside an `AnimatePresence` so it can enter and leave.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  busyLabel = "Working…",
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);

  // The portal body only exists once the client has hydrated, so the focus and
  // the Escape key both wait for it.
  useEffect(() => {
    if (!isClient) return;

    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !busy) {
        onCancel();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, isClient, onCancel]);

  if (!isClient) return null;

  const confirmClassName =
    tone === "danger"
      ? "bg-danger text-white shadow-lg shadow-danger/25 hover:brightness-105"
      : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 motion-reduce:transform-none";

  return createPortal(
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={busy ? undefined : onCancel}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby={description ? "confirm-dialog-description" : undefined}
          tabIndex={-1}
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto w-full max-w-sm rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 outline-none sm:rounded-3xl dark:shadow-black/40"
        >
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold tracking-tight text-text"
          >
            {title}
          </h2>

          {description && (
            <p
              id="confirm-dialog-description"
              className="mt-2 text-sm text-text-secondary"
            >
              {description}
            </p>
          )}

          <AnimatePresence initial={false}>
            {error && (
              <motion.p
                initial={reduced ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <motion.button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              whileHover={reduced ? undefined : { scale: 1.01 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-opacity disabled:opacity-70 ${confirmClassName}`}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {busyLabel}
                </>
              ) : (
                confirmLabel
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
