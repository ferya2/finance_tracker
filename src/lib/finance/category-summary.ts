import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";
import { monthKey, type YearMonth } from "./period";

/** A category with the amount recorded against it during one month. */
export interface CategorySummaryRow {
  id: string;
  name: string;
  color: string;
  kind: TransactionType;
  /** Total recorded in the category that month, in cents; 0 when none. */
  total: number;
}

/** The fields a transaction needs to be summed per category. */
type AmountCategoryAndDate = Pick<
  Transaction,
  "amount" | "categoryId" | "occurredOn"
>;

/**
 * Pair every category with the total amount recorded against it for one
 * calendar month, in cents. `month` is 1-12; transactions outside the month
 * are ignored. Categories keep the order they are given and a category with no
 * transactions that month totals to zero, so the grid always lists them all.
 */
export function buildCategorySummaries(
  transactions: readonly AmountCategoryAndDate[],
  categories: readonly Category[],
  period: YearMonth,
): CategorySummaryRow[] {
  const key = monthKey(period.year, period.month);
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (!transaction.occurredOn.startsWith(key)) continue;
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color,
    kind: category.kind,
    total: totals.get(category.id) ?? 0,
  }));
}
