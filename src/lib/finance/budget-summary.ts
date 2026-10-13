import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { budgetStatus } from "./budget";
import { monthKey, type YearMonth } from "./period";

/** Shown when a budget's category id has no matching category row. */
const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

/** A category budget for one month with its computed status, ready to render. */
export interface BudgetSummaryRow {
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

/**
 * Pair every budget for one calendar month with its category and computed
 * status, keeping the order the budgets were given in. Budgets for other months
 * are ignored, and a budget whose category id is unknown still appears with an
 * "Uncategorized" fallback. All money math delegates to {@link budgetStatus} and
 * the month is passed in, so this stays pure and unit-testable.
 */
export function buildBudgetSummaries(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  categories: readonly Category[],
  period: YearMonth,
): BudgetSummaryRow[] {
  const lookup = new Map(categories.map((category) => [category.id, category]));
  const key = monthKey(period.year, period.month);

  return budgets
    .filter((budget) => budget.month === key)
    .map((budget) => {
      const status = budgetStatus(
        transactions,
        budget.categoryId,
        period.year,
        period.month,
        budget.limitAmount,
      );
      const category = lookup.get(budget.categoryId);

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
        limit: budget.limitAmount,
        spent: status.spent,
        remaining: status.remaining,
        percent: status.percent,
        overBudget: status.overBudget,
      };
    });
}
