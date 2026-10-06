"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

/** How long a message with no `duration` of its own stays up, in milliseconds. */
export const DEFAULT_SNACKBAR_DURATION_MS = 5_000;

/** The optional follow-up action in a snackbar — `Undo`, `Retry`, and so on. */
export interface SnackbarAction {
  label: string;
  /** What the button is doing instead of waiting, e.g. `"Restoring…"`. */
  busyLabel?: string;
  busy?: boolean;
  onClick: () => void;
}

export interface SnackbarProps {
  message: string;
  /** `danger` for a failure worth flagging, `neutral` for everything else. */
  tone?: "neutral" | "danger";
  action?: SnackbarAction;
  /** How long before it dismisses itself; `0` keeps it up until dismissed. */
  duration?: number;
  onDismiss: () => void;
}

/**
 * A single message anchored to the bottom of the screen — how a delete says
 * "gone" and offers to put it back. It renders into a portal so it floats
 * above the page, announces itself to a screen reader, and dismisses itself
 * after `duration`, except while the pointer or keyboard focus is on it, so a
 * snackbar never vanishes from under someone reaching for its action.
 *
 * Render it inside an `AnimatePresence` so it can enter and leave.
 */
export function Snackbar({
  message,
  tone = "neutral",
  action,
  duration = DEFAULT_SNACKBAR_DURATION_MS,
  onDismiss,
}: SnackbarProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const [paused, setPaused] = useState(false);
  const dismissRef = useRef(onDismiss);

  // The timer reads the latest handler through a ref, so a re-render with a new
  // inline callback cannot restart the countdown.
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // A new message gets the full window again; hovering or focusing it holds
  // the countdown where it is.
  useEffect(() => {
    if (duration <= 0 || paused) return;

    const timer = setTimeout(() => dismissRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration, message, paused]);

  if (!isClient) return null;

  const danger = tone === "danger";

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-5">
      <motion.div
        role={danger ? "alert" : "status"}
        aria-live="polite"
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.28, ease: EASE }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-xl shadow-black/5 dark:shadow-black/40"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            danger ? "bg-danger-subtle text-danger" : "bg-surface-subtle text-success"
          }`}
        >
          {danger ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </span>

        <p className="min-w-0 flex-1 text-sm text-text">{message}</p>

        {action && (
          <motion.button
            type="button"
            onClick={action.onClick}
            disabled={action.busy}
            whileHover={reduced ? undefined : { scale: 1.03 }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {action.busy ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {action.busyLabel ?? action.label}
              </span>
            ) : (
              action.label
            )}
          </motion.button>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}
