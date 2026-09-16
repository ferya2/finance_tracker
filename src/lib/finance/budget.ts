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

/** The fields a transaction needs for budget calculation. */
type BudgetTransaction = Pick<
  Transaction,
  "categoryId" | "amount" | "type" | "occurredOn"
>;

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