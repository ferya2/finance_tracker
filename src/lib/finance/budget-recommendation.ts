import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { monthKey, previousPeriod, type YearMonth } from "./period";

/** How many completed months of spending a recommendation averages by default. */
export const BUDGET_RECOMMENDATION_LOOKBACK_MONTHS = 3;

/** Suggested limits are rounded up to a whole currency unit (100 cents). */
const LIMIT_ROUNDING_CENTS = 100;

/** A suggested monthly budget for one expense category. */
export interface BudgetRecommendation {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** Average monthly spend across the lookback window, in integer cents. */
  averageMonthlySpend: number;
  /** Suggested limit in integer cents, rounded up to a whole currency unit. */
  suggestedLimit: number;
  /** How many completed months the average covers. */
  monthsConsidered: number;
  /** How many of those months had at least one expense in the category. */
  monthsWithSpending: number;
}

/** Tunables for {@link recommendBudgets}. */
export interface BudgetRecommendationOptions {
  /** Completed months to average; defaults to three. Clamped to at least one. */
  lookbackMonths?: number;
  /** Budgets already saved, so categories budgeted for the target month are skipped. */
  budgets?: readonly Pick<Budget, "categoryId" | "month">[];
  /** Suggest categories even when they already have a budget for the target month. */
  includeBudgeted?: boolean;
}

/** The fields a transaction needs for budget recommendations. */
type RecommendationTransaction = Pick<
  Transaction,
  "amount" | "type" | "categoryId" | "occurredOn"
>;

/** A category's complete months of spending within the lookback window. */
interface CategorySpending {
  /** Total spent across the window, in integer cents. */
  total: number;
  /** The `YYYY-MM` keys that had at least one expense. */
  months: Set<string>;
}

/** Round a cent amount up to the nearest whole currency unit. */
function roundUpToUnit(cents: number): number {
  return Math.ceil(cents / LIMIT_ROUNDING_CENTS) * LIMIT_ROUNDING_CENTS;
}

/** The completed `YYYY-MM` keys immediately before the target month. */
function lookbackKeys(period: YearMonth, months: number): Set<string> {
  const keys = new Set<string>();
  let cursor = period;

  for (let i = 0; i < months; i++) {
    cursor = previousPeriod(cursor);
    keys.add(monthKey(cursor.year, cursor.month));
  }

  return keys;
}

/**
 * Suggest a monthly budget per expense category from the user's spending
 * history. Each suggestion averages the category's expenses over the completed
 * months immediately before `period` (three by default), so the current month's
 * partial spending does not skew it. The average is rounded up to a whole
 * currency unit for a clean limit.
 *
 * Categories already budgeted for the target month are skipped unless
 * `includeBudgeted` is set, and categories with no prior spending are omitted.
 * Suggestions are sorted biggest first. The period and history are passed in,
 * so the function is pure and fully unit-testable.
 */
export function recommendBudgets(
  transactions: readonly RecommendationTransaction[],
  categories: readonly Category[],
  period: YearMonth,
  options: BudgetRecommendationOptions = {},
): BudgetRecommendation[] {
  const lookbackMonths = Math.max(
    1,
    Math.floor(
      options.lookbackMonths ?? BUDGET_RECOMMENDATION_LOOKBACK_MONTHS,
    ),
  );
  const keys = lookbackKeys(period, lookbackMonths);
  const targetKey = monthKey(period.year, period.month);

  const budgeted = new Set(
    (options.budgets ?? [])
      .filter((budget) => budget.month === targetKey)
      .map((budget) => budget.categoryId),
  );

  const spending = new Map<string, CategorySpending>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const key = transaction.occurredOn.slice(0, 7);
    if (!keys.has(key)) continue;

    const entry = spending.get(transaction.categoryId) ?? {
      total: 0,
      months: new Set<string>(),
    };
    entry.total += transaction.amount;
    entry.months.add(key);
    spending.set(transaction.categoryId, entry);
  }

  return categories
    .filter((category) => category.kind === "expense")
    .filter(
      (category) =>
        options.includeBudgeted === true || !budgeted.has(category.id),
    )
    .flatMap((category) => {
      const entry = spending.get(category.id);
      if (entry === undefined || entry.total <= 0) return [];

      const averageMonthlySpend = Math.round(entry.total / lookbackMonths);

      return [
        {
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          averageMonthlySpend,
          suggestedLimit: roundUpToUnit(averageMonthlySpend),
          monthsConsidered: lookbackMonths,
          monthsWithSpending: entry.months.size,
        },
      ];
    })
    .sort(
      (a, b) =>
        b.suggestedLimit - a.suggestedLimit ||
        a.categoryName.localeCompare(b.categoryName),
    );
}
