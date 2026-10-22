import type { Transaction } from "@/types/transaction";
import { buildSpendingTrend } from "./trend";

/** How many months the income-vs-expense chart shows by default. */
export const INCOME_EXPENSE_MONTHS = 6;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** One month of the income-vs-expense chart, in integer cents. */
export interface IncomeExpensePoint {
  /** The month as a `YYYY-MM` key. */
  key: string;
  /** Short axis label, e.g. "Sep" or "Sep 25". */
  label: string;
  /** Income booked in the month, in cents. */
  income: number;
  /** Expense booked in the month, in cents. */
  expense: number;
  /** Income minus expense, in cents. */
  balance: number;
}

/** Totals across the whole chart, in integer cents. */
export interface IncomeExpenseTotals {
  income: number;
  expense: number;
  /** Income minus expense. */
  balance: number;
}

/** A range of months shaped for grouped income/expense bars. */
export interface IncomeExpenseSeries {
  /** Oldest month first, one point per month in the range. */
  points: IncomeExpensePoint[];
  /** The tallest single bar (income or expense), in cents. */
  max: number;
  totals: IncomeExpenseTotals;
}

/** The first day of the month `months - 1` months before `end`, as ISO. */
function windowStart(end: string, months: number): string | null {
  if (!ISO_DATE_PATTERN.test(end)) return null;

  const time = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(time)) return null;

  const date = new Date(time);
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - (months - 1), 1),
  );
  return start.toISOString().slice(0, 10);
}

/** How many months a chart should cover, falling back to the default. */
function monthCount(months: number | undefined): number {
  if (months === undefined || !Number.isFinite(months)) {
    return INCOME_EXPENSE_MONTHS;
  }
  return Math.max(Math.trunc(months), 1);
}

/**
 * Bucket transactions into one point per month for the income-vs-expense
 * chart, oldest first. Every month in the window is present, even when nothing
 * happened in it, so the grouped bars keep their place. Money stays in integer
 * cents and the end date is passed in, which keeps the function pure.
 */
export function buildIncomeExpenseSeries(
  transactions: readonly Pick<Transaction, "amount" | "type" | "occurredOn">[],
  options: {
    /** Inclusive last day of the range, as an ISO `YYYY-MM-DD` string. */
    end: string;
    /** How many months to cover, counting the end month. Defaults to 6. */
    months?: number;
  },
): IncomeExpenseSeries {
  const months = monthCount(options.months);
  const start = windowStart(options.end, months);

  if (start === null) {
    return {
      points: [],
      max: 0,
      totals: { income: 0, expense: 0, balance: 0 },
    };
  }

  const points = buildSpendingTrend(transactions, {
    granularity: "month",
    start,
    end: options.end,
  }).map((point) => ({
    key: point.key,
    label: point.label,
    income: point.income,
    expense: point.expense,
    balance: point.income - point.expense,
  }));

  let income = 0;
  let expense = 0;
  let max = 0;

  for (const point of points) {
    income += point.income;
    expense += point.expense;
    max = Math.max(max, point.income, point.expense);
  }

  return {
    points,
    max,
    totals: { income, expense, balance: income - expense },
  };
}
