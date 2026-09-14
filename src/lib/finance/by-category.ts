import type { Transaction, TransactionType } from "@/types/transaction";

/** A category's summed amount (integer cents) across a set of transactions. */
export interface CategoryTotal {
  categoryId: string;
  total: number;
}

/** The fields a transaction needs for category grouping. */
type AmountTypeAndCategory = Pick<
  Transaction,
  "amount" | "type" | "categoryId"
>;

/**
 * Group transactions by category and sum their amounts as integer cents,
 * sorted by total, descending (biggest category first). When `type` is given,
 * only transactions of that type are included; otherwise all are summed.
 * Categories with no matching transactions are omitted; an empty list
 * yields an empty array.
 */
export function sumByCategory(
  transactions: readonly AmountTypeAndCategory[],
  type?: TransactionType,
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (type !== undefined && transaction.type !== type) continue;
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}