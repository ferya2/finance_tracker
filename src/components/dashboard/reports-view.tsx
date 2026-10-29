"use client";

import { motion } from "framer-motion";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { ChartVisual } from "@/components/dashboard/chart-visual";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { SpendingTrend } from "@/components/dashboard/spending-trend";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import {
  DUMMY_CATEGORY_BREAKDOWN,
  DUMMY_MONTHLY_SERIES,
  getDummyCategory,
} from "@/lib/finance/dummy";
import { formatCurrency } from "@/lib/finance/format";

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

export function ReportsView() {
  const { status, data } = useUserData();

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="September 2026"
          title="Reports"
          description="Turn your history into clear charts — spending, trends and shares at a glance."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/reports/range"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-subtle"
              >
                <CalendarDays className="h-4 w-4" />
                Custom range
              </Link>
              <Link
                href="/dashboard/reports/monthly"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-subtle"
              >
                <CalendarRange className="h-4 w-4" />
                Monthly report
              </Link>
              <Link
                href="/dashboard/reports/yearly"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
              >
                <Calendar className="h-4 w-4" />
                Yearly overview
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-4">
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
