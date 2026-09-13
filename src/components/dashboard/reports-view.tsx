"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { ChartVisual } from "@/components/dashboard/chart-visual";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  DUMMY_CATEGORY_BREAKDOWN,
  DUMMY_MONTHLY_SERIES,
  DUMMY_SUMMARY,
  getDummyCategory,
} from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";

const maxMonthlyValue = Math.max(
  ...DUMMY_MONTHLY_SERIES.flatMap((point) => [point.income, point.expense]),
);

function IncomeExpenseChart() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Income vs expenses</h2>
        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
          Last 6 months
        </span>
      </div>

      <div className="mt-6 flex items-end gap-3 sm:gap-5">
        {DUMMY_MONTHLY_SERIES.map((point, i) => (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center gap-1.5">
              {[point.income, point.expense].map((value, j) => (
                <motion.div
                  key={j}
                  initial={reduced ? false : { height: 0 }}
                  animate={{ height: `${Math.max((value / maxMonthlyValue) * 100, 3)}%` }}
                  transition={{
                    duration: 0.7,
                    delay: 0.1 + i * 0.06 + j * 0.04,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  title={`${j === 0 ? "Income" : "Expense"}: ${formatCurrency(value)}`}
                  className={`w-3 rounded-t-md sm:w-4 ${
                    j === 0 ? "bg-primary" : "bg-danger"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-text-muted">{point.month}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-5 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Expenses
        </span>
      </div>
    </section>
  );
}

function buildDonutStops() {
  let acc = 0;
  return DUMMY_CATEGORY_BREAKDOWN.map((item) => {
    const from = acc;
    acc += item.sharePercent;
    return `${getDummyCategory(item.categoryId)?.color} ${from}% ${acc}%`;
  }).join(", ");
}

function CategoryDonut() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-base font-semibold text-text">Spending shares</h2>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative h-40 w-40 shrink-0"
        >
          <div
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(from -90deg, ${buildDonutStops()})` }}
          />
          <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-surface">
            <span className="text-lg font-semibold text-text tabular-nums">
              {formatCurrency(DUMMY_SUMMARY.monthlyExpense)}
            </span>
            <span className="text-xs text-text-muted">spent this month</span>
          </div>
        </motion.div>

        <ul className="flex w-full flex-col gap-2.5">
          {DUMMY_CATEGORY_BREAKDOWN.map((item) => {
            const category = getDummyCategory(item.categoryId);
            return (
              <li
                key={item.categoryId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-text">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category?.color }}
                  />
                  <span className="truncate">{category?.name}</span>
                </span>
                <span className="shrink-0 text-text-secondary tabular-nums">
                  <span className="font-medium text-text">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="ml-2 text-xs text-text-muted">
                    {item.sharePercent}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

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

export function ReportsView() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Reports"
          description="Turn your history into clear charts — spending, trends and shares at a glance."
        />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <IncomeExpenseChart />
            <div className="grid gap-4 sm:grid-cols-2">
              <CategoryDonut />
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