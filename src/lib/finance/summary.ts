import type { Transaction } from "@/types/transaction";
import { summarizeMonthly } from "./monthly";
import { formatMonthName, previousPeriod, type YearMonth } from "./period";
import { balance } from "./totals";

/** Which of the three headline figures a summary card shows. */
export type SummaryCardKey = "balance" | "income" | "expense";

/** How a summary amount moved compared with the previous month. */
export type SummaryTrendDirection = "up" | "down" | "flat";

/** A month-over-month change for a summary card. */
export interface SummaryTrend {
  /** Whether the amount rose, fell or stayed level. */
  direction: SummaryTrendDirection;
  /** Change as a whole percent, e.g. `-12` for 12% less than last month. */
  percent: number;
  /** The month being compared against, e.g. "August". */
  previousMonthName: string;
}

/** One summary card, ready to render. */
export interface SummaryCardData {
  key: SummaryCardKey;
  label: string;
  /** The amount on the card, in integer cents. */
  amount: number;
  /** Short context line under the amount, e.g. "All time" or "September". */
  caption: string;
  /** Month-over-month change, or `null` when there is nothing to compare. */
  trend: SummaryTrend | null;
}

/** The fields a transaction needs for the summary cards. */
type SummaryTransaction = Pick<Transaction, "amount" | "type" | "occurredOn">;

/**
 * Percentage change from `previous` to `current`, rounded to a whole percent
 * (e.g. 2500 → 2000 is `-20`). Returns `null` when `previous` is `0`: a change
 * from nothing is undefined rather than infinite.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** A month-over-month change, or `null` when the previous month cannot be used. */
function buildTrend(
  current: number,
  previous: number,
  period: YearMonth,
): SummaryTrend | null {
  const percent = percentChange(current, previous);
  if (percent === null) return null;
  return {
    direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat",
    percent,
    previousMonthName: formatMonthName(period.year, period.month),
  };
}

/**
 * Build the three headline summary cards — balance, income and expense — for one
 * calendar month. The balance card covers every transaction ever recorded and is
 * captioned "All time"; the income and expense cards cover `period` only and
 * carry a month-over-month change whenever the previous month has something to
 * compare against. All money math delegates to the other pure helpers in this
 * folder and no clock is read, so the result is fully unit-testable.
 */
export function buildSummaryCards(
  transactions: readonly SummaryTransaction[],
  period: YearMonth,
): SummaryCardData[] {
  const previous = previousPeriod(period);
  const month = summarizeMonthly(transactions, period.year, period.month);
  const lastMonth = summarizeMonthly(transactions, previous.year, previous.month);
  const monthName = formatMonthName(period.year, period.month);

  return [
    {
      key: "balance",
      label: "Balance",
      amount: balance(transactions),
      caption: "All time",
      trend: null,
    },
    {
      key: "income",
      label: "Income",
      amount: month.income,
      caption: monthName,
      trend: buildTrend(month.income, lastMonth.income, previous),
    },
    {
      key: "expense",
      label: "Expense",
      amount: month.expense,
      caption: monthName,
      trend: buildTrend(month.expense, lastMonth.expense, previous),
    },
  ];
}
