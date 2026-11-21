"use client";

import { AlertTriangle, Plus, RefreshCw, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";

interface SkeletonProps {
  className?: string;
  delay?: number;
}

/** A shimmering placeholder block that settles into a static tone when reduced motion is on. */
export function Skeleton({ className = "", delay = 0 }: SkeletonProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden
      initial={reduced ? false : { opacity: 0.4 }}
      animate={reduced ? { opacity: 0.7 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: EASE, delay }
      }
      className={`block rounded-full bg-surface-subtle ${className}`}
    />
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** The shared first-run/no-results panel: animated icon, copy and optional CTA. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
      className={
        compact
          ? "flex flex-col items-center gap-2 px-6 py-8 text-center"
          : `${WIDGET_CARD_CLASS} flex flex-col items-center gap-3 py-14 text-center`
      }
    >
      <span
        className={
          compact
            ? "flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-text-muted"
            : "flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary"
        }
      >
        <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <div>
        <p
          className={
            compact
              ? "text-sm font-medium text-text"
              : "text-sm font-semibold text-text"
          }
        >
          {title}
        </p>
        {description ? (
          <p
            className={compact ? "text-xs text-text-muted" : "mt-1 text-sm text-text-muted"}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </motion.div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

/** The shared failure panel with an accessible alert and an animated retry CTA. */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      role="alert"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
      className={`${WIDGET_CARD_CLASS} flex flex-col items-start gap-4`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <p className="mt-0.5 text-sm text-text-secondary">{message}</p>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={onRetry}
        whileHover={reduced ? undefined : { y: -2 }}
        whileTap={reduced ? undefined : { scale: 0.96 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <RefreshCw className="h-4 w-4" />
        {retryLabel}
      </motion.button>
    </motion.div>
  );
}
