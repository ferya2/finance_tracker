"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  EASE,
  WIDGET_CARD_CLASS,
  staggerDelay,
} from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { Snackbar } from "@/components/dashboard/snackbar";
import { TagFormModal } from "@/components/dashboard/tag-form-modal";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useTagAssignments } from "@/components/use-tag-assignments";
import { useTags } from "@/components/use-tags";
import { countAssignedTransactions } from "@/lib/finance/tags";
import { saveTagAssignments } from "@/lib/storage/tags";
import { deleteTag } from "@/lib/supabase/tags";
import type { Tag as TagModel } from "@/types/tag";

const SKELETON_CARDS = 6;
const NOTICE_DURATION_MS = 5_000;

interface Notice {
  message: string;
  tone: "neutral" | "danger";
}

function Skeleton({ className }: { className: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: EASE }
      }
      className={`block rounded-full bg-surface-subtle ${className}`}
    />
  );
}

function TagsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tags"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className={WIDGET_CARD_CLASS}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="mt-5 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function TagsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={`${WIDGET_CARD_CLASS} flex flex-col items-start gap-4`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">
            Could not load your tags
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function TagCard({
  tag,
  usage,
  index,
  onEdit,
  onDelete,
}: {
  tag: TagModel;
  usage: number;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: staggerDelay(index), ease: EASE }}
      whileHover={reduced ? undefined : { y: -3 }}
      className={WIDGET_CARD_CLASS}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            style={{
              backgroundColor: `${tag.color}22`,
              color: tag.color,
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            <Tag className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text">
              {tag.name}
            </h3>
            <p className="text-xs text-text-muted">
              {usage} {usage === 1 ? "transaction" : "transactions"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${tag.name}`}
            title="Edit tag"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${tag.name}`}
            title="Delete tag"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function TagsView() {
  const { status, tags, error, reload } = useTags();
  const { user } = useSession();
  const userId = user?.id ?? null;
  const assignments = useTagAssignments(userId);
  const reduced = usePrefersReducedMotion();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TagModel | null>(null);
  const [deleting, setDeleting] = useState<TagModel | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const usages = useMemo(
    () =>
      new Map(
        tags.map((tag) => [
          tag.id,
          countAssignedTransactions(assignments, tag.id),
        ]),
      ),
    [tags, assignments],
  );

  async function handleConfirmDelete() {
    if (deleting === null) return;

    const target = deleting;
    setDeleteBusy(true);
    const { error: deleteErr } = await deleteTag(target.id);
    setDeleteBusy(false);

    if (deleteErr) {
      setDeleteError(deleteErr.message);
      return;
    }

    saveTagAssignments(
      userId,
      assignments
        .map((assignment) => ({
          transactionId: assignment.transactionId,
          tagIds: assignment.tagIds.filter((id) => id !== target.id),
        }))
        .filter((assignment) => assignment.tagIds.length > 0),
    );

    setDeleteError(null);
    setDeleting(null);
    setNotice({ message: `Deleted ${target.name}.`, tone: "neutral" });
    reload();
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="Labels"
          title="Tags"
          description="Create small labels, then attach them to transactions to group spending your own way."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              disabled={status !== "ready"}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            >
              <Plus className="h-4 w-4" />
              New tag
            </button>
          }
        />

        <AnimatePresence mode="wait">
          {status === "error" ? (
            <motion.div
              key="error"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <TagsError
                message={
                  error?.message ??
                  "Something went wrong while loading your tags."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : status === "loading" ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <TagsSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {tags.length === 0 ? (
                <div className={`${WIDGET_CARD_CLASS} text-center`}>
                  <p className="text-sm font-medium text-text">No tags yet</p>
                  <p className="mt-1 text-sm text-text-muted">
                    Create your first tag, then add it to any transaction.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tags.map((tag, index) => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      usage={usages.get(tag.id) ?? 0}
                      index={index}
                      onEdit={() => setEditing(tag)}
                      onDelete={() => {
                        setDeleteError(null);
                        setDeleting(tag);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <TagFormModal
            onClose={() => setAdding(false)}
            onSaved={(saved) => {
              setAdding(false);
              setNotice({ message: `Created ${saved.name}.`, tone: "neutral" });
              reload();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing !== null && (
          <TagFormModal
            key={editing.id}
            tag={editing}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setEditing(null);
              setNotice({ message: `Saved ${saved.name}.`, tone: "neutral" });
              reload();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting !== null && (
          <ConfirmDialog
            title="Delete this tag?"
            description={`“${deleting.name}” will be removed from every transaction that uses it.`}
            confirmLabel="Delete tag"
            cancelLabel="Keep it"
            tone="danger"
            busy={deleteBusy}
            busyLabel="Deleting…"
            error={deleteError}
            onConfirm={() => {
              void handleConfirmDelete();
            }}
            onCancel={() => {
              setDeleting(null);
              setDeleteError(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice !== null && (
          <Snackbar
            key={notice.message}
            message={notice.message}
            tone={notice.tone}
            duration={NOTICE_DURATION_MS}
            onDismiss={() => setNotice(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
