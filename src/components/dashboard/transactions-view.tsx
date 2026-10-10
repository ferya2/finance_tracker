"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { Snackbar } from "@/components/dashboard/snackbar";
import { TransactionFormModal } from "@/components/dashboard/transaction-form-modal";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { formatCurrency } from "@/lib/finance/format";
import { isoDate } from "@/lib/finance/period";
import {
  ALL_CATEGORIES,
  filterTransactions,
  isDefaultFilter,
  type TypeFilter,
} from "@/lib/finance/transaction-filter";
import {
  describeDeletedTransaction,
  describeTransaction,
  restorableToNewTransaction,
  toRestorableTransaction,
  UNDO_WINDOW_MS,
  type RestorableTransaction,
} from "@/lib/finance/transaction-delete";
import { buildTransactionList } from "@/lib/finance/transaction-list";
import {
  ALL_MONTHS,
  filterByMonth,
  formatMonthKeyLabel,
  monthOptions,
  type MonthFilter,
} from "@/lib/finance/transaction-month";
import { searchTransactions } from "@/lib/finance/transaction-search";
import { clampPage, countPages, paginate } from "@/lib/finance/pagination";
import {
  createTransaction,
  deleteTransaction,
} from "@/lib/supabase/transactions";
import type { Transaction } from "@/types/transaction";

/** What the snackbar at the foot of the page is currently saying. */
interface Notice {
  message: string;
  tone: "neutral" | "danger";
  /** Set while a delete can still be undone. */
  undo?: { snapshot: RestorableTransaction; restoring: boolean };
}

const filterOptions: ReadonlyArray<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

/** How long a failure message stays up, with no action to offer. */
const NOTICE_DURATION_MS = 6_000;

/** How many shimmering placeholder rows stand in for the list while loading. */
const SKELETON_ROWS = 6;

/** How many transactions make up one page of the list. */
const PAGE_SIZE = 10;

function Skeleton({ className, delay = 0 }: { className: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: EASE, delay }
      }
      className={`block rounded-full bg-surface-subtle ${className}`}
    />
  );
}

function TransactionsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading transactions"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-6"
        >
          <Skeleton className="h-10 w-10 shrink-0" delay={index * 0.08} />
          <span className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" delay={index * 0.08} />
            <Skeleton className="h-3 w-1/5" delay={index * 0.08} />
          </span>
        </div>
      ))}
    </div>
  );
}

