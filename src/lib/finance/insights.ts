import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { sumByCategory } from "./by-category";
import { summarizeMonthly, type MonthlySummary } from "./monthly";
import {
  daysInMonth,
  formatMonthLabel,
  formatMonthName,
  monthKey,
  previousPeriod,
  type YearMonth,
} from "./period";
import { percentChange } from "./summary";

/** How many top spending categories an insight report lists. */
export const INSIGHT_TOP_CATEGORY_LIMIT = 4;

/** Shown when a transaction has no note of its own. */
const FALLBACK_NOTE = "No note";

/** Shown when a category id has no matching category row. */
const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

/** One category's spending in the insight report, ready to render. */
export interface InsightCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** Total spent in the category during the month, in integer cents. */
  amount: number;
  /** Share of the month's expenses, 0-100 (rounded). */
  sharePercent: number;
}

/** The single largest expense recorded during the month. */
export interface InsightBiggestExpense {
  id: string;
  /** The transaction note, or a placeholder when it has none. */
  note: string;
  /** The amount, in integer cents. */
  amount: number;
  categoryName: string;
  categoryColor: string;
  /** Calendar date the expense occurred on, as an ISO `YYYY-MM-DD` string. */
  occurredOn: string;
}

/** The raw rows an insight report is built from. */
export interface InsightsSource {
  transactions: readonly Transaction[];
  categories: readonly Category[];
}

/** Everything the insights page renders for one calendar month. */
export interface Insights {
  period: YearMonth;
  /** The month as a human label, e.g. "September 2026". */
  monthLabel: string;
  /** The month name on its own, e.g. "September". */
  monthName: string;
  /** The compared-to month, e.g. "August". */
  previousMonthName: string;
  summary: MonthlySummary;
  previousSummary: MonthlySummary;
  /** Average spend per calendar day of the month, in integer cents. */
  averageDailySpend: number;
  /** Share of income kept (income minus expenses), 0-100 rounded. */
  savingsRatePercent: number;
  /** Change in income vs the previous month, or `null` when it was zero. */
  incomeChangePercent: number | null;
  /** Change in expenses vs the previous month, or `null` when it was zero. */
  expenseChangePercent: number | null;
  /** Month spending per category, biggest first, capped for the page. */
  topCategories: InsightCategory[];
  /** The biggest single expense of the month, or `null` when none. */
  biggestExpense: InsightBiggestExpense | null;
  /** Plain-language observations derived from the month's numbers. */
  notes: string[];
  /** How many transactions were recorded during the month. */
  transactionCount: number;
}

/** A share of `total` as a rounded 0-100 percentage. */
function sharePercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

/**
 * Share of income kept this month, as a rounded 0-100 percentage. Returns `0`
 * when no income was recorded, since a rate needs something to divide by.
 */
function savingsRate(summary: MonthlySummary): number {
  if (summary.income <= 0) return 0;
  return Math.round((summary.balance / summary.income) * 100);
}

/** The biggest single expense in the month, or `null` when none was made. */
function findBiggestExpense(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Category>,
  key: string,
): InsightBiggestExpense | null {
  let biggest: Transaction | null = null;

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    if (!transaction.occurredOn.startsWith(key)) continue;
    if (biggest === null || transaction.amount > biggest.amount) {
      biggest = transaction;
    }
  }

  if (biggest === null) return null;

  const category = categories.get(biggest.categoryId);
  return {
    id: biggest.id,
    note: biggest.note?.trim() || FALLBACK_NOTE,
    amount: biggest.amount,
    categoryName: category?.name ?? FALLBACK_CATEGORY.name,
    categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
    occurredOn: biggest.occurredOn,
  };
}

/** Build the friendly observations shown at the bottom of the insights page. */
function buildNotes(insights: {
  monthName: string;
  previousMonthName: string;
  summary: MonthlySummary;
  expenseChangePercent: number | null;
  savingsRatePercent: number;
  topCategory: InsightCategory | null;
  biggestExpense: InsightBiggestExpense | null;
}): string[] {
  const notes: string[] = [];
  const { summary } = insights;

  if (summary.income === 0 && summary.expense === 0) {
    return [
      `No activity recorded for ${insights.monthName} yet — add a transaction to see insights.`,
    ];
  }

  if (insights.expenseChangePercent !== null) {
    const change = insights.expenseChangePercent;
    if (change === 0) {
      notes.push(
        `You spent the same in ${insights.monthName} as in ${insights.previousMonthName}.`,
      );
    } else if (change < 0) {
      notes.push(
        `You spent ${Math.abs(change)}% less in ${insights.monthName} than in ${insights.previousMonthName}.`,
      );
    } else {
      notes.push(
        `You spent ${change}% more in ${insights.monthName} than in ${insights.previousMonthName}.`,
      );
    }
  }

  if (insights.topCategory !== null) {
    notes.push(
      `${insights.topCategory.categoryName} is your biggest spending category at ${insights.topCategory.sharePercent}% of ${insights.monthName} expenses.`,
    );
  }

  if (summary.income > 0) {
    if (insights.savingsRatePercent >= 0) {
      notes.push(
        `Saving ${insights.savingsRatePercent}% of what you earn keeps you ahead of your budget.`,
      );
    } else {
      notes.push(
        `You spent more than you earned in ${insights.monthName}.`,
      );
    }
  }

  if (insights.biggestExpense !== null) {
    notes.push(
      `${insights.biggestExpense.note} was your biggest single expense this month.`,
    );
  }

  return notes;
}

/**
 * Derive the insights page from the user's transactions and categories for one
 * calendar month: the headline figures, the average daily spend, the savings
 * rate, month-over-month trends, the top spending categories, the biggest
 * single expense and a few plain-language notes. Money stays in integer cents
 * and the period is passed in, so the function is pure and fully unit-testable.
 */
export function buildInsights(
  source: InsightsSource,
  period: YearMonth,
): Insights {
  const { year, month } = period;
  const key = monthKey(year, month);
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
  const categories = new Map(
    source.categories.map((category) => [category.id, category]),
  );

  const topCategories = sumByCategory(inMonth, "expense")
    .slice(0, INSIGHT_TOP_CATEGORY_LIMIT)
    .map(({ categoryId, total }) => {
      const category = categories.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
        amount: total,
        sharePercent: sharePercent(total, summary.expense),
      };
    });

  const biggestExpense = findBiggestExpense(
    source.transactions,
    categories,
    key,
  );
  const savingsRatePercent = savingsRate(summary);
  const expenseChangePercent = percentChange(
    summary.expense,
    previousSummary.expense,
  );

  return {
    period,
    monthLabel: formatMonthLabel(year, month),
    monthName: formatMonthName(year, month),
    previousMonthName: formatMonthName(previous.year, previous.month),
    summary,
    previousSummary,
    averageDailySpend: Math.round(
      summary.expense / daysInMonth(year, month),
    ),
    savingsRatePercent,
    incomeChangePercent: percentChange(
      summary.income,
      previousSummary.income,
    ),
    expenseChangePercent,
    topCategories,
    biggestExpense,
    notes: buildNotes({
      monthName: formatMonthName(year, month),
      previousMonthName: formatMonthName(previous.year, previous.month),
      summary,
      expenseChangePercent,
      savingsRatePercent,
      topCategory: topCategories[0] ?? null,
      biggestExpense,
    }),
    transactionCount: inMonth.length,
  };
}
