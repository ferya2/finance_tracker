import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { summarizeBudgets, type BudgetTotals } from "./budget";
import {
  buildBudgetSummaries,
  type BudgetSummaryRow,
} from "./budget-summary";
import { sumByCategory } from "./by-category";
import { summarizeMonthly, type MonthlySummary } from "./monthly";
import {
  daysInMonth,
  formatMonthLabel,
  formatMonthName,
  monthKey,
  monthRange,
  previousPeriod,
  type YearMonth,
} from "./period";
import { percentChange } from "./summary";
import { buildSpendingTrend, type TrendPoint } from "./trend";

/** Shown when a category id has no matching category row. */
const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

/** One category's spending in a monthly report, ready to render. */
export interface MonthlyReportCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** Total spent in the category during the month, in integer cents. */
  amount: number;
  /** Share of the month's expenses, 0-100 (rounded). */
  sharePercent: number;
}

/** The raw rows a monthly report is built from. */
export interface MonthlyReportSource {
  transactions: readonly Transaction[];
  categories: readonly Category[];
  budgets: readonly Budget[];
}

/** Everything one calendar month's report renders. */
export interface MonthlyReport {
  period: YearMonth;
  /** The month as a human label, e.g. "September 2026". */
  monthLabel: string;
  /** The month name on its own, e.g. "September". */
  monthName: string;
  /** The compared-to month, e.g. "August". */
  previousMonthName: string;
  summary: MonthlySummary;
  previousSummary: MonthlySummary;
  /** Change in income vs the previous month, or `null` when it was zero. */
  incomeChangePercent: number | null;
  /** Change in expenses vs the previous month, or `null` when it was zero. */
  expenseChangePercent: number | null;
  /** Month spending per category, biggest first. */
  categories: MonthlyReportCategory[];
  /** Every day of the month, oldest first, for the daily trend line. */
  daily: TrendPoint[];
  /** The month's category budgets with their computed status. */
  budgets: BudgetSummaryRow[];
  /** The month's budgets rolled into one headline. */
  budgetTotals: BudgetTotals;
  /** How many transactions were recorded during the month. */
  transactionCount: number;
  /** Average spend per calendar day of the month, in integer cents. */
  dailyAverageExpense: number;
  /** The biggest spending category, or `null` when nothing was spent. */
  topCategory: MonthlyReportCategory | null;
}

/** A share of `total` as a rounded 0-100 percentage. */
function sharePercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

/**
 * Build the composed report for one calendar month: headline income, expenses
 * and net, the month-over-month change, spending per category, a day-by-day
 * spending trend, and the month's budget performance. Money stays in integer
 * cents, and both the period and its previous month are passed in, so the
 * function is pure and fully unit-testable.
 */
export function buildMonthlyReport(
  source: MonthlyReportSource,
  period: YearMonth,
): MonthlyReport {
  const { year, month } = period;
  const key = monthKey(year, month);
  const range = monthRange(year, month);
  const previous = previousPeriod(period);

  const summary = summarizeMonthly(source.transactions, year, month);
  const previousSummary = summarizeMonthly(
    source.transactions,
    previous.year,
    previous.month,
  );

  const inMonth = source.transactions.filter((transaction) =>
    transaction.occurredOn.startsWith(key),
  );
  const lookup = new Map(
    source.categories.map((category) => [category.id, category]),
  );

  const categories = sumByCategory(inMonth, "expense").map(
    ({ categoryId, total }) => {
      const category = lookup.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
        amount: total,
        sharePercent: sharePercent(total, summary.expense),
      };
    },
  );

  const daily = buildSpendingTrend(source.transactions, {
    granularity: "day",
    start: range.start,
    end: range.end,
  });

  const budgets = buildBudgetSummaries(
    source.budgets,
    source.transactions,
    source.categories,
    period,
  );

  return {
    period,
    monthLabel: formatMonthLabel(year, month),
    monthName: formatMonthName(year, month),
    previousMonthName: formatMonthName(previous.year, previous.month),
    summary,
    previousSummary,
    incomeChangePercent: percentChange(
      summary.income,
      previousSummary.income,
    ),
    expenseChangePercent: percentChange(
      summary.expense,
      previousSummary.expense,
    ),
    categories,
    daily,
    budgets,
    budgetTotals: summarizeBudgets(budgets),
    transactionCount: inMonth.length,
    dailyAverageExpense: Math.round(
      summary.expense / daysInMonth(year, month),
    ),
    topCategory: categories[0] ?? null,
  };
}
