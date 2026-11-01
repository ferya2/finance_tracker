"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  Repeat,
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
import { RecurringFormModal } from "@/components/dashboard/recurring-form-modal";
import { Snackbar } from "@/components/dashboard/snackbar";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  useIsHydrated,
  useRecurringEntries,
} from "@/components/use-recurring-entries";
import { useUserData } from "@/components/use-user-data";
import { formatCurrency, formatDateLabel } from "@/lib/finance/format";
import { isoDate } from "@/lib/finance/period";
import {
  buildRecurringList,
  type RecurringListItem,
} from "@/lib/finance/recurring-form";
import { saveRecurringEntries } from "@/lib/storage/recurring";
import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/types/recurring";

/** How long a success message stays up, with no action to offer. */
const NOTICE_DURATION_MS = 5_000;

/** How many shimmering placeholder cards stand in for the list while loading. */
const SKELETON_CARDS = 4;

interface Notice {
  message: string;
  tone: "neutral" | "danger";
}

function newRecurringId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function describePlan(input: NewRecurringTransaction): string {
  const note = input.note?.trim();
  return note && note.length > 0 ? note : "recurring plan";
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

function RecurringSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading recurring plans"
      className="grid gap-4 sm:grid-cols-2"
    >
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className={WIDGET_CARD_CLASS}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function RecurringError({
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
            Could not load your categories
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

function RecurringCard({
  item,
  index,
  referenceDate,
  onEdit,
  onDelete,
}: {
  item: RecurringListItem;
  index: number;
  referenceDate: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const income = item.type === "income";
  const nextLabel =
    item.nextOn === null
      ? "Schedule ended"
      : `Next ${formatDateLabel(item.nextOn, referenceDate)}`;

  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{
        duration: 0.4,
        delay: staggerDelay(index),
        ease: EASE,
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      className={`${WIDGET_CARD_CLASS} flex flex-col gap-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            style={{
              backgroundColor: `${item.categoryColor}1f`,
              color: item.categoryColor,
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            {income ? (
              <ArrowDownLeft className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">
              {item.note}
            </p>
            <p className="truncate text-xs text-text-muted">
              {item.categoryName} · {item.scheduleLabel}
            </p>
          </div>
        </div>
        <p
          className={`shrink-0 text-sm font-semibold tabular-nums ${
            income ? "text-success" : "text-text"
          }`}
        >
          {income ? "+" : "−"}
          {formatCurrency(item.amount)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            item.ended ? "text-text-muted" : "font-medium text-text-secondary"
          }`}
        >
          <Clock3 className="h-3.5 w-3.5" />
          {nextLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${item.note}`}
            title="Edit recurring plan"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil className="h-4 w-4" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.note}`}
            title="Delete recurring plan"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.li>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`${WIDGET_CARD_CLASS} flex flex-col items-center gap-3 py-14 text-center`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Repeat className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text">No recurring plans yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Add rent, a salary or any income and expense that repeats.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
      >
        <Plus className="h-4 w-4" />
        Add recurring plan
      </button>
    </motion.div>
  );
}

export function RecurringView() {
  const { status, data, error, reload } = useUserData();
  const { user } = useSession();
  const reduced = usePrefersReducedMotion();
  const userId = user?.id ?? null;
  const hydrated = useIsHydrated();
  const entries = useRecurringEntries(userId);
  const referenceDate = useMemo(() => isoDate(new Date()), []);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState<RecurringListItem | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const categories = useMemo(() => data?.categories ?? [], [data]);
  const rows = useMemo(
    () => buildRecurringList(entries, categories, referenceDate),
    [entries, categories, referenceDate],
  );
  const activeCount = rows.filter((row) => !row.ended).length;

  function commit(next: RecurringTransaction[]) {
    saveRecurringEntries(userId, next);
  }

  function handleSaved(input: NewRecurringTransaction) {
    if (editing) {
      const next = entries.map((entry) =>
        entry.id === editing.id ? { ...input, id: editing.id } : entry,
      );
      commit(next);
      setNotice({ message: `Updated ${describePlan(input)}.`, tone: "neutral" });
      setEditing(null);
      return;
    }

    const next = [...entries, { ...input, id: newRecurringId() }];
    commit(next);
    setNotice({ message: `Added ${describePlan(input)}.`, tone: "neutral" });
    setAdding(false);
  }

  function handleDelete() {
    if (!deleting) return;

    commit(entries.filter((entry) => entry.id !== deleting.id));
    setNotice({ message: `Deleted ${deleting.note}.`, tone: "neutral" });
    setDeleting(null);
  }

  function closeForm() {
    setAdding(false);
    setEditing(null);
  }

  const ready = hydrated && status === "ready" && data !== null;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="Automate"
          title="Recurring"
          description="Plan the income and expenses that repeat. These plans are saved on this device until recurring sync lands."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              disabled={data === null}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            >
              <Plus className="h-4 w-4" />
              Add plan
            </button>
          }
        />

        {ready && rows.length > 0 && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mb-4 text-sm text-text-secondary"
          >
            {rows.length} {rows.length === 1 ? "plan" : "plans"} · {activeCount}{" "}
            active
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {status === "error" ? (
            <motion.div
              key="error"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <RecurringError
                message={
                  error?.message ??
                  "Something went wrong while loading your categories."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : !ready ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <RecurringSkeleton />
            </motion.div>
          ) : rows.length === 0 ? (
            <motion.div
              key="empty"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <EmptyState onAdd={() => setAdding(true)} />
            </motion.div>
          ) : (
            <motion.ul
              key="ready"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {rows.map((item, index) => (
                  <RecurringCard
                    key={item.id}
                    item={item}
                    index={index}
                    referenceDate={referenceDate}
                    onEdit={() => {
                      const target = entries.find((entry) => entry.id === item.id);
                      if (target) setEditing(target);
                    }}
                    onDelete={() => setDeleting(item)}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(adding || editing !== null) && (
          <RecurringFormModal
            key={editing?.id ?? "new-recurring"}
            categories={categories}
            referenceDate={referenceDate}
            recurring={editing ?? undefined}
            onClose={closeForm}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <ConfirmDialog
            title="Delete recurring plan?"
            description={`“${deleting.note}” will stop repeating.`}
            confirmLabel="Delete plan"
            tone="danger"
            onConfirm={handleDelete}
            onCancel={() => setDeleting(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
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