function TransactionsError({
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
            Could not load your transactions
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

export function TransactionsView() {
  const { status, data, error, reload } = useUserData();
  const reduced = usePrefersReducedMotion();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
  const [monthFilter, setMonthFilter] = useState<MonthFilter>(ALL_MONTHS);
  const [query, setQuery] = useState("");
  /** The 1-based page of filtered rows currently on screen. */
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  /** The transaction waiting to be confirmed, then deleted. */
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  /** Ids dropped from the list the moment their delete succeeds. */
  const [removedIds, setRemovedIds] = useState<readonly string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const referenceDate = useMemo(() => isoDate(new Date()), []);

  const list = useMemo(
    () =>
      data
        ? buildTransactionList(data.transactions, data.categories, referenceDate)
        : null,
    [data, referenceDate],
  );

  /** The editable transaction behind each row, so editing uses the real row. */
  const byId = useMemo(
    () => new Map((data?.transactions ?? []).map((row) => [row.id, row])),
    [data],
  );

  /** The list minus anything just deleted, which the data still holds until it refetches. */
  const rows = useMemo(() => {
    if (list === null) return [];
    const removed = new Set(removedIds);
    return removed.size === 0
      ? list.rows
      : list.rows.filter((row) => !removed.has(row.id));
  }, [list, removedIds]);

  const total = rows.length;

  /** The distinct months the user has transactions in, newest first. */
  const months = useMemo(() => monthOptions(rows), [rows]);

  const visible = useMemo(
    () =>
      searchTransactions(
        filterByMonth(
          filterTransactions(rows, { type: typeFilter, categoryId }),
          monthFilter,
        ),
        query,
      ),
    [rows, typeFilter, categoryId, monthFilter, query],
  );

  /** The page of filtered rows on screen, clamped in case the list shrank. */
  const lastPage = countPages(visible.length, PAGE_SIZE);
  const currentPage = clampPage(page, visible.length, PAGE_SIZE);
  const paged = useMemo(
    () => paginate(visible, currentPage, PAGE_SIZE),
    [visible, currentPage],
  );

  /** True once any criterion narrows the list down. */
  const filtersActive = useMemo(
    () =>
      !isDefaultFilter({ type: typeFilter, categoryId }) ||
      monthFilter !== ALL_MONTHS ||
      query.trim() !== "",
    [typeFilter, categoryId, monthFilter, query],
  );

  const categories = data?.categories ?? [];

  function clearFilters() {
    setTypeFilter("all");
    setCategoryId(ALL_CATEGORIES);
    setMonthFilter(ALL_MONTHS);
    setQuery("");
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!deleting) return;

    const target = deleting;
    const snapshot = toRestorableTransaction(target);
    setDeleteBusy(true);

    const { error } = await deleteTransaction(target.id);

    setDeleteBusy(false);

    if (error) {
      setDeleteError(error.message);
      return;
    }

    setDeleteError(null);
    setDeleting(null);
    setRemovedIds((ids) => [...ids, target.id]);
    setNotice({
      message: describeDeletedTransaction(snapshot),
      tone: "neutral",
      undo: { snapshot, restoring: false },
    });
  }

  async function handleUndo() {
    if (!notice?.undo) return;

    const { snapshot } = notice.undo;
    setNotice((current) =>
      current?.undo
        ? { ...current, undo: { ...current.undo, restoring: true } }
        : current,
    );

    const { data: restored, error } = await createTransaction(
      restorableToNewTransaction(snapshot),
    );

    if (error || !restored) {
      setNotice({
        message: error?.message ?? "Could not put that transaction back.",
        tone: "danger",
      });
      return;
    }

    setNotice(null);
    reload();
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="All time"
          title="Transactions"
          description="Every income and expense you have recorded — search and filter your way through them."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              disabled={data === null}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </button>
          }
        />

        {list !== null && total > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <SegmentedControl
              name="transactions-type"
              ariaLabel="Filter by type"
              options={filterOptions}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            />
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <select
                value={monthFilter}
                onChange={(event) => {
                  setMonthFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by month"
                className="h-10 appearance-none rounded-full border border-border bg-surface pl-9 pr-8 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value={ALL_MONTHS}>All months</option>
                {months.map((key) => (
                  <option key={key} value={key}>
                    {formatMonthKeyLabel(key)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            </div>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <select
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by category"
                className="h-10 appearance-none rounded-full border border-border bg-surface pl-9 pr-8 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value={ALL_CATEGORIES}>All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            </div>
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search transactions"
                aria-label="Search transactions"
                className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <AnimatePresence initial={false}>
              {filtersActive && (
                <motion.button
                  type="button"
                  onClick={clearFilters}
                  initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </motion.button>
              )}
            </AnimatePresence>
            <motion.span
              key={visible.length}
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="ml-auto rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-medium text-text-secondary"
            >
              {visible.length} of {total} shown
            </motion.span>
          </div>
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
              <TransactionsError
                message={error?.message ?? "Something went wrong while loading your transactions."}
                onRetry={reload}
              />
            </motion.div>
          ) : list === null ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <TransactionsSkeleton />
            </motion.div>
          ) : (
            <motion.ul
              key="ready"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {paged.map((row, index) => {
                  const income = row.type === "income";
                  return (
                    <motion.li
                      key={row.id}
                      layout={!reduced}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{
                        duration: 0.35,
                        delay: index * 0.025,
                        ease: EASE,
                      }}
                      className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 hover:bg-surface-subtle/60 sm:px-6"
                    >
                      <span
                        style={{
                          backgroundColor: `${row.categoryColor}1f`,
                          color: row.categoryColor,
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      >
                        {income ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {row.note}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {row.categoryName} · {row.dateLabel}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          income ? "text-success" : "text-text"
                        }`}
                      >
                        {income ? "+" : "−"}
                        {formatCurrency(row.amount)}
                      </p>
                      <motion.button
                        type="button"
                        onClick={() => {
                          const target = byId.get(row.id);
                          if (target) setEditing(target);
                        }}
                        disabled={!byId.has(row.id)}
                        aria-label={`Edit ${row.note}`}
                        title="Edit transaction"
                        whileHover={reduced ? undefined : { scale: 1.08 }}
                        whileTap={reduced ? undefined : { scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => {
                          const target = byId.get(row.id);
                          if (target) {
                            setDeleteError(null);
                            setDeleting(target);
                          }
                        }}
                        disabled={!byId.has(row.id)}
                        aria-label={`Delete ${row.note}`}
                        title="Delete transaction"
                        whileHover={reduced ? undefined : { scale: 1.08 }}
                        whileTap={reduced ? undefined : { scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>

              {visible.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <p className="text-sm font-medium text-text">
                    {total === 0 ? "No transactions yet" : "No matches"}
                  </p>
                  <p className="text-sm text-text-muted">
                    {total === 0
                      ? "Add your first transaction to start tracking."
                      : "Try a different search or filter."}
                  </p>
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>

        {lastPage > 1 && (
          <motion.nav
            key="pagination"
            aria-label="Transactions pagination"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-5 flex items-center justify-center gap-3 sm:justify-end"
          >
            <motion.button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              whileHover={
                reduced || currentPage <= 1 ? undefined : { scale: 1.06 }
              }
              whileTap={
                reduced || currentPage <= 1 ? undefined : { scale: 0.94 }
              }
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-primary/40 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <motion.span
              key={currentPage}
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="text-sm tabular-nums text-text-secondary"
            >
              Page {currentPage} of {lastPage}
            </motion.span>
            <motion.button
              type="button"
              onClick={() => setPage(Math.min(lastPage, currentPage + 1))}
              disabled={currentPage >= lastPage}
              aria-label="Next page"
              whileHover={
                reduced || currentPage >= lastPage ? undefined : { scale: 1.06 }
              }
              whileTap={
                reduced || currentPage >= lastPage ? undefined : { scale: 0.94 }
              }
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-primary/40 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </motion.nav>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <TransactionFormModal
            categories={data?.categories ?? []}
            referenceDate={referenceDate}
            onClose={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              reload();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing !== null && (
          <TransactionFormModal
            key={editing.id}
            categories={data?.categories ?? []}
            referenceDate={referenceDate}
            transaction={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting !== null && (
          <ConfirmDialog
            title="Delete this transaction?"
            description={`This removes ${describeTransaction(toRestorableTransaction(deleting))} from your history. You can undo it from the message that follows.`}
            confirmLabel="Delete"
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
            duration={notice.undo ? UNDO_WINDOW_MS : NOTICE_DURATION_MS}
            action={
              notice.undo
                ? {
                    label: "Undo",
                    busyLabel: "Restoring…",
                    busy: notice.undo.restoring,
                    onClick: () => {
                      void handleUndo();
                    },
                  }
                : undefined
            }
            onDismiss={() => setNotice(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
