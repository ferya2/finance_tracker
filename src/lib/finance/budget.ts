import type { Transaction } from "@/types/transaction";

/** The status of a single category budget for a month, in integer cents. */
export interface BudgetStatus {
  /** Total expenses in the budget category during the month. */
  spent: number;
  /** Budget limit minus spent; negative when over budget. */
  remaining: number;
  /** Spent as a share of the limit, 0-100; may exceed 100 when over budget. */
  percent: number;
  /** True when spent exceeds the budget limit. */
  overBudget: boolean;
}

/** How much of a limit is spent before a budget starts to look concerning. */
export const BUDGET_WARNING_PERCENT = 80;

/** How close a budget is to its limit, used to colour its progress. */
export type BudgetPressure = "onTrack" | "warning" | "over";

/** The budget fields needed to colour or total one budget row. */
export interface BudgetProgressRow {
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

/** The month's budgets rolled up into one headline, in integer cents. */
export interface BudgetTotals {
  /** Every tracked limit added together. */
  limit: number;
  /** Every tracked budget's spending added together. */
  spent: number;
  /** Limits minus spending; negative when the month's spending is exceeded. */
  remaining: number;
  /** Spent as a share of the summed limits; may exceed 100. */
  percent: number;
  /** How many budgets are being tracked. */
  tracked: number;
  /** How many of them have already been exceeded. */
  overBudgetCount: number;
  /** The worst pressure across the month, for colouring the summary. */
  pressure: BudgetPressure;
}

/** The fields a transaction needs for budget calculation. */
type BudgetTransaction = Pick<
  Transaction,
  "categoryId" | "amount" | "type" | "occurredOn"
>;

function pressureFor(percent: number, overBudget: boolean): BudgetPressure {
  if (overBudget) return "over";
  return percent >= BUDGET_WARNING_PERCENT ? "warning" : "onTrack";
}

/**
 * Classify one budget as comfortably within its limit, close to it, or already
 * exceeded, so the widget can colour the progress without doing the maths.
 */
export function budgetPressure(row: BudgetProgressRow): BudgetPressure {
  return pressureFor(row.percent, row.overBudget);
}

/**
 * Roll every budget tracked for a month into a single headline: how much of
 * the month's total limits has been spent, how much is left, and how many
 * budgets need attention. An empty list totals to zero rather than NaN.
 */
export function summarizeBudgets(
  rows: readonly BudgetProgressRow[],
): BudgetTotals {
  const limit = rows.reduce((sum, row) => sum + row.limit, 0);
  const spent = rows.reduce((sum, row) => sum + row.spent, 0);
  const overBudgetCount = rows.filter((row) => row.overBudget).length;
  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

  return {
    limit,
    spent,
    remaining: limit - spent,
    percent,
    tracked: rows.length,
    overBudgetCount,
    pressure: pressureFor(percent, overBudgetCount > 0),
  };
}

/**
 * Compute a category budget's status for one calendar month. `month` is 1-12;
 * only expense transactions in the category during that month count toward
 * `spent`. A limit of zero or less never reports a percent (0) but is treated
 * as over budget as soon as anything is spent.
 */
export function budgetStatus(
  transactions: readonly BudgetTransaction[],
  categoryId: string,
  year: number,
  month: number,
  limit: number,
): BudgetStatus {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const spent = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.categoryId === categoryId &&
        transaction.occurredOn.startsWith(monthPrefix),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  return {
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    overBudget: spent > 0 && spent > limit,
  };
}