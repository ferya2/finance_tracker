"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import {
  EASE,
  staggerDelay,
  WIDGET_CARD_CLASS,
} from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SummaryCard, type SummaryTone } from "@/components/dashboard/summary-card";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import { formatCurrency } from "@/lib/finance/format";
import {
  buildMonthlyReport,
  type MonthlyReport,
} from "@/lib/finance/monthly-report";
import {
  currentPeriod,
  formatMonthLabel,
  nextPeriod,
  previousPeriod,
  type YearMonth,
} from "@/lib/finance/period";
import type { SummaryTrend } from "@/lib/finance/summary";
import { trendPeak } from "@/lib/finance/trend";

interface ReportCard {
  key: string;
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  tone: SummaryTone;
  trend: SummaryTrend | null;
}

/** Turn a percent change into the summary card's trend shape. */
function trendOf(
  percent: number | null,
  previousMonthName: string,
): SummaryTrend | null {
  if (percent === null) return null;
  return {
    direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat",
    percent,
    previousMonthName,
  };
}

function reportCards(report: MonthlyReport): ReportCard[] {
  const monthTotal = `${report.monthName} total`;

  return [
    {
      key: "balance",
      label: "Net",
      value: report.summary.balance,
      caption: "Income minus expenses",
      icon: Wallet,
      tone: "primary",
      trend: null,
    },
    {
      key: "income",
      label: "Income",
      value: report.summary.income,
      caption: monthTotal,
      icon: TrendingUp,
      tone: "success",
      trend: trendOf(report.incomeChangePercent, report.previousMonthName),
    },
    {
      key: "expense",
      label: "Expenses",
      value: report.summary.expense,
      caption: monthTotal,
      icon: TrendingDown,
      tone: "danger",
      trend: trendOf(report.expenseChangePercent, report.previousMonthName),
    },
  ];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text tabular-nums">{value}</p>
    </div>
  );
}

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
    <div role="status" aria-label="Loading monthly report">
      <div className="grid gap-4 sm:grid-cols-3">
        {["card-1", "card-2", "card-3"].map((key) => (
          <div key={key} className={WIDGET_CARD_CLASS}>
            <Skeleton className="h-28 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className={`${WIDGET_CARD_CLASS} lg:col-span-3`}>
          <Skeleton className="h-64 w-full" />
        </div>
        <div className={`${WIDGET_CARD_CLASS} lg:col-span-2`}>
          <Skeleton className="h-64 w-full" />
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
            Could not load your monthly report
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

function MonthNavigator({
  period,
  label,
  canGoForward,
  onPrevious,
  onNext,
}: {
  period: YearMonth;
  label: string;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary";

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-border bg-surface p-1"
      aria-label="Report month"
    >
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Previous month"
        className={buttonClass}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span
        key={`${period.year}-${period.month}`}
        className="min-w-32 text-center text-xs font-medium text-text sm:text-sm"
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoForward}
        aria-label="Next month"
        className={buttonClass}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MonthlyReportView() {
  const { status, data, error, reload } = useUserData();
  const reduced = usePrefersReducedMotion();
  const current = useMemo(() => currentPeriod(new Date()), []);
  const [period, setPeriod] = useState<YearMonth>(current);

  const report = useMemo(
    () => (data ? buildMonthlyReport(data, period) : null),
    [data, period],
  );
  const cards = useMemo(() => (report ? reportCards(report) : []), [report]);
  const donut = useMemo(
    () => buildDonutBreakdown(report?.categories ?? []),
    [report],
  );
  const peak = useMemo(
    () => (report ? trendPeak(report.daily) : null),
    [report],
  );

  const isCurrentMonth =
    period.year === current.year && period.month === current.month;
  const monthLabel = report?.monthLabel ?? formatMonthLabel(period.year, period.month);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow={monthLabel}
          title="Monthly report"
          description="A complete look at one month — income, spending, categories and budgets in one place."
          action={
            <MonthNavigator
              period={period}
              label={monthLabel}
              canGoForward={!isCurrentMonth}
              onPrevious={() => setPeriod((value) => previousPeriod(value))}
              onNext={() => setPeriod((value) => nextPeriod(value))}
            />
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
              <ReportError
                message={
                  error?.message ??
                  "Something went wrong while loading your report."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : !report ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <ReportSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key={`${report.period.year}-${report.period.month}`}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {cards.map((card, index) => (
                  <SummaryCard
                    key={card.key}
                    label={card.label}
                    value={card.value}
                    caption={card.caption}
                    icon={card.icon}
                    tone={card.tone}
                    trend={card.trend}
                    delay={staggerDelay(index, 0.05, 0)}
                  />
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                <section className={`${WIDGET_CARD_CLASS} lg:col-span-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-text">
                      Spending by day
                    </h2>
                    <span className="text-xs text-text-muted">
                      {report.monthName}
                    </span>
                  </div>

                  {report.summary.expense === 0 ? (
                    <p className="mt-6 text-sm text-text-muted">
                      No spending recorded for this month yet.
                    </p>
                  ) : (
                    <>
                      <TrendLineChart points={report.daily} className="mt-5" />
                      <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                          label="Spent"
                          value={formatCurrency(report.summary.expense)}
                        />
                        <Stat
                          label="Average per day"
                          value={formatCurrency(report.dailyAverageExpense)}
                        />
                        <Stat
                          label="Biggest day"
                          value={
                            peak === null
                              ? "—"
                              : `${formatCurrency(peak.expense)} · ${peak.label}`
                          }
                        />
                        <Stat
                          label="Transactions"
                          value={String(report.transactionCount)}
                        />
                      </div>
                    </>
                  )}
                </section>

                <section className={`${WIDGET_CARD_CLASS} lg:col-span-2`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-text">
                      Where it went
                    </h2>
                    <span className="text-xs text-text-muted">By category</span>
                  </div>

                  {report.categories.length === 0 ? (
                    <p className="mt-6 text-sm text-text-muted">
                      No spending recorded for this month yet.
                    </p>
                  ) : (
                    <CategoryDonut
                      breakdown={donut}
                      caption={`spent in ${report.monthName}`}
                    />
                  )}
                </section>
              </div>

              {report.budgets.length > 0 && (
                <div className="mt-4">
                  <BudgetProgress
                    rows={report.budgets}
                    monthName={report.monthName}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
