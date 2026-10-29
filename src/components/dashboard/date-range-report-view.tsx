"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { EASE, WIDGET_CARD_CLASS } from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useUserData } from "@/components/use-user-data";
import {
  buildDateRangeReport,
  isValidDateRange,
  lastNDaysRange,
  type DateRange,
  type RangeGranularity,
} from "@/lib/finance/date-range";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import { formatCurrency } from "@/lib/finance/format";
import { isoDate } from "@/lib/finance/period";

const RANGE_DAYS = 30;

const GRANULARITY_LABELS: Record<RangeGranularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-text transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

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
    <div role="status" aria-label="Loading date-range report">
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
            Could not load your report
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

function RangeFilter({
  range,
  days,
  valid,
  onChange,
}: {
  range: DateRange;
  days: number;
  valid: boolean;
  onChange: (range: DateRange) => void;
}) {
  return (
    <section className={`${WIDGET_CARD_CLASS} mb-4`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full gap-4 sm:max-w-md sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">Start date</span>
            <input
              type="date"
              value={range.start}
              max={range.end}
              onChange={(event) =>
                onChange({ ...range, start: event.target.value })
              }
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">End date</span>
            <input
              type="date"
              value={range.end}
              min={range.start}
              onChange={(event) =>
                onChange({ ...range, end: event.target.value })
              }
              className={inputClassName}
            />
          </label>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
          <CalendarRange className="h-4 w-4" aria-hidden />
          {valid ? `${days} ${days === 1 ? "day" : "days"}` : "Check the dates"}
        </div>
      </div>

      {!valid && (
        <p role="alert" className="mt-3 text-xs font-medium text-danger">
          Pick a start date on or before the end date.
        </p>
      )}
    </section>
  );
}

export function DateRangeReportView() {
  const { status, data, error, reload } = useUserData();
  const reduced = usePrefersReducedMotion();
  const today = useMemo(() => isoDate(new Date()), []);
  const [range, setRange] = useState<DateRange>(() =>
    lastNDaysRange(today, RANGE_DAYS),
  );

  const valid = isValidDateRange(range);
  const report = useMemo(
    () =>
      data && valid
        ? buildDateRangeReport(
            {
              transactions: data.transactions,
              categories: data.categories,
            },
            range,
          )
        : null,
    [data, range, valid],
  );
  const donut = useMemo(
    () => buildDonutBreakdown(report?.categories ?? []),
    [report],
  );

  const rangeLabel = report?.label ?? `${range.start} – ${range.end}`;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="Custom range"
          title="Date-range report"
          description="Pick any two dates to see the income, spending and categories inside that window."
          action={
            <Link
              href="/dashboard/reports/monthly"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-subtle"
            >
              <Calendar className="h-4 w-4" />
              Monthly report
            </Link>
          }
        />

        <RangeFilter
          range={range}
          days={report?.days ?? 0}
          valid={valid}
          onChange={setRange}
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
          ) : status === "loading" ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <ReportSkeleton />
            </motion.div>
          ) : !valid ? (
            <motion.div
              key="invalid"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className={WIDGET_CARD_CLASS}
            >
              <p className="text-sm text-text-muted">
                Choose a valid range to see the report.
              </p>
            </motion.div>
          ) : report ? (
            <motion.div
              key={`${range.start}-${range.end}`}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="Net"
                  value={report.summary.balance}
                  caption={rangeLabel}
                  icon={Wallet}
                  tone="primary"
                />
                <SummaryCard
                  label="Income"
                  value={report.summary.income}
                  caption="In selected range"
                  icon={TrendingUp}
                  tone="success"
                  delay={0.05}
                />
                <SummaryCard
                  label="Expenses"
                  value={report.summary.expense}
                  caption="In selected range"
                  icon={TrendingDown}
                  tone="danger"
                  delay={0.1}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                <section className={`${WIDGET_CARD_CLASS} lg:col-span-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-text">
                      Spending over time
                    </h2>
                    <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary">
                      {GRANULARITY_LABELS[report.granularity]}
                    </span>
                  </div>

                  {report.summary.expense === 0 ? (
                    <p className="mt-6 text-sm text-text-muted">
                      No spending recorded in this range yet.
                    </p>
                  ) : (
                    <>
                      <TrendLineChart points={report.trend} className="mt-5" />
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
                          label="Transactions"
                          value={String(report.transactionCount)}
                        />
                        <Stat label="Days" value={String(report.days)} />
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
                      No spending recorded in this range yet.
                    </p>
                  ) : (
                    <CategoryDonut
                      breakdown={donut}
                      caption="spent in this range"
                    />
                  )}
                </section>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
