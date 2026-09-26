import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";
import { budgetStatus } from "./budget";
import { sumByCategory } from "./by-category";
import { summarizeMonthly } from "./monthly";
import {
  formatMonthLabel,
  formatMonthName,
  monthKey,
  type YearMonth,
} from "./period";
import { buildSummaryCards, type SummaryCardData } from "./summary";

/** How many transactions the dashboard "recent" widget shows. */
export const RECENT_TRANSACTION_LIMIT = 6;

/** Shown when a transaction has no note of its own. */
const FALLBACK_NOTE = "No note";

/** Shown when a category id has no matching category row. */
const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

/** A transaction enriched with its resolved category, ready to render. */
export interface DashboardTransactionRow {
  id: string;
  /** The transaction note, or a placeholder when it has none. */
  note: string;
  amount: number;
  type: TransactionType;
  occurredOn: string;
  categoryName: string;
  categoryColor: string;
}

/** One category's share of the month's spending. */
export interface DashboardBreakdownRow {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** Total spent in the category during the month, in cents. */
  amount: number;
  /** Share of the month's expenses, 0-100 (rounded; 0 when nothing was spent). */
  sharePercent: number;
}

/** A category budget for the month with its computed status. */
export interface DashboardBudgetRow {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** The budget limit, in cents. */
  limit: number;
  /** Spent during the month, in cents. */
  spent: number;
  /** Limit minus spent; negative when over budget. */
  remaining: number;
  /** Spent as a share of the limit; may exceed 100 when over budget. */
  percent: number;
  overBudget: boolean;
}

/** Everything the dashboard renders, derived from one fetch of user data. */
export interface DashboardData {
  period: YearMonth;
  /** The month as a human label, e.g. "September 2026". */
  monthLabel: string;
  /** The month name on its own, e.g. "September". */
  monthName: string;
  /** The headline balance / income / expense cards, built from the same fetch. */
  summaryCards: SummaryCardData[];
  /** Newest transactions first, capped at {@link RECENT_TRANSACTION_LIMIT}. */
  recent: DashboardTransactionRow[];
  /** Month spending per category, biggest first. */
  breakdown: DashboardBreakdownRow[];
  /** The month's budgets, in the order they were fetched. */
  budgets: DashboardBudgetRow[];
}

/** The raw rows a dashboard is built from. */
export interface DashboardSource {
  transactions: readonly Transaction[];
  categories: readonly Category[];
  budgets: readonly Budget[];
}

function categoryLookup(
  categories: readonly Category[],
): ReadonlyMap<string, Category> {
  return new Map(categories.map((category) => [category.id, category]));
}

function describeCategory(
  categories: ReadonlyMap<string, Category>,
  categoryId: string,
): { name: string; color: string } {
  const category = categories.get(categoryId);
  return {
    name: category?.name ?? FALLBACK_CATEGORY.name,
    color: category?.color ?? FALLBACK_CATEGORY.color,
  };
}

/** A transaction row resolved against the user's categories. */
function toTransactionRow(
  transaction: Transaction,
  categories: ReadonlyMap<string, Category>,
): DashboardTransactionRow {
  const { name, color } = describeCategory(categories, transaction.categoryId);
  return {
    id: transaction.id,
    note: transaction.note?.trim() || FALLBACK_NOTE,
    amount: transaction.amount,
    type: transaction.type,
    occurredOn: transaction.occurredOn,
    categoryName: name,
    categoryColor: color,
  };
}

/** A share of `total` as a rounded 0-100 percentage. */
function sharePercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

/**
 * Derive the dashboard's view model from the user's transactions, categories
 * and budgets for one calendar month. The balance card covers every
 * transaction ever recorded; the income/expense cards, the category breakdown
 * and the budget widget cover `period` only. All money math delegates to the
 * other pure helpers in this folder, and nothing is read from a clock — the
 * month is passed in, which keeps the whole function unit-testable.
 */
export function buildDashboardData(
  source: DashboardSource,
  period: YearMonth,
): DashboardData {
  const categories = categoryLookup(source.categories);
  const month = summarizeMonthly(
    source.transactions,
    period.year,
    period.month,
  );
  const key = monthKey(period.year, period.month);

  const recent = [...source.transactions]
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
    .slice(0, RECENT_TRANSACTION_LIMIT)
    .map((transaction) => toTransactionRow(transaction, categories));

  const breakdown = sumByCategory(
    source.transactions.filter((transaction) =>
      transaction.occurredOn.startsWith(key),
    ),
    "expense",
  ).map(({ categoryId, total }) => {
    const { name, color } = describeCategory(categories, categoryId);
    return {
      categoryId,
      categoryName: name,
      categoryColor: color,
      amount: total,
      sharePercent: sharePercent(total, month.expense),
    };
  });

  const budgets = source.budgets
    .filter((budget) => budget.month === key)
    .map((budget) => {
      const status = budgetStatus(
        source.transactions,
        budget.categoryId,
        period.year,
        period.month,
        budget.limitAmount,
      );
      const { name, color } = describeCategory(categories, budget.categoryId);
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: name,
        categoryColor: color,
        limit: budget.limitAmount,
        spent: status.spent,
        remaining: status.remaining,
        percent: status.percent,
        overBudget: status.overBudget,
      };
    });

  return {
    period,
    monthLabel: formatMonthLabel(period.year, period.month),
    monthName: formatMonthName(period.year, period.month),
    summaryCards: buildSummaryCards(source.transactions, period),
    recent,
    breakdown,
    budgets,
  };
}
