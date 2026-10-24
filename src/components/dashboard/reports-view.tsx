"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { ChartVisual } from "@/components/dashboard/chart-visual";
import { EASE, staggerDelay, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SpendingTrend } from "@/components/dashboard/spending-trend";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import {
  DUMMY_CATEGORY_BREAKDOWN,
  DUMMY_MONTHLY_SERIES,
  getDummyCategory,
} from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";
import { formatMonthLabel, monthKey } from "@/lib/finance/period";
import { summarizeMonthly } from "@/lib/finance/monthly";
import { sumByCategory } from "@/lib/finance/by-category";

function buildTrendPoints() {
  const balances = DUMMY_MONTHLY_SERIES.map((point) => point.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const width = 320;
  const height = 120;
  const padX = 20;
  const padY = 12;

  return DUMMY_MONTHLY_SERIES.map((point, i) => {
    const x = padX + (i / (DUMMY_MONTHLY_SERIES.length - 1)) * (width - padX * 2);
    const y =
      padY + (1 - (point.balance - min) / (max - min || 1)) * (height - padY * 2);
    return { x, y, month: point.month, balance: point.balance };
  });
}

function BalanceTrend() {
  const reduced = usePrefersReducedMotion();
  const points = buildTrendPoints();
  const line = points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Balance trend</h2>
        <span className="text-xs text-text-muted">Apr → Sep</span>
      </div>

      <div className="mt-4">
        <svg viewBox="0 0 320 120" className="h-28 w-full" preserveAspectRatio="none">
          <motion.path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point) => (
            <circle
              key={point.month}
              cx={point.x}
              cy={point.y}
              r={2.5}
              fill="currentColor"
              stroke="var(--color-surface)"
              strokeWidth={1.5}
              className="text-primary"
            />
          ))}
        </svg>
        <div className="mt-2 flex justify-between text-xs text-text-muted">
          {points.map((point) => (
            <span key={point.month}>{point.month}</span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-text-secondary">
        Balance at the end of the period:{" "}
        <span className="font-semibold text-text tabular-nums">
          {formatCurrency(last.balance)}
        </span>
      </p>
    </section>
  );
}

function SpendingShares() {
  const donut = useMemo(() => {
    const rows = DUMMY_CATEGORY_BREAKDOWN.map((item) => {
      const category = getDummyCategory(item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name ?? "Uncategorized",
        categoryColor: category?.color ?? "#94a3b8",
        amount: item.amount,
      };
    });
    return buildDonutBreakdown(rows);
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Spending shares</h2>
        <span className="text-xs text-text-muted">By category</span>
      </div>
      <CategoryDonut breakdown={donut} />
    </section>
  );
}

function MonthlyReport() {
  const reduced = usePrefersReducedMotion();
  const { status, data } = useUserData();

  const transactions = useMemo(() => data?.transactions ?? [], [data?.transactions]);
  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);

  const monthOptionsList = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      if (tx.occurredOn?.length >= 7) {
        set.add(tx.occurredOn.slice(0, 7));
      }
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const activeMonth = useMemo(() => {
    if (selectedMonth && monthOptionsList.includes(selectedMonth)) {
      return selectedMonth;
    }
    return monthOptionsList[0] ?? "";
  }, [monthOptionsList, selectedMonth]);

  const period = useMemo(() => {
    if (!activeMonth) return null;
    const [yearStr, monthStr] = activeMonth.split("-");
    return { year: Number(yearStr), month: Number(monthStr) };
  }, [activeMonth]);

  const summary = useMemo(() => {
    if (!period) return { income: 0, expense: 0, balance: 0 };
    return summarizeMonthly(transactions, period.year, period.month);
  }, [period, transactions]);

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const breakdown = useMemo(() => {
    if (!period) return [];
    const key = monthKey(period.year, period.month);
    return sumByCategory(
      transactions.filter((transaction) => transaction.occurredOn.startsWith(key)),
      "expense",
    )
      .map(({ categoryId, total }) => {
        const category = categoryLookup.get(categoryId);
        return {
          categoryId,
          categoryName: category?.name ?? "Uncategorized",
          categoryColor: category?.color ?? "#94a3b8",
          amount: total,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [period, transactions, categoryLookup]);

  const monthLabel = period ? formatMonthLabel(period.year, period.month) : "No data";

  if (status === "loading" && transactions.length === 0) {
    return (
      <section className={WIDGET_CARD_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-text">Monthly report</h2>
            <p className="mt-1 text-xs text-text-muted">Composed view of a single month</p>
          </div>
        </div>
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-surface-subtle" />
      </section>
    );
  }

  if (monthOptionsList.length === 0) {
    return (
      <section className={WIDGET_CARD_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-text">Monthly report</h2>
            <p className="mt-1 text-xs text-text-muted">Composed view of a single month</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-text-muted">
          Add transactions to see a composed monthly report.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={WIDGET_CARD_CLASS}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Monthly report</h2>
          <p className="mt-1 text-xs text-text-muted">Composed view of a single month</p>
        </div>
        <div className="relative">
          <select
            value={activeMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            aria-label="Select month for report"
            className="h-9 appearance-none rounded-full border border-border bg-surface pl-3 pr-8 text-sm text-text focus:border-primary focus:outline-none"
          >
            {monthOptionsList.map((key) => (
              <option key={key} value={key}>
                {formatMonthLabel(
                  Number(key.split("-")[0]),
                  Number(key.split("-")[1]),
                )}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Income", value: summary.income, tone: "text-primary" },
          { label: "Expenses", value: summary.expense, tone: "text-danger" },
          { label: "Balance", value: summary.balance, tone: "text-text" },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: staggerDelay(index, 0.05, 0.1), ease: EASE }}
            className="rounded-xl border border-border bg-surface-subtle/40 p-4"
          >
            <p className="text-xs font-medium text-text-muted">{item.label}</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${item.tone}`}>
              {formatCurrency(item.value)}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">{monthLabel}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-text">Spending by category</h3>
          {breakdown.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No expenses this month.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {breakdown.map((item, index) => (
                <motion.li
                  key={item.categoryId}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: staggerDelay(index, 0.04, 0.15), ease: EASE }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-text">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.categoryColor }}
                    />
                    {item.categoryName}
                  </span>
                  <span className="text-sm font-medium text-text tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text">Transactions this month</h3>
          {transactions.filter((t) => t.occurredOn.startsWith(activeMonth)).length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No transactions this month.</p>
          ) : (
            <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-auto pr-1">
              {[...transactions]
                .filter((t) => t.occurredOn.startsWith(activeMonth))
                .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
                .slice(0, 20)
                .map((t, index) => {
                  const category = categoryLookup.get(t.categoryId);
                  return (
                    <motion.li
                      key={t.id}
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: staggerDelay(index, 0.03, 0.2), ease: EASE }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text">{t.note || "No note"}</p>
                        <p className="text-xs text-text-muted">
                          {category?.name ?? "Uncategorized"} • {t.occurredOn}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          t.type === "income" ? "text-primary" : "text-danger"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(Math.abs(t.amount))}
                      </span>
                    </motion.li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export function ReportsView() {
  const { status, data } = useUserData();

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={data?.transactions?.length ? formatMonthLabel(new Date().getFullYear(), new Date().getMonth() + 1) : "Reports"}
          title="Reports"
          description="Turn your history into clear charts — spending, trends and shares at a glance."
        />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <MonthlyReport />
            <SpendingTrend
              transactions={data?.transactions ?? []}
              loading={status === "loading"}
            />
            <IncomeExpenseChart
              transactions={data?.transactions ?? []}
              loading={status === "loading"}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SpendingShares />
              <BalanceTrend />
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:col-span-1">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <ChartVisual className="h-56 w-full" />
              <p className="mt-3 text-center text-xs text-text-muted">
                Your spending, at a glance
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
