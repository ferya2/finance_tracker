"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { formatCurrency } from "@/lib/finance/format";
import { isoDate } from "@/lib/finance/period";
import {
  buildTransactionList,
  type TransactionListRow,
} from "@/lib/finance/transaction-list";

type Filter = "all" | "income" | "expense";

const filterOptions: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

/** How many shimmering placeholder rows stand in for the list while loading. */
const SKELETON_ROWS = 6;

function matches(row: TransactionListRow, filter: Filter, query: string) {
  const typeMatch = filter === "all" || row.type === filter;
  const q = query.trim().toLowerCase();
  if (!q) return typeMatch;
  return (
    typeMatch &&
    (row.note.toLowerCase().includes(q) ||
      row.categoryName.toLowerCase().includes(q))
  );
}

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
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const referenceDate = useMemo(() => isoDate(new Date()), []);

  const list = useMemo(
    () =>
      data
        ? buildTransactionList(data.transactions, data.categories, referenceDate)
        : null,
    [data, referenceDate],
  );

  const visible = useMemo(
    () =>
      list === null
        ? []
        : list.rows.filter((row) => matches(row, filter, query)),
    [list, filter, query],
  );

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

        {list !== null && list.total > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <SegmentedControl
              name="transactions-type"
              ariaLabel="Filter by type"
              options={filterOptions}
              value={filter}
              onChange={setFilter}
            />
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search transactions"
                aria-label="Search transactions"
                className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <span className="ml-auto rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-medium text-text-secondary">
              {visible.length} of {list.total} shown
            </span>
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
                {visible.map((row, index) => {
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
                    </motion.li>
                  );
                })}
              </AnimatePresence>

              {visible.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <p className="text-sm font-medium text-text">
                    {list.total === 0 ? "No transactions yet" : "No matches"}
                  </p>
                  <p className="text-sm text-text-muted">
                    {list.total === 0
                      ? "Add your first transaction to start tracking."
                      : "Try a different search or filter."}
                  </p>
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <AddTransactionModal
            categories={data?.categories ?? []}
            referenceDate={referenceDate}
            onClose={() => setAdding(false)}
            onCreated={() => {
              setAdding(false);
              reload();
            }}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
