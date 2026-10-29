"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PieChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import { formatCurrency } from "@/lib/finance/format";
import { buildYearlyReport, type YearlyReport } from "@/lib/finance/yearly";

function Skeleton({ className }: { className: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced ? { duration: 0 } : { duration: 1.4, repeat: Infinity, ease: EASE }
      }
      className={`rounded-xl bg-surface-subtle ${className}`}
    />
  );
}

function ReportSkeleton() {
  return (
    <div role="status" aria-label="Loading yearly report">
      <div className="grid gap-4 sm:grid-cols-4">
        {["card-1", "card-2", "card-3", "card-4"].map((key) => (
          <div key={key} className={WIDGET_CARD_CLASS}>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className={`${WIDGET_CARD_CLASS} lg:col-span-3`}>
          <Skeleton className="h-72 w-full" />
        </div>
        <div className={`${WIDGET_CARD_CLASS} lg:col-span-2`}>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

function ReportError({
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
            Could not load your yearly report
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

function YearNavigator({
  year,
  onPrevious,
  onNext,
  canGoForward,
}: {
  year: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoForward: boolean;
}) {
  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary";

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-border bg-surface p-1"
      aria-label="Report year"
    >
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Previous year"
        className={buttonClass}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-24 text-center text-xs font-medium text-text sm:text-sm">
        {year}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoForward}
        aria-label="Next year"
        className={buttonClass}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone?: "default" | "success" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-success-light text-success"
      : tone === "danger"
        ? "bg-danger-light text-danger"
        : "bg-primary/10 text-primary";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={WIDGET_CARD_CLASS}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text tabular-nums sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </motion.article>
  );
}

function MonthsTable({ report }: { report: YearlyReport }) {
  return (
    <section className={WIDGET_CARD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">12-month summary</h2>
          <p className="mt-1 text-xs text-text-muted">
            Month by month income, expenses and net
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 text-xs font-medium text-text-muted">
                Month
              </th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-text-muted">
                Income
              </th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-text-muted">
                Expenses
              </th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-text-muted">
                Net
              </th>
              <th className="pb-2 text-right text-xs font-medium text-text-muted">
                Transactions
              </th>
            </tr>
          </thead>
          <tbody>
            {report.months.map((month) => (
              <tr key={month.monthKey} className="border-b border-border/60">
                <td className="py-2 pr-4 font-medium text-text">
                  {month.monthName}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-text">
                  {formatCurrency(month.income)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">
                  {formatCurrency(month.expense)}
                </td>
                <td
                  className={`py-2 pr-4 text-right tabular-nums ${
                    month.net >= 0 ? "text-text" : "text-danger"
                  }`}
                >
                  {formatCurrency(month.net)}
                </td>
                <td className="py-2 text-right tabular-nums text-text-muted">
                  {month.transactionCount}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th className="pt-3 pr-4 text-left text-sm font-semibold text-text">
                Total
              </th>
              <th className="pt-3 pr-4 text-right text-sm font-semibold text-text tabular-nums">
                {formatCurrency(report.totalIncome)}
              </th>
              <th className="pt-3 pr-4 text-right text-sm font-semibold text-text-secondary tabular-nums">
                {formatCurrency(report.totalExpense)}
              </th>
              <th
                className={`pt-3 pr-4 text-right text-sm font-semibold tabular-nums ${
                  report.totalBalance >= 0 ? "text-text" : "text-danger"
                }`}
              >
                {formatCurrency(report.totalBalance)}
              </th>
              <th className="pt-3 text-right text-sm font-semibold text-text-muted tabular-nums">
                {report.months.reduce((sum, m) => sum + m.transactionCount, 0)}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function CategoryShares({ report }: { report: YearlyReport }) {
  const donut = useMemo(
    () =>
      buildDonutBreakdown(
        report.categories.map((category) => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          categoryColor: category.categoryColor,
          amount: category.amount,
        })),
      ),
    [report.categories],
  );

  return (
    <section className={WIDGET_CARD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Spending by category</h2>
          <p className="mt-1 text-xs text-text-muted">Full year breakdown</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PieChart className="h-4 w-4" />
        </span>
      </div>
      {report.categories.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No spending recorded this year.</p>
      ) : (
        <CategoryDonut breakdown={donut} />
      )}
    </section>
  );
}

export function YearlyReportView() {
  const { status, data, error, reload } = useUserData();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState(currentYear);

  const report = useMemo(
    () =>
      data
        ? buildYearlyReport(
            {
              transactions: data.transactions,
              categories: data.categories,
              budgets: data.budgets,
            },
            year,
          )
        : null,
    [data, year],
  );

  const canGoForward = year < currentYear;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={`${year}`}
          title="Yearly overview"
          description="A 12-month summary of income, expenses, net and spending by category."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <YearNavigator
                year={year}
                onPrevious={() => setYear((y) => y - 1)}
                onNext={() => setYear((y) => y + 1)}
                canGoForward={canGoForward}
              />
              <Link
                href="/dashboard/reports/monthly"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-subtle"
              >
                <Calendar className="h-4 w-4" />
                Monthly report
              </Link>
            </div>
          }
        />

        {status === "loading" ? (
          <ReportSkeleton />
        ) : status === "error" ? (
          <ReportError
            message={typeof error === "string" ? error : "Something went wrong."}
            onRetry={reload}
          />
        ) : report ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total income"
                value={formatCurrency(report.totalIncome)}
                icon={TrendingUp}
                tone="success"
              />
              <MetricCard
                label="Total expenses"
                value={formatCurrency(report.totalExpense)}
                icon={TrendingDown}
                tone="danger"
              />
              <MetricCard
                label="Net balance"
                value={formatCurrency(report.totalBalance)}
                icon={BarChart3}
              />
              <MetricCard
                label="Avg monthly expense"
                value={formatCurrency(report.averageMonthlyExpense)}
                icon={Calendar}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <MonthsTable report={report} />
              </div>
              <div className="lg:col-span-2">
                <CategoryShares report={report} />
                <div className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <p className="text-sm font-medium text-text">Year at a glance</p>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-text-muted">Daily average spend</dt>
                      <dd className="font-medium tabular-nums text-text">
                        {formatCurrency(report.dailyAverageExpense)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-text-muted">Average monthly income</dt>
                      <dd className="font-medium tabular-nums text-text">
                        {formatCurrency(report.averageMonthlyIncome)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-text-muted">Average monthly expense</dt>
                      <dd className="font-medium tabular-nums text-text">
                        {formatCurrency(report.averageMonthlyExpense)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
