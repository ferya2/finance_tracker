"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  DUMMY_TRANSACTIONS,
  getDummyCategory,
  type DummyRecentTransaction,
} from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";

type Filter = "all" | "income" | "expense";

const filterOptions: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

/** "2026-09-12" → "Sep 12". */
function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function matches(txn: DummyRecentTransaction, filter: Filter, query: string) {
  const typeMatch = filter === "all" || txn.type === filter;
  const q = query.trim().toLowerCase();
  if (!q) return typeMatch;
  const category = getDummyCategory(txn.categoryId);
  return (
    typeMatch &&
    (txn.note.toLowerCase().includes(q) ||
      (category?.name.toLowerCase().includes(q) ?? false))
  );
}

export function TransactionsView() {
  const reduced = usePrefersReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const filtered = DUMMY_TRANSACTIONS.filter((txn) =>
      matches(txn, filter, query),
    );
    return [...filtered].sort((a, b) =>
      b.occurredOn.localeCompare(a.occurredOn),
    );
  }, [filter, query]);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Transactions"
          description="Every income and expense this month — search and filter your way through them."
          action={
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </button>
          }
        />

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
            {visible.length} of {DUMMY_TRANSACTIONS.length} shown
          </span>
        </div>

        <motion.ul
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((txn, index) => {
              const category = getDummyCategory(txn.categoryId);
              const income = txn.type === "income";
              return (
                <motion.li
                  key={txn.id}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.025,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 hover:bg-surface-subtle/60 sm:px-6"
                >
                  <span
                    style={{
                      backgroundColor: `${category?.color}1f`,
                      color: category?.color,
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
                      {txn.note}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {category?.name} · {formatShortDate(txn.occurredOn)}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      income ? "text-success" : "text-text"
                    }`}
                  >
                    {income ? "+" : "−"}
                    {formatCurrency(txn.amount)}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>

          {visible.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <p className="text-sm font-medium text-text">No matches</p>
              <p className="text-sm text-text-muted">
                Try a different search or filter.
              </p>
            </li>
          )}
        </motion.ul>
      </div>
    </PageShell>
  );
}