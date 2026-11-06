"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, Tags, X } from "lucide-react";
import Link from "next/link";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { toggleTagId } from "@/lib/finance/tags";
import type { Tag } from "@/types/tag";
import type { Transaction } from "@/types/transaction";

interface TagAssignModalProps {
  transaction: Transaction;
  tags: readonly Tag[];
  assignedTagIds: readonly string[];
  onClose: () => void;
  onSave: (tagIds: string[]) => void;
}

export function TagAssignModal({
  transaction,
  tags,
  assignedTagIds,
  onClose,
  onSave,
}: TagAssignModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const [selected, setSelected] = useState<string[]>(() => [
    ...assignedTagIds,
  ]);
  const panelRef = useRef<HTMLDivElement>(null);

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
          aria-labelledby="tag-assign-title"
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
                id="tag-assign-title"
                className="text-lg font-semibold tracking-tight text-text"
              >
                Tags
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

          {tags.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                <Tags className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-text">No tags yet</p>
              <p className="mt-1 text-sm text-text-muted">
                Create your first tag to start labeling transactions.
              </p>
              <Link
                href="/dashboard/tags"
                onClick={onClose}
                className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                Create a tag
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selected.includes(tag.id);
                return (
                  <motion.button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelected(toggleTagId(selected, tag.id))}
                    aria-pressed={active}
                    whileHover={reduced ? undefined : { scale: 1.03 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    style={{
                      backgroundColor: active ? `${tag.color}22` : undefined,
                      borderColor: active ? tag.color : undefined,
                      color: active ? tag.color : undefined,
                    }}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
                      active
                        ? ""
                        : "border-border bg-surface text-text-secondary hover:bg-surface-subtle hover:text-text"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              onClick={() => onSave(selected)}
              disabled={tags.length === 0}
              whileHover={reduced ? undefined : { scale: 1.01 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save tags
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
